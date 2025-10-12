import google.generativeai as genai
from dotenv import load_dotenv
from pathlib import Path
import os
import json
import boto3

ROOT_DIR = Path(__file__).parent.parent

load_dotenv(ROOT_DIR / 'backend'/ '.env')

GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY')

genai.configure(api_key=GEMINI_API_KEY)

def fetch_summary_from_s3():
    s3 = boto3.client('s3')
    bucket = 'output-bucket-shield'
    key = 'test-run-1/summary.json'
    response = s3.get_object(Bucket=bucket, Key=key)
    content = response['Body'].read().decode('utf-8')
    data = json.loads(content)['ClinicalDocumentation']['Sections']
    fsum = ""
    for section in data:
        fsum += section['SectionName']
        fsum += "\n"
        for summary in section['Summary']:
            fsum += summary['SummarizedSegment'] + "\n"
        fsum += "\n\n"
    return fsum


def evaluate_checklist(summary: str):
    """Evaluate Communication/Empathy & Clarity Scale with 7 detailed domains (70% pass)"""
    
    try:
        model = genai.GenerativeModel('gemini-2.0-flash-exp')
        
        prompt = """

You are a medical education expert and OSCE examiner. I will provide you with the summary of a clinical encounter between a medical student and a patient, written as part of a clinical reasoning assessment.

You are to evaluate the student's performance using the Critical Action Checklist, even though the actual checklist items are not available. Instead, assess based on the following themes covered by the checklist:

Was there a hypothesis-driven approach to eliciting the history?

Was the history taking comprehensive enough to generate a broad differential diagnosis?

Was the history taking comprehensive enough to prioritize a differential diagnosis?

Did the student use a mix of open-ended and closed-ended questions with appropriate follow-ups?

Were key focused physical exam maneuvers performed (unless the case clearly did not require one)?

Based on your evaluation of the summary, provide your response in JSON format only with the following structure:

{
  "score": <score out of 20>,
  "items_completed": ["list of items the student did well"],
  "items_missed": ["list of items that were missed, incomplete, or done poorly"]
}


Assume that unless explicitly stated, a physical exam was expected. If the summary does not mention one, mark that as a miss. Be fair. Do not talk about the structure of the summary. Consider the clarity, depth, and clinical reasoning demonstrated in the summary. Do not include any commentary outside of the JSON structure.
This is the summary:

Structured Summary:""" + summary + """

Provide ONLY valid JSON (no markdown, no extra text):
"""
        # print(prompt)
        response = model.generate_content(prompt)
        response_text = response.text.strip()
        
        # Clean up response
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0].strip()
        elif "```" in response_text:
            response_text = response_text.split("```")[1].split("```")[0].strip()
        
        # Remove any leading/trailing whitespace or newlines
        response_text = response_text.strip()
        
        result = json.loads(response_text)
        return result
    except Exception as e:
        print(e)
        return {"Failed to grade checklist"}


tr = fetch_summary_from_s3()
print(evaluate_checklist(tr))