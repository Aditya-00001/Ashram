import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './Contact.css'; 

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setError('');

    const result = await login(email, password);
    
    if (result.success) {
      // STRICT CHECK: Are they actually an admin?
      if (result.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        // If a regular member finds this page and tries to log in, kick them out!
        setError('Access Denied: You do not have administrator privileges.');
      }
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="contact-page" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center' }}>
      <div className="container" style={{ maxWidth: '500px', margin: '0 auto' }}>
        <div className="contact-form-container" style={{ borderTop: '4px solid #ff4757' }}>
          <h2 style={{ color: '#ff4757', textAlign: 'center', marginBottom: '20px' }}>Secure Admin Portal</h2>
          
          {error && <div style={{ color: '#ff4757', marginBottom: '15px', textAlign: 'center', fontWeight: 'bold' }}>{error}</div>}
          
          <form className="contact-form" onSubmit={handleAdminLogin}>
            <div className="input-group">
              <label htmlFor="email">Admin Email</label>
              <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="input-group">
              <label htmlFor="password">Passcode</label>
              <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <button type="submit" className="cta-button submit-btn" style={{ backgroundColor: '#ff4757' }}>Access Dashboard</button>
          </form>
        </div>
      </div>
    </div>
  );
}