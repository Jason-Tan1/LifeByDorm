import NavBar from './navbar.tsx';
import Footer from '../home/footer.tsx';
import DefaultDormImage from '../../assets/Default_Dorm.png';
import { useTranslation } from 'react-i18next';
import './aboutme.css';
import '../legal/legal.css'; // Reusing the clean text formatting

function AboutMe() {
  const { t } = useTranslation();

  return (
    <div className="about-page">
      <NavBar />

      {/* Hero Section */}
      <div className="about-hero" style={{ backgroundImage: `url(${DefaultDormImage})` }}>
        <div className="about-hero-overlay">
          <h1>{t('about.title')}</h1>
        </div>
      </div>

      <div className="legal-container">

        <div className="legal-section">
          <h2>{t('about.missionTitle')}</h2>
          <p>{t('about.missionText')}</p>
        </div>

        <div className="legal-section">
          <h2>{t('about.whoWeAreTitle')}</h2>
          <p>{t('about.whoWeAreText')}</p>
        </div>

        <div className="legal-section">
          <h2>{t('about.whatWeDoTitle')}</h2>
          <p>{t('about.whatWeDoText')}</p>
          <ul>
            <li><strong>{t('about.authenticReviews')}</strong> {t('about.authenticReviewsText')}</li>
            <li><strong>{t('about.detailedRatings')}</strong> {t('about.detailedRatingsText')}</li>
            <li><strong>{t('about.photos')}</strong> {t('about.photosText')}</li>
          </ul>
        </div>

        <div className="legal-section">
          <h2>{t('about.joinCommunityTitle')}</h2>
          <p>{t('about.joinCommunityText')}</p>
        </div>

      </div>
      <Footer />
    </div>
  )
}

export default AboutMe;