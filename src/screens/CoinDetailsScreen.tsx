// CoinDetailsScreen.tsx
// Full-screen detail view for a single cryptocurrency.
// Opened when the user taps a coin row in the Market screen.
//
// Key features:
//   • Shows the coin's logo, name, symbol, current price, 24h change, and market cap
//   • Lets the user enter an amount and add the coin to their portfolio
//   • Calculates an estimated portfolio value as the user types
//   • Uses haptic feedback and a toast notification on successful save
//   • Reads coin data directly from the market store — no extra API call needed

import { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  Pressable,
  ScrollView,
} from 'react-native';
// RouteProp: gives us access to the route.params for this screen (contains the coin's id)
import type { RouteProp } from '@react-navigation/native';
// useNavigation: hook that gives us .navigate(), .goBack(), etc.
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
// Haptics: provides physical vibration feedback on save success
import * as Haptics from 'expo-haptics';

// Toast: shows temporary popup messages (e.g., "Saved" or "Invalid amount")
import { useToast } from '../components/Toast';
// Navigation type definitions — ensures type-safe navigation
import type { RootStackParamList } from '../navigation/types';
// Zustand stores — global state shared between all screens
import { useMarketStore } from '../store/marketStore';         // Live market prices
import { usePortfolioStore } from '../store/portfolioStore';   // User's saved coin holdings
import { useSettingsStore } from '../store/settingsStore';     // User preferences (currency)
import { theme } from '../theme/theme'; // Design tokens (colors, spacing, fonts)
// Shared UI components for consistent design
import { Button, Card, Screen, Subtle, ChangePill } from '../components/ui';
// Utility functions to format numbers for display
import { formatMoney, formatBigNumber } from '../utils/formatters';

// TypeScript: narrow the route prop to only accept params for the "CoinDetails" screen
type Route = RouteProp<RootStackParamList, 'CoinDetails'>;
// TypeScript: narrow the navigation prop so TypeScript knows which routes we can navigate to
type Nav = NativeStackNavigationProp<RootStackParamList, 'CoinDetails'>;

