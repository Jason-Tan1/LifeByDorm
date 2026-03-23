import React from 'react';
import { useTranslation } from 'react-i18next';
import DefaultCampus from '../../assets/Default_Campus.webp';
import './InfoSection.css';

const InfoSection: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="info-section-container wrapper">
      <div className="info-section-content">
        <div className="info-left">
          <h2 className="info-title">{t('infoSection.title')}</h2>
          <p className="info-description">
            {t('infoSection.description')}
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
                <div className="graphic-dorm-title">{t('infoSection.cardTitle')}</div>
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
