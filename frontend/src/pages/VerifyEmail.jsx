import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../utils/axios';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'error'
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link');
      return;
    }

    const verify = async () => {
      try {
        const res = await api.get(`/api/users/verify-email?token=${token}`);
        setStatus('success');
        setMessage(res.message || 'Email verified successfully!');
      } catch (err) {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Verification failed, link may have expired');
      }
    };

    verify();
  }, [searchParams]);

  return (
    <div style={{ maxWidth: '500px', margin: '100px auto', textAlign: 'center' }}>
      {status === 'verifying' && <p>Verifying, please wait...</p>}
      {status === 'success' && (
        <div>
          <h2 style={{ color: '#4caf50' }}>✅ Verification Successful</h2>
          <p>{message}</p>
          <Link to="/login" style={{ color: '#ff6700' }}>Go to Login</Link>
        </div>
      )}
      {status === 'error' && (
        <div>
          <h2 style={{ color: '#f44336' }}>❌ Verification Failed</h2>
          <p>{message}</p>
          <Link to="/" style={{ color: '#ff6700' }}>Back to Home</Link>
        </div>
      )}
    </div>
  );
};

export default VerifyEmail;