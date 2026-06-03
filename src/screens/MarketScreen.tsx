// MarketScreen.tsx
// The main "Market" tab screen. Displays the top 50 cryptocurrencies from CoinGecko
// with live search/filter, auto-refresh on a configurable timer, and navigation
// to the CoinDetailsScreen when a user taps on a coin row.

import { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Pressable,
  Image,
} from 'react-native';
// Search bar + "gainers only" toggle — lives in its own component for reuse
import MarketFilters from '../components/MarketFilters';
// Zustand stores — lightweight global state (like Redux, but simpler)
import { useMarketStore } from '../store/marketStore';
import { useSettingsStore } from '../store/settingsStore';
// Shared UI primitives used across all screens for consistent styling
import { Screen, Title, Subtle, Card, Badge, ChangePill, Button } from '../components/ui';
import { theme } from '../theme/theme';
// Utility to format numbers as currency strings (e.g., "$1,234.56")
import { formatMoney } from '../utils/formatters';

// Type-only imports — stripped at build time, used for type-safe navigation
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
// useFocusEffect runs code each time this screen comes into view (and cleans up when it leaves)
import { useFocusEffect, useNavigation } from '@react-navigation/native';

// Narrow the navigation prop so TypeScript knows which routes we can navigate to
type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function MarketScreen() {
  // Hook from React Navigation — gives us .navigate(), .goBack(), etc.
  const navigation = useNavigation<Nav>();

  // --- User preferences from the settings store ---
  const currency = useSettingsStore((s) => s.currency);
  // CoinGecko API expects lowercase "usd" or "eur" as the "vs_currency" param
  const vs = currency === 'EUR' ? 'eur' : 'usd';
  const refreshIntervalMs = useSettingsStore((s) => s.refreshIntervalMs);
  // Symbol shown before prices (e.g., "$" or "€")
  const currencySign = currency === 'EUR' ? '€' : '$';

  // --- Market data from the Zustand market store ---
  const isLoading = useMarketStore((s) => s.isLoading); // true while fetching from API
  const error = useMarketStore((s) => s.error);         // error message string, or null
  const coins = useMarketStore((s) => s.coins);          // full array of top-50 coin objects
  const query = useMarketStore((s) => s.query);          // current search text
  const onlyGainers = useMarketStore((s) => s.onlyGainers); // true = show only coins with positive 24h change
  const lastUpdated = useMarketStore((s) => s.lastUpdated); // timestamp of last successful fetch

  // useFocusEffect: fires every time this tab becomes active.
  // It fetches prices immediately, then sets up an auto-refresh interval.
  // The cleanup function (return) clears the interval when the user leaves this tab.
  useFocusEffect(
    useCallback(() => {
      // Fetch once immediately when the screen gains focus
      void useMarketStore.getState().refresh(vs);

      // Set up a recurring timer to keep prices fresh
      const id = setInterval(() => {
        void useMarketStore.getState().refresh(vs);
      }, refreshIntervalMs);

      // Cleanup: stop the timer when the user navigates away from this tab
      return () => clearInterval(id);
    }, [refreshIntervalMs, vs]),
  );

  // useMemo: re-computes the filtered/sorted list only when coins, query, or onlyGainers change.
  // This avoids re-filtering on every render (e.g., when unrelated state updates).
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    // Step 1: filter by search text AND gainers toggle
    const base = coins.filter((c) => {
      // Match if no search query, or if name/symbol contains the query
      const match =
        q.length === 0 || c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q);

      // Match if gainers filter is off, or if 24h change is positive
      const gain =
        !onlyGainers ||
        (typeof c.price_change_percentage_24h === 'number' && c.price_change_percentage_24h > 0);

      return match && gain;
    });

    // Step 2: if showing only gainers, sort by biggest 24h gain first
    if (onlyGainers) {
      return base
        .slice() // .slice() creates a copy so we don't mutate the original array
        .sort(
          (a, b) =>
            (b.price_change_percentage_24h ?? -Infinity) -
            (a.price_change_percentage_24h ?? -Infinity),
        );
    }

    // Otherwise keep the default CoinGecko order (by market cap rank)
    return base;
  }, [coins, query, onlyGainers]);

  return (
    <Screen>
      {/* Header — title + last-updated timestamp + refresh interval badge */}
      <View style={styles.header}>
        <View>
          <Title>Market</Title>
          <Subtle>
            {lastUpdated ? `Updated ${new Date(lastUpdated).toLocaleTimeString()}` : 'Loading…'} • {currency}
          </Subtle>
        </View>

        {/* Small pill showing the current auto-refresh interval */}
        <View style={styles.refreshBadge}>
          <Text style={styles.refreshText}>🔄 {refreshIntervalMs / 1000}s</Text>
        </View>
      </View>

      {/* Filters — search bar and "gainers only" toggle */}
      <View style={styles.filtersWrap}>
        <MarketFilters />
      </View>

      {/* Conditional rendering: loading spinner → error card → coin list */}
      {isLoading && filtered.length === 0 ? (
        // Show a spinner only on the very first load (when there's no cached data yet)
        <View style={styles.center}>
          <ActivityIndicator color={theme.color.primaryLight} size="large" />
          <Text style={styles.loadingText}>Fetching prices…</Text>
        </View>
      ) : error ? (
        // Error state with a retry button
        <View style={styles.center}>
          <Card style={styles.errorCard}>
            <Text style={styles.errorEmoji}>⚠️</Text>
            <Text style={styles.errorTitle}>{error}</Text>
            <View style={{ marginTop: theme.space.md }}>
              <Button title="Retry" onPress={() => useMarketStore.getState().refresh(vs)} />
            </View>
          </Card>
        </View>
      ) : (
        // Main coin list — FlatList renders only the visible rows for performance
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          refreshing={isLoading}
          onRefresh={() => useMarketStore.getState().refresh(vs)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => {
            // Use the coin's position in the unfiltered list as its rank.
            // Falls back to the filtered index if the coin isn't found (edge case).
            const globalRank = coins.indexOf(item) + 1;
            const rank = globalRank > 0 ? globalRank : index + 1;

            return (
              // Tapping a row navigates to the CoinDetailsScreen for that coin
              <Pressable
                onPress={() => navigation.navigate('CoinDetails', { id: item.id })}
                style={({ pressed }) => [styles.rowPressable, pressed && styles.rowPressed]}
              >
                <Card style={styles.rowCard}>
                  <View style={styles.row}>
                    {/* Rank */}
                    <Badge n={rank} />

                    {/* Coin logo — falls back to a colored circle with the first letter */}
                    {item.image ? (
                      <Image source={{ uri: item.image }} style={styles.coinLogo} />
                    ) : (
                      <View style={styles.coinLogoPlaceholder}>
                        <Text style={styles.coinLogoText}>{item.symbol[0]?.toUpperCase()}</Text>
                      </View>
                    )}

                    {/* Name + price */}
                    <View style={styles.left}>
                      <Text style={styles.coinName}>{item.name}</Text>
                      <Text style={styles.coinSymbol}>{item.symbol.toUpperCase()}</Text>
                    </View>

                    {/* Right: price + 24h change pill (green for up, red for down) */}
                    <View style={styles.right}>
                      <Text style={styles.price}>{formatMoney(item.current_price, currencySign)}</Text>
                      <View style={{ marginTop: 6 }}>
                        <ChangePill value={item.price_change_percentage_24h} />
                      </View>
                    </View>
                  </View>
                </Card>
              </Pressable>
            );
          }}
          // Shown when the filtered list is empty (search/filter matched nothing)
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyEmoji}>🔍</Text>
              <Text style={styles.emptyText}>No coins match your filters</Text>
            </View>
          }
        />
      )}
    </Screen>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  // Top row: title on the left, refresh badge on the right
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: theme.space.lg,
  },

  // Small rounded pill that shows the auto-refresh interval
  refreshBadge: {
    backgroundColor: theme.color.surface2,
    borderWidth: 1,
    borderColor: theme.color.border,
    borderRadius: theme.radius.full,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginTop: 6,
  },
  refreshText: {
    color: theme.color.text3,
    fontSize: theme.font.xs,
    fontWeight: '700',
  },

  filtersWrap: {
    marginBottom: theme.space.md,
  },

  // Centered container used for loading spinner, error, and empty states
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { color: theme.color.text3, fontSize: theme.font.sm, fontWeight: '600' },

  errorCard: { width: '100%', alignItems: 'center' },
  errorEmoji: { fontSize: 36, marginBottom: theme.space.sm },
  errorTitle: { color: theme.color.text, fontWeight: '800', fontSize: theme.font.md, textAlign: 'center' },

  // Extra bottom padding so the last row isn't hidden behind the tab bar
  listContent: { paddingBottom: 100 },

  rowPressable: {},
  // Subtle scale + opacity feedback when the user presses a coin row
  rowPressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },

  rowCard: {
    marginBottom: 10,
    paddingVertical: 14,
    paddingHorizontal: theme.space.md,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  coinLogo: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.full,
    backgroundColor: theme.color.surface2,
  },
  // Placeholder shown when the API doesn't provide an image URL
  coinLogoPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.full,
    backgroundColor: theme.color.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.color.primaryGlow,
  },
  coinLogoText: {
    color: theme.color.primaryLight,
    fontWeight: '900',
    fontSize: theme.font.md,
  },

  // flex: 1 lets the name column stretch to fill remaining space
  left: { flex: 1 },
  coinName: { color: theme.color.text, fontWeight: '800', fontSize: theme.font.md },
  coinSymbol: {
    color: theme.color.text3,
    fontWeight: '700',
    fontSize: theme.font.xs,
    marginTop: 3,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  right: { alignItems: 'flex-end' },
  price: { color: theme.color.text, fontWeight: '900', fontSize: theme.font.md },

  emptyEmoji: { fontSize: 40 },
  emptyText: { color: theme.color.text3, fontWeight: '700', fontSize: theme.font.sm },
});
