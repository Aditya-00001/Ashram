import React, { useState, useContext } from 'react'; // Added useContext
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom'; // Added useNavigate
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

  // ADDED: The logout function
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

        <div className="hamburger" onClick={toggleMenu}>
          <span className="bar"></span>
          <span className="bar"></span>
          <span className="bar"></span>
        </div>

        <div className={`nav-links ${isMenuOpen ? "open" : ""}`}>
          <NavLink to="/" className={({ isActive }) => isActive ? "hidden-link" : "nav-item"} onClick={closeMenu}>
            Home
          </NavLink>
          <NavLink to="/about" className={({ isActive }) => isActive ? "hidden-link" : "nav-item"} onClick={closeMenu}>
            About
          </NavLink>
          <NavLink to="/gallery" className={({ isActive }) => isActive ? "hidden-link" : "nav-item"} onClick={closeMenu}>
            Gallery
          </NavLink>
          <NavLink to="/book" className={({ isActive }) => isActive ? "hidden-link" : "nav-item"} onClick={closeMenu}>
            Books
          </NavLink>
          <NavLink to="/donate" className={({ isActive }) => isActive ? "hidden-link" : "nav-item"} onClick={closeMenu}>
            Support
          </NavLink>
          <NavLink to="/contact" className={({ isActive }) => isActive ? "hidden-link" : "nav-item"} onClick={closeMenu}>
            Contact
          </NavLink>
          <NavLink to="/events" className={({ isActive }) => isActive ? "hidden-link" : "nav-item"} onClick={closeMenu}>
            Events
          </NavLink>
          
          {/* UPDATED: Dynamic Auth Links */}
          {user ? (
            <>
              <NavLink 
                to={user.role === 'admin' ? '/admin/dashboard' : '/my-profile'} 
                className={({ isActive }) => isActive ? "hidden-link" : "nav-item"} 
                onClick={closeMenu}
              >
                {user.role === 'admin' ? 'Admin Panel' : 'My Profile'}
              </NavLink>
              <button 
                className="nav-item" 
                onClick={handleLogout} 
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}
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
      
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/book" element={<Books />} />
        <Route path="/donate" element={<Support />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/events" element={<Events />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin/dashboard" element={
          <ProtectedRoute adminOnly={true}>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="/register" element={<Register />} />
        <Route path="/my-profile" element={
          <ProtectedRoute>
            <UserDashboard />
          </ProtectedRoute>
        } />
        <Route path="/admin-portal" element={<AdminLogin />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        {/* The :resetToken acts as a dynamic variable that React Router will extract */}
        <Route path="/reset-password/:resetToken" element={<ResetPassword />} />
      </Routes>
    </>
  );
}