import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import './legal.css';
import NavBar from '../nav/navbar';
import Footer from '../home/footer';
import { useSEO } from '../../hooks/useSEO';

type FaqItem = {
  question: string;
  answer: string;
};

function HelpCenter() {
  const { t } = useTranslation();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  useSEO({
    title: 'Help Center',
    description: 'Get quick answers about writing dorm reviews, account support, moderation, and troubleshooting on LifeByDorm.',
    canonicalPath: '/help-center'
  });

  const faqs: FaqItem[] = [
    {
      question: t('helpCenter.faq1Question', 'How do I find my university and dorm?'),
      answer: t('helpCenter.faq1Answer', 'Use the university search on the homepage, then select your school to browse available residences. You can also use the filters to narrow down by dorm name or location.')
    },
    {
      question: t('helpCenter.faq2Question', 'How do I submit a dorm review?'),
      answer: t('helpCenter.faq2Answer', 'Open the dorm page, click the review button, and share your honest experience. Include helpful details about noise, cleanliness, amenities, and social environment so future students can make informed decisions.')
    },
    {
      question: t('helpCenter.faq3Question', 'Why is my review pending or removed?'),
      answer: t('helpCenter.faq3Answer', 'Reviews may be moderated if they include personal attacks, private information, spam, or content that violates our Review Guidelines. If you think this was a mistake, contact support for a second review.')
    },
    {
      question: t('helpCenter.faq4Question', 'Can I edit or delete my review later?'),
      answer: t('helpCenter.faq4Answer', 'Yes. You can edit your review through My Account. If you need your review removed and cannot access your account, contact support and we can help verify your request.')
    },
    {
      question: t('helpCenter.faq5Question', 'I cannot log in or my account is not working. What should I do?'),
      answer: t('helpCenter.faq5Answer', 'Try signing out and back in, clear your browser cache, and make sure third-party cookies are enabled for sign-in. If the issue continues, contact us with your device, browser, and screenshot of the error.')
    },
    {
      question: t('helpCenter.faq6Question', 'How can I report incorrect dorm information?'),
      answer: t('helpCenter.faq6Answer', 'Please email support with the university, dorm name, and what needs to be corrected. Our team reviews verified updates and refreshes listings as quickly as possible.')
    }
  ];

  const toggleItem = (index: number) => {
    setOpenIndex((current) => (current === index ? null : index));
  };

  return (
    <div className="legal-page-wrapper help-center-page">
      <NavBar />

      <div className="legal-container">
        <h1 className="legal-page-title">{t('helpCenter.title', 'Help Center')}</h1>
        <span className="legal-date">{t('helpCenter.lastUpdated', 'Last updated: March 26, 2026')}</span>

        <div className="legal-section">
          <p>
            {t(
              'helpCenter.intro',
              'Need help using LifeByDorm? Start with the FAQs below for quick answers about reviews, moderation, and account support.'
            )}
          </p>
        </div>

        <div className="legal-section">
          <h2>{t('helpCenter.faqTitle', 'Frequently Asked Questions')}</h2>
          <div className="help-faq-list" role="list">
            {faqs.map((faq, index) => {
              const isOpen = openIndex === index;

              return (
                <div className="help-faq-item" role="listitem" key={faq.question}>
                  <button
                    type="button"
                    className="help-faq-question"
                    onClick={() => toggleItem(index)}
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${index}`}
                    id={`faq-question-${index}`}
                  >
                    <span>{faq.question}</span>
                    <span className="help-faq-icon" aria-hidden="true">{isOpen ? '−' : '+'}</span>
                  </button>

                  {isOpen && (
                    <div
                      className="help-faq-answer"
                      id={`faq-answer-${index}`}
                      role="region"
                      aria-labelledby={`faq-question-${index}`}
                    >
                      <p>{faq.answer}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="legal-section">
          <h2>{t('helpCenter.quickTipsTitle', 'Quick Tips for Better Reviews')}</h2>
          <ul>
            <li>{t('helpCenter.tip1', 'Be specific: mention floor, room type, and what semester you stayed there.')}</li>
            <li>{t('helpCenter.tip2', 'Be balanced: include both pros and cons to keep reviews useful and fair.')}</li>
            <li>{t('helpCenter.tip3', 'Be respectful: avoid names or details that identify private individuals.')}</li>
          </ul>
        </div>

        <div className="legal-contact">
          <h2>{t('helpCenter.stillNeedHelpTitle', 'Still need help?')}</h2>
          <p>
            {t('helpCenter.stillNeedHelpText', 'Email us and we usually respond within 1-2 business days.')}
            <br />
            <strong>support@lifebydorm.ca</strong>
          </p>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default HelpCenter;