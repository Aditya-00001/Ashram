import React, { useState } from 'react';

export default function CreatePollModal({ onSubmit, onClose }) {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']); // Start with 2 empty options

  const handleAddOption = () => {
    if (options.length >= 6) return alert("Maximum 6 options allowed.");
    setOptions([...options, '']);
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleRemoveOption = (index) => {
    if (options.length <= 2) return alert("A poll must have at least 2 options.");
    const newOptions = options.filter((_, i) => i !== index);
    setOptions(newOptions);
  };

  const handleSubmit = () => {
    if (!question.trim()) return alert("Please enter a question.");
    const validOptions = options.filter(opt => opt.trim() !== '');
    if (validOptions.length < 2) return alert("Please provide at least 2 valid options.");

    // Package the data exactly how our backend Schema expects it
    onSubmit({
      question: question.trim(),
      options: validOptions.map(opt => ({ optionText: opt }))
    });
  };

  return (
    <div className="chat-modal-overlay" style={{ zIndex: 2000 }}>
      <div className="chat-modal-content" style={{ width: '100%', maxWidth: '400px' }}>
        <div className="chat-modal-header">
          <h3 style={{ margin: 0, color: '#e67e22' }}>📊 Create a Poll</h3>
          <button onClick={onClose} className="close-modal-btn">✕</button>
        </div>

        <div style={{ marginTop: '15px' }}>
          <input 
            type="text" 
            placeholder="Ask a question..." 
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            style={{ width: '100%', padding: '10px', backgroundColor: '#1a1a1a', border: '1px solid #444', color: '#fff', borderRadius: '8px', marginBottom: '15px' }}
          />

          {options.map((opt, index) => (
            <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
              <input 
                type="text" 
                placeholder={`Option ${index + 1}`} 
                value={opt}
                onChange={(e) => handleOptionChange(index, e.target.value)}
                style={{ flex: 1, padding: '8px', backgroundColor: '#222', border: '1px solid #333', color: '#fff', borderRadius: '4px' }}
              />
              <button 
                onClick={() => handleRemoveOption(index)}
                style={{ background: 'none', border: 'none', color: '#ff4757', cursor: 'pointer', fontSize: '1.2rem' }}
              >✕</button>
            </div>
          ))}

          <button 
            onClick={handleAddOption}
            style={{ background: 'none', border: 'none', color: '#e67e22', cursor: 'pointer', fontSize: '0.9rem', marginBottom: '20px' }}
          >+ Add Option</button>

          <button className="cta-button" style={{ width: '100%' }} onClick={handleSubmit}>
            Send Poll
          </button>
        </div>
      </div>
    </div>
  );
}