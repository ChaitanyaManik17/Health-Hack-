import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '../App';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { useToast } from '../hooks/use-toast';
import ShieldLogo from '../components/ShieldLogo';
import ProgressBar from '../components/design-system/ProgressBar';
import LoadingSpinner from '../components/design-system/LoadingSpinner';
import { 
  LogOut,
  Download,
  Play,
  FileText,
  Mic,
  Eye,
  Send,
  Lock,
  Edit3,
  Save,
  BarChart3
} from 'lucide-react';

const ProfessorPortal = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  const [submissions, setSubmissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationProgress, setEvaluationProgress] = useState(0);
  const [showEditor, setShowEditor] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedScores, setEditedScores] = useState(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSaved, setIsSaved] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchSubmissions();
    const interval = setInterval(fetchSubmissions, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Poll for evaluation progress
    if (isEvaluating && selectedSubmission) {
      const interval = setInterval(async () => {
        try {
          const token = localStorage.getItem('token');
          const response = await axios.get(
            `${API}/submission-status/${selectedSubmission.id}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setEvaluationProgress(response.data.evaluation_progress || 0);
          
          if (response.data.status === 'evaluated') {
            setIsEvaluating(false);
            setEvaluationProgress(100);
            fetchSubmissions();
            toast({
              title: "Evaluation complete!",
              description: "You can now review and publish the report."
            });
          }
        } catch (error) {
          console.error('Progress check error:', error);
        }
      }, 3000);
      
      return () => clearInterval(interval);
    }
  }, [isEvaluating, selectedSubmission]);

  const fetchSubmissions = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API}/submissions/professor/${user.email}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSubmissions(response.data);
    } catch (error) {
      console.error('Error fetching submissions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEvaluate = async (submission) => {
    if (submission.status !== 'submitted') {
      toast({
        title: "Cannot evaluate",
        description: `Submission status is: ${submission.status}`,
        variant: "destructive"
      });
      return;
    }

    setSelectedSubmission(submission);
    setIsEvaluating(true);
    setEvaluationProgress(0);

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API}/submissions/${submission.id}/evaluate`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast({
        title: "Evaluation started",
        description: "AI is analyzing the OSCE. This will take 1-2 minutes."
      });
    } catch (error) {
      setIsEvaluating(false);
      toast({
        title: "Evaluation failed",
        description: error.response?.data?.detail || "Could not start evaluation",
        variant: "destructive"
      });
    }
  };

  const handleViewReport = (submission) => {
    if (!submission.evaluation) {
      toast({
        title: "No evaluation",
        description: "This submission hasn't been evaluated yet",
        variant: "destructive"
      });
      return;
    }

    setSelectedSubmission(submission);
    
    // Initialize with all detailed scores from evaluation
    const detailed = submission.evaluation.detailed_feedback || {};
    
    setEditedScores({
      // Main scores
      critical_action_score: submission.evaluation.critical_action_score,
      communication_score: submission.evaluation.communication_score,
      clinical_reasoning_score: submission.evaluation.clinical_reasoning_score,
      
      // Main feedback
      critical_action_feedback: submission.evaluation.critical_action_feedback,
      communication_feedback: submission.evaluation.communication_feedback,
      clinical_reasoning_feedback: submission.evaluation.clinical_reasoning_feedback,
      professor_notes: submission.evaluation.professor_notes || '',
      
      // Detailed Communication Scores (7 domains)
      communication_details: {
        sets_stage: detailed.communication?.sets_stage || 3,
        active_listening: detailed.communication?.active_listening || 3,
        shows_compassion: detailed.communication?.shows_compassion || 3,
        encourages_sharing: detailed.communication?.encourages_sharing || 3,
        adjusts_communication: detailed.communication?.adjusts_communication || 3,
        gives_ownership: detailed.communication?.gives_ownership || 3,
        collaborative_plan: detailed.communication?.collaborative_plan || 3,
        strengths: detailed.communication?.strengths || [],
        areas_for_improvement: detailed.communication?.areas_for_improvement || []
      },
      
      // Detailed Critical Actions
      critical_actions_details: {
        score: detailed.critical_actions?.score || 14,
        items_completed: detailed.critical_actions?.items_completed || [],
        items_missed: detailed.critical_actions?.items_missed || []
      },
      
      // Detailed Clinical Reasoning
      clinical_reasoning_details: {
        interpretive_summary_score: detailed.clinical_reasoning?.interpretive_summary_score || 2,
        differential_diagnosis_score: detailed.clinical_reasoning?.differential_diagnosis_score || 1,
        lead_diagnosis_explanation_score: detailed.clinical_reasoning?.lead_diagnosis_explanation_score || 1,
        alternative_diagnosis_score: detailed.clinical_reasoning?.alternative_diagnosis_score || 1,
        differential_diagnoses: detailed.clinical_reasoning?.differential_diagnoses || [],
        strengths: detailed.clinical_reasoning?.strengths || [],
        areas_for_improvement: detailed.clinical_reasoning?.areas_for_improvement || []
      }
    });
    
    setIsSaved(true);
    setShowEditor(true);
  };

  const handleSaveEdits = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API}/evaluation/${selectedSubmission.evaluation.id}`,
        editedScores,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast({
        title: "Changes saved ✓",
        description: "Evaluation updated successfully"
      });
      
      setIsSaved(true);
      setIsEditing(false);
      fetchSubmissions();
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
  
  // Helper function to recalculate communication score
  const recalculateCommunicationScore = (details) => {
    const total = details.sets_stage + details.active_listening + details.shows_compassion +
                  details.encourages_sharing + details.adjusts_communication +
                  details.gives_ownership + details.collaborative_plan;
    return ((total / 35) * 100).toFixed(1);
  };
  
  // Helper function to recalculate clinical reasoning score
  const recalculateClinicalReasoningScore = (details) => {
    return details.interpretive_summary_score + details.differential_diagnosis_score +
           details.lead_diagnosis_explanation_score + details.alternative_diagnosis_score;
  };
  
  // Helper function to recalculate critical actions score
  const recalculateCriticalActionsScore = (details) => {
    return ((details.score / 20) * 100).toFixed(1);
  };
  
  // Track changes for save button state
  const handleScoreChange = (field, value) => {
    setEditedScores(prev => ({
      ...prev,
      [field]: value
    }));
    setIsSaved(false);
  };
  
  const handleDetailChange = (section, field, value) => {
    setEditedScores(prev => {
      const newDetails = {
        ...prev[section],
        [field]: value
      };
      
      const updates = {
        ...prev,
        [section]: newDetails
      };
      
      // Auto-recalculate main scores
      if (section === 'communication_details') {
        updates.communication_score = parseFloat(recalculateCommunicationScore(newDetails));
      } else if (section === 'clinical_reasoning_details') {
        updates.clinical_reasoning_score = recalculateClinicalReasoningScore(newDetails);
      } else if (section === 'critical_actions_details') {
        updates.critical_action_score = parseFloat(recalculateCriticalActionsScore(newDetails));
      }
      
      return updates;
    });
    setIsSaved(false);
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
        title: "Report published! ✅",
        description: "The student can now view their evaluation"
      });
      
      setShowEditor(false);
      fetchSubmissions();
    } catch (error) {
      toast({
        title: "Publish failed",
        description: error.response?.data?.detail || "Could not publish report",
        variant: "destructive"
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDownload = async (submission, fileType) => {
    try {
      const token = localStorage.getItem('token');
      const endpoint = fileType === 'audio' 
        ? `${API}/submissions/${submission.id}/audio`
        : `${API}/submissions/${submission.id}/transcript?type=${fileType}`;
      
      const response = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${fileType}_${submission.id}.${fileType === 'audio' ? 'mp3' : 'txt'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Could not download file",
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white border-b-4 border-indigo-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <ShieldLogo size={48} />
              <div>
                <h1 className="text-2xl font-bold text-slate-900">S.H.I.E.L.D. Medical</h1>
                <p className="text-sm text-indigo-600 font-medium">Professor Portal</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                onClick={() => navigate('/professor/analytics')}
                className="bg-purple-600 hover:bg-purple-700"
                size="sm"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Analytics
              </Button>
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-900">{user.full_name}</p>
                <p className="text-xs text-slate-600">{user.email}</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Submissions Table */}
        {!showEditor ? (
          <Card className="shadow-xl">
            <CardHeader className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white">
              <CardTitle className="text-xl">Student Submissions</CardTitle>
              <CardDescription className="text-indigo-100">
                Review and evaluate OSCE submissions assigned to you
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {isLoading ? (
                <LoadingSpinner size="lg" text="Loading submissions..." className="py-12" />
              ) : submissions.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600">No submissions yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b-2 border-slate-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">
                          Student
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">
                          Submitted
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">
                          Files
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {submissions.map((sub) => (
                        <tr key={sub.id} className="hover:bg-slate-50">
                          <td className="px-4 py-4">
                            <div>
                              <p className="font-semibold text-slate-900">{sub.student_name}</p>
                              <p className="text-sm text-slate-600">{sub.student_email}</p>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-sm text-slate-700">
                            {new Date(sub.submitted_at || sub.created_at).toLocaleString()}
                          </td>
                          <td className="px-4 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              sub.status === 'published' ? 'bg-green-100 text-green-800' :
                              sub.status === 'evaluated' ? 'bg-blue-100 text-blue-800' :
                              sub.status === 'evaluating' ? 'bg-yellow-100 text-yellow-800' :
                              sub.status === 'submitted' ? 'bg-purple-100 text-purple-800' :
                              'bg-slate-100 text-slate-800'
                            }`}>
                              {sub.status}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex space-x-2">
                              {sub.audio_filename && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDownload(sub, 'audio')}
                                >
                                  <Mic className="w-4 h-4" />
                                </Button>
                              )}
                              {sub.original_transcript && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDownload(sub, 'original')}
                                >
                                  <FileText className="w-4 h-4" />
                                </Button>
                              )}
                              {sub.ai_transcript && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDownload(sub, 'ai')}
                                  className="border-blue-300"
                                >
                                  <FileText className="w-4 h-4 text-blue-600" />
                                </Button>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex space-x-2">
                              {sub.status === 'submitted' && (
                                <Button
                                  size="sm"
                                  onClick={() => handleEvaluate(sub)}
                                  className="bg-indigo-600 hover:bg-indigo-700"
                                  data-testid="evaluate-button"
                                >
                                  <Play className="w-4 h-4 mr-1" />
                                  Evaluate with AI
                                </Button>
                              )}
                              {sub.evaluation && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleViewReport(sub)}
                                  data-testid="view-report-button"
                                >
                                  <Eye className="w-4 h-4 mr-1" />
                                  View Report
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          /* Report Editor */
          <Card className="shadow-xl">
            <CardHeader className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-xl">Evaluation Report</CardTitle>
                  <CardDescription className="text-indigo-100">
                    {selectedSubmission.student_name} • {selectedSubmission.student_email}
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  {selectedSubmission.evaluation?.is_read_only ? (
                    <span className="flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                      <Lock className="w-4 h-4 mr-1" />
                      Published
                    </span>
                  ) : (
                    <>
                      {!isEditing ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setIsEditing(true)}
                          className="text-white border-white hover:bg-indigo-700"
                        >
                          <Edit3 className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={handleSaveEdits}
                          disabled={isSaved || isSaving}
                          className={`${isSaved ? 'bg-green-100 text-green-700' : 'bg-white text-indigo-600 hover:bg-indigo-50'}`}
                        >
                          {isSaving ? (
                            <>
                              <LoadingSpinner size="sm" className="mr-1" />
                              Saving...
                            </>
                          ) : isSaved ? (
                            <>
                              <Save className="w-4 h-4 mr-1" />
                              Saved ✓
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4 mr-1" />
                              Save Changes
                            </>
                          )}
                        </Button>
                      )}
                    </>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowEditor(false)}
                    className="text-white border-white hover:bg-indigo-700"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {editedScores && (
                <>
                  {/* === CRITICAL ACTIONS SECTION === */}
                  <div className="border-2 border-blue-200 rounded-lg p-6 bg-blue-50">
                    <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center">
                      🎯 Critical Actions Checklist
                      <span className="ml-auto text-3xl font-bold text-blue-600">
                        {editedScores.critical_action_score?.toFixed(1)}%
                      </span>
                    </h3>
                    
                    {isEditing && !selectedSubmission.evaluation?.is_read_only ? (
                      <>
                        <div className="bg-white rounded-lg p-4 mb-4">
                          <Label className="text-sm font-semibold mb-2 block">Score out of 20</Label>
                          <input
                            type="number"
                            min="0"
                            max="20"
                            step="1"
                            value={editedScores.critical_actions_details.score}
                            onChange={(e) => handleDetailChange('critical_actions_details', 'score', parseInt(e.target.value))}
                            className="w-32 px-3 py-2 border-2 border-slate-300 rounded-lg"
                          />
                          <span className="ml-3 text-slate-600">/ 20 = {editedScores.critical_action_score?.toFixed(1)}%</span>
                        </div>
                        
                        <div className="bg-white rounded-lg p-4 mb-4">
                          <Label className="text-sm font-semibold mb-2 block">AI Justification & Feedback</Label>
                          <Textarea
                            value={editedScores.critical_action_feedback}
                            onChange={(e) => handleScoreChange('critical_action_feedback', e.target.value)}
                            rows={6}
                            className="font-normal"
                          />
                        </div>
                      </>
                    ) : (
                      <div className="bg-white rounded-lg p-4">
                        <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                          {editedScores.critical_action_feedback}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* === COMMUNICATION & EMPATHY SECTION === */}
                  <div className="border-2 border-purple-200 rounded-lg p-6 bg-purple-50">
                    <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center">
                      💬 Communication & Empathy (7 Domains)
                      <span className="ml-auto text-3xl font-bold text-purple-600">
                        {editedScores.communication_score?.toFixed(1)}%
                      </span>
                    </h3>
                    
                    {/* 7 Domain Scores */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      {[
                        { key: 'sets_stage', label: '1. Sets the Stage' },
                        { key: 'active_listening', label: '2. Active Listening' },
                        { key: 'shows_compassion', label: '3. Shows Compassion' },
                        { key: 'encourages_sharing', label: '4. Encourages Open Sharing' },
                        { key: 'adjusts_communication', label: '5. Adjusts Communication' },
                        { key: 'gives_ownership', label: '6. Gives Ownership' },
                        { key: 'collaborative_plan', label: '7. Collaborative Plan' }
                      ].map(domain => (
                        <div key={domain.key} className="bg-white rounded-lg p-3">
                          <Label className="text-xs font-semibold text-slate-600 mb-1 block">
                            {domain.label}
                          </Label>
                          {isEditing && !selectedSubmission.evaluation?.is_read_only ? (
                            <div className="flex items-center space-x-2">
                              <input
                                type="number"
                                min="1"
                                max="5"
                                step="1"
                                value={editedScores.communication_details[domain.key]}
                                onChange={(e) => handleDetailChange('communication_details', domain.key, parseInt(e.target.value))}
                                className="w-16 px-2 py-1 border-2 border-slate-300 rounded text-center font-bold"
                              />
                              <span className="text-slate-500 text-sm">/ 5</span>
                            </div>
                          ) : (
                            <p className="text-2xl font-bold text-purple-600">
                              {editedScores.communication_details[domain.key]} / 5
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    <div className="bg-white rounded-lg p-4 mb-3">
                      <p className="text-sm text-slate-600 mb-2">
                        <strong>Total:</strong> {
                          editedScores.communication_details.sets_stage +
                          editedScores.communication_details.active_listening +
                          editedScores.communication_details.shows_compassion +
                          editedScores.communication_details.encourages_sharing +
                          editedScores.communication_details.adjusts_communication +
                          editedScores.communication_details.gives_ownership +
                          editedScores.communication_details.collaborative_plan
                        } / 35 = {editedScores.communication_score?.toFixed(1)}%
                      </p>
                    </div>
                    
                    {isEditing && !selectedSubmission.evaluation?.is_read_only ? (
                      <div className="bg-white rounded-lg p-4">
                        <Label className="text-sm font-semibold mb-2 block">AI Justification & Feedback</Label>
                        <Textarea
                          value={editedScores.communication_feedback}
                          onChange={(e) => handleScoreChange('communication_feedback', e.target.value)}
                          rows={6}
                          className="font-normal"
                        />
                      </div>
                    ) : (
                      <div className="bg-white rounded-lg p-4">
                        <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                          {editedScores.communication_feedback}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* === CLINICAL REASONING SECTION === */}
                  <div className="border-2 border-indigo-200 rounded-lg p-6 bg-indigo-50">
                    <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center">
                      🧠 Clinical Reasoning (IDEA Rubric)
                      <span className="ml-auto text-3xl font-bold text-indigo-600">
                        {editedScores.clinical_reasoning_score} / 10
                      </span>
                    </h3>
                    
                    {/* IDEA Components */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-white rounded-lg p-3">
                        <Label className="text-xs font-semibold text-slate-600 mb-1 block">
                          I - Interpretive Summary
                        </Label>
                        {isEditing && !selectedSubmission.evaluation?.is_read_only ? (
                          <div className="flex items-center space-x-2">
                            <input
                              type="number"
                              min="0"
                              max="4"
                              step="1"
                              value={editedScores.clinical_reasoning_details.interpretive_summary_score}
                              onChange={(e) => handleDetailChange('clinical_reasoning_details', 'interpretive_summary_score', parseInt(e.target.value))}
                              className="w-16 px-2 py-1 border-2 border-slate-300 rounded text-center font-bold"
                            />
                            <span className="text-slate-500 text-sm">/ 4</span>
                          </div>
                        ) : (
                          <p className="text-2xl font-bold text-indigo-600">
                            {editedScores.clinical_reasoning_details.interpretive_summary_score} / 4
                          </p>
                        )}
                      </div>
                      
                      <div className="bg-white rounded-lg p-3">
                        <Label className="text-xs font-semibold text-slate-600 mb-1 block">
                          D - Differential Diagnosis
                        </Label>
                        {isEditing && !selectedSubmission.evaluation?.is_read_only ? (
                          <div className="flex items-center space-x-2">
                            <input
                              type="number"
                              min="0"
                              max="2"
                              step="1"
                              value={editedScores.clinical_reasoning_details.differential_diagnosis_score}
                              onChange={(e) => handleDetailChange('clinical_reasoning_details', 'differential_diagnosis_score', parseInt(e.target.value))}
                              className="w-16 px-2 py-1 border-2 border-slate-300 rounded text-center font-bold"
                            />
                            <span className="text-slate-500 text-sm">/ 2</span>
                          </div>
                        ) : (
                          <p className="text-2xl font-bold text-indigo-600">
                            {editedScores.clinical_reasoning_details.differential_diagnosis_score} / 2
                          </p>
                        )}
                      </div>
                      
                      <div className="bg-white rounded-lg p-3">
                        <Label className="text-xs font-semibold text-slate-600 mb-1 block">
                          E - Lead Diagnosis Explanation
                        </Label>
                        {isEditing && !selectedSubmission.evaluation?.is_read_only ? (
                          <div className="flex items-center space-x-2">
                            <input
                              type="number"
                              min="0"
                              max="2"
                              step="1"
                              value={editedScores.clinical_reasoning_details.lead_diagnosis_explanation_score}
                              onChange={(e) => handleDetailChange('clinical_reasoning_details', 'lead_diagnosis_explanation_score', parseInt(e.target.value))}
                              className="w-16 px-2 py-1 border-2 border-slate-300 rounded text-center font-bold"
                            />
                            <span className="text-slate-500 text-sm">/ 2</span>
                          </div>
                        ) : (
                          <p className="text-2xl font-bold text-indigo-600">
                            {editedScores.clinical_reasoning_details.lead_diagnosis_explanation_score} / 2
                          </p>
                        )}
                      </div>
                      
                      <div className="bg-white rounded-lg p-3">
                        <Label className="text-xs font-semibold text-slate-600 mb-1 block">
                          A - Alternative Diagnosis
                        </Label>
                        {isEditing && !selectedSubmission.evaluation?.is_read_only ? (
                          <div className="flex items-center space-x-2">
                            <input
                              type="number"
                              min="0"
                              max="2"
                              step="1"
                              value={editedScores.clinical_reasoning_details.alternative_diagnosis_score}
                              onChange={(e) => handleDetailChange('clinical_reasoning_details', 'alternative_diagnosis_score', parseInt(e.target.value))}
                              className="w-16 px-2 py-1 border-2 border-slate-300 rounded text-center font-bold"
                            />
                            <span className="text-slate-500 text-sm">/ 2</span>
                          </div>
                        ) : (
                          <p className="text-2xl font-bold text-indigo-600">
                            {editedScores.clinical_reasoning_details.alternative_diagnosis_score} / 2
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-lg p-4 mb-3">
                      <p className="text-sm text-slate-600">
                        <strong>Total IDEA Score:</strong> {editedScores.clinical_reasoning_score} / 10
                      </p>
                    </div>
                    
                    {isEditing && !selectedSubmission.evaluation?.is_read_only ? (
                      <div className="bg-white rounded-lg p-4">
                        <Label className="text-sm font-semibold mb-2 block">AI Justification & Feedback</Label>
                        <Textarea
                          value={editedScores.clinical_reasoning_feedback}
                          onChange={(e) => handleScoreChange('clinical_reasoning_feedback', e.target.value)}
                          rows={6}
                          className="font-normal"
                        />
                      </div>
                    ) : (
                      <div className="bg-white rounded-lg p-4">
                        <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                          {editedScores.clinical_reasoning_feedback}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* === PROFESSOR NOTES === */}
                  <div className="border-2 border-amber-200 rounded-lg p-6 bg-amber-50">
                    <h3 className="text-lg font-bold text-slate-900 mb-3">📝 Professor's Additional Notes</h3>
                    {isEditing && !selectedSubmission.evaluation?.is_read_only ? (
                      <Textarea
                        value={editedScores.professor_notes}
                        onChange={(e) => handleScoreChange('professor_notes', e.target.value)}
                        rows={4}
                        placeholder="Add any additional comments or observations..."
                        className="bg-white"
                      />
                    ) : (
                      <div className="bg-white rounded-lg p-4">
                        <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                          {editedScores.professor_notes || 'No additional notes'}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Publish Button */}
                  {!selectedSubmission.evaluation?.is_read_only && (
                    <Button
                      onClick={handlePublish}
                      disabled={isPublishing}
                      className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-semibold"
                      data-testid="publish-button"
                    >
                      {isPublishing ? (
                        <>
                          <LoadingSpinner size="sm" className="mr-2" />
                          Publishing...
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5 mr-2" />
                          Publish Report to Student
                        </>
                      )}
                    </Button>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Evaluation Progress Modal */}
        {isEvaluating && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>AI Evaluation in Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <ProgressBar
                  progress={evaluationProgress}
                  size="lg"
                  variant="primary"
                  label="Analyzing OSCE..."
                />
                <p className="text-sm text-slate-600 mt-4 text-center">
                  This typically takes 1-2 minutes. Please wait...
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default ProfessorPortal;
