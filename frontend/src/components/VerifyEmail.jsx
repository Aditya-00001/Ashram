import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './Contact.css'; // Reusing your beautiful dark form styling

export default function VerifyEmail() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { verifyEmail } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation(); // Allows us to grab data passed from the previous page
  
  // Grab the email from the Register page. If they navigated here manually, it will be null.
  const email = location.state?.email; 

  // Security check: If they somehow got to this page without an email, kick them to login
  useEffect(() => {
    if (!email) {
      navigate('/login');
    }
  }, [email, navigate]);

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    const result = await verifyEmail(email, code);
    
    if (result.success) {
      // If it's the admin verifying their account, send to admin panel. Otherwise, profile!
      if (result.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/my-profile'); 
      }
    } else {
      setError(result.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="contact-page" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center' }}>
      <div className="container" style={{ maxWidth: '500px', margin: '0 auto' }}>
        <div className="contact-form-container">
          <h2 style={{ color: '#e67e22', textAlign: 'center', marginBottom: '10px' }}>Verify Your Email</h2>
          <p style={{ color: '#ccc', textAlign: 'center', marginBottom: '25px', fontSize: '0.95rem' }}>
            We sent a 6-digit code to <strong>{email}</strong>. Please enter it below to activate your account.
          </p>
          
          {error && <div style={{ color: '#ff4757', marginBottom: '15px', textAlign: 'center' }}>{error}</div>}
          
          <form className="contact-form" onSubmit={handleVerify}>
            <div className="input-group">
              <label htmlFor="code" style={{ textAlign: 'center', display: 'block' }}>6-Digit Verification Code</label>
              <input 
                type="text" 
                id="code" 
                value={code} 
                onChange={(e) => setCode(e.target.value)} 
                required 
                maxLength="6"
                placeholder="000000"
                style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '8px' }}
              />
            </div>
            
            <button 
              type="submit" 
              className="cta-button submit-btn" 
              disabled={isSubmitting}
              style={{ opacity: isSubmitting ? 0.7 : 1 }}
            >
              {isSubmitting ? 'Verifying...' : 'Verify & Login'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}