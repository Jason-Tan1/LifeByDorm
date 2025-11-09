import React from 'react';
import './Home.css'; 
import { Link } from 'react-router-dom';
import NavBar from './NavBarPages/navbar.tsx'; 
import SearchBar from './searchbar.tsx'; 


const universities = [
  { id: 1, name: 'University of Toronto', urlName: 'university-of-toronto' },
  { id: 2, name: 'Western University', urlName: 'western-university' },
  { id: 3, name: 'York University', urlName: 'york-university' },
];

function Home() {
  return (
    <div className = "home"> 
      <NavBar />
      <div className="home-container">
        <div className="home-content">
          <div className="home-section">
            <h1>
              Honest Reviews
              <br />
              of Canadian University
              <br />
              Dorms Straight from
              <br />
              Real Students
            </h1>
            <SearchBar />
          </div>

          <div className="quicklinks-section">
            <h2>Quick Links:</h2>
            <div className="quicklinks-buttons">
              {universities.map(u => (
                <Link key={u.id} to={`/universities/${u.urlName}`}>
                  <button>{u.name}</button>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;