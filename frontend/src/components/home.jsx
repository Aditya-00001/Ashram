import React, {useRef, useState, useEffect} from 'react';
import './Home.css';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';



export default function Home() {

  const map= useRef(null);
  const [publicPujas, setPublicPujas] = useState({ today: null, upcoming: null });
  const [loadingPujas, setLoadingPujas] = useState(true);
  
  useEffect(() => {
    const fetchPujas = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/pujas/public`);
        if (res.ok) {
          const data = await res.json();
          setPublicPujas(data);
        }
      } catch (err) {
        console.error("Failed to fetch public pujas", err);
      } finally {
        setLoadingPujas(false);
      }
    };

    fetchPujas();
  }, []);

  // Helper to format time (18:30 -> 6:30 PM)
  const formatTime = (time24h) => {
    if (!time24h) return '';
    let [h, m] = time24h.split(':');
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h}:${m} ${ampm}`;
  };

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
            Achyuta Ashram is a sacred space dedicated to the pursuit of truth and selfless service. Nestled in nature, we provide a supportive environment for seekers to deepen their spiritual practice, connect with a mindful community, and rediscover their inner silence.
          </p>
        </div>
      </section>
      {/* --- LIVE PUJA SCHEDULER WIDGETS --- */}
      <section style={{ padding: '40px 20px', backgroundColor: '#111', borderBottom: '1px solid #333' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', color: '#e67e22', marginBottom: '30px' }}>Daily Seva & Schedules</h2>
          
          {loadingPujas ? (
            <p style={{ textAlign: 'center', color: '#888' }}>Loading schedules...</p>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'center' }}>
              
              {/* WIDGET 1: TODAY's PUJA */}
              <div style={{ flex: '1 1 300px', backgroundColor: '#1a1a1a', borderLeft: '4px solid #2ecc71', borderRadius: '8px', padding: '25px', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}>
                <h4 style={{ margin: '0 0 15px 0', color: '#2ecc71', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.9rem' }}>
                  🟢 Today's Puja
                </h4>
                {publicPujas.today ? (
                  <>
                    <h3 style={{ margin: '0 0 10px 0', fontSize: '1.5rem', color: '#fff' }}>{publicPujas.today.pujaName}</h3>
                    <p style={{ margin: '5px 0', color: '#ccc', fontSize: '1.1rem' }}>🕒 {formatTime(publicPujas.today.time)}</p>
                    <p style={{ margin: '15px 0 0 0', color: '#888', fontStyle: 'italic' }}>
                      Sponsored by: <span style={{ color: '#e67e22', fontWeight: 'bold' }}>{publicPujas.today.sponsorName}</span>
                    </p>
                  </>
                ) : (
                  <>
                    <h3 style={{ margin: '0 0 10px 0', fontSize: '1.3rem', color: '#fff' }}>Daily Nitya Seva</h3>
                    <p style={{ margin: '5px 0', color: '#ccc' }}>Morning Aarti: 6:00 AM</p>
                    <p style={{ margin: '5px 0', color: '#ccc' }}>Evening Aarti: 6:30 PM</p>
                    <p style={{ margin: '15px 0 0 0', color: '#888', fontStyle: 'italic', fontSize: '0.9rem' }}>
                      No special sponsored Pujas today.
                    </p>
                  </>
                )}
              </div>

              {/* WIDGET 2: NEXT UPCOMING PUJA */}
              <div style={{ flex: '1 1 300px', backgroundColor: '#1a1a1a', borderLeft: '4px solid #e67e22', borderRadius: '8px', padding: '25px', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}>
                <h4 style={{ margin: '0 0 15px 0', color: '#e67e22', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.9rem' }}>
                  ⏳ Next Upcoming Puja
                </h4>
                {publicPujas.upcoming ? (
                  <>
                    <h3 style={{ margin: '0 0 10px 0', fontSize: '1.5rem', color: '#fff' }}>{publicPujas.upcoming.pujaName}</h3>
                    <p style={{ margin: '5px 0', color: '#ccc', fontSize: '1.1rem' }}>📅 {new Date(publicPujas.upcoming.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                    <p style={{ margin: '5px 0', color: '#ccc', fontSize: '1.1rem' }}>🕒 {formatTime(publicPujas.upcoming.time)}</p>
                    <p style={{ margin: '15px 0 0 0', color: '#888', fontStyle: 'italic' }}>
                      Sponsored by: <span style={{ color: '#e67e22', fontWeight: 'bold' }}>{publicPujas.upcoming.sponsorName}</span>
                    </p>
                  </>
                ) : (
                  <p style={{ margin: '0', color: '#ccc', display: 'flex', height: '100%', alignItems: 'center' }}>
                    No upcoming special Pujas scheduled at the moment. Check back soon!
                  </p>
                )}
              </div>

            </div>
          )}
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