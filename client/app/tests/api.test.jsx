import ApiService from '../src/services/api';
import { test, expect, vi } from "vitest";

global.fetch = vi.fn();

beforeEach(() => {
  fetch.mockClear();
  localStorage.clear();
});

test('loads token from localStorage on init', () => {
  localStorage.setItem('access_token', 'abc123');

  const api = new (require('../api').default.constructor)();

  expect(api.token).toBe('abc123');
});

test('setToken stores token in memory and localStorage', () => {
  ApiService.setToken('xyz');

  expect(ApiService.token).toBe('xyz');
  expect(localStorage.getItem('access_token')).toBe('xyz');
});

test('clearToken removes token from memory and storage', () => {
  ApiService.setToken('xyz');

  ApiService.clearToken();

  expect(ApiService.token).toBeNull();
  expect(localStorage.getItem('access_token')).toBeNull();
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

test('logout clears token', async () => {
  ApiService.setToken('abc');

  await ApiService.logout();

  expect(ApiService.token).toBeNull();
});

