import { useTranslation } from 'react-i18next';
import './legal.css';
import NavBar from '../nav/navbar';
import Footer from '../home/footer';
import { useSEO } from '../../hooks/useSEO';

function ReviewGuidelines() {
  const { t } = useTranslation();

  useSEO({
    title: 'Review Guidelines',
    description: 'Guidelines and expectations for submitting authentic dorm reviews to LifeByDorm.',
    canonicalPath: '/review-guidelines'
  });

  return (
    <div className="legal-page-wrapper">
      <NavBar />

      <div className="legal-container">
        <h1 className="legal-page-title">{t('legal.reviewGuidelinesTitle')}</h1>
        <span className="legal-date">{t('legal.lastUpdatedReviewGuidelines')}</span>

        <div className="legal-section">
          <p>{t('legal.reviewGuidelinesIntro')}</p>
        </div>

        <div className="legal-section">
          <h2>{t('legal.review1Title')}</h2>
          <p>{t('legal.review1Text')}</p>
        </div>

        <div className="legal-section">
          <h2>{t('legal.review2Title')}</h2>
          <p>{t('legal.review2Text')}</p>
        </div>

        <div className="legal-section">
          <h2>{t('legal.review3Title')}</h2>
          <p>{t('legal.review3Text')}</p>
        </div>

        <div className="legal-contact">
          <h2>{t('legal.contactUs')}</h2>
          <p>
            {t('legal.contactReview')}
            <br />
            <strong>support@lifebydorm.ca</strong>
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default ReviewGuidelines;
