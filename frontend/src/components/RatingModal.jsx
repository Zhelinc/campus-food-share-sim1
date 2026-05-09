import { useState } from 'react';
import { createRating } from '../api/rating';

const RatingModal = ({ claimId, onClose, onSuccess }) => {
  const [score, setScore] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await createRating(claimId, score, comment);
      alert('Rating submitted successfully');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit rating');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', width: '400px' }}>
        <h3>Rate this transaction</h3>
        <div style={{ marginBottom: '15px' }}>
          <label>Score (0-5): </label>
          <input type="number" min="0" max="5" step="1" value={score} onChange={e => setScore(Number(e.target.value))} style={{ width: '100%', padding: '8px' }} />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label>Comment (optional): </label>
          <textarea value={comment} onChange={e => setComment(e.target.value)} style={{ width: '100%', padding: '8px', minHeight: '80px' }} />
        </div>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button onClick={onClose}>Cancel</button>
          <button onClick={handleSubmit} disabled={loading} style={{ backgroundColor: '#ff6700', color: 'white' }}>{loading ? 'Submitting...' : 'Submit'}</button>
        </div>
      </div>
    </div>
  );
};

export default RatingModal;