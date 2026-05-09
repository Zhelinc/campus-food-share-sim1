import { useState, useEffect } from 'react';
import { getClaimRatings } from '../api/rating';

const RatingsViewer = ({ claimId, onClose }) => {
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getClaimRatings(claimId)
      .then(setRatings)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [claimId]);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', width: '500px', maxHeight: '80vh', overflowY: 'auto' }}>
        <h3>Transaction Reviews</h3>
        {loading && <p>Loading...</p>}
        {!loading && ratings.length === 0 && <p>No reviews yet.</p>}
        {ratings.map(r => (
          <div key={r.id} style={{ borderBottom: '1px solid #eee', marginBottom: '12px', paddingBottom: '8px' }}>
            <div><strong>{r.rater.email}</strong> rated {r.score}/5</div>
            {r.comment && <div><em>“{r.comment}”</em></div>}
            <div><small>{new Date(r.createdAt).toLocaleString()}</small></div>
          </div>
        ))}
        <button onClick={onClose} style={{ marginTop: '10px' }}>Close</button>
      </div>
    </div>
  );
};

export default RatingsViewer;