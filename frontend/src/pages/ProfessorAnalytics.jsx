import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '../App';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { useToast } from '../hooks/use-toast';
import { 
  Activity, 
  LogOut, 
  Search,
  TrendingUp,
  Users,
  Award,
  BarChart3,
  Brain,
  MessageSquare,
  Stethoscope,
  Sparkles,
  ArrowLeft
} from 'lucide-react';

const ProfessorAnalytics = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState(null);

  const suggestedQueries = [
    "What is the average empathy score of all students?",
    "How many students passed the OSCE evaluation?",
    "What are the common weaknesses in clinical reasoning?",
    "Show me the distribution of communication scores",
    "Which students need improvement in critical actions?",
    "What is the overall pass rate?",
    "Compare average scores across all three rubrics"
  ];

  const handleQuery = async (queryText = query) => {
    if (!queryText.trim()) {
      toast({
        title: "Query required",
        description: "Please enter a question to analyze student performance",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setResults(null);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API}/analytics/query`, {
        query: queryText
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setResults(response.data);
      
    } catch (error) {
      console.error("Query error:", error);
      toast({
        title: "Query failed",
        description: error.response?.data?.detail || "Could not process your query. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestedQuery = (suggestedQuery) => {
    setQuery(suggestedQuery);
    handleQuery(suggestedQuery);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/professor')}
                data-testid="back-to-dashboard-button"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900">Analytics Hub</h1>
                  <p className="text-sm text-slate-600">AI-Powered Insights</p>
                </div>
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
        {/* Query Interface */}
        <Card className="mb-8 border-0 shadow-xl bg-gradient-to-br from-white to-indigo-50">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl">
              <Sparkles className="w-6 h-6 mr-2 text-indigo-600" />
              Ask About Your Students
            </CardTitle>
            <CardDescription className="text-base">
              Use natural language to query student performance data and get AI-powered insights
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex space-x-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  placeholder="e.g., What is the average empathy score of my students?"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleQuery()}
                  className="pl-10 h-12 text-base"
                  data-testid="analytics-query-input"
                />
              </div>
              <Button 
                onClick={() => handleQuery()}
                disabled={isLoading}
                className="h-12 px-8"
                data-testid="run-query-button"
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <Activity className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </span>
                ) : (
                  'Analyze'
                )}
              </Button>
            </div>

            {/* Suggested Queries */}
            <div>
              <p className="text-sm font-medium text-slate-700 mb-3">Suggested Queries:</p>
              <div className="flex flex-wrap gap-2">
                {suggestedQueries.map((suggested, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestedQuery(suggested)}
                    className="px-3 py-1.5 bg-white border border-indigo-200 rounded-full text-xs text-indigo-700 hover:bg-indigo-50 hover:border-indigo-300 transition-colors"
                    data-testid={`suggested-query-${index}`}
                  >
                    {suggested}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Display */}
        {results && (
          <div className="space-y-6 animate-fadeIn">
            {/* Summary Card */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-purple-50">
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <Brain className="w-5 h-5 mr-2 text-blue-600" />
                  AI Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-700 leading-relaxed" data-testid="analysis-summary">
                  {results.analysis}
                </p>
              </CardContent>
            </Card>

            {/* Statistics Grid */}
            {results.statistics && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {results.statistics.total_students !== undefined && (
                  <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-slate-600 font-medium">Total Students</p>
                          <p className="text-3xl font-bold text-slate-900 mt-2">
                            {results.statistics.total_students}
                          </p>
                        </div>
                        <Users className="w-12 h-12 text-blue-500 opacity-20" />
                      </div>
                    </CardContent>
                  </Card>
                )}

                {results.statistics.pass_rate !== undefined && (
                  <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-slate-600 font-medium">Pass Rate</p>
                          <p className="text-3xl font-bold text-green-600 mt-2">
                            {results.statistics.pass_rate}%
                          </p>
                        </div>
                        <Award className="w-12 h-12 text-green-500 opacity-20" />
                      </div>
                    </CardContent>
                  </Card>
                )}

                {results.statistics.avg_critical_actions !== undefined && (
                  <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-slate-600 font-medium">Avg Critical Actions</p>
                          <p className="text-3xl font-bold text-blue-600 mt-2">
                            {results.statistics.avg_critical_actions}%
                          </p>
                        </div>
                        <Stethoscope className="w-12 h-12 text-blue-500 opacity-20" />
                      </div>
                    </CardContent>
                  </Card>
                )}

                {results.statistics.avg_communication !== undefined && (
                  <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-slate-600 font-medium">Avg Communication</p>
                          <p className="text-3xl font-bold text-purple-600 mt-2">
                            {results.statistics.avg_communication}%
                          </p>
                        </div>
                        <MessageSquare className="w-12 h-12 text-purple-500 opacity-20" />
                      </div>
                    </CardContent>
                  </Card>
                )}

                {results.statistics.avg_reasoning !== undefined && (
                  <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-slate-600 font-medium">Avg Clinical Reasoning</p>
                          <p className="text-3xl font-bold text-indigo-600 mt-2">
                            {results.statistics.avg_reasoning}/10
                          </p>
                        </div>
                        <Brain className="w-12 h-12 text-indigo-500 opacity-20" />
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Detailed Data */}
            {results.data && results.data.length > 0 && (
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2 text-indigo-600" />
                    Detailed Results
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {results.data.map((item, index) => (
                      <div 
                        key={index}
                        className="p-4 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors"
                      >
                        <p className="text-sm text-slate-700">{JSON.stringify(item, null, 2)}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recommendations */}
            {results.recommendations && results.recommendations.length > 0 && (
              <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-orange-50">
                <CardHeader>
                  <CardTitle className="flex items-center text-xl">
                    <Sparkles className="w-5 h-5 mr-2 text-amber-600" />
                    Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {results.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-amber-600 mr-2">•</span>
                        <span className="text-slate-700">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Empty State */}
        {!results && !isLoading && (
          <div className="text-center py-16">
            <BarChart3 className="w-24 h-24 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-700 mb-2">
              Ask a Question to Get Started
            </h3>
            <p className="text-slate-500">
              Use the search bar above or click on a suggested query to analyze your students' performance
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default ProfessorAnalytics;
