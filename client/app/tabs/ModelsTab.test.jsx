import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import ModelsTab from './ModelsTab';
import { fetchModels } from '../../services/api';

jest.mock('../../services/api', () => ({
  fetchModels: jest.fn(),
  getModelThumbnailUrl: jest.fn(id => `http://mock/thumb/${id}`),
  getToken: jest.fn().mockResolvedValue('fake-token'),
}));

// We can mock ModelModal to simplify testing since it uses WebView which we already globally mocked
jest.mock('../components/Reading/ModelModal', () => {
  const { View, Text, TouchableOpacity } = require('react-native');
  return function MockModelModal({ visible, model, onClose }) {
    if (!visible) return null;
    return (
      <View testID="model-modal">
        <Text>Modal Model: {model?.name}</Text>
        <TouchableOpacity testID="close-modal" onPress={onClose}>
          <Text>Close</Text>
        </TouchableOpacity>
      </View>
    );
  };
});

describe('ModelsTab', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', async () => {
    fetchModels.mockImplementation(() => new Promise(() => {})); // Never resolves
    await render(<ModelsTab search="" category={null} />);
    expect(screen.getByText('Loading 3D models...')).toBeTruthy();
  });

  it('renders models and opens modal on press', async () => {
    const mockModels = {
      data: [
        { id: 1, name: 'Test Model 1', category: 'Anatomy' }
      ],
      pagination: { totalPages: 1 }
    };
    fetchModels.mockResolvedValueOnce(mockModels);

    await render(<ModelsTab search="" category={null} />);

    // Wait for the model to render
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).toBeNull();
      expect(screen.getByText('Test Model 1')).toBeTruthy();
      expect(screen.getByText('Anatomy')).toBeTruthy();
    });

    // Modal should not be visible
    expect(screen.queryByTestId('model-modal')).toBeNull();

    // Press model
    fireEvent.press(screen.getByText('Test Model 1'));

    // Modal should be visible
    await waitFor(() => {
      expect(screen.getByTestId('model-modal')).toBeTruthy();
      expect(screen.getByText('Modal Model: Test Model 1')).toBeTruthy();
    });

    // Close modal
    fireEvent.press(screen.getByTestId('close-modal'));

    await waitFor(() => {
      expect(screen.queryByTestId('model-modal')).toBeNull();
    });
  });
});
