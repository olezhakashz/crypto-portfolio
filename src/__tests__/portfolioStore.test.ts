import { usePortfolioStore } from '../store/portfolioStore';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

describe('portfolioStore', () => {
  beforeEach(() => {
    usePortfolioStore.setState({
      items: [],
      isLoading: false,
      error: null,
    });
    jest.clearAllMocks();
  });

  it('adds a new item to portfolio', async () => {
    const newItem = { coinId: 'bitcoin', symbol: 'btc', name: 'Bitcoin', amount: 1.5 };
    
    await usePortfolioStore.getState().addOrUpdate(newItem);
    
    const state = usePortfolioStore.getState();
    expect(state.items).toHaveLength(1);
    expect(state.items[0]).toEqual(newItem);
    expect(AsyncStorage.setItem).toHaveBeenCalled();
  });

  it('updates an existing item in portfolio', async () => {
    const initialItem = { coinId: 'ethereum', symbol: 'eth', name: 'Ethereum', amount: 10 };
    usePortfolioStore.setState({ items: [initialItem] });
    
    const updatedItem = { ...initialItem, amount: 15 };
    await usePortfolioStore.getState().addOrUpdate(updatedItem);
    
    const state = usePortfolioStore.getState();
    expect(state.items).toHaveLength(1);
    expect(state.items[0].amount).toBe(15);
  });

  it('removes an item from portfolio', async () => {
    const item = { coinId: 'dogecoin', symbol: 'doge', name: 'Dogecoin', amount: 1000 };
    usePortfolioStore.setState({ items: [item] });
    
    await usePortfolioStore.getState().remove('dogecoin');
    
    const state = usePortfolioStore.getState();
    expect(state.items).toHaveLength(0);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('portfolio_v1', '[]');
  });
});
