import React, { useState, useEffect } from 'react';
import { FiMapPin, FiMail, FiPhone, FiGlobe, FiChevronRight } from 'react-icons/fi';
import './Footer.css';

const Footer = () => {
  const [location, setLocation] = useState(null);
  const [mapError, setMapError] = useState(null);
  const [isHovering, setIsHovering] = useState(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          setMapError("Location access denied - showing default location");
          // Fallback to company location
          setLocation({
            lat: 37.7749,  // Default coordinates (San Francisco)
            lng: -122.4194
          });
        }
      );
    } else {
      setMapError("Geolocation not supported - showing default location");
      setLocation({
        lat: 37.7749,
        lng: -122.4194
      });
    }
  }, []);

  return (
    <footer className="app-footer">
      <div className="footer-wave"></div>
      <div className="footer-container">
        <div className="footer-grid">
          {/* Company Info */}
          <div className="footer-section">
            <div className="footer-brand">
              <span className="logo">Excel Analytics</span>
              <span className="tagline">Data Insights Simplified</span>
            </div>
            <p className="footer-text">
              Transform your data into actionable insights with our powerful analytics platform.
            </p>
            <div className="footer-contact">
              <div 
                className="contact-item"
                onMouseEnter={() => setIsHovering('email')}
                onMouseLeave={() => setIsHovering(null)}
              >
                <div className="contact-icon-container">
                  <FiMail className="contact-icon" />
                  {isHovering === 'email' && <span className="contact-tooltip">Click to email us</span>}
                </div>
                <a href="mailto:support@excelanalytics.com">support@excelanalytics.com</a>
              </div>
              <div 
                className="contact-item"
                onMouseEnter={() => setIsHovering('phone')}
                onMouseLeave={() => setIsHovering(null)}
              >
                <div className="contact-icon-container">
                  <FiPhone className="contact-icon" />
                  {isHovering === 'phone' && <span className="contact-tooltip">Call us</span>}
                </div>
                <a href="tel:+18001234567">+1 (800) 123-4567</a>
              </div>
              <div 
                className="contact-item"
                onMouseEnter={() => setIsHovering('website')}
                onMouseLeave={() => setIsHovering(null)}
              >
                <div className="contact-icon-container">
                  <FiGlobe className="contact-icon" />
                  {isHovering === 'website' && <span className="contact-tooltip">Visit our website</span>}
                </div>
                <a href="https://www.excelanalytics.com" target="_blank" rel="noopener noreferrer">www.excelanalytics.com</a>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer-section">
            <h3 className="footer-heading">Navigate</h3>
            <ul className="footer-links">
              {['Dashboard', 'Analyze Data', 'Upload Files', 'Reports', 'Settings'].map((item) => (
                <li key={item}>
                  <a href="#">
                    <FiChevronRight className="link-arrow" />
                    <span>{item}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div className="footer-section">
            <h3 className="footer-heading">Resources</h3>
            <ul className="footer-links">
              {['Documentation', 'API Reference', 'Tutorials', 'Community', 'Blog'].map((item) => (
                <li key={item}>
                  <a href="#">
                    <FiChevronRight className="link-arrow" />
                    <span>{item}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Location Map */}
          <div className="footer-section">
            <h3 className="footer-heading">
              <FiMapPin className="map-icon" /> Our Location
            </h3>
            <div className="footer-map-container">
              {mapError && <div className="map-notice">{mapError}</div>}
              {location ? (
                <iframe
                  title="Company Location"
                  className="footer-map"
                  loading="lazy"
                  allowFullScreen
                  src={`https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3431.671796367474!2d78.12174637547656!3d29.92816222484006!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390948404aa58ef3%3A0x19215d498574b5d!2sJwalapur%2C%20Haridwar%2C%20Uttarakhand%20249101!5e0!3m2!1sen!2sin!4v1718096759935!5m2!1sen!2sin`}
                ></iframe>
              ) : (
                <div className="map-loading">Loading map...</div>
              )}
              <div className="map-overlay">View Larger Map</div>
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="footer-bottom">
          <div className="footer-social">
            {['Twitter', 'LinkedIn', 'GitHub', 'YouTube'].map((social) => (
              <a 
                key={social} 
                href="#" 
                className={`social-link ${social.toLowerCase()}`}
                aria-label={social}
              >
                {social}
              </a>
            ))}
          </div>
          <div className="footer-copyright">
            © {new Date().getFullYear()} Excel Analytics Platform. All rights reserved.
          </div>
          <div className="footer-legal">
            {['Terms of Service', 'Privacy Policy', 'Cookie Policy', 'Contact Us'].map((item) => (
              <a key={item} href="#">{item}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;