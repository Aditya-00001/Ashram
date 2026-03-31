import React, { useState } from 'react';
import './Admin.css';

export default function AdminDashboard() {
  // State to handle which tab the admin is currently viewing
  const [activeTab, setActiveTab] = useState('events');

  return (
    <div className="admin-layout">
      
      {/* --- SIDEBAR --- */}
      <aside className="admin-sidebar">
        <h2>Admin Panel</h2>
        <nav className="admin-nav">
          <button 
            className={activeTab === 'events' ? 'active' : ''} 
            onClick={() => setActiveTab('events')}
          >
            📅 Manage Events
          </button>
          <button 
            className={activeTab === 'donations' ? 'active' : ''} 
            onClick={() => setActiveTab('donations')}
          >
            ₹ Donations
          </button>
          <button 
            className={activeTab === 'messages' ? 'active' : ''} 
            onClick={() => setActiveTab('messages')}
          >
            ✉️ Messages
          </button>
        </nav>
        <button className="logout-btn">Logout</button>
      </aside>

      {/* --- MAIN CONTENT AREA --- */}
      <main className="admin-content">
        
        {/* EVENTS TAB */}
        {activeTab === 'events' && (
          <div className="admin-panel">
            <div className="panel-header">
              <h3>Upcoming Events</h3>
              <button className="add-btn">+ Add New Event</button>
            </div>
            {/* Table for Events */}
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {/* Mock Data - Will come from GET /api/events */}
                <tr>
                  <td>April 2, 2026</td>
                  <td>Chaitra Purnima Special Puja</td>
                  <td>Special Event</td>
                  <td>
                    <button className="edit-btn">Edit</button>
                    <button className="delete-btn">Delete</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* DONATIONS TAB */}
        {activeTab === 'donations' && (
          <div className="admin-panel">
            <h3>Recent Donations (Razorpay)</h3>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Donor Name</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {/* Mock Data - Will come from GET /api/donations */}
                <tr>
                  <td>Mar 30, 2026</td>
                  <td>Rahul Sharma</td>
                  <td>₹5,000</td>
                  <td><span className="status success">Successful</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* MESSAGES TAB */}
        {activeTab === 'messages' && (
          <div className="admin-panel">
            <h3>Contact Inquiries</h3>
            <div className="message-card">
              <h4>Aditi Verma - Volunteering (Seva)</h4>
              <p className="msg-date">Received: Mar 29, 2026</p>
              <p>"Hari Om. I would love to come and help in the kitchen this weekend. What time should I arrive?"</p>
              <button className="reply-btn">Mark as Read</button>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}