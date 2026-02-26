import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { test, expect, vi, beforeEach } from 'vitest';
import CoverLetterPage from '../src/pages/CoverLetter/CoverLetterPage';

// Mock useAuth hook
vi.mock('../../components/hooks/useAuth', () => ({
  useAuth: () => ({
    user: {
      username: 'testuser',
      first_name: 'John',
      skills: 'React, JavaScript, Node.js',
    },
  }),
}));

// Mock clipboard and alert
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(() => Promise.resolve()),
  },
});
global.alert = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  // Use fake timers
  vi.useFakeTimers();
});

afterEach(() => {
  // Restore real timers
  vi.useRealTimers();
});

test('renders cover letter generator page', () => {
  render(<CoverLetterPage />);
  
  expect(screen.getByText('AI Cover Letter Generator')).toBeInTheDocument();
  expect(screen.getByPlaceholderText('Paste the job description here...')).toBeInTheDocument();
});

test('shows alert when trying to generate without job description', () => {
  render(<CoverLetterPage />);
  
  fireEvent.click(screen.getByText('Generate Cover Letter'));
  
  expect(global.alert).toHaveBeenCalledWith('Please enter a job description');
});

test('generates cover letter after clicking generate', async () => {
  render(<CoverLetterPage />);

  // Enter job description
  fireEvent.change(
    screen.getByPlaceholderText('Paste the job description here...'),
    { target: { value: 'Software Engineer role' } }
  );

  // Click generate
  fireEvent.click(screen.getByText('Generate Cover Letter'));

  // Check loading state
  expect(screen.getByText('Generating...')).toBeInTheDocument();

  // Fast-forward timers
  vi.advanceTimersByTime(1500);

  // Wait for the generated letter to appear
  await waitFor(() => {
    expect(screen.getByText('Generated Cover Letter')).toBeInTheDocument();
  });

  // Check that user's name appears in the letter
  expect(screen.getByText(/John/)).toBeInTheDocument();
});

test('copies to clipboard', async () => {
  render(<CoverLetterPage />);

  // Enter job description
  fireEvent.change(
    screen.getByPlaceholderText('Paste the job description here...'),
    { target: { value: 'Software Engineer role' } }
  );

  // Generate letter
  fireEvent.click(screen.getByText('Generate Cover Letter'));
  
  // Fast-forward timers
  vi.advanceTimersByTime(1500);

  // Wait for copy button to appear
  await waitFor(() => {
    expect(screen.getByText('Copy to Clipboard')).toBeInTheDocument();
  });

  // Click copy
  fireEvent.click(screen.getByText('Copy to Clipboard'));

  // Verify clipboard was called
  expect(navigator.clipboard.writeText).toHaveBeenCalled();
  expect(global.alert).toHaveBeenCalledWith('Cover letter copied to clipboard!');
});

test('includes user skills in generated letter', async () => {
  render(<CoverLetterPage />);

  fireEvent.change(
    screen.getByPlaceholderText('Paste the job description here...'),
    { target: { value: 'Software Engineer role' } }
  );

  fireEvent.click(screen.getByText('Generate Cover Letter'));
  
  vi.advanceTimersByTime(1500);

  await waitFor(() => {
    expect(screen.getByText('Generated Cover Letter')).toBeInTheDocument();
  });

  // Check that skills appear in the letter
  const letterContent = screen.getByText(/React/).textContent;
  expect(letterContent).toContain('React');
});

test('button is disabled while generating', () => {
  render(<CoverLetterPage />);

  fireEvent.change(
    screen.getByPlaceholderText('Paste the job description here...'),
    { target: { value: 'Software Engineer role' } }
  );

  const button = screen.getByText('Generate Cover Letter');
  fireEvent.click(button);

  expect(button).toBeDisabled();
  expect(screen.getByText('Generating...')).toBeInTheDocument();
});