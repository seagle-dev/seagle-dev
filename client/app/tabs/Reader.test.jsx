import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import Reader from './Reader';
import { useLocalSearchParams } from 'expo-router';

// Mock ReadingTab to avoid complex WebView interactions and focus on Reader's job
// Or we can test Reader with actual ReadingTab if we mock the child components.
jest.mock('../components/Reading/ReadingTab', () => {
  const { View, Text } = require('react-native');
  return function MockReadingTab({ book }) {
    return (
      <View testID="reading-tab">
        <Text>Reading Book: {book?.title}</Text>
        <Text>PDF URL: {book?.pdfUrl}</Text>
      </View>
    );
  };
});

describe('Reader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with book params', async () => {
    const mockBook = {
      id: 1,
      title: 'Biology 101',
      pdfUrl: 'http://test/book.pdf'
    };

    useLocalSearchParams.mockImplementation(() => ({
      book: JSON.stringify(mockBook)
    }));

    await render(<Reader />);

    expect(screen.getByTestId('reading-tab')).toBeTruthy();
    expect(screen.getByText('Reading Book: Biology 101')).toBeTruthy();
    expect(screen.getByText('PDF URL: http://test/book.pdf')).toBeTruthy();
  });

  it('renders gracefully without book params', async () => {
    useLocalSearchParams.mockImplementation(() => ({}));

    await render(<Reader />);

    expect(screen.getByTestId('reading-tab')).toBeTruthy();
  });
});