export default function CoinDetailsScreen({ route }: { route: Route }) {
  const navigation = useNavigation<Nav>();
  // Extract the coin's CoinGecko ID from the navigation params (e.g., "bitcoin")
  const { id } = route.params;

  // Read the user's preferred display currency from settings
  const currency = useSettingsStore((s) => s.currency);
  const currencySign = currency === 'EUR' ? '€' : '$';

  // Portfolio store action: adds a new coin or updates an existing one
  const addOrUpdate = usePortfolioStore((s) => s.addOrUpdate);
  // Toast API: shows success/error popup messages
  const toast = useToast();

  // Read the coin data directly from the market store — no extra API call needed!
  // The market list already has everything we need: price, market cap, 24h change, image.
  const coin = useMarketStore((s) => s.coins.find((c) => c.id === id));

  // Local state: the amount the user types into the "Add to Portfolio" input field
  const [amount, setAmount] = useState('1');

  // Parse the user's input into a number.
  // Handles both "." and "," as decimal separators (common in European locales).
  const parsedAmount = useMemo(() => {
    const normalized = amount.replace(',', '.').trim();
    const n = Number(normalized);
    return Number.isFinite(n) ? n : NaN; // Return NaN if input is not a valid number
  }, [amount]);

  // Handler: saves the coin to the user's portfolio
  const onSavePortfolio = async () => {
    if (!coin) return; // Safety check — shouldn't happen but prevents crashes

    // Validate the entered amount — must be a positive number
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      toast.error('Invalid amount', 'Enter a number > 0 (e.g., 1 or 0.5)');
      return;
    }

    // Add or update the coin in the portfolio store (also persists to AsyncStorage)
    await addOrUpdate({
      coinId: coin.id,
      symbol: coin.symbol,
      name: coin.name,
      amount: parsedAmount,
    });

    // Provide haptic + visual feedback that the save was successful
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    toast.success('Saved', `${coin.name} added to portfolio`);
  };

  // If the coin isn't found in the market store, show a friendly error instead of crashing.
  // This can happen if the user navigates here with a stale ID or the market hasn't loaded yet.
  if (!coin) {
    return (
      <Screen style={styles.center}>
        <Card style={styles.errorCard}>
          <Text style={styles.errorEmoji}>⚠️</Text>
          <Text style={styles.errTitle}>Coin not found</Text>
          <Text style={styles.errText}>Go back to Market and try again.</Text>

          <View style={{ marginTop: theme.space.lg, gap: theme.space.sm }}>
            <Button title="Go Back" onPress={() => navigation.goBack()} />
          </View>
        </Card>
      </Screen>
    );
  }

  // Extract the values we need for display
  const price = coin.current_price;                  // Current price in the selected currency
  const change = coin.price_change_percentage_24h;   // 24h change percentage (can be null)
  const cap = coin.market_cap;                       // Total market capitalization

  // Calculate the estimated value of the user's entered amount (price × amount)
  // Only shown when the user has entered a valid, positive number
  const estimatedValue =
    Number.isFinite(parsedAmount) && parsedAmount > 0
      ? formatMoney(price * parsedAmount, currencySign)
      : null;

  return (
    <Screen style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Back button — navigates back to the Market screen */}
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={14} // Increases the tappable area by 14px on each side (accessibility)
          style={({ pressed }) => [styles.backBtn, pressed && styles.backPressed]}
        >
          <Text style={styles.backIcon}>‹</Text>
          <Text style={styles.backText}>Back</Text>
        </Pressable>

        {/* Hero card — main coin info: logo, name, symbol, price, change, market cap */}
        <Card style={styles.hero}>
          {/* Top row: coin logo + name/symbol on the left, price on the right */}
          <View style={styles.heroTop}>
            <Image source={{ uri: coin.image }} style={styles.logo} />
            <View style={{ flex: 1 }}>
              <Text style={styles.heroName}>{coin.name}</Text>
              <Text style={styles.heroSymbol}>{coin.symbol.toUpperCase()} · {currency}</Text>
            </View>
            <View style={styles.priceBlock}>
              <Text style={styles.priceLabel}>PRICE</Text>
              <Text style={styles.priceValue}>{formatMoney(price, currencySign)}</Text>
            </View>
          </View>

          {/* Horizontal divider between the identity row and the stats row */}
          <View style={styles.divider} />

          {/* Stats row: 24h change (left) | market cap (right), separated by a vertical border */}
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>24H CHANGE</Text>
              <View style={{ marginTop: 8 }}>
                <ChangePill value={change} />
              </View>
            </View>

            <View style={[styles.stat, styles.statBorder]}>
              <Text style={styles.statLabel}>MARKET CAP</Text>
              <Text style={styles.statValue}>{formatBigNumber(cap, currencySign)}</Text>
            </View>
          </View>
        </Card>

        {/* Add to Portfolio card — input field + save button */}
        <Card style={styles.addCard}>
          <Text style={styles.sectionTitle}>Add to Portfolio</Text>
          <Text style={styles.sectionSub}>Enter how many {coin.symbol.toUpperCase()} you hold.</Text>

          {/* Numeric input — accepts decimal numbers (both "." and "," separators) */}
          <TextInput
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            placeholder="Amount (e.g., 1 or 0.5)"
            placeholderTextColor={theme.color.text3}
            style={styles.input}
          />

          {/* Live estimated value preview — updates as the user types */}
          {estimatedValue ? (
            <View style={styles.estimateRow}>
              <Text style={styles.estimateLabel}>Estimated value</Text>
              <Text style={styles.estimateValue}>{estimatedValue}</Text>
            </View>
          ) : null}

          {/* Save button — adds or updates the coin in the portfolio */}
          <View style={{ marginTop: theme.space.lg }}>
            <Button title={`Add ${coin.name} to Portfolio`} onPress={() => void onSavePortfolio()} />
          </View>

          {/* Helpful hint about how to remove coins later */}
          <Subtle style={{ marginTop: theme.space.sm, textAlign: 'center' }}>
            Long-press any item in Portfolio tab to remove it.
          </Subtle>
        </Card>
      </ScrollView>
    </Screen>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { paddingTop: theme.space.md },
  center: { justifyContent: 'center', alignItems: 'center', gap: 12 },
  scroll: { paddingBottom: 100, gap: theme.space.md }, // Extra bottom padding for floating tab bar

  // Back button — pill-shaped with an accent border
  backBtn: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: theme.color.borderStrong,
    backgroundColor: theme.color.accentSoft,
  },
  backPressed: { opacity: 0.75, transform: [{ scale: 0.97 }] },
  backIcon: { color: theme.color.primaryLight, fontSize: 22, fontWeight: '900', lineHeight: 22, marginTop: -1 },
  backText: { color: theme.color.primaryLight, fontSize: theme.font.sm, fontWeight: '800', letterSpacing: 0.2 },

  // Error state (coin not found)
  errorCard: { width: '100%', alignItems: 'center' },
  errorEmoji: { fontSize: 40, marginBottom: theme.space.md },
  errTitle: { color: theme.color.text, fontWeight: '900', fontSize: theme.font.lg },
  errText: { color: theme.color.text2, marginTop: 6, textAlign: 'center' },

  // Hero card layout
  hero: { padding: theme.space.lg },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: theme.space.md },
  logo: {
    width: 56,
    height: 56,
    borderRadius: theme.radius.full,
    backgroundColor: theme.color.surface2,
  },
  heroName: { color: theme.color.text, fontSize: theme.font.lg, fontWeight: '900' },
  heroSymbol: { marginTop: 4, color: theme.color.text3, fontWeight: '700', fontSize: theme.font.xs, letterSpacing: 0.5 },

  // Price display (right-aligned in the hero)
  priceBlock: { alignItems: 'flex-end' },
  priceLabel: { color: theme.color.text3, fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  priceValue: { marginTop: 4, color: theme.color.text, fontSize: theme.font.lg, fontWeight: '900' },

  // Thin horizontal line between hero sections
  divider: { height: 1, backgroundColor: theme.color.border, marginVertical: theme.space.md },

  // Stats row (24h change + market cap side by side)
  statsRow: { flexDirection: 'row' },
  stat: { flex: 1, paddingRight: theme.space.md },
  statBorder: {
    paddingLeft: theme.space.md,
    paddingRight: 0,
    borderLeftWidth: 1,
    borderLeftColor: theme.color.border,
  },
  statLabel: { color: theme.color.text3, fontWeight: '700', fontSize: 10, letterSpacing: 1 },
  statValue: { marginTop: 8, color: theme.color.text, fontWeight: '900', fontSize: theme.font.md },

  // "Add to Portfolio" card
  addCard: { gap: 0 },
  sectionTitle: { color: theme.color.text, fontWeight: '900', fontSize: theme.font.lg },
  sectionSub: { marginTop: 6, color: theme.color.text3, fontWeight: '600', fontSize: theme.font.sm },

  // Amount input field
  input: {
    marginTop: theme.space.md,
    borderWidth: 1,
    borderColor: theme.color.borderStrong,
    backgroundColor: theme.color.surface2,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.space.lg,
    paddingVertical: 14,
    color: theme.color.text,
    fontWeight: '800',
    fontSize: theme.font.md,
  },

  // Estimated value preview row
  estimateRow: {
    marginTop: theme.space.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  estimateLabel: { color: theme.color.text3, fontSize: theme.font.xs, fontWeight: '600' },
  estimateValue: { color: theme.color.primaryLight, fontSize: theme.font.md, fontWeight: '900' },
});
