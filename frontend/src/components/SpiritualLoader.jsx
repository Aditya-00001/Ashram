import React from 'react';
import '../styles/SpiritualLoader.css';

const SpiritualLoader = ({ size = "large", message = "Loading..." }) => {
  return (
    <div className={`spiritual-loader-container ${size}`}>
      <div className="mandala-wrapper">
        {/* Sacred Geometry / Mandala SVG */}
        <svg viewBox="0 0 100 100" className="mandala-svg">
          <circle cx="50" cy="50" r="45" fill="none" stroke="#e67e22" strokeWidth="0.5" strokeDasharray="5,5" />
          <path 
            d="M50 5 L55 40 L95 45 L60 55 L65 95 L50 60 L35 95 L40 55 L5 45 L45 40 Z" 
            fill="none" 
            stroke="#e67e22" 
            strokeWidth="1"
          />
          <circle cx="50" cy="50" r="10" fill="#e67e22" opacity="0.3" />
          <text x="50" y="57" fontSize="18" textAnchor="middle" fill="#e67e22" className="om-symbol">ॐ</text>
        </svg>
      </div>
      {message && <p className="loader-text">{message}</p>}
    </div>
  );
};

export default SpiritualLoader;