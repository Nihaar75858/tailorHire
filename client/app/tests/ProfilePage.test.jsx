import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { test, expect, vi, beforeEach } from "vitest";
import ProfilePage from '../src/pages/Profile/ProfilePage';
import { useUser } from '../src/components/hooks/useAuth';

vi.mock('../src/components/hooks/useAuth', () => ({
  useUser: vi.fn(),
}));

vi.mock('../src/components/profile/ProfileAvatar', () => ({
  default: ({ imageUrl, onUpload }) => (
    <div data-testid="profile-avatar">
      <span>{imageUrl || 'no-image'}</span>
      <button onClick={onUpload}>Upload</button>
    </div>
  ),
}));

vi.mock('../src/components/profile/ProfileForm', () => ({
  default: ({ initialData, onSubmit, onCancel }) => (
    <div data-testid="profile-form">
      <span>{initialData?.first_name}</span>
      <button onClick={() => onSubmit({ first_name: 'Updated' })}>Submit</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
}));

const mockUpdateUser = vi.fn();
const mockUser = { first_name: 'John', profile_picture: 'https://example.com/john.jpg' };

beforeEach(() => {
  vi.restoreAllMocks();
  useUser.mockReturnValue({ user: mockUser, updateUser: mockUpdateUser });
  vi.spyOn(window, 'alert').mockImplementation(() => {});
});

test('renders ProfileAvatar with the current user profile picture', () => {
  render(<ProfilePage />);

  expect(screen.getByTestId('profile-avatar')).toBeInTheDocument();
  expect(screen.getByText('https://example.com/john.jpg')).toBeInTheDocument();
});

test('renders ProfileForm with the current user as initialData', () => {
  render(<ProfilePage />);

  expect(screen.getByTestId('profile-form')).toBeInTheDocument();
  expect(screen.getByText('John')).toBeInTheDocument();
});

test('shows an alert when upload is triggered', async () => {
  render(<ProfilePage />);

  await userEvent.click(screen.getByText('Upload'));

  expect(window.alert).toHaveBeenCalledWith('Upload profile picture functionality');
});

test('calls updateUser with merged data and shows success alert on submit', async () => {
  render(<ProfilePage />);

  await userEvent.click(screen.getByText('Submit'));

  expect(mockUpdateUser).toHaveBeenCalledWith({
    ...mockUser,
    first_name: 'Updated',
  });
  expect(window.alert).toHaveBeenCalledWith('Profile updated successfully!');
});

test('does not throw when cancel is triggered', async () => {
  render(<ProfilePage />);

  await userEvent.click(screen.getByText('Cancel'));
  // onCancel only sets local `editing` state, which isn't reflected
  // in the current render output, so there's nothing externally to assert.
});