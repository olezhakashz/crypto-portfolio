# Crypto Portfolio

A modern, responsive React Native application built with Expo for tracking cryptocurrency prices and managing your digital asset portfolio.

## 📱 Features

- **Market Tracking**: View top cryptocurrencies, real-time prices, and 24h changes.
- **Portfolio Management**: Add, update, and remove coins from your personal portfolio.
- **Offline Support**: Cache-first architecture ensures you can view your portfolio and market data even without internet access.
- **Native Integrations**: Utilizes device haptics for feedback, local notifications, and native async storage.
- **Dark/Light Theme**: Sleek UI with modern color schemes and consistent styling.
- **Responsive Layout**: Designed to look great on both small phones and larger devices using Flexbox and dynamic dimensions.
- **Robust Error Handling**: Built-in network connectivity checks and React Error Boundaries to prevent crashes.

## 🛠 Tech Stack

- **Framework**: React Native with Expo (v55)
- **Navigation**: React Navigation (Native Stack & Bottom Tabs)
- **State Management**: Zustand
- **API**: CoinGecko API
- **Storage**: AsyncStorage
- **Quality**: ESLint, Prettier, TypeScript, Jest
- **UI**: Custom components using `StyleSheet`

## 📸 Screenshots

*(Replace with actual screenshots when hosting)*
![Market Screen Placeholder](https://via.placeholder.com/150) ![Portfolio Screen Placeholder](https://via.placeholder.com/150)

## 🚀 Setup Instructions

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/crypto-portfolio.git
   cd crypto-portfolio
   ```

2. **Install dependencies:**
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Start the development server:**
   ```bash
   npx expo start
   ```

4. **Run on a device/emulator:**
   - Press `a` to open on Android emulator.
   - Press `i` to open on iOS simulator.
   - Scan the QR code with the Expo Go app on your physical device.

## 🏗 Deployment (EAS Build)

This project is configured for Expo Application Services (EAS). To create a preview build:

1. Install EAS CLI globally:
   ```bash
   npm install -g eas-cli
   ```

2. Login to your Expo account:
   ```bash
   eas login
   ```

3. Trigger an Android preview build:
   ```bash
   eas build --platform android --profile preview
   ```
   *The build process will generate an `.apk` file that can be installed on Android devices.*

## 🧪 Testing

The project includes unit tests for critical business logic, formatting utilities, state management (Zustand stores), and components.
To run the tests:

```bash
npm run test
```

## 🔐 Security Considerations
- The app uses `AsyncStorage` for non-sensitive data (cache, settings, portfolio balances).
- No API keys are hardcoded in the source code. CoinGecko's public API endpoints are used which do not require authentication tokens for basic usage.
- Strict input validation is performed when updating portfolio amounts (e.g., rejecting negative values or malformed strings).

## 📡 API Integration
This app integrates with the **CoinGecko API** to fetch real-time cryptocurrency data. 
- `GET /coins/markets` - Retrieves a list of coins sorted by market cap.
- `GET /coins/{id}` - Retrieves detailed information about a specific coin.

Data is fetched asynchronously using `fetch` with robust error handling (try/catch) and loading state indicators.

## 👨‍💻 Architecture & Project Structure
The app is built using a feature-based structure ensuring clean architecture:
- `src/api` - API communication logic.
- `src/components` - Reusable UI components.
- `src/navigation` - React Navigation configurations.
- `src/screens` - Screen views.
- `src/store` - Zustand global state management.
- `src/theme` - Centralized design tokens (colors, spacing, typography).
- `src/utils` - Helper functions and formatters.
- `src/__tests__` - Jest unit tests.

The **Zustand** state manager was chosen over Context API and Redux Toolkit due to its minimal boilerplate, excellent TypeScript support, and ease of use for a medium-sized application.

## 🗺️ Project File Map — What Each File Does

### 🚀 Entry Point

| File | Responsibility |
|------|---------------|
| `index.ts` | The very first file React Native loads. It registers `App.tsx` as the root component. |
| `App.tsx` | The outermost shell of the app. Sets up navigation, gesture handling, safe areas, toast messages, error catching, and loads user settings on startup. |

---

### 📡 `src/api/` — Internet Requests

> These files talk to the outside world (CoinGecko API).

| File | Responsibility |
|------|---------------|
| `coingecko.ts` | All network requests to the CoinGecko API. Contains two functions: `fetchMarketCoins()` (gets the top 50 coins list) and `fetchCoinDetails()` (gets full info for one specific coin). Also handles timeouts so the app doesn't hang forever on a slow connection. |

---

### 🏪 `src/store/` — Global State (App Memory)

> These files hold data that needs to be shared across multiple screens. Built with **Zustand**.

| File | Responsibility |
|------|---------------|
| `marketStore.ts` | Holds the live list of top 50 coins from CoinGecko. Manages the search filter, gainers-only filter, and auto-refresh timer. Caches data to AsyncStorage so the list works even when offline. |
| `portfolioStore.ts` | Holds the user's personal list of saved coins (their portfolio). Persists to AsyncStorage so the portfolio survives app restarts. Provides `addOrUpdate()` and `remove()` actions. |
| `settingsStore.ts` | Holds all user preferences: selected currency (USD/EUR), auto-refresh interval (15s/30s/60s), and daily notification settings. Also manages the notification scheduling logic. |

---

### 📱 `src/screens/` — The Pages the User Sees

> Each file is one full screen of the app.

| File | Responsibility |
|------|---------------|
| `MarketScreen.tsx` | The **Market** tab. Shows the scrollable list of top 50 coins with prices, 24h change %, and rank badges. Supports search filtering and the "Gainers Only" toggle. Auto-refreshes prices on a timer. Tapping a coin navigates to `CoinDetailsScreen`. |
| `PortfolioScreen.tsx` | The **Portfolio** tab. Shows the user's saved coins with live prices pulled from market data. Displays total portfolio value. Long-press a coin to remove it. Auto-refreshes prices every 30 seconds. |
| `SettingsScreen.tsx` | The **Settings** tab. Lets the user change the display currency (USD/EUR), set the auto-refresh interval, and toggle a daily reminder notification. |
| `CoinDetailsScreen.tsx` | The **Coin Detail** page. Opens when the user taps a coin in the Market list. Shows the coin's logo, current price, market cap, 24h change, and lets the user add the coin to their portfolio with a custom amount. |

---

### 🧭 `src/navigation/` — Screen Routing

> These files define how screens connect to each other and how the user moves between them.

| File | Responsibility |
|------|---------------|
| `RootNavigator.tsx` | The top-level router. Uses a **stack navigator** — the 3-tab area sits on the bottom, and the Coin Detail screen slides on top when you navigate to it. |
| `TabNavigator.tsx` | Sets up the **3-tab bottom bar** (Market / Portfolio / Settings). Uses our custom `GlassTabBar` instead of the default tab bar. |
| `GlassTabBar.tsx` | The custom-designed bottom tab bar with a frosted glass / blur visual style and animated active tab indicator. |
| `types.ts` | TypeScript definitions listing all valid screen names and their parameters. This lets TypeScript catch navigation mistakes at compile time. |

---

### 🧩 `src/components/` — Reusable UI Pieces

> These are small building blocks used across multiple screens.

| File | Responsibility |
|------|---------------|
| `ui.tsx` | A library of core UI components: `Button`, `Card`, `Screen`, `Title`, `Subtle`, `Badge`, `ChangePill`, `SectionLabel`, `Divider`. Used everywhere throughout the app for consistent styling. |
| `Toast.tsx` | The toast notification system. Provides a `useToast()` hook that any screen can call to show a short popup message (e.g. "Saved!" or "Error"). |
| `ErrorBoundary.tsx` | A React error boundary that wraps the whole app. If something crashes unexpectedly, it shows a friendly error message instead of a blank white screen. |
| `MarketFilters.tsx` | The search bar + "Gainers Only" toggle shown at the top of the Market screen. Updates the `marketStore` when the user types or toggles. |
| `NetworkCheck.tsx` | Monitors the device's internet connection. Shows a red offline banner at the top of the screen when the user loses connectivity. |

---

### 🔔 `src/services/` — Background Services

| File | Responsibility |
|------|---------------|
| `notifications.ts` | All push notification logic: asking for permission, scheduling a daily reminder at a chosen time, cancelling reminders, and sending test notifications. Automatically disabled inside Expo Go (where notifications are not supported). |

---

### 🎨 `src/theme/` — Visual Design System

| File | Responsibility |
|------|---------------|
| `theme.ts` | The single source of truth for ALL colors, spacing values, border radii, and font sizes in the app. Every UI component gets its styles from here. If you want to change the look of the app, start here. |

---

### 🔧 `src/utils/` — Utility Helpers

| File | Responsibility |
|------|---------------|
| `formatters.ts` | Helper functions for formatting numbers into readable text. `formatMoney()` adds currency signs and 2 decimal places. `formatBigNumber()` converts large numbers to short form (K, M, B, T). |
| `env.ts` | Exports `IS_EXPO_GO` — a boolean that tells the app whether it's running inside the Expo Go test app or a real standalone build. Used to disable features that only work in real builds (like push notifications). |

---

### 📐 `src/types/` — TypeScript Type Definitions

| File | Responsibility |
|------|---------------|
| `coin.ts` | Defines the `CoinMarketItem` type — the exact shape/structure of a coin object as returned by the CoinGecko API. Used throughout the app for type safety. |

---