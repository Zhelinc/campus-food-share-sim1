import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getUserInfo } from '../api/user';
import { getMyPublishedFoods, updateFood, deleteFood } from '../api/food';
import RatingModal from '../components/RatingModal';
import RatingsViewer from '../components/RatingsViewer';

const MyPublish = () => {
  const [user, setUser] = useState(null);
  const [myFoods, setMyFoods] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentEditFood, setCurrentEditFood] = useState(null);
  const [editFoodData, setEditFoodData] = useState({
    title: '',
    description: '',
    location: '',
    weight: '',
    category: ''
  });
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [currentClaimId, setCurrentClaimId] = useState(null);

  useEffect(() => {
    const initData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          window.location.href = '/login';
          return;
        }
        const userRes = await getUserInfo();
        setUser(userRes.user);
        const foodRes = await getMyPublishedFoods();
        setMyFoods(foodRes.foods || []);
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        } else {
          alert('Failed to load your publications: ' + (err.response?.data?.message || err.message));
        }
      }
    };
    initData();
  }, []);

  const openEditModal = (food) => {
    setCurrentEditFood(food);
    setEditFoodData({
      title: food.title,
      description: food.description || '',
      location: food.location,
      weight: food.weight,
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
      const foodRes = await getMyPublishedFoods();
      setMyFoods(foodRes.foods || []);
    } catch (err) {
      alert('Update failed: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDelete = async (foodId) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await deleteFood(foodId);
        alert('Deleted successfully!');
        const foodRes = await getMyPublishedFoods();
        setMyFoods(foodRes.foods || []);
      } catch (err) {
        alert('Delete failed: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  const openRatingModal = (claimId) => {
    setCurrentClaimId(claimId);
    setShowRatingModal(true);
  };

  const openReviewsModal = (claimId) => {
    setCurrentClaimId(claimId);
    setShowReviewsModal(true);
  };

  const refreshList = async () => {
    const foodRes = await getMyPublishedFoods();
    setMyFoods(foodRes.foods || []);
  };

  return (
    <div style={{ width: '1200px', margin: '0 auto', padding: '20px' }}>
      <div style={{ marginBottom: '20px' }}>
        <Link to="/" style={{ color: '#ff6700', textDecoration: 'none' }}>← Back to Home</Link>
      </div>
      <h2 style={{ margin: '0 0 20px 0', color: '#333' }}>My Publications</h2>

      {myFoods.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px', color: '#999' }}>
          You haven't published any food yet. Go to the homepage and publish some!
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
          {myFoods.map((food) => (
            <div
              key={food.id}
              style={{
                backgroundColor: 'white',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                borderRadius: '8px',
                overflow: 'hidden'
              }}
            >
              <img
                src={food.imageUrl || '/images/blind-box.png'}
                alt={food.title}
                style={{ width: '100%', height: '180px', objectFit: 'cover' }}
              />
              <div style={{ padding: '15px' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '18px' }}>{food.title}</h4>
                <p style={{ margin: '5px 0', color: '#666' }}>Description: {food.description || 'None'}</p>
                <p style={{ margin: '5px 0', color: '#666' }}>Location: {food.location}</p>
                <p style={{ margin: '5px 0', color: '#666' }}>Weight: {food.weight}</p>
                <p style={{ margin: '5px 0', color: '#666' }}>Category: {food.category}</p>
                <p style={{
                  margin: '5px 0',
                  color: food.status === 'AVAILABLE' ? '#4caf50' : '#f44336'
                }}>
                  Status: {food.status === 'AVAILABLE' ? 'Available' : 'Claimed / Completed'}
                </p>
                <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                  {food.completedClaimId ? (
                    <>
                      <button
                        onClick={() => openRatingModal(food.completedClaimId)}
                        style={{
                          flex: 1,
                          padding: '8px',
                          backgroundColor: '#4caf50',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        Rate
                      </button>
                      <button
                        onClick={() => openReviewsModal(food.completedClaimId)}
                        style={{
                          flex: 1,
                          padding: '8px',
                          backgroundColor: '#4299e1',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        Reviews
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => openEditModal(food)}
                        style={{
                          flex: 1,
                          padding: '8px',
                          backgroundColor: '#4299e1',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(food.id)}
                        style={{
                          flex: 1,
                          padding: '8px',
                          backgroundColor: '#f44336',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            width: '500px'
          }}>
            <h3 style={{ margin: '0 0 20px 0' }}>Edit Food</h3>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Title:</label>
              <input
                type="text"
                value={editFoodData.title}
                onChange={(e) => setEditFoodData({ ...editFoodData, title: e.target.value })}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
              />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Description:</label>
              <textarea
                value={editFoodData.description}
                onChange={(e) => setEditFoodData({ ...editFoodData, description: e.target.value })}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd', minHeight: '80px' }}
              />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Location:</label>
              <input
                type="text"
                value={editFoodData.location}
                onChange={(e) => setEditFoodData({ ...editFoodData, location: e.target.value })}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
              />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Weight:</label>
              <input
                type="text"
                value={editFoodData.weight}
                onChange={(e) => setEditFoodData({ ...editFoodData, weight: e.target.value })}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
              />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Category:</label>
              <input
                type="text"
                value={editFoodData.category}
                onChange={(e) => setEditFoodData({ ...editFoodData, category: e.target.value })}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowEditModal(false)} style={{ padding: '8px 16px', backgroundColor: '#ddd', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={submitEdit} style={{ padding: '8px 16px', backgroundColor: '#4299e1', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Rating Modal */}
      {showRatingModal && (
        <RatingModal
          claimId={currentClaimId}
          onClose={() => setShowRatingModal(false)}
          onSuccess={refreshList}
        />
      )}

      {/* Reviews Viewer Modal */}
      {showReviewsModal && (
        <RatingsViewer
          claimId={currentClaimId}
          onClose={() => setShowReviewsModal(false)}
        />
      )}
    </div>
  );
};

export default MyPublish;