import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { test, expect, vi, beforeEach } from "vitest";
import ProfilePage from '../src/pages/profile/ProfilePage';
import { useUser } from '../src/components/hooks/useAuth';
import ApiService from '../src/services/api';

vi.mock('../src/components/hooks/useAuth', () => ({
  useUser: vi.fn(),
}));

vi.mock('../src/services/api', () => ({
  default: {
    updateProfile: vi.fn(),
  },
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
const mockUser = { first_name: 'Jane', profile_picture: 'https://example.com/jane.jpg' };

beforeEach(() => {
  vi.restoreAllMocks();
  useUser.mockReturnValue({ user: mockUser, updateUser: mockUpdateUser });
  vi.spyOn(window, 'alert').mockImplementation(() => {});
  ApiService.updateProfile.mockResolvedValue({ first_name: 'Updated' });
});

test('shows a loading state while the context is still loading', async () => {
  useUser.mockReturnValue({ user: null, updateUser: mockUpdateUser, loading: true });

  render(<ProfilePage />);

  expect(screen.getByText(/loading profile/i)).toBeInTheDocument();
  expect(screen.queryByTestId('profile-form')).not.toBeInTheDocument();
});

test('renders ProfileAvatar and ProfileForm once loading is complete', async () => {
  render(<ProfilePage />);

  expect(screen.getByTestId('profile-avatar')).toBeInTheDocument();
  expect(screen.getByText('https://example.com/jane.jpg')).toBeInTheDocument();
  expect(screen.getByTestId('profile-form')).toBeInTheDocument();
  expect(screen.getByText('Jane')).toBeInTheDocument();
});

test('shows an error message if fetching the profile fails', async () => {
  ApiService.getProfile.mockRejectedValue(new Error('Network error'));

  render(<ProfilePage />);

  await waitFor(() => {
    expect(screen.getByText(/failed to load profile/i)).toBeInTheDocument();
  });
});

test('calls ApiService.updateProfile and updateUser on form submit', async () => {
  render(<ProfilePage />);

  await userEvent.click(screen.getByText('Submit'));

  await waitFor(() => {
    expect(ApiService.updateProfile).toHaveBeenCalledWith({ first_name: 'Updated' });
  });

  expect(mockUpdateUser).toHaveBeenCalledWith(
    expect.objectContaining({ first_name: 'Updated' })
  );
  expect(window.alert).toHaveBeenCalledWith('Profile updated successfully!');
});

test('shows an error alert if updateProfile fails', async () => {
  ApiService.updateProfile.mockRejectedValue(new Error('Update failed'));

  render(<ProfilePage />);

  await userEvent.click(screen.getByText('Submit'));

  await waitFor(() => {
    expect(window.alert).toHaveBeenCalledWith('Failed to update profile.');
  });
});

test('shows an alert when upload is triggered', async () => {
  render(<ProfilePage />);

  await userEvent.click(screen.getByText('Upload'));

  expect(window.alert).toHaveBeenCalledWith('Upload profile picture functionality');
});

test('calls onCancel without throwing', async () => {
  render(<ProfilePage />);

  await userEvent.click(screen.getByText('Cancel'));
});