import React, { useState, useContext,useEffect } from 'react';
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import Home from './home.jsx';
import About from './about.jsx';
import Gallery from './gallery.jsx';
import Books from './books.jsx';
import Support from './support.jsx';
import Contact from './contact.jsx';
import Events from './events.jsx';
import Login from './Login.jsx';
import AdminDashboard from './AdminDashboard.jsx';
import Register from './Register.jsx';
import UserDashboard from './UserDashboard.jsx';
import AdminLogin from './AdminLogin.jsx';
import VerifyEmail from './VerifyEmail.jsx';
import ForgotPassword from './ForgotPassword.jsx';
import ResetPassword from './ResetPassword.jsx';
import { AuthContext } from '../context/AuthContext.jsx';
import ProtectedRoute from './ProtectedRoute';
import Privacy from './Privacy';
import FaqAccordion from './FaqAccordion.jsx';
import Chat from './Chat';
import { ThemeContext } from '../context/ThemeContext';

export default function Nav() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { theme, toggleTheme } = useContext(ThemeContext);
  const { user, logout } = useContext(AuthContext); 
  const navigate = useNavigate();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(2);
  // 1. Add these states right under your existing context hooks

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const handleLogout = () => {
    // 1. Destroy the local encryption keys for security!
    if (user) {
      localStorage.removeItem(`e2ee_priv_${user._id}`);
    }
    
    // 2. Call your existing logout context function
    logout();
    closeMenu(); // (Only needed in nav.jsx)
    navigate('/login');
  };

  // 2. Add the fetch effect to grab notifications when the user logs in
  useEffect(() => {
    if (user) {
      fetch(`${import.meta.env.VITE_API_URL}/api/notifications`, {
        headers: { Authorization: `Bearer ${user.token}` }
      })
      .then(res => res.json())
      .then(data => {
        // Assuming your backend returns an array of notification objects
        if (Array.isArray(data)) {
          setNotifications(data);
          setUnreadCount(data.filter(n => !n.isRead).length);
        }
      })
      .catch(err => console.error("Notification fetch error:", err));
    }
  }, [user]);

  // 3. Add the function to mark them as read
  const handleMarkAllRead = async () => {
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/notifications/read-all`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setUnreadCount(0);
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error("Failed to mark notifications as read", err);
    }
  };

  return (
    <>
      <nav className='nav'>
      <div className="nav-logo" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        <h2>Achyuta Ashram</h2>
        
        {/* ✅ FIX: Moved the Theme Toggle button here so it's ALWAYS visible across all viewports */}
        <button 
          onClick={toggleTheme} 
          className="theme-toggle-btn"
          aria-label="Toggle Spiritual Theme"
          title={theme === 'light' ? 'Switch to Sacred Dark Mode' : 'Switch to Pure Light Mode'}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '1.3rem',
            cursor: 'pointer',
            padding: '0 10px',
            color: 'var(--text-main)', 
            transition: 'transform 0.2s ease',
            display: 'inline-flex',
            alignItems: 'center'
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1.0)'}
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
        {/* 🔔 NEW: NOTIFICATION BELL WIDGET */}
        {user && (
          <div className="notif-wrapper">
            <button 
              className="notif-btn" 
              onClick={() => setIsNotifOpen(!isNotifOpen)}
            >
              🔔
              {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
            </button>

            {isNotifOpen && (
            <div className="notif-dropdown">
              <div className="notif-header">
                <span>Notifications</span>
                <button className="mark-read-btn" onClick={handleMarkAllRead}>Mark all read</button>
              </div>
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                
                {notifications.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No new notifications.
                  </div>
                ) : (
                  notifications.map(notif => (
                    <div key={notif._id} className={`notif-item ${!notif.isRead ? 'unread' : ''}`}>
                      <span style={{ color: 'var(--text-main)', fontSize: '0.9rem', display: 'block' }}>
                        <strong>{notif.title}:</strong> {notif.message}
                      </span>
                      <span className="notif-time">{new Date(notif.createdAt).toLocaleDateString()}</span>
                    </div>
                  ))
                )}

              </div>
            </div>
          )}
          </div>
        )}
      </div>

      {/* --- DESKTOP PRIMARY LINKS --- */}
      <div className="desktop-primary-links">
        {/* Toggle Button is safely moved out of here */}
        <NavLink to="/" className={({ isActive }) => isActive ? "hidden-link" : "nav-item"} onClick={closeMenu}>Home</NavLink>
        <NavLink to="/about" className={({ isActive }) => isActive ? "hidden-link" : "nav-item"} onClick={closeMenu}>About</NavLink>
        <NavLink to="/events" className={({ isActive }) => isActive ? "hidden-link" : "nav-item"} onClick={closeMenu}>Events</NavLink>
        <NavLink to="/donate" className={({ isActive }) => isActive ? "hidden-link" : "nav-item"} onClick={closeMenu}>Support</NavLink>
      </div>

      {/* --- ALWAYS VISIBLE HAMBURGER ICON --- */}
      <div className="hamburger" onClick={toggleMenu}>
        <span className="bar"></span>
        <span className="bar"></span>
        <span className="bar"></span>
      </div>

      {/* --- THE DROPDOWN MENU --- */}
      <div className={`nav-links ${isMenuOpen ? "open" : ""}`}>
        {/* Dropdown elements remain unchanged */}
        <NavLink to="/" className={({ isActive }) => isActive ? "hidden-link mobile-only-link" : "nav-item mobile-only-link"} onClick={closeMenu}>Home</NavLink>
        <NavLink to="/about" className={({ isActive }) => isActive ? "hidden-link mobile-only-link" : "nav-item mobile-only-link"} onClick={closeMenu}>About</NavLink>
        <NavLink to="/events" className={({ isActive }) => isActive ? "hidden-link mobile-only-link" : "nav-item mobile-only-link"} onClick={closeMenu}>Events</NavLink>
        <NavLink to="/donate" className={({ isActive }) => isActive ? "hidden-link mobile-only-link" : "nav-item mobile-only-link"} onClick={closeMenu}>Support</NavLink>
        
        <NavLink to="/gallery" className={({ isActive }) => isActive ? "hidden-link" : "nav-item"} onClick={closeMenu}>Gallery</NavLink>
        <NavLink to="/book" className={({ isActive }) => isActive ? "hidden-link" : "nav-item"} onClick={closeMenu}>Books</NavLink>
        <NavLink to="/contact" className={({ isActive }) => isActive ? "hidden-link" : "nav-item"} onClick={closeMenu}>Contact</NavLink>
        <NavLink to="/chat" className={({ isActive }) => isActive ? "active-link" : "nav-item"} onClick={closeMenu}>Community Chat</NavLink>
        
        {user ? (
          <>
            <NavLink to={(user.role === 'admin' || user.role === 'superadmin') ? '/admin/dashboard' : '/my-profile'} className={({ isActive }) => isActive ? "hidden-link" : "nav-item"} onClick={closeMenu}>
              {(user.role === 'admin' || user.role === 'superadmin') ? 'Admin Panel' : 'My Profile'}
            </NavLink>
            <button className="nav-item" onClick={handleLogout} style={{ background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'center', fontFamily: 'inherit' }}>Logout</button>
          </>
        ) : (
          <NavLink to="/login" className={({ isActive }) => isActive ? "hidden-link" : "nav-item"} onClick={closeMenu}>Login / Register</NavLink>
        )}
      </div>
    </nav>
      
      {/* ... Your Routes stay exactly the same down here ... */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/book" element={<Books />} />
        <Route path="/donate" element={<Support />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/events" element={<Events />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin/dashboard" element={<ProtectedRoute adminOnly={true}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/register" element={<Register />} />
        <Route path="/my-profile" element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />
        <Route path="/admin-portal" element={<AdminLogin />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:resetToken" element={<ResetPassword />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/faq" element={<FaqAccordion />} />
        <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
      </Routes>
    </>
  );
}