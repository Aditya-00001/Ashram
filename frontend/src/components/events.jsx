import React, { useState, useEffect } from 'react';
import './Events.css';

export default function Events() {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // --- NEW: Pagination State ---
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  useEffect(() => {
    const fetchEvents = async () => {
      // If it's page 1, use the main loader. Otherwise, use the small button loader.
      if (page === 1) setIsLoading(true);
      else setIsFetchingMore(true);

      try {
        // --- UPDATED: Fetch with page parameters ---
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/events?page=${page}&limit=10`);
        if (!response.ok) throw new Error('Failed to fetch events');
        
        const data = await response.json();
        
        // --- UPDATED: Append new events to the bottom if page > 1 ---
        if (page === 1) {
          setEvents(data.events);
        } else {
          setEvents(prev => [...prev, ...data.events]);
        }
        
        setTotalPages(data.totalPages);
      } catch (err) {
        setError(err.message);
      }
      
      setIsLoading(false);
      setIsFetchingMore(false);
    };

    fetchEvents();
  }, [page]); // Re-run whenever the 'page' changes!

  return (
    <div className="events-page">
      <div className="container">
        <div className="events-header">
          <h2>Upcoming Pujas & Events</h2>
          <p>Join us in our daily rhythms and special lunar observances.</p>
        </div>

        {isLoading && <p style={{ textAlign: 'center', color: '#e67e22' }}>Loading events...</p>}
        {error && <p style={{ textAlign: 'center', color: '#ff4757' }}>{error}</p>}

        {!isLoading && !error && (
          <div className="events-list">
            {events.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#ccc' }}>No upcoming events scheduled at the moment.</p>
            ) : (
              events.map((event) => (
                <div key={event._id} className="event-card"> 
                  <div className="event-date-box">
                    <span className="event-month">{event.date.split(' ')[0]}</span>
                    <span className="event-day">{event.date.split(' ')[1]?.replace(',', '')}</span>
                  </div>
                  
                  <div className="event-details">
                    <div className="event-meta">
                      <span className={`event-badge ${event.type === 'Lunar Day' ? 'lunar' : ''}`}>{event.type}</span>
                      <span className="event-time">🕒 {event.time}</span>
                    </div>
                    <h3>{event.title}</h3>
                    <p>{event.description}</p>
                  </div>
                  {event.imageUrl && (
                      <img src={event.imageUrl} alt={event.title} className="event-image" />
                    )}
                </div>
              ))
            )}
          </div>
        )}

        {/* --- NEW: Load More Button --- */}
        {page < totalPages && !isLoading && !error && (
          <div style={{ textAlign: 'center', marginTop: '40px', paddingBottom: '40px' }}>
            <button 
              className="cta-button" 
              onClick={() => setPage(prev => prev + 1)}
              disabled={isFetchingMore}
              style={{ opacity: isFetchingMore ? 0.7 : 1 }}
            >
              {isFetchingMore ? 'Loading...' : 'Load More Events'}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}