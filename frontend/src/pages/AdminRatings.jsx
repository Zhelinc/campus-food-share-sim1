// frontend/src/pages/AdminRatings.jsx
import { useState, useEffect } from 'react';
import api from '../utils/axios';

const AdminRatings = () => {
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadRatings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/admin/ratings');
      setRatings(res.ratings || []);
    } catch (err) {
      alert('Failed to load ratings: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRatings();
  }, []);

  const handleDelete = async (ratingId) => {
    if (!window.confirm('Are you sure you want to delete this rating? It will affect the user\'s reputation.')) return;
    try {
      await api.delete(`/api/admin/ratings/${ratingId}`);
      alert('Rating deleted successfully');
      loadRatings();
    } catch (err) {
      alert('Delete failed: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div>
      <h2>Rating Management</h2>
      {loading && <p>Loading...</p>}
      {!loading && ratings.length === 0 && <p>No ratings found</p>}
      {!loading && ratings.length > 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white' }}>
          <thead>
            <tr style={{ backgroundColor: '#f0f0f0' }}>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>ID</th>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>Rater</th>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>Rated User</th>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>Score</th>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>Comment</th>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>Food</th>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>Created At</th>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {ratings.map(r => (
              <tr key={r.id}>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{r.id}</td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{r.rater?.email}</td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{r.rated?.email}</td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{r.score}/5</td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{r.comment || '-'}</td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{r.claim?.Food?.title || '-'}</td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{new Date(r.createdAt).toLocaleString()}</td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                  <button onClick={() => handleDelete(r.id)} style={{ backgroundColor: '#f44336', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>
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

export default AdminRatings;