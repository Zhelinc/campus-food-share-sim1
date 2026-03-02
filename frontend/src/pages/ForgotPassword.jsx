import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/axios';

const ForgotPassword = () => {
  const [step, setStep] = useState(1); // 1: enter email, 2: enter code and new password
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/api/users/forgot-password', { email });
      setMessage('Verification code has been sent to your email (simulated). Please check.');
      setStep(2);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send code');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      alert('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await api.post('/api/users/reset-password', {
        email,
        code,
        newPassword,
        confirmNewPassword,
      });
      alert('Password reset successful! Please login with your new password.');
      window.location.href = '/login';
    } catch (err) {
      alert(err.response?.data?.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ width: '400px', margin: '100px auto' }}>
      <h2 style={{ textAlign: 'center' }}>Forgot Password</h2>
      {step === 1 ? (
        <form onSubmit={handleSendCode}>
          <div style={{ marginBottom: '15px' }}>
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: '#ff6700',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            {loading ? 'Sending...' : 'Send Verification Code'}
          </button>
          {message && <p style={{ color: 'green', marginTop: '10px' }}>{message}</p>}
        </form>
      ) : (
        <form onSubmit={handleReset}>
          <div style={{ marginBottom: '15px' }}>
            <label>Verification Code</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
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
              width: '100%',
              padding: '10px',
              backgroundColor: '#ff6700',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      )}
      <p style={{ textAlign: 'center', marginTop: '10px' }}>
        <Link to="/login" style={{ color: '#0088ff' }}>Back to Login</Link>
      </p>
    </div>
  );
};

export default ForgotPassword;