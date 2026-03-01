import React, { useState } from 'react';
import './GiveawayBanner.css';
import GiveawayModal from './GiveawayModal';

interface GiveawayBannerProps {
    totalReviews: number;
}

const GiveawayBanner: React.FC<GiveawayBannerProps> = ({ totalReviews }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <>
            <div className="giveaway-banner-container">
                <div className="giveaway-banner-content">
                    <span className="giveaway-gift-icon">🎁</span>
                    <span className="giveaway-text">
                        <strong>$25 Amazon Gift Card Giveaway!</strong> at 500 reviews — currently ({totalReviews}/500)
                    </span>
                    <button
                        className="giveaway-rules-btn"
                        onClick={() => setIsModalOpen(true)}
                        aria-label="See Giveaway Rules"
                    >
                        See Rules
                        <span className="giveaway-arrow">→</span>
                    </button>
                </div>
            </div>

            <GiveawayModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </>
    );
};

export default GiveawayBanner;
