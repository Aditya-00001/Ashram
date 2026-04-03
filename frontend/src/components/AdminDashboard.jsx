import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './Admin.css';

// --- TIME FORMATTING HELPERS ---
// Converts "6:30 PM" to "18:30" for the scrollable clock input
const parseTime12to24 = (time12h) => {
  if (!time12h) return '';
  const [time, modifier] = time12h.split(' ');
  let [hours, minutes] = time.split(':');
  if (hours === '12') hours = '00';
  if (modifier === 'PM') hours = (parseInt(hours, 10) + 12).toString();
  return `${hours.padStart(2, '0')}:${minutes}`;
};

// Converts "18:30" back to "6:30 PM" for the database
const parseTime24to12 = (time24h) => {
  if (!time24h) return '';
  let [h, m] = time24h.split(':');
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
};

// Converts "April 15, 2026" to "2026-04-15" for the calendar input
const parseDateToISO = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};


export default function AdminDashboard() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('events');
  
  const [events, setEvents] = useState([]);
  const [donations, setDonations] = useState([]);
  const [messages, setMessages] = useState([]);

  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);
  
  // UPDATED STATE: Splitting time into startTime and endTime for the UI
  const [eventFormData, setEventFormData] = useState({
    title: '', date: '', startTime: '', endTime: '', type: 'Special Event', description: ''
  });

  // --- NEW: Pagination State ---
  const [donationPage, setDonationPage] = useState(1);
  const [totalDonationPages, setTotalDonationPages] = useState(1);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/admin-portal');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (!user || user.role !== 'admin') return;

    const fetchData = async () => {
      const headers = { 'Authorization': `Bearer ${user.token}` };
      try {
        if (activeTab === 'events') {
          const res = await fetch('http://localhost:5000/api/events');
          if (res.ok) setEvents(await res.json());
        } 
        else if (activeTab === 'donations') {
          const res = await fetch(`http://localhost:5000/api/donations?page=${donationPage}&limit=10`, { headers });
          if (res.ok) {
            const data = await res.json();
            setDonations(data.donations); // The array of data
            setTotalDonationPages(data.totalPages); // The math from the backend
          }
        } 
        else if (activeTab === 'messages') {
          const res = await fetch('http://localhost:5000/api/messages', { headers });
          if (res.ok) setMessages(await res.json());
        }
      } catch (error) { console.error("Failed to fetch data:", error); }
    };
    fetchData();
  }, [activeTab, user, donationPage]);

  const handleFormChange = (e) => {
    setEventFormData({ ...eventFormData, [e.target.name]: e.target.value });
  };

  const openAddForm = () => {
    setEventFormData({ title: '', date: '', startTime: '', endTime: '', type: 'Special Event', description: '' });
    setEditingEventId(null);
    setShowEventForm(true);
  };

  const openEditForm = (event) => {
    // Break apart the saved time (e.g., "6:00 PM - 8:30 PM") into start and end for the UI inputs
    let start = '';
    let end = '';
    if (event.time && event.time.includes(' - ')) {
      const times = event.time.split(' - ');
      start = parseTime12to24(times[0]);
      end = parseTime12to24(times[1]);
    } else {
      start = parseTime12to24(event.time);
    }

    setEventFormData({
      title: event.title,
      type: event.type,
      description: event.description,
      date: parseDateToISO(event.date), // Convert for calendar
      startTime: start,
      endTime: end
    });
    
    setEditingEventId(event._id);
    setShowEventForm(true);
  };

  const handleSaveEvent = async (e) => {
    e.preventDefault();
    
    // FORMAT THE DATA FOR THE DATABASE BEFORE SAVING
    // 1. Convert Date back to "Month DD, YYYY" safely
    const d = new Date(eventFormData.date + 'T00:00:00'); 
    const formattedDate = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    // 2. Combine start and end time back into "6:00 PM - 8:30 PM"
    let formattedTime = parseTime24to12(eventFormData.startTime);
    if (eventFormData.endTime) {
      formattedTime += ` - ${parseTime24to12(eventFormData.endTime)}`;
    }

    // 3. Create the payload
    const payload = {
      title: eventFormData.title,
      type: eventFormData.type,
      description: eventFormData.description,
      date: formattedDate,
      time: formattedTime
    };

    const url = editingEventId 
      ? `http://localhost:5000/api/events/${editingEventId}` 
      : 'http://localhost:5000/api/events';
    const method = editingEventId ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const savedEvent = await res.json();
        if (editingEventId) {
          setEvents(events.map(ev => ev._id === editingEventId ? savedEvent : ev));
        } else {
          setEvents([savedEvent, ...events]);
        }
        setShowEventForm(false);
      }
    } catch (error) {
      console.error("Failed to save event:", error);
    }
  };

  const handleDeleteEvent = async (id) => {
    if (window.confirm("Are you sure you want to delete this event?")) {
      const res = await fetch(`http://localhost:5000/api/events/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      if (res.ok) setEvents(events.filter(event => event._id !== id)); 
    }
  };

  const handleMarkAsRead = async (id) => {
    const res = await fetch(`http://localhost:5000/api/messages/${id}/read`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${user.token}` }
    });
    if (res.ok) setMessages(messages.map(msg => msg._id === id ? { ...msg, status: 'read' } : msg));
  };

  const handleLogout = () => {
    logout();
    navigate('/admin-portal');
  };

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="admin-layout">
      
      <aside className="admin-sidebar">
        <h2>Admin Panel</h2>
        <nav className="admin-nav">
          <button className={activeTab === 'events' ? 'active' : ''} onClick={() => { setActiveTab('events'); setShowEventForm(false); }}>📅 Manage Events</button>
          <button className={activeTab === 'donations' ? 'active' : ''} onClick={() => setActiveTab('donations')}>₹ Donations</button>
          <button className={activeTab === 'messages' ? 'active' : ''} onClick={() => setActiveTab('messages')}>✉️ Messages</button>
        </nav>
        <button className="logout-btn" onClick={handleLogout}>Logout</button>
      </aside>

      <main className="admin-content">
        
        {activeTab === 'events' && (
          <div className="admin-panel">
            <div className="panel-header">
              <h3>{showEventForm ? (editingEventId ? 'Edit Event' : 'Create New Event') : 'Upcoming Events'}</h3>
              {!showEventForm && <button className="add-btn" onClick={openAddForm}>+ Add New Event</button>}
            </div>

            {showEventForm ? (
              <form className="admin-form" onSubmit={handleSaveEvent}>
                <div className="form-row">
                  <div className="input-group">
                    <label>Event Title</label>
                    <input type="text" name="title" value={eventFormData.title} onChange={handleFormChange} required placeholder="e.g. Maha Shivaratri" />
                  </div>
                  <div className="input-group">
                    <label>Type</label>
                    <select name="type" value={eventFormData.type} onChange={handleFormChange}>
                      <option value="Special Event">Special Event</option>
                      <option value="Lunar Day">Lunar Day</option>
                      <option value="Karma Yoga">Karma Yoga</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                {/* --- UPDATED: Date and Time Pickers --- */}
                <div className="form-row">
                  <div className="input-group" style={{ flex: 2 }}>
                    <label>Date</label>
                    {/* type="date" creates the native calendar popup! */}
                    <input type="date" name="date" value={eventFormData.date} onChange={handleFormChange} required />
                  </div>
                  <div className="input-group" style={{ flex: 1 }}>
                    <label>Start Time</label>
                    {/* type="time" creates the native scrollable clock popup! */}
                    <input type="time" name="startTime" value={eventFormData.startTime} onChange={handleFormChange} required />
                  </div>
                  <div className="input-group" style={{ flex: 1 }}>
                    <label>End Time</label>
                    <input type="time" name="endTime" value={eventFormData.endTime} onChange={handleFormChange} required />
                  </div>
                </div>

                <div className="input-group">
                  <label>Description</label>
                  <textarea name="description" rows="4" value={eventFormData.description} onChange={handleFormChange} required placeholder="Describe the event details..."></textarea>
                </div>

                <div className="form-actions">
                  <button type="button" className="cancel-btn" onClick={() => setShowEventForm(false)}>Cancel</button>
                  <button type="submit" className="save-btn">{editingEventId ? 'Update Event' : 'Save Event'}</button>
                </div>
              </form>
            ) : (
              <div className="admin-table-container">
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
                    {events.length === 0 ? <tr><td colSpan="4">No events found.</td></tr> : null}
                    {events.map(event => (
                      <tr key={event._id}>
                        <td>{event.date}</td>
                        <td>{event.title}</td>
                        <td>{event.type}</td>
                        <td>
                          <button className="edit-btn" onClick={() => openEditForm(event)}>Edit</button>
                          <button className="delete-btn" onClick={() => handleDeleteEvent(event._id)}>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* DONATIONS TAB */}
        {activeTab === 'donations' && (
          <div className="admin-panel">
            <h3>Recent Donations</h3>
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Donor Name</th>
                    <th>Email</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {donations.length === 0 ? <tr><td colSpan="5">No donations found.</td></tr> : null}
                  {donations.map(don => (
                    <tr key={don._id}>
                      <td>{new Date(don.createdAt).toLocaleDateString()}</td>
                      <td>{don.donorName}</td>
                      <td>{don.email}</td>
                      <td>₹{don.amount}</td>
                      <td><span className={`status ${don.status.toLowerCase()}`}>{don.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* --- PAGINATION CONTROLS (Safely inside the panel!) --- */}
            {totalDonationPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', marginTop: '20px' }}>
                <button 
                  onClick={() => setDonationPage(prev => Math.max(prev - 1, 1))}
                  disabled={donationPage === 1}
                  className="cta-button outline-btn"
                  style={{ padding: '8px 16px', opacity: donationPage === 1 ? 0.5 : 1, cursor: donationPage === 1 ? 'not-allowed' : 'pointer', backgroundColor: 'transparent', color: '#e67e22', border: '1px solid #e67e22', borderRadius: '4px' }}
                >
                  Previous
                </button>
                
                <span style={{ color: '#ccc' }}>
                  Page {donationPage} of {totalDonationPages}
                </span>

                <button 
                  onClick={() => setDonationPage(prev => Math.min(prev + 1, totalDonationPages))}
                  disabled={donationPage === totalDonationPages}
                  className="cta-button outline-btn"
                  style={{ padding: '8px 16px', opacity: donationPage === totalDonationPages ? 0.5 : 1, cursor: donationPage === totalDonationPages ? 'not-allowed' : 'pointer', backgroundColor: 'transparent', color: '#e67e22', border: '1px solid #e67e22', borderRadius: '4px' }}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}  
          
          
        

        {/* MESSAGES TAB */}
        {activeTab === 'messages' && (
          <div className="admin-panel">
            <h3>Contact Inquiries</h3>
            {messages.length === 0 ? <p style={{color: '#ccc'}}>No messages found.</p> : null}
            
            {messages.map(msg => (
              <div key={msg._id} className="message-card" style={{ opacity: msg.status === 'read' ? 0.6 : 1 }}>
                <h4>{msg.name} - {msg.subject}</h4>
                <p className="msg-date">Received: {new Date(msg.createdAt).toLocaleDateString()} | {msg.email}</p>
                <p>"{msg.message}"</p>
                
                {msg.status !== 'read' ? (
                  <button className="reply-btn" onClick={() => handleMarkAsRead(msg._id)}>Mark as Read</button>
                ) : (
                  <span style={{ color: '#888', fontStyle: 'italic', display: 'block', marginTop: '10px' }}>✓ Read</span>
                )}
              </div>
            ))}
          </div>
        )}

      </main>
    </div>
  );
}