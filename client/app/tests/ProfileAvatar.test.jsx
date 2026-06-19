import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { test, expect, vi } from "vitest";
import ProfileAvatar from '../src/components/profile/ProfileAvatar';

// Mock lucide-react icons so we can assert on them directly
vi.mock('lucide-react', () => ({
  User: (props) => <svg data-testid="icon-user" {...props} />,
  Plus: (props) => <svg data-testid="icon-plus" {...props} />,
}));

const mockUpload = vi.fn();

test('shows default user icon when no imageUrl is provided', () => {
  render(<ProfileAvatar imageUrl={null} onUpload={mockUpload} />);

  expect(screen.getByTestId('icon-user')).toBeInTheDocument();
  expect(screen.queryByRole('img', { name: /profile/i })).not.toBeInTheDocument();
});

test('renders profile image when imageUrl is provided', () => {
  render(<ProfileAvatar imageUrl="https://example.com/avatar.jpg" onUpload={mockUpload} />);

  const image = screen.getByRole('img', { name: /profile/i });
  expect(image).toBeInTheDocument();
  expect(image).toHaveAttribute('src', 'https://example.com/avatar.jpg');
});

test('does not show default user icon when imageUrl is provided', () => {
  render(<ProfileAvatar imageUrl="https://example.com/avatar.jpg" onUpload={mockUpload} />);

  expect(screen.queryByTestId('icon-user')).not.toBeInTheDocument();
});

test('renders the upload button with plus icon', () => {
  render(<ProfileAvatar imageUrl={null} onUpload={mockUpload} />);

  expect(screen.getByTestId('icon-plus')).toBeInTheDocument();
  expect(screen.getByRole('button')).toBeInTheDocument();
});

test('calls onUpload when upload button is clicked', async () => {
  render(<ProfileAvatar imageUrl={null} onUpload={mockUpload} />);

  const uploadButton = screen.getByRole('button');
  await userEvent.click(uploadButton);

  expect(mockUpload).toHaveBeenCalledTimes(1);
});