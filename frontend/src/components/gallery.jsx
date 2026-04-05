import React, { useState, useEffect } from 'react';
import './Gallery.css'; 

export default function Gallery() {
  const [images, setImages] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeFilter, setActiveFilter] = useState(''); // '' means All, 'Event', or 'Archive'
  const [isLoading, setIsLoading] = useState(false);
  
  // State for the full-screen popup
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    const fetchImages = async () => {
      setIsLoading(true);
      try {
        let url = `http://localhost:5000/api/gallery?page=${page}&limit=12`;
        if (activeFilter) url += `&type=${activeFilter}`;

        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          // If page is 1, replace the array. If page > 1, append to the bottom!
          if (page === 1) {
            setImages(data.images);
          } else {
            setImages(prev => [...prev, ...data.images]);
          }
          setTotalPages(data.totalPages);
        }
      } catch (error) {
        console.error("Failed to fetch gallery images:", error);
      }
      setIsLoading(false);
    };

    fetchImages();
  }, [page, activeFilter]);

  // When a user clicks a filter, we must reset the page back to 1
  const handleFilterChange = (type) => {
    setActiveFilter(type);
    setPage(1);
  };

  return (
    <div className="gallery-page">
      <div className="container">
        
        <div className="gallery-header" style={{ textAlign: 'center', marginBottom: '40px', paddingTop: '40px' }}>
          <h2 style={{ fontSize: '2.5rem', color: '#e67e22', marginBottom: '10px' }}>Ashram Gallery</h2>
          <p style={{ color: '#ccc', fontSize: '1.1rem' }}>Glimpses of our daily life, special events, and spiritual journey.</p>
        </div>

        {/* --- FILTER BUTTONS --- */}
        <div className="gallery-filters" style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginBottom: '40px' }}>
          <button className={`filter-btn ${activeFilter === '' ? 'active' : ''}`} onClick={() => handleFilterChange('')}>All Photos</button>
          <button className={`filter-btn ${activeFilter === 'Event' ? 'active' : ''}`} onClick={() => handleFilterChange('Event')}>Events</button>
          <button className={`filter-btn ${activeFilter === 'Archive' ? 'active' : ''}`} onClick={() => handleFilterChange('Archive')}>Archive</button>
        </div>

        {/* --- IMAGE GRID --- */}
        <div className="gallery-grid">
          {images.length === 0 && !isLoading && <p style={{ textAlign: 'center', color: '#888', gridColumn: '1 / -1' }}>No images found.</p>}
          
          {images.map((img) => (
            <div key={img._id} className="gallery-card" onClick={() => setSelectedImage(img)}>
              <img src={img.imageUrl} alt={img.caption || 'Ashram Photo'} loading="lazy" />
              <div className="gallery-overlay">
                <span className="gallery-tag">{img.type === 'Event' && img.eventId ? img.eventId.title : 'Archive'}</span>
                {img.caption && <p className="gallery-caption">{img.caption}</p>}
              </div>
            </div>
          ))}
        </div>

        {/* --- LOAD MORE BUTTON --- */}
        {page < totalPages && (
          <div style={{ textAlign: 'center', marginTop: '40px', paddingBottom: '40px' }}>
            <button 
              className="cta-button" 
              onClick={() => setPage(prev => prev + 1)}
              disabled={isLoading}
              style={{ opacity: isLoading ? 0.7 : 1 }}
            >
              {isLoading ? 'Loading...' : 'Load More Photos'}
            </button>
          </div>
        )}

      </div>

      {/* --- FULL SCREEN LIGHTBOX (POPUP) --- */}
      {selectedImage && (
        <div className="lightbox" onClick={() => setSelectedImage(null)}>
          <span className="close-lightbox">&times;</span>
          <img src={selectedImage.imageUrl} alt={selectedImage.caption} />
          {selectedImage.caption && <p className="lightbox-caption">{selectedImage.caption}</p>}
        </div>
      )}

    </div>
  );
}