import { Link } from 'react-router-dom';
import './CompareCard.css';

interface CompareCardProps {
  dormSlug: string;
  universitySlug: string;
}

export default function CompareCard({ dormSlug, universitySlug }: CompareCardProps) {
  return (
    <div className="compare-info-card">
      <h2>Compare with another dorm?</h2>
      <p>Visit the compare page to see how this dorm stacks up against others.</p>
      <Link
        to={`/compare?dorm1=${dormSlug}&uni1=${universitySlug}`}
        className="compare-info-btn"
      >
        Compare Dorms
      </Link>
    </div>
  );
}
