# healthscribe_async.py
# Async AWS HealthScribe (via Amazon Transcribe) pipeline: start job → wait → fetch transcript & summary
# Requires: pip install -U aioboto3 aiobotocore boto3 botocore

import asyncio
import json
import logging
from typing import Dict, Any, Tuple
from urllib.parse import urlparse
import time
import aioboto3
from botocore.exceptions import BotoCoreError, ClientError

# -----------------------------
# Config
# -----------------------------
AWS_REGION = "us-east-1"          # change to your region (e.g., us-east-1)
POLL_INTERVAL_SEC = 10            # seconds between polls
POLL_TIMEOUT_SEC = 5 * 60        # 30 minutes

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
logger = logging.getLogger("healthscribe-async")

# -----------------------------
# Helpers
# -----------------------------

def parse_s3_uri(s3_uri: str) -> Tuple[str, str]:
    """
    Convert s3://bucket/key or https://s3.<region>.amazonaws.com/bucket/key
    (or virtual-hosted style) to (bucket, key).
    """
    if s3_uri.startswith("s3://"):
        parsed = urlparse(s3_uri)
        return parsed.netloc, parsed.path.lstrip("/")

    parsed = urlparse(s3_uri)
    path = parsed.path.lstrip("/")
    if "/" in path:
        bucket, key = path.split("/", 1)
        return bucket, key

    # Try virtual-hosted-style: bucket.s3.<region>.amazonaws.com/key
    host_parts = parsed.netloc.split(".")
    if host_parts and host_parts[0] != "s3":
        bucket = host_parts[0]
        key = path
        return bucket, key

    raise ValueError(f"Could not parse S3 URI: {s3_uri}")


async def load_s3_json(session: aioboto3.Session, s3_uri: str) -> Dict[str, Any]:
    """
    Download a JSON file from S3 (using a URI) and return as dict.
    """
    bucket, key = parse_s3_uri(s3_uri)
    async with session.client("s3", region_name=AWS_REGION) as s3:
        obj = await s3.get_object(Bucket=bucket, Key=key)
        body = await obj["Body"].read()
        return json.loads(body)

# -----------------------------
# HealthScribe via Transcribe
# -----------------------------
async def start_medical_scribe_job(
    session: aioboto3.Session,
    *,
    job_name: str,
    media_s3_uri: str,
    output_bucket: str,
    data_access_role_arn: str,
    language_code: str = "en-US",
    show_speaker_labels: bool = True,
    max_speaker_labels: int = 2,
    channel_identification: bool = False,
) -> Dict[str, Any]:
    """
    Start a HealthScribe Medical Insights job asynchronously using the Transcribe client.
    """
    payload = {
        "MedicalScribeJobName": job_name,
        "Media": {"MediaFileUri": media_s3_uri},
        "Settings": {
            "ShowSpeakerLabels": show_speaker_labels,
            "MaxSpeakerLabels": max_speaker_labels,
            "ChannelIdentification": channel_identification,
        },
        "DataAccessRoleArn": data_access_role_arn,
        "OutputBucketName": output_bucket,
    }

    logger.info("Starting MedicalScribe job: %s", job_name)
    async with session.client("transcribe", region_name=AWS_REGION) as client:
        try:
            # Operation is StartMedicalScribeJob on the Transcribe service
            resp = await client.start_medical_scribe_job(**payload)
            return resp
        except (BotoCoreError, ClientError) as e:
            logger.error("Failed to start job %s: %s", job_name, e)
            raise


async def get_medical_scribe_job(
    session: aioboto3.Session,
    job_name: str,
) -> Dict[str, Any]:
    """
    Fetch job details asynchronously using the Transcribe client.
    """
    async with session.client("transcribe", region_name=AWS_REGION) as client:
        try:
            resp = await client.get_medical_scribe_job(MedicalScribeJobName=job_name)
            return resp
        except (BotoCoreError, ClientError) as e:
            logger.error("Failed to get job status for %s: %s", job_name, e)
            raise


