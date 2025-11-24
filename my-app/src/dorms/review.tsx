import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './review.css';
import NavBar from '../NavBarPages/navbar';
import Star from '@mui/icons-material/Star';
import StarBorder from '@mui/icons-material/StarBorder';

function Reviews() {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
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

  const [description, setDescription] = useState('');
  const [year, setYear] = useState('');
  const [roomType, setRoomType] = useState('');
  const [wouldDormAgain, setWouldDormAgain] = useState('');
  const [fileDataUrls, setFileDataUrls] = useState<string[]>([]);
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
  const MAX_FILES = 5; // Maximum 5 images

  const handleRatingClick = (category: keyof typeof ratings, value: number) => {
    setRatings(prev => ({
      ...prev,
      [category]: value
    }));
  };

  const renderStars = (category: keyof typeof ratings) => {
    return (
      <div className="star-rating">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => handleRatingClick(category, star)}
          >
            {star <= ratings[category] ? <Star /> : <StarBorder />}
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
      e.target.value = ''; // Reset input
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
          e.target.value = ''; // Reset input after processing
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setFileDataUrls(prev => prev.filter((_, i) => i !== index));
  };

  const formatName = (name: string) => {
    // Replace dashes/hyphens with spaces and capitalize each word
    return name
      .replace(/-/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const handleNext = () => {
    // Validate current page before proceeding
    if (currentPage === 1) {
      const missing: string[] = [];
      if (ratings.room <= 0) missing.push('Room rating');
      if (ratings.bathrooms <= 0) missing.push('Bathroom rating');
      if (ratings.building <= 0) missing.push('Building rating');
      if (ratings.amenities <= 0) missing.push('Amenities rating');
      if (ratings.location <= 0) missing.push('Location rating');
      
      if (missing.length > 0) {
        alert('Please complete all ratings:\n' + missing.join('\n'));
        return;
      }
    } else if (currentPage === 2) {
      const missing: string[] = [];
      if (!year) missing.push('Year');
      if (!roomType) missing.push('Room type');
      if (!wouldDormAgain) missing.push('Would Dorm Again');
      
      if (missing.length > 0) {
        alert('Please fill out the following fields:\n' + missing.join('\n'));
        return;
      }
    } else if (currentPage === 3) {
      if (!description || description.trim().length < 5) {
        alert('Please add comments (minimum 5 characters)');
        return;
      }
    }
    
    if (currentPage < 4) {
      setCurrentPage(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async () => {
    // Only allow submission on page 4
    if (currentPage !== 4) {
      return;
    }
    
    // Basic client-side validation to avoid server-side validation errors
    const missing: string[] = [];
    if (!description || description.trim().length < 5) missing.push('Comments (min 5 chars)');
    if (!year) missing.push('Year');
    if (!roomType) missing.push('Room type');
    if (!wouldDormAgain) missing.push('Would Dorm Again');
    if (ratings.room <= 0) missing.push('Room rating');
    if (ratings.bathrooms <= 0) missing.push('Bathroom rating');
    if (ratings.building <= 0) missing.push('Building rating');
    if (ratings.amenities <= 0) missing.push('Amenities rating');
    if (ratings.location <= 0) missing.push('Location rating');

    if (missing.length > 0) {
      alert('Please fill out the following fields before submitting:\n' + missing.join('\n'));
      return;
    }

    const payload = {
      // Prefer query params if provided, then route params, otherwise null
      university: (queryUniversity || universityName) || null,
      dorm: (queryDorm || dormName) || null,
      room: ratings.room,
      bathroom: ratings.bathrooms,
      building: ratings.building,
      amenities: ratings.amenities,
      location: ratings.location,
      description,
      year: year ? Number(year) : null,
      roomType,
      wouldDormAgain: wouldDormAgain === 'yes',
      fileImage: fileDataUrls.length > 0 ? fileDataUrls[0] : null,
      images: fileDataUrls
    };

    try {
      const res = await fetch('http://localhost:3000/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        // If server sent validation errors, show them
        const serverMessage = data?.message || 'Failed to submit review';
        const serverErrors = data?.errors ? JSON.stringify(data.errors, null, 2) : null;
        alert(serverMessage + (serverErrors ? '\n' + serverErrors : ''));
        throw new Error(serverMessage);
      }
      // Clear form after success
      setRatings({ room: 0, bathrooms: 0, building: 0, amenities: 0, location: 0 });
      setDescription('');
      setYear('');
      setRoomType('');
      setWouldDormAgain('');
      setFileDataUrls([]);
      alert('Review submitted — thank you!');
      console.log('Saved review:', data);
      
      // Navigate back to the dorm page
      const university = queryUniversity || universityName;
      if (university && payload.dorm) {
        // Need to convert dorm name to slug format (lowercase, replace spaces with hyphens)
        const dormSlug = payload.dorm.toLowerCase().replace(/\s+/g, '-');
        navigate(`/universities/${encodeURIComponent(university)}/dorms/${dormSlug}`);
      }
    } catch (err) {
      console.error(err);
      alert('Error submitting review');
    }
  };

  return (
    <div className='Review'>
      <NavBar />
      <div className='review-container'>
        {/* Progress Indicator */}
        <div className="progress-indicator">
          <div className={`progress-step ${currentPage >= 1 ? 'active' : ''}`}>1. Ratings</div>
          <div className={`progress-step ${currentPage >= 2 ? 'active' : ''}`}>2. Details</div>
          <div className={`progress-step ${currentPage >= 3 ? 'active' : ''}`}>3. Comments</div>
          <div className={`progress-step ${currentPage >= 4 ? 'active' : ''}`}>4. Review</div>
        </div>

        <div className="review-form">
          {/* Page 1: Ratings */}
          {currentPage === 1 && (
            <div className="form-page">
              <h2>Rate Your Experience</h2>
              <div className="rating-group">
                <label>Rate the Room</label>
                {renderStars('room')}
              </div>

              <div className="rating-group">
                <label>Rate the Bathrooms</label>
                {renderStars('bathrooms')}
              </div>

              <div className="rating-group">
                <label>Rate the Building</label>
                {renderStars('building')}
              </div>

              <div className="rating-group">
                <label>Rate the Amenities</label>
                {renderStars('amenities')}
              </div>

              <div className="rating-group">
                <label>Rate the Location</label>
                {renderStars('location')}
              </div>
            </div>
          )}

          {/* Page 2: Personal Details */}
          {currentPage === 2 && (
            <div className="form-page">
              <h2> Details </h2>
              <div className="form-group">
                <label>Year you are in</label>
                <div className="option-boxes">
                  <button
                    type="button"
                    className={`option-box ${year === '1' ? 'selected' : ''}`}
                    onClick={() => setYear('1')}
                  >
                    First Year
                  </button>
                  <button
                    type="button"
                    className={`option-box ${year === '2' ? 'selected' : ''}`}
                    onClick={() => setYear('2')}
                  >
                    Second Year
                  </button>
                  <button
                    type="button"
                    className={`option-box ${year === '3' ? 'selected' : ''}`}
                    onClick={() => setYear('3')}
                  >
                    Third Year
                  </button>
                  <button
                    type="button"
                    className={`option-box ${year === '4' ? 'selected' : ''}`}
                    onClick={() => setYear('4')}
                  >
                    Fourth Year
                  </button>
                  <button
                    type="button"
                    className={`option-box ${year === '5' ? 'selected' : ''}`}
                    onClick={() => setYear('5')}
                  >
                    Fifth Year or Above
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>Type of Room</label>
                <div className="option-boxes">
                  <button
                    type="button"
                    className={`option-box ${roomType === 'single' ? 'selected' : ''}`}
                    onClick={() => setRoomType('single')}
                  >
                    Single Room
                  </button>
                  <button
                    type="button"
                    className={`option-box ${roomType === 'double' ? 'selected' : ''}`}
                    onClick={() => setRoomType('double')}
                  >
                    Double Room
                  </button>
                  <button
                    type="button"
                    className={`option-box ${roomType === 'triple' ? 'selected' : ''}`}
                    onClick={() => setRoomType('triple')}
                  >
                    Triple Room
                  </button>
                  <button
                    type="button"
                    className={`option-box ${roomType === 'suite' ? 'selected' : ''}`}
                    onClick={() => setRoomType('suite')}
                  >
                    Suite
                  </button>
                  <button
                    type="button"
                    className={`option-box ${roomType === 'apartment' ? 'selected' : ''}`}
                    onClick={() => setRoomType('apartment')}
                  >
                    Apartment Style
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>Would you dorm here again?</label>
                <div className="option-boxes">
                  <button
                    type="button"
                    className={`option-box ${wouldDormAgain === 'yes' ? 'selected' : ''}`}
                    onClick={() => setWouldDormAgain('yes')}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    className={`option-box ${wouldDormAgain === 'no' ? 'selected' : ''}`}
                    onClick={() => setWouldDormAgain('no')}
                  >
                    No
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Page 3: Comments and Photos */}
          {currentPage === 3 && (
            <div className="form-page">
              <h2>Share Your Experience</h2>
              <div className="form-group">
                <label>Comments about the dorm</label>
                <textarea
                  placeholder="Share your experience living in this dorm..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
              </div>

              <div className="file-input-group">
                <label>Photos of Dorm (up to {MAX_FILES})</label>
                <div className="file-input-wrapper">
                  <input type="file" accept="image/*" multiple onChange={handleFileChange} />
                  <p className="file-input-text">Click to upload or drag and drop</p>
                  <p className="file-input-text">PNG, JPG up to 10MB each</p>
                </div>
                {fileDataUrls.length > 0 && (
                  <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    {fileDataUrls.map((url, index) => (
                      <div key={index} style={{ position: 'relative', display: 'inline-block' }}>
                        <img src={url} alt={`preview ${index + 1}`} style={{ maxWidth: '150px', height: '150px', objectFit: 'cover', borderRadius: 8 }} />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          style={{
                            position: 'absolute',
                            top: '5px',
                            right: '5px',
                            background: 'red',
                            color: 'white',
                            border: 'none',
                            borderRadius: '50%',
                            width: '24px',
                            height: '24px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: 'bold'
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Page 4: Summary and Submit */}
          {currentPage === 4 && (
            <div className="form-page summary-page">
              <h2>Review Summary</h2>
              
              <div className="summary-section">
                <h3>Ratings</h3>
                <div className="summary-ratings">
                  <div className="summary-item">
                    <span>Room:</span>
                    <span className="summary-stars">
                      {[...Array(ratings.room)].map((_, i) => <Star key={`room-${i}`} />)}
                      {[...Array(5 - ratings.room)].map((_, i) => <StarBorder key={`room-empty-${i}`} />)}
                      ({ratings.room}/5)
                    </span>
                  </div>
                  <div className="summary-item">
                    <span>Bathrooms:</span>
                    <span className="summary-stars">
                      {[...Array(ratings.bathrooms)].map((_, i) => <Star key={`bath-${i}`} />)}
                      {[...Array(5 - ratings.bathrooms)].map((_, i) => <StarBorder key={`bath-empty-${i}`} />)}
                      ({ratings.bathrooms}/5)
                    </span>
                  </div>
                  <div className="summary-item">
                    <span>Building:</span>
                    <span className="summary-stars">
                      {[...Array(ratings.building)].map((_, i) => <Star key={`build-${i}`} />)}
                      {[...Array(5 - ratings.building)].map((_, i) => <StarBorder key={`build-empty-${i}`} />)}
                      ({ratings.building}/5)
                    </span>
                  </div>
                  <div className="summary-item">
                    <span>Amenities:</span>
                    <span className="summary-stars">
                      {[...Array(ratings.amenities)].map((_, i) => <Star key={`amen-${i}`} />)}
                      {[...Array(5 - ratings.amenities)].map((_, i) => <StarBorder key={`amen-empty-${i}`} />)}
                      ({ratings.amenities}/5)
                    </span>
                  </div>
                  <div className="summary-item">
                    <span>Location:</span>
                    <span className="summary-stars">
                      {[...Array(ratings.location)].map((_, i) => <Star key={`loc-${i}`} />)}
                      {[...Array(5 - ratings.location)].map((_, i) => <StarBorder key={`loc-empty-${i}`} />)}
                      ({ratings.location}/5)
                    </span>
                  </div>
                </div>
              </div>

              <div className="summary-section">
                <h3>Details</h3>
                <div className="summary-item">
                  <span>Year:</span>
                  <span>{['', 'First Year', 'Second Year', 'Third Year', 'Fourth Year', 'Fifth Year or Above'][Number(year)]}</span>
                </div>
                <div className="summary-item">
                  <span>Room Type:</span>
                  <span>{roomType.charAt(0).toUpperCase() + roomType.slice(1)}</span>
                </div>
                <div className="summary-item">
                  <span>Would Dorm Again:</span>
                  <span>{wouldDormAgain === 'yes' ? 'Yes' : 'No'}</span>
                </div>
              </div>

              <div className="summary-section">
                <h3>Comments</h3>
                <p className="summary-description">{description}</p>
              </div>

              {fileDataUrls.length > 0 && (
                <div className="summary-section">
                  <h3>Photos ({fileDataUrls.length})</h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    {fileDataUrls.map((url, index) => (
                      <img 
                        key={index} 
                        src={url} 
                        alt={`preview ${index + 1}`} 
                        style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: 8 }} 
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="form-navigation">
            {currentPage > 1 && (
              <button type="button" className="nav-button back-button" onClick={handleBack}>
                Back
              </button>
            )}
            {currentPage < 4 ? (
              <button type="button" className="nav-button next-button" onClick={handleNext}>
                Next
              </button>
            ) : (
              <button type="button" className="submit-button" onClick={handleSubmit}>
                Submit Review
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Reviews;