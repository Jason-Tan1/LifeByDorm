import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import React, { lazy, Suspense } from 'react';
import { UniversityDataProvider } from './context/UniversityDataContext';
import PageLoader from './components/PageLoader';
import ScrollToTop from './components/ScrollToTop';
import GoogleAnalytics from './components/GoogleAnalytics';

// Lazy load non-critical shell components — they don't affect first paint.
// Renamed from CookieConsent to ConsentBanner so ad blockers don't block the chunk by filename.
// .catch fallbacks render a no-op component if a chunk is blocked (ERR_BLOCKED_BY_CLIENT),
// so we fail soft instead of crashing the whole Router tree.
const noopModule = { default: (() => null) as React.FC };
const ConsentBanner = lazy(() =>
  import('./components/ConsentBanner').catch(() => noopModule)
);
const GoogleOneTapPrompt = lazy(() =>
  import('./components/GoogleOneTapPrompt').catch(() => noopModule)
);

// Lazy load the Google OAuth provider so the SDK doesn't block first paint
const LazyGoogleOAuthProvider = lazy(() => import('./components/LazyGoogleOAuthProvider'));

// Lazy load all page components for better initial load performance
const Home = lazy(() => import('./pages/home/home.tsx'));
const About = lazy(() => import('./pages/nav/about.tsx'));
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
const CookiePolicy = lazy(() => import('./pages/legal/CookiePolicy.tsx'));
const ReviewGuidelines = lazy(() => import('./pages/legal/ReviewGuidelines.tsx'));
const HelpCenter = lazy(() => import('./pages/legal/HelpCenter.tsx'));

function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <LazyGoogleOAuthProvider>
        <UniversityDataProvider>
          <Router>
            <GoogleAnalytics />
            <ScrollToTop />
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<About />} />
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
                <Route path="/cookie-policy" element={<CookiePolicy />} />
                <Route path="/review-guidelines" element={<ReviewGuidelines />} />
                <Route path="/help-center" element={<HelpCenter />} />
              </Routes>
            </Suspense>

            <Suspense fallback={null}>
              <ConsentBanner />
              <GoogleOneTapPrompt />
            </Suspense>
          </Router>
        </UniversityDataProvider>
      </LazyGoogleOAuthProvider>
    </Suspense>
  )
}

export default App

