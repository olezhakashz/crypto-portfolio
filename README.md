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
