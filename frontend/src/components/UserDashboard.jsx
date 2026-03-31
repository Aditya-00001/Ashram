import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './UserDashboard.css';

export default function UserDashboard() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [donations, setDonations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // 1. Protect the route: If no user is logged in, send them to /login
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  // 2. Fetch the user's personal donation history
  useEffect(() => {
    const fetchMyDonations = async () => {
      if (!user) return; // Safety check
      
      try {
        const response = await fetch('http://localhost:5000/api/donations/my-donations', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            // This is the digital wristband! We pass the token to prove who we are.
            Authorization: `Bearer ${user.token}` 
          }
        });

        if (!response.ok) throw new Error('Failed to fetch donation history');
        
        const data = await response.json();
        setDonations(data);
        setIsLoading(false);
      } catch (err) {
        setError(err.message);
        setIsLoading(false);
      }
    };

    fetchMyDonations();
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Prevent rendering if the user object hasn't loaded yet
  if (!user) return null; 

  return (
    <div className="user-dashboard-page">
      <div className="container">
        
        <div className="dashboard-header">
          <h2>🙏 Hari Om, {user.name}</h2>
          <p>Welcome to your personal ashram portal.</p>
        </div>

        <div className="dashboard-content">
          
          {/* --- PROFILE DETAILS CARD --- */}
          <div className="dashboard-card profile-card">
            <h3>Profile Details</h3>
            <div className="profile-info">
              <p><strong>Name:</strong> {user.name}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Member Since:</strong> 2026</p>
            </div>
            <button onClick={handleLogout} className="logout-button">Log Out</button>
          </div>

          {/* --- DONATION HISTORY CARD --- */}
          <div className="dashboard-card history-card">
            <h3>My Seva (Donation History)</h3>
            
            {isLoading && <p style={{ color: '#e67e22' }}>Loading your records...</p>}
            {error && <p style={{ color: '#ff4757' }}>{error}</p>}

            {!isLoading && !error && (
              <>
                {donations.length === 0 ? (
                  <div className="empty-state">
                    <p>You haven't made any donations yet.</p>
                    <button onClick={() => navigate('/donate')} className="cta-button outline-btn">
                      Support the Ashram
                    </button>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="history-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Purpose</th>
                          <th>Amount</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {donations.map((donation) => (
                          <tr key={donation._id}>
                            {/* Formats the MongoDB timestamp into a readable date */}
                            <td>{new Date(donation.createdAt).toLocaleDateString()}</td>
                            <td>{donation.purpose}</td>
                            <td>₹{donation.amount}</td>
                            <td>
                              <span className={`status-badge ${donation.status.toLowerCase()}`}>
                                {donation.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}