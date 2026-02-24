import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import NavBar from './navbar.tsx';
import Footer from '../home/footer.tsx';
import './contactme.css';
import DefaultDormImage from '../../assets/Default_Dorm.png';

function ContactMe() {
  const { t } = useTranslation();
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
      alert(t('contact.successAlert'));
      setFormData({ fullName: '', email: '', message: '' });
    } catch (err) {
      alert(t('contact.errorAlert'));
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
          <h1>{t('contact.title')}</h1>
        </div>
      </div>

      <div className="contact-content">
        <div className="contact-container">
          {/* h1 hidden by CSS but removed here effectively */}
          <p className="contact-subtitle">{t('contact.subtitle')}</p>

          <form className="contact-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="fullName">{t('contact.fullNameLabel')}</label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder={t('contact.fullNamePlaceholder')}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">{t('contact.emailLabel')}</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder={t('contact.emailPlaceholder')}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="message">{t('contact.messageLabel')}</label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder={t('contact.messagePlaceholder')}
                rows={6}
                required
              />
            </div>

            <button type="submit" className="submit-button">
              {t('contact.submitButton')}
            </button>
          </form>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default ContactMe;