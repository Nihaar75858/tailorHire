// src/utils/__tests__/constants.test.js
import { MOCK_JOBS, API_BASE_URL } from '../src/utils/constants';
import { describe, test, expect } from "vitest";

// API_BASE_URL fallback
describe('API_BASE_URL', () => {
  test('falls back to localhost when env variable is not set', () => {
    expect(API_BASE_URL).toBe('http://localhost:8000/api');
  });
});

// MOCK_JOBS Structure
describe('MOCK_JOBS', () => {
  test('is a non-empty array', () => {
    expect(Array.isArray(MOCK_JOBS)).toBe(true);
    expect(MOCK_JOBS.length).toBeGreaterThan(0);
  });

  test('each job has required fields', () => {
    MOCK_JOBS.forEach(job => {
      expect(job).toHaveProperty('id');
      expect(job).toHaveProperty('title');
      expect(job).toHaveProperty('company');
      expect(job).toHaveProperty('location');
      expect(job).toHaveProperty('salary');
      expect(job).toHaveProperty('type');
      expect(job).toHaveProperty('posted');
      expect(job).toHaveProperty('description');
      expect(job).toHaveProperty('requirements');
      expect(Array.isArray(job.requirements)).toBe(true);
    });
  });
});

// Job IDs are unique
test('job IDs are unique', () => {
  const ids = MOCK_JOBS.map(job => job.id);
  const uniqueIds = new Set(ids);

  expect(uniqueIds.size).toBe(ids.length);
});

