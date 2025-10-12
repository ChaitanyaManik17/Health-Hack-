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
        ftrans += ". "
    return ftrans


def evaluate_communication(transcript: str):
    """Evaluate Communication/Empathy & Clarity Scale with 7 detailed domains (70% pass)"""
    
    try:
        model = genai.GenerativeModel('gemini-2.0-flash-exp')
        
        prompt = """

You are an expert medical educator evaluating communication and empathy skills in OSCE performance using the Empathy & Clarity Rating Scale.

Evaluate based on these 7 detailed domains (5-point scale each: 5=Excellent/Desired, 1=Unsatisfactory):

**1. Sets the Stage (Fostering Relationship):**
   DESIRED (5): Introduces/explains role; friendly and warm; explains what will happen; recognizes patient's concerns; treats with respect; shows genuine interest
   UNSATISFACTORY (1): Cold and abrupt; proceeds without explanations

**2. Active Listening:**
   DESIRED (5): Pays close attention; responds appropriately; conveys understanding in own words; acknowledges concerns and anxieties
   UNSATISFACTORY (1): Looks at notes/computer; talks at patient; doesn't reflect what patient said; closed body posture; dismissive

**3. Shows Care and Compassion:**
   DESIRED (5): Aligns conversation to offer support; reflects language and feelings
   UNSATISFACTORY (1): Indifference/detachment; doesn't treat patient as individual

**4. Encourages Open Sharing:**
   DESIRED (5): Genuinely interested; interacts with humility without judgment; encourages patient's own words; facilitates conversation
   UNSATISFACTORY (1): Interrupts; rushes; dismisses patient's story; fails to engage

**5. Adjusts Communication:**
   DESIRED (5): Matches preferences and education level; mirrors patient; aligns to context; ensures understanding
   UNSATISFACTORY (1): Scripted responses; fails to explore understanding

**6. Gives Ownership of Health:**
   DESIRED (5): Explores what patient can do; inspires active communication
   UNSATISFACTORY (1): Talks "at" patient; discourages two-way communication

**7. Makes Collaborative Plan:**
   DESIRED (5): Adjusts care plan based on patient perspectives; shares decision making
   UNSATISFACTORY (1): Ignores views, concerns, and social constraints

Evaluate this OSCE transcript:

Transcript:""" + transcript + """
Provide ONLY valid JSON (no markdown, no extra text):
{{
  "sets_stage": <1-5>,
  "active_listening": <1-5>,
  "shows_compassion": <1-5>,
  "encourages_sharing": <1-5>,
  "adjusts_communication": <1-5>,
  "gives_ownership": <1-5>,
  "collaborative_plan": <1-5>,
  "total_score": <sum of all 7>,
  "strengths": ["specific strength 1", "specific strength 2"],
  "areas_for_improvement": ["specific improvement 1", "specific improvement 2"],
  "feedback": "Detailed constructive feedback paragraph for communication and empathy"
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
        return {"Failed to grade empathy"}


tr = fetch_from_s3_and_link()
print(evaluate_communication(tr))