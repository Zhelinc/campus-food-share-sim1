import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/axios';
import { getUserRatings } from '../api/rating';

const MyAccount = () => {
  const [user, setUser] = useState(null);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [ratings, setRatings] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get('/api/users/info');
        setUser(res.user);
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        } else {
          console.error(err);
        }
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (user?.id) {
      loadRatings();
    }
  }, [user, page]);

  const loadRatings = async () => {
    try {
      const res = await getUserRatings(user.id, page, limit);
      setRatings(res.ratings);
      setTotalPages(Math.ceil(res.total / limit));
    } catch (err) {
      console.error('Failed to load ratings', err);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      alert('New passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await api.post('/api/users/change-password', { oldPassword, newPassword, confirmNewPassword });
      alert('Password changed successfully');
      setOldPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <div>Loading...</div>;

  return (
    <div style={{ width: '600px', margin: '50px auto' }}>
      <div style={{ marginBottom: '20px' }}>
        <Link to="/" style={{ color: '#ff6700', textDecoration: 'none' }}>← Back to Home</Link>
      </div>
      <h2>My Account</h2>
      <p><strong>Email:</strong> {user.email}</p>
      
      {/* 信誉分显示 - 根据评分人数判断 */}
      <p><strong>Your Reputation:</strong> {
        user.ratingCount >= 2
          ? `${user.avgRating?.toFixed(1)} / 5`
          : 'Insufficient ratings (need ≥2)'
      }</p>

      {/* Reviews About You - 放在修改密码上面 */}
      <h3>Reviews About You</h3>
      {ratings.length === 0 ? (
        <p>No reviews yet.</p>
      ) : (
        ratings.map(r => (
          <div key={r.id} style={{ borderBottom: '1px solid #ccc', padding: '10px 0' }}>
            <div><strong>{r.rater.email}</strong> rated you {r.score}/5</div>
            {r.comment && <div>Comment: {r.comment}</div>}
            <div>Food: {r.claim.Food.title}</div>
            <small>{new Date(r.createdAt).toLocaleString()}</small>
          </div>
        ))
      )}
      {totalPages > 1 && (
        <div style={{ marginTop: '10px', display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</button>
          <span>Page {page} of {totalPages}</span>
          <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
        </div>
      )}

      {/* Change Password 表单 */}
      <h3 style={{ marginTop: '30px' }}>Change Password</h3>
      <form onSubmit={handlePasswordChange}>
        <div style={{ marginBottom: '15px' }}>
          <label>Old Password</label>
          <input
            type="password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            required
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label>New Password</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            required
          />
          <small>At least 6 characters with uppercase, lowercase, number and special character</small>
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label>Confirm New Password</label>
          <input
            type="password"
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '10px 20px',
            backgroundColor: '#ff6700',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {loading ? 'Submitting...' : 'Change Password'}
        </button>
      </form>
    </div>
  );
};

export default MyAccount;