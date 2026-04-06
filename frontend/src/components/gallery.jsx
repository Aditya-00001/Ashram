import React, { useState, useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import './Gallery.css'; 

export default function Gallery() {
  const [albums, setAlbums] = useState({});
  const [archives, setArchives] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // State to hold the array of images for the currently opened Swiper popup
  const [activeSwiperImages, setActiveSwiperImages] = useState(null);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        // Fetching a large chunk to group them (you can add pagination back later if needed)
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/gallery?limit=500`);
        if (res.ok) {
          const data = await res.json();
          
          const groupedAlbums = {};
          const archiveList = [];

          // Group the images by Event ID
          data.images.forEach(img => {
            if (img.type === 'Event' && img.eventId) {
              const eId = img.eventId._id;
              if (!groupedAlbums[eId]) {
                groupedAlbums[eId] = { eventData: img.eventId, images: [] };
              }
              groupedAlbums[eId].images.push(img);
            } else {
              archiveList.push(img);
            }
          });

          setAlbums(groupedAlbums);
          setArchives(archiveList);
        }
      } catch (error) { console.error("Failed to fetch gallery:", error); }
      setIsLoading(false);
    };

    fetchImages();
  }, []);

  return (
    <div className="gallery-page">
      <div className="container">
        
        <div className="gallery-header" style={{ textAlign: 'center', marginBottom: '40px', paddingTop: '40px' }}>
          <h2 style={{ fontSize: '2.5rem', color: '#e67e22', marginBottom: '10px' }}>Ashram Event Albums</h2>
          <p style={{ color: '#ccc', fontSize: '1.1rem' }}>Click an event to view the full picture gallery.</p>
        </div>

        {isLoading && <p style={{ textAlign: 'center', color: '#e67e22' }}>Loading albums...</p>}

        {/* --- EVENT ALBUMS GRID --- */}
        <div className="gallery-grid">
          {Object.values(albums).map((album) => (
            <div 
              key={album.eventData._id} 
              className="gallery-card album-card" 
              onClick={() => setActiveSwiperImages(album.images)}
            >
              {/* Show the first image as the cover */}
              <img src={album.images[0].imageUrl} alt={album.eventData.title} loading="lazy" />
              <div className="gallery-overlay">
                <span className="gallery-tag">Event Album</span>
                <p className="gallery-caption">{album.eventData.title}</p>
                <small style={{ color: '#aaa' }}>{album.images.length} Photos</small>
              </div>
            </div>
          ))}
        </div>

        {/* --- ARCHIVE SECTION --- */}
        {archives.length > 0 && (
          <>
            <h3 style={{ color: '#e67e22', marginTop: '60px', marginBottom: '20px', borderBottom: '1px solid #333', paddingBottom: '10px' }}>
              General Archive
            </h3>
            <div className="gallery-grid">
              {archives.map((img) => (
                <div key={img._id} className="gallery-card" onClick={() => setActiveSwiperImages([img])}>
                  <img src={img.imageUrl} alt="Archive" loading="lazy" />
                </div>
              ))}
            </div>
          </>
        )}

      </div>

      {/* --- FULL SCREEN SWIPER POPUP --- */}
      {activeSwiperImages && (
        <div className="lightbox">
          <span className="close-lightbox" onClick={() => setActiveSwiperImages(null)}>&times;</span>
          
          <div style={{ width: '90%', maxWidth: '1000px', height: '80vh' }}>
            <Swiper
              modules={[Navigation, Pagination]}
              navigation={true}
              pagination={{ clickable: true }}
              spaceBetween={30}
              slidesPerView={1}
              className="mySwiper"
              style={{ height: '100%', '--swiper-navigation-color': '#e67e22', '--swiper-pagination-color': '#e67e22' }}
            >
              {activeSwiperImages.map((img) => (
                <SwiperSlide key={img._id} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
                  <img 
                    src={img.imageUrl} 
                    alt="Gallery" 
                    style={{ maxHeight: '70vh', maxWidth: '100%', objectFit: 'contain', borderRadius: '8px' }}
                  />
                  {img.caption && <p style={{ color: '#fff', marginTop: '15px', fontSize: '1.2rem' }}>{img.caption}</p>}
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div>
      )}

    </div>
  );
}