import React from 'react';
import './Support.css';

export default function Support() {
  return (
    <div className="support-page">
      <div className="container">
        
        <div className="support-header">
          <h2>Support Our Seva</h2>
          <p>
            Achyuta Ananta Ashram runs entirely on the generous contributions of our community. 
            Your support helps us maintain the ashram, organize free spiritual retreats, and 
            distribute food to those in need.
          </p>
        </div>

        <div className="support-content">
          
          {/* --- FINANCIAL DONATION SECTION --- */}
          <div className="donation-section">
            <h3>Make a Contribution</h3>
            
            {/* Impact Tiers */}
            <div className="donation-grid">
              <button className="tier-btn">
                ₹500 <br/><span>Feeds 10 people</span>
              </button>
              <button className="tier-btn">
                ₹1,000 <br/><span>Maintains the prayer hall</span>
              </button>
              <button className="tier-btn">
                ₹5,000 <br/><span>Sponsors a monthly retreat</span>
              </button>
              <button className="tier-btn custom-amt">
                Custom <br/><span>Any amount helps</span>
              </button>
            </div>
            
            {/* Bank & UPI Details */}
            <div className="payment-details">
              <h4>Bank Transfer & UPI</h4>
              <p>You can send your Dakshina or donations directly to the ashram's official accounts:</p>
              <div className="details-grid">
                <div>
                  <p><strong>UPI ID:</strong> achyutaashram@sbi</p>
                  <p><strong>Name:</strong> Achyuta Ananta Ashram Trust</p>
                </div>
                <div>
                  <p><strong>Bank:</strong> State Bank of India</p>
                  <p><strong>A/C No:</strong> 31234567890</p>
                  <p><strong>IFSC:</strong> SBIN0001234</p>
                </div>
              </div>
            </div>
          </div>

          {/* --- VOLUNTEER SECTION --- */}
          <div className="volunteer-section">
            <h3>Offer Your Time (Karma Yoga)</h3>
            <p>
              Financial support isn't the only way to give. We always welcome dedicated volunteers 
              to help with daily chores, maintaining the gardens, managing the library, or organizing 
              community events. 
            </p>
            <button className="cta-button volunteer-btn">Join as a Volunteer</button>
          </div>

        </div>
      </div>
    </div>
  );
}