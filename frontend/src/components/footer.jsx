import { Link, useNavigate } from 'react-router-dom';
import './Footer.css';


export default function Footer() {
  const navigate = useNavigate();
  const handleButtonClick = () => {
  navigate('/donate'); // The path to the specific page
};
  return (
    <footer className="footer-container">
      <div className="footer-content">
        
        <div className="footer-section identity">
          <h3>Achyuta Ananta Ashram</h3>
          <p>"Finding peace through inner journey."</p>
        </div>

        <div className="footer-section links">
          <h4>Explore</h4>
          <Link to="/about">About Us</Link>
          <Link to="/schedule">Daily Schedule</Link>
          <Link to="/events">Events</Link>
        </div>

        <div className="footer-section contact">
          <h4>Visit Us</h4>
          <p>7RW2+385, VIP Colony, IRC Village, Nayapalli, Bhubaneswar, Odisha 751015, India</p>
          <p>Open: 5:00 AM - 8:00 PM</p>
          <p>Email: contact@omashram.org</p>
        </div>

        <div className="footer-section support">
          <h4>Connect</h4>
          {/* Add social icons here */}
          <button className="donate-btn" onClick={handleButtonClick}>
            Support Our Seva
          </button>
        </div>

      </div>
      
      <div className="footer-bottom">
        <p>© 2026 Achyuta Ananta Ashram. Reg No: 123456789</p>
        <div className="legal-links">
          <Link to="/privacy">Privacy Policy</Link>
        </div>
      </div>
    </footer>
  );
}