import { useTranslation } from 'react-i18next';
import './legal.css';
import NavBar from '../nav/navbar';
import Footer from '../home/footer';
import { useSEO } from '../../hooks/useSEO';

function TermsOfService() {
  const { t } = useTranslation();

  useSEO({
    title: 'Terms of Service',
    description: 'Read the Terms of Service for LifeByDorm. Learn about the rules and guidelines for using our dorm review platform.',
    canonicalPath: '/terms'
  });

  return (
    <div className="legal-page-wrapper">
      <NavBar />

      <div className="legal-container">
        <h1 className="legal-page-title">{t('legal.termsTitle')}</h1>
        <span className="legal-date">{t('legal.lastUpdatedTerms')}</span>

        <div className="legal-section">
          <p>{t('legal.termsIntro')}</p>
        </div>

        <div className="legal-section">
          <h2>{t('legal.terms1Title')}</h2>
          <p>{t('legal.terms1Text')}</p>
        </div>

        <div className="legal-section">
          <h2>{t('legal.terms2Title')}</h2>
          <p>{t('legal.terms2Text')}</p>
        </div>

        <div className="legal-section">
          <h2>{t('legal.terms3Title')}</h2>
          <p>{t('legal.terms3Text1')}</p>
          <p>{t('legal.terms3Text2')}</p>
          <ul>
            <li>{t('legal.terms3Bullet1')}</li>
            <li>{t('legal.terms3Bullet2')}</li>
            <li>{t('legal.terms3Bullet3')}</li>
            <li>{t('legal.terms3Bullet4')}</li>
          </ul>
          <p>{t('legal.terms3Text3')}</p>
        </div>

        <div className="legal-section">
          <h2>{t('legal.terms4Title')}</h2>
          <p>{t('legal.terms4Text')}</p>
        </div>

        <div className="legal-section">
          <h2>{t('legal.terms5Title')}</h2>
          <p>{t('legal.terms5Text')}</p>
        </div>

        <div className="legal-section">
          <h2>{t('legal.terms6Title')}</h2>
          <p>{t('legal.terms6Text')}</p>
        </div>

        <div className="legal-section">
          <h2>{t('legal.terms7Title')}</h2>
          <p>{t('legal.terms7Text')}</p>
        </div>

        <div className="legal-section">
          <h2>{t('legal.terms8Title')}</h2>
          <p>{t('legal.terms8Text')}</p>
        </div>

        <div className="legal-section">
          <h2>{t('legal.terms9Title')}</h2>
          <p>{t('legal.terms9Text')}</p>
        </div>

        <div className="legal-contact">
          <h2>{t('legal.contactUs')}</h2>
          <p>
            {t('legal.contactTerms')}
            <br />
            <strong>support@lifebydorm.ca</strong>
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default TermsOfService;
