import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './homepage/home.tsx';
import AboutMe from './NavBarPages/aboutme.tsx';
import ContactMe from './NavBarPages/contactme.tsx';
import University from './UniversitiesPage/universityDash.tsx';
import Dorms from './dorms/dorms.tsx';
import NavBar from './NavBarPages/navbar.tsx';
import SearchBar from './homepage/searchbar.tsx';
import Review from './dorms/review.tsx';
import AllUniversities from './footer/allUniversities.tsx';
import AdminDashboard from './admin/dashboard';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/aboutme" element={<AboutMe />} />
        <Route path="/contactme" element={<ContactMe />} />
        <Route path="/admin" element={<Home />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/universities" element={<AllUniversities />} />
        <Route path="/universities/:universityName" element={<University />} />
        <Route path="/universities/:universityName/dorms/:dormSlug" element={<Dorms />} />
        <Route path="/dorms" element={<Dorms />} />
        <Route path="/navbar" element={<NavBar />} />
        <Route path="/searchbar" element={<SearchBar />} />
        <Route path ="/review" element={<Review />} /> 
      </Routes>
    </Router>
  )
}

export default App
