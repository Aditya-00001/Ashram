import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Contact.css'; // Reusing your dark theme form styling

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setIsSubmitting(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('A password reset link has been sent to your email.');
        setEmail(''); // Clear the input
      } else {
        setError(data.message || 'Something went wrong. Please try again.');
      }
    // eslint-disable-next-line no-unused-vars
    } catch (err) {
      setError('Failed to connect to the server.');
    }

    setIsSubmitting(false);
  };

  return (
    <div className="contact-page" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center' }}>
      <div className="container" style={{ maxWidth: '500px', margin: '0 auto' }}>
        <div className="contact-form-container">
          <h2 style={{ color: '#e67e22', textAlign: 'center', marginBottom: '10px' }}>Forgot Password</h2>
          <p style={{ color: '#ccc', textAlign: 'center', marginBottom: '25px', fontSize: '0.95rem' }}>
            Enter the email address associated with your account and we will send you a link to reset your password.
          </p>
          
          {message && <div style={{ color: '#2ecc71', marginBottom: '15px', textAlign: 'center', padding: '10px', backgroundColor: 'rgba(46, 204, 113, 0.1)', borderRadius: '4px' }}>{message}</div>}
          {error && <div style={{ color: '#ff4757', marginBottom: '15px', textAlign: 'center', padding: '10px', backgroundColor: 'rgba(255, 71, 87, 0.1)', borderRadius: '4px' }}>{error}</div>}
          
          <form className="contact-form" onSubmit={handleForgotPassword}>
            <div className="input-group">
              <label htmlFor="email">Email Address</label>
              <input 
                type="email" 
                id="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
              />
            </div>
            
            <button 
              type="submit" 
              className="cta-button submit-btn" 
              disabled={isSubmitting}
              style={{ opacity: isSubmitting ? 0.7 : 1 }}
            >
              {isSubmitting ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '20px', color: '#ccc' }}>
            Remembered your password? <Link to="/login" style={{ color: '#e67e22', textDecoration: 'none' }}>Log in here</Link>
          </div>
        </div>
      </div>
    </div>
  );
}