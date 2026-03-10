import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import NavBar from '../nav/navbar';
import Footer from '../home/footer';
import './allUniversities.css';
import { useUniversityData } from '../../context/UniversityDataContext';
import PageLoader from '../../components/PageLoader';
import { useSEO } from '../../hooks/useSEO';

function AllUniversities() {
  const { t } = useTranslation();
  // Use shared context instead of making a separate API call
  const { universities, isLoading: loading, error } = useUniversityData();

  useSEO({
    title: 'All Canadian Universities — Dorm Reviews',
    description: `Browse dorm reviews for ${universities.length || '50+'} Canadian universities. Find real student photos and ratings for every residence.`,
    canonicalPath: '/universities'
  });

  if (loading) return <PageLoader />;

  return (
    <div className="all-universities-page legal-page-wrapper">
      <NavBar />

      <div className="legal-container contact-clean-container" style={{ maxWidth: '1200px' }}>
        <h1 className="legal-page-title">{t('universityList.title')}</h1>
        <div className="legal-section">
          <h2>
            {t('universityList.allUniversities')} ({universities.length})
          </h2>
        </div>
        {error && <p>Error: {error}</p>}
        {!loading && !error && (
          <ul className="university-list">
            {universities.map((uni) => (
              <li key={uni.slug}>
                <Link to={`/universities/${uni.slug}`}>
                  {uni.name}
                  {uni.location && <span className="location"> - {uni.location}</span>}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Footer />
    </div>
  );
}

export default AllUniversities;
