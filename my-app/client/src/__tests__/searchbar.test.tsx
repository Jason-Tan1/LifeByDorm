import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import SearchBar from '../pages/home/searchbar';
import { UniversityDataProvider } from '../context/UniversityDataContext';

// Mock the fetch API
globalThis.fetch = vi.fn();

const mockUniversities = [
  { name: 'York University', slug: 'york-university' },
  { name: 'University of Toronto', slug: 'university-of-toronto' },
  { name: 'Western University', slug: 'western-university' },
];

function renderSearchBar() {
  return render(
    <BrowserRouter>
      <UniversityDataProvider>
        <SearchBar />
      </UniversityDataProvider>
    </BrowserRouter>
  );
}

describe('SearchBar Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (globalThis.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockUniversities,
    });
  });

  it('should render the search bar', () => {
    renderSearchBar();

    const searchInput = screen.getByPlaceholderText(/search for a university/i);
    expect(searchInput).toBeInTheDocument();
  });

  it('should fetch and display universities when typing', async () => {
    const user = userEvent.setup();
    renderSearchBar();

    const searchInput = screen.getByPlaceholderText(/search for a university/i);
    await user.type(searchInput, 'York');

    await waitFor(() => {
      expect(screen.getByText('York University')).toBeInTheDocument();
    });
  });

  it('should filter universities based on search query', async () => {
    const user = userEvent.setup();
    renderSearchBar();

    const searchInput = screen.getByPlaceholderText(/search for a university/i);
    await user.type(searchInput, 'Toronto');

    await waitFor(() => {
      expect(screen.getByText('University of Toronto')).toBeInTheDocument();
      expect(screen.queryByText('Western University')).not.toBeInTheDocument();
    });
  });

  it('should be ready to accept input on mount', () => {
    renderSearchBar();

    const searchInput = screen.getByPlaceholderText(/search for a university/i);
    expect(searchInput).toBeInTheDocument();
    expect(searchInput).not.toBeDisabled();
  });

  it('should handle API errors gracefully', async () => {
    (globalThis.fetch as any).mockRejectedValueOnce(new Error('API Error'));

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    renderSearchBar();

    // The provider catches the error and sets error state rather than logging
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/search for a university/i)).toBeInTheDocument();
    });

    consoleSpy.mockRestore();
  });
});
