import React, { useState } from 'react';

import { Link } from 'react-router-dom';
import DefaultCampus from '../../assets/Default_Campus.webp';
import DefaultDorm from '../../assets/Default_Dorm.webp';
import WriteReviewModal from '../../components/WriteReviewModal';
import './InfoSection.css';

const InfoSection: React.FC = () => {
  const [showReviewModal, setShowReviewModal] = useState(false);

  return (
    <div className="info-section-container">
      <div className="info-section-content">
        {/* Left side Main Content */}
        <div className="info-left">
          <h2 className="info-title">We're LifeByDorm</h2>
          <p className="info-description">
            We're a dorm review platform built by students, for students. Our vision is to become the universal hub for Canadian university living by empowering students to share real experiences, share authentic photos, and choose their perfect home with confidence.
          </p>
          <Link to="/aboutme" className="info-primary-btn">
            What we do
          </Link>
        </div>

        {/* Right side Inner Banner */}
        <div className="info-right-wrapper">
          <div className="info-inner-banner">
            <div className="banner-text-content">
              <h3>Share your dorm experience!</h3>
              <p>Help future students make the right choice by leaving an honest review of your university home.</p>
              <button className="banner-secondary-btn" onClick={() => setShowReviewModal(true)}>
                Write a review
              </button>
            </div>
            <div className="banner-graphic-photos">
              <div className="photo-card photo-back" style={{ backgroundImage: `url(${DefaultCampus})` }}></div>
              <div className="photo-card photo-front" style={{ backgroundImage: `url(${DefaultDorm})` }}>
                <div className="photo-like-badge">❤</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <WriteReviewModal isOpen={showReviewModal} onClose={() => setShowReviewModal(false)} />
    </div>
  );
};

export default InfoSection;
