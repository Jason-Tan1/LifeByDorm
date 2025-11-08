import { useState } from 'react';
import './review.css';
import NavBar from './NavBarPages/navbar';

function Reviews() {
  const [ratings, setRatings] = useState({
    room: 0,
    bathrooms: 0,
    building: 0,
    amenities: 0,
    location: 0
  });

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

  return (
    <div className='Review'>
      <NavBar />
      <div className='review-container'>
        <h1>User Review</h1>
        <form className="review-form">
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
            />
          </div>

          {/* Photo Upload */}
          <div className="file-input-group">
            <label>Photo of Dorm</label>
            <div className="file-input-wrapper">
              <input type="file" accept="image/*" />
              <p className="file-input-text">Click to upload or drag and drop</p>
              <p className="file-input-text">PNG, JPG up to 10MB</p>
            </div>
          </div>

          {/* Year Selection */}
          <div className="form-group">
            <label>Year you are in</label>
            <select>
              <option value="">Select your year</option>
              <option value="1">First Year</option>
              <option value="2">Second Year</option>
              <option value="3">Third Year</option>
              <option value="4">Fourth Year</option>
              <option value="5+">Fifth Year or Above</option>
            </select>
          </div>

          {/* Room Type Selection */}
          <div className="form-group">
            <label>Type of Room</label>
            <select>
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