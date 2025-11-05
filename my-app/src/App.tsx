import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './home.tsx';
import AboutMe from './NavBarPages/aboutme.tsx';
import ContactMe from './NavBarPages/contactme.tsx';
import Login from './NavBarPages/login.tsx';
import University from './UniversityPage/universityDash.tsx';
import Dorms from './dorms.tsx';
import NavBar from './navbar.tsx';
import SearchBar from './searchbar.tsx';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/aboutme" element={<AboutMe />} />
        <Route path="/contactme" element={<ContactMe />} />
        <Route path="/login" element={<Login />} />
        <Route path="/university" element={<University />} />
        <Route path="/dorms" element={<Dorms />} />
        <Route path="/navbar" element={<NavBar />} />
        <Route path="/searchbar" element={<SearchBar />} />
      </Routes>
    </Router>
  )
}

export default App
