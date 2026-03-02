import { useState, useEffect } from 'react';
import { getAllUsers, deleteUser } from '../api/admin';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await getAllUsers();
      setUsers(res.users || []);
    } catch (err) {
      alert('Failed to load users: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user? This action is irreversible and will also delete all their published and claimed records!')) return;
    try {
      await deleteUser(id);
      alert('User deleted successfully');
      loadUsers();
    } catch (err) {
      alert('Delete failed: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div>
      <h2>User Management</h2>
      {loading && <p>Loading...</p>}
      {!loading && users.length === 0 && <p>No users found</p>}
      {!loading && users.length > 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white' }}>
          <thead>
            <tr style={{ backgroundColor: '#f0f0f0' }}>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>ID</th>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>Email</th>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>Role</th>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>Registered At</th>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{u.id}</td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{u.email}</td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{u.role}</td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{new Date(u.createdAt).toLocaleString()}</td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                  <button onClick={() => handleDelete(u.id)} style={{ backgroundColor: '#f44336', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AdminUsers;