import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import { BrowserRouter } from 'react-router-dom';
import Home from '../pages/home/home';

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

describe('Home Page Integration Tests', () => {
  it('should render all main sections of the home page', () => {
    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    // Check if NavBar is rendered
    expect(screen.getByTestId('navbar')).toBeInTheDocument();

    // Check if SearchBar is rendered
    expect(screen.getByTestId('searchbar')).toBeInTheDocument();

    // Check if main heading is rendered
    expect(screen.getByText(/Find Your Perfect Dorm/i)).toBeInTheDocument();

    // Check if Footer is rendered
    expect(screen.getByTestId('footer')).toBeInTheDocument();
  });

  it('should display featured universities section', () => {
    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    expect(screen.getByText(/Featured Universities/i)).toBeInTheDocument();
  });

  it('should display featured dorms section', () => {
    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    expect(screen.getByText(/Featured Dorms/i)).toBeInTheDocument();
  });

  it('should render university cards with correct information', () => {
    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    // Check for York University
    expect(screen.getByText('York University')).toBeInTheDocument();
    expect(screen.getByText('Toronto, ON')).toBeInTheDocument();
  });

  it('should have working navigation links to universities', () => {
    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    const universityLinks = screen.getAllByRole('link', { name: /view dorms/i });
    expect(universityLinks.length).toBeGreaterThan(0);
    
    // Check that the first link points to the correct university
    expect(universityLinks[0]).toHaveAttribute('href', '/universities/york-university');
  });
});
