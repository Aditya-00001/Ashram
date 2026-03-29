import React from 'react';
// 1. Removed 'Lazy' from this import statement
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules'; 
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

import './Gallery.css'; 

export default function Gallery() {
  const galleryItems = Array.from({ length: 1000 }).map((_, i) => ({
    id: i,
    url: `https://picsum.photos/800/600?random=${i}`, 
    alt: `Ashram gallery image ${i + 1}`
  }));

  return (
    <div className="gallery-page">
      
      {/* --- FEATURED IMAGES SECTION --- */}
      <section className="featured-section">
        <h2>Featured Highlights</h2>
        <div className="featured-grid">
          <div className="featured-card">
            <img src="https://picsum.photos/800/600?random=1001" alt="Morning Yoga" />
            <h3>Morning Yoga</h3>
          </div>
          <div className="featured-card">
            <img src="https://picsum.photos/800/600?random=1002" alt="Community Meal" />
            <h3>Community Meal</h3>
          </div>
          <div className="featured-card">
            <img src="https://picsum.photos/800/600?random=1003" alt="Evening Aarti" />
            <h3>Evening Aarti</h3>
          </div>
        </div>
      </section>

      <hr className="divider" />

      {/* --- CAROUSEL SECTION --- */}
      {/* --- CAROUSEL SECTION --- */}
      <section className="carousel-section">
        <h2>Complete Archive</h2>
        <p>Swipe or click the arrows to explore our journey.</p>
        
        <Swiper
          // 2. Removed Pagination from the modules array
          modules={[Navigation]}
          // 3. Explicitly set navigation to true
          navigation={true}
          spaceBetween={20}
          slidesPerView={1}
          breakpoints={{
            640: { slidesPerView: 2 },
            1024: { slidesPerView: 3 },
          }}
          className="mySwiper"
        >
          {galleryItems.map((item) => (
            <SwiperSlide key={item.id}>
              <img 
                src={item.url} 
                alt={item.alt} 
                loading="lazy" 
                className="carousel-image"
              />
              <div className="swiper-lazy-preloader"></div>
            </SwiperSlide>
          ))}
        </Swiper>
      </section>

    </div>
  );
}