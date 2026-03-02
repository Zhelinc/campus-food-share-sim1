import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/axios';

const MyAccount = () => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      alert('New passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await api.post('/api/users/change-password', { oldPassword, newPassword, confirmNewPassword });
      alert('Password changed successfully!');
      setOldPassword(''); setNewPassword(''); setConfirmNewPassword('');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ width: '400px', margin: '50px auto' }}>
      <div style={{ marginBottom: '20px' }}>
        <Link to="/" style={{ color: '#ff6700', textDecoration: 'none' }}>← Back to Home</Link>
      </div>
      <h2>Change Password</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label>Old Password</label>
          <input type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} style={{ width: '100%', padding: '8px', marginTop: '5px' }} required />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label>New Password</label>
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={{ width: '100%', padding: '8px', marginTop: '5px' }} required />
          <small>At least 6 characters with uppercase, lowercase, number and special character</small>
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label>Confirm New Password</label>
          <input type="password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} style={{ width: '100%', padding: '8px', marginTop: '5px' }} required />
        </div>
        <button type="submit" disabled={loading} style={{ padding: '10px 20px', backgroundColor: '#ff6700', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          {loading ? 'Submitting...' : 'Change Password'}
        </button>
      </form>
    </div>
  );
};

export default MyAccount;