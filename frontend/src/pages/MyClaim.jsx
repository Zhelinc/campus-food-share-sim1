import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getUserInfo } from '../api/user';
import RatingModal from '../components/RatingModal';
import RatingsViewer from '../components/RatingsViewer';

const MyClaim = () => {
  const [user, setUser] = useState(null);
  const [claims, setClaims] = useState([]);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [currentClaimId, setCurrentClaimId] = useState(null);

  useEffect(() => {
    const initData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          window.location.href = '/login';
          return;
        }
        const userRes = await getUserInfo();
        setUser(userRes.user);
        // 注意：后端 getUserInfo 返回的 claims 数组（每个 claim 包含 id 和 Food）
        setClaims(userRes.user.claims || []);
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        } else {
          alert('Failed to load claims: ' + (err.response?.data?.message || err.message));
        }
      }
    };
    initData();
  }, []);

  const openRatingModal = (claimId) => {
    setCurrentClaimId(claimId);
    setShowRatingModal(true);
  };

  const openReviewsModal = (claimId) => {
    setCurrentClaimId(claimId);
    setShowReviewsModal(true);
  };

  const refreshClaims = async () => {
    const userRes = await getUserInfo();
    setClaims(userRes.user.claims || []);
  };

  return (
    <div style={{ width: '1200px', margin: '0 auto', padding: '20px' }}>
      <div style={{ marginBottom: '20px' }}>
        <Link to="/" style={{ color: '#ff6700', textDecoration: 'none' }}>← Back to Home</Link>
      </div>
      <h2 style={{ margin: '0 0 20px 0', color: '#333' }}>My Claims</h2>

      {claims.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px', color: '#999' }}>
          You haven't claimed any food yet. Go to the homepage and claim some!
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
          {claims.map((claim) => (
            <div
              key={claim.id}
              style={{
                backgroundColor: 'white',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                borderRadius: '8px',
                overflow: 'hidden'
              }}
            >
              <img
                src={claim.Food.imageUrl || '/images/blind-box.png'}
                alt={claim.Food.title}
                style={{ width: '100%', height: '180px', objectFit: 'cover' }}
              />
              <div style={{ padding: '15px' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '18px' }}>{claim.Food.title}</h4>
                <p style={{ margin: '5px 0', color: '#666' }}>Location: {claim.Food.location || 'Unknown'}</p>
                <p style={{ margin: '5px 0', color: '#666' }}>Weight: {claim.Food.weight || 'Unknown'}</p>
                <p style={{
                  margin: '5px 0',
                  color: claim.Food.status === 'AVAILABLE' ? '#4caf50' : '#f44336'
                }}>
                  Status: {claim.Food.status === 'AVAILABLE' ? 'Available' : 'Completed'}
                </p>
                {claim.Food.status === 'COMPLETED' && (
                  <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                    <button
                      onClick={() => openRatingModal(claim.id)}
                      style={{
                        flex: 1,
                        padding: '8px',
                        backgroundColor: '#4caf50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Rate
                    </button>
                    <button
                      onClick={() => openReviewsModal(claim.id)}
                      style={{
                        flex: 1,
                        padding: '8px',
                        backgroundColor: '#4299e1',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Reviews
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showRatingModal && (
        <RatingModal
          claimId={currentClaimId}
          onClose={() => setShowRatingModal(false)}
          onSuccess={refreshClaims}
        />
      )}
      {showReviewsModal && (
        <RatingsViewer
          claimId={currentClaimId}
          onClose={() => setShowReviewsModal(false)}
        />
      )}
    </div>
  );
};

export default MyClaim;