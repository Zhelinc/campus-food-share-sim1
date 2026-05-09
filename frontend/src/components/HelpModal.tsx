import React from 'react';
import './HelpModal.css';

interface HelpModalProps {
  onClose: () => void;
}

const HelpModal: React.FC<HelpModalProps> = ({ onClose }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>📖 Help & Support</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        
        <div className="modal-body">
          {/* User Guide Section */}
          <section className="help-section">
            <h3>📌 User Guide</h3>
            
            <div className="guide-item">
              <h4>1. How to publish food?</h4>
              <p>Click "Publish Food" → Fill in title, campus, location, weight, expiry days, category, allergens → Upload image → Submit</p>
            </div>
            
            <div className="guide-item">
              <h4>2. How to claim food?</h4>
              <p>Click "Claim Now" on any food card → Enter preferred pickup time (ISO format, e.g., 2025-05-10T14:30) → Submit → Wait for publisher response</p>
            </div>
            
            <div className="guide-item">
              <h4>3. How to negotiate pickup time?</h4>
              <p><strong>Publisher:</strong> Receive claim request → Click "Accept" or "Propose new time" → If proposing new time, enter the new pickup time → Send</p>
              <p><strong>Claimant:</strong> Receive counter-offer notification → Click "Accept" (transaction completed) or "Reject" (food becomes available again)</p>
            </div>
            
            <div className="guide-item">
              <h4>4. How to rate a transaction?</h4>
              <p>Go to "My Publications" or "My Claims" → Find completed transaction (status = COMPLETED) → Click "Rate" → Select score 0-5 → Add optional comment → Submit</p>
              <p>⚠️ You can only rate each transaction once. Your average reputation score is shown only after receiving ≥2 ratings.</p>
            </div>
            
            <div className="guide-item">
              <h4>5. How to change password?</h4>
              <p>Go to "My Account" → Enter old password → Enter new password (≥6 chars, includes uppercase, lowercase, number, special char) → Confirm → Submit</p>
            </div>
            
            <div className="guide-item">
              <h4>6. Forgot password?</h4>
              <p>Click "Forgot password" on login page → Enter registered email → Receive 6-digit code (valid for 10 minutes) → Enter code and new password → Reset</p>
            </div>
          </section>
          
          {/* FAQ Section */}
          <section className="help-section">
            <h3>❓ Frequently Asked Questions</h3>
            
            <div className="faq-item">
              <p className="question"><strong>Q: Why can't I see someone's reputation score?</strong></p>
              <p className="answer">A: Their score is only displayed after receiving ≥2 ratings. This prevents rating manipulation for new users.</p>
            </div>
            
            <div className="faq-item">
              <p className="question"><strong>Q: What happens if the publisher doesn't respond to my claim?</strong></p>
              <p className="answer">A: After 24 hours, the system automatically cancels the claim and the food becomes available again. Both parties receive a timeout notification.</p>
            </div>
            
            <div className="faq-item">
              <p className="question"><strong>Q: Can I edit or delete my published food after someone claimed it?</strong></p>
              <p className="answer">A: Yes, but the claimant will receive a notification that the food has been deleted.</p>
            </div>
            
            <div className="faq-item">
              <p className="question"><strong>Q: What food categories are NOT allowed?</strong></p>
              <p className="answer">A: High-risk items like raw meat, seafood, unpasteurised dairy are excluded for food safety reasons.</p>
            </div>
            
            <div className="faq-item">
              <p className="question"><strong>Q: Is my email visible to other users?</strong></p>
              <p className="answer">A: Your email is only shown to the other party after a claim is initiated. It is not publicly visible on the food card.</p>
            </div>
            
            <div className="faq-item">
              <p className="question"><strong>Q: How do I know if I have new messages?</strong></p>
              <p className="answer">A: A red badge appears next to your avatar showing the number of unread notifications. The badge refreshes every 30 seconds.</p>
            </div>
          </section>
        </div>
        
        <div className="modal-footer">
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default HelpModal;