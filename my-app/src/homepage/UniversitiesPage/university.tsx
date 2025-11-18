import React from 'react';
import './university.css';

interface Dorms {
  id: string;
  name: string;
  imageUrl: string;
  location: {
    city: string;
    province: string;
  };
}

const University: React.FC<Dorms> = ({
  id,
  name,
  location,
  imageUrl,
}) => {
  return (
    <div className="university-container">
      <div className="university-header">
        <img src={imageUrl} alt={name} className="university-image" />
        <h1 className="university-name">{name}</h1>
        <div className="university-location">
          {location.city}, {location.province}
        </div>
      </div>
    </div>
  );
};

export default University;