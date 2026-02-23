// import React from 'react';
import './legal.css';
import NavBar from '../nav/navbar';
import Footer from '../home/footer';
import DefaultDormImage from '../../assets/Default_Dorm.png';

function PrivacyPolicy() {
  return (
    <>
      <NavBar />
      
      {/* Hero Section */}
      <div className="page-hero" style={{ backgroundImage: `url(${DefaultDormImage})` }}>
        <div className="page-hero-overlay">
           <h1>Privacy Policy</h1>
        </div>
      </div>

      <div className="legal-container">
        <span className="legal-date">Last Updated: January 12, 2026</span>

        <div className="legal-section">
          <p>
            At LifeByDorm, we value your privacy and are committed to protecting your personal information. 
            This Privacy Policy explains how we collect, use, and safeguard your data when you use our website 
            and services.
          </p>
        </div>

        <div className="legal-section">
          <h2>1. Information We Collect</h2>
          <p>We collect information that you provide directly to us:</p>
          <ul>
            <li><strong>Account Information:</strong> When you sign up, we collect your email address and authentication details (such as Google OAuth tokens).</li>
            <li><strong>User Content:</strong> Reviews, ratings, comments, and other content you post on the platform.</li>
            <li><strong>Communications:</strong> Messages you send to us for support or inquiries.</li>
          </ul>
        </div>

        <div className="legal-section">
          <h2>2. How We Use Your Information</h2>
          <p>We use the collected information to:</p>
          <ul>
            <li>Provide, maintain, and improve our services.</li>
            <li>Verify your identity and prevent fraud.</li>
            <li>Send you technical notices, updates, security alerts, and support messages.</li>
            <li>Monitor and analyze trends, usage, and activities in connection with our services.</li>
          </ul>
        </div>

        <div className="legal-section">
          <h2>3. Cookies and Tracking Technologies</h2>
          <p>
            We use local storage and cookies to maintain your login session and preferences. 
            You can control cookies through your browser settings, but disabling them may affect 
            your ability to use certain features of the site.
          </p>
        </div>

        <div className="legal-section">
          <h2>4. Data Sharing and Disclosure</h2>
          <p>We do not sell your personal data. We may share your information in the following circumstances:</p>
          <ul>
            <li><strong>With Your Consent:</strong> We share information when you give us specific permission to do so.</li>
            <li><strong>Legal Requirements:</strong> We may disclose information if required by law or in response to valid requests by public authorities.</li>
            <li><strong>Service Providers:</strong> We may use third-party vendors to help us provide our services (e.g., hosting, analytics), subject to confidentiality agreements.</li>
          </ul>
        </div>

        <div className="legal-section">
          <h2>5. Data Security</h2>
          <p>
            We implement reasonable security measures to protect your personal information. 
            However, no method of transmission over the Internet is 100% secure, and we cannot 
            guarantee absolute security.
          </p>
        </div>

        <div className="legal-section">
          <h2>6. Third-Party Links</h2>
          <p>
            Our website may contain links to third-party websites. We are not responsible for the privacy 
            practices or content of those third-party sites. We encourage you to review their privacy policies.
          </p>
        </div>

        <div className="legal-section">
          <h2>7. Children's Privacy</h2>
          <p>
            Our services are not intended for individuals under the age of 13. We do not knowingly 
            collect personal information from children under 13. If we become aware that we have 
            collected such information, we will take steps to delete it.
          </p>
        </div>

        <div className="legal-section">
          <h2>8. Updates to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of any changes by 
            posting the new Privacy Policy on this page and updating the "Last Updated" date.
          </p>
        </div>

        <div className="legal-contact">
          <h2>Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us at: 
            <br />
            <strong>support@lifebydorm.ca</strong>
          </p>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default PrivacyPolicy;
