import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import './AddDorm.css';

const API_BASE = (import.meta as any).env?.VITE_API_BASE || 'http://localhost:3000';

interface AddDormProps {
  universitySlug: string;
  universityName: string;
  onDormSubmitted?: () => void;
}

function AddDorm({ universitySlug, universityName, onDormSubmitted }: AddDormProps) {
  const navigate = useNavigate();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form fields
  const [dormName, setDormName] = useState('');

  const handleOpenForm = () => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Please log in to submit a dorm');
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
      setError('Please log in to submit a dorm');
      setIsSubmitting(false);
      return;
    }

    // Validate required fields
    if (!dormName.trim()) {
      setError('Dorm name is required');
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
        navigate(`/review?university=${encodeURIComponent(universitySlug)}&dorm=${encodeURIComponent(dormName.trim())}`);
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
            <strong>Dorm submitted!</strong>
            <p>Redirecting you to leave a review...</p>
          </div>
        </div>
      )}

      {/* Error Message (when not logged in) */}
      {error && !isFormOpen && (
        <div className="add-dorm-error">
          {error}
        </div>
      )}

      {/* Add Dorm Button */}
      {!isFormOpen && !submitSuccess && (
        <button className="add-dorm-btn" onClick={handleOpenForm}>
          <AddIcon className="add-icon" />
          <span>Add a New Dorm</span>
        </button>
      )}

      {/* Add Dorm Form */}
      {isFormOpen && !submitSuccess && (
        <div className="add-dorm-form-container">
          <div className="add-dorm-form-header">
            <h3>Submit a New Dorm</h3>
            <button className="close-btn" onClick={handleCloseForm} aria-label="Close form">
              <CloseIcon />
            </button>
          </div>
          
          <p className="form-subtitle">
            Add a dorm to <strong>{universityName}</strong>. You will be redirected to write a review for it.
          </p>

          {error && (
            <div className="form-error">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="add-dorm-form">
            <div className="form-group">
              <label htmlFor="dorm-name">Dorm Name *</label>
              <input
                id="dorm-name"
                type="text"
                value={dormName}
                onChange={(e) => setDormName(e.target.value)}
                placeholder="e.g., Founders Hall"
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
                Cancel
              </button>
              <button 
                type="submit" 
                className="submit-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Next: Write Review'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default AddDorm;
