import './CompareCard.css';

interface CompareCardProps {
  onOpenCompare: () => void;
}

export default function CompareCard({ onOpenCompare }: CompareCardProps) {
  return (
    <div className="compare-info-card">
      <h2>Compare with another dorm?</h2>
      <p>Visit the compare interface to see how this dorm stacks up against others.</p>
      <button
        onClick={onOpenCompare}
        className="compare-info-btn"
      >
        Compare Dorms
      </button>
    </div>
  );
}
