import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '../App';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useToast } from '../hooks/use-toast';
import ShieldLogo from '../components/ShieldLogo';
import ProgressBar from '../components/design-system/ProgressBar';
import LoadingSpinner from '../components/design-system/LoadingSpinner';
import SubmissionReceipt from '../components/design-system/SubmissionReceipt';
import { 
  Upload, 
  FileText, 
  LogOut,
  Download,
  Eye,
  CheckCircle2
} from 'lucide-react';

const StudentPortal = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  const [uploadMethod, setUploadMethod] = useState('transcript');
  const [professorEmail, setProfessorEmail] = useState('');
  const [transcriptText, setTranscriptText] = useState('');
  const [audioFile, setAudioFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    setIsLoadingSubmissions(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/submissions/student/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSubmissions(response.data);
    } catch (error) {
      console.error('Error fetching submissions:', error);
    } finally {
      setIsLoadingSubmissions(false);
    }
  };

  const handleSubmit = async () => {
    if (!professorEmail.trim()) {
      toast({
        title: "Professor email required",
        description: "Please enter your professor's email address",
        variant: "destructive"
      });
      return;
    }

    if (uploadMethod === 'transcript' && !transcriptText.trim()) {
      toast({
        title: "Transcript required",
        description: "Please enter your OSCE transcript",
        variant: "destructive"
      });
      return;
    }

    if (uploadMethod === 'audio' && !audioFile) {
      toast({
        title: "Audio file required",
        description: "Please select an audio file",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(0);

    try {
      const token = localStorage.getItem('token');
      let response;

      if (uploadMethod === 'transcript') {
        // Simulate upload progress
        setUploadProgress(30);
        await new Promise(resolve => setTimeout(resolve, 300));
        
        response = await axios.post(`${API}/submissions/create`, {
          student_id: user.id,
          professor_email: professorEmail,
          transcript_text: transcriptText
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setUploadProgress(100);
      } else {
        // Audio upload with real progress
        const formData = new FormData();
        formData.append('file', audioFile);
        formData.append('student_id', user.id);
        formData.append('professor_email', professorEmail);
        
        response = await axios.post(`${API}/submissions/upload-audio`, formData, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          }
        });
      }

      // Show receipt
      setReceiptData(response.data);
      setShowReceipt(true);
      
      // Reset form
      setTranscriptText('');
      setAudioFile(null);
      setProfessorEmail('');
      
      // Refresh submissions
      fetchSubmissions();

    } catch (error) {
      console.error('Submission error:', error);
      toast({
        title: "Submission failed",
        description: error.response?.data?.detail || "Could not submit. Please try again.",
        variant: "destructive"
      });
      setUploadProgress(0);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewReport = async (submission) => {
    if (!submission.evaluation || submission.status !== 'published') {
      toast({
        title: "Report not available",
        description: "Your professor hasn't published the report yet.",
        variant: "destructive"
      });
      return;
    }
    setSelectedReport(submission);
  };

  const handleDownloadReport = async (submission) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API}/evaluation/${submission.evaluation.id}/download`,
        { 
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob'
        }
      );
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `OSCE_Report_${submission.id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Could not download report",
        variant: "destructive"
      });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header with S.H.I.E.L.D. theme */}
      <header className="bg-white border-b-4 border-blue-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <ShieldLogo size={48} />
              <div>
                <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Inter, sans-serif' }}>
                  S.H.I.E.L.D. Medical
                </h1>
                <p className="text-sm text-blue-600 font-medium">Student Portal</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-900">{user.full_name}</p>
                <p className="text-xs text-slate-600">{user.email}</p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleLogout}
                className="border-slate-300"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Upload Section */}
        {!showReceipt ? (
          <Card className="mb-8 shadow-xl border-2 border-blue-100">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <CardTitle className="flex items-center text-xl">
                <Upload className="w-6 h-6 mr-2" />
                Submit New OSCE Evaluation
              </CardTitle>
              <CardDescription className="text-blue-100">
                Upload your audio or transcript for AI-powered evaluation
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {/* Professor Email */}
              <div className="space-y-2">
                <Label htmlFor="professor-email" className="text-base font-semibold">
                  Professor Email Address *
                </Label>
                <Input
                  id="professor-email"
                  type="email"
                  placeholder="professor@university.edu"
                  value={professorEmail}
                  onChange={(e) => setProfessorEmail(e.target.value)}
                  disabled={isSubmitting}
                  className="border-2 border-slate-300 focus:border-blue-500"
                  data-testid="professor-email-input"
                />
                <p className="text-xs text-slate-500">
                  Enter the email of the professor who will evaluate your OSCE
                </p>
              </div>

              {/* Upload Method Tabs */}
              <Tabs value={uploadMethod} onValueChange={setUploadMethod}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="transcript">
                    <FileText className="w-4 h-4 mr-2" />
                    Transcript
                  </TabsTrigger>
                  <TabsTrigger value="audio">
                    <Upload className="w-4 h-4 mr-2" />
                    Audio File
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="transcript" className="space-y-4">
                  <Label htmlFor="transcript" className="text-base font-semibold">
                    OSCE Transcript
                  </Label>
                  <Textarea
                    id="transcript"
                    placeholder="Paste your complete OSCE conversation here..."
                    rows={10}
                    value={transcriptText}
                    onChange={(e) => setTranscriptText(e.target.value)}
                    disabled={isSubmitting}
                    className="font-mono text-sm border-2"
                    data-testid="transcript-input"
                  />
                </TabsContent>

                <TabsContent value="audio" className="space-y-4">
                  <Label className="text-base font-semibold">Audio Recording</Label>
                  <div className="border-2 border-dashed border-blue-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors bg-blue-50">
                    <input
                      type="file"
                      accept="audio/*,.mp3,.wav,.m4a"
                      onChange={(e) => setAudioFile(e.target.files[0])}
                      className="hidden"
                      id="audio-upload"
                      disabled={isSubmitting}
                      data-testid="audio-input"
                    />
                    <label htmlFor="audio-upload" className="cursor-pointer">
                      <Upload className="w-12 h-12 text-blue-500 mx-auto mb-3" />
                      {audioFile ? (
                        <div>
                          <p className="font-semibold text-slate-900">{audioFile.name}</p>
                          <p className="text-sm text-slate-600 mt-1">
                            {(audioFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      ) : (
                        <div>
                          <p className="font-semibold text-slate-900">
                            Click to upload audio file
                          </p>
                          <p className="text-sm text-slate-600 mt-1">
                            MP3, WAV, M4A • Max 100MB
                          </p>
                        </div>
                      )}
                    </label>
                  </div>
                </TabsContent>
              </Tabs>

              {/* Progress Bar */}
              {isSubmitting && (
                <ProgressBar
                  progress={uploadProgress}
                  size="lg"
                  variant={uploadProgress === 100 ? 'success' : 'primary'}
                  label={uploadProgress === 100 ? 'Upload Complete!' : 'Uploading...'}
                />
              )}

              {/* Submit Button */}
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full h-12 text-base font-semibold bg-blue-600 hover:bg-blue-700"
                data-testid="submit-button"
              >
                {isSubmitting ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    {uploadProgress < 100 ? 'Uploading...' : 'Processing...'}
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                    Submit for Evaluation
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <SubmissionReceipt 
            submission={receiptData} 
            onClose={() => setShowReceipt(false)}
          />
        )}

        {/* Submissions List */}
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle>Your Submissions</CardTitle>
            <CardDescription>Track your OSCE evaluations and view published reports</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingSubmissions ? (
              <LoadingSpinner size="lg" text="Loading submissions..." className="py-12" />
            ) : submissions.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600">No submissions yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {submissions.map((sub) => (
                  <div
                    key={sub.id}
                    className="border-2 border-slate-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-slate-900">
                          Submission ID: {sub.id.substring(0, 8)}...
                        </p>
                        <p className="text-sm text-slate-600">
                          {new Date(sub.created_at).toLocaleString()}
                        </p>
                        <p className="text-sm text-slate-600">
                          Professor: {sub.professor_email}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          sub.status === 'published' ? 'bg-green-100 text-green-800' :
                          sub.status === 'evaluated' ? 'bg-blue-100 text-blue-800' :
                          sub.status === 'evaluating' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-slate-100 text-slate-800'
                        }`}>
                          {sub.status}
                        </span>
                      </div>
                    </div>
                    {sub.status === 'published' && (
                      <div className="mt-3 flex space-x-2">
                        <Button
                          size="sm"
                          onClick={() => handleViewReport(sub)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Report
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownloadReport(sub)}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default StudentPortal;
