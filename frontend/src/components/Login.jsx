import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './Contact.css'; // We can reuse the form styling from the contact page!

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
      e.preventDefault();
      setError('');

      const result = await login(email, password);
      
      if (result.success) {
      if (result.role === 'admin') {
        // If an admin accidentally uses the public login, redirect them to the secret portal
        navigate('/admin-portal'); 
      } else {
        navigate('/my-profile');
      }
    }
    };

  return (
    <div className="contact-page" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center' }}>
      <div className="container" style={{ maxWidth: '500px', margin: '0 auto' }}>
        <div className="contact-form-container">
          <h2 style={{ color: '#e67e22', textAlign: 'center', marginBottom: '20px' }}>Login</h2>
          
          {error && <div style={{ color: '#ff4757', marginBottom: '15px', textAlign: 'center' }}>{error}</div>}
          
          <form className="contact-form" onSubmit={handleLogin}>
            <div className="input-group">
              <label htmlFor="email">Email</label>
              <input 
                type="email" 
                id="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
              />
            </div>
            <div className="input-group">
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label htmlFor="password">Password</label>
                {/* --- ADD THIS LINK --- */}
                <Link to="/forgot-password" style={{ fontSize: '0.85rem', color: '#e67e22', textDecoration: 'none' }}>Forgot Password?</Link>
              </div>
              <input 
                type="password" 
                id="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
              />
              
            </div>

            <button type="submit" className="cta-button submit-btn">Login</button>
            <div style={{ textAlign: 'center', marginTop: '20px', color: '#ccc' }}>
              Don't have an account? <Link to="/register" style={{ color: '#e67e22', textDecoration: 'none' }}>Register here</Link>
            </div>
            
          </form>
        </div>
      </div>
    </div>
  );
};