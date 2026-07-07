import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import TextbooksTab from './TextbooksTab';
import { fetchBooks } from '../../services/api';
import { useRouter } from 'expo-router';

jest.mock('../../services/api', () => ({
  fetchBooks: jest.fn(),
  getBookCoverUrl: jest.fn(id => `http://mock/cover/${id}`),
}));

describe('TextbooksTab', () => {
  let mockPush;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPush = jest.fn();
    useRouter.mockImplementation(() => ({ push: mockPush }));
  });

  it('renders loading state initially', async () => {
    fetchBooks.mockImplementation(() => new Promise(() => {})); // Never resolves
    await render(<TextbooksTab search="" category={null} />);
    expect(screen.getByText('Loading books...')).toBeTruthy();
  });

  it('renders books and handles press', async () => {
    const mockBooks = {
      data: [
        { id: 1, title: 'Test Book 1', uploadedBy: 'Author 1', category: 'Science', readCount: 10 }
      ],
      pagination: { totalPages: 1 }
    };
    fetchBooks.mockResolvedValueOnce(mockBooks);

    await render(<TextbooksTab search="" category={null} />);

    // Wait for the book to render
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).toBeNull();
      expect(screen.getByText('Test Book 1')).toBeTruthy();
      expect(screen.getByText('Author 1')).toBeTruthy();
    });

    // Press book
    fireEvent.press(screen.getByText('Test Book 1'));

    expect(mockPush).toHaveBeenCalledWith(expect.objectContaining({
      pathname: '/tabs/book/BookDetails',
      params: expect.any(Object)
    }));
  });

  it('renders empty state when no books', async () => {
    fetchBooks.mockResolvedValueOnce({ data: [], pagination: { totalPages: 0 } });

    await render(<TextbooksTab search="" category={null} />);

    await waitFor(() => {
      // It should display some empty message. EmptyState probably says "No items found"
      expect(screen.getByText(/No textbooks found/i)).toBeTruthy();
    });
  });
});
