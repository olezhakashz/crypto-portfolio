import { useCallback, useMemo } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, Pressable } from 'react-native';
import MarketFilters from '../components/MarketFilters';
import { useMarketStore } from '../store/marketStore';
import { useSettingsStore } from '../store/settingsStore';
import { Screen, Title, Subtle, Card } from '../components/ui';
import { theme } from '../theme/theme';

import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function MarketScreen() {
  const navigation = useNavigation<Nav>();

  const currency = useSettingsStore((s) => s.currency);
  const vs = currency === 'EUR' ? 'eur' : 'usd';
  const refreshIntervalMs = useSettingsStore((s) => s.refreshIntervalMs);

  const isLoading = useMarketStore((s) => s.isLoading);
  const error = useMarketStore((s) => s.error);

  const coins = useMarketStore((s) => s.coins);
  const query = useMarketStore((s) => s.query);
  const onlyGainers = useMarketStore((s) => s.onlyGainers);
  const lastUpdated = useMarketStore((s) => s.lastUpdated);

  useFocusEffect(
    useCallback(() => {
      void useMarketStore.getState().refresh(vs);

      const id = setInterval(() => {
        void useMarketStore.getState().refresh(vs);
      }, refreshIntervalMs);

      return () => clearInterval(id);
    }, [refreshIntervalMs, vs]),
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    const base = coins.filter((c) => {
      const match =
        q.length === 0 || c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q);

      const gain =
        !onlyGainers ||
        (typeof c.price_change_percentage_24h === 'number' && c.price_change_percentage_24h > 0);

      return match && gain;
    });

    if (onlyGainers) {
      return base
        .slice()
        .sort(
          (a, b) =>
            (b.price_change_percentage_24h ?? -Infinity) -
            (a.price_change_percentage_24h ?? -Infinity),
        );
    }

    return base;
  }, [coins, query, onlyGainers]);

  const currencySign = currency === 'EUR' ? '€' : '$';

  return (
    <Screen>
      <View style={styles.header}>
        <Title>Market</Title>
      </View>

      <Subtle style={{ marginTop: 6 }}>
        Updated: {lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : '—'} • Auto:{' '}
        {refreshIntervalMs / 1000}s • Currency: {currency}
      </Subtle>

      {/* Убираем странный разрыв: фильтры сразу под meta */}
      <View style={{ marginTop: 14 }}>
        <MarketFilters />
      </View>

      <View style={{ height: 12 }} />

      {isLoading && filtered.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={{ color: theme.color.text, fontWeight: '800' }}>{error}</Text>
          <Pressable style={styles.retry} onPress={() => useMarketStore.getState().refresh(vs)}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          refreshing={isLoading}
          onRefresh={() => useMarketStore.getState().refresh(vs)}
          contentContainerStyle={{ paddingBottom: 8 }}
          renderItem={({ item, index }) => {
            const change = item.price_change_percentage_24h;
            const isUp = typeof change === 'number' && change > 0;
            const isDown = typeof change === 'number' && change < 0;

            const changeText = typeof change === 'number' ? `${change.toFixed(2)}%` : '—';

            return (
              <Pressable onPress={() => navigation.navigate('CoinDetails', { id: item.id })}>
                <Card style={styles.rowCard}>
                  <View style={styles.row}>
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{index + 1}</Text>
                    </View>

                    <View style={styles.left}>
                      <Text style={styles.title}>
                        {item.name} <Text style={styles.symbol}> {item.symbol.toUpperCase()}</Text>
                      </Text>
                      <Text style={styles.sub}>
                        {currencySign}
                        {item.current_price}
                      </Text>
                    </View>

                    <View style={styles.right}>
                      <Text
                        style={[
                          styles.change,
                          isUp && styles.changeUp,
                          isDown && styles.changeDown,
                        ]}
                      >
                        {changeText}
                      </Text>
                      <Text style={styles.tap}>Tap</Text>
                    </View>
                  </View>
                </Card>
              </Pressable>
            );
          }}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'flex-start' },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  rowCard: { marginBottom: 12, paddingVertical: 14 },

  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },

  badge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.color.surface2,
    borderWidth: 1,
    borderColor: theme.color.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: theme.color.text, fontWeight: '900' },

  left: { flex: 1 },
  title: { color: theme.color.text, fontWeight: '900', fontSize: 16 },
  symbol: { color: theme.color.text2, fontWeight: '900' },
  sub: { color: theme.color.text2, marginTop: 6, fontSize: 12, fontWeight: '800' },

  right: { alignItems: 'flex-end' },
  change: { color: theme.color.text, fontWeight: '900', fontSize: 16 },
  changeUp: { color: '#34D399' },
  changeDown: { color: '#FB7185' },
  tap: { marginTop: 6, color: theme.color.text3, fontWeight: '800' },

  retry: {
    marginTop: 10,
    backgroundColor: theme.color.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: theme.radius.lg,
  },
  retryText: { color: theme.color.onPrimary, fontWeight: '900' },
});
