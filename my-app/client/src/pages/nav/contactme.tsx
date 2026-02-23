import React, { useState } from 'react';
import NavBar from './navbar.tsx';
import Footer from '../home/footer.tsx';
import './contactme.css';
import DefaultDormImage from '../../assets/Default_Dorm.png';

function ContactMe() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    message: ''
  });

  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const API_BASE = isLocal ? '' : ((import.meta as any).env?.VITE_API_BASE || '');
      const response = await fetch(`${API_BASE}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (!response.ok) throw new Error('Failed to send message');
      alert('Thank you for your message! We will get back to you soon.');
      setFormData({ fullName: '', email: '', message: '' });
    } catch (err) {
      alert('Sorry, there was an error sending your message. Please try emailing us directly.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="contact-page">
      <NavBar />

      {/* Hero Section */}
      <div className="contact-hero" style={{ backgroundImage: `url(${DefaultDormImage})` }}>
        <div className="contact-hero-overlay">
          <h1>Contact Us</h1>
        </div>
      </div>

      <div className="contact-content">
        <div className="contact-container">
          {/* h1 hidden by CSS but removed here effectively */}
          <p className="contact-subtitle">Have a question or feedback? We'd love to hear from you!</p>

          <form className="contact-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="fullName">Full Name</label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Enter your full name"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email address"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="message">Message</label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="Enter your message"
                rows={6}
                required
              />
            </div>

            <button type="submit" className="submit-button">
              Send Message
            </button>
          </form>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default ContactMe;