import { test, expect, vi } from "vitest";

// Mock constants BEFORE importing ApiService
vi.mock('../src/utils/constants', () => ({
  API_BASE_URL: 'http://localhost:8000/api',
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

import ApiService from '../src/services/api';

beforeEach(() => {
  fetch.mockClear();
  localStorageMock.getItem.mockClear();
  localStorageMock.setItem.mockClear();
  localStorageMock.removeItem.mockClear();
  localStorageMock.clear.mockClear();
});

// Register 
test('loads token from localStorage on init', async () => {
  // Mock localStorage to return a token
  localStorageMock.getItem.mockReturnValue('abc123');
  
  // Dynamically import to get fresh instance
  vi.resetModules();
  const { default: freshApi } = await import('../src/services/api');
  
  expect(freshApi.token).toBe('abc123');
  expect(localStorageMock.getItem).toHaveBeenCalledWith('accessToken');
});

test('setToken stores token in memory and localStorage', () => {
  ApiService.setToken('xyz');

  expect(ApiService.token).toBe('xyz');
  expect(localStorageMock.setItem).toHaveBeenCalledWith('accessToken', 'xyz');
});

// Logout
test('clearToken removes token from memory and storage', () => {
  ApiService.setToken('xyz');

  ApiService.clearToken();

  expect(ApiService.token).toBeNull();
  expect(localStorageMock.removeItem).toHaveBeenCalledWith('accessToken');
});

test('adds Authorization header when token exists', async () => {
  ApiService.setToken('token123');

  fetch.mockResolvedValue({
    ok: true,
    json: async () => ({ success: true }),
  });

  await ApiService.request('/test');

  expect(fetch).toHaveBeenCalledWith(
    expect.any(String),
    expect.objectContaining({
      headers: expect.objectContaining({
        Authorization: 'Bearer token123',
      }),
    })
  );
});

test('does not add Authorization header when no token', async () => {
  ApiService.clearToken();

  fetch.mockResolvedValue({
    ok: true,
    json: async () => ({ success: true }),
  });

  await ApiService.request('/test');

  expect(fetch).toHaveBeenCalledWith(
    expect.any(String),
    expect.objectContaining({
      headers: expect.not.objectContaining({
        Authorization: expect.anything(),
      }),
    })
  );
});

test('returns JSON on successful request', async () => {
  const data = { jobs: [] };

  fetch.mockResolvedValue({
    ok: true,
    json: async () => data,
  });

  const result = await ApiService.request('/jobs');

  expect(result).toEqual(data);
});

test('throws error on non-OK response', async () => {
  fetch.mockResolvedValue({
    ok: false,
    status: 500,
    json: async () => ({ message: 'Server exploded' }),
  });

  await expect(ApiService.request('/jobs'))
    .rejects
    .toThrow('HTTP error! status: 500');
});

test('throws on network failure', async () => {
  fetch.mockRejectedValue(new Error('Network down'));

  await expect(ApiService.request('/jobs'))
    .rejects
    .toThrow('Network down');
});

// Jobs
test('getJobs builds query string correctly', async () => {
  fetch.mockResolvedValue({
    ok: true,
    json: async () => ([]),
  });

  await ApiService.getJobs({ page: 2, type: 'dev' });

  expect(fetch).toHaveBeenCalledWith(
    expect.stringContaining('/jobs/?page=2&type=dev'),
    expect.any(Object)
  );
});

test('getJobs without params calls endpoint without query string', async () => {
  fetch.mockResolvedValue({
    ok: true,
    json: async () => ([]),
  });

  await ApiService.getJobs();

  expect(fetch).toHaveBeenCalledWith(
    expect.stringContaining('/jobs/'),
    expect.any(Object)
  );
});

test('getJob calls correct endpoint', async () => {
  fetch.mockResolvedValue({
    ok: true,
    json: async () => ({}),
  });

  await ApiService.getJob(10);

  expect(fetch).toHaveBeenCalledWith(
    expect.stringContaining('/jobs/10/'),
    expect.any(Object)
  );
});

// Logout
test('logout clears token', async () => {
  ApiService.setToken('abc');

  await ApiService.logout();

  expect(ApiService.token).toBeNull();
  expect(localStorageMock.removeItem).toHaveBeenCalledWith('accessToken')
});

// Saved Jobs 
describe('SavedJob API', () => {
  beforeEach(() => {
    vi.spyOn(ApiService, 'request').mockResolvedValue({});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('saveJob calls correct endpoint with POST', async () => {
    await ApiService.saveJob(5);

    expect(ApiService.request).toHaveBeenCalledWith('/saved-jobs/', {
      method: 'POST',
      body: JSON.stringify({ job: 5 }),
    });
  });

  test('getSavedJobs calls correct endpoint', async () => {
    await ApiService.getSavedJobs();

    expect(ApiService.request).toHaveBeenCalledWith('/saved-jobs/');
  });

  test('removeSavedJob calls correct endpoint with DELETE', async () => {
    await ApiService.removeSavedJob(10);

    expect(ApiService.request).toHaveBeenCalledWith('/saved-jobs/remove/', {
      method: 'DELETE',
      body: JSON.stringify({ job: 10 }),
    });
  });
});

describe("Cover Letter API", () => {
  beforeEach(() => {
    vi.spyOn(ApiService, 'request').mockResolvedValue({});
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
