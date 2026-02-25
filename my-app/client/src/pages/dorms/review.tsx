import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './review.css';
import NavBar from '../nav/navbar';
import Star from '@mui/icons-material/Star';
import StarBorder from '@mui/icons-material/StarBorder';
import HomeIcon from '@mui/icons-material/Home';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DefaultDormImage from '../../assets/Default_Dorm.png';
import { compressImage } from '../../utils/imageUtils';
import LoginModal from '../nav/login';

// Use relative path '' on localhost to leverage the Vite proxy
const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const API_BASE = isLocal ? '' : ((import.meta as any).env?.VITE_API_BASE || '');

function Reviews() {
  const { t } = useTranslation();
  const navigate = useNavigate();
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
  // Check if this is a new dorm review
  const isNewDorm = urlSearch ? urlSearch.get('isNewDorm') === 'true' : false;

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
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
      setShowLoginModal(true);
    }
  }, []);
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
  const MAX_FILES = 5; // Maximum 5 images

  const [dormImage, setDormImage] = useState<string | null>(null);

  useEffect(() => {
    if (!resolvedUniversity || !resolvedDorm) return;

    async function fetchDormImage() {
      try {
        // Ensure we rely on a slug for the API logic
        // If resolvedDorm comes from a query param like "Centennial Hall", we need "centennial-hall"
        const dormSlug = resolvedDorm!.toLowerCase().replace(/\s+/g, '-');

        const res = await fetch(`${API_BASE}/api/universities/${encodeURIComponent(resolvedUniversity!)}/dorms/${encodeURIComponent(dormSlug)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.imageUrl) {
            setDormImage(data.imageUrl);
          }
        }
      } catch (error) {
        console.error('Failed to fetch dorm image:', error);
      }
    }

    fetchDormImage();
  }, [resolvedUniversity, resolvedDorm]);

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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (files.length > MAX_FILES) {
      alert(`You can only upload up to ${MAX_FILES} images.`);
      e.target.value = '';
      return;
    }

    // Compress each image before storing
    const compressionPromises = Array.from(files).map(async (file) => {
      if (file.size > MAX_FILE_SIZE) {
        alert(`File "${file.name}" is too large. Maximum file size is 10 MB.`);
        return null;
      }

      try {
        // Compress image to max 1200px and 80% quality JPEG
        const compressedDataUrl = await compressImage(file, {
          maxWidth: 1200,
          maxHeight: 1200,
          quality: 0.8,
          outputType: 'image/jpeg'
        });
        return compressedDataUrl;
      } catch (err) {
        console.error(`Failed to compress ${file.name}:`, err);
        return null;
      }
    });

    const results = await Promise.all(compressionPromises);
    const validResults = results.filter((url): url is string => url !== null);

    setFileDataUrls(prev => [...prev, ...validResults]);
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    setFileDataUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setShowErrorPopup(false);
    setErrorMessage('');

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
      setErrorMessage('Please fill out the following fields:\n' + missing.join(', '));
      setShowErrorPopup(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Validate university and dorm before submission
    if (!resolvedUniversity || !resolvedDorm) {
      setErrorMessage('Error: University or dorm information is missing. Please navigate from a dorm page.');
      setShowErrorPopup(true);
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
        setErrorMessage(serverMessage);
        setShowErrorPopup(true);
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
        if (university) {
          if (isNewDorm) {
            // Return to University page for new dorms (since they might need approval)
            navigate(`/universities/${encodeURIComponent(university)}`);
          } else if (dormSlug) {
            // Otherwise go to the dorm page
            navigate(`/universities/${encodeURIComponent(university)}/dorms/${dormSlug}`);
          }
        }
      }, 2000);

    } catch (err) {
      console.error(err);
      if (!showErrorPopup) { // Don't overwrite if we already set a specific server error
        setErrorMessage('Error submitting review. Please try again.');
        setShowErrorPopup(true);
      }
    }
  };

  const formatName = (name: string) => {
    return name
      .replace(/-/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const yearOptions = [
    { value: '1', label: t('dorms.years.1') },
    { value: '2', label: t('dorms.years.2') },
    { value: '3', label: t('dorms.years.3') },
    { value: '4', label: t('dorms.years.4') },
    { value: '5', label: t('dorms.years.5') }
  ];

  const roomTypeOptions = [
    { value: 'single', label: 'Single' },
    { value: 'double', label: 'Double' },
    { value: 'suite', label: 'Suite' },
    { value: 'other', label: 'Other' }
  ];

  const dormAgainOptions = [
    { value: 'yes', label: 'Yes' },
    { value: 'no', label: 'No' }
  ];

  /* Drag and Drop Handlers */
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files);


      newFiles.forEach((file) => {
        // Compress image before creating data URL if needed, 
        // for now just read it for preview
        const reader = new FileReader();
        reader.onloadend = () => {
          setFileDataUrls((prevUrls) => [...prevUrls, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  return (
    <div className='Review'>
      {/* ... existing layout ... */}
      <NavBar />

      <div className='review-page-content'>

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

        <div className='review-main-layout'>

          {/* Left Column: Header & Image */}
          <div className="review-left-column">
            <h1 className="review-main-title">{t('review.rating')}<br />{formatName(displayDormName)}</h1>
            <div className="dorm-info-card">
              <div className="review-dorm-image-container">
                <img src={dormImage || DefaultDormImage} alt={displayDormName} className="review-dorm-image" />
              </div>
              <div className="dorm-info-text">
                <h3 className="dorm-name">{formatName(displayDormName)}</h3>
                {resolvedUniversity && <p className="dorm-university">{formatName(resolvedUniversity)}</p>}
              </div>
            </div>
          </div>

          {/* Right Column: Form */}
          <div className="review-right-column">
            <div className="review-container">
              <div className="review-content">

                {/* Ratings Section */}
                <div className="review-section ratings-grid">
                  <div className="rating-group">
                    <label>{t('review.room')}</label>
                    {renderStars('room')}
                  </div>

                  <div className="rating-group">
                    <label>{t('review.bathroom')}</label>
                    {renderStars('bathrooms')}
                  </div>

                  <div className="rating-group">
                    <label>{t('review.building')}</label>
                    {renderStars('building')}
                  </div>

                  <div className="rating-group">
                    <label>{t('review.amenities')}</label>
                    {renderStars('amenities')}
                  </div>

                  <div className="rating-group">
                    <label>{t('review.location')}</label>
                    {renderStars('location')}
                  </div>
                </div>

                {/* Selection Groups */}
                <div className="review-section selections-section">

                  <div className="selection-group">
                    <label className="section-label">{t('review.yearQuestion')}</label>
                    <div className="pill-options">
                      {yearOptions.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          className={`pill-button ${selectedYear === opt.value ? 'selected' : ''}`}
                          onClick={() => setSelectedYear(opt.value)}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="selection-group">
                    <label className="section-label">{t('review.roomType')}</label>
                    <div className="pill-options">
                      {roomTypeOptions.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          className={`pill-button ${selectedRoomType === opt.value ? 'selected' : ''}`}
                          onClick={() => setSelectedRoomType(opt.value)}
                        >
                          {t(`common.${opt.value}`, opt.label)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="selection-group">
                    <label className="section-label">{t('review.dormAgainQuestion')}</label>
                    <div className="pill-options">
                      {dormAgainOptions.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          className={`pill-button ${wouldDormAgain === opt.value ? 'selected' : ''}`}
                          onClick={() => setWouldDormAgain(opt.value)}
                        >
                          {t(`common.${opt.value}`, opt.label)}
                        </button>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Comments Section */}
                <div className="review-section comments-section">
                  <div className="comments-header">
                    {/* Removed Help Me Write button */}
                  </div>
                  <label className="section-label">{t('review.writeReview')}</label>
                  <textarea
                    className="review-textarea"
                    placeholder={t('review.shareExperience')}
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                  />
                  <div className="char-count">
                    {description.length}/25 min characters
                  </div>
                </div>

                {/* Photo Section */}
                <div className="review-section photo-section">
                  <label className="section-label">{t('review.addPhotos')} <span className="optional-text">{t('review.optional')}</span></label>

                  <div
                    className="file-upload-container"
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <input
                      type="file"
                      id="file-upload"
                      accept="image/*"
                      multiple
                      onChange={handleFileChange}
                      style={{ display: 'none' }}
                    />
                    <label
                      htmlFor="file-upload"
                      className={`file-upload-label ${isDragging ? 'drag-active' : ''}`}
                    >
                      <div className="upload-icon-wrapper">
                        <CloudUploadIcon style={{ fontSize: 32, color: '#445E75' }} />
                      </div>
                      <span className="upload-text">{t('review.clickToAddPhotos')}</span>
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
                    {t('review.submitReview')}
                  </button>
                </div>

              </div>
            </div>
          </div>
        </div>

      </div>
      {/* Success Popup */}
      {showSuccessPopup && (
        <div className="popup-overlay">
          <div className="popup-card">
            <h2 className="popup-title">{t('review.reviewSubmitted')}</h2>
            <p className="popup-subtitle">{t('review.thanksSharing')}</p>
          </div>
        </div>
      )}
      {/* Error Popup */}
      {showErrorPopup && (
        <div className="popup-overlay" onClick={() => setShowErrorPopup(false)}>
          <div className="popup-card popup-card-error" onClick={(e) => e.stopPropagation()}>
            <div className="popup-header-error">
              <h2 className="popup-title" style={{ color: '#d32f2f' }}>{t('review.actionRequired')}</h2>
              <button className="popup-close-btn" onClick={() => setShowErrorPopup(false)}>×</button>
            </div>
            <p className="popup-subtitle" style={{ whiteSpace: 'pre-line' }}>{errorMessage}</p>
            <button className="popup-action-btn" onClick={() => setShowErrorPopup(false)}>{t('review.okay')}</button>
          </div>
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

export default Reviews;
