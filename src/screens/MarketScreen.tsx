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
import MarketFilters from '../components/MarketFilters';
import { useMarketStore } from '../store/marketStore';
import { useSettingsStore } from '../store/settingsStore';
import { Screen, Title, Subtle, Card, Badge, ChangePill, Button } from '../components/ui';
import { theme } from '../theme/theme';
import { formatMoney } from '../utils/formatters';

import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function MarketScreen() {
  const navigation = useNavigation<Nav>();

  const currency = useSettingsStore((s) => s.currency);
  const vs = currency === 'EUR' ? 'eur' : 'usd';
  const refreshIntervalMs = useSettingsStore((s) => s.refreshIntervalMs);
  const currencySign = currency === 'EUR' ? '€' : '$';

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

  return (
    <Screen>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Title>Market</Title>
          <Subtle>
            {lastUpdated ? `Updated ${new Date(lastUpdated).toLocaleTimeString()}` : 'Loading…'} • {currency}
          </Subtle>
        </View>

        <View style={styles.refreshBadge}>
          <Text style={styles.refreshText}>🔄 {refreshIntervalMs / 1000}s</Text>
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filtersWrap}>
        <MarketFilters />
      </View>

      {/* List */}
      {isLoading && filtered.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator color={theme.color.primaryLight} size="large" />
          <Text style={styles.loadingText}>Fetching prices…</Text>
        </View>
      ) : error ? (
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
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          refreshing={isLoading}
          onRefresh={() => useMarketStore.getState().refresh(vs)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => {
            const globalRank = coins.indexOf(item) + 1;
            const rank = globalRank > 0 ? globalRank : index + 1;

            return (
              <Pressable
                onPress={() => navigation.navigate('CoinDetails', { id: item.id })}
                style={({ pressed }) => [styles.rowPressable, pressed && styles.rowPressed]}
              >
                <Card style={styles.rowCard}>
                  <View style={styles.row}>
                    {/* Rank */}
                    <Badge n={rank} />

                    {/* Coin logo */}
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

                    {/* Right: price + change */}
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

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: theme.space.lg,
  },

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

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { color: theme.color.text3, fontSize: theme.font.sm, fontWeight: '600' },

  errorCard: { width: '100%', alignItems: 'center' },
  errorEmoji: { fontSize: 36, marginBottom: theme.space.sm },
  errorTitle: { color: theme.color.text, fontWeight: '800', fontSize: theme.font.md, textAlign: 'center' },

  listContent: { paddingBottom: 100 },

  rowPressable: {},
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
