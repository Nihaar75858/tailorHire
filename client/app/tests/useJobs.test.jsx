// src/tests/useJobs.test.js
import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, test, expect, beforeEach, vi } from "vitest";

vi.mock("../src/services/api", () => ({
  default: {
    getJobs: vi.fn(),
    getApplications: vi.fn(),
  },
}));

import api from "../src/services/api";
import { useJobs } from "../src/components/hooks/useJobs";

describe("useJobs hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("returns initial state correctly", async () => {
    api.getJobs.mockResolvedValue({ results: [] });
    api.getApplications.mockResolvedValue({ results: [] });

    const { result } = renderHook(() => useJobs());

    expect(result.current.jobs).toEqual([]);
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBe(null);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  test("loads jobs and filters out applied ones", async () => {
    const mockJobs = [
      { id: 1, title: "Frontend Dev" },
      { id: 2, title: "Backend Dev" },
    ];

    const mockApplications = [{ id: 100, job: 1 }];

    api.getJobs.mockResolvedValue({
      results: mockJobs,
    });
    api.getApplications.mockResolvedValue({ results: mockApplications });

    const { result } = renderHook(() => useJobs());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Job with id=1 should be filtered out
    expect(result.current.jobs).toEqual([
      { id: 2, title: 'Backend Dev' }
    ]);

    expect(result.current.appliedJobCount).toBe(1);
  });

  test('markJobAsApplied removes job from available jobs', async () => {
    const mockJobs = [
      { id: 1, title: 'Frontend Dev' },
      { id: 2, title: 'Backend Dev' },
    ];

    api.getJobs.mockResolvedValue({ results: mockJobs });
    api.getApplications.mockResolvedValue({
      results: [],
    });

    const { result } = renderHook(() => useJobs());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Initially both jobs available
    expect(result.current.jobs).toHaveLength(2);

    act(() => {
      result.current.markJobAsApplied(1);
    });

    // Now job 1 removed
    expect(result.current.jobs).toEqual([
      { id: 2, title: 'Backend Dev' }
    ]);

    expect(result.current.appliedJobCount).toBe(1);
  });

  test("sets error if fetch fails", async () => {
    api.getJobs.mockRejectedValue(new Error("Fetch failed"));
    api.getApplications.mockResolvedValue({ results: [] });

    const { result } = renderHook(() => useJobs());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe("Fetch failed");
  });
});
