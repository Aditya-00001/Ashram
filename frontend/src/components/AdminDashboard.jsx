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
    title: '', date: '', startTime: '', endTime: '', type: 'Special Event', description: '', image: null
  });

  // --- NEW: Pagination State ---
  const [donationPage, setDonationPage] = useState(1);
  const [totalDonationPages, setTotalDonationPages] = useState(1);

  const [eventPage, setEventPage] = useState(1);
  const [totalEventPages, setTotalEventPages] = useState(1);
  
  const [messagePage, setMessagePage] = useState(1);
  const [totalMessagePages, setTotalMessagePages] = useState(1);

  // --- NEW: Gallery State ---
  const [galleryImages, setGalleryImages] = useState([]);
  const [galleryPage, setGalleryPage] = useState(1);
  const [totalGalleryPages, setTotalGalleryPages] = useState(1);
  
  // --- NEW: Newsletter State ---
  const [newsletterData, setNewsletterData] = useState({ subject: '', message: '' });
  const [isSendingNewsletter, setIsSendingNewsletter] = useState(false);
  const [newsletterStatus, setNewsletterStatus] = useState('');

  const [galleryFormData, setGalleryFormData] = useState({ 
    images: [], type: 'Archive', eventId: '', caption: '' 
  });
  const [isUploading, setIsUploading] = useState(false);

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
          const res = await fetch(`http://localhost:5000/api/events?page=${eventPage}&limit=10`);
          // --- FIX: Extract the array and the page count ---
          if (res.ok) {
            const data = await res.json();
            setEvents(data.events); 
            setTotalEventPages(data.totalPages);
          }
        } 
        else if (activeTab === 'donations') {
          const res = await fetch(`http://localhost:5000/api/donations?page=${donationPage}&limit=10`, { headers });
          if (res.ok) {
            const data = await res.json();
            setDonations(data.donations); 
            setTotalDonationPages(data.totalPages); 
          }
        } 
        else if (activeTab === 'messages') {
          const res = await fetch(`http://localhost:5000/api/messages?page=${messagePage}&limit=10`, { headers });
          // --- FIX: Extract the array and the page count ---
          if (res.ok) {
            const data = await res.json();
            setMessages(data.messages);
            setTotalMessagePages(data.totalPages);
          }
        }
        else if (activeTab === 'gallery') {
          const res = await fetch(`http://localhost:5000/api/gallery?page=${galleryPage}&limit=50`, { headers });
          if (res.ok) {
            const data = await res.json();
            setGalleryImages(data.images);
            setTotalGalleryPages(data.totalPages);
          }
        }
      } catch (error) { console.error("Failed to fetch data:", error); }
    };
    fetchData();
  }, [activeTab, user, donationPage, eventPage, messagePage, galleryPage]);
  const handleFormChange = (e) => {
    setEventFormData({ ...eventFormData, [e.target.name]: e.target.value });
  };

  // 2. Add this NEW function to catch the image file
  const handleFileChange = (e) => {
    setEventFormData({ ...eventFormData, image: e.target.files[0] });
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

    // 3. Create a FormData object instead of standard JSON
    const formData = new FormData();
    formData.append('title', eventFormData.title);
    formData.append('type', eventFormData.type);
    formData.append('description', eventFormData.description);
    formData.append('date', formattedDate);
    formData.append('time', formattedTime);
    
    // Only append the image if the user actually selected one!
    if (eventFormData.image) {
      formData.append('image', eventFormData.image);
    }
    

    const url = editingEventId 
      ? `http://localhost:5000/api/events/${editingEventId}` 
      : 'http://localhost:5000/api/events';
    const method = editingEventId ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Authorization': `Bearer ${user.token}` }, 
        body: formData // Send the formData object!
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

  // --- GALLERY HANDLERS ---
   const handleGalleryFileChange = (e) => {
    // Convert the FileList object into a standard array
    setGalleryFormData({ ...galleryFormData, images: Array.from(e.target.files) });
  };

  const handleGalleryUpload = async (e) => {
    e.preventDefault();
    if (galleryFormData.images.length === 0) return alert("Please select at least one image!");
    
    setIsUploading(true);
    const formData = new FormData();
    
    // --- UPDATED: Loop through and append every selected image ---
    galleryFormData.images.forEach(file => {
      formData.append('images', file); 
    });
    
    formData.append('type', galleryFormData.type);
    formData.append('caption', galleryFormData.caption);
    if (galleryFormData.type === 'Event' && galleryFormData.eventId) {
      formData.append('eventId', galleryFormData.eventId);
    }

    try {
      const res = await fetch('http://localhost:5000/api/gallery', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${user.token}` },
        body: formData
      });

      if (res.ok) {
        const newImgs = await res.json();
        // Add all new images to the UI
        setGalleryImages([...newImgs, ...galleryImages]); 
        setGalleryFormData({ images: [], type: 'Archive', eventId: '', caption: '' });
        document.getElementById('galleryFileInput').value = ''; 
      }
    } catch (err) { console.error("Upload failed", err); }
    setIsUploading(false);
  };

  const handleDeleteGalleryImage = async (id) => {
    if (window.confirm("Delete this image permanently from the database and Cloudinary?")) {
      const res = await fetch(`http://localhost:5000/api/gallery/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      if (res.ok) setGalleryImages(galleryImages.filter(img => img._id !== id));
    }
  };


  if (!user || user.role !== 'admin') return null;

 
  // --- NEWSLETTER HANDLER ---
  const handleSendNewsletter = async (e) => {
    e.preventDefault();
    if (!window.confirm("Are you sure you want to broadcast this to ALL verified users?")) return;

    setIsSendingNewsletter(true);
    setNewsletterStatus('');

    try {
      const res = await fetch('http://localhost:5000/api/newsletter/send', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}` 
        },
        body: JSON.stringify(newsletterData)
      });

      const data = await res.json();
      
      if (res.ok) {
        setNewsletterStatus({ type: 'success', text: data.message });
        setNewsletterData({ subject: '', message: '' }); // Clear the form
      } else {
        setNewsletterStatus({ type: 'error', text: data.message });
      }
    } catch (err) {
      setNewsletterStatus({ type: 'error', text: 'Failed to connect to the server.' });
    }
    
    setIsSendingNewsletter(false);
  };

  // --- GROUP GALLERY IMAGES FOR ADMIN UI ---
  const groupedAlbums = {};
  const archives = [];
  
  galleryImages.forEach(img => {
    if (img.type === 'Event' && img.eventId) {
      const eId = img.eventId._id || img.eventId;
      const eTitle = img.eventId.title || 'Unknown Event';
      if (!groupedAlbums[eId]) {
        groupedAlbums[eId] = { eventId: eId, eventTitle: eTitle, images: [] };
      }
      groupedAlbums[eId].images.push(img);
    } else {
      archives.push(img);
    }
  });
 
 
  return (
    <div className="admin-layout">
      
      <aside className="admin-sidebar">
        <h2>Admin Panel</h2>
        <nav className="admin-nav">
          <button className={activeTab === 'events' ? 'active' : ''} onClick={() => { setActiveTab('events'); setShowEventForm(false); }}>📅 Manage Events</button>
          <button className={activeTab === 'donations' ? 'active' : ''} onClick={() => setActiveTab('donations')}>₹ Donations</button>
          <button className={activeTab === 'messages' ? 'active' : ''} onClick={() => setActiveTab('messages')}>✉️ Messages</button>
          <button className={activeTab === 'gallery' ? 'active' : ''} onClick={() => setActiveTab('gallery')}>🖼️ Gallery</button>
          <button className={activeTab === 'newsletter' ? 'active' : ''} onClick={() => setActiveTab('newsletter')}>📢 Broadcast</button>
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
                {/* --- NEW: Image Upload Field --- */}
                <div className="input-group">
                  <label>Event Banner Image (Optional)</label>
                  <input 
                    type="file" 
                    name="image" 
                    accept="image/*" 
                    onChange={handleFileChange} 
                    style={{ padding: '10px 0' }}
                  />
                  {/* Quick visual feedback if they are editing an event that already has an image */}
                  {editingEventId && !eventFormData.image && (
                    <small style={{ color: '#888' }}>Leave blank to keep the current image.</small>
                  )}
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
              {/* EVENTS PAGINATION */}
            {totalEventPages > 1 && !showEventForm && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', marginTop: '20px' }}>
                <button onClick={() => setEventPage(prev => Math.max(prev - 1, 1))} disabled={eventPage === 1} className="cta-button outline-btn" style={{ padding: '8px 16px', opacity: eventPage === 1 ? 0.5 : 1, cursor: eventPage === 1 ? 'not-allowed' : 'pointer', backgroundColor: 'transparent', color: '#e67e22', border: '1px solid #e67e22', borderRadius: '4px' }}>Previous</button>
                <span style={{ color: '#ccc' }}>Page {eventPage} of {totalEventPages}</span>
                <button onClick={() => setEventPage(prev => Math.min(prev + 1, totalEventPages))} disabled={eventPage === totalEventPages} className="cta-button outline-btn" style={{ padding: '8px 16px', opacity: eventPage === totalEventPages ? 0.5 : 1, cursor: eventPage === totalEventPages ? 'not-allowed' : 'pointer', backgroundColor: 'transparent', color: '#e67e22', border: '1px solid #e67e22', borderRadius: '4px' }}>Next</button>
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
            {/* MESSAGES PAGINATION */}
            {totalMessagePages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', marginTop: '20px' }}>
                <button onClick={() => setMessagePage(prev => Math.max(prev - 1, 1))} disabled={messagePage === 1} className="cta-button outline-btn" style={{ padding: '8px 16px', opacity: messagePage === 1 ? 0.5 : 1, cursor: messagePage === 1 ? 'not-allowed' : 'pointer', backgroundColor: 'transparent', color: '#e67e22', border: '1px solid #e67e22', borderRadius: '4px' }}>Previous</button>
                <span style={{ color: '#ccc' }}>Page {messagePage} of {totalMessagePages}</span>
                <button onClick={() => setMessagePage(prev => Math.min(prev + 1, totalMessagePages))} disabled={messagePage === totalMessagePages} className="cta-button outline-btn" style={{ padding: '8px 16px', opacity: messagePage === totalMessagePages ? 0.5 : 1, cursor: messagePage === totalMessagePages ? 'not-allowed' : 'pointer', backgroundColor: 'transparent', color: '#e67e22', border: '1px solid #e67e22', borderRadius: '4px' }}>Next</button>
              </div>
            )}
          </div>
        )}

        {/* GALLERY TAB */}
        {activeTab === 'gallery' && (
          <div className="admin-panel">
            <h3>Manage Ashram Gallery</h3>
            
            {/* UPLOAD FORM */}
            <form className="admin-form" onSubmit={handleGalleryUpload} style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#2a2a2a', borderRadius: '8px' }}>
              <div className="form-row">
                <div className="input-group">
                  <label>Select Image</label>
                  <input type="file" id="galleryFileInput" accept="image/*" multiple onChange={handleGalleryFileChange} required />
                  <small style={{display: 'block', color: '#888', marginTop: '5px'}}>Hold Ctrl/Cmd to select multiple images</small>
                </div>
                <div className="input-group">
                  <label>Image Type</label>
                  <select value={galleryFormData.type} onChange={(e) => setGalleryFormData({...galleryFormData, type: e.target.value})}>
                    <option value="Archive">General Archive (Ashram, Daily Life)</option>
                    <option value="Event">Specific Event Album</option>
                  </select>
                </div>
              </div>

              {/* Only show Event dropdown if they select 'Event' type */}
              {galleryFormData.type === 'Event' && (
                <div className="input-group">
                  <label>Link to Event</label>
                  <select value={galleryFormData.eventId} onChange={(e) => setGalleryFormData({...galleryFormData, eventId: e.target.value})} required>
                    <option value="">-- Select an Event --</option>
                    {(events || []).map(ev => (
                      <option key={ev._id} value={ev._id}>{ev.title} ({ev.date})</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="input-group">
                <label>Caption (Optional)</label>
                <input type="text" value={galleryFormData.caption} onChange={(e) => setGalleryFormData({...galleryFormData, caption: e.target.value})} placeholder="e.g., Morning Aarti by the river" />
              </div>

              <button type="submit" className="cta-button submit-btn" disabled={isUploading}>
                {isUploading ? 'Uploading to Cloudinary...' : 'Upload Image'}
              </button>
            </form>

            {/* --- EVENT ALBUMS --- */}
            {Object.values(groupedAlbums).map(album => (
              <div key={album.eventId} style={{ marginBottom: '40px', backgroundColor: '#2a2a2a', padding: '20px', borderRadius: '8px', borderLeft: '4px solid #e67e22' }}>
                
                {/* Album Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #444', paddingBottom: '15px', marginBottom: '20px' }}>
                  <div>
                    <h4 style={{ color: '#e67e22', margin: '0 0 5px 0', fontSize: '1.2rem' }}>📁 {album.eventTitle}</h4>
                    <span style={{ color: '#888', fontSize: '0.9rem' }}>{album.images.length} Photos in this album</span>
                  </div>
                  {/* Shortcut to add more photos to this specific event */}
                  <button 
                    onClick={() => {
                      setGalleryFormData({...galleryFormData, type: 'Event', eventId: album.eventId});
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    style={{ backgroundColor: 'transparent', border: '1px solid #e67e22', color: '#e67e22', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    + Add Photos Here
                  </button>
                </div>
                
                {/* Album Mini-Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '15px' }}>
                  {album.images.map(img => (
                    <div key={img._id} style={{ backgroundColor: '#1a1a1a', borderRadius: '6px', overflow: 'hidden', border: '1px solid #333' }}>
                      <img src={img.imageUrl} alt={img.caption} style={{ width: '100%', height: '120px', objectFit: 'cover' }} />
                      <div style={{ padding: '8px' }}>
                        <p style={{ fontSize: '0.8rem', color: '#ccc', margin: '0 0 8px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {img.caption || 'No caption'}
                        </p>
                        <button onClick={() => handleDeleteGalleryImage(img._id)} style={{ width: '100%', padding: '5px', backgroundColor: '#ff475722', border: '1px solid #ff4757', color: '#ff4757', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}>Delete Image</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* --- GENERAL ARCHIVE --- */}
            {archives.length > 0 && (
              <div style={{ marginBottom: '40px', backgroundColor: '#2a2a2a', padding: '20px', borderRadius: '8px' }}>
                <h4 style={{ color: '#e67e22', margin: '0 0 20px 0', borderBottom: '1px solid #444', paddingBottom: '10px' }}>🗄️ General Archive</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '15px' }}>
                  {archives.map(img => (
                    <div key={img._id} style={{ backgroundColor: '#1a1a1a', borderRadius: '6px', overflow: 'hidden', border: '1px solid #333' }}>
                      <img src={img.imageUrl} alt={img.caption} style={{ width: '100%', height: '120px', objectFit: 'cover' }} />
                      <div style={{ padding: '8px' }}>
                        <p style={{ fontSize: '0.8rem', color: '#ccc', margin: '0 0 8px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {img.caption || 'No caption'}
                        </p>
                        <button onClick={() => handleDeleteGalleryImage(img._id)} style={{ width: '100%', padding: '5px', backgroundColor: '#ff475722', border: '1px solid #ff4757', color: '#ff4757', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}>Delete Image</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {galleryImages.length === 0 && <p style={{ color: '#ccc' }}>No images in the gallery yet.</p>}  

            {/* GALLERY PAGINATION */}
            {totalGalleryPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', marginTop: '30px' }}>
                <button onClick={() => setGalleryPage(prev => Math.max(prev - 1, 1))} disabled={galleryPage === 1} className="cta-button outline-btn" style={{ padding: '8px 16px', opacity: galleryPage === 1 ? 0.5 : 1, cursor: galleryPage === 1 ? 'not-allowed' : 'pointer', backgroundColor: 'transparent', color: '#e67e22', border: '1px solid #e67e22', borderRadius: '4px' }}>Previous</button>
                <span style={{ color: '#ccc' }}>Page {galleryPage} of {totalGalleryPages}</span>
                <button onClick={() => setGalleryPage(prev => Math.min(prev + 1, totalGalleryPages))} disabled={galleryPage === totalGalleryPages} className="cta-button outline-btn" style={{ padding: '8px 16px', opacity: galleryPage === totalGalleryPages ? 0.5 : 1, cursor: galleryPage === totalGalleryPages ? 'not-allowed' : 'pointer', backgroundColor: 'transparent', color: '#e67e22', border: '1px solid #e67e22', borderRadius: '4px' }}>Next</button>
              </div>
            )}

          </div>
        )}


        {/* NEWSLETTER TAB */}
        {activeTab === 'newsletter' && (
          <div className="admin-panel">
            <h3>Broadcast Newsletter</h3>
            <p style={{ color: '#ccc', marginBottom: '20px' }}>
              Send an email directly to every verified user in the Ashram community.
            </p>

            {newsletterStatus && (
              <div style={{ 
                padding: '15px', 
                marginBottom: '20px', 
                borderRadius: '8px', 
                backgroundColor: newsletterStatus.type === 'success' ? 'rgba(46, 204, 113, 0.1)' : 'rgba(255, 71, 87, 0.1)',
                color: newsletterStatus.type === 'success' ? '#2ecc71' : '#ff4757',
                border: `1px solid ${newsletterStatus.type === 'success' ? '#2ecc71' : '#ff4757'}`
              }}>
                {newsletterStatus.text}
              </div>
            )}

            <form className="admin-form" onSubmit={handleSendNewsletter}>
              <div className="input-group">
                <label>Email Subject</label>
                <input 
                  type="text" 
                  value={newsletterData.subject} 
                  onChange={(e) => setNewsletterData({...newsletterData, subject: e.target.value})} 
                  required 
                  placeholder="e.g., Schedule for upcoming Maha Shivaratri"
                />
              </div>

              <div className="input-group">
                <label>Message Body</label>
                <textarea 
                  rows="8" 
                  value={newsletterData.message} 
                  onChange={(e) => setNewsletterData({...newsletterData, message: e.target.value})} 
                  required 
                  placeholder="Type your message here. The system will automatically add 'Hari Om [Name],' at the top."
                ></textarea>
              </div>

              <button 
                type="submit" 
                className="cta-button submit-btn" 
                disabled={isSendingNewsletter}
                style={{ opacity: isSendingNewsletter ? 0.7 : 1 }}
              >
                {isSendingNewsletter ? 'Broadcasting... Please wait...' : 'Send to All Users'}
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}