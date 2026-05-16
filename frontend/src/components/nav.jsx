import React, { useState, useContext } from 'react';
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

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    closeMenu();
    navigate('/login');
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