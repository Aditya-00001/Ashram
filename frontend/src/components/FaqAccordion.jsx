import React, { useState, useEffect } from 'react';

export default function FaqAccordion() {
  const [faqs, setFaqs] = useState([]);
  const [activeIndex, setActiveIndex] = useState(null);

  useEffect(() => {
    const fetchFaqs = async () => {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/faqs/public`);
      if (res.ok) setFaqs(await res.json());
    };
    fetchFaqs();
  }, []);

  const toggleAccordion = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  if (faqs.length === 0) return null;

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', padding: '0 20px' }}>
      <h2 style={{ textAlign: 'center', color: '#e67e22', marginBottom: '30px' }}>Frequently Asked Questions</h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {faqs.map((faq, index) => (
          <div 
            key={faq._id} 
            style={{ 
              backgroundColor: '#1a1a1a', 
              border: '1px solid #333', 
              borderRadius: '8px', 
              overflow: 'hidden'
            }}
          >
            {/* Accordion Header */}
            <button 
              onClick={() => toggleAccordion(index)}
              style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '20px',
                backgroundColor: activeIndex === index ? '#222' : 'transparent',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '1.1rem',
                fontWeight: 'bold',
                transition: 'background-color 0.2s'
              }}
            >
              <span>{faq.question}</span>
              <span style={{ 
                color: '#e67e22', 
                transform: activeIndex === index ? 'rotate(45deg)' : 'rotate(0)', 
                transition: 'transform 0.3s',
                fontSize: '1.5rem'
              }}>
                +
              </span>
            </button>

            {/* Accordion Body */}
            <div 
              style={{
                maxHeight: activeIndex === index ? '500px' : '0',
                padding: activeIndex === index ? '0 20px 20px 20px' : '0 20px',
                opacity: activeIndex === index ? 1 : 0,
                backgroundColor: '#222',
                transition: 'all 0.3s ease-in-out',
                overflow: 'hidden'
              }}
            >
              <p style={{ margin: 0, color: '#ccc', lineHeight: '1.6' }}>{faq.answer}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}