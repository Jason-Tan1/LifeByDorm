import { useTranslation } from 'react-i18next';
import './legal.css';
import NavBar from '../nav/navbar';
import Footer from '../home/footer';
import { useSEO } from '../../hooks/useSEO';

function PrivacyPolicy() {
  const { t } = useTranslation();

  useSEO({
    title: 'Privacy Policy',
    description: 'Learn how LifeByDorm collects, uses, and protects your personal information. Read our full Privacy Policy.',
    canonicalPath: '/privacy'
  });

  return (
    <div className="legal-page-wrapper">
      <NavBar />

      <div className="legal-container">
        <h1 className="legal-page-title">{t('legal.privacyTitle')}</h1>
        <span className="legal-date">{t('legal.lastUpdatedPrivacy')}</span>

        <div className="legal-section">
          <p>{t('legal.privacyIntro')}</p>
        </div>

        <div className="legal-section">
          <h2>{t('legal.privacy1Title')}</h2>
          <p>{t('legal.privacy1Text')}</p>
          <ul>
            <li><strong>{t('legal.privacy1Bullet1Title')}</strong> {t('legal.privacy1Bullet1Text')}</li>
            <li><strong>{t('legal.privacy1Bullet2Title')}</strong> {t('legal.privacy1Bullet2Text')}</li>
            <li><strong>{t('legal.privacy1Bullet3Title')}</strong> {t('legal.privacy1Bullet3Text')}</li>
          </ul>
        </div>

        <div className="legal-section">
          <h2>{t('legal.privacy2Title')}</h2>
          <p>{t('legal.privacy2Text')}</p>
          <ul>
            <li>{t('legal.privacy2Bullet1')}</li>
            <li>{t('legal.privacy2Bullet2')}</li>
            <li>{t('legal.privacy2Bullet3')}</li>
            <li>{t('legal.privacy2Bullet4')}</li>
          </ul>
        </div>

        <div className="legal-section">
          <h2>{t('legal.privacy3Title')}</h2>
          <p>{t('legal.privacy3Text')}</p>
        </div>

        <div className="legal-section">
          <h2>{t('legal.privacy4Title')}</h2>
          <p>{t('legal.privacy4Text')}</p>
          <ul>
            <li><strong>{t('legal.privacy4Bullet1Title')}</strong> {t('legal.privacy4Bullet1Text')}</li>
            <li><strong>{t('legal.privacy4Bullet2Title')}</strong> {t('legal.privacy4Bullet2Text')}</li>
            <li><strong>{t('legal.privacy4Bullet3Title')}</strong> {t('legal.privacy4Bullet3Text')}</li>
          </ul>
        </div>

        <div className="legal-section">
          <h2>{t('legal.privacy5Title')}</h2>
          <p>{t('legal.privacy5Text')}</p>
        </div>

        <div className="legal-section">
          <h2>{t('legal.privacy6Title')}</h2>
          <p>{t('legal.privacy6Text')}</p>
        </div>

        <div className="legal-section">
          <h2>{t('legal.privacy7Title')}</h2>
          <p>{t('legal.privacy7Text')}</p>
        </div>

        <div className="legal-section">
          <h2>{t('legal.privacy8Title')}</h2>
          <p>{t('legal.privacy8Text')}</p>
        </div>

        <div className="legal-contact">
          <h2>{t('legal.contactUs')}</h2>
          <p>
            {t('legal.contactPrivacy')}
            <br />
            <strong>support@lifebydorm.ca</strong>
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default PrivacyPolicy;
