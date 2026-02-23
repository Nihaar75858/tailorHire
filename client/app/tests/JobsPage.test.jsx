import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { test, expect, vi } from 'vitest';
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
    getJobs: vi.fn(),
    applyToJob: vi.fn(),
  },
}));

import api from '../src/services/api';

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

test('shows loading state', () => {
  useJobs.mockReturnValue({
    jobs: [],
    loading: true,
    error: null
  });

  render(<JobsPage />);

  expect(
    screen.getByText(/loading jobs/i)
  ).toBeInTheDocument();
});

test('shows error state', () => {
  useJobs.mockReturnValue({
    jobs: [],
    loading: false,
    error: 'API failed'
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
    error: null
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
    error: null
  });

  api.getJobs.mockResolvedValue({
    results: [mockJobs[0]] // only frontend
  });

  render(<JobsPage />);

  const input = screen.getByTestId('search-input');

  await user.type(input, 'Frontend');
  await user.click(screen.getByText(/search/i));

  expect(api.getJobs).toHaveBeenCalledWith({
    search: 'Frontend'
  });

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
    error: null
  });

  render(<JobsPage />);

  const input = screen.getByTestId('search-input');

  await user.type(input, 'Frontend');
  await user.clear(input);
  await user.click(screen.getByText(/search/i));

  expect(screen.getAllByText(/developer|engineer/i))
    .toHaveLength(2);
});


test('calls apply handler', async () => {
  const user = userEvent.setup();
  window.alert = vi.fn();

  useJobs.mockReturnValue({
    jobs: mockJobs,
    loading: false,
    error: null
  });

  api.applyToJob.mockResolvedValue({});

  render(<JobsPage />);

  await user.click(screen.getAllByText(/apply/i)[0]);

  expect(api.applyToJob).toHaveBeenCalledWith(
    1,
    expect.objectContaining({
      cover_letter: expect.any(String),
    })
  );

  expect(window.alert).toHaveBeenCalledWith(
    expect.stringContaining('Applied to')
  );
});


test('calls save handler', async () => {
  const user = userEvent.setup();
  window.alert = vi.fn();
  api.saveJob = vi.fn().mockResolvedValue({});

  useJobs.mockReturnValue({
    jobs: mockJobs,
    loading: false,
    error: null
  });

  render(<JobsPage />);

  await user.click(screen.getAllByText(/save/i)[0]);

  expect(api.saveJob).toHaveBeenCalledWith(1);

  expect(window.alert).toHaveBeenCalledWith(
    expect.stringContaining('Saved')
  );
});


