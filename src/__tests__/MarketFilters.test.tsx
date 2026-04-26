import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import MarketFilters from '../components/MarketFilters';
import { useMarketStore } from '../store/marketStore';

// Mock the store
jest.mock('../store/marketStore', () => ({
  useMarketStore: jest.fn(),
}));

describe('MarketFilters', () => {
  const setQuery = jest.fn();
  const setOnlyGainers = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useMarketStore as unknown as jest.Mock).mockImplementation((selector) => {
      const state = {
        query: '',
        onlyGainers: false,
        setQuery,
        setOnlyGainers,
      };
      return selector(state);
    });
  });

  it('renders correctly', () => {
    const { getByPlaceholderText } = render(<MarketFilters />);
    expect(getByPlaceholderText('Search BTC, ETH...')).toBeTruthy();
  });

  it('calls setQuery when text is typed', () => {
    const { getByPlaceholderText } = render(<MarketFilters />);
    const input = getByPlaceholderText('Search BTC, ETH...');
    
    fireEvent.changeText(input, 'bitcoin');
    expect(setQuery).toHaveBeenCalledWith('bitcoin');
  });

  it('calls setOnlyGainers when segment is toggled', () => {
    const { getByText } = render(<MarketFilters />);
    
    // Tap on Gainers segment
    const gainersBtn = getByText('Gainers');
    fireEvent.press(gainersBtn);
    
    expect(setOnlyGainers).toHaveBeenCalledWith(true);
  });
});
