// import React from 'react';
import './legal.css';
import NavBar from '../NavBarPages/navbar';
import Footer from '../homepage/footer';
import DefaultDormImage from '../assets/Default_Dorm.png';

function TermsOfService() {
  return (
    <>
      <NavBar />
      
      {/* Hero Section */}
      <div className="page-hero" style={{ backgroundImage: `url(${DefaultDormImage})` }}>
        <div className="page-hero-overlay">
           <h1>Terms & Conditions</h1>
        </div>
      </div>

      <div className="legal-container">
        <span className="legal-date">Last Updated: January 12, 2026</span>

        <div className="legal-section">
          <p>
            Welcome to LifeByDorm. By accessing or using our website, you agree to be bound by these 
            Terms and Conditions and our Privacy Policy. If you do not agree to these terms, please 
            do not use our services.
          </p>
        </div>

        <div className="legal-section">
          <h2>1. Use of Services</h2>
          <p>
            You must be at least 13 years old to use this platform. You agree to use LifeByDorm only for 
            lawful purposes and in a way that does not infringe the rights of, restrict, or inhibit anyone 
            else's use and enjoyment of the website.
          </p>
        </div>

        <div className="legal-section">
          <h2>2. User Accounts</h2>
          <p>
            To access certain features, you may be required to create an account. You are responsible for 
            maintaining the confidentiality of your account credentials and for all activities that occur 
            under your account. You agree to notify us immediately of any unauthorized use of your account.
          </p>
        </div>

        <div className="legal-section">
          <h2>3. User-Generated Content</h2>
          <p>
            LifeByDorm allows users to post reviews, ratings, and other content. By posting content, you grant 
            us a non-exclusive, worldwide, royalty-free license to use, reproduce, modify, and display your 
            content in connection with providing our services.
          </p>
          <p>You agree NOT to post content that:</p>
          <ul>
            <li>Is unlawful, defamatory, harassing, or threatening.</li>
            <li>Contains false or misleading information.</li>
            <li>Infringes on the intellectual property rights of others.</li>
            <li>Contains spam, viruses, or malicious code.</li>
          </ul>
          <p>
            We reserve the right to remove any content that violates these terms or is otherwise objectionable, 
            at our sole discretion.
          </p>
        </div>

        <div className="legal-section">
          <h2>4. Intellectual Property</h2>
          <p>
            The content, design, and functionality of LifeByDorm (excluding user-generated content) are owned 
            by us and are protected by copyright, trademark, and other intellectual property laws. You may not 
            copy, modify, or distribute our content without our written permission.
          </p>
        </div>

        <div className="legal-section">
          <h2>5. Disclaimers</h2>
          <p>
            LifeByDorm is provided on an "AS IS" and "AS AVAILABLE" basis. We make no warranties, expressed 
            or implied, regarding the accuracy, reliability, or availability of the website or the information 
            provided by users. We do not endorse any specific dorms or guarantee the accuracy of reviews.
          </p>
        </div>

        <div className="legal-section">
          <h2>6. Limitation of Liability</h2>
          <p>
            To the fullest extent permitted by law, LifeByDorm shall not be liable for any indirect, incidental, 
            special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred 
            directly or indirectly, or any loss of data, use, goodwill, or other intangible losses.
          </p>
        </div>

        <div className="legal-section">
          <h2>7. Termination</h2>
          <p>
            We reserve the right to suspend or terminate your access to our services at any time, without prior 
            notice or liability, for any reason, including if you breach these Terms.
          </p>
        </div>

        <div className="legal-section">
          <h2>8. Governing Law</h2>
          <p>
            These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in 
            which LifeByDorm operates, without regard to its conflict of law provisions.
          </p>
        </div>

        <div className="legal-section">
          <h2>9. Changes to Terms</h2>
          <p>
            We reserve the right to modify these terms at any time. We will provide notice of significant changes 
            by posting the new terms on this site. Your continued use of the services after such changes 
            constitutes your acceptance of the new terms.
          </p>
        </div>

        <div className="legal-contact">
          <h2>Contact Us</h2>
          <p>
            If you have any questions regarding these Terms, please contact us at:
            <br />
            <strong>support@lifebydorm.ca</strong>
          </p>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default TermsOfService;
