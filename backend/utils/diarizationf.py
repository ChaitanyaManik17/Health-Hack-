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

def fetch_from_s3_and_link():
    s3 = boto3.client('s3')
    bucket = 'output-bucket-shield'
    key = 'test-run-1.json'
    response = s3.get_object(Bucket=bucket, Key=key)
    content = response['Body'].read().decode('utf-8')
    data = json.loads(content)['results']['audio_segments']
    ftrans = ""
    for segments in data:
        ftrans += segments['transcript']
        ftrans += "."
    return ftrans


def evaluate_communication(transcript: str):
    """Evaluate Communication/Empathy & Clarity Scale with 7 detailed domains (70% pass)"""
    
    try:
        model = genai.GenerativeModel('gemini-2.0-flash-exp')
        
        prompt = """

You are an expert in natural language processing and speaker diarization. I will provide you with a transcript of a conversation between a Student-doctor and a Patient, where each line represents a speech segment from the transcription engine (such as Amazon SageMaker Transcribe).

The speaker need not change with every line. In some cases, multiple consecutive lines belong to the same speaker and should be grouped together into a single conversational turn. In some other cases a single line contains multiple speakers and should be grouped differently

Your job is to parse the transcription line by line, identify the logical speaker turns, and return the output in the following strict JSON format:\n\njson\n[\n {\"Student-doctor\": \"[All consecutive lines from Student, joined as one paragraph]\"},\n {\"Patient\": \"[All consecutive lines from Patient]\"},\n {\"Student-doctor\": \"[...]\"},\n {\"Patient\": \"[...]\"}\n]\n\n\n> Only the two speakers exist: Student and Patient. Do not include any extra metadata. Preserve the order of conversation.

Speaker information is missing in the lines, infer the speaker logically based on context and dialogue content. Maintain original content (don’t summarize or change tone).

Your output must be:\n> - A valid JSON array\n> - Speaker changes only when the speaker actually changes\n> - Each object contains only one key (Student-doctor or Patient) and its associated dialogue\n> - No blank lines or placeholder entries


This is the transcript:

Transcript:""" + transcript + """

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
        return {"Failed to diarize"}


tr = fetch_from_s3_and_link()
print(evaluate_communication(tr))