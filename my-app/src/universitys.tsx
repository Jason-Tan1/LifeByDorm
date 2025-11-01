import React from 'react'
import { Link } from 'react-router-dom';
import NavBar from './navbar.tsx'; 
import './universitys.css'
import './navbar.css'

function university() {
  return (
    <div className = "university">
      {/* University Navbar */}
      <NavBar />
      {/* University Header */}
      <div className = "university_header">
        <h1> York University </h1>
      </div>
      {/* Filters for Dorms */}
      <div className = "university_dormsFilter">
        <button> A - Z </button>
        <button> Z - A </button>
        <button> Highest Rating </button>
        <button> Lowest Rating </button>
        <button> Most Reviews </button>
      </div>
      {/* List of Dorms (This) */}
      <div className = "university_dormsList">
        <Link to ="/dorms">   
          <h2> Founders Residence </h2>
        </Link>
          <h3> Rating </h3>
          <h3> Reviews</h3>
        <Link to ="/dorms">   
          <h2> Stong Residence </h2>
        </Link>
          <h3> Rating </h3>
          <h3> Reviews</h3>
      </div>
    </div>
  )
}

export default university