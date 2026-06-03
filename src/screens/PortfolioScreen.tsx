// PortfolioScreen.tsx
// The "Portfolio" tab screen — shows the coins the user has saved along with
// their current value calculated from live market prices.
//
// Key features:
//   • Loads saved portfolio items from device storage (AsyncStorage)
//   • Fetches live prices from CoinGecko and multiplies by the user's held amount
//   • Displays a "hero" card with the total portfolio value
//   • Long-press any row to remove it (with haptic feedback)
//   • Auto-refreshes prices every 30 seconds while the screen is focused

import { useCallback, useEffect, useMemo } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
// useFocusEffect: runs code every time this tab becomes active (and cleans up when it leaves)
import { useFocusEffect } from '@react-navigation/native';
// Haptics: provides physical vibration feedback when removing a coin
import * as Haptics from 'expo-haptics';

// Zustand stores — global state shared between all screens
import { usePortfolioStore } from '../store/portfolioStore';   // User's saved coins (amounts)
import { useMarketStore } from '../store/marketStore';         // Live market prices from CoinGecko
import { useSettingsStore } from '../store/settingsStore';     // User preferences (currency, etc.)
// Shared UI components for consistent design across the app
import { Screen, Card, Title, Subtle, ChangePill } from '../components/ui';
import { theme } from '../theme/theme'; // Design tokens (colors, spacing, fonts)
// Utility functions to format numbers for display
import { formatMoney, formatBigNumber } from '../utils/formatters';

// How often (in milliseconds) live prices refresh on this screen — 30 seconds
const REFRESH_INTERVAL_MS = 30_000;

