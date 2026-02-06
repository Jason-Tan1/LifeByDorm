import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { UniversityDataProvider } from './context/UniversityDataContext';
import PageLoader from './components/PageLoader';

// Lazy load all page components for better initial load performance
const Home = lazy(() => import('./homepage/home.tsx'));
const AboutMe = lazy(() => import('./NavBarPages/aboutme.tsx'));
const ContactMe = lazy(() => import('./NavBarPages/contactme.tsx'));
const Account = lazy(() => import('./NavBarPages/account.tsx'));
const University = lazy(() => import('./UniversitiesPage/universityDash.tsx'));
const Dorms = lazy(() => import('./dorms/dorms.tsx'));
const NavBar = lazy(() => import('./NavBarPages/navbar.tsx'));
const SearchBar = lazy(() => import('./homepage/searchbar.tsx'));
const Review = lazy(() => import('./dorms/review.tsx'));
const AllUniversities = lazy(() => import('./UniversitiesPage/allUniversities.tsx'));
const AdminDashboard = lazy(() => import('./admin/dashboard'));
const TermsOfService = lazy(() => import('./legal/TermsOfService.tsx'));
const PrivacyPolicy = lazy(() => import('./legal/PrivacyPolicy.tsx'));

import CookieConsent from './components/CookieConsent';

function App() {
  return (
    <UniversityDataProvider>
      <Router>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/aboutme" element={<AboutMe />} />
            <Route path="/contactme" element={<ContactMe />} />
            <Route path="/account" element={<Account />} />
            <Route path="/admin" element={<Home />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/universities" element={<AllUniversities />} />
            <Route path="/universities/:universityName" element={<University />} />
            <Route path="/universities/:universityName/dorms/:dormSlug" element={<Dorms />} />
            <Route path="/dorms" element={<Dorms />} />
            <Route path="/navbar" element={<NavBar />} />
            <Route path="/searchbar" element={<SearchBar />} />
            <Route path="/review" element={<Review />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
          </Routes>
        </Suspense>

        <CookieConsent />
      </Router >
    </UniversityDataProvider >
  )
}

export default App

