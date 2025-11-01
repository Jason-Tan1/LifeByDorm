import React from 'react'
import NavBar from './navbar.tsx';
import './dorms.css'
import './navbar.css'

function dorms() {
  return (
    <div className = "dorm">
     <NavBar />
      {/* Dorm Header */}
      <div className = "dorms_header">
        <div className = "dorms_title">
          <h1> Founders Residence </h1>
        </div>
         <div className = "dorms_address"> 
          <h4> 123 Example Road </h4>
         </div>
         <div className = "dorms_rating">
          <h4> 3 Stars </h4>
         </div>
      </div>
      {/* List of Dorms */}
      <div className = "dorms_lists">
        <h2> List of Dorms: </h2>
      </div>
    </div>
  )
}

export default dorms