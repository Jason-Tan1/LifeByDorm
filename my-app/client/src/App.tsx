import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { UniversityDataProvider } from './context/UniversityDataContext';
import PageLoader from './components/PageLoader';

// Lazy load all page components for better initial load performance
const Home = lazy(() => import('./pages/home/home.tsx'));
const AboutMe = lazy(() => import('./pages/nav/aboutme.tsx'));
const ContactMe = lazy(() => import('./pages/nav/contactme.tsx'));
const Account = lazy(() => import('./pages/nav/account.tsx'));
const University = lazy(() => import('./pages/universities/universityDash.tsx'));
const Dorms = lazy(() => import('./pages/dorms/dorms.tsx'));
const NavBar = lazy(() => import('./pages/nav/navbar.tsx'));
const SearchBar = lazy(() => import('./pages/home/searchbar.tsx'));
const Review = lazy(() => import('./pages/dorms/review.tsx'));
const AllUniversities = lazy(() => import('./pages/universities/allUniversities.tsx'));
const AdminDashboard = lazy(() => import('./pages/admin/dashboard'));
const TermsOfService = lazy(() => import('./pages/legal/TermsOfService.tsx'));
const PrivacyPolicy = lazy(() => import('./pages/legal/PrivacyPolicy.tsx'));

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

