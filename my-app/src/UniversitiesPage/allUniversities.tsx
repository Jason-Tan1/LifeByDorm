import { Link } from 'react-router-dom';
import NavBar from '../NavBarPages/navbar';
import Footer from '../homepage/footer';
import './allUniversities.css';
import DefaultCampusImage from '../assets/Default_Campus.png';
import { useUniversityData } from '../context/UniversityDataContext';
import PageLoader from '../components/PageLoader';

function AllUniversities() {
  // Use shared context instead of making a separate API call
  const { universities, isLoading: loading, error } = useUniversityData();

  if (loading) return <PageLoader />;

  return (
    <div className="all-universities-page">
      <NavBar />

      {/* Hero Section */}
      <div className="uni-hero" style={{ backgroundImage: `url(${DefaultCampusImage})` }}>
        <div className="uni-hero-overlay">
          <h1>University List</h1>
        </div>
      </div>

      <div className="all-universities-content">
        <h2 style={{ marginBottom: '20px', fontSize: '1.5rem', paddingBottom: '10px' }}>
          All Universities ({universities.length})
        </h2>
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
