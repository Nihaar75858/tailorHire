// src/tests/useJobs.test.js
import { renderHook, waitFor } from '@testing-library/react';
import { describe, test, expect, beforeEach, vi } from "vitest";

vi.mock('../src/services/api', () => ({
  default: {
    getJobs: vi.fn(),
  },
}));

import api from '../src/services/api';
import { useJobs } from '../src/components/hooks/useJobs';

describe('useJobs hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('returns initial state correctly', async () => {
    const { result } = renderHook(() => useJobs());

    expect(result.current.jobs).toEqual([]);
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBe(null);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  test('loads jobs successfully', async () => {
    const mockResults = [{ id: 1, title: 'Frontend Dev' }];

    api.getJobs.mockResolvedValue({
      results: mockResults,
    });

    const { result } = renderHook(() => useJobs());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.jobs).toEqual(mockResults);
    expect(result.current.error).toBe(null);
  });

  test('sets error if fetch fails', async () => {
    api.getJobs.mockRejectedValue(new Error('Fetch failed'));

    const { result } = renderHook(() => useJobs());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Fetch failed');

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('Fetch failed');
  });
});
