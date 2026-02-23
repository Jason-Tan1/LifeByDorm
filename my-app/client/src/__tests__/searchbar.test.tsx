import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import SearchBar from '../pages/home/searchbar';

// Mock the fetch API
globalThis.fetch = vi.fn();

describe('SearchBar Integration Tests', () => {
  const mockUniversities = [
    { name: 'York University', slug: 'york-university' },
    { name: 'University of Toronto', slug: 'university-of-toronto' },
    { name: 'Western University', slug: 'western-university' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (globalThis.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockUniversities,
    });
  });

  it('should render the search bar', () => {
    render(
      <BrowserRouter>
        <SearchBar />
      </BrowserRouter>
    );

    const searchInput = screen.getByPlaceholderText(/search for a university/i);
    expect(searchInput).toBeInTheDocument();
  });

  it('should fetch and display universities when typing', async () => {
    const user = userEvent.setup();

    render(
      <BrowserRouter>
        <SearchBar />
      </BrowserRouter>
    );

    const searchInput = screen.getByPlaceholderText(/search for a university/i);

    // Type in the search bar
    await user.type(searchInput, 'York');

    // Wait for the filtered results to appear
    await waitFor(() => {
      expect(screen.getByText('York University')).toBeInTheDocument();
    });
  });

  it('should filter universities based on search query', async () => {
    const user = userEvent.setup();

    render(
      <BrowserRouter>
        <SearchBar />
      </BrowserRouter>
    );

    const searchInput = screen.getByPlaceholderText(/search for a university/i);

    // Type "Toronto" which should match "University of Toronto"
    await user.type(searchInput, 'Toronto');

    await waitFor(() => {
      expect(screen.getByText('University of Toronto')).toBeInTheDocument();
      expect(screen.queryByText('Western University')).not.toBeInTheDocument();
    });
  });

  it('should call API on component mount', async () => {
    render(
      <BrowserRouter>
        <SearchBar />
      </BrowserRouter>
    );

    // Verify fetch was called
    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/universities')
      );
    });
  });

  it('should handle API errors gracefully', async () => {
    // Mock a failed fetch
    (globalThis.fetch as any).mockRejectedValueOnce(new Error('API Error'));

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <BrowserRouter>
        <SearchBar />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error fetching universities:',
        expect.any(Error)
      );
    });

    consoleSpy.mockRestore();
  });
});
