import React, {useState} from 'react';
import { Link } from 'react-router-dom';
import NavBar from '../navbar'; 
import './universityDash.css';
import '../navbar.css';


function University() {
  
  return (
    <div className="university">
      {/* University Navbar */}
      <NavBar />

      {/* University Header */}
      <div className="university_header">
        <h1>York University</h1>
      </div>


      {/* List of Dorms */}
      <div className="university_dormsList">
        <div>
          <Link to="/dorms">   
            <h2>Founders Residence</h2>
          </Link>
          <h3>Rating: 4.3</h3>
          <h3>Reviews: 120</h3>
        </div>
        <div>
          <Link to="/dorms">   
            <h2>Stong Residence</h2>
          </Link>
          <h3>Rating: 4.0</h3>
          <h3>Reviews: 95</h3>
        </div>
      </div>
    </div>
  );
}

export interface Dorms {
  name: string;
  rating: number;
  reviews: number;
  id: number;
}

export default University;