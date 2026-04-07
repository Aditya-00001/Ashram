import React from 'react';
import { Link } from 'react-router-dom';

export default function Privacy() {
  return (
    <div className="privacy-page" style={{ padding: '60px 20px', minHeight: '80vh', backgroundColor: '#1a1a1a', color: '#ccc' }}>
      <div className="container" style={{ maxWidth: '800px', margin: '0 auto', backgroundColor: '#2a2a2a', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.3)' }}>
        
        <h1 style={{ color: '#e67e22', textAlign: 'center', marginBottom: '10px' }}>Privacy Policy</h1>
        <p style={{ textAlign: 'center', marginBottom: '40px', fontStyle: 'italic' }}>Last Updated: {new Date().toLocaleDateString()}</p>

        <section style={{ marginBottom: '30px' }}>
          <h2 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: '15px' }}>1. Introduction</h2>
          <p style={{ lineHeight: '1.6' }}>
            Welcome to the Achyuta Ananta Ashram portal. We respect your privacy and are committed to protecting your personal data. This privacy policy explains how we collect, use, and safeguard your information when you visit our website or use our services.
          </p>
        </section>

        <section style={{ marginBottom: '30px' }}>
          <h2 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: '15px' }}>2. Information We Collect</h2>
          <p style={{ lineHeight: '1.6', marginBottom: '10px' }}>We may collect the following types of information:</p>
          <ul style={{ lineHeight: '1.6', paddingLeft: '20px' }}>
            <li style={{ marginBottom: '8px' }}><strong>Personal Identification Information:</strong> Name, email address, and account passwords (securely encrypted) when you register for an account.</li>
            <li style={{ marginBottom: '8px' }}><strong>Donation Records:</strong> History of your contributions, dates, and intended purposes. <em>(Note: We do not store your credit card or bank details. All payments are processed securely through our third-party payment gateway).</em></li>
            <li style={{ marginBottom: '8px' }}><strong>Communication Data:</strong> Messages you send us through our contact forms.</li>
          </ul>
        </section>

        <section style={{ marginBottom: '30px' }}>
          <h2 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: '15px' }}>3. How We Use Your Information</h2>
          <ul style={{ lineHeight: '1.6', paddingLeft: '20px' }}>
            <li style={{ marginBottom: '8px' }}>To create and manage your personal devotee account.</li>
            <li style={{ marginBottom: '8px' }}>To process your donations and generate digital receipts.</li>
            <li style={{ marginBottom: '8px' }}>To send you important ashram updates, event schedules, and spiritual newsletters (you can opt-out at any time).</li>
            <li style={{ marginBottom: '8px' }}>To respond to your inquiries and support requests.</li>
          </ul>
        </section>

        <section style={{ marginBottom: '30px' }}>
          <h2 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: '15px' }}>4. Data Security</h2>
          <p style={{ lineHeight: '1.6' }}>
            We implement standard security measures to maintain the safety of your personal information. Your passwords are cryptographically hashed, and our database access is strictly restricted to authorized Ashram administrators.
          </p>
        </section>

        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: '15px' }}>5. Contact Us</h2>
          <p style={{ lineHeight: '1.6' }}>
            If you have any questions about this Privacy Policy, please reach out to us via our <Link to="/contact" style={{ color: '#e67e22', textDecoration: 'none' }}>Contact Page</Link>.
          </p>
        </section>

        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          <Link to="/" className="cta-button outline-btn" style={{ padding: '10px 20px', color: '#e67e22', border: '1px solid #e67e22', borderRadius: '4px', textDecoration: 'none' }}>
            Return to Home
          </Link>
        </div>

      </div>
    </div>
  );
}