import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Home from '../pages/home/home';
import { UniversityDataProvider } from '../context/UniversityDataContext';

// Mock fetch for the provider and Home's data fetching
globalThis.fetch = vi.fn().mockResolvedValue({
  ok: true,
  json: async () => ({
    topUniversities: [],
    topRatedDorms: [],
    mostReviewedDorms: [],
    totalReviewsCount: 0,
  }),
});

// Mock child components
vi.mock('../pages/nav/navbar.tsx', () => ({
  default: () => <div data-testid="navbar">NavBar</div>,
}));

vi.mock('../pages/home/searchbar.tsx', () => ({
  default: () => <div data-testid="searchbar">SearchBar</div>,
}));

vi.mock('../pages/home/footer.tsx', () => ({
  default: () => <div data-testid="footer">Footer</div>,
}));

vi.mock('../pages/home/GiveawayBanner', () => ({
  default: () => <div data-testid="giveaway-banner">GiveawayBanner</div>,
}));

vi.mock('../pages/home/UniversityBanner', () => ({
  default: () => <div data-testid="university-banner">UniversityBanner</div>,
}));

vi.mock('../../hooks/useSEO', () => ({
  useSEO: () => {},
}));

function renderHome() {
  return render(
    <BrowserRouter>
      <UniversityDataProvider>
        <Home />
      </UniversityDataProvider>
    </BrowserRouter>
  );
}

describe('Home Page Integration Tests', () => {
  it('should render all main sections of the home page', () => {
    renderHome();

    expect(screen.getByTestId('navbar')).toBeInTheDocument();
    expect(screen.getByTestId('searchbar')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
  });

  it('should display the hero title', () => {
    renderHome();

    // i18n key home.heroTitle renders as the key in test since minimal i18n setup
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('should display featured sections', () => {
    renderHome();

    // Section headings from i18n keys
    const headings = screen.getAllByRole('heading', { level: 2 });
    expect(headings.length).toBeGreaterThanOrEqual(3);
  });
});
