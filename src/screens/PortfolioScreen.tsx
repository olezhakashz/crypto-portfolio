import { useCallback, useEffect, useMemo } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

import { usePortfolioStore } from '../store/portfolioStore';
import { useMarketStore } from '../store/marketStore';
import { useSettingsStore } from '../store/settingsStore';
import { Screen, Card, Title, Subtle, ChangePill } from '../components/ui';
import { theme } from '../theme/theme';
import { formatMoney, formatBigNumber } from '../utils/formatters';

const REFRESH_INTERVAL_MS = 30_000;

export default function PortfolioScreen() {
  const currency = useSettingsStore((s) => s.currency);
  const sign = currency === 'EUR' ? '€' : '$';

  const items = usePortfolioStore((s) => s.items);
  const loadPortfolio = usePortfolioStore((s) => s.load);
  const remove = usePortfolioStore((s) => s.remove);
  const portfolioLoading = usePortfolioStore((s) => s.isLoading);
  const portfolioError = usePortfolioStore((s) => s.error);

  const marketCoins = useMarketStore((s) => s.coins);
  const marketLoading = useMarketStore((s) => s.isLoading);
  const lastUpdated = useMarketStore((s) => s.lastUpdated);

  useEffect(() => {
    void loadPortfolio();
  }, [loadPortfolio]);

  useFocusEffect(
    useCallback(() => {
      void useMarketStore.getState().refresh(currency === 'EUR' ? 'eur' : 'usd');

      const id = setInterval(() => {
        void useMarketStore.getState().refresh(currency === 'EUR' ? 'eur' : 'usd');
      }, REFRESH_INTERVAL_MS);

      return () => clearInterval(id);
    }, [currency]),
  );

  const priceMap = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of marketCoins) m.set(c.id, c.current_price);
    return m;
  }, [marketCoins]);

  const changeMap = useMemo(() => {
    const m = new Map<string, number | null>();
    for (const c of marketCoins) m.set(c.id, c.price_change_percentage_24h);
    return m;
  }, [marketCoins]);

  const rows = useMemo(() => {
    return items.map((it) => {
      const price = priceMap.get(it.coinId) ?? null;
      const total = price === null ? null : price * it.amount;
      const change = changeMap.get(it.coinId) ?? null;
      return { ...it, price, total, change };
    });
  }, [items, priceMap, changeMap]);

  const portfolioTotal = useMemo(() => {
    return rows.reduce((sum, r) => (r.total === null ? sum : sum + r.total), 0);
  }, [rows]);

  const loading = portfolioLoading || (marketLoading && rows.length === 0);
  const updatedText = lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : '—';

  return (
    <Screen>
      {/* Header */}
      <View style={styles.headerRow}>
        <Title>Portfolio</Title>
        <Subtle>{updatedText} • {currency}</Subtle>
      </View>

      {/* Total Value Hero */}
      <Card glow={portfolioTotal > 0 ? 'primary' : undefined} style={styles.heroCard}>
        <Text style={styles.heroLabel}>TOTAL VALUE</Text>
        <Text style={styles.heroValue}>{formatBigNumber(portfolioTotal, sign)}</Text>
        <Text style={styles.heroSub}>
          {items.length} asset{items.length !== 1 ? 's' : ''} • auto-refreshes every {REFRESH_INTERVAL_MS / 1000}s
        </Text>
      </Card>

      {/* Error */}
      {portfolioError ? (
        <Card style={styles.errorCard}>
          <Text style={styles.errorText}>⚠️ {portfolioError}</Text>
        </Card>
      ) : null}

      {/* List */}
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
            const totalText = item.total === null ? '—' : formatMoney(item.total, sign);
            const priceText = item.price === null ? '—' : formatMoney(item.price, sign);

            return (
              <Pressable
                onLongPress={async () => {
                  await remove(item.coinId);
                  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }}
                style={({ pressed }) => [styles.rowPressable, pressed && styles.rowPressed]}
              >
                <Card style={styles.card}>
                  <View style={styles.cardTop}>
                    {/* Coin avatar letter */}
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{item.symbol[0]?.toUpperCase()}</Text>
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={styles.name}>{item.name}</Text>
                      <Text style={styles.meta}>
                        {item.symbol.toUpperCase()} · {item.amount} coins · {priceText} each
                      </Text>
                    </View>

                    <View style={styles.rightCol}>
                      <Text style={styles.valueStrong}>{totalText}</Text>
                      <View style={{ marginTop: 6 }}>
                        <ChangePill value={item.change} />
                      </View>
                    </View>
                  </View>

                  <Text style={styles.hint}>Long-press to remove</Text>
                </Card>
              </Pressable>
            );
          }}
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

const styles = StyleSheet.create({
  headerRow: {
    marginBottom: theme.space.lg,
  },

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
    letterSpacing: -1,
    marginTop: 8,
  },
  heroSub: {
    marginTop: 8,
    color: theme.color.text3,
    fontSize: theme.font.xs,
    fontWeight: '600',
  },

  errorCard: { borderColor: 'rgba(244,63,94,0.3)', marginBottom: theme.space.md },
  errorText: { color: theme.color.danger, fontWeight: '800' },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  listContent: { paddingBottom: 100 },
  emptyGrow: { flexGrow: 1, justifyContent: 'center' },

  rowPressable: {},
  rowPressed: { opacity: 0.8, transform: [{ scale: 0.99 }] },

  card: { marginBottom: 10 },

  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },

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

  name: { color: theme.color.text, fontSize: theme.font.md, fontWeight: '800' },
  meta: { color: theme.color.text3, marginTop: 4, fontWeight: '600', fontSize: theme.font.xs },

  rightCol: { alignItems: 'flex-end' },
  valueStrong: { color: theme.color.text, fontSize: theme.font.md, fontWeight: '900' },

  hint: {
    marginTop: theme.space.sm,
    color: theme.color.text3,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.3,
  },

  emptyCard: { alignItems: 'center', paddingVertical: theme.space.xl },
  emptyEmoji: { fontSize: 48, marginBottom: theme.space.md },
  emptyTitle: { color: theme.color.text, fontSize: theme.font.xl, fontWeight: '900' },
  emptySub: { marginTop: 8, color: theme.color.text2, textAlign: 'center', fontWeight: '600', fontSize: theme.font.sm },
});
