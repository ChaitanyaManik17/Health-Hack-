import { useState } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from './ui/dialog';
import { useToast } from '../hooks/use-toast';
import { MessageSquare, Star } from 'lucide-react';
import axios from 'axios';
import { API } from '../App';

const FeedbackModal = ({ isOpen, onClose }) => {
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({
        title: "Rating required",
        description: "Please provide a rating before submitting",
        variant: "destructive"
      });
      return;
    }

    if (!feedback.trim()) {
      toast({
        title: "Feedback required",
        description: "Please share your thoughts with us",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      await axios.post(`${API}/feedback`, {
        user_id: user.id,
        user_name: user.full_name,
        user_email: user.email,
        rating: rating,
        feedback_text: feedback
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast({
        title: "Thank you for your feedback! 🎉",
        description: "Your input helps us improve the platform."
      });

      setRating(0);
      setFeedback('');
      onClose();
    } catch (error) {
      toast({
        title: "Failed to submit feedback",
        description: "Please try again later",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl">
            <MessageSquare className="w-5 h-5 mr-2 text-blue-600" />
            Share Your Feedback
          </DialogTitle>
          <DialogDescription>
            Help us improve your OSCE evaluation experience
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Rating Stars */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">How would you rate your experience?</Label>
            <div className="flex space-x-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-transform hover:scale-110 focus:outline-none"
                  data-testid={`rating-star-${star}`}
                >
                  <Star
                    className={`w-10 h-10 ${
                      star <= (hoveredRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    } transition-colors`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-sm text-slate-600">
                {rating === 5 && "⭐ Excellent! We're thrilled you love it!"}
                {rating === 4 && "😊 Great! Thanks for the positive feedback!"}
                {rating === 3 && "👍 Good! We'll work on making it better."}
                {rating === 2 && "🤔 Fair. Please tell us what we can improve."}
                {rating === 1 && "😞 We're sorry. Your feedback is crucial for improvement."}
              </p>
            )}
          </div>

          {/* Feedback Text */}
          <div className="space-y-3">
            <Label htmlFor="feedback" className="text-base font-semibold">
              Tell us more (optional)
            </Label>
            <Textarea
              id="feedback"
              placeholder="What did you like? What can we improve? Any features you'd like to see?"
              rows={5}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="resize-none"
              data-testid="feedback-textarea"
            />
          </div>
        </div>

        <div className="flex space-x-3">
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
            className="flex-1"
            data-testid="submit-feedback-button"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
          </Button>
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FeedbackModal;
