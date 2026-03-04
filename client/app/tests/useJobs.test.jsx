// src/tests/useJobs.test.js
import { renderHook, waitFor } from "@testing-library/react";
import { describe, test, expect, beforeEach, vi } from "vitest";

vi.mock("../src/services/api", () => ({
  default: {
    getJobs: vi.fn(),
    getApplictions: vi.fn(),
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

    expect(result.current.appliedJobIds.size).toBe(0);
  });

  test("loads jobs successfully", async () => {
    const mockJobs = [
      { id: 1, title: "Frontend" },
      { id: 2, title: "Backend" },
    ];

    const mockApplications = [{ id: 10, job: 2 }];

    api.getJobs.mockResolvedValue({
      results: mockJobs,
    });
    api.getApplications.mockResolvedValue({ results: mockApplications });

    const { result } = renderHook(() => useJobs());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.jobs).toEqual(mockJobs);

    expect(result.current.appliedJobIds.has(2)).toBe(true);
    expect(result.current.appliedJobIds.has(1)).toBe(false);
  });

  test("isJobApplied returns correct value", async () => {
    api.getJobs.mockResolvedValue({ results: [{ id: 1 }] });
    api.getApplications.mockResolvedValue({
      results: [{ id: 99, job: 1 }],
    });

    const { result } = renderHook(() => useJobs());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.isJobApplied(1)).toBe(true);
    expect(result.current.isJobApplied(999)).toBe(false);
  });

  test("markJobAsApplied adds job id to applied set", async () => {
    api.getJobs.mockResolvedValue({ results: [] });
    api.getApplications.mockResolvedValue({ results: [] });

    const { result } = renderHook(() => useJobs());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.isJobApplied(5)).toBe(false);

    result.current.markJobAsApplied(5);

    expect(result.current.isJobApplied(5)).toBe(true);
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
