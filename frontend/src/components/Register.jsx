import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './Contact.css'; // Reusing the dark theme form styling

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    // Frontend validation: Check if passwords match before sending to server
    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }

    // Inside Register.jsx's handleRegister function
        
    const result = await register(name, email, password);
    
    if (result.success) {
      // UPDATED: Send them to the verification page and pass their email secretly in the state!
      navigate('/verify-email', { state: { email: email } }); 
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="contact-page" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center' }}>
      <div className="container" style={{ maxWidth: '500px', margin: '0 auto' }}>
        <div className="contact-form-container">
          <h2 style={{ color: '#e67e22', textAlign: 'center', marginBottom: '20px' }}>Create an Account</h2>
          
          {error && <div style={{ color: '#ff4757', marginBottom: '15px', textAlign: 'center' }}>{error}</div>}
          
          <form className="contact-form" onSubmit={handleRegister}>
            <div className="input-group">
              <label htmlFor="name">Full Name</label>
              <input 
                type="text" 
                id="name" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required 
              />
            </div>
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
              <label htmlFor="password">Password</label>
              <input 
                type="password" 
                id="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                minLength="6"
              />
            </div>
            <div className="input-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input 
                type="password" 
                id="confirmPassword" 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
                required 
              />
            </div>
            <button type="submit" className="cta-button submit-btn">Register</button>
          </form>

          {/* Quick link to switch to Login */}
          <div style={{ textAlign: 'center', marginTop: '20px', color: '#ccc' }}>
            Already have an account? <Link to="/login" style={{ color: '#e67e22', textDecoration: 'none' }}>Log in here</Link>
          </div>

        </div>
      </div>
    </div>
  );
}