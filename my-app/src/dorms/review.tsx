import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './review.css';
import NavBar from '../NavBarPages/navbar';

function Reviews() {
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

  const [description, setDescription] = useState('');
  const [year, setYear] = useState('');
  const [roomType, setRoomType] = useState('');
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
            {star <= ratings[category] ? '★' : '☆'}
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Basic client-side validation to avoid server-side validation errors
    const missing: string[] = [];
    if (!description || description.trim().length < 5) missing.push('Comments (min 5 chars)');
    if (!year) missing.push('Year');
    if (!roomType) missing.push('Room type');
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
        <h1>User Review</h1>
          <form className="review-form" onSubmit={handleSubmit}>
          {/* Rating Groups */}
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

          {/* Comments */}
          <div className="form-group">
            <label>Comments about the dorm</label>
            <textarea
              placeholder="Share your experience living in this dorm..."
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          {/* Photo Upload */}
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

          {/* Year Selection */}
          <div className="form-group">
            <label>Year you are in</label>
            <select value={year} onChange={e => setYear(e.target.value)}>
              <option value="">Select your year</option>
              <option value="1">First Year</option>
              <option value="2">Second Year</option>
              <option value="3">Third Year</option>
              <option value="4">Fourth Year</option>
              <option value="5">Fifth Year or Above</option>
            </select>
          </div>

          {/* Room Type Selection */}
          <div className="form-group">
            <label>Type of Room</label>
            <select value={roomType} onChange={e => setRoomType(e.target.value)}>
              <option value="">Select room type</option>
              <option value="single">Single Room</option>
              <option value="double">Double Room</option>
              <option value="triple">Triple Room</option>
              <option value="suite">Suite</option>
              <option value="apartment">Apartment Style</option>
            </select>
          </div>

          <button type="submit" className="submit-button">
            Submit Review
          </button>
        </form>
      </div>
    </div>
  );
}

export default Reviews;