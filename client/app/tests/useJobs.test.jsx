// src/tests/useJobs.test.js
import { renderHook, act } from '@testing-library/react';
import { describe, test, expect, beforeEach, afterEach, vi } from "vitest";
import { useJobs } from '../src/components/hooks/useJobs';
import { MOCK_JOBS } from '../src/utils/constants';

describe('useJobs hook', () => {
  test('returns initial state correctly', () => {
    const { result } = renderHook(() => useJobs());

    expect(result.current.jobs).toEqual([]);
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBe(null);
  });
});

describe('useJobs hook', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('loads jobs successfully', async () => {
    const { result } = renderHook(() => useJobs());

    // Fast-forward the timeout
    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(result.current.jobs).toEqual(MOCK_JOBS);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
  });
});

test('sets error if fetch fails', () => {
  vi.spyOn(globalThis, 'setTimeout').mockImplementationOnce(() => {
    throw new Error('Fetch failed');
  });

  const { result } = renderHook(() => useJobs());

  expect(result.current.loading).toBe(false);
  expect(result.current.error).toBe('Fetch failed');
});

