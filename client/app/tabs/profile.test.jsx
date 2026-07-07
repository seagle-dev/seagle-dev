import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import ProfileScreen from './profile';
import { fetchProfile } from '../../services/api';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'expo-router';

jest.mock('../../services/api', () => ({
  fetchProfile: jest.fn(),
  updateProfile: jest.fn(),
  changePassword: jest.fn(),
}));

jest.mock('../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

describe('ProfileScreen', () => {
  let mockPush;
  let mockSignOut;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPush = jest.fn();
    useRouter.mockReturnValue({ push: mockPush });
    
    mockSignOut = jest.fn();
    useAuth.mockReturnValue({
      user: { id: 1, email: 'auth@test.com' },
      signOut: mockSignOut,
    });
  });

  it('renders loading state initially', async () => {
    fetchProfile.mockImplementation(() => new Promise(() => {}));
    await render(<ProfileScreen />);
    // Profile info should not be there initially
    expect(screen.queryByText('Personal')).toBeNull();
  });

  it('renders profile data correctly', async () => {
    const mockProfile = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@test.com',
      department: 'Nursing',
    };
    fetchProfile.mockResolvedValueOnce(mockProfile);

    await render(<ProfileScreen />);

    await waitFor(() => {
      expect(screen.getByText('John')).toBeTruthy();
      expect(screen.getByText('Doe')).toBeTruthy();
      expect(screen.getByText('john@test.com')).toBeTruthy();
      expect(screen.getByText('Nursing')).toBeTruthy();
    });
  });

  it('falls back to auth user if fetchProfile fails', async () => {
    fetchProfile.mockRejectedValueOnce(new Error('Network error'));

    await render(<ProfileScreen />);

    await waitFor(() => {
      expect(screen.getByText('auth@test.com')).toBeTruthy();
    });
  });

  it('switches tabs and logs out', async () => {
    fetchProfile.mockResolvedValueOnce({ email: 'test@test.com' });

    await render(<ProfileScreen />);

    await waitFor(() => {
      expect(screen.getByText('test@test.com')).toBeTruthy();
    });

    // Switch to settings
    fireEvent.press(screen.getByText('Settings'));
    expect(screen.getByText('Notifications')).toBeTruthy(); // Checking a setting section title

    // Press logout
    fireEvent.press(screen.getByText('Log Out'));
    
    expect(mockSignOut).toHaveBeenCalled();
  });
});
