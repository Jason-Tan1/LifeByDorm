import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './homepage/home.tsx';
import AboutMe from './navbarpages/aboutme.tsx';
import ContactMe from './navbarpages/contactme.tsx';
import Login from './navbarpages/login.tsx';
import University from './universitypage/universityDash.tsx';
import Dorms from './dorms.tsx';
import NavBar from './navbarpages/navbar.tsx';
import SearchBar from './homepage/searchbar.tsx';
import Review from './review.tsx';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/aboutme" element={<AboutMe />} />
        <Route path="/contactme" element={<ContactMe />} />
        <Route path="/login" element={<Login />} />
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
