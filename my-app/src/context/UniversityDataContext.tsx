import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

const API_BASE = (import.meta as any).env?.VITE_API_BASE || 'http://localhost:3000';

type University = {
  name: string;
  slug: string;
  location?: string;
  imageUrl?: string;
};

// Dorm type kept for future use
type _Dorm = {
  name: string;
  slug: string;
  university: string;
  universitySlug: string;
  imageUrl?: string;
  avgRating?: number;
  reviewCount?: number;
};

type UniversityDataContextType = {
  universities: University[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
};

const UniversityDataContext = createContext<UniversityDataContextType | undefined>(undefined);

// Simple in-memory cache with expiration
const cache = {
  universities: null as University[] | null,
  timestamp: 0,
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
};

export function UniversityDataProvider({ children }: { children: ReactNode }) {
  const [universities, setUniversities] = useState<University[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchId, setFetchId] = useState(0);

  const fetchUniversities = useCallback(async () => {
    // Check cache first
    const now = Date.now();
    if (cache.universities && (now - cache.timestamp) < cache.CACHE_DURATION) {
      setUniversities(cache.universities);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/api/universities`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      // Update cache
      cache.universities = data;
      cache.timestamp = now;
      
      setUniversities(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch universities');
      // Use cached data if available, even if stale
      if (cache.universities) {
        setUniversities(cache.universities);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUniversities();
  }, [fetchUniversities, fetchId]);

  const refetch = useCallback(() => {
    cache.universities = null;
    cache.timestamp = 0;
    setFetchId(prev => prev + 1);
  }, []);

  return (
    <UniversityDataContext.Provider value={{ universities, isLoading, error, refetch }}>
      {children}
    </UniversityDataContext.Provider>
  );
}

export function useUniversityData() {
  const context = useContext(UniversityDataContext);
  if (context === undefined) {
    throw new Error('useUniversityData must be used within a UniversityDataProvider');
  }
  return context;
}

// Export cache utilities for other components
export function getCachedUniversities(): University[] | null {
  const now = Date.now();
  if (cache.universities && (now - cache.timestamp) < cache.CACHE_DURATION) {
    return cache.universities;
  }
  return null;
}
