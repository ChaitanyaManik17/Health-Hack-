import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '../App';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { useToast } from '../hooks/use-toast';
import { 
  Activity, 
  LogOut, 
  Upload, 
  CheckCircle2, 
  XCircle, 
  FileText,
  TrendingUp,
  MessageSquare,
  Stethoscope,
  Brain
} from 'lucide-react';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  const [submissions, setSubmissions] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transcriptText, setTranscriptText] = useState('');
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [audioFile, setAudioFile] = useState(null);
  const [uploadMethod, setUploadMethod] = useState('transcript'); // 'transcript' or 'audio'
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState(''); // 'uploading', 'transcribing', 'processing', 'complete'
  
  useEffect(() => {
    fetchSubmissions();
  }, []);
  
  const fetchSubmissions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/submissions/student/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSubmissions(response.data);
    } catch (error) {
      toast({
        title: "Error fetching submissions",
        description: error.response?.data?.detail || "Could not load your submissions",
        variant: "destructive"
      });
    }
  };
  
  const handleSubmit = async () => {
    if (uploadMethod === 'transcript' && !transcriptText.trim()) {
      toast({
        title: "Transcript required",
        description: "Please enter or paste your OSCE transcript",
        variant: "destructive"
      });
      return;
    }
    
    if (uploadMethod === 'audio' && !audioFile) {
      toast({
        title: "Audio file required",
        description: "Please select an audio file to upload",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      
      if (uploadMethod === 'transcript') {
        // Text submission
        await axios.post(`${API}/submissions/create`, {
          student_id: user.id,
          transcript_text: transcriptText
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        // Audio submission
        const formData = new FormData();
        formData.append('file', audioFile);
        formData.append('student_id', user.id);
        
        await axios.post(`${API}/submissions/upload-audio`, formData, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
      }
      
      toast({
        title: "Submission successful!",
        description: "Your OSCE is being evaluated by AI. Check back in 1-2 minutes for results."
      });
      
      setTranscriptText('');
      setAudioFile(null);
      setShowUploadForm(false);
      
      // Refresh submissions immediately and after delay
      fetchSubmissions();
      setTimeout(() => {
        fetchSubmissions();
      }, 3000);
      
      // Poll for updates every 10 seconds for 2 minutes
      let pollCount = 0;
      const pollInterval = setInterval(() => {
        pollCount++;
        fetchSubmissions();
        if (pollCount >= 12) { // 12 * 10s = 2 minutes
          clearInterval(pollInterval);
        }
      }, 10000);
      
    } catch (error) {
      console.error("Submission error:", error);
      toast({
        title: "Submission failed",
        description: error.response?.data?.detail || "Could not submit your OSCE. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };
  
  const getStatusBadge = (status) => {
    const variants = {
      processing: { color: 'bg-yellow-100 text-yellow-800', text: 'Processing' },
      evaluated: { color: 'bg-blue-100 text-blue-800', text: 'Evaluated' },
      published: { color: 'bg-green-100 text-green-800', text: 'Published' },
      error: { color: 'bg-red-100 text-red-800', text: 'Error' }
    };
    const variant = variants[status] || variants.processing;
    return <Badge className={variant.color}>{variant.text}</Badge>;
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">MedEd OSCE</h1>
                <p className="text-sm text-slate-600">Student Dashboard</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-900" data-testid="student-name">{user.full_name}</p>
                <p className="text-xs text-slate-600">{user.email}</p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleLogout}
                data-testid="logout-button"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Upload Section */}
        <Card className="mb-8 border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Upload className="w-5 h-5 mr-2 text-blue-600" />
              Submit New OSCE
            </CardTitle>
            <CardDescription>
              Upload your OSCE transcript for AI-powered evaluation
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!showUploadForm ? (
              <Button 
                onClick={() => setShowUploadForm(true)}
                className="w-full sm:w-auto"
                data-testid="show-upload-button"
              >
                <Upload className="w-4 h-4 mr-2" />
                New Submission
              </Button>
            ) : (
              <div className="space-y-4">
                {/* Upload Method Selector */}
                <div className="flex space-x-2 p-1 bg-slate-100 rounded-lg w-fit">
                  <button
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      uploadMethod === 'transcript'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    onClick={() => setUploadMethod('transcript')}
                    data-testid="transcript-method-button"
                  >
                    Paste Transcript
                  </button>
                  <button
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      uploadMethod === 'audio'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    onClick={() => setUploadMethod('audio')}
                    data-testid="audio-method-button"
                  >
                    Upload Audio
                  </button>
                </div>

                {uploadMethod === 'transcript' ? (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      OSCE Transcript
                    </label>
                    <Textarea
                      placeholder="Paste your OSCE transcript here... The conversation should include the full dialogue between you and the patient."
                      rows={8}
                      value={transcriptText}
                      onChange={(e) => setTranscriptText(e.target.value)}
                      className="font-mono text-sm"
                      data-testid="transcript-textarea"
                    />
                    <p className="text-xs text-slate-500 mt-2">
                      Tip: Include the complete conversation for accurate evaluation
                    </p>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Audio Recording
                    </label>
                    <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                      <input
                        type="file"
                        accept="audio/*,.mp3,.wav,.m4a,.mp4"
                        onChange={(e) => setAudioFile(e.target.files[0])}
                        className="hidden"
                        id="audio-upload"
                        data-testid="audio-file-input"
                      />
                      <label
                        htmlFor="audio-upload"
                        className="cursor-pointer flex flex-col items-center"
                      >
                        <Upload className="w-12 h-12 text-slate-400 mb-3" />
                        {audioFile ? (
                          <div className="text-sm">
                            <p className="font-medium text-slate-900">{audioFile.name}</p>
                            <p className="text-slate-500 mt-1">
                              {(audioFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p className="text-slate-700 font-medium">
                              Click to upload audio file
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                              MP3, WAV, M4A up to 100MB
                            </p>
                          </div>
                        )}
                      </label>
                    </div>
                    {audioFile && (
                      <button
                        onClick={() => setAudioFile(null)}
                        className="text-sm text-red-600 hover:text-red-700 mt-2"
                      >
                        Remove file
                      </button>
                    )}
                    <p className="text-xs text-slate-500 mt-2">
                      Audio will be automatically transcribed and evaluated
                    </p>
                  </div>
                )}

                <div className="flex space-x-3">
                  <Button 
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    data-testid="submit-transcript-button"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit for Evaluation'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowUploadForm(false);
                      setTranscriptText('');
                      setAudioFile(null);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Submissions List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: List */}
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-4">Your Submissions</h2>
            <div className="space-y-4">
              {submissions.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="py-12 text-center">
                    <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-600">No submissions yet</p>
                    <p className="text-sm text-slate-500 mt-2">Submit your first OSCE to get started</p>
                  </CardContent>
                </Card>
              ) : (
                submissions.map((submission) => (
                  <Card 
                    key={submission.id} 
                    className={`cursor-pointer transition-all hover:shadow-lg ${
                      selectedSubmission?.id === submission.id ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => setSelectedSubmission(submission)}
                    data-testid={`submission-card-${submission.id}`}
                  >
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-base">
                            OSCE Submission
                          </CardTitle>
                          <CardDescription className="text-xs">
                            {new Date(submission.created_at).toLocaleDateString()} at{' '}
                            {new Date(submission.created_at).toLocaleTimeString()}
                          </CardDescription>
                        </div>
                        {getStatusBadge(submission.status)}
                      </div>
                    </CardHeader>
                    {submission.evaluation && submission.status === 'published' && (
                      <CardContent>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600">Overall Result:</span>
                          {submission.evaluation.overall_pass ? (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Pass
                            </Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-800">
                              <XCircle className="w-3 h-3 mr-1" />
                              Needs Improvement
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                ))
              )}
            </div>
          </div>
          
          {/* Right: Details */}
          <div>
            {selectedSubmission && selectedSubmission.evaluation ? (
              <div className="space-y-6" data-testid="evaluation-details">
                <h2 className="text-xl font-bold text-slate-900">Evaluation Details</h2>
                
                {/* Overall Status */}
                <Card className={`border-2 ${selectedSubmission.evaluation.overall_pass ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                  <CardContent className="py-6">
                    <div className="text-center">
                      {selectedSubmission.evaluation.overall_pass ? (
                        <>
                          <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-3" />
                          <h3 className="text-2xl font-bold text-green-900">Congratulations!</h3>
                          <p className="text-green-700 mt-2">You passed this OSCE evaluation</p>
                        </>
                      ) : (
                        <>
                          <TrendingUp className="w-16 h-16 text-red-600 mx-auto mb-3" />
                          <h3 className="text-2xl font-bold text-red-900">Keep Practicing</h3>
                          <p className="text-red-700 mt-2">Review the feedback below to improve</p>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                {/* Scores */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center text-lg">
                      <Stethoscope className="w-5 h-5 mr-2 text-blue-600" />
                      Critical Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-700 font-medium">Score:</span>
                      <span className={`text-2xl font-bold ${selectedSubmission.evaluation.critical_action_score >= 70 ? 'text-green-600' : 'text-red-600'}`}>
                        {selectedSubmission.evaluation.critical_action_score.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full ${selectedSubmission.evaluation.critical_action_score >= 70 ? 'bg-green-500' : 'bg-red-500'}`}
                        style={{ width: `${Math.min(selectedSubmission.evaluation.critical_action_score, 100)}%` }}
                      />
                    </div>
                    <p className="text-sm text-slate-600 mt-3">{selectedSubmission.evaluation.critical_action_feedback}</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center text-lg">
                      <MessageSquare className="w-5 h-5 mr-2 text-purple-600" />
                      Communication & Empathy
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-700 font-medium">Score:</span>
                      <span className={`text-2xl font-bold ${selectedSubmission.evaluation.communication_score >= 70 ? 'text-green-600' : 'text-red-600'}`}>
                        {selectedSubmission.evaluation.communication_score.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full ${selectedSubmission.evaluation.communication_score >= 70 ? 'bg-green-500' : 'bg-red-500'}`}
                        style={{ width: `${Math.min(selectedSubmission.evaluation.communication_score, 100)}%` }}
                      />
                    </div>
                    <p className="text-sm text-slate-600 mt-3">{selectedSubmission.evaluation.communication_feedback}</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center text-lg">
                      <Brain className="w-5 h-5 mr-2 text-indigo-600" />
                      Clinical Reasoning
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-700 font-medium">Score:</span>
                      <span className={`text-2xl font-bold ${selectedSubmission.evaluation.clinical_reasoning_score >= 6 ? 'text-green-600' : 'text-red-600'}`}>
                        {selectedSubmission.evaluation.clinical_reasoning_score}/10
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full ${selectedSubmission.evaluation.clinical_reasoning_score >= 6 ? 'bg-green-500' : 'bg-red-500'}`}
                        style={{ width: `${(selectedSubmission.evaluation.clinical_reasoning_score / 10) * 100}%` }}
                      />
                    </div>
                    <p className="text-sm text-slate-600 mt-3">{selectedSubmission.evaluation.clinical_reasoning_feedback}</p>
                  </CardContent>
                </Card>
                
                {selectedSubmission.evaluation.professor_notes && (
                  <Card className="border-amber-200 bg-amber-50">
                    <CardHeader>
                      <CardTitle className="text-lg text-amber-900">Professor Notes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-amber-800">{selectedSubmission.evaluation.professor_notes}</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : selectedSubmission ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <div className="animate-pulse">
                    <Activity className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                    <p className="text-slate-600">Evaluation in progress...</p>
                    <p className="text-sm text-slate-500 mt-2">Please wait while AI analyzes your OSCE</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center">
                  <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600">Select a submission to view details</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;
