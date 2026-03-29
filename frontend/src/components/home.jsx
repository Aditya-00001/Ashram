import React, {useRef} from 'react';
import './Home.css';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';



export default function Home() {

  const map= useRef(null);
  
  const scrollToMap = () => {
    map.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  return (
    <div className="home-page">
      
      {/* 1. HERO SECTION */}
      <header className="hero-section">
        <div className="hero-overlay">
          <h1>Welcome to Achyuta Ashram</h1>
          <p className="tagline">A sanctuary for inner peace and spiritual awakening.</p>
          <button className="cta-button" onClick={scrollToMap}>Plan Your Visit</button>
        </div>
      </header>

      {/* 2. INTRODUCTION */}
      <section className="intro-section">
        <div className="container">
          <h2>Our Philosophy</h2>
          <p className="description-placeholder">
            [Placeholder: Achyuta Ashram is a sacred space dedicated to the pursuit of truth and selfless service. Nestled in nature, we provide a supportive environment for seekers to deepen their spiritual practice, connect with a mindful community, and rediscover their inner silence.]
          </p>
        </div>
      </section>

      {/* 3. DAILY PRACTICES */}
      <section className="practices-section">
        <div className="container">
          <h2>Daily Rhythm</h2>
          <div className="practices-grid">
            <div className="practice-card">
              <h3>🌅 Morning Yoga</h3>
              <p>Start the day with guided asanas and Surya Namaskar to awaken the body and mind.</p>
            </div>
            <div className="practice-card">
              <h3>🧘 Meditation</h3>
              <p>Silent and guided sessions held in the main hall to cultivate deep inner stillness.</p>
            </div>
            <div className="practice-card">
              <h3>🪔 Evening Aarti</h3>
              <p>Join the community for devotional chanting and the traditional offering of light.</p>
            </div>
          </div>
        </div>
      </section>


      {/* 4. COMMUNITY VOICES (Testimonials Carousel) */}
      <section className="testimonials-section">
        <div className="container">
          <h2>Community Voices</h2>
          <p className="section-subtitle">Read about the experiences of those who have walked our paths.</p>
          
          {/* 2. Replace the grid with this Swiper component */}
          <Swiper
            modules={[Pagination, Autoplay]}
            spaceBetween={30}
            slidesPerView={1}
            pagination={{ clickable: true }}
            autoplay={{ delay: 5000, disableOnInteraction: false }} // Auto-scrolls every 5 seconds
            breakpoints={{
              768: { slidesPerView: 2 }, // Shows 2 cards on tablets
              1024: { slidesPerView: 3 }, // Shows 3 cards on desktop
            }}
            className="testimonial-swiper"
          >
            <SwiperSlide>
              <div className="testimonial-card">
                <p className="quote">"A truly transformative experience. The daily routines and morning yoga brought me so much peace and clarity after a stressful year."</p>
                <div className="author">- Ananya S.</div>
              </div>
            </SwiperSlide>
            
            <SwiperSlide>
              <div className="testimonial-card">
                <p className="quote">"The evening Aarti is mesmerizing. I felt a deep sense of connection and community here. The teachings are profound yet accessible."</p>
                <div className="author">- Rahul M.</div>
              </div>
            </SwiperSlide>
            
            <SwiperSlide>
              <div className="testimonial-card">
                <p className="quote">"Volunteering in the kitchen taught me the true essence of Seva (selfless service). I will definitely be returning next year."</p>
                <div className="author">- Priya K.</div>
              </div>
            </SwiperSlide>
            
            {/* You can easily add more SwiperSlides here later! */}
            <SwiperSlide>
              <div className="testimonial-card">
                <p className="quote">"The silence I found here was exactly what my soul needed. A beautiful, welcoming space for anyone seeking truth."</p>
                <div className="author">- David L.</div>
              </div>
            </SwiperSlide>

          </Swiper>
        </div>
      </section>



      {/* 5. LOCATION & MAP */}
      <section className="location-section" ref={map}>
        <div className="container">
          <h2>Find Us</h2>
          <p>We are open to visitors daily from 5:00 AM to 8:00 PM.</p>
          
          <div className="map-container">
            <iframe 
              title="Achyuta Ananta Ashram Location"
              src="https://maps.google.com/maps?q=Achyuta+Ananta+Ashram,+VIP+Colony,+IRC+Village,+Nayapalli,+Bhubaneswar,+Odisha+751015,+India&t=&z=15&ie=UTF8&iwloc=&output=embed" 
              width="100%" 
              height="100%" 
              style={{ border: 0 }} 
              allowFullScreen="" 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>            
          </div>
        </div>
      </section>

    </div>
  );
}