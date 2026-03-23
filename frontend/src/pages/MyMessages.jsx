import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/axios';

const MyMessages = () => {
  const [notifications, setNotifications] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showCounterModal, setShowCounterModal] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [counterTime, setCounterTime] = useState('');
  const [processingClaimId, setProcessingClaimId] = useState(null); // 用于 Accept / Suggest 按钮防重复
  const [counterProcessing, setCounterProcessing] = useState(false); // 用于模态框提交防重复

  const fetchNotifications = async (pageNum = 1) => {
    setLoading(true);
    try {
      const res = await api.get(`/api/notifications?page=${pageNum}&limit=20`);
      setNotifications(res.notifications);
      setTotalPages(res.pagination.pages);
      setPage(res.pagination.page);
    } catch (err) {
      alert('Failed to fetch messages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAsRead = async (notificationId) => {
    try {
      await api.post('/api/notifications/mark-read', { notificationId });
      fetchNotifications(page);
    } catch (err) {
      alert('Operation failed');
    }
  };

  const markAllRead = async () => {
    try {
      await api.post('/api/notifications/mark-read', { all: true });
      fetchNotifications(page);
    } catch (err) {
      alert('Operation failed');
    }
  };

  // 发布者回应认领请求（接受 或 提议新时间）
  const handleClaimResponse = async (notification, action) => {
    const claimId = notification.claimId;
    if (!claimId) return;

    if (action === 'reject_with_counter') {
      setSelectedNotification(notification);
      setCounterTime('');
      setShowCounterModal(true);
      return;
    }

    // 防止重复点击
    if (processingClaimId === claimId) return;
    setProcessingClaimId(claimId);

    try {
      await api.post('/api/claim/respond', { claimId, action });
      alert(`Claim ${action === 'accept' ? 'accepted' : 'rejected'}`);
      fetchNotifications(page);
    } catch (err) {
      alert('Failed to respond: ' + (err.response?.data?.message || err.message));
    } finally {
      setProcessingClaimId(null);
    }
  };

  // 提交反提议（模态框）
  const submitCounterOffer = async () => {
    if (!counterTime) {
      alert('Please select a new pickup time');
      return;
    }
    if (counterProcessing) return;
    setCounterProcessing(true);
    try {
      await api.post('/api/claim/respond', {
        claimId: selectedNotification.claimId,
        action: 'reject_with_counter',
        counterPickupTime: counterTime,
      });
      alert('Counter offer sent');
      setShowCounterModal(false);
      fetchNotifications(page);
    } catch (err) {
      alert('Failed to send counter offer: ' + (err.response?.data?.message || err.message));
    } finally {
      setCounterProcessing(false);
    }
  };

  // 申领者对反提议的回应（接受或拒绝）
  const handleCounterResponse = async (notification, action) => {
    const claimId = notification.claimId;
    if (!claimId) return;
    try {
      await api.post('/api/claim/respond-to-counter', { claimId, action });
      alert(`Counter offer ${action === 'accept' ? 'accepted' : 'rejected'}`);
      fetchNotifications(page);
    } catch (err) {
      alert('Failed to respond: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div style={{ width: '800px', margin: '20px auto' }}>
      <div style={{ marginBottom: '20px' }}>
        <Link to="/" style={{ color: '#ff6700', textDecoration: 'none' }}>
          ← Back to Home
        </Link>
      </div>
      <h2>My Messages</h2>
      <button onClick={markAllRead} style={{ marginBottom: '15px', padding: '5px 10px' }}>
        Mark All as Read
      </button>
      {loading && <p>Loading...</p>}
      {!loading && notifications.length === 0 && <p>No messages</p>}
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {notifications.map((n) => (
          <li
            key={n.id}
            style={{
              padding: '15px',
              marginBottom: '10px',
              backgroundColor: n.isRead ? '#f9f9f9' : '#fff3e0',
              border: '1px solid #ddd',
              borderRadius: '4px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p>{n.content}</p>
                <small>{new Date(n.createdAt).toLocaleString()}</small>

                {/* 发布者收到的认领请求 */}
                {n.type === 'CLAIM_REQUEST' && (
                  <div style={{ marginTop: '10px' }}>
                    <button
                      onClick={() => handleClaimResponse(n, 'accept')}
                      disabled={processingClaimId === n.claimId}
                      style={{
                        marginRight: '10px',
                        backgroundColor: '#4caf50',
                        color: 'white',
                        opacity: processingClaimId === n.claimId ? 0.6 : 1,
                      }}
                    >
                      {processingClaimId === n.claimId ? 'Processing...' : 'Accept'}
                    </button>
                    <button
                      onClick={() => handleClaimResponse(n, 'reject_with_counter')}
                      disabled={processingClaimId === n.claimId}
                      style={{
                        backgroundColor: '#ff9800',
                        color: 'white',
                        opacity: processingClaimId === n.claimId ? 0.6 : 1,
                      }}
                    >
                      {processingClaimId === n.claimId ? 'Processing...' : 'Suggest New Time'}
                    </button>
                  </div>
                )}

                {/* 申领者收到的反提议 */}
                {n.type === 'CLAIM_COUNTER_OFFER' && (
                  <div>
                    <p style={{ marginTop: '8px', color: '#ff9800' }}>
                      {n.content}
                    </p>
                    <div style={{ marginTop: '10px' }}>
                      <button
                        onClick={() => handleCounterResponse(n, 'accept')}
                        style={{ marginRight: '10px', backgroundColor: '#4caf50', color: 'white' }}
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleCounterResponse(n, 'reject')}
                        style={{ backgroundColor: '#f44336', color: 'white' }}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                )}

                {/* 认领确认通知 */}
                {n.type === 'CLAIM_ACCEPTED' && (
                  <p style={{ color: 'green', marginTop: '5px' }}>
                    ✅ Claim confirmed! {n.content}
                  </p>
                )}

                {/* 认领拒绝通知 */}
                {n.type === 'CLAIM_REJECTED' && (
                  <p style={{ color: 'red', marginTop: '5px' }}>
                    ❌ {n.content}
                  </p>
                )}
              </div>
              {!n.isRead && (
                <button onClick={() => markAsRead(n.id)} style={{ fontSize: '12px' }}>
                  Mark as Read
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>

      {totalPages > 1 && (
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '20px' }}>
          <button disabled={page === 1} onClick={() => fetchNotifications(page - 1)}>
            Previous
          </button>
          <span>
            Page {page} / {totalPages}
          </span>
          <button disabled={page === totalPages} onClick={() => fetchNotifications(page + 1)}>
            Next
          </button>
        </div>
      )}

      {/* 反提议模态框 */}
      {showCounterModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
          }}
        >
          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', width: '400px' }}>
            <h3>Suggest New Pickup Time</h3>
            <p>
              Food: {selectedNotification?.content?.split('"')[1] || 'unknown'}
            </p>
            <p>
              Original requested time:{' '}
              {selectedNotification?.content?.match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/)
                ? new Date(
                    selectedNotification.content.match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/)[0]
                  ).toLocaleString()
                : 'Not set'}
            </p>
            <div style={{ margin: '15px 0' }}>
              <label>New Pickup Time:</label>
              <input
                type="datetime-local"
                value={counterTime}
                onChange={(e) => setCounterTime(e.target.value)}
                style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                required
              />
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowCounterModal(false)}>Cancel</button>
              <button
                onClick={submitCounterOffer}
                disabled={counterProcessing}
                style={{ backgroundColor: '#ff6700', color: 'white', opacity: counterProcessing ? 0.6 : 1 }}
              >
                {counterProcessing ? 'Sending...' : 'Send Proposal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyMessages;