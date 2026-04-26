import NavBar from './navbar.tsx';
import Footer from '../home/footer.tsx';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import './about.css';
import { useSEO } from '../../hooks/useSEO';
import UofTStGeorge from '../../assets/UofT-st-george-campus.webp';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CameraAltIcon from '@mui/icons-material/CameraAlt';

function About() {
  const { t } = useTranslation();

  useSEO({
    title: 'About LifeByDorm — Our Mission',
    description: 'LifeByDorm is an independent platform built by students, for students. We provide genuine reviews and insights on university accommodations across Canada.',
    canonicalPath: '/about'
  });

  return (
    <div className="about-page-container">
      <NavBar />
      
      <main className="about-main-content">
        {/* Hero Section */}
        <section className="about-hero-section">
          <div className="about-hero-text">
            <div className="about-hero-badge">Built by students, for students</div>
            <h1 className="about-hero-title">
              {t('about.title', 'About LifeByDorm')}
            </h1>
            <h2 className="about-hero-subtitle">
              {t('about.missionTitle', 'Our Mission')}
            </h2>
            <p className="about-hero-description">
              {t('about.missionText', 'LifeByDorm is an independent platform built by students, for students. Our mission is to provide genuine, unfiltered reviews and insights on university accommodations across Canada. We believe every student deserves to know exactly what they are signing up for before moving in.')}
            </p>
            <p className="about-hero-description">
              {t('about.whoWeAreText', 'Navigating university life is challenging enough without the stress of unpredictable living conditions. We created LifeByDorm to bridge the gap between glossy university brochures and the real student experience.')}
            </p>
          </div>
          
          <div className="about-hero-graphic">
            <div className="about-image-wrapper">
              <img src={UofTStGeorge} alt="University of Toronto St. George Campus" className="about-hero-img" />
              <div className="about-image-overlay"></div>
            </div>
          </div>
        </section>

        {/* Features / What We Do Section */}
        <section className="about-features-section">
          <div className="features-header">
            <h2>{t('about.whatWeDoTitle', 'What We Do')}</h2>
            <p>Empowering students to make informed decisions about their home away from home.</p>
          </div>
          
          <div className="about-features-grid">
            <div className="about-feature-card">
              <div className="feature-icon-wrapper auth-icon">
                <CheckCircleIcon />
              </div>
              <h3>{t('about.authenticReviews', 'Authentic Reviews:')}</h3>
              <p>{t('about.authenticReviewsText', 'Read honest experiences from students who have actually lived in these dorms. No censorship, just the truth.')}</p>
            </div>
            
            <div className="about-feature-card">
              <div className="feature-icon-wrapper rating-icon">
                <AutoAwesomeIcon />
              </div>
              <h3>{t('about.detailedRatings', 'Detailed Ratings:')}</h3>
              <p>{t('about.detailedRatingsText', 'From room size to bathroom cleanliness and location convenience, get a comprehensive breakdown of every residence.')}</p>
            </div>
            
            <div className="about-feature-card">
              <div className="feature-icon-wrapper photo-icon">
                <CameraAltIcon />
              </div>
              <h3>{t('about.photos', 'Real Photos:')}</h3>
              <p>{t('about.photosText', 'See what the dorms actually look like beyond the staged promotional pictures.')}</p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="about-cta-section">
          <div className="about-cta-content">
            <h2>{t('about.joinCommunityTitle', 'Join Our Community')}</h2>
            <p>{t('about.joinCommunityText', 'Help future students by sharing your own experiences. Whether your dorm was a dream or a disaster, your voice matters.')}</p>
            <Link to="/" className="about-cta-button">
              Explore Universities
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default About;