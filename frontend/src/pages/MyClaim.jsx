import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getUserInfo } from '../api/user';

const MyClaim = () => {
  const [user, setUser] = useState(null);
  const [claimedFoods, setClaimedFoods] = useState([]);

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
        setClaimedFoods(userRes.user.claimedFoods || []);
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

  return (
    <div style={{ width: '1200px', margin: '0 auto', padding: '20px' }}>
      <div style={{ marginBottom: '20px' }}>
        <Link to="/" style={{ color: '#ff6700', textDecoration: 'none' }}>← Back to Home</Link>
      </div>
      <h2 style={{ margin: '0 0 20px 0', color: '#333' }}>My Claims</h2>
      
      {claimedFoods.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px', color: '#999' }}>
          You haven't claimed any food yet. Go to the homepage and claim some!
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
          {claimedFoods.map((food) => (
            <div 
              key={food.id} 
              style={{ 
                backgroundColor: 'white', 
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                borderRadius: '8px',
                overflow: 'hidden'
              }}
            >
              <img 
                src={food.imageUrl || '/images/blind-box.png'} 
                alt={food.title}
                style={{ width: '100%', height: '180px', objectFit: 'cover' }}
              />
              <div style={{ padding: '15px' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '18px' }}>{food.title}</h4>
                <p style={{ margin: '5px 0', color: '#666' }}>Location: {food.location || 'Unknown'}</p>
                <p style={{ margin: '5px 0', color: '#666' }}>Quality: {food.quality || 'Unknown'}</p>
                <p style={{ 
                  margin: '5px 0', 
                  color: food.status === 'AVAILABLE' ? '#4caf50' : '#f44336' 
                }}>
                  Status: {food.status === 'AVAILABLE' ? 'Available' : 'Claimed'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyClaim;