import React from 'react';
import { CheckCircle2, Calendar, Hash, User, Mail } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

const SubmissionReceipt = ({ submission, onClose }) => {
  return (
    <Card className="border-2 border-green-200 bg-green-50 shadow-xl">
      <CardHeader className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-t-lg">
        <CardTitle className="flex items-center text-xl">
          <CheckCircle2 className="w-6 h-6 mr-2" />
          Submission Successful
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        <div className="bg-white rounded-lg p-4 space-y-3">
          <div className="flex items-start">
            <Hash className="w-5 h-5 text-slate-500 mr-3 mt-0.5" />
            <div>
              <p className="text-xs text-slate-600 font-medium">Submission ID</p>
              <p className="text-base font-mono font-bold text-slate-900" data-testid="submission-id">
                {submission.submission_id || submission.id}
              </p>
            </div>
          </div>
          
          <div className="flex items-start">
            <Calendar className="w-5 h-5 text-slate-500 mr-3 mt-0.5" />
            <div>
              <p className="text-xs text-slate-600 font-medium">Submitted At</p>
              <p className="text-base font-semibold text-slate-900">
                {new Date().toLocaleString()}
              </p>
            </div>
          </div>

          {submission.professor_email && (
            <div className="flex items-start">
              <Mail className="w-5 h-5 text-slate-500 mr-3 mt-0.5" />
              <div>
                <p className="text-xs text-slate-600 font-medium">Assigned Professor</p>
                <p className="text-base font-semibold text-slate-900">
                  {submission.professor_email}
                </p>
              </div>
            </div>
          )}

          <div className="flex items-start">
            <User className="w-5 h-5 text-slate-500 mr-3 mt-0.5" />
            <div>
              <p className="text-xs text-slate-600 font-medium">Status</p>
              <div className="flex items-center mt-1">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  ⏳ Awaiting Professor Evaluation
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900 font-medium mb-1">
            📬 What happens next?
          </p>
          <p className="text-sm text-blue-700">
            Your professor will review and evaluate your submission. You'll be notified when your report is ready.
          </p>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
          >
            Done
          </button>
        )}
      </CardContent>
    </Card>
  );
};

export default SubmissionReceipt;
