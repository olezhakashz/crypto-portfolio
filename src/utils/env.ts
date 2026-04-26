import Constants from 'expo-constants';

/**
 * True when the app is running inside Expo Go (SDK 52+).
 * Use this to guard features that are not supported in Expo Go,
 * such as remote push notifications (removed in SDK 53).
 */
export const IS_EXPO_GO = Constants.executionEnvironment === 'storeClient';