async def wait_for_job_completion(
    session: aioboto3.Session,
    job_name: str,
    poll_interval_sec: int = POLL_INTERVAL_SEC,
    timeout_sec: int = POLL_TIMEOUT_SEC,
) -> Dict[str, Any]:
    """
    Asynchronously poll until the job is COMPLETED or FAILED (or timeout).
    Returns the final job response.
    """
    loop = asyncio.get_event_loop()
    start_time = loop.time()

    while True:
        resp = await get_medical_scribe_job(session, job_name)
        job = resp.get("MedicalScribeJob", {})
        status = job.get("MedicalScribeJobStatus") or job.get("JobStatus")

        logger.info("Job %s status: %s", job_name, status)

        if status in ("COMPLETED", "FAILED"):
            return resp

        if loop.time() - start_time > timeout_sec:
            raise TimeoutError(f"Timed out waiting for job {job_name} to complete.")

        await asyncio.sleep(poll_interval_sec)

# -----------------------------
# Orchestrator
# -----------------------------
async def run_healthscribe_pipeline_async(
    *,
    job_name: str,
    media_s3_uri: str,
    output_bucket: str,
    data_access_role_arn: str,
) -> Dict[str, Any]:
    """
    Full async pipeline:
      1) Start job
      2) Wait for completion
      3) Fetch transcript.json & summary.json from S3
      4) Return parsed results
    """
    # Session itself is NOT an async context manager
    session = aioboto3.Session()

    # 1) Start job
    await start_medical_scribe_job(
        session,
        job_name=job_name,
        media_s3_uri=media_s3_uri,
        output_bucket=output_bucket,
        data_access_role_arn=data_access_role_arn,
    )

    # 2) Wait for completion
    final_resp = await wait_for_job_completion(session, job_name)
    job = final_resp.get("MedicalScribeJob", {})
    status = job.get("MedicalScribeJobStatus") or job.get("JobStatus")

    if status != "COMPLETED":
        raise RuntimeError(f"MedicalScribe job failed: {job.get('FailureReason', 'Unknown')}")

    # 3) Download output JSONs from S3
    output = job.get("MedicalScribeOutput") or {}
    transcript_uri = output.get("TranscriptFileUri")
    clinical_doc_uri = output.get("ClinicalDocumentUri")

    if not transcript_uri or not clinical_doc_uri:
        raise RuntimeError("Missing TranscriptFileUri or ClinicalDocumentUri in job output.")

    transcript = await load_s3_json(session, transcript_uri)
    clinical_summary = await load_s3_json(session, clinical_doc_uri)

    # 4) Return everything useful
    return {
        "job_meta": job,
        "transcript_uri": transcript_uri,
        "clinical_document_uri": clinical_doc_uri,
        "transcript_json": transcript,
        "clinical_summary_json": clinical_summary,
    }

# -----------------------------
# Entry point (example usage)
# -----------------------------
async def main_healthscribe(media_uri):
    # Replace these with your actual values
    JOB_NAME = str(int(time.time()))
    # MEDIA_S3_URI = "s3://audio-upload-shield/RUHH_OSCE_CASE5_Old_0001_redacted_anon.mp3"
    MEDIA_S3_URI = media_uri
    OUTPUT_BUCKET = "output-bucket-shield"
    DATA_ACCESS_ROLE_ARN = "arn:aws:iam::851725517815:role/s3_full_access"

    try:
        results = await run_healthscribe_pipeline_async(
            job_name=JOB_NAME,
            media_s3_uri=MEDIA_S3_URI,
            output_bucket=OUTPUT_BUCKET,
            data_access_role_arn=DATA_ACCESS_ROLE_ARN,
        )

        print("\n✅ Job Completed Successfully!")
        print("Transcript S3 URI:", results["transcript_uri"])
        print("Clinical Summary S3 URI:", results["clinical_document_uri"])
        print("\nTranscript JSON keys:", list(results["transcript_json"].keys())[:10])
        print("Clinical Summary JSON keys:", list(results["clinical_summary_json"].keys())[:10])

        return JOB_NAME

    except Exception as e:
        logger.exception("Pipeline failed: %s", e)
        return 0
    

# if __name__ == "__main__":
#     asyncio.run(main())

