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


def evaluate_idea(summary: str):
    """Evaluate Communication/Empathy & Clarity Scale with 7 detailed domains (70% pass)"""
    try:
        model = genai.GenerativeModel('gemini-2.5-flash')
        
        prompt = """You are an expert medical educator evaluating clinical reasoning based on the IDEA Rubric.

The IDEA Rubric assesses:

1. **I - Interpretive Summary (0-4 points):**
   - Key risk factors, chief complaint, illness time course
   - Use of semantic qualifiers and unified medical concepts

2. **D - Differential Diagnosis (0-2 points):**
   - Multiple diagnostic possibilities offered and prioritized
   - 0 = No differential, 1 = Implicit, 2 = Explicit and prioritized

3. **E - Explanation of Lead Diagnosis (0-2 points):**
   - Reasoning with epidemiology and key features
   - 0 = No explanation, 1 = 1 data point, 2 = ≥2 data points

4. **A - Alternative Diagnosis Explained (0-2 points):**
   - Reasoning for alternative diagnoses
   - 0 = No explanation, 1 = 1 data point, 2 = ≥2 data points

Total score: 0-10 points (≥6 to pass)

Evaluate the clinical reasoning demonstrated in this OSCE summary of conversation between medical student and patient.

Summary:"""+summary+"""
Provide your response in JSON format only (no additional text):
{{
  "interpretive_summary_score": <0-4>,
  "differential_diagnosis_score": <0-2>,
  "lead_diagnosis_explanation_score": <0-2>,
  "alternative_diagnosis_score": <0-2>,
  "total_score": <sum, 0-10>,
  "summary_statement": "The summary statement provided by student",
  "differential_diagnoses": ["List of diagnoses mentioned"],
  "strengths": ["Clinical reasoning strengths"],
  "areas_for_improvement": ["Specific suggestions for improvement"],
  "feedback": "Detailed constructive feedback on clinical reasoning"
}}"""
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
        return {"Failed to grade IDEA"}


tr = fetch_summary_from_s3()
print(evaluate_idea(tr))