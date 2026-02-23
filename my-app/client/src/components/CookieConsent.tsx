import React, { useState, useEffect } from 'react';
import './CookieConsent.css';

const CookieConsent: React.FC = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Check if user has already made a choice
        const consent = localStorage.getItem('cookieConsent');
        if (!consent) {
            // Small delay for better UX
            const timer = setTimeout(() => {
                setIsVisible(true);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem('cookieConsent', 'accepted');
        setIsVisible(false);
    };

    const handleDeny = () => {
        localStorage.setItem('cookieConsent', 'denied');
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="cookie-consent-container">
            <div className="cookie-consent-content">
                <div className="cookie-text">
                    <h3>Cookies 🍪</h3>
                    <p>
                        We use cookies to improve your experience.
                        Do you accept our use of cookies?
                    </p>
                </div>
                <div className="cookie-actions">
                    <button className="cookie-btn deny-btn" onClick={handleDeny}>
                        Deny
                    </button>
                    <button className="cookie-btn accept-btn" onClick={handleAccept}>
                        Accept
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CookieConsent;
