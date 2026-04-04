import React, { useState, useEffect } from 'react';
import './Events.css';

export default function Events() {
  // 1. Set up state for the events, loading status, and errors
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // 2. Use useEffect to fetch data when the component loads
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/events');
        if (!response.ok) throw new Error('Failed to fetch events');
        
        const data = await response.json();
        setEvents(data.events); // Save the database events into React state
        setIsLoading(false);
      } catch (err) {
        setError(err.message);
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, []); // The empty array means this runs exactly once when the page loads

  return (
    <div className="events-page">
      <div className="container">
        <div className="events-header">
          <h2>Upcoming Pujas & Events</h2>
          <p>Join us in our daily rhythms and special lunar observances.</p>
        </div>

        {/* 3. Handle Loading and Error states gracefully */}
        {isLoading && <p style={{ textAlign: 'center', color: '#e67e22' }}>Loading events...</p>}
        {error && <p style={{ textAlign: 'center', color: '#ff4757' }}>{error}</p>}

        {/* 4. Render the real events! */}
        {!isLoading && !error && (
          <div className="events-list">
            {events.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#ccc' }}>No upcoming events scheduled at the moment.</p>
            ) : (
              events.map((event) => (
                <div key={event._id} className="event-card"> {/* MongoDB uses _id instead of id */}
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
      </div>
    </div>
  );
}