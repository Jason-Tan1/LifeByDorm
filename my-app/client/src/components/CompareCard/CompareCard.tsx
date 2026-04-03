import './CompareCard.css';

interface CompareCardProps {
  onOpenCompare: () => void;
  title?: string;
  description?: string;
}

export default function CompareCard({ onOpenCompare, title, description }: CompareCardProps) {
  return (
    <div className="compare-info-card">
      <h2>{title || 'Compare with another dorm?'}</h2>
      <p>{description || 'Visit the compare interface to see how this dorm stacks up against others.'}</p>
      <button
        onClick={onOpenCompare}
        className="compare-info-btn"
      >
        Compare Dorms
      </button>
    </div>
  );
}
