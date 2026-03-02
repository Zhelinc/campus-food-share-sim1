import { useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';

const AdminLayout = () => {
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState('foods');

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Left menu */}
      <div style={{ width: '200px', backgroundColor: '#333', color: 'white', padding: '20px' }}>
        <h3 style={{ margin: '0 0 20px 0', color: '#ff6700' }}>Admin Panel</h3>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li style={{ marginBottom: '10px' }}>
            <Link
              to="/"
              style={{ color: '#ccc', textDecoration: 'none' }}
            >
              Back to Home
            </Link>
          </li>
          <li style={{ marginBottom: '10px' }}>
            <Link
              to="/admin/foods"
              style={{ color: activeMenu === 'foods' ? '#ff6700' : '#ccc', textDecoration: 'none' }}
              onClick={() => setActiveMenu('foods')}
            >
              Food Management
            </Link>
          </li>
          <li style={{ marginBottom: '10px' }}>
            <Link
              to="/admin/users"
              style={{ color: activeMenu === 'users' ? '#ff6700' : '#ccc', textDecoration: 'none' }}
              onClick={() => setActiveMenu('users')}
            >
              User Management
            </Link>
          </li>
        </ul>
        <button
          onClick={() => {
            localStorage.removeItem('token');
            navigate('/login');
          }}
          style={{ marginTop: '20px', padding: '5px 10px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Logout
        </button>
      </div>

      {/* Right content area */}
      <div style={{ flex: 1, padding: '20px', backgroundColor: '#f5f5f5' }}>
        <Outlet />
      </div>
    </div>
  );
};

export default AdminLayout;