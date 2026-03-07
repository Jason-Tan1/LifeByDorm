import React from 'react';
import './GiveawayBanner.css'; // Uses shared styles with the banner

interface GiveawayModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const GiveawayModal: React.FC<GiveawayModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="giveaway-modal-overlay" onClick={onClose}>
            <div className="giveaway-modal-container" onClick={(e) => e.stopPropagation()}>
                <button className="giveaway-modal-close" onClick={onClose} aria-label="Close Rules">
                    ×
                </button>

                <div className="giveaway-modal-header">
                    <h2>Giveaway Rules</h2>
                </div>

                <div className="giveaway-modal-body">
                    <p className="giveaway-modal-intro">
                        Help us reach <strong>250 total reviews</strong>! Once we hit the milestone, we will randomly select one eligible reviewer to win a <strong>$25 Amazon Gift Card</strong>!
                    </p>

                    <div className="giveaway-rules-list">
                        <div className="giveaway-rule-item">
                            <div className="giveaway-rule-number">1</div>
                            <div className="giveaway-rule-text">
                                <strong>Log into your account</strong>
                                <p>You must be authenticated so we know who to contact if you win.</p>
                            </div>
                        </div>

                        <div className="giveaway-rule-item">
                            <div className="giveaway-rule-number">2</div>
                            <div className="giveaway-rule-text">
                                <strong>Submit a review</strong>
                                <p>Write an honest review for any dorm on the platform.</p>
                            </div>
                        </div>

                        <div className="giveaway-rule-item">
                            <div className="giveaway-rule-number">3</div>
                            <div className="giveaway-rule-text">
                                <strong>Add a photo</strong>
                                <p>Include at least one photo of the dorm in your review.</p>
                            </div>
                        </div>
                    </div>

                    <div className="giveaway-modal-footer">
                        <button className="giveaway-modal-action-btn" onClick={onClose}>
                            Got it, let's go!
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GiveawayModal;
