import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { test, expect, vi } from "vitest";
import JobList from '../src/components/jobs/JobList';

// Mock JobCard
vi.mock('@/components/jobs/JobCard', () => ({
  default: ({ job, onApply, onSave }) => (
    <div data-testid="job-card">
      <span>{job.title}</span>
      <button onClick={() => onApply(job)}>Apply</button>
      <button onClick={() => onSave(job)}>Save</button>
    </div>
  )
}));

const mockJobs = [
  { id: 1, title: 'Frontend Developer' },
  { id: 2, title: 'Backend Developer' }
];

const mockApply = vi.fn();
const mockSave = vi.fn();

test('shows empty state when no jobs', () => {
  render(
    <JobList jobs={[]} onApply={mockApply} onSave={mockSave} />
  );

  expect(
    screen.getByText(/no jobs found/i)
  ).toBeInTheDocument();
});

test('renders job cards when jobs exist', () => {
  render(
    <JobList jobs={mockJobs} onApply={mockApply} onSave={mockSave} />
  );

  const cards = screen.getAllByTestId('job-card');
  expect(cards).toHaveLength(2);
});

test('displays job titles', () => {
  render(
    <JobList jobs={mockJobs} onApply={mockApply} onSave={mockSave} />
  );

  expect(screen.getByText('Frontend Developer')).toBeInTheDocument();
  expect(screen.getByText('Backend Developer')).toBeInTheDocument();
});

test('calls onApply when apply clicked', async () => {
  render(
    <JobList jobs={mockJobs} onApply={mockApply} onSave={mockSave} />
  );

  const applyButtons = screen.getAllByText(/apply/i);

  await userEvent.click(applyButtons[0]);

  expect(mockApply).toHaveBeenCalledWith(mockJobs[0]);
});

test('calls onSave when save clicked', async () => {
  render(
    <JobList jobs={mockJobs} onApply={mockApply} onSave={mockSave} />
  );

  const saveButtons = screen.getAllByText(/save/i);

  await userEvent.click(saveButtons[1]);

  expect(mockSave).toHaveBeenCalledWith(mockJobs[1]);
});
