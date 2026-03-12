import React from 'react';
import DefaultCampus from '../../assets/Default_Campus.webp';
import './InfoSection.css';

const InfoSection: React.FC = () => {
  return (
    <div className="info-section-container wrapper">
      <div className="info-section-content">
        <div className="info-left">
          <h2 className="info-title">We're LifeByDorm</h2>
          <p className="info-description">
            We're a dorm review platform built by students, for students. Our vision is to become
            the universal hub for Canadian university living by empowering students to share real experiences,
            share authentic photos, and choose their perfect home with confidence.
          </p>
        </div>

        <div className="info-right-card">
          <div className="info-card-graphic">
            {/* Custom LifeByDorm Graphic: A floating dorm review card */}
            <div className="graphic-dorm-card">
              <div
                className="graphic-dorm-image"
                style={{ backgroundImage: `url(${DefaultCampus})` }}
              />
              <div className="graphic-dorm-details">
                <div className="graphic-dorm-title">Campus Residence</div>
                <div className="graphic-dorm-stars">
                  <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
                </div>
              </div>
            </div>
            {/* abstract floating accents */}
            <div className="graphic-accent-pill graphic-accent-1" />
            <div className="graphic-accent-pill graphic-accent-2" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default InfoSection;
