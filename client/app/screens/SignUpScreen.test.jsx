import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import SignUpScreen from './SignUpScreen';
import { register } from '../../services/api';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'expo-router';
import { Alert } from 'react-native';

jest.mock('../../services/api');
jest.mock('../context/AuthContext');

describe('SignUpScreen', () => {
  let mockPush;
  let mockSignIn;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPush = jest.fn();
    useRouter.mockImplementation(() => ({ push: mockPush }));
    
    mockSignIn = jest.fn();
    useAuth.mockReturnValue({ signIn: mockSignIn });
    
    jest.spyOn(Alert, 'alert');
  });

  it('renders correctly', async () => {
    await render(<SignUpScreen />);
    expect(screen.getByText('Account Information')).toBeTruthy();
    expect(screen.getByPlaceholderText('Enter First Name')).toBeTruthy();
  });

  it('shows error if email or password missing', async () => {
    await render(<SignUpScreen />);
    fireEvent.press(screen.getByText('Create Account'));
    expect(Alert.alert).toHaveBeenCalledWith('Error', 'Email and password are required');
  });

  it('shows error if passwords do not match', async () => {
    await render(<SignUpScreen />);
    fireEvent.changeText(screen.getByPlaceholderText('Enter Email'), 'test@test.com');
    const passwords = screen.getAllByPlaceholderText('************');
    fireEvent.changeText(passwords[0], 'password123'); // Password
    fireEvent.changeText(passwords[1], 'password124'); // Confirm Password
    
    fireEvent.press(screen.getByText('Create Account'));
    expect(Alert.alert).toHaveBeenCalledWith('Error', 'Passwords do not match');
  });

  it('calls register and navigates on success', async () => {
    register.mockResolvedValueOnce({ user: { id: 1 }, token: 'token123' });
    
    await render(<SignUpScreen />);
    fireEvent.changeText(screen.getByPlaceholderText('Enter First Name'), 'John');
    fireEvent.changeText(screen.getByPlaceholderText('Enter Last Name'), 'Doe');
    fireEvent.changeText(screen.getByPlaceholderText('Enter Email'), 'test@test.com');
    const passwords = screen.getAllByPlaceholderText('************');
    fireEvent.changeText(passwords[0], 'password123');
    fireEvent.changeText(passwords[1], 'password123');
    
    fireEvent.press(screen.getByText('Create Account'));

    await waitFor(() => {
      expect(register).toHaveBeenCalledWith('test@test.com', 'password123', 'John', 'Doe');
      expect(mockSignIn).toHaveBeenCalledWith({ id: 1 }, 'token123');
      expect(mockPush).toHaveBeenCalledWith('/screens/SuccessScreen');
    });
  });

  it('shows error alert on registration failure', async () => {
    register.mockRejectedValueOnce(new Error('Email already taken'));
    
    await render(<SignUpScreen />);
    fireEvent.changeText(screen.getByPlaceholderText('Enter Email'), 'test@test.com');
    const passwords = screen.getAllByPlaceholderText('************');
    fireEvent.changeText(passwords[0], 'password123');
    fireEvent.changeText(passwords[1], 'password123');
    
    fireEvent.press(screen.getByText('Create Account'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Registration Failed', 'Email already taken');
    });
  });
});