export default function PortfolioScreen() {
  // --- Read user's preferred display currency (USD or EUR) ---
  const currency = useSettingsStore((s) => s.currency);
  const sign = currency === 'EUR' ? '€' : '$'; // Currency symbol for formatting

  // --- Portfolio store: the user's saved coin holdings ---
  const items = usePortfolioStore((s) => s.items);              // Array of saved coins (coinId, amount, etc.)
  const loadPortfolio = usePortfolioStore((s) => s.load);       // Action: load portfolio from device storage
  const remove = usePortfolioStore((s) => s.remove);            // Action: remove a coin by its ID
  const portfolioLoading = usePortfolioStore((s) => s.isLoading); // True while reading from storage
  const portfolioError = usePortfolioStore((s) => s.error);       // Error message, or null

  // --- Market store: live prices for all top-50 coins ---
  const marketCoins = useMarketStore((s) => s.coins);          // Full array of coin objects with prices
  const marketLoading = useMarketStore((s) => s.isLoading);    // True while fetching from CoinGecko
  const lastUpdated = useMarketStore((s) => s.lastUpdated);    // Timestamp of last successful price fetch

  // Load saved portfolio from AsyncStorage when the component first mounts
  useEffect(() => {
    void loadPortfolio();
  }, [loadPortfolio]);

  // Refresh live prices every time this tab comes into view, then auto-refresh on a timer.
  // The cleanup function clears the interval when the user navigates away from this tab.
  useFocusEffect(
    useCallback(() => {
      // Fetch prices immediately when the screen gains focus
      void useMarketStore.getState().refresh(currency === 'EUR' ? 'eur' : 'usd');

      // Set up a recurring timer to keep prices fresh
      const id = setInterval(() => {
        void useMarketStore.getState().refresh(currency === 'EUR' ? 'eur' : 'usd');
      }, REFRESH_INTERVAL_MS);

      // Cleanup: stop the timer when the user leaves this tab
      return () => clearInterval(id);
    }, [currency]),
  );

  // Build a fast-lookup Map from coinId → current price.
  // Recalculated only when marketCoins changes (memoized for performance).
  const priceMap = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of marketCoins) m.set(c.id, c.current_price);
    return m;
  }, [marketCoins]);

  // Build a fast-lookup Map from coinId → 24h price change percentage.
  const changeMap = useMemo(() => {
    const m = new Map<string, number | null>();
    for (const c of marketCoins) m.set(c.id, c.price_change_percentage_24h);
    return m;
  }, [marketCoins]);

  // Merge portfolio items with live price data to create displayable rows.
  // Each row has: all portfolio fields + price, total value, and 24h change.
  const rows = useMemo(() => {
    return items.map((it) => {
      const price = priceMap.get(it.coinId) ?? null;           // Current price, or null if not found
      const total = price === null ? null : price * it.amount; // Total value = price × amount held
      const change = changeMap.get(it.coinId) ?? null;         // 24h change %, or null
      return { ...it, price, total, change };
    });
  }, [items, priceMap, changeMap]);

  // Calculate the total portfolio value by summing all individual coin totals.
  // Coins without a price (null) are skipped — they don't affect the sum.
  const portfolioTotal = useMemo(() => {
    return rows.reduce((sum, r) => (r.total === null ? sum : sum + r.total), 0);
  }, [rows]);

  // Show a loading spinner only on the very first load (when portfolio + market data aren't ready yet)
  const loading = portfolioLoading || (marketLoading && rows.length === 0);
  // Format the "last updated" timestamp for display in the header
  const updatedText = lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : '—';

  return (
    <Screen>
      {/* Header — title and last-updated timestamp */}
      <View style={styles.headerRow}>
        <Title>Portfolio</Title>
        <Subtle>{updatedText} • {currency}</Subtle>
      </View>

      {/* Hero card — shows the total portfolio value with a glowing border when > $0 */}
      <Card glow={portfolioTotal > 0 ? 'primary' : undefined} style={styles.heroCard}>
        <Text style={styles.heroLabel}>TOTAL VALUE</Text>
        <Text style={styles.heroValue}>{formatBigNumber(portfolioTotal, sign)}</Text>
        <Text style={styles.heroSub}>
          {items.length} asset{items.length !== 1 ? 's' : ''} • auto-refreshes every {REFRESH_INTERVAL_MS / 1000}s
        </Text>
      </Card>

      {/* Error banner — shown only when the portfolio store reports an error */}
      {portfolioError ? (
        <Card style={styles.errorCard}>
          <Text style={styles.errorText}>⚠️ {portfolioError}</Text>
        </Card>
      ) : null}

      {/* Main content: loading spinner OR the list of portfolio items */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={theme.color.primaryLight} size="large" />
        </View>
      ) : (
        <FlatList
          contentContainerStyle={[styles.listContent, rows.length === 0 ? styles.emptyGrow : null]}
          data={rows}
          keyExtractor={(item) => item.coinId}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            // Format the total value and per-coin price for display
            const totalText = item.total === null ? '—' : formatMoney(item.total, sign);
            const priceText = item.price === null ? '—' : formatMoney(item.price, sign);

            return (
              <Pressable
                // Long-press to remove the coin from the portfolio (with haptic vibration)
                onLongPress={async () => {
                  await remove(item.coinId);
                  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }}
                // Slight opacity + scale change when pressed for tactile feedback
                style={({ pressed }) => [styles.rowPressable, pressed && styles.rowPressed]}
              >
                <Card style={styles.card}>
                  <View style={styles.cardTop}>
                    {/* Coin avatar — shows the first letter of the coin's ticker symbol */}
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{item.symbol[0]?.toUpperCase()}</Text>
                    </View>

                    {/* Coin info: name, symbol, amount held, and per-coin price */}
                    <View style={{ flex: 1 }}>
                      <Text style={styles.name}>{item.name}</Text>
                      <Text style={styles.meta}>
                        {item.symbol.toUpperCase()} · {item.amount} coins · {priceText} each
                      </Text>
                    </View>

                    {/* Right column: total value and 24h change pill (green/red) */}
                    <View style={styles.rightCol}>
                      <Text style={styles.valueStrong}>{totalText}</Text>
                      <View style={{ marginTop: 6 }}>
                        <ChangePill value={item.change} />
                      </View>
                    </View>
                  </View>

                  {/* Hint text below the card content */}
                  <Text style={styles.hint}>Long-press to remove</Text>
                </Card>
              </Pressable>
            );
          }}
          // Shown when the portfolio is empty — guides the user to add coins
          ListEmptyComponent={
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyEmoji}>💎</Text>
              <Text style={styles.emptyTitle}>No coins yet</Text>
              <Text style={styles.emptySub}>
                Open Market → select a coin → add it to your portfolio.
              </Text>
            </Card>
          }
        />
      )}
    </Screen>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  headerRow: {
    marginBottom: theme.space.lg,
  },

  // Hero card — large centered display of total portfolio value
  heroCard: {
    marginBottom: theme.space.lg,
    paddingVertical: theme.space.xl,
    alignItems: 'center',
  },
  heroLabel: {
    color: theme.color.text3,
    fontSize: theme.font.xs,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  heroValue: {
    color: theme.color.text,
    fontSize: 40,
    fontWeight: '900',
    letterSpacing: -1, // Tighter tracking at large sizes looks better
    marginTop: 8,
  },
  heroSub: {
    marginTop: 8,
    color: theme.color.text3,
    fontSize: theme.font.xs,
    fontWeight: '600',
  },

  // Error banner styles
  errorCard: { borderColor: 'rgba(244,63,94,0.3)', marginBottom: theme.space.md },
  errorText: { color: theme.color.danger, fontWeight: '800' },

  // Centered container for the loading spinner
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Extra bottom padding so the last row isn't hidden behind the floating tab bar
  listContent: { paddingBottom: 100 },
  // When the list is empty, grow to fill space so the empty card is centered
  emptyGrow: { flexGrow: 1, justifyContent: 'center' },

  // Press feedback for coin rows
  rowPressable: {},
  rowPressed: { opacity: 0.8, transform: [{ scale: 0.99 }] },

  card: { marginBottom: 10 },

  // Layout for the top portion of each coin card (avatar + info + value)
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },

  // Circular avatar with the coin's first letter
  avatar: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.full,
    backgroundColor: theme.color.accentSoft,
    borderWidth: 1,
    borderColor: theme.color.primaryGlow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: theme.color.primaryLight,
    fontWeight: '900',
    fontSize: theme.font.lg,
  },

  // Coin name and metadata text
  name: { color: theme.color.text, fontSize: theme.font.md, fontWeight: '800' },
  meta: { color: theme.color.text3, marginTop: 4, fontWeight: '600', fontSize: theme.font.xs },

  // Right-aligned column for the total value and change pill
  rightCol: { alignItems: 'flex-end' },
  valueStrong: { color: theme.color.text, fontSize: theme.font.md, fontWeight: '900' },

  // Small "long-press to remove" hint text
  hint: {
    marginTop: theme.space.sm,
    color: theme.color.text3,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.3,
  },

  // Empty state card when the portfolio has no coins
  emptyCard: { alignItems: 'center', paddingVertical: theme.space.xl },
  emptyEmoji: { fontSize: 48, marginBottom: theme.space.md },
  emptyTitle: { color: theme.color.text, fontSize: theme.font.xl, fontWeight: '900' },
  emptySub: { marginTop: 8, color: theme.color.text2, textAlign: 'center', fontWeight: '600', fontSize: theme.font.sm },
});
