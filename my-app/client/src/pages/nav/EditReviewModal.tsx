import { useState } from 'react';
import Star from '@mui/icons-material/Star';
import StarBorder from '@mui/icons-material/StarBorder';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CloseIcon from '@mui/icons-material/Close';
import { compressImage } from '../../utils/imageUtils';
import '../dorms/review.css';

// Use relative path '' on localhost to leverage the Vite proxy
const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const API_BASE = isLocal ? '' : ((import.meta as any).env?.VITE_API_BASE || '');

interface Review {
    _id: string;
    university: string;
    dorm: string;
    room: number;
    bathroom: number;
    building: number;
    amenities: number;
    location: number;
    description: string;
    roomType: string | string[];
    year: number | number[];
    wouldDormAgain: boolean;
    images?: string[];
    pendingEdit?: any;
}

interface EditReviewModalProps {
    review: Review;
    onClose: () => void;
    onSaved: () => void;
}

const MAX_FILES = 5;

function EditReviewModal({ review, onClose, onSaved }: EditReviewModalProps) {
    const [ratings, setRatings] = useState({
        room: review.room,
        bathrooms: review.bathroom,
        building: review.building,
        amenities: review.amenities,
        location: review.location
    });

    const [hoverRatings, setHoverRatings] = useState<{ category: string | null, value: number }>({ category: null, value: 0 });
    const [description, setDescription] = useState(review.description);

    // Extract year value
    const yearVal = Array.isArray(review.year) ? String(review.year[0]) : String(review.year);
    const [selectedYear, setSelectedYear] = useState<string>(yearVal);

    // Extract roomType value
    const roomTypeVal = Array.isArray(review.roomType) ? review.roomType[0] : review.roomType;
    const [selectedRoomType, setSelectedRoomType] = useState<string>(roomTypeVal || '');

    const [wouldDormAgain, setWouldDormAgain] = useState<string>(review.wouldDormAgain ? 'yes' : 'no');
    const [fileDataUrls, setFileDataUrls] = useState<string[]>(review.images || []);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const handleRatingClick = (category: keyof typeof ratings, value: number) => {
        setRatings(prev => ({ ...prev, [category]: value }));
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

        const totalAfter = fileDataUrls.length + files.length;
        if (totalAfter > MAX_FILES) {
            alert(`You can only have up to ${MAX_FILES} images total.`);
            e.target.value = '';
            return;
        }

        const compressionPromises = Array.from(files).map(async (file) => {
            try {
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
        if (isSubmitting) return;
        setIsSubmitting(true);
        setErrorMessage('');

        try {
            const missing: string[] = [];
            if (!selectedYear) missing.push('Year');
            if (!selectedRoomType) missing.push('Room type');
            if (!wouldDormAgain) missing.push('Would Dorm Again');
            if (ratings.room <= 0) missing.push('Room rating');
            if (ratings.bathrooms <= 0) missing.push('Bathroom rating');
            if (ratings.building <= 0) missing.push('Building rating');
            if (ratings.amenities <= 0) missing.push('Amenities rating');
            if (ratings.location <= 0) missing.push('Location rating');
            if (!description || description.trim().length < 10) missing.push('Comments (min 10 chars)');

            if (missing.length > 0) {
                setErrorMessage('Please fill out: ' + missing.join(', '));
                return;
            }

            const payload = {
                room: ratings.room,
                bathroom: ratings.bathrooms,
                building: ratings.building,
                amenities: ratings.amenities,
                location: ratings.location,
                description: description.trim(),
                year: Number(selectedYear),
                roomType: selectedRoomType,
                wouldDormAgain: wouldDormAgain === 'yes',
                images: fileDataUrls
            };

            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/api/reviews/${review._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (!res.ok) {
                setErrorMessage(data?.message || 'Failed to submit edit');
                return;
            }

            onSaved();
            onClose();
        } catch (err) {
            console.error('Error submitting edit:', err);
            setErrorMessage('Error submitting edit. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const yearOptions = [
        { value: '1', label: '1st Year' },
        { value: '2', label: '2nd Year' },
        { value: '3', label: '3rd Year' },
        { value: '4', label: '4th Year' },
        { value: '5', label: '5th Year' }
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

    const formatName = (name: string) => {
        return name
            .replace(/-/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    };

    return (
        <div className="edit-modal-overlay" onClick={onClose}>
            <div className="edit-modal-content" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="edit-modal-header">
                    <div>
                        <h2 className="edit-modal-title">Edit Review</h2>
                        <p className="edit-modal-subtitle">{formatName(review.dorm)} · {formatName(review.university)}</p>
                    </div>
                    <button className="edit-modal-close" onClick={onClose}>
                        <CloseIcon />
                    </button>
                </div>

                {/* Error */}
                {errorMessage && (
                    <div className="edit-modal-error">{errorMessage}</div>
                )}

                {/* Form */}
                <div className="edit-modal-body">
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

                    {/* Selection Groups */}
                    <div className="review-section selections-section">
                        <div className="selection-group">
                            <label className="section-label">What year were you in?</label>
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
                            <label className="section-label">Room Type</label>
                            <div className="pill-options">
                                {roomTypeOptions.map((opt) => (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        className={`pill-button ${selectedRoomType === opt.value ? 'selected' : ''}`}
                                        onClick={() => setSelectedRoomType(opt.value)}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="selection-group">
                            <label className="section-label">Would you dorm here again?</label>
                            <div className="pill-options">
                                {dormAgainOptions.map((opt) => (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        className={`pill-button ${wouldDormAgain === opt.value ? 'selected' : ''}`}
                                        onClick={() => setWouldDormAgain(opt.value)}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Comments Section */}
                    <div className="review-section comments-section">
                        <label className="section-label">Your Review</label>
                        <textarea
                            className="review-textarea"
                            placeholder="Share your experience..."
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                        />
                        <div className="char-count">
                            {description.length}/10 min characters
                        </div>
                    </div>

                    {/* Photo Section */}
                    <div className="review-section photo-section">
                        <label className="section-label">Photos <span className="optional-text">(optional)</span></label>
                        <div className="file-upload-container">
                            <input
                                type="file"
                                id="edit-file-upload"
                                accept="image/*"
                                multiple
                                onChange={handleFileChange}
                                style={{ display: 'none' }}
                            />
                            <label htmlFor="edit-file-upload" className="file-upload-label">
                                <div className="upload-icon-wrapper">
                                    <CloudUploadIcon style={{ fontSize: 32, color: '#445E75' }} />
                                </div>
                                <span className="upload-text">Click to add photos</span>
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
                </div>

                {/* Footer */}
                <div className="edit-modal-footer">
                    <button className="edit-modal-cancel" onClick={onClose}>
                        Cancel
                    </button>
                    <button
                        className="edit-modal-save"
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Submitting...' : 'Submit Edit for Review'}
                    </button>
                </div>

                {/* Info note */}
                <p className="edit-modal-note">
                    Your edit will be submitted for admin review. Your original review will remain visible until the edit is approved.
                </p>
            </div>
        </div>
    );
}

export default EditReviewModal;
