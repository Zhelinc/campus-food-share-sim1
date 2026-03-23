import { useState } from 'react';
import { Link } from 'react-router-dom';
import { login, register } from '../api/user';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [role, setRole] = useState('user');
  const [invitationCode, setInvitationCode] = useState('');

 const handleSubmit = async (e) => {
  e.preventDefault();

  if (isRegister && password !== confirmPassword) {
    alert('Passwords do not match');
    return;
  }

  try {
    if (isRegister) {
      // 注册成功后，不再存储 token 和自动跳转
      await register(email, password, confirmPassword, role, invitationCode);
      alert('Registration successful! Please check your email to verify your account.');
      // 可选：清空表单
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setInvitationCode('');
      // 切换到登录模式
      setIsRegister(false);
    } else {
      const res = await login(email, password);
      alert('Login successful!');
      localStorage.setItem('token', res.token);
      window.location.href = '/';
    }
  } catch (err) {
    alert(err.response?.data?.message || 'Operation failed, please try again');
  }
};

  return (
    <div style={{ width: '400px', margin: '100px auto' }}>
      <h2 style={{ textAlign: 'center' }}>
        {isRegister ? 'Campus Food Sharing - Register' : 'Campus Food Sharing - Login'}
      </h2>
      <form onSubmit={handleSubmit}>
        <div style={{ margin: '10px 0' }}>
          <label>Campus Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g., test@bupt.edu.cn"
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            required
          />
        </div>
        <div style={{ margin: '10px 0' }}>
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters with uppercase, lowercase, number and special character"
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            required
          />
        </div>

        {isRegister && (
          <>
            <div style={{ margin: '10px 0' }}>
              <label>Confirm Password:</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                required
              />
            </div>

            <div style={{ margin: '10px 0' }}>
              <label>Register as:</label>
              <div>
                <label style={{ marginRight: '20px' }}>
                  <input
                    type="radio"
                    name="role"
                    value="user"
                    checked={role === 'user'}
                    onChange={(e) => setRole(e.target.value)}
                  /> User
                </label>
                <label>
                  <input
                    type="radio"
                    name="role"
                    value="admin"
                    checked={role === 'admin'}
                    onChange={(e) => setRole(e.target.value)}
                  /> Admin
                </label>
              </div>
            </div>

            {role === 'admin' && (
              <div style={{ margin: '10px 0' }}>
                <label>Admin Invitation Code:</label>
                <input
                  type="text"
                  value={invitationCode}
                  onChange={(e) => setInvitationCode(e.target.value)}
                  placeholder="Enter invitation code"
                  style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                  required
                />
              </div>
            )}
          </>
        )}

        <button
          type="submit"
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: '#ff6700',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginTop: '10px'
          }}
        >
          {isRegister ? 'Register' : 'Login'}
        </button>
      </form>

      {!isRegister && (
        <p style={{ textAlign: 'center', marginTop: '10px' }}>
          <Link to="/forgot-password" style={{ color: '#0088ff' }}>Forgot password?</Link>
        </p>
      )}

      <p style={{ textAlign: 'center', marginTop: '10px' }}>
        {isRegister ? (
          <span onClick={() => setIsRegister(false)} style={{ color: '#0088ff', cursor: 'pointer' }}>
            Already have an account? Login here
          </span>
        ) : (
          <span onClick={() => setIsRegister(true)} style={{ color: '#0088ff', cursor: 'pointer' }}>
            No account? Register here
          </span>
        )}
      </p>
    </div>
  );
};

export default Login;