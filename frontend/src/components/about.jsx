import React from 'react';
import { Link } from 'react-router-dom';
import './About.css';

export default function About() {
  return (
    <div className="about-page">
      
      {/* --- HEADER SECTION --- */}
      <div className="about-header">
        <div className="container">
          <h1>About Achyuta Ananta Ashram</h1>
          <p className="subtitle">Discover our roots, our mission, and our way of life.</p>
        </div>
      </div>

      {/* --- OUR STORY SECTION --- */}
      <section className="story-section">
        <div className="container story-content">
          <div className="story-text">
            <h2>Our Story</h2>
            <p>
              Nestled in the peaceful surroundings of Bhubaneswar, Achyuta Ananta Ashram was founded with a singular vision: to create a sanctuary where seekers from all walks of life can step away from the noise of the modern world and reconnect with their inner stillness.
            </p>
            <p>
              We believe that true peace is found through a balance of dedicated spiritual practice (Sadhana), selfless service to the community (Seva), and the uplifting company of fellow seekers (Sangha). Whether you are taking your first steps into meditation or deepening a lifelong yoga practice, our doors are open to you.
            </p>
          </div>
          <div className="story-image-wrapper">
            <img 
              src="https://images.unsplash.com/photo-1605640840605-14ac1855827b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
              alt="Ashram Pathway" 
              className="story-image"
            />
          </div>
        </div>
      </section>

      {/* --- CORE VALUES --- */}
      <section className="values-section">
        <div className="container">
          <h2>Our Core Pillars</h2>
          <div className="values-grid">
            <div className="value-card">
              <h3>🧘 Sadhana</h3>
              <p>Daily disciplined practice including meditation, chanting, and yoga to purify the mind and body.</p>
            </div>
            <div className="value-card">
              <h3>🤲 Seva</h3>
              <p>Selfless service without the desire for reward, from feeding the hungry to caring for nature.</p>
            </div>
            <div className="value-card">
              <h3>🤝 Sangha</h3>
              <p>A supportive community of truth-seekers who uplift and inspire one another on the spiritual path.</p>
            </div>
          </div>
        </div>
      </section>

      {/* --- MINI GALLERY & LINK --- */}
      <section className="about-gallery-section">
        <div className="container">
          <h2>Glimpses of Ashram Life</h2>
          <p>A look into our daily routines, peaceful corners, and vibrant community.</p>
          
          <div className="preview-grid">
            <img src="https://images.unsplash.com/photo-1545389336-cf090694435e?auto=format&fit=crop&w=600&q=80" alt="Meditation" className="preview-img" />
            <img src="https://images.unsplash.com/photo-1512438248247-f0f2a5a8b7f0?auto=format&fit=crop&w=600&q=80" alt="Offerings" className="preview-img" />
            <img src="https://images.unsplash.com/photo-1600577916048-804c9191e36c?auto=format&fit=crop&w=600&q=80" alt="Nature" className="preview-img" />
          </div>

          {/* This button links directly to your gallery.jsx page */}
          <div className="gallery-link-wrapper">
            <Link to="/gallery" className="cta-button outline-btn">
              View Full Gallery
            </Link>
          </div>
          
        </div>
      </section>

    </div>
  );
}