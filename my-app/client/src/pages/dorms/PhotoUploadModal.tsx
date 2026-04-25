import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { compressImage } from '../../utils/imageUtils';
import '../nav/login.css'; // Reuse basic modal overlay styles
import './review.css'; // Reuse file upload styles

const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const API_BASE = isLocal ? '' : ((import.meta as any).env?.VITE_API_BASE || '');

interface PhotoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  universitySlug: string;
  dormSlug: string;
  onSuccess: (newImages: string[]) => void;
}

const PhotoUploadModal = ({ isOpen, onClose, universitySlug, dormSlug, onSuccess }: PhotoUploadModalProps) => {
  const { t } = useTranslation();
  const [fileDataUrls, setFileDataUrls] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
  const MAX_FILES = 5; // Maximum 5 images

  if (!isOpen) return null;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const processFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    if (fileDataUrls.length + files.length > MAX_FILES) {
      setError(`You can only upload up to ${MAX_FILES} images at a time.`);
      return;
    }

    setError('');
    
    const compressionPromises = Array.from(files).map(async (file) => {
      if (file.size > MAX_FILE_SIZE) {
        setError(`File "${file.name}" is too large. Maximum size is 10 MB.`);
        return null;
      }

      try {
        const compressedDataUrl = await compressImage(file, {
          maxWidth: 800,
          maxHeight: 800,
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
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(e.target.files);
    e.target.value = ''; // Reset input
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    processFiles(e.dataTransfer.files);
  };

  const removeImage = (index: number) => {
    setFileDataUrls(prev => prev.filter((_, i) => i !== index));
    if (fileDataUrls.length <= 1) {
      setError('');
    }
  };

  const handleSubmit = async () => {
    if (fileDataUrls.length === 0) return;
    setIsSubmitting(true);
    setError('');

    const token = localStorage.getItem('token');
    if (!token) {
      setError('You must be logged in to upload photos.');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/universities/${encodeURIComponent(universitySlug)}/dorms/${encodeURIComponent(dormSlug)}/photos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ images: fileDataUrls })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to upload photos');
      }

      onSuccess(data.images);
      
      // Reset & close
      setFileDataUrls([]);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred while uploading. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <div className="modal-overlay" onClick={onClose} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10001, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)' }}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ width: '90%', maxWidth: '500px', backgroundColor: '#fff', color: '#1a1a1a', borderRadius: '16px', boxShadow: '0 10px 40px rgba(0,0,0,0.2)', position: 'relative' }}>
        <button className="modal-close" onClick={onClose} style={{ color: '#666', fontSize: '2.5rem', position: 'absolute', right: '16px', top: '16px', background: 'transparent', border: 'none', cursor: 'pointer', lineHeight: 1 }}>×</button>
        <div style={{ padding: '32px' }}>
          <h2 style={{ marginBottom: '24px', fontSize: '1.5rem', fontWeight: 800, color: '#1a1a1a', borderBottom: 'none', padding: 0 }}>{t('review.addPhotos', 'Add Photos')}</h2>
          
          {error && <div style={{ color: '#D62828', marginBottom: '16px', padding: '12px', backgroundColor: 'rgba(214, 40, 40, 0.08)', borderRadius: '8px', fontSize: '0.95rem', fontWeight: 500 }}>{error}</div>}

          <div
            className="file-upload-container"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            style={{ marginBottom: '24px', textAlign: 'center', background: isDragging ? '#f8f9fa' : 'white', cursor: 'pointer' }}
          >
            <input
              type="file"
              id="gallery-file-upload"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              style={{ display: 'none' }}
              disabled={isSubmitting || fileDataUrls.length >= MAX_FILES}
            />
            <label
              htmlFor="gallery-file-upload"
              className={`file-upload-label ${isDragging ? 'drag-active' : ''} ${fileDataUrls.length >= MAX_FILES ? 'disabled' : ''}`}
            >
              <div className="upload-icon-wrapper">
                <CloudUploadIcon style={{ fontSize: 32, color: '#445E75' }} />
              </div>
              <span className="upload-text" style={{ color: '#555', fontWeight: 500, marginTop: '8px', display: 'block' }}>Drag images here or click to select</span>
            </label>
          </div>

          {fileDataUrls.length > 0 && (
            <div className="photo-previews" style={{ maxHeight: '240px', overflowY: 'auto', marginBottom: '24px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', paddingRight: '8px' }}>
              {fileDataUrls.map((url, index) => (
                <div key={index} className="photo-preview-item" style={{ position: 'relative', aspectRatio: '1', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                  <img src={url} alt={`preview ${index + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button
                    type="button"
                    className="remove-photo-btn"
                    onClick={() => removeImage(index)}
                    disabled={isSubmitting}
                    style={{ position: 'absolute', top: '6px', right: '6px', background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
            <button 
              onClick={onClose} 
              style={{ padding: '12px 24px', background: 'transparent', border: '1px solid #ddd', color: '#555', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.95rem', transition: 'background 0.2s' }}
              disabled={isSubmitting}
              onMouseOver={e => e.currentTarget.style.background = '#f5f5f5'}
              onMouseOut={e => e.currentTarget.style.background = 'transparent'}
            >
              Cancel
            </button>
            <button 
              onClick={handleSubmit} 
              style={{ padding: '12px 24px', background: '#D62828', border: 'none', color: '#fff', borderRadius: '8px', cursor: fileDataUrls.length === 0 ? 'not-allowed' : 'pointer', opacity: (isSubmitting || fileDataUrls.length === 0) ? 0.6 : 1, fontWeight: 700, fontSize: '0.95rem', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(214, 40, 40, 0.2)' }}
              disabled={isSubmitting || fileDataUrls.length === 0}
              onMouseOver={e => { if(!isSubmitting && fileDataUrls.length > 0) e.currentTarget.style.transform = 'translateY(-1px)' }}
              onMouseOut={e => e.currentTarget.style.transform = 'none'}
            >
              {isSubmitting ? 'Uploading...' : 'Upload Photos'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default PhotoUploadModal;
