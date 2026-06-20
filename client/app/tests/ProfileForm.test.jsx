import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { test, expect, vi } from "vitest";
import ProfileForm from '../src/components/profile/ProfileForm';

const mockSubmit = vi.fn();
const mockCancel = vi.fn();

test('renders all fields empty when no initialData is provided', () => {
  const { container } = render(<ProfileForm onSubmit={mockSubmit} onCancel={mockCancel} />);

  expect(container.querySelector('input[name="first_name"]').value).toBe('');
  expect(container.querySelector('input[name="last_name"]').value).toBe('');
  expect(container.querySelector('input[name="email"]').value).toBe('');
  expect(container.querySelector('input[name="location"]').value).toBe('');
  expect(container.querySelector('textarea[name="bio"]').value).toBe('');
  expect(container.querySelector('input[name="skills"]').value).toBe('');
});

test('pre-fills fields with initialData when provided', () => {
  const initialData = {
    first_name: 'Jane',
    last_name: 'Doe',
    email: 'jane@example.com',
    location: 'Remote',
    bio: 'Frontend dev',
    skills: 'React, JS',
  };

  const { container } = render(
    <ProfileForm initialData={initialData} onSubmit={mockSubmit} onCancel={mockCancel} />
  );

  expect(container.querySelector('input[name="first_name"]').value).toBe('Jane');
  expect(container.querySelector('input[name="email"]').value).toBe('jane@example.com');
  expect(container.querySelector('textarea[name="bio"]').value).toBe('Frontend dev');
});

test('updates field value as the user types', async () => {
  const { container } = render(<ProfileForm onSubmit={mockSubmit} onCancel={mockCancel} />);

  const firstNameInput = container.querySelector('input[name="first_name"]');
  await userEvent.type(firstNameInput, 'Alice');

  expect(firstNameInput.value).toBe('Alice');
});

test('calls onSubmit with current form data when Save Changes is clicked', async () => {
  const { container } = render(<ProfileForm onSubmit={mockSubmit} onCancel={mockCancel} />);

  const firstNameInput = container.querySelector('input[name="first_name"]');
  await userEvent.type(firstNameInput, 'Bob');

  await userEvent.click(screen.getByText(/save changes/i));

  expect(mockSubmit).toHaveBeenCalledWith(
    expect.objectContaining({ first_name: 'Bob' })
  );
});

test('renders Cancel button when onCancel is provided', () => {
  render(<ProfileForm onSubmit={mockSubmit} onCancel={mockCancel} />);

  expect(screen.getByText(/cancel/i)).toBeInTheDocument();
});

test('does not render Cancel button when onCancel is not provided', () => {
  render(<ProfileForm onSubmit={mockSubmit} />);

  expect(screen.queryByText(/cancel/i)).not.toBeInTheDocument();
});

test('calls onCancel when Cancel button is clicked', async () => {
  render(<ProfileForm onSubmit={mockSubmit} onCancel={mockCancel} />);

  await userEvent.click(screen.getByText(/cancel/i));

  expect(mockCancel).toHaveBeenCalledTimes(1);
});