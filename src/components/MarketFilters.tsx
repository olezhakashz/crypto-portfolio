// MarketFilters.tsx
// Search bar and "Gainers Only" toggle displayed at the top of the Market screen.
// Reads from and writes to the Zustand marketStore so filter state is shared
// with the coin list below without prop-drilling.

import { View, TextInput, StyleSheet } from 'react-native';
// Zustand store that holds market data, filters, and their setters
import { useMarketStore } from '../store/marketStore';
import { theme } from '../theme/theme';
// Segment is the two-option toggle from our shared UI library
import { Segment } from './ui';

export default function MarketFilters() {
  // Subscribe to individual store slices — the component only re-renders
  // when the specific value it selects changes, not on every store update.
  const query = useMarketStore((s) => s.query);           // current search text
  const onlyGainers = useMarketStore((s) => s.onlyGainers); // whether "Gainers" filter is active

  // Store actions (setters) — these references are stable across renders
  const setQuery = useMarketStore((s) => s.setQuery);
  const setOnlyGainers = useMarketStore((s) => s.setOnlyGainers);

  return (
    <View style={styles.wrap}>
      {/* Search input — filters the coin list by name or symbol */}
      <TextInput
        placeholder="Search coins…"
        placeholderTextColor={theme.color.text3}
        value={query}
        onChangeText={setQuery}
        style={styles.input}
        returnKeyType="search"
      />

      {/* Two-way toggle: "Top 50" (all coins) vs "📈 Gainers" (positive 24h change only) */}
      <Segment
        left="Top 50"
        right="📈 Gainers"
        value={onlyGainers ? 'right' : 'left'}
        onChange={(v) => setOnlyGainers(v === 'right')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },

  input: {
    borderWidth: 1,
    borderColor: theme.color.border,
    backgroundColor: theme.color.surface2,
    borderRadius: theme.radius.md,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: theme.color.text,
    fontWeight: '700',
    fontSize: theme.font.sm,
  },
});
