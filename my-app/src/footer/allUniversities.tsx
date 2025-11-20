import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import NavBar from '../NavBarPages/navbar';
import Footer from '../homepage/footer';
import './allUniversities.css';

type University = {
  name: string;
  slug: string;
  location?: string;
  totalStudents?: number;
};

const API_BASE = (import.meta as any).env?.VITE_API_BASE || 'http://localhost:3000';

function AllUniversities() {
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUniversities() {
      try {
        const response = await fetch(`${API_BASE}/api/universities`);
        if (!response.ok) throw new Error('Failed to fetch universities');
        const data = await response.json();
        setUniversities(data);
      } catch (e: any) {
        setError(e?.message || 'Failed to load universities');
      } finally {
        setLoading(false);
      }
    }

    fetchUniversities();
  }, []);

  return (
    <div className="all-universities-page">
      <NavBar />
      <div className="all-universities-content">
        <h1>University List ({universities.length} Universities)</h1>
        {loading && <p>Loading universities...</p>}
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