import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/axios'; 
import { getUserInfo } from '../api/user';
import { getFoodList, claimFood, updateFood, deleteFood, publishFood } from '../api/food';

const Home = () => {
  const [user, setUser] = useState(null);
  const [foodList, setFoodList] = useState([]);
  const [filters, setFilters] = useState({
    campus: '',
    category: '',
    keyword: ''
  });

  const [showEditModal, setShowEditModal] = useState(false);
  const [currentEditFood, setCurrentEditFood] = useState(null);
  const [editFoodData, setEditFoodData] = useState({
    title: '', description: '', location: '', quality: '', category: ''
  });

  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishFoodData, setPublishFoodData] = useState({
    title: '', description: '', campus: '', location: '', quality: '', category: '', allergens: '', imageUrl: ''
  });
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const fileInputRef = useRef(null); // 用于文件上传的自定义按钮

  // 用户菜单状态
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const menuRef = useRef(null);

  // 初始化数据
  useEffect(() => {
    const initData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) { window.location.href = '/login'; return; }

        const userRes = await getUserInfo();
        setUser(userRes.user);

        const foodRes = await getFoodList();
        setFoodList(foodRes.foods || []);
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        } else {
          alert('Failed to load data: ' + (err.response?.data?.message || err.message));
        }
      }
    };
    initData();
  }, []);

  // 获取未读消息数
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const res = await api.get('/api/notifications/unread-count');
        setUnreadCount(res.unreadCount);
      } catch (err) { /* ignore */ }
    };
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setShowUserMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = async () => {
    try {
      const foodRes = await getFoodList({
        ...filters,
        campus: filters.campus || undefined
      });
      setFoodList(foodRes.foods || []);
    } catch (err) {
      alert('Failed to fetch food list: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleClaim = async (foodId) => {
    if (window.confirm('Are you sure you want to claim this food?')) {
      try {
        await claimFood(foodId);
        alert('Claimed successfully! Waiting for the publisher to confirm.');
        handleSearch();
      } catch (err) {
        alert('Claim failed: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  const openEditModal = (food) => {
    setCurrentEditFood(food);
    setEditFoodData({
      title: food.title,
      description: food.description || '',
      location: food.location,
      quality: food.quality,
      category: food.category
    });
    setShowEditModal(true);
  };

  const submitEdit = async () => {
    if (!currentEditFood) return;
    try {
      await updateFood(currentEditFood.id, editFoodData);
      alert('Updated successfully!');
      setShowEditModal(false);
      handleSearch();
    } catch (err) {
      alert('Update failed: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDelete = async (foodId) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await deleteFood(foodId);
        alert('Deleted successfully!');
        handleSearch();
      } catch (err) {
        alert('Delete failed: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setPreviewUrl(reader.result);
    reader.readAsDataURL(file);

    setUploading(true);
    const formData = new FormData();
    formData.append('image', file);
    try {
      const response = await api.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setPublishFoodData({ ...publishFoodData, imageUrl: response.url });
      alert('Image uploaded successfully');
    } catch (err) {
      alert('Upload failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setUploading(false);
    }
  };

  // 前端筛选（基于校区、类别、关键词）
  const filteredFoods = foodList.filter(food => {
    return (
      (filters.campus ? food.campus === filters.campus : true) &&
      (filters.category ? food.category?.trim() === filters.category.trim() : true) &&
      (filters.keyword ? food.title?.includes(filters.keyword) : true)
    );
  });

  return (
    <div style={{ width: '1200px', margin: '0 auto', fontFamily: 'Arial' }}>
      {/* Top bar */}
      <div style={{
        backgroundColor: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        padding: '10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'
      }}>
        {/* Left navigation */}
        <div style={{ display: 'flex', gap: '20px' }}>
          <Link to="/" style={{ color: '#ff6700', textDecoration: 'none' }}>Home</Link>
          <span style={{ color: '#ff6700', fontWeight: 'bold', cursor: 'pointer' }} onClick={() => setShowPublishModal(true)}>Publish Food</span>
          <Link to="/my-publish" style={{ color: '#666', textDecoration: 'none' }}>My Publications</Link>
          <Link to="/my-claim" style={{ color: '#666', textDecoration: 'none' }}>My Claims</Link>
          {user?.role === 'admin' && <Link to="/admin" style={{ color: '#ff6700', textDecoration: 'none' }}>Admin Panel</Link>}
        </div>

        {/* Right user info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ position: 'relative' }} ref={menuRef}>
            <div
              style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <span style={{ color: '#ff6700', marginRight: '5px' }}>{user?.email}</span>
              <div style={{ position: 'relative' }}>
                <span style={{ fontSize: '20px' }}>👤</span>
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute', top: '-5px', right: '-5px', backgroundColor: 'red', color: 'white',
                    borderRadius: '50%', padding: '2px 6px', fontSize: '12px', minWidth: '16px', textAlign: 'center'
                  }}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </div>
            </div>
            {showUserMenu && (
              <div style={{
                position: 'absolute', top: '30px', right: '0', backgroundColor: 'white',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)', borderRadius: '4px', width: '150px', zIndex: 1000
              }}>
                <Link to="/my-account" style={{ display: 'block', padding: '10px', borderBottom: '1px solid #eee', textDecoration: 'none', color: '#333' }}
                  onClick={() => setShowUserMenu(false)}>My Account</Link>
                <Link to="/my-messages" style={{ display: 'block', padding: '10px', textDecoration: 'none', color: '#333', position: 'relative' }}
                  onClick={() => setShowUserMenu(false)}>
                  My Messages
                  {unreadCount > 0 && <span style={{ marginLeft: '5px', backgroundColor: 'red', color: 'white', borderRadius: '50%', padding: '2px 6px', fontSize: '12px' }}>{unreadCount}</span>}
                </Link>
              </div>
            )}
          </div>

          <span style={{ cursor: 'pointer', color: '#f44336' }} onClick={() => { localStorage.removeItem('token'); window.location.href = '/login'; }}>Logout</span>
        </div>
      </div>

      {/* Search box */}
      <div style={{ backgroundColor: '#fff8f0', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input type="text" placeholder="Search food (e.g., Braised Pork)" value={filters.keyword}
            onChange={(e) => setFilters({ ...filters, keyword: e.target.value })} style={{ flex: 1, padding: '10px 15px', border: '1px solid #ff6700', borderRadius: '4px 0 0 4px', outline: 'none' }} />
          <button onClick={handleSearch} style={{ backgroundColor: '#ff6700', color: 'white', border: 'none', padding: '0 20px', borderRadius: '0 4px 4px 0', cursor: 'pointer' }}>Search</button>
        </div>
      </div>

      {/* Left filters + middle list */}
      <div style={{ display: 'flex', gap: '20px' }}>
        {/* Left filter bar */}
        <div style={{ width: '200px', backgroundColor: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', borderRadius: '8px', padding: '15px' }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '16px' }}>Campus</h3>
          <select value={filters.campus} onChange={(e) => setFilters({ ...filters, campus: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}>
            <option value="">All Campuses</option>
            <option value="London">London</option>
            <option value="Haidian">Haidian</option>
            <option value="Shahe">Shahe</option>
            <option value="Hainan">Hainan</option>
          </select>

          <h3 style={{ margin: '20px 0 15px 0', fontSize: '16px' }}>Category</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {['Main Dish', 'Snack', 'Fruit'].map(cat => (
              <div key={cat} onClick={() => setFilters({ ...filters, category: cat })} style={{
                padding: '8px 10px', cursor: 'pointer', borderRadius: '4px',
                backgroundColor: filters.category === cat ? '#fff8f0' : 'white'
              }}>{cat}</div>
            ))}
          </div>
        </div>

        {/* Middle food list */}
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
          {filteredFoods.length === 0 ? (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '50px', color: '#999' }}>No food available, go publish some!</div>
          ) : (
            filteredFoods.map(food => (
              <div key={food.id} style={{ backgroundColor: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', borderRadius: '8px', overflow: 'hidden' }}>
                <img src={food.imageUrl || '/images/blind-box.png'} alt={food.title} style={{ width: '100%', height: '180px', objectFit: 'cover' }} />
                <div style={{ padding: '15px' }}>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '18px' }}>{food.title}</h4>
                  <p style={{ margin: '5px 0', fontSize: '14px' }}>Campus: {food.campus}</p>
                  <p style={{ margin: '5px 0', fontSize: '14px' }}>Location: {food.location}</p>
                  <p style={{ margin: '5px 0', fontSize: '14px' }}>Category: {food.category}</p>
                  <p style={{ margin: '5px 0', fontSize: '14px' }}>Quality: {food.quality}</p>
                  <p style={{ margin: '5px 0', fontSize: '14px', color: food.status === 'AVAILABLE' ? '#4caf50' : '#f44336' }}>
                    Status: {food.status === 'AVAILABLE' ? 'Available' : 'Claimed'}
                  </p>
                  {food.publisherId === user?.id ? (
                    <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                      <button onClick={() => openEditModal(food)} style={{ flex: 1, padding: '10px', backgroundColor: '#4299e1', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Edit</button>
                      <button onClick={() => handleDelete(food.id)} style={{ flex: 1, padding: '10px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Delete</button>
                    </div>
                  ) : (
                    <button disabled={food.status !== 'AVAILABLE'} onClick={() => handleClaim(food.id)} style={{
                      width: '100%', marginTop: '15px', padding: '10px', backgroundColor: '#ff6700', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer',
                      opacity: food.status !== 'AVAILABLE' ? 0.6 : 1
                    }}>
                      {food.status === 'AVAILABLE' ? 'Claim Now' : 'Already Claimed'}
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', width: '500px' }}>
            <h3 style={{ margin: '0 0 20px 0' }}>Edit Food</h3>
            <div style={{ marginBottom: '15px' }}>
              <label>Title:</label>
              <input type="text" value={editFoodData.title} onChange={e => setEditFoodData({ ...editFoodData, title: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label>Description:</label>
              <textarea value={editFoodData.description} onChange={e => setEditFoodData({ ...editFoodData, description: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd', minHeight: '80px' }} />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label>Campus:</label>
              <input type="text" value={editFoodData.campus} onChange={e => setEditFoodData({ ...editFoodData, campus: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label>Location:</label>
              <input type="text" value={editFoodData.location} onChange={e => setEditFoodData({ ...editFoodData, location: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label>Quality:</label>
              <input type="text" value={editFoodData.quality} onChange={e => setEditFoodData({ ...editFoodData, quality: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label>Category:</label>
              <input type="text" value={editFoodData.category} onChange={e => setEditFoodData({ ...editFoodData, category: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} />
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowEditModal(false)} style={{ padding: '8px 16px', backgroundColor: '#ddd', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={submitEdit} style={{ padding: '8px 16px', backgroundColor: '#4299e1', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Publish Modal */}
      {showPublishModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', width: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ margin: '0 0 20px 0' }}>Publish New Food</h3>
            <div style={{ marginBottom: '15px' }}>
              <label>Title *</label>
              <input type="text" value={publishFoodData.title} onChange={e => setPublishFoodData({ ...publishFoodData, title: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} placeholder="e.g., Braised Pork" />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label>Description</label>
              <textarea value={publishFoodData.description} onChange={e => setPublishFoodData({ ...publishFoodData, description: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd', minHeight: '80px' }} placeholder="Detailed description..." />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label>Campus *</label>
              <select value={publishFoodData.campus} onChange={e => setPublishFoodData({ ...publishFoodData, campus: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} required>
                <option value="">Select Campus</option>
                <option value="London">London</option>
                <option value="Haidian">Haidian</option>
                <option value="Shahe">Shahe</option>
                <option value="Hainan">Hainan</option>
              </select>
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label>Location *</label>
              <input type="text" value={publishFoodData.location} onChange={e => setPublishFoodData({ ...publishFoodData, location: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} placeholder="e.g., 2nd Floor, Canteen 1" />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label>Quality *</label>
              <select value={publishFoodData.quality} onChange={e => setPublishFoodData({ ...publishFoodData, quality: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}>
                <option value="">Select</option>
                <option value="Fresh">Fresh</option>
                <option value="Near Expiry">Near Expiry</option>
                <option value="Opened">Opened</option>
              </select>
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label>Category</label>
              <input type="text" value={publishFoodData.category} onChange={e => setPublishFoodData({ ...publishFoodData, category: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} placeholder="e.g., Main Dish, Snack" />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label>Allergens (comma separated)</label>
              <input type="text" value={publishFoodData.allergens} onChange={e => setPublishFoodData({ ...publishFoodData, allergens: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} placeholder="e.g., peanuts, seafood" />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label>Food Image</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  disabled={uploading}
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current.click()}
                  disabled={uploading}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#f0f0f0',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Choose File
                </button>
                <span>{publishFoodData.imageUrl ? 'File selected' : 'No file chosen'}</span>
              </div>
              {uploading && <p style={{ color: '#ff6700' }}>Uploading...</p>}
              {previewUrl && (
                <div>
                  <img src={previewUrl} alt="Preview" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '4px', marginTop: '10px' }} />
                </div>
              )}
              {publishFoodData.imageUrl && !previewUrl && (
                <div>
                  <img src={publishFoodData.imageUrl} alt="Uploaded" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '4px', marginTop: '10px' }} />
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => { setShowPublishModal(false); setPublishFoodData({ title: '', description: '', campus: '', location: '', quality: '', category: '', allergens: '', imageUrl: '' }); setPreviewUrl(''); }} style={{ padding: '8px 16px', backgroundColor: '#ddd', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={async () => {
                if (!publishFoodData.title || !publishFoodData.campus || !publishFoodData.location || !publishFoodData.quality) {
                  alert('Please fill in title, campus, location and quality');
                  return;
                }
                try {
                  const submitData = {
                    ...publishFoodData,
                    allergens: publishFoodData.allergens ? publishFoodData.allergens.split(',').map(s => s.trim()) : []
                  };
                  await publishFood(submitData);
                  alert('Published successfully!');
                  setShowPublishModal(false);
                  handleSearch();
                  setPublishFoodData({ title: '', description: '', campus: '', location: '', quality: '', category: '', allergens: '', imageUrl: '' });
                  setPreviewUrl('');
                } catch (err) {
                  alert('Publish failed: ' + (err.response?.data?.message || err.message));
                }
              }} disabled={uploading} style={{ padding: '8px 16px', backgroundColor: '#ff6700', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', opacity: uploading ? 0.6 : 1 }}>
                {uploading ? 'Uploading...' : 'Publish'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;