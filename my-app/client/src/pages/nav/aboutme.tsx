import NavBar from './navbar.tsx';
import Footer from '../home/footer.tsx';
import { useTranslation } from 'react-i18next';
import './aboutme.css';
import '../legal/legal.css'; // Reusing the clean text formatting
import { useSEO } from '../../hooks/useSEO';

function AboutMe() {
  const { t } = useTranslation();

  useSEO({
    title: 'About LifeByDorm — Our Mission',
    description: 'LifeByDorm is an independent platform built by students, for students. We provide genuine reviews and insights on university accommodations across Canada.',
    canonicalPath: '/aboutme'
  });

  return (
    <div className="about-page legal-page-wrapper">
      <NavBar />

      <div className="legal-container">
        <h1 className="legal-page-title">{t('about.title')}</h1>

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