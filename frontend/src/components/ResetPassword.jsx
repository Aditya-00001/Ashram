import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './Contact.css';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { resetToken } = useParams(); // Grabs the token directly from the URL!
  const navigate = useNavigate();

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }

    setIsSubmitting(true);

    try {
      // Notice we are using PUT here, and attaching the token to the URL, matching our backend route!
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/reset-password/${resetToken}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Password reset successful! Redirecting to login...');
        // Wait 2 seconds so they can read the success message, then send them to login
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setError(data.message || 'Invalid or expired token.');
      }
    } catch (err) {
      setError('Failed to connect to the server.');
    }

    setIsSubmitting(false);
  };

  return (
    <div className="contact-page" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center' }}>
      <div className="container" style={{ maxWidth: '500px', margin: '0 auto' }}>
        <div className="contact-form-container">
          <h2 style={{ color: '#e67e22', textAlign: 'center', marginBottom: '10px' }}>Set New Password</h2>
          <p style={{ color: '#ccc', textAlign: 'center', marginBottom: '25px', fontSize: '0.95rem' }}>
            Please enter your new password below.
          </p>
          
          {message && <div style={{ color: '#2ecc71', marginBottom: '15px', textAlign: 'center', padding: '10px', backgroundColor: 'rgba(46, 204, 113, 0.1)', borderRadius: '4px' }}>{message}</div>}
          {error && <div style={{ color: '#ff4757', marginBottom: '15px', textAlign: 'center', padding: '10px', backgroundColor: 'rgba(255, 71, 87, 0.1)', borderRadius: '4px' }}>{error}</div>}
          
          <form className="contact-form" onSubmit={handleResetPassword}>
            <div className="input-group">
              <label htmlFor="password">New Password</label>
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
              <label htmlFor="confirmPassword">Confirm New Password</label>
              <input 
                type="password" 
                id="confirmPassword" 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
                required 
                minLength="6"
              />
            </div>
            
            <button 
              type="submit" 
              className="cta-button submit-btn" 
              disabled={isSubmitting || message !== ''} // Disable button if success
              style={{ opacity: isSubmitting ? 0.7 : 1 }}
            >
              {isSubmitting ? 'Updating...' : 'Reset Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}