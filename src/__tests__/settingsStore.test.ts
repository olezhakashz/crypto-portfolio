import { useSettingsStore } from '../store/settingsStore';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

describe('settingsStore', () => {
  beforeEach(() => {
    useSettingsStore.setState({
      currency: 'USD',
      refreshIntervalMs: 30000,
      isLoading: false,
    });
    jest.clearAllMocks();
  });

  it('initializes with default values', () => {
    const state = useSettingsStore.getState();
    expect(state.currency).toBe('USD');
    expect(state.refreshIntervalMs).toBe(30000);
  });

  it('setCurrency updates the store and saves to storage', async () => {
    await useSettingsStore.getState().setCurrency('EUR');
    
    expect(useSettingsStore.getState().currency).toBe('EUR');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      'settings_v1',
      expect.stringContaining('"currency":"EUR"')
    );
  });

  it('setRefreshInterval updates the store and saves to storage', async () => {
    await useSettingsStore.getState().setRefreshInterval(60000);
    
    expect(useSettingsStore.getState().refreshIntervalMs).toBe(60000);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      'settings_v1',
      expect.stringContaining('"refreshIntervalMs":60000')
    );
  });
});
