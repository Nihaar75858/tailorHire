import { render, screen, fireEvent } from '@testing-library/react';
import JobSearch from '../src/components/jobs/JobSearch';
import { expect, test, vi } from 'vitest';

const mockOnChange = vi.fn();
const mockOnSearch = vi.fn();

test('renders search input', () => {
  render(
    <JobSearch
      searchQuery=""
      onSearchChange={mockOnChange}
      onSearch={mockOnSearch}
    />
  );

  expect(
    screen.getByPlaceholderText(/search jobs, companies, or locations/i)
  ).toBeInTheDocument();
});

test('displays search query value', () => {
  render(
    <JobSearch
      searchQuery="React"
      onSearchChange={mockOnChange}
      onSearch={mockOnSearch}
    />
  );

  expect(screen.getByDisplayValue('React')).toBeInTheDocument();
});

test('calls onSearchChange on input change', () => {
  render(
    <JobSearch
      searchQuery=""
      onSearchChange={mockOnChange}
      onSearch={mockOnSearch}
    />
  );

  const input = screen.getByPlaceholderText(/search jobs/i);

  fireEvent.change(input, {
    target: { value: 'Django' }
  });

  expect(mockOnChange).toHaveBeenCalledTimes(1);
  expect(mockOnChange).toHaveBeenCalledWith('Django');
});


test('calls onSearch when search button clicked', () => {
  render(
    <JobSearch
      searchQuery=""
      onSearchChange={mockOnChange}
      onSearch={mockOnSearch}
    />
  );

  fireEvent.click(screen.getByText(/search/i));

  expect(mockOnSearch).toHaveBeenCalledTimes(1);
});

test('calls onSearch when Enter key pressed', () => {
  render(
    <JobSearch
      searchQuery="React"
      onSearchChange={mockOnChange}
      onSearch={mockOnSearch}
    />
  );

  const input = screen.getByPlaceholderText(/search jobs/i);

  fireEvent.keyPress(input, {
    key: 'Enter',
    code: 'Enter',
  });

  expect(mockOnSearch).toHaveBeenCalledTimes(1);
});

