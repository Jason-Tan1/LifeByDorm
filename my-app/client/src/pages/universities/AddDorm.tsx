import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LoginModal from '../nav/login';
import './AddDorm.css';

// Use relative path '' on localhost to leverage the Vite proxy
const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const API_BASE = isLocal ? '' : ((import.meta as any).env?.VITE_API_BASE || '');

interface AddDormProps {
  universitySlug: string;
  universityName: string;
  onDormSubmitted?: () => void;
}

function AddDorm({ universitySlug, universityName, onDormSubmitted }: AddDormProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Form fields
  const [dormName, setDormName] = useState('');

  const handleOpenForm = () => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
      setShowLoginModal(true);
      return;
    }
    setIsFormOpen(true);
    setError(null);
    setSubmitSuccess(false);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setError(null);
    // Reset form
    setDormName('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const token = localStorage.getItem('token');
    if (!token) {
      setShowLoginModal(true);
      setIsSubmitting(false);
      return;
    }

    // Validate required fields
    if (!dormName.trim()) {
      setError(t('addDorm.nameRequired'));
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/dorms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: dormName.trim(),
          universitySlug: universitySlug
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit dorm');
      }

      // Success
      setSubmitSuccess(true);

      // Notify parent component
      if (onDormSubmitted) {
        onDormSubmitted();
      }

      // Redirect to review page after a short delay
      setTimeout(() => {
        setIsFormOpen(false);
        setDormName('');
        setSubmitSuccess(false);
        // Use universitySlug for the URL parameter to match existing behavior
        // Add isNewDorm=true so the review page knows to redirect back to Uni page
        navigate(`/review?university=${encodeURIComponent(universitySlug)}&dorm=${encodeURIComponent(dormName.trim())}&isNewDorm=true`);
      }, 1500);

    } catch (err: any) {
      setError(err.message || 'An error occurred while submitting the dorm');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="add-dorm-container">
      {/* Success Message */}
      {submitSuccess && (
        <div className="add-dorm-success">
          <CheckCircleIcon className="success-icon" />
          <div>
            <strong>{t('addDorm.successTitle')}</strong>
            <p>{t('addDorm.successMsg')}</p>
          </div>
        </div>
      )}

      {/* Error Message (when not logged in) */}
      {error && !isFormOpen && (
        <div className="add-dorm-error">
          {error}
        </div>
      )}

      {/* Add Dorm Call to Action Card */}
      {!isFormOpen && !submitSuccess && (
        <div className="add-dorm-cta-card">
          <h2>{t('addDorm.title')}</h2>
          <p>{t('addDorm.subtitle')}</p>
          <button className="add-dorm-btn" onClick={handleOpenForm}>
            {t('addDorm.btnAdd')}
          </button>
        </div>
      )}

      {/* Add Dorm Form */}
      {isFormOpen && !submitSuccess && (
        <div className="add-dorm-form-container">
          <div className="add-dorm-form-header">
            <h3>{t('addDorm.modalTitle')}</h3>
            <button className="close-btn" onClick={handleCloseForm} aria-label="Close form">
              <CloseIcon />
            </button>
          </div>

          <p className="form-subtitle">
            <Trans
              i18nKey="addDorm.formSubtitle"
              values={{ universityName }}
              components={{ bold: <strong /> }}
            />
          </p>

          {error && (
            <div className="form-error">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="add-dorm-form">
            <div className="form-group">
              <label htmlFor="dorm-name">{t('addDorm.labelName')}</label>
              <input
                id="dorm-name"
                type="text"
                value={dormName}
                onChange={(e) => setDormName(e.target.value)}
                placeholder={t('addDorm.placeholderName')}
                required
                disabled={isSubmitting}
                autoFocus
              />
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="cancel-btn"
                onClick={handleCloseForm}
                disabled={isSubmitting}
              >
                {t('addDorm.cancel')}
              </button>
              <button
                type="submit"
                className="submit-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? t('addDorm.submitting') : t('addDorm.submit')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Login Modal */}
      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)} 
      />
    </div>
  );
}

export default AddDorm;
