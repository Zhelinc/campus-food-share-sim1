import { useState, useEffect } from 'react';
import { getAllFoods, updateAnyFood, deleteAnyFood } from '../api/admin';

const AdminFoods = () => {
  const [foods, setFoods] = useState([]);
  const [editingFood, setEditingFood] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    quality: '',
    status: 'AVAILABLE'
  });

  useEffect(() => {
    loadFoods();
  }, []);

  const loadFoods = async () => {
    try {
      const res = await getAllFoods();
      setFoods(res.foods || []);
    } catch (err) {
      alert('Failed to load: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleEdit = (food) => {
    setEditingFood(food);
    setFormData({
      title: food.title,
      description: food.description || '',
      location: food.location,
      quality: food.quality,
      status: food.status
    });
  };

  const handleUpdate = async () => {
    try {
      await updateAnyFood(editingFood.id, formData);
      alert('Updated successfully');
      setEditingFood(null);
      loadFoods();
    } catch (err) {
      alert('Update failed: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this food?')) return;
    try {
      await deleteAnyFood(id);
      alert('Deleted successfully');
      loadFoods();
    } catch (err) {
      alert('Delete failed: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div>
      <h2>Food Management</h2>

      {/* Edit modal */}
      {editingFood && (
        <div style={{ border: '1px solid #ccc', padding: '20px', marginBottom: '20px', backgroundColor: 'white' }}>
          <h3>Edit Food</h3>
          <div style={{ marginBottom: '10px' }}>
            <input
              placeholder="Title"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              style={{ width: '100%', padding: '8px' }}
            />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <textarea
              placeholder="Description"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              style={{ width: '100%', padding: '8px', minHeight: '60px' }}
            />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <input
              placeholder="Location"
              value={formData.location}
              onChange={e => setFormData({ ...formData, location: e.target.value })}
              style={{ width: '100%', padding: '8px' }}
            />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <input
              placeholder="Quality"
              value={formData.quality}
              onChange={e => setFormData({ ...formData, quality: e.target.value })}
              style={{ width: '100%', padding: '8px' }}
            />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <select
              value={formData.status}
              onChange={e => setFormData({ ...formData, status: e.target.value })}
              style={{ width: '100%', padding: '8px' }}
            >
              <option value="AVAILABLE">Available</option>
              <option value="CLAIMED">Claimed</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>
          <button onClick={handleUpdate} style={{ marginRight: '10px' }}>Save</button>
          <button onClick={() => setEditingFood(null)}>Cancel</button>
        </div>
      )}

      {/* Food table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white' }}>
        <thead>
          <tr style={{ backgroundColor: '#f0f0f0' }}>
            <th style={{ padding: '10px', border: '1px solid #ddd' }}>ID</th>
            <th style={{ padding: '10px', border: '1px solid #ddd' }}>Title</th>
            <th style={{ padding: '10px', border: '1px solid #ddd' }}>Publisher</th>
            <th style={{ padding: '10px', border: '1px solid #ddd' }}>Status</th>
            <th style={{ padding: '10px', border: '1px solid #ddd' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {foods.map(f => (
            <tr key={f.id}>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>{f.id}</td>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>{f.title}</td>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>{f.publisher?.email}</td>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>{f.status}</td>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                <button onClick={() => handleEdit(f)}>Edit</button>
                <button onClick={() => handleDelete(f.id)} style={{ marginLeft: '5px' }}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminFoods;