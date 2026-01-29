import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import './review.css';
import NavBar from '../NavBarPages/navbar';
import Star from '@mui/icons-material/Star';
import StarBorder from '@mui/icons-material/StarBorder';
import HomeIcon from '@mui/icons-material/Home';
import SchoolIcon from '@mui/icons-material/School';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import CloseIcon from '@mui/icons-material/Close';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DefaultDormImage from '../assets/Default_Dorm.png';

const API_BASE = (import.meta as any).env?.VITE_API_BASE || 'http://localhost:3000';

function Reviews() {
  const navigate = useNavigate();
  // Removed currentPage state
  const [ratings, setRatings] = useState({
    room: 0,
    bathrooms: 0,
    building: 0,
    amenities: 0,
    location: 0
  });

  // Try to read university/dorm from either route params or query string
  const { universityName, dormName } = useParams();
  const urlSearch = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const queryUniversity = urlSearch ? urlSearch.get('university') : null;
  const queryDorm = urlSearch ? urlSearch.get('dorm') : null;

  const resolvedUniversity = queryUniversity || universityName;
  const resolvedDorm = queryDorm || dormName;
  const displayDormName = (resolvedDorm || 'Dorm').replace(/-/g, ' ');

  const [hoverRatings, setHoverRatings] = useState<{ category: string | null, value: number }>({ category: null, value: 0 });

  const [description, setDescription] = useState('');

  // Using single string for UI simplicity, will convert to array on submit
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedRoomType, setSelectedRoomType] = useState<string>('');

  const [wouldDormAgain, setWouldDormAgain] = useState('');
  const [fileDataUrls, setFileDataUrls] = useState<string[]>([]);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
  const MAX_FILES = 5; // Maximum 5 images

  const handleRatingClick = (category: keyof typeof ratings, value: number) => {
    setRatings(prev => ({
      ...prev,
      [category]: value
    }));
  };

  const handleMouseEnter = (category: string, value: number) => {
    setHoverRatings({ category, value });
  };

  const handleMouseLeave = () => {
    setHoverRatings({ category: null, value: 0 });
  };

  const renderStars = (category: keyof typeof ratings) => {
    const currentRating = ratings[category];
    let effectiveValue = currentRating;

    if (hoverRatings.category === category && hoverRatings.value > 0) {
      if (hoverRatings.value > currentRating) {
        effectiveValue = hoverRatings.value;
      }
    }

    return (
      <div className="star-rating" onMouseLeave={handleMouseLeave}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className="star-button"
            onClick={() => handleRatingClick(category, star)}
            onMouseEnter={() => handleMouseEnter(category, star)}
          >
            {star <= effectiveValue ? <Star fontSize="inherit" /> : <StarBorder fontSize="inherit" />}
          </button>
        ))}
      </div>
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (files.length > MAX_FILES) {
      alert(`You can only upload up to ${MAX_FILES} images.`);
      e.target.value = '';
      return;
    }

    const newFileDataUrls: string[] = [];
    let filesProcessed = 0;

    Array.from(files).forEach((file) => {
      if (file.size > MAX_FILE_SIZE) {
        alert(`File "${file.name}" is too large. Maximum file size is 10 MB.`);
        filesProcessed++;
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        newFileDataUrls.push(reader.result as string);
        filesProcessed++;

        if (filesProcessed === files.length) {
          setFileDataUrls(prev => [...prev, ...newFileDataUrls]);
          e.target.value = '';
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setFileDataUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    const missing: string[] = [];
    if (!selectedYear) missing.push('Year');
    if (!selectedRoomType) missing.push('Room type');
    if (!wouldDormAgain) missing.push('Would Dorm Again');
    if (ratings.room <= 0) missing.push('Room rating');
    if (ratings.bathrooms <= 0) missing.push('Bathroom rating');
    if (ratings.building <= 0) missing.push('Building rating');
    if (ratings.amenities <= 0) missing.push('Amenities rating');
    if (ratings.location <= 0) missing.push('Location rating');
    if (!description || description.trim().length < 5) missing.push('Comments (min 5 chars)');

    if (missing.length > 0) {
      alert('Please fill out the following fields before submitting:\n' + missing.join('\n'));
      return;
    }

    // Validate university and dorm before submission
    if (!resolvedUniversity || !resolvedDorm) {
      alert('Error: University or dorm information is missing. Please navigate from a dorm page.');
      return;
    }

    const payload = {
      university: resolvedUniversity,
      dorm: resolvedDorm,
      room: ratings.room,
      bathroom: ratings.bathrooms,
      building: ratings.building,
      amenities: ratings.amenities,
      location: ratings.location,
      description: description.trim(),
      year: Number(selectedYear),
      roomType: selectedRoomType,
      wouldDormAgain: wouldDormAgain === 'yes',
      ...(fileDataUrls.length > 0 && { fileImage: fileDataUrls[0] }),
      ...(fileDataUrls.length > 0 && { images: fileDataUrls })
    };

    try {
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${API_BASE}/api/reviews`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        const serverMessage = data?.message || 'Failed to submit review';
        const serverErrors = data?.errors ? JSON.stringify(data.errors, null, 2) : null;
        alert(serverMessage + (serverErrors ? '\n' + serverErrors : ''));
        throw new Error(serverMessage);
      }

      // Clear form
      setRatings({ room: 0, bathrooms: 0, building: 0, amenities: 0, location: 0 });
      setDescription('');
      setSelectedYear('');
      setSelectedRoomType('');
      setWouldDormAgain('');
      setFileDataUrls([]);

      // Show Success Popup
      setShowSuccessPopup(true);

      const university = resolvedUniversity;
      const dormSlug = payload.dorm ? payload.dorm.toLowerCase().replace(/\s+/g, '-') : '';

      // Navigate after delay
      setTimeout(() => {
        if (university && dormSlug) {
          navigate(`/universities/${encodeURIComponent(university)}/dorms/${dormSlug}`);
        }
      }, 2000);

    } catch (err) {
      console.error(err);
      alert('Error submitting review');
    }
  };

  const formatName = (name: string) => {
    return name
      .replace(/-/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const getYearLabel = (val: string) => {
    switch (val) {
      case '1': return 'First';
      case '2': return 'Second';
      case '3': return 'Third';
      case '4': return 'Fourth+';
      case '5': return 'Graduate';
      default: return val;
    }
  };

  const yearOptions = [
    { value: '1', label: 'First' },
    { value: '2', label: 'Second' },
    { value: '3', label: 'Third' },
    { value: '4', label: 'Fourth+' },
    { value: '5', label: 'Graduate' }
  ];

  const roomTypeOptions = [
    { value: 'single', label: 'Single' },
    { value: 'double', label: 'Double' },
    { value: 'triple', label: 'Triple' },
    { value: 'quad', label: 'Quad' },
    { value: 'suite', label: 'Suite' },
    { value: 'other', label: 'Other' }
  ];

  const dormAgainOptions = [
    { value: 'yes', label: 'Yes, I would' },
    { value: 'no', label: 'No, I would not' }
  ];

  return (
    <div className='Review'>
      <NavBar />

      {/* Hero Section */}
      <div className="review-hero" style={{ backgroundImage: `url(${DefaultDormImage})` }}>
        <div className="review-hero-overlay">
          <h1>Rating {formatName(displayDormName)}</h1>
        </div>
      </div>

      <div className='review-page-content'>

        {/* Breadcrumbs moved out of container to match screenshot layout */}
        <div className="breadcrumb-wrapper">
          <div className="dorm-breadcrumbs">
            <Link to="/" className="breadcrumb-home">
              <HomeIcon style={{ fontSize: '1.2rem', color: '#333' }} />
            </Link>

            {resolvedUniversity && (
              <>
                <span className="breadcrumb-separator">›</span>
                <Link to={`/universities/${encodeURIComponent(resolvedUniversity)}`} className="breadcrumb-link">
                  {formatName(resolvedUniversity)}
                </Link>
              </>
            )}

            {resolvedUniversity && resolvedDorm && (
              <>
                <span className="breadcrumb-separator">›</span>
                <Link
                  to={`/universities/${encodeURIComponent(resolvedUniversity)}/dorms/${resolvedDorm.toLowerCase().replace(/\s+/g, '-')}`}
                  className="breadcrumb-link"
                >
                  {formatName(resolvedDorm)}
                </Link>
              </>
            )}

            <span className="breadcrumb-separator">›</span>
            <span className="breadcrumb-current">Review</span>
          </div>
        </div>

        <div className='review-container'>

          {/* Header removed from here */}

          <div className="review-content">

            {/* Sequential Steps Section - Refactored for Independent Editing */}
            <div className="review-section sequential-section">

              {/* Selected Badges Row (Always Visible if any exist) */}
              {(selectedYear || selectedRoomType || wouldDormAgain) && (
                <div className="selected-badges-row">
                  {selectedYear && (
                    <div className="selected-item-row fade-in">
                      <div className="selected-item-icon"><SchoolIcon /></div>
                      <span className="selected-item-text">{getYearLabel(selectedYear)}</span>
                      <button
                        type="button"
                        className="selected-item-remove"
                        onClick={() => setSelectedYear('')} // Only clears Year
                      >
                        <CloseIcon fontSize="small" />
                      </button>
                    </div>
                  )}

                  {selectedRoomType && (
                    <div className="selected-item-row fade-in">
                      <div className="selected-item-icon"><MeetingRoomIcon /></div>
                      <span className="selected-item-text">
                        {roomTypeOptions.find(o => o.value === selectedRoomType)?.label || selectedRoomType}
                      </span>
                      <button
                        type="button"
                        className="selected-item-remove"
                        onClick={() => setSelectedRoomType('')} // Only clears Room
                      >
                        <CloseIcon fontSize="small" />
                      </button>
                    </div>
                  )}

                  {wouldDormAgain && (
                    <div className="selected-item-row fade-in">
                      <div className="selected-item-icon"><ThumbUpIcon /></div>
                      <span className="selected-item-text">
                        {wouldDormAgain === 'yes' ? 'Would Dorm Again: Yes' : 'Would Dorm Again: No'}
                      </span>
                      <button
                        type="button"
                        className="selected-item-remove"
                        onClick={() => setWouldDormAgain('')} // Only clears Choice
                      >
                        <CloseIcon fontSize="small" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Active Input Area - Prioritizes first missing field */}
              <div className="active-selection-area">
                {!selectedYear ? (
                  <div className="selection-step fade-in">
                    <label className="step-label">What year were you?</label>
                    <div className="options-grid">
                      {yearOptions.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          className="option-button"
                          onClick={() => setSelectedYear(opt.value)}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : !selectedRoomType ? (
                  <div className="selection-step fade-in">
                    <label className="step-label">What was your room type?</label>
                    <div className="options-grid">
                      {roomTypeOptions.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          className="option-button"
                          onClick={() => setSelectedRoomType(opt.value)}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : !wouldDormAgain ? (
                  <div className="selection-step fade-in">
                    <label className="step-label">Would you dorm here again?</label>
                    <div className="options-grid">
                      {dormAgainOptions.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          className="option-button"
                          onClick={() => setWouldDormAgain(opt.value)}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>

            </div>

            {/* Ratings Section */}
            <div className="review-section ratings-grid">
              <div className="rating-group">
                <label>Room</label>
                {renderStars('room')}
              </div>

              <div className="rating-group">
                <label>Bathroom</label>
                {renderStars('bathrooms')}
              </div>

              <div className="rating-group">
                <label>Building</label>
                {renderStars('building')}
              </div>

              <div className="rating-group">
                <label>Amenities</label>
                {renderStars('amenities')}
              </div>

              <div className="rating-group">
                <label>Location</label>
                {renderStars('location')}
              </div>
            </div>

            {/* Comments Section */}
            <div className="review-section comments-section">
              <label className="section-label">Comments</label>
              <textarea
                className="review-textarea"
                placeholder="Share your experience living in this dorm... (Required)"
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>

            {/* Photo Section */}
            <div className="review-section photo-section">
              <label className="section-label">Add a Photo</label>

              <div className="file-upload-container">
                <input
                  type="file"
                  id="file-upload"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
                <label htmlFor="file-upload" className="file-upload-label">
                  <div className="upload-icon-wrapper">
                    <CloudUploadIcon style={{ fontSize: 32, color: '#445E75' }} />
                  </div>
                  <span className="upload-text">Click to browse files</span>
                </label>
              </div>

              {fileDataUrls.length > 0 && (
                <div className="photo-previews">
                  {fileDataUrls.map((url, index) => (
                    <div key={index} className="photo-preview-item">
                      <img src={url} alt={`preview ${index + 1}`} />
                      <button
                        type="button"
                        className="remove-photo-btn"
                        onClick={() => removeImage(index)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="submit-section">
              <button type="button" className="submit-review-btn" onClick={handleSubmit}>
                Submit Review
              </button>
            </div>

          </div>
        </div>
      </div>
      {/* Success Popup */}
      {showSuccessPopup && (
        <div className="popup-overlay">
          <div className="popup-card">
            <h2 className="popup-title">Review Submitted!</h2>
            <p className="popup-subtitle">Thanks for sharing! Your review has been submitted for approval.</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default Reviews;
