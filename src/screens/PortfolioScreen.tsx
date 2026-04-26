import { useCallback, useEffect, useMemo } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

import { usePortfolioStore } from '../store/portfolioStore';
import { useMarketStore } from '../store/marketStore';
import { useSettingsStore } from '../store/settingsStore';
import { Screen, Card, Title, Subtle, Pill } from '../components/ui';
import { theme } from '../theme/theme';

const REFRESH_INTERVAL_MS = 30_000;

function formatMoney(sign: string, v: number) {
  return `${sign}${v.toFixed(2)}`;
}

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

  const rows = useMemo(() => {
    return items.map((it) => {
      const price = priceMap.get(it.coinId) ?? null;
      const total = price === null ? null : price * it.amount;
      return { ...it, price, total };
    });
  }, [items, priceMap]);

  const portfolioTotal = useMemo(() => {
    return rows.reduce((sum, r) => (r.total === null ? sum : sum + r.total), 0);
  }, [rows]);

  const updatedText = lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : '—';
  const loading = portfolioLoading || (marketLoading && rows.length === 0);

  return (
    <Screen>
      {/* Header (низко и по центру, safe-area уже учтён) */}
      <View style={styles.header}>
        <Title style={styles.headerTitle}>Portfolio</Title>
        <Pill label="Total" value={formatMoney(sign, portfolioTotal)} />
      </View>

      {/* Error */}
      {portfolioError ? (
        <Card style={styles.errorCard}>
          <Text style={styles.errorText}>{portfolioError}</Text>
        </Card>
      ) : null}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      ) : (
        <FlatList
          contentContainerStyle={[styles.listContent, rows.length === 0 ? styles.emptyGrow : null]}
          data={rows}
          keyExtractor={(item) => item.coinId}
          renderItem={({ item }) => {
            const totalText = item.total === null ? '—' : formatMoney(sign, item.total);
            const priceText = item.price === null ? '—' : formatMoney(sign, item.price);

            return (
              <Card style={styles.card}>
                <Pressable
                  onLongPress={async () => {
                    await remove(item.coinId);
                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  }}
                >
                  <View style={styles.cardTop}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.name}>{item.name}</Text>
                      <Text style={styles.meta}>
                        {item.symbol.toUpperCase()} • Amount: {item.amount}
                      </Text>
                      <Text style={styles.meta}>Price: {priceText}</Text>
                    </View>

                    <View style={styles.rightCol}>
                      <Text style={styles.valueStrong}>{totalText}</Text>
                      <Text style={styles.hint}>Long press</Text>
                    </View>
                  </View>
                </Pressable>
              </Card>
            );
          }}
          ListEmptyComponent={
            <Card style={styles.empty}>
              <Text style={styles.emptyTitle}>No coins yet</Text>
              <Text style={styles.emptySub}>
                Open Market → select a coin → add it to your portfolio.
              </Text>
            </Card>
          }
          ListFooterComponent={
            <View style={styles.footerMeta}>
              <Subtle style={{ marginTop: 0 }}>
                Updated: {updatedText} • Auto: {REFRESH_INTERVAL_MS / 1000}s • Currency: {currency}
              </Subtle>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  headerTitle: { textAlign: 'center', flex: 1 },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  listContent: { paddingBottom: 12 },
  emptyGrow: { flexGrow: 1, justifyContent: 'center' },

  card: { marginBottom: 12 },

  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },

  name: { color: theme.color.text, fontSize: 16, fontWeight: '900' },
  meta: { color: theme.color.text2, marginTop: 6, fontWeight: '700' },

  rightCol: { alignItems: 'flex-end' },
  valueStrong: { color: theme.color.text, fontSize: 16, fontWeight: '900' },
  hint: { marginTop: 6, color: theme.color.text3, fontWeight: '800' },

  empty: { alignItems: 'center' },
  emptyTitle: { color: theme.color.text, fontSize: 18, fontWeight: '900' },
  emptySub: { marginTop: 8, color: theme.color.text2, textAlign: 'center', fontWeight: '700' },

  footerMeta: { marginTop: 8, paddingBottom: 8 },

  errorCard: { borderColor: 'rgba(255,0,0,0.25)' },
  errorText: { color: theme.color.text, fontWeight: '900' },
});
