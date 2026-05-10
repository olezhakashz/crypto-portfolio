import { View, TextInput, StyleSheet } from 'react-native';
import { useMarketStore } from '../store/marketStore';
import { theme } from '../theme/theme';
import { Segment } from './ui';

export default function MarketFilters() {
  const query = useMarketStore((s) => s.query);
  const onlyGainers = useMarketStore((s) => s.onlyGainers);

  const setQuery = useMarketStore((s) => s.setQuery);
  const setOnlyGainers = useMarketStore((s) => s.setOnlyGainers);

  return (
    <View style={styles.wrap}>
      <TextInput
        placeholder="Search coins…"
        placeholderTextColor={theme.color.text3}
        value={query}
        onChangeText={setQuery}
        style={styles.input}
        returnKeyType="search"
      />

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
