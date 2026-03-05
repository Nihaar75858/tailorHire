import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { test, expect, vi, beforeEach } from 'vitest';
import JobsPage from '../src/pages/Jobs/JobsPage';
import { useJobs } from '../src/components/hooks/useJobs';

vi.mock('../src/components/hooks/useJobs', () => ({
  useJobs: vi.fn()
}));

const mockJobs = [
  {
    id: 1,
    title: 'Frontend Developer',
    company: 'TechCorp',
    location: 'Remote'
  },
  {
    id: 2,
    title: 'Backend Engineer',
    company: 'DataMinds',
    location: 'NYC'
  }
];

vi.mock('../src/services/api', () => ({
  default: {
    applyToJob: vi.fn(),
    saveJob: vi.fn(),
  },
}));

import api from '../src/services/api';

const mockMarkApplied = vi.fn();

vi.mock('../src/components/jobs/JobSearch', () => ({
  default: ({ searchQuery, onSearchChange, onSearch }) => (
    <div>
      <input
        data-testid="search-input"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
      />
      <button onClick={onSearch}>Search</button>
    </div>
  )
}));

vi.mock('../src/components/jobs/JobList', () => ({
  default: ({ jobs, onApply, onSave }) => (
    <div>
      {jobs.map((job) => (
        <div key={job.id}>
          <span>{job.title}</span>
          <button onClick={() => onApply(job)}>Apply</button>
          <button onClick={() => onSave(job)}>Save</button>
        </div>
      ))}
    </div>
  )
}));

vi.mock('../src/components/applications/ApplicationModal', () => ({
  default: ({ job, onSubmit, onClose }) => (
    <div data-testid="application-modal">
      <span>Modal for {job.title}</span>
      <button
        onClick={() =>
          onSubmit({ cover_letter: "Test Letter", cover_letter_id: 1 })
        }
      >
        Confirm Apply
      </button>
      <button onClick={onClose}>Close</button>
    </div>
  ),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

test('shows error state', () => {
  useJobs.mockReturnValue({
    jobs: [],
    loading: false,
    error: 'API failed',
    markJobAsApplied: mockMarkApplied,
    appliedJobsCount: 0
  });

  render(<JobsPage />);

  expect(
    screen.getByText(/error: api failed/i)
  ).toBeInTheDocument();
});

test('renders jobs from hook', () => {
  useJobs.mockReturnValue({
    jobs: mockJobs,
    loading: false,
    error: null,
    markJobAsApplied: mockMarkApplied,
    appliedJobsCount: 0
  });

  render(<JobsPage />);

  expect(
    screen.getByText('Frontend Developer')
  ).toBeInTheDocument();

  expect(
    screen.getByText('Backend Engineer')
  ).toBeInTheDocument();
});

test('filters jobs based on search query', async () => {
  const user = userEvent.setup();

  useJobs.mockReturnValue({
    jobs: mockJobs,
    loading: false,
    error: null,
    markJobAsApplied: mockMarkApplied,
    appliedJobsCount: 0
  });

  render(<JobsPage />);

  const input = screen.getByTestId('search-input');

  await user.type(input, 'Frontend');
  await user.click(screen.getByText(/search/i));

  expect(
    screen.getByText('Frontend Developer')
  ).toBeInTheDocument();

  expect(
    screen.queryByText('Backend Engineer')
  ).not.toBeInTheDocument();
});


test('resets jobs when search is empty', async () => {
  const user = userEvent.setup();

  useJobs.mockReturnValue({
    jobs: mockJobs,
    loading: false,
    error: null,
    markJobAsApplied: mockMarkApplied,
    appliedJobsCount: 0
  });

  render(<JobsPage />);

  const input = screen.getByTestId('search-input');

  await user.type(input, 'Frontend');
  await user.clear(input);
  await user.click(screen.getByText(/search/i));

  expect(screen.getAllByText(/developer|engineer/i))
    .toHaveLength(2);
});

test('opens modal and submits application', async () => {
  const user = userEvent.setup();
  window.alert = vi.fn();

  useJobs.mockReturnValue({
    jobs: mockJobs,
    loading: false,
    error: null,
    markJobAsApplied: mockMarkApplied,
    appliedJobsCount: 0
  });

  api.applyToJob.mockResolvedValue({});

  render(<JobsPage />);

  // Click Apply
  await user.click(screen.getAllByText(/apply/i)[0]);

  // Modal appears
  expect(
    screen.getByTestId('application-modal')
  ).toBeInTheDocument();

  // Confirm inside modal
  await user.click(screen.getByText(/confirm apply/i));

  // API should now be called
  expect(api.applyToJob).toHaveBeenCalledWith(
    1,
    {
      cover_letter: "Test Letter",
      cover_letter_id: 1
    }
  );

  expect(mockMarkApplied).toHaveBeenCalledWith(1);

  // Success alert
  expect(window.alert).toHaveBeenCalledWith(
    expect.stringContaining('Successfully applied')
  );

  // Modal should close
  expect(
    screen.queryByTestId('application-modal')
  ).not.toBeInTheDocument();
});

test('closes modal without applying when cancelled', async () => {
  const user = userEvent.setup();

  useJobs.mockReturnValue({
    jobs: mockJobs,
    loading: false,
    error: null,
    markJobAsApplied: mockMarkApplied,
    appliedJobsCount: 0
  });

  render(<JobsPage />);

  await user.click(screen.getAllByText(/apply/i)[0]);

  expect(
    screen.getByTestId('application-modal')
  ).toBeInTheDocument();

  await user.click(screen.getByText(/close/i));

  expect(
    screen.queryByTestId('application-modal')
  ).not.toBeInTheDocument();
});

test('shows error if application fails', async () => {
  const user = userEvent.setup();
  window.alert = vi.fn();

  useJobs.mockReturnValue({
    jobs: mockJobs,
    loading: false,
    error: null,
    markJobAsApplied: mockMarkApplied,
    appliedJobsCount: 0
  });

  api.applyToJob.mockRejectedValue(new Error("Server error"));

  render(<JobsPage />);

  await user.click(screen.getAllByText(/apply/i)[0]);
  await user.click(screen.getByText(/confirm apply/i));

  expect(window.alert).toHaveBeenCalledWith(
    expect.stringContaining('Application failed')
  );
});

test('calls save handler', async () => {
  const user = userEvent.setup();
  window.alert = vi.fn();

  useJobs.mockReturnValue({
    jobs: mockJobs,
    loading: false,
    error: null,
    markJobAsApplied: mockMarkApplied,
    appliedJobsCount: 0
  });

  api.saveJob.mockResolvedValue({});

  render(<JobsPage />);

  await user.click(screen.getAllByText(/save/i)[0]);

  expect(api.saveJob).toHaveBeenCalledWith(1);

  expect(window.alert).toHaveBeenCalledWith(
    expect.stringContaining('Saved')
  );
});


