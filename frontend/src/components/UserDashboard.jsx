/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import '../styles/UserDashboard.css';
import { jsPDF } from "jspdf";

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

  // --- NEW: User Pujas State ---
  const [myPujas, setMyPujas] = useState([]);
  const [pujaPage, setPujaPage] = useState(1);
  const [totalPujaPages, setTotalPujaPages] = useState(1);

  useEffect(() => {
    if (!user) navigate('/login');
  }, [user, navigate]);

  useEffect(() => {
    const fetchMyDonations = async () => {
      if (!user) return; 
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/donations/my-donations`, {
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

  // --- NEW: Fetch My Pujas ---
  useEffect(() => {
    const fetchPujas = async () => {
      // Only fetch if they actually click the Pujas tab!
      if (activeTab !== 'pujas' || !user) return; 
      
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/pujas/my-pujas?page=${pujaPage}&limit=10`, {
          headers: { 'Authorization': `Bearer ${user.token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setMyPujas(data.pujas);
          setTotalPujaPages(data.totalPages);
        }
      } catch (err) {
        console.error("Failed to fetch pujas", err);
      }
    };

    fetchPujas();
  }, [activeTab, pujaPage, user]); // Refetch if they change tabs or pages

  // --- SETTINGS HANDLERS ---
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setStatusMsg(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users/profile`, {
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
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users/password`, {
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

  // --- PDF RECEIPT GENERATOR ---
  const handleDownloadReceipt = (donation) => {
    // 1. Create a new PDF document (Portrait, Millimeters, A4 size)
    const doc = new jsPDF('p', 'mm', 'a4');

    // 2. Set up fonts and colors
    doc.setFont("helvetica");
    
    // --- HEADER ---
    doc.setTextColor(230, 126, 34); // Ashram Orange
    doc.setFontSize(24);
    doc.text("ACHYUTA ANANTA ASHRAM", 105, 20, { align: "center" });
    
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(12);
    doc.text("Official Donation Receipt", 105, 28, { align: "center" });
    
    // Divider Line
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 35, 190, 35);

    // --- RECEIPT DETAILS ---
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.text("Receipt Details", 20, 50);
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    
    // Left Column
    doc.text(`Date: ${new Date(donation.createdAt).toLocaleDateString()}`, 20, 65);
    doc.text(`Donor Name: ${user.name}`, 20, 75);
    doc.text(`Email: ${user.email}`, 20, 85);
    
    // Right Column
    doc.text(`Receipt ID: ${donation._id.slice(-8).toUpperCase()}`, 120, 65);
    doc.text(`Status: ${donation.status}`, 120, 75);

    // --- DONATION AMOUNT BOX ---
    doc.setFillColor(250, 245, 240); // Light orange background
    doc.rect(20, 100, 170, 30, 'F');
    
    doc.setFontSize(14);
    doc.text("Donation Purpose:", 25, 110);
    doc.setFont("helvetica", "bold");
    doc.text(donation.purpose, 25, 120);
    
    doc.setFontSize(18);
    doc.setTextColor(230, 126, 34);
    doc.text(`Amount: Rs. ${donation.amount}`, 130, 117);

    // --- FOOTER ---
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(10);
    doc.setFont("helvetica", "italic");
    doc.text("May the divine blessings of Achyuta Ananta always be with you.", 105, 150, { align: "center" });
    doc.text("This is a computer-generated receipt and does not require a physical signature.", 105, 160, { align: "center" });

    // 3. Trigger the automatic download
    doc.save(`Ashram_Receipt_${donation._id.slice(-6)}.pdf`);
  };

  if (!user) return null; 
  // --- SAAS SKELETON PULSE DURING OVERVIEW INITIAL FETCH ---
  if (isLoading && activeTab === 'overview') {
    return (
      <div className="user-dashboard-page">
        <div className="container" style={{ maxWidth: '1200px' }}>
          <div style={{ height: '45px', width: '380px', backgroundColor: 'var(--bg-sidebar)', margin: '0 auto 40px', borderRadius: '25px' }} className="skeleton-blink" />
          <div className="dashboard-stats-grid">
            {[1, 2, 3].map(i => (
              <div key={i} className="stat-widget skeleton-blink" style={{ height: '90px', borderRadius: 'var(--radius-button)' }} />
            ))}
          </div>
          <div className="dashboard-content">
            <div className="dashboard-card skeleton-blink" style={{ height: '350px', borderRadius: 'var(--radius-card)' }} />
            <div className="dashboard-card skeleton-blink" style={{ height: '450px', borderRadius: 'var(--radius-card)' }} />
          </div>
        </div>
      </div>
    );
  }

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
          <button className={`cta-button ${activeTab === 'pujas' ? 'active' : 'outline-btn'}`} onClick={() => setActiveTab('pujas')}>
            🙏 My Booked Pujas
          </button>
        </div>

        {/* --- TAB 1: OVERVIEW --- */}
        {/* --- TAB 1: OVERVIEW (MODERNIZED SAAS GRID) --- */}
        {activeTab === 'overview' && (
          <>
            {/* 📊 TOP STATS HIGHLIGHT WIDGETS */}
            <div className="dashboard-stats-grid">
              <div className="stat-widget">
                <div className="stat-label">Total Seva Offerings</div>
                <div className="stat-value" style={{ color: 'var(--color-saffron)' }}>
                  ₹{donations
                    .filter(d => d.status === 'Successful' || d.status === 'successful')
                    .reduce((sum, d) => sum + d.amount, 0)
                    .toLocaleString()}
                </div>
              </div>
              <div className="stat-widget">
                <div className="stat-label">Booked Pujas</div>
                <div className="stat-value">{myPujas.length}</div>
              </div>
              <div className="stat-widget">
                <div className="stat-label">Active Role</div>
                <div className="stat-value" style={{ textTransform: 'capitalize', fontSize: '1.2rem' }}>
                  {user.role === 'admin' ? 'Administrator' : user.role}
                </div>
              </div>
            </div>

            {/* MAIN LAYOUT SPLIT GRID */}
            <div className="dashboard-content">
              
              {/* LEFT WIDGET: ACCOUNT PROFILE CARD */}
              <div className="dashboard-card profile-card">
                <h3>My Spiritual Profile</h3>
                <div className="profile-info">
                  <p><strong>Name:</strong> {user.name}</p>
                  <p><strong>Email Address:</strong> {user.email}</p>
                  <p><strong>Community Role:</strong> <span style={{ textTransform: 'capitalize', color: 'var(--color-saffron)', fontWeight: 'bold' }}>{user.role}</span></p>
                  <p><strong>Secure Encryption:</strong> <span style={{ color: '#2ecc71', fontWeight: '600' }}>🔒 Chat PIN Escrow Active</span></p>
                </div>
                <button onClick={handleLogout} className="logout-button">
                  Disconnect Session
                </button>
              </div>

              {/* RIGHT WIDGET: OFFERING LOGS & TIMELINE ROW */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', minWidth: '0', width: '100%' }}>
                
                {/* Dynamic Donation History Grid */}
                <div className="dashboard-card">
                  <h3>Recent Contribution Logs</h3>
                  {isLoading && <p style={{ color: 'var(--color-saffron)' }}>Opening your records...</p>}
                  
                  {!isLoading && donations.length === 0 ? (
                    <div className="empty-state">
                      <p>You haven't made any donations yet.</p>
                      <button onClick={() => navigate('/donate')} className="cta-button outline-btn">Support the Ashram</button>
                    </div>
                  ) : !isLoading && (
                    <div className="table-responsive">
                      <table className="history-table">
                        <thead>
                          <tr>
                            <th>Offering Purpose</th>
                            <th>Amount</th>
                            <th>Sankalpa Status</th>
                            <th>Offering Date</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {donations.map((don) => (
                            <tr key={don._id}>
                              <td style={{ fontWeight: '600' }}>{don.purpose}</td>
                              <td>₹{don.amount.toLocaleString()}</td>
                              <td>
                                <span className={`status-badge ${don.status.toLowerCase()}`}>
                                  {don.status}
                                </span>
                              </td>
                              <td>{new Date(don.createdAt).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                              <td>
                                {don.status.toLowerCase() === 'successful' ? (
                                  <button 
                                    onClick={() => handleDownloadReceipt(don)}
                                    style={{ 
                                      backgroundColor: 'transparent', 
                                      border: '1px solid var(--color-saffron)', 
                                      color: 'var(--color-saffron)', 
                                      padding: '4px 10px', 
                                      borderRadius: 'var(--radius-button)', 
                                      cursor: 'pointer',
                                      fontSize: '0.8rem',
                                      fontWeight: '600'
                                    }}
                                  >
                                    📄 PDF
                                  </button>
                                ) : (
                                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>N/A</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Interactive Platform Activity Timeline */}
                <div className="dashboard-card">
                  <h3>Account Activity Timeline</h3>
                  <div className="activity-timeline">
                    <div className="timeline-item">
                      <div className="timeline-icon completed"></div>
                      <div className="timeline-content">
                        <div className="timeline-time">Just Now</div>
                        <div className="timeline-title">Secure Chat Vault opened and synchronized successfully</div>
                      </div>
                    </div>
                    {donations.length > 0 && (
                      <div className="timeline-item">
                        <div className="timeline-icon completed"></div>
                        <div className="timeline-content">
                          <div className="timeline-time">
                            {new Date(donations[0].createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </div>
                          <div className="timeline-title">Processed offering for "{donations[0].purpose}"</div>
                        </div>
                      </div>
                    )}
                    <div className="timeline-item">
                      <div className="timeline-icon"></div>
                      <div className="timeline-content">
                        <div className="timeline-time">Account Milestone</div>
                        <div className="timeline-title">Spiritual Profile verified on Ashram Core Database</div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </>
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

        {/* MY PUJAS TAB */}
        {activeTab === 'pujas' && (
          <div className="dashboard-card" style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <h3>My Booked Pujas</h3>
            <p style={{ color: '#ccc', marginBottom: '20px' }}>
              Track the upcoming schedules for your sponsored Nitya Seva and special Pujas.
            </p>

            <div className="table-responsive">
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Puja Name</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {myPujas.length === 0 ? (
                    <tr><td colSpan="4">You haven't booked any Pujas yet.</td></tr>
                  ) : null}
                  {myPujas.map(puja => {
                    const isPast = new Date(puja.date) < new Date(new Date().setHours(0,0,0,0));
                    return (
                      <tr key={puja._id} style={{ opacity: isPast ? 0.6 : 1 }}>
                        <td>{new Date(puja.date).toLocaleDateString()}</td>
                        <td>
                          {/* Re-using your AM/PM time formatter logic here */}
                          {(() => {
                            let [h, m] = puja.time.split(':');
                            const ampm = h >= 12 ? 'PM' : 'AM';
                            h = h % 12 || 12;
                            return `${h}:${m} ${ampm}`;
                          })()}
                        </td>
                        <td style={{ fontWeight: 'bold' }}>{puja.pujaName}</td>
                        <td>
                          <span style={{ 
                            color: isPast ? '#888' : '#2ecc71',
                            backgroundColor: isPast ? '#333' : 'rgba(46, 204, 113, 0.1)',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '0.85rem'
                          }}>
                            {isPast ? 'Completed' : 'Scheduled'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* PUJAS PAGINATION */}
            {totalPujaPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', marginTop: '20px' }}>
                <button 
                  onClick={() => setPujaPage(prev => Math.max(prev - 1, 1))}
                  disabled={pujaPage === 1}
                  className="cta-button outline-btn"
                  style={{ padding: '8px 16px', opacity: pujaPage === 1 ? 0.5 : 1, cursor: pujaPage === 1 ? 'not-allowed' : 'pointer', backgroundColor: 'transparent', color: '#e67e22', border: '1px solid #e67e22', borderRadius: '4px' }}
                >
                  Previous
                </button>
                <span style={{ color: '#ccc' }}>Page {pujaPage} of {totalPujaPages}</span>
                <button 
                  onClick={() => setPujaPage(prev => Math.min(prev + 1, totalPujaPages))}
                  disabled={pujaPage === totalPujaPages}
                  className="cta-button outline-btn"
                  style={{ padding: '8px 16px', opacity: pujaPage === totalPujaPages ? 0.5 : 1, cursor: pujaPage === totalPujaPages ? 'not-allowed' : 'pointer', backgroundColor: 'transparent', color: '#e67e22', border: '1px solid #e67e22', borderRadius: '4px' }}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}