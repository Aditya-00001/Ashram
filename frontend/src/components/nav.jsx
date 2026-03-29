import React, { useState } from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import Home from './home.jsx';
import About from './about.jsx';
import Gallery from './gallery.jsx';
import Books from './books.jsx';
import Support from './support.jsx';
import Contact from './contact.jsx';

export default function Nav() {
  // State to track if the mobile menu is open or closed
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Function to toggle the menu open/closed
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Function to close the menu when a link is clicked
  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <>
      <nav className='nav'>
        <div className="nav-logo">
          <h2>Achyuta Ashram</h2>
        </div>

        {/* The Hamburger Icon (Only visible on mobile) */}
        <div className="hamburger" onClick={toggleMenu}>
          <span className="bar"></span>
          <span className="bar"></span>
          <span className="bar"></span>
        </div>

        {/* Links Container: Adds the 'open' class if isMenuOpen is true */}
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
        </div>
      </nav>
      
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/book" element={<Books />} />
        <Route path="/donate" element={<Support />} />
        <Route path="/contact" element={<Contact />} />
        {/* Add more routes as needed */}
      </Routes>
    </>
  );
}