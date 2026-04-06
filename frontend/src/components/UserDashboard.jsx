/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './UserDashboard.css';

export default function UserDashboard() {
  // --- ADDED: setUser to instantly update the UI name ---
  const { user, setUser, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('overview'); // Tab state!
  const [donations, setDonations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Settings State
  const [profileName, setProfileName] = useState(user?.name || '');
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [statusMsg, setStatusMsg] = useState(null);

  useEffect(() => {
    if (!user) navigate('/login');
  }, [user, navigate]);

  useEffect(() => {
    const fetchMyDonations = async () => {
      if (!user) return; 
      try {
        const response = await fetch('http://localhost:5000/api/donations/my-donations', {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setDonations(data);
        }
      } catch (err) { console.error("Failed to fetch history", err); }
      setIsLoading(false);
    };
    fetchMyDonations();
  }, [user]);

  // --- SETTINGS HANDLERS ---
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setStatusMsg(null);
    try {
      const res = await fetch('http://localhost:5000/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` },
        body: JSON.stringify({ name: profileName })
      });
      const data = await res.json();
      if (res.ok) {
        // Update LocalStorage and Context immediately!
        localStorage.setItem('ashramUser', JSON.stringify(data)); // Fixed key!
        setUser(data); 
        setStatusMsg({ type: 'success', text: 'Profile name updated successfully!' });
      } else {
        setStatusMsg({ type: 'error', text: data.message });
      }
    } catch (err) { setStatusMsg({ type: 'error', text: 'Failed to update profile.' }); }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setStatusMsg(null);
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return setStatusMsg({ type: 'error', text: 'New passwords do not match.' });
    }

    try {
      const res = await fetch('http://localhost:5000/api/users/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` },
        body: JSON.stringify({ currentPassword: passwordData.currentPassword, newPassword: passwordData.newPassword })
      });
      const data = await res.json();
      if (res.ok) {
        setStatusMsg({ type: 'success', text: 'Password changed successfully!' });
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setStatusMsg({ type: 'error', text: data.message });
      }
    } catch (err) { setStatusMsg({ type: 'error', text: 'Failed to update password.' }); }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null; 

  return (
    <div className="user-dashboard-page">
      <div className="container" style={{ maxWidth: '1000px', margin: '0 auto' }}>
        
        <div className="dashboard-header">
          <h2>🙏 Hari Om, {user.name}</h2>
          <p>Welcome to your personal ashram portal.</p>
        </div>

        {/* --- SIMPLE TAB NAVIGATION --- */}
        <div style={{ display: 'flex', gap: '15px', marginBottom: '30px', justifyContent: 'center' }}>
          <button 
            onClick={() => setActiveTab('overview')} 
            className={`cta-button ${activeTab === 'overview' ? '' : 'outline-btn'}`}
          >
            My Overview
          </button>
          <button 
            onClick={() => setActiveTab('settings')} 
            className={`cta-button ${activeTab === 'settings' ? '' : 'outline-btn'}`}
          >
            ⚙️ Settings
          </button>
        </div>

        {/* --- TAB 1: OVERVIEW --- */}
        {activeTab === 'overview' && (
          <div className="dashboard-content" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px' }}>
            <div className="dashboard-card profile-card">
              <h3>Profile Details</h3>
              <div className="profile-info">
                <p><strong>Name:</strong> {user.name}</p>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Role:</strong> {user.role === 'admin' ? 'Administrator' : 'Devotee'}</p>
              </div>
              <button onClick={handleLogout} className="logout-button">Log Out</button>
            </div>

            <div className="dashboard-card history-card">
              <h3>My Seva (Donation History)</h3>
              {isLoading && <p style={{ color: '#e67e22' }}>Loading your records...</p>}
              {!isLoading && donations.length === 0 ? (
                <div className="empty-state">
                  <p>You haven't made any donations yet.</p>
                  <button onClick={() => navigate('/donate')} className="cta-button outline-btn">Support the Ashram</button>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="history-table">
                    <thead>
                      <tr><th>Date</th><th>Purpose</th><th>Amount</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                      {donations.map((don) => (
                        <tr key={don._id}>
                          <td>{new Date(don.createdAt).toLocaleDateString()}</td>
                          <td>{don.purpose}</td>
                          <td>₹{don.amount}</td>
                          <td><span className={`status-badge ${don.status.toLowerCase()}`}>{don.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- TAB 2: SETTINGS --- */}
        {activeTab === 'settings' && (
          <div className="dashboard-card" style={{ maxWidth: '600px', margin: '0 auto' }}>
            <h3>Account Settings</h3>
            
            {statusMsg && (
              <div style={{ padding: '10px', marginBottom: '20px', borderRadius: '5px', backgroundColor: statusMsg.type === 'success' ? '#2ecc7122' : '#ff475722', color: statusMsg.type === 'success' ? '#2ecc71' : '#ff4757', border: `1px solid ${statusMsg.type === 'success' ? '#2ecc71' : '#ff4757'}` }}>
                {statusMsg.text}
              </div>
            )}

            {/* Form 1: Update Details */}
            <form onSubmit={handleUpdateProfile} style={{ marginBottom: '40px', paddingBottom: '30px', borderBottom: '1px solid #333' }}>
              <h4 style={{ color: '#ccc', marginBottom: '15px' }}>Update Profile</h4>
              <div className="input-group">
                <label>Display Name</label>
                <input type="text" value={profileName} onChange={(e) => setProfileName(e.target.value)} required />
              </div>
              <div className="input-group">
                <label>Email Address</label>
                <input type="email" value={user.email} disabled style={{ backgroundColor: '#1a1a1a', cursor: 'not-allowed', color: '#888' }} />
                <small style={{ color: '#888' }}>Emails cannot be changed as they act as your unique login ID.</small>
              </div>
              <button type="submit" className="cta-button">Save Details</button>
            </form>

            {/* Form 2: Change Password */}
            <form onSubmit={handleUpdatePassword}>
              <h4 style={{ color: '#ccc', marginBottom: '15px' }}>Change Password</h4>
              <div className="input-group">
                <label>Current Password</label>
                <input type="password" value={passwordData.currentPassword} onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})} required />
              </div>
              <div className="input-group">
                <label>New Password</label>
                <input type="password" value={passwordData.newPassword} onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})} required minLength="6" />
              </div>
              <div className="input-group">
                <label>Confirm New Password</label>
                <input type="password" value={passwordData.confirmPassword} onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})} required minLength="6" />
              </div>
              <button type="submit" className="cta-button outline-btn" style={{ borderColor: '#ff4757', color: '#ff4757' }}>Update Password</button>
            </form>

          </div>
        )}

      </div>
    </div>
  );
}