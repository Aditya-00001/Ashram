import React, { useState } from 'react';
import './Contact.css';

export default function Contact() {
  // State to handle showing a success message after submitting the form
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault(); // Prevents the page from refreshing
    setIsSubmitted(true);
    // In the future, you would add your backend or EmailJS code here!
  };

  return (
    <div className="contact-page">
      <div className="container">
        
        <div className="contact-header">
          <h2>Get in Touch</h2>
          <p>Whether you have a question about our retreats, want to volunteer, or simply need spiritual guidance, we are here to listen.</p>
        </div>

        <div className="contact-content">
          
          {/* --- CONTACT FORM --- */}
          <div className="contact-form-container">
            {isSubmitted ? (
              <div className="success-message">
                <h3>🙏 Hari Om!</h3>
                <p>Thank you for reaching out. We have received your message and will get back to you shortly.</p>
                <button className="outline-btn" onClick={() => setIsSubmitted(false)}>Send Another Message</button>
              </div>
            ) : (
              <form className="contact-form" onSubmit={handleSubmit}>
                <div className="input-group">
                  <label htmlFor="name">Full Name</label>
                  <input type="text" id="name" required placeholder="Enter your name" />
                </div>
                
                <div className="input-group">
                  <label htmlFor="email">Email Address</label>
                  <input type="email" id="email" required placeholder="Enter your email" />
                </div>

                <div className="input-group">
                  <label htmlFor="subject">Subject</label>
                  <select id="subject" required>
                    <option value="">Select an inquiry type...</option>
                    <option value="visit">Visiting the Ashram</option>
                    <option value="retreat">Retreats & Events</option>
                    <option value="volunteer">Volunteering (Seva)</option>
                    <option value="donation">Donations</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="input-group">
                  <label htmlFor="message">Your Message</label>
                  <textarea id="message" rows="5" required placeholder="How can we help you?"></textarea>
                </div>

                <button type="submit" className="cta-button submit-btn">Send Message</button>
              </form>
            )}
          </div>

          {/* --- DIRECT INFO BOX --- */}
          <div className="contact-info">
            <h3>Ashram Details</h3>
            
            <div className="info-item">
              <h4>📍 Address</h4>
              <p>7RW2+385, VIP Colony, IRC Village<br/>Nayapalli, Bhubaneswar<br/>Odisha 751015, India</p>
            </div>

            <div className="info-item">
              <h4>🕒 Visiting Hours</h4>
              <p>Monday - Sunday<br/>5:00 AM - 8:00 PM</p>
              <p className="note">*Please maintain silence near the meditation halls.</p>
            </div>

            <div className="info-item">
              <h4>📞 Contact Info</h4>
              <p>Phone: +91 98765 43210</p>
              <p>Email: contact@omashram.org</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}