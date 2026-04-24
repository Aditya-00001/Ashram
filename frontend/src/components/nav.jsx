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

export default function Nav() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
        <div className="nav-logo">
          <h2>Achyuta Ashram</h2>
        </div>

        {/* --- DESKTOP PRIMARY LINKS (Visible on Laptop, Hidden on Mobile) --- */}
        <div className="desktop-primary-links">
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
          
          {/* These duplicate links ONLY show up when the user is on a Mobile Phone */}
          <NavLink to="/" className={({ isActive }) => isActive ? "hidden-link mobile-only-link" : "nav-item mobile-only-link"} onClick={closeMenu}>Home</NavLink>
          <NavLink to="/about" className={({ isActive }) => isActive ? "hidden-link mobile-only-link" : "nav-item mobile-only-link"} onClick={closeMenu}>About</NavLink>
          <NavLink to="/events" className={({ isActive }) => isActive ? "hidden-link mobile-only-link" : "nav-item mobile-only-link"} onClick={closeMenu}>Events</NavLink>
          <NavLink to="/donate" className={({ isActive }) => isActive ? "hidden-link mobile-only-link" : "nav-item mobile-only-link"} onClick={closeMenu}>Support</NavLink>

          {/* These links are ALWAYS in the Dropdown Menu */}
          <NavLink to="/gallery" className={({ isActive }) => isActive ? "hidden-link" : "nav-item"} onClick={closeMenu}>Gallery</NavLink>
          <NavLink to="/book" className={({ isActive }) => isActive ? "hidden-link" : "nav-item"} onClick={closeMenu}>Books</NavLink>
          <NavLink to="/contact" className={({ isActive }) => isActive ? "hidden-link" : "nav-item"} onClick={closeMenu}>Contact</NavLink>
          
          {/* Auth Controls */}
          {user ? (
            <>
              <NavLink 
                to={(user.role === 'admin' || user.role === 'superadmin') ? '/admin/dashboard' : '/my-profile'} 
                className={({ isActive }) => isActive ? "hidden-link" : "nav-item"} 
                onClick={closeMenu}
              >
                {(user.role === 'admin' || user.role === 'superadmin') ? 'Admin Panel' : 'My Profile'}
              </NavLink>
              <button 
                className="nav-item" 
                onClick={handleLogout} 
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'center', fontFamily: 'inherit' }}
              >
                Logout
              </button>
            </>
          ) : (
            <NavLink to="/login" className={({ isActive }) => isActive ? "hidden-link" : "nav-item"} onClick={closeMenu}>
              Login / Register
            </NavLink>
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
      </Routes>
    </>
  );
}