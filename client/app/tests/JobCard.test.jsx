import { render, screen, fireEvent } from "@testing-library/react";
import { test, expect, vi } from "vitest";
import JobCard from '../src/components/jobs/JobCard';

const mockJob = {
  id: 1,
  title: 'Frontend Developer',
  company: 'TechCorp',
  location: 'Remote',
  salary: '$100k',
  type: 'Full-time',
  posted: '2 days ago',
  description: 'Build amazing UIs',
  requirements: ['React', 'Tailwind', 'TypeScript']
};

const mockApply = vi.fn();
const mockSave = vi.fn();


test('renders job title and company', () => {
  render(<JobCard job={mockJob} onApply={mockApply} onSave={mockSave} />);

  expect(screen.getByText(/frontend developer/i)).toBeInTheDocument();
  expect(screen.getByText(/techcorp/i)).toBeInTheDocument();
});

test('renders job metadata', () => {
  render(<JobCard job={mockJob} onApply={mockApply} onSave={mockSave} />);

  expect(screen.getByText(/remote/i)).toBeInTheDocument();
  expect(screen.getByText(/\$100k/i)).toBeInTheDocument();
  expect(screen.getByText(/2 days ago/i)).toBeInTheDocument();
});

test('renders job description', () => {
  render(<JobCard job={mockJob} onApply={mockApply} onSave={mockSave} />);

  expect(screen.getByText(/build amazing uis/i)).toBeInTheDocument();
});

test('renders job requirements', () => {
  render(<JobCard job={mockJob} onApply={mockApply} onSave={mockSave} />);

  mockJob.requirements.forEach(req => {
    expect(screen.getByText(req)).toBeInTheDocument();
  });
});

test('calls onApply when apply button clicked', () => {
  render(<JobCard job={mockJob} onApply={mockApply} onSave={mockSave} />);

  fireEvent.click(screen.getByText(/apply now/i));

  expect(mockApply).toHaveBeenCalledTimes(1);
  expect(mockApply).toHaveBeenCalledWith(mockJob);
});

test('calls onSave when save button clicked', () => {
  render(<JobCard job={mockJob} onApply={mockApply} onSave={mockSave} />);

  fireEvent.click(screen.getByText(/save/i));

  expect(mockSave).toHaveBeenCalledTimes(1);
  expect(mockSave).toHaveBeenCalledWith(mockJob);
});

test('handles empty requirements gracefully', () => {
  const jobNoReq = { ...mockJob, requirements: [] };

  render(<JobCard job={jobNoReq} onApply={mockApply} onSave={mockSave} />);

  expect(screen.queryByText(/react/i)).not.toBeInTheDocument();
});


