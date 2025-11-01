import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './home.tsx';
import AboutMe from './pages/aboutme.tsx';
import ContactMe from './pages/contactme.tsx';
import Login from './pages/login.tsx';
import University from './universitys.tsx';
import Dorms from './dorms.tsx';

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
      </Routes>
    </Router>
  )
}

export default App
