import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '../App';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { useToast } from '../hooks/use-toast';
import { 
  Activity, 
  LogOut, 
  CheckCircle2, 
  XCircle, 
  FileText,
  Edit3,
  Send,
  User,
  Stethoscope,
  MessageSquare,
  Brain,
  BarChart3,
  Star
} from 'lucide-react';
import FeedbackModal from '../components/FeedbackModal';

const ProfessorDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  const [submissions, setSubmissions] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedEvaluation, setEditedEvaluation] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  
  useEffect(() => {
    fetchSubmissions();
  }, []);
  
  const fetchSubmissions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/submissions/professor`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSubmissions(response.data);
    } catch (error) {
      toast({
        title: "Error fetching submissions",
        description: error.response?.data?.detail || "Could not load submissions",
        variant: "destructive"
      });
    }
  };
  
  const handleEditEvaluation = () => {
    setEditedEvaluation({
      critical_action_score: selectedSubmission.evaluation.critical_action_score,
      communication_score: selectedSubmission.evaluation.communication_score,
      clinical_reasoning_score: selectedSubmission.evaluation.clinical_reasoning_score,
      critical_action_feedback: selectedSubmission.evaluation.critical_action_feedback,
      communication_feedback: selectedSubmission.evaluation.communication_feedback,
      clinical_reasoning_feedback: selectedSubmission.evaluation.clinical_reasoning_feedback,
      professor_notes: selectedSubmission.evaluation.professor_notes || ''
    });
    setIsEditing(true);
  };
  
  const handleSaveEdit = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API}/evaluation/${selectedSubmission.evaluation.id}`,
        editedEvaluation,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast({
        title: "Changes saved",
        description: "Evaluation has been updated successfully"
      });
      
      setIsEditing(false);
      fetchSubmissions();
      
      // Update selected submission
      const updated = submissions.find(s => s.id === selectedSubmission.id);
      if (updated) {
        setSelectedSubmission(updated);
      }
    } catch (error) {
      toast({
        title: "Save failed",
        description: error.response?.data?.detail || "Could not save changes",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API}/evaluation/${selectedSubmission.evaluation.id}/publish`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast({
        title: "Evaluation published",
        description: "The student can now view their results"
      });
      
      fetchSubmissions();
    } catch (error) {
      toast({
        title: "Publish failed",
        description: error.response?.data?.detail || "Could not publish evaluation",
        variant: "destructive"
      });
    } finally {
      setIsPublishing(false);
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
      evaluated: { color: 'bg-blue-100 text-blue-800', text: 'Pending Review' },
      published: { color: 'bg-green-100 text-green-800', text: 'Published' },
      error: { color: 'bg-red-100 text-red-800', text: 'Error' }
    };
    const variant = variants[status] || variants.processing;
    return <Badge className={variant.color}>{variant.text}</Badge>;
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">MedEd OSCE</h1>
                <p className="text-sm text-slate-600">Professor Dashboard</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-900" data-testid="professor-name">{user.full_name}</p>
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Submissions List */}
          <div className="lg:col-span-1">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Student Submissions</h2>
            <div className="space-y-3">
              {submissions.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="py-12 text-center">
                    <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-600">No submissions yet</p>
                  </CardContent>
                </Card>
              ) : (
                submissions.map((submission) => (
                  <Card 
                    key={submission.id} 
                    className={`cursor-pointer transition-all hover:shadow-lg ${
                      selectedSubmission?.id === submission.id ? 'ring-2 ring-indigo-500' : ''
                    }`}
                    onClick={() => {
                      setSelectedSubmission(submission);
                      setIsEditing(false);
                    }}
                    data-testid={`submission-card-${submission.id}`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center">
                          <User className="w-4 h-4 text-slate-500 mr-2" />
                          <span className="font-semibold text-sm">{submission.student_name}</span>
                        </div>
                        {getStatusBadge(submission.status)}
                      </div>
                      <CardDescription className="text-xs">
                        {new Date(submission.created_at).toLocaleDateString()} at{' '}
                        {new Date(submission.created_at).toLocaleTimeString()}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                ))
              )}
            </div>
          </div>
          
          {/* Right: Evaluation Details */}
          <div className="lg:col-span-2">
            {selectedSubmission && selectedSubmission.evaluation ? (
              <div className="space-y-6" data-testid="evaluation-panel">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-slate-900">Evaluation Review</h2>
                  <div className="flex space-x-2">
                    {!isEditing ? (
                      <>
                        <Button 
                          variant="outline" 
                          onClick={handleEditEvaluation}
                          data-testid="edit-evaluation-button"
                        >
                          <Edit3 className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                        {selectedSubmission.status !== 'published' && (
                          <Button 
                            onClick={handlePublish}
                            disabled={isPublishing}
                            data-testid="publish-button"
                          >
                            <Send className="w-4 h-4 mr-2" />
                            {isPublishing ? 'Publishing...' : 'Publish to Student'}
                          </Button>
                        )}
                      </>
                    ) : (
                      <>
                        <Button 
                          variant="outline" 
                          onClick={() => setIsEditing(false)}
                        >
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleSaveEdit}
                          disabled={isSaving}
                          data-testid="save-evaluation-button"
                        >
                          {isSaving ? 'Saving...' : 'Save Changes'}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                
                {/* Student Info */}
                <Card className="bg-slate-50">
                  <CardContent className="py-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-slate-600">Student:</span>
                        <p className="font-semibold text-slate-900">{selectedSubmission.student_name}</p>
                      </div>
                      <div>
                        <span className="text-slate-600">Overall Result:</span>
                        {selectedSubmission.evaluation.overall_pass ? (
                          <Badge className="bg-green-100 text-green-800 ml-2">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Pass
                          </Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-800 ml-2">
                            <XCircle className="w-3 h-3 mr-1" />
                            Needs Improvement
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Evaluation Sections */}
                {isEditing ? (
                  <>
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center text-lg">
                          <Stethoscope className="w-5 h-5 mr-2 text-blue-600" />
                          Critical Actions
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Score (0-100%)
                          </label>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            value={editedEvaluation.critical_action_score}
                            onChange={(e) => setEditedEvaluation({
                              ...editedEvaluation,
                              critical_action_score: parseFloat(e.target.value)
                            })}
                            data-testid="critical-action-score-input"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Feedback
                          </label>
                          <Textarea
                            rows={4}
                            value={editedEvaluation.critical_action_feedback}
                            onChange={(e) => setEditedEvaluation({
                              ...editedEvaluation,
                              critical_action_feedback: e.target.value
                            })}
                            data-testid="critical-action-feedback-input"
                          />
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center text-lg">
                          <MessageSquare className="w-5 h-5 mr-2 text-purple-600" />
                          Communication & Empathy
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Score (0-100%)
                          </label>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            value={editedEvaluation.communication_score}
                            onChange={(e) => setEditedEvaluation({
                              ...editedEvaluation,
                              communication_score: parseFloat(e.target.value)
                            })}
                            data-testid="communication-score-input"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Feedback
                          </label>
                          <Textarea
                            rows={4}
                            value={editedEvaluation.communication_feedback}
                            onChange={(e) => setEditedEvaluation({
                              ...editedEvaluation,
                              communication_feedback: e.target.value
                            })}
                            data-testid="communication-feedback-input"
                          />
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center text-lg">
                          <Brain className="w-5 h-5 mr-2 text-indigo-600" />
                          Clinical Reasoning
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Score (0-10)
                          </label>
                          <Input
                            type="number"
                            min="0"
                            max="10"
                            step="0.1"
                            value={editedEvaluation.clinical_reasoning_score}
                            onChange={(e) => setEditedEvaluation({
                              ...editedEvaluation,
                              clinical_reasoning_score: parseFloat(e.target.value)
                            })}
                            data-testid="clinical-reasoning-score-input"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Feedback
                          </label>
                          <Textarea
                            rows={4}
                            value={editedEvaluation.clinical_reasoning_feedback}
                            onChange={(e) => setEditedEvaluation({
                              ...editedEvaluation,
                              clinical_reasoning_feedback: e.target.value
                            })}
                            data-testid="clinical-reasoning-feedback-input"
                          />
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="border-amber-200 bg-amber-50">
                      <CardHeader>
                        <CardTitle className="text-lg text-amber-900">Professor Notes</CardTitle>
                        <CardDescription>Additional comments for the student</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Textarea
                          rows={3}
                          placeholder="Add any additional notes or encouragement..."
                          value={editedEvaluation.professor_notes}
                          onChange={(e) => setEditedEvaluation({
                            ...editedEvaluation,
                            professor_notes: e.target.value
                          })}
                          data-testid="professor-notes-input"
                        />
                      </CardContent>
                    </Card>
                  </>
                ) : (
                  <>
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
                  </>
                )}
              </div>
            ) : selectedSubmission ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <div className="animate-pulse">
                    <Activity className="w-12 h-12 text-indigo-500 mx-auto mb-4" />
                    <p className="text-slate-600">Evaluation in progress...</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center">
                  <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600">Select a submission to review</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProfessorDashboard;
