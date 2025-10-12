#!/usr/bin/env python3
"""
OSCE Backend API Testing Suite
Tests all critical endpoints for the OSCE evaluation system
"""

import requests
import json
import time
import os
import tempfile
from pathlib import Path
import uuid

# Configuration
BASE_URL = "https://medeval-ai.preview.emergentagent.com/api"
TIMEOUT = 30

class OSCEAPITester:
    def __init__(self):
        self.session = requests.Session()
        self.student_token = None
        self.professor_token = None
        self.student_id = None
        self.professor_email = None
        self.submission_id = None
        self.evaluation_id = None
        self.test_results = []
        
    def log_result(self, test_name, success, message, details=None):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {message}")
        if details:
            print(f"   Details: {details}")
        
        self.test_results.append({
            'test': test_name,
            'success': success,
            'message': message,
            'details': details
        })
    
    def test_auth_register(self):
        """Test user registration for both student and professor"""
        print("\n=== Testing Authentication - Registration ===")
        
        # Register student
        student_data = {
            "email": f"student_{uuid.uuid4().hex[:8]}@test.edu",
            "password": "SecurePass123!",
            "full_name": "Sarah Johnson",
            "role": "student"
        }
        
        try:
            response = self.session.post(f"{BASE_URL}/auth/register", json=student_data, timeout=TIMEOUT)
            if response.status_code == 200:
                data = response.json()
                self.student_token = data['token']
                self.student_id = data['user']['id']
                self.log_result("Student Registration", True, f"Student registered successfully: {data['user']['email']}")
            else:
                self.log_result("Student Registration", False, f"Status: {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_result("Student Registration", False, f"Request failed: {str(e)}")
            return False
        
        # Register professor
        professor_data = {
            "email": f"prof_{uuid.uuid4().hex[:8]}@test.edu",
            "password": "SecurePass123!",
            "full_name": "Dr. Michael Chen",
            "role": "professor"
        }
        
        try:
            response = self.session.post(f"{BASE_URL}/auth/register", json=professor_data, timeout=TIMEOUT)
            if response.status_code == 200:
                data = response.json()
                self.professor_token = data['token']
                self.professor_email = data['user']['email']
                self.log_result("Professor Registration", True, f"Professor registered successfully: {data['user']['email']}")
                return True
            else:
                self.log_result("Professor Registration", False, f"Status: {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_result("Professor Registration", False, f"Request failed: {str(e)}")
            return False
    
    def test_auth_login(self):
        """Test user login"""
        print("\n=== Testing Authentication - Login ===")
        
        # We'll use the tokens from registration, but test login endpoint
        login_data = {
            "email": self.professor_email,
            "password": "SecurePass123!"
        }
        
        try:
            response = self.session.post(f"{BASE_URL}/auth/login", json=login_data, timeout=TIMEOUT)
            if response.status_code == 200:
                data = response.json()
                self.log_result("Professor Login", True, f"Login successful for: {data['user']['email']}")
                return True
            else:
                self.log_result("Professor Login", False, f"Status: {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_result("Professor Login", False, f"Request failed: {str(e)}")
            return False
    
    def test_submission_create(self):
        """Test creating a submission with transcript"""
        print("\n=== Testing Student Submission Creation ===")
        
        submission_data = {
            "student_id": self.student_id,
            "professor_email": self.professor_email,
            "transcript_text": """
Doctor: Good morning, I'm Dr. Smith. I understand you're experiencing some chest pain. Can you tell me when this started?

Patient: It started about 2 hours ago while I was walking up the stairs at work. It felt like a heavy pressure in my chest.

Doctor: I see. Can you describe the pain more? Is it sharp, dull, burning?

Patient: It's more like a squeezing sensation, like someone is sitting on my chest. It also goes into my left arm a bit.

Doctor: That's important information. Have you ever had this type of pain before?

Patient: No, never like this. I've had some heartburn before, but this is different.

Doctor: Any shortness of breath with the pain?

Patient: Yes, I felt a bit winded, more than usual for just walking up stairs.

Doctor: Do you have any medical conditions or take any medications?

Patient: I have high blood pressure and take lisinopril. My father had a heart attack when he was 55.

Doctor: I'm going to examine you now. Let me check your vital signs first.
[Examines patient, checks blood pressure, listens to heart and lungs]

Doctor: Your blood pressure is elevated at 160/95, and I can hear your heart clearly. Based on your symptoms - chest pressure radiating to your arm, shortness of breath, family history, and the nature of the pain - I'm concerned this could be related to your heart.

Patient: Are you saying I'm having a heart attack?

Doctor: It's possible you're having cardiac symptoms. We need to do some tests right away including an EKG and blood work to check for heart damage. I'm going to have the nurse get you some aspirin and we'll monitor you closely.

Patient: I'm scared. What happens next?

Doctor: I understand you're worried, and that's completely normal. We're going to take very good care of you. The most important thing right now is to get these tests done quickly so we can determine exactly what's happening and get you the right treatment.
            """
        }
        
        try:
            response = self.session.post(f"{BASE_URL}/submissions/create", json=submission_data, timeout=TIMEOUT)
            if response.status_code == 200:
                data = response.json()
                self.submission_id = data['submission_id']
                self.log_result("Submission Creation", True, f"Submission created: {self.submission_id}")
                return True
            else:
                self.log_result("Submission Creation", False, f"Status: {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_result("Submission Creation", False, f"Request failed: {str(e)}")
            return False
    
    def test_audio_upload(self):
        """Test audio file upload"""
        print("\n=== Testing Audio Upload ===")
        
        # Create a small mock audio file
        with tempfile.NamedTemporaryFile(suffix='.mp3', delete=False) as temp_file:
            # Write some dummy audio data (not real audio, just for testing upload)
            temp_file.write(b'Mock audio data for testing purposes' * 100)
            temp_file_path = temp_file.name
        
        try:
            with open(temp_file_path, 'rb') as audio_file:
                files = {'file': ('test_audio.mp3', audio_file, 'audio/mpeg')}
                data = {
                    'student_id': self.student_id,
                    'professor_email': self.professor_email
                }
                
                response = self.session.post(f"{BASE_URL}/submissions/upload-audio", 
                                           files=files, data=data, timeout=TIMEOUT)
                
                if response.status_code == 200:
                    result = response.json()
                    # Store this submission ID for audio testing
                    self.audio_submission_id = result['submission_id']
                    self.log_result("Audio Upload", True, f"Audio uploaded: {result['submission_id']}")
                    return True
                else:
                    self.log_result("Audio Upload", False, f"Status: {response.status_code}", response.text)
                    return False
        except Exception as e:
            self.log_result("Audio Upload", False, f"Request failed: {str(e)}")
            return False
        finally:
            # Clean up temp file
            try:
                os.unlink(temp_file_path)
            except:
                pass
    
    def test_professor_submissions(self):
        """Test professor viewing submissions"""
        print("\n=== Testing Professor Submission Retrieval ===")
        
        try:
            response = self.session.get(f"{BASE_URL}/submissions/professor/{self.professor_email}", timeout=TIMEOUT)
            if response.status_code == 200:
                submissions = response.json()
                self.log_result("Professor Submissions", True, f"Retrieved {len(submissions)} submissions")
                return True
            else:
                self.log_result("Professor Submissions", False, f"Status: {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_result("Professor Submissions", False, f"Request failed: {str(e)}")
            return False
    
    def test_trigger_evaluation(self):
        """Test triggering AI evaluation"""
        print("\n=== Testing AI Evaluation Trigger ===")
        
        try:
            response = self.session.post(f"{BASE_URL}/submissions/{self.submission_id}/evaluate", timeout=TIMEOUT)
            if response.status_code == 200:
                data = response.json()
                self.log_result("Evaluation Trigger", True, f"Evaluation started for: {self.submission_id}")
                
                # Wait for evaluation to complete
                print("   Waiting for evaluation to complete...")
                max_wait = 60  # 60 seconds max
                wait_time = 0
                
                while wait_time < max_wait:
                    time.sleep(5)
                    wait_time += 5
                    
                    # Check submission status
                    status_response = self.session.get(f"{BASE_URL}/submission-status/{self.submission_id}", timeout=TIMEOUT)
                    if status_response.status_code == 200:
                        status_data = status_response.json()
                        current_status = status_data.get('status')
                        progress = status_data.get('evaluation_progress', 0)
                        
                        print(f"   Status: {current_status}, Progress: {progress}%")
                        
                        if current_status == 'evaluated':
                            self.log_result("Evaluation Completion", True, f"Evaluation completed in {wait_time}s")
                            return True
                        elif current_status == 'error':
                            self.log_result("Evaluation Completion", False, "Evaluation failed with error status")
                            return False
                
                self.log_result("Evaluation Completion", False, f"Evaluation did not complete within {max_wait}s")
                return False
                
            else:
                self.log_result("Evaluation Trigger", False, f"Status: {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_result("Evaluation Trigger", False, f"Request failed: {str(e)}")
            return False
    
    def test_get_evaluation(self):
        """Test retrieving evaluation results"""
        print("\n=== Testing Evaluation Retrieval ===")
        
        try:
            response = self.session.get(f"{BASE_URL}/evaluation/{self.submission_id}", timeout=TIMEOUT)
            if response.status_code == 200:
                evaluation = response.json()
                self.evaluation_id = evaluation['id']
                
                # Verify 7-domain communication evaluation
                detailed_feedback = evaluation.get('detailed_feedback', {})
                communication = detailed_feedback.get('communication', {})
                
                expected_domains = ['sets_stage', 'active_listening', 'shows_compassion', 
                                  'encourages_sharing', 'adjusts_communication', 
                                  'gives_ownership', 'collaborative_plan']
                
                missing_domains = [domain for domain in expected_domains if domain not in communication]
                
                if missing_domains:
                    self.log_result("7-Domain Communication", False, f"Missing domains: {missing_domains}")
                else:
                    self.log_result("7-Domain Communication", True, "All 7 communication domains present")
                
                self.log_result("Evaluation Retrieval", True, f"Retrieved evaluation: {self.evaluation_id}")
                return True
            else:
                self.log_result("Evaluation Retrieval", False, f"Status: {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_result("Evaluation Retrieval", False, f"Request failed: {str(e)}")
            return False
    
    def test_evaluation_update(self):
        """Test updating evaluation scores"""
        print("\n=== Testing Evaluation Update ===")
        
        update_data = {
            "critical_action_score": 85.0,
            "communication_score": 90.0,
            "clinical_reasoning_score": 8.0,
            "professor_notes": "Excellent communication skills demonstrated. Good clinical reasoning with minor areas for improvement."
        }
        
        try:
            response = self.session.put(f"{BASE_URL}/evaluation/{self.evaluation_id}", 
                                      json=update_data, timeout=TIMEOUT)
            if response.status_code == 200:
                self.log_result("Evaluation Update", True, "Evaluation updated successfully")
                return True
            else:
                self.log_result("Evaluation Update", False, f"Status: {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_result("Evaluation Update", False, f"Request failed: {str(e)}")
            return False
    
    def test_evaluation_publish(self):
        """Test publishing evaluation"""
        print("\n=== Testing Evaluation Publishing ===")
        
        try:
            response = self.session.post(f"{BASE_URL}/evaluation/{self.evaluation_id}/publish", timeout=TIMEOUT)
            if response.status_code == 200:
                self.log_result("Evaluation Publishing", True, "Evaluation published successfully")
                return True
            else:
                self.log_result("Evaluation Publishing", False, f"Status: {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_result("Evaluation Publishing", False, f"Request failed: {str(e)}")
            return False
    
    def test_student_submissions(self):
        """Test student viewing their submissions"""
        print("\n=== Testing Student Submission Retrieval ===")
        
        try:
            response = self.session.get(f"{BASE_URL}/submissions/student/{self.student_id}", timeout=TIMEOUT)
            if response.status_code == 200:
                submissions = response.json()
                published_submissions = [s for s in submissions if s.get('status') == 'published']
                self.log_result("Student Submissions", True, f"Retrieved {len(submissions)} submissions, {len(published_submissions)} published")
                return True
            else:
                self.log_result("Student Submissions", False, f"Status: {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_result("Student Submissions", False, f"Request failed: {str(e)}")
            return False
    
    def test_file_downloads(self):
        """Test file download endpoints"""
        print("\n=== Testing File Downloads ===")
        
        # Test audio download (if we have audio submission)
        if hasattr(self, 'audio_submission_id'):
            try:
                response = self.session.get(f"{BASE_URL}/submissions/{self.audio_submission_id}/audio", timeout=TIMEOUT)
                if response.status_code == 200:
                    self.log_result("Audio Download", True, f"Audio file downloaded ({len(response.content)} bytes)")
                else:
                    self.log_result("Audio Download", False, f"Status: {response.status_code}", response.text)
            except Exception as e:
                self.log_result("Audio Download", False, f"Request failed: {str(e)}")
        
        # Test original transcript download
        try:
            response = self.session.get(f"{BASE_URL}/submissions/{self.submission_id}/transcript?type=original", timeout=TIMEOUT)
            if response.status_code == 200:
                self.log_result("Original Transcript Download", True, f"Transcript downloaded ({len(response.content)} bytes)")
            else:
                self.log_result("Original Transcript Download", False, f"Status: {response.status_code}", response.text)
        except Exception as e:
            self.log_result("Original Transcript Download", False, f"Request failed: {str(e)}")
        
        # Test AI transcript download (if available)
        try:
            response = self.session.get(f"{BASE_URL}/submissions/{self.submission_id}/transcript?type=ai", timeout=TIMEOUT)
            if response.status_code == 200:
                self.log_result("AI Transcript Download", True, f"AI transcript downloaded ({len(response.content)} bytes)")
            elif response.status_code == 404:
                self.log_result("AI Transcript Download", True, "No AI transcript available (expected for text submissions)")
            else:
                self.log_result("AI Transcript Download", False, f"Status: {response.status_code}", response.text)
        except Exception as e:
            self.log_result("AI Transcript Download", False, f"Request failed: {str(e)}")
        
        # Test report download
        try:
            response = self.session.get(f"{BASE_URL}/evaluation/{self.evaluation_id}/download", timeout=TIMEOUT)
            if response.status_code == 200:
                self.log_result("Report Download", True, f"Report downloaded ({len(response.content)} bytes)")
            else:
                self.log_result("Report Download", False, f"Status: {response.status_code}", response.text)
        except Exception as e:
            self.log_result("Report Download", False, f"Request failed: {str(e)}")
    
    def test_analytics(self):
        """Test analytics endpoint"""
        print("\n=== Testing Analytics ===")
        
        test_queries = [
            "What is the average communication score?",
            "How many students passed?",
            "Show students who need improvement",
            "What are the common weaknesses in clinical reasoning?"
        ]
        
        for query in test_queries:
            try:
                query_data = {"query": query}
                response = self.session.post(f"{BASE_URL}/analytics/query", json=query_data, timeout=TIMEOUT)
                
                if response.status_code == 200:
                    data = response.json()
                    required_fields = ['analysis', 'statistics', 'data', 'recommendations']
                    missing_fields = [field for field in required_fields if field not in data]
                    
                    if missing_fields:
                        self.log_result(f"Analytics Query: '{query[:30]}...'", False, f"Missing fields: {missing_fields}")
                    else:
                        self.log_result(f"Analytics Query: '{query[:30]}...'", True, "Query processed successfully")
                else:
                    self.log_result(f"Analytics Query: '{query[:30]}...'", False, f"Status: {response.status_code}", response.text)
            except Exception as e:
                self.log_result(f"Analytics Query: '{query[:30]}...'", False, f"Request failed: {str(e)}")
    
    def run_all_tests(self):
        """Run complete test suite"""
        print("🚀 Starting OSCE Backend API Test Suite")
        print(f"Testing against: {BASE_URL}")
        print("=" * 60)
        
        # Run tests in sequence
        if not self.test_auth_register():
            print("❌ Authentication failed - stopping tests")
            return
        
        self.test_auth_login()
        
        if not self.test_submission_create():
            print("❌ Submission creation failed - stopping workflow tests")
            return
        
        self.test_audio_upload()
        self.test_professor_submissions()
        
        if not self.test_trigger_evaluation():
            print("❌ Evaluation failed - stopping evaluation tests")
            return
        
        if not self.test_get_evaluation():
            print("❌ Could not retrieve evaluation - stopping evaluation tests")
            return
        
        self.test_evaluation_update()
        self.test_evaluation_publish()
        self.test_student_submissions()
        self.test_file_downloads()
        self.test_analytics()
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for result in self.test_results if result['success'])
        total = len(self.test_results)
        
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        print(f"Success Rate: {(passed/total)*100:.1f}%")
        
        print("\n📋 DETAILED RESULTS:")
        for result in self.test_results:
            status = "✅" if result['success'] else "❌"
            print(f"{status} {result['test']}: {result['message']}")
        
        # Failed tests
        failed_tests = [result for result in self.test_results if not result['success']]
        if failed_tests:
            print(f"\n🔍 FAILED TESTS ({len(failed_tests)}):")
            for result in failed_tests:
                print(f"❌ {result['test']}: {result['message']}")
                if result['details']:
                    print(f"   Details: {result['details']}")

if __name__ == "__main__":
    tester = OSCEAPITester()
    tester.run_all_tests()