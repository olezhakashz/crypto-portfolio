(global as any).__ExpoImportMetaRegistry = {};
jest.mock('expo-haptics', () => ({
  selectionAsync: jest.fn(),
  notificationAsync: jest.fn(),
}));
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(),
  getAllScheduledNotificationsAsync: jest.fn(),
}));
