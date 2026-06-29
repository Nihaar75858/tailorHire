import { test, expect, vi, beforeEach, afterEach, describe } from "vitest";

// Mock constants BEFORE importing ApiService
vi.mock("../src/utils/constants", () => ({
  API_BASE_URL: "http://localhost:8000/api",
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock;

// Mock fetch
global.fetch = vi.fn();

import ApiService from "../src/services/api";

beforeEach(() => {
  fetch.mockClear();
  localStorageMock.getItem.mockClear();
  localStorageMock.setItem.mockClear();
  localStorageMock.removeItem.mockClear();
  localStorageMock.clear.mockClear();
});

// Register Endpoints
test("loads token from localStorage on init", async () => {
  // Mock localStorage to return a token
  localStorageMock.getItem.mockReturnValue("abc123");

  // Dynamically import to get fresh instance
  vi.resetModules();
  const { default: freshApi } = await import("../src/services/api");

  expect(freshApi.token).toBe("abc123");
  expect(localStorageMock.getItem).toHaveBeenCalledWith("accessToken");
});

test("setToken stores token in memory and localStorage", () => {
  ApiService.setToken("xyz");

  expect(ApiService.token).toBe("xyz");
  expect(localStorageMock.setItem).toHaveBeenCalledWith("accessToken", "xyz");
});

// Logout Endpoints
test("clearToken removes token from memory and storage", () => {
  ApiService.setToken("xyz");

  ApiService.clearToken();

  expect(ApiService.token).toBeNull();
  expect(localStorageMock.removeItem).toHaveBeenCalledWith("accessToken");
});

test("adds Authorization header when token exists", async () => {
  ApiService.setToken("token123");

  fetch.mockResolvedValue({
    ok: true,
    json: async () => ({ success: true }),
  });

  await ApiService.request("/test");

  expect(fetch).toHaveBeenCalledWith(
    expect.any(String),
    expect.objectContaining({
      headers: expect.objectContaining({
        Authorization: "Bearer token123",
      }),
    }),
  );
});

test("does not add Authorization header when no token", async () => {
  ApiService.clearToken();

  fetch.mockResolvedValue({
    ok: true,
    json: async () => ({ success: true }),
  });

  await ApiService.request("/test");

  expect(fetch).toHaveBeenCalledWith(
    expect.any(String),
    expect.objectContaining({
      headers: expect.not.objectContaining({
        Authorization: expect.anything(),
      }),
    }),
  );
});

test("returns JSON on successful request", async () => {
  const data = { jobs: [] };

  fetch.mockResolvedValue({
    ok: true,
    json: async () => data,
  });

  const result = await ApiService.request("/jobs");

  expect(result).toEqual(data);
});

test("throws error on non-OK response", async () => {
  fetch.mockResolvedValue({
    ok: false,
    status: 500,
    json: async () => ({ message: "Server exploded" }),
  });

  await expect(ApiService.request("/jobs")).rejects.toThrow(
    "HTTP error! status: 500",
  );
});

test("throws on network failure", async () => {
  fetch.mockRejectedValue(new Error("Network down"));

  await expect(ApiService.request("/jobs")).rejects.toThrow("Network down");
});

// Jobs Endpoints
test("getJobs builds query string correctly", async () => {
  fetch.mockResolvedValue({
    ok: true,
    json: async () => [],
  });

  await ApiService.getJobs({ page: 2, type: "dev" });

  expect(fetch).toHaveBeenCalledWith(
    expect.stringContaining("/jobs/?page=2&type=dev"),
    expect.any(Object),
  );
});

test("getJobs without params calls endpoint without query string", async () => {
  fetch.mockResolvedValue({
    ok: true,
    json: async () => [],
  });

  await ApiService.getJobs();

  expect(fetch).toHaveBeenCalledWith(
    expect.stringContaining("/jobs/"),
    expect.any(Object),
  );
});

test("getJob calls correct endpoint", async () => {
  fetch.mockResolvedValue({
    ok: true,
    json: async () => ({}),
  });

  await ApiService.getJob(10);

  expect(fetch).toHaveBeenCalledWith(
    expect.stringContaining("/jobs/10/"),
    expect.any(Object),
  );
});

// Logout Endpoints
test("logout clears token", async () => {
  ApiService.setToken("abc");

  await ApiService.logout();

  expect(ApiService.token).toBeNull();
  expect(localStorageMock.removeItem).toHaveBeenCalledWith("accessToken");
});

// Saved Jobs Endpoints
describe("SavedJob API", () => {
  beforeEach(() => {
    vi.spyOn(ApiService, "request").mockResolvedValue({});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("saveJob calls correct endpoint with POST", async () => {
    await ApiService.saveJob(5);

    expect(ApiService.request).toHaveBeenCalledWith("/saved-jobs/", {
      method: "POST",
      body: JSON.stringify({ job: 5 }),
    });
  });

  test("getSavedJobs calls correct endpoint", async () => {
    await ApiService.getSavedJobs();

    expect(ApiService.request).toHaveBeenCalledWith("/saved-jobs/");
  });

  test("removeSavedJob calls correct endpoint with DELETE", async () => {
    await ApiService.removeSavedJob(10);

    expect(ApiService.request).toHaveBeenCalledWith("/saved-jobs/remove/", {
      method: "DELETE",
      body: JSON.stringify({ job: 10 }),
    });
  });
});

// Cover Letter Endpoints
describe("Cover Letter API", () => {
  beforeEach(() => {
    vi.spyOn(ApiService, "request").mockResolvedValue({});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("generateCoverLetter calls correct endpoint with POST", async () => {
    const mockData = { jobId: 1, content: "Test" };

    await ApiService.generateCoverLetter(mockData);

    expect(ApiService.request).toHaveBeenCalledWith("/cover-letters/", {
      method: "POST",
      body: JSON.stringify(mockData),
    });
  });

  test("getCoverLetters calls correct endpoint", async () => {
    await ApiService.getCoverLetters();

    expect(ApiService.request).toHaveBeenCalledWith("/cover-letters/");
  });
});

// Application Endpoints
describe("Applications API", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  test("applyToJob sends POST request with correct payload", async () => {
    const mockResponse = { id: 1, status: "applied" };

    const requestSpy = vi.spyOn(ApiService, "request").mockResolvedValue(mockResponse);

    const jobId = 5;
    const applicationData = {
      cover_letter: "Test letter",
    };

    const result = await ApiService.applyToJob(jobId, applicationData);

    expect(requestSpy).toHaveBeenCalledWith("/applications/", {
      method: "POST",
      body: JSON.stringify({
        job: jobId,
        cover_letter: "Test letter",
      }),
    });

    expect(result).toEqual(mockResponse);
  });

  test("applyToJob merges jobId into application data", async () => {
    vi.spyOn(ApiService, "request").mockResolvedValue({});

    await ApiService.applyToJob(3, {
      status: "applied",
      resume: "file.pdf",
    });

    expect(ApiService.request).toHaveBeenCalledWith("/applications/", {
      method: "POST",
      body: JSON.stringify({
        job: 3,
        status: "applied",
        resume: "file.pdf",
      }),
    });
  });
});

// Profile Endpoints
describe("User Profile API", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  test("getProfile sends GET request to the correct endpoint", async () => {
    const mockResponse = { id: 1, username: "john" };

    const requestSpy = vi.spyOn(ApiService, "request").mockResolvedValue(mockResponse);

    const result = await ApiService.getProfile();

    expect(requestSpy).toHaveBeenCalledWith("/users/profile/");
    expect(result).toEqual(mockResponse);
  });

  test("updateProfile sends PUT request with serialized profile data", async () => {
    const mockResponse = { id: 1, username: "john", email: "john@example.com" };

    vi.spyOn(ApiService, "request").mockResolvedValue(mockResponse);

    const profileData = {
      username: "john",
      email: "john@example.com",
    };

    const result = await ApiService.updateProfile(profileData);

    expect(ApiService.request).toHaveBeenCalledWith("/users/profile/", {
      method: "PUT",
      body: JSON.stringify(profileData),
    });

    expect(result).toEqual(mockResponse);
  });

  test("updateProfile propagates errors thrown by request", async () => {
    const error = new Error("Update failed");
    vi.spyOn(ApiService, "request").mockRejectedValue(error);

    await expect(ApiService.updateProfile({ username: "john" })).rejects.toThrow("Update failed");
  });
});

// Chat Endpoints
describe("Chat API", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  test("sendMessage sends POST request with message payload", async () => {
    const mockResponse = { id: 1, message: "Hello", response: "Hi there!", created_at: "2026-06-28T00:00:00Z" };

    const requestSpy = vi.spyOn(ApiService, "request").mockResolvedValue(mockResponse);

    const result = await ApiService.sendMessage("Hello");

    expect(requestSpy).toHaveBeenCalledWith("/chat-message/", {
      method: "POST",
      body: JSON.stringify({ message: "Hello" }),
    });

    expect(result).toEqual(mockResponse);
  });

  test("sendMessage propagates errors thrown by request", async () => {
    const error = new Error("Failed to send");
    vi.spyOn(ApiService, "request").mockRejectedValue(error);

    await expect(ApiService.sendMessage("Hello")).rejects.toThrow("Failed to send");
  });

  test("getChatHistory sends GET request to the chat endpoint", async () => {
    const mockResponse = {
      count: 2,
      next: null,
      previous: null,
      results: [
        { id: 1, message: "Hi", response: "Hello!", created_at: "2026-06-28T00:00:00Z" },
        { id: 2, message: "Bye", response: "See you!", created_at: "2026-06-28T00:01:00Z" },
      ],
    };

    const requestSpy = vi.spyOn(ApiService, "request").mockResolvedValue(mockResponse);

    const result = await ApiService.getChatHistory();

    expect(requestSpy).toHaveBeenCalledWith("/chat-message/");
    expect(result).toEqual(mockResponse);
  });

  test("getChatHistory propagates errors thrown by request", async () => {
    const error = new Error("Network error");
    vi.spyOn(ApiService, "request").mockRejectedValue(error);

    await expect(ApiService.getChatHistory()).rejects.toThrow("Network error");
  });
});
