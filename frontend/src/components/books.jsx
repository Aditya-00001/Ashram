import React from 'react';
import './Books.css';

export default function Books() {
  // Array holding your two books. You can easily edit these placeholders later!
  const ashramBooks = [
    {
      id: 1,
      title: "The Path to Inner Stillness",
      author: "Swami Achyuta",
      description: "A comprehensive guide to finding peace in a chaotic world. This foundational text explores deep meditation techniques and the philosophy of selfless service.",
      coverUrl: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800",
      price: "Free / Donation"
    },
    {
      id: 2,
      title: "Daily Wisdom & Practices",
      author: "Ashram Disciples",
      description: "A collection of daily mantras, dietary guidelines, and physical routines—including the transformative practice of 20 Surya Namaskars daily—for a balanced spiritual life.",
      coverUrl: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=800",
      price: "Free / Donation"
    }
  ];

  return (
    <div className="books-page">
      <div className="container">
        <h2>Ashram Library & Publications</h2>
        <p className="books-intro">
          Explore our spiritual texts and daily guides. Available in print at the ashram or as digital downloads.
        </p>

        <div className="books-grid">
          {ashramBooks.map((book) => (
            <div key={book.id} className="book-card">
              <img src={book.coverUrl} alt={book.title} className="book-cover" />
              
              <div className="book-info">
                <h3>{book.title}</h3>
                <p className="book-author">By {book.author}</p>
                <p className="book-description">{book.description}</p>
                
                {/* <div className="book-footer"> */}
                  {/* <span className="book-price">{book.price}</span> */}
                  {/* <button className="read-btn">Read Now</button> */}
                {/* </div> */}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}