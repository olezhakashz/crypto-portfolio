import { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  Image,
  TextInput,
  Pressable,
} from 'react-native';
import type { RouteProp } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';

import { useToast } from '../components/Toast';
import type { RootStackParamList } from '../navigation/types';
import { fetchCoinDetails, type CoinDetails } from '../api/coingecko';
import { usePortfolioStore } from '../store/portfolioStore';
import { useSettingsStore } from '../store/settingsStore';
import { theme } from '../theme/theme';
import { Button, Card, Screen, Subtle } from '../components/ui';

type Route = RouteProp<RootStackParamList, 'CoinDetails'>;
type Nav = NativeStackNavigationProp<RootStackParamList, 'CoinDetails'>;

function formatMoney(v: number, sign: string) {
  return `${sign}${v.toFixed(2)}`;
}

function formatBigNumber(v: number, sign: string) {
  if (!Number.isFinite(v)) return '—';
  const abs = Math.abs(v);

  if (abs >= 1_000_000_000_000) return `${sign}${(v / 1_000_000_000_000).toFixed(2)}T`;
  if (abs >= 1_000_000_000) return `${sign}${(v / 1_000_000_000).toFixed(2)}B`;
  if (abs >= 1_000_000) return `${sign}${(v / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `${sign}${(v / 1_000).toFixed(2)}K`;
  return `${sign}${v.toFixed(0)}`;
}

export default function CoinDetailsScreen({ route }: { route: Route }) {
  const navigation = useNavigation<Nav>();
  const { id } = route.params;

  const currency = useSettingsStore((s) => s.currency);
  const vs = currency === 'EUR' ? 'eur' : 'usd';
  const currencySign = currency === 'EUR' ? '€' : '$';

  const addOrUpdate = usePortfolioStore((s) => s.addOrUpdate);
  const toast = useToast();

  const [data, setData] = useState<CoinDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [amount, setAmount] = useState('1');

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const d = await fetchCoinDetails(id);
      setData(d);
    } catch {
      setError('Failed to load details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const d = await fetchCoinDetails(id);
        if (alive) setData(d);
      } catch {
        if (alive) setError('Failed to load details');
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [id]);

  const parsedAmount = useMemo(() => {
    const normalized = amount.replace(',', '.').trim();
    const n = Number(normalized);
    return Number.isFinite(n) ? n : NaN;
  }, [amount]);

  const onSavePortfolio = async () => {
    if (!data) return;

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      toast.error('Invalid amount', 'Enter a number > 0 (e.g., 1 or 0.5)');
      return;
    }

    await addOrUpdate({
      coinId: data.id,
      symbol: data.symbol,
      name: data.name,
      amount: parsedAmount,
    });

    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    toast.success('Saved', `${data.name} added to portfolio`);
  };

  if (loading) {
    return (
      <Screen style={styles.center}>
        <ActivityIndicator />
      </Screen>
    );
  }

  if (error || !data) {
    return (
      <Screen style={styles.center}>
        <Card style={{ width: '100%' }}>
          <Text style={styles.errTitle}>Couldn’t load coin</Text>
          <Text style={styles.errText}>{error ?? 'No data'}</Text>

          <View style={{ marginTop: theme.space.md }}>
            <Button title="Retry" onPress={() => void load()} />
          </View>

          <View style={{ marginTop: theme.space.md }}>
            <Button title="Back" variant="ghost" onPress={() => navigation.goBack()} />
          </View>
        </Card>
      </Screen>
    );
  }

  const price = data.market_data.current_price[vs];
  const change = data.market_data.price_change_percentage_24h;
  const cap = data.market_data.market_cap[vs];

  const isUp = typeof change === 'number' && change > 0;
  const isDown = typeof change === 'number' && change < 0;

  return (
    <Screen style={styles.screen}>
      {/* Back */}
      <Pressable
        onPress={() => navigation.goBack()}
        hitSlop={14}
        style={({ pressed }) => [styles.backBtn, pressed && styles.backPressed]}
      >
        <Text style={styles.backIcon}>‹</Text>
        <Text style={styles.backText}>Back</Text>
      </Pressable>

      {/* Hero */}
      <Card style={styles.hero}>
        <View style={styles.heroTop}>
          <View style={styles.logoWrap}>
            <Image source={{ uri: data.image.large }} style={styles.logo} />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>{data.name}</Text>
            <Text style={styles.heroSub}>
              {data.symbol.toUpperCase()} • {currency}
            </Text>
          </View>

          <View style={styles.priceBlock}>
            <Text style={styles.priceLabel}>Price</Text>
            <Text style={styles.priceValue}>{formatMoney(price, currencySign)}</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>24h</Text>
            <Text
              style={[
                styles.statValue,
                isUp && { color: theme.color.success },
                isDown && { color: theme.color.danger },
              ]}
            >
              {typeof change === 'number' ? `${change.toFixed(2)}%` : '—'}
            </Text>
          </View>

          <View style={styles.stat}>
            <Text style={styles.statLabel}>Market cap</Text>
            <Text style={styles.statValue}>{formatBigNumber(cap, currencySign)}</Text>
          </View>
        </View>

        <Subtle style={{ marginTop: theme.space.md }}>
          Tip: portfolio is saved on-device. Market uses cached data when offline.
        </Subtle>
      </Card>

      {/* Add to portfolio */}
      <Card>
        <Text style={styles.sectionTitle}>Add to portfolio</Text>
        <Text style={styles.sectionSub}>Enter how many coins you hold. Supports comma or dot.</Text>

        <TextInput
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          placeholder="Amount (e.g., 1 or 0.5)"
          placeholderTextColor={theme.color.text3}
          style={styles.input}
        />

        <View style={{ marginTop: theme.space.md }}>
          <Button title="Add / Update portfolio" onPress={() => void onSavePortfolio()} />
        </View>

        <Text style={styles.hint}>Long-press an item in Portfolio to remove.</Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { paddingTop: theme.space.md }, // кнопка back сама добавляет “верх”, xl больше не нужен
  center: { justifyContent: 'center' },

  // Back button (glass + accent glow)
  backBtn: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,

    marginBottom: theme.space.md,
    paddingHorizontal: 12,
    paddingVertical: 10,

    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.color.border,
    backgroundColor: 'rgba(139, 92, 246, 0.16)',
  },
  backPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
  backIcon: {
    color: theme.color.text,
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 22,
    marginTop: -1,
  },
  backText: {
    color: theme.color.text,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.2,
  },

  errTitle: { color: theme.color.text, fontWeight: '900', fontSize: 16 },
  errText: { color: theme.color.text2, marginTop: 6 },

  hero: { padding: theme.space.lg },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: theme.space.md },

  logoWrap: {
    width: 56,
    height: 56,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.color.surface2,
    borderWidth: 1,
    borderColor: theme.color.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: { width: 40, height: 40 },

  heroTitle: { color: theme.color.text, fontSize: 18, fontWeight: '900' },
  heroSub: { marginTop: 4, color: theme.color.text2, fontWeight: '800', fontSize: 12 },

  priceBlock: { alignItems: 'flex-end' },
  priceLabel: { color: theme.color.text3, fontSize: 11, fontWeight: '900' },
  priceValue: { marginTop: 3, color: theme.color.text, fontSize: 16, fontWeight: '900' },

  statsRow: {
    marginTop: theme.space.lg,
    flexDirection: 'row',
    gap: theme.space.md,
  },
  stat: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.color.border,
    backgroundColor: theme.color.surface2,
    borderRadius: theme.radius.lg,
    padding: theme.space.md,
  },
  statLabel: { color: theme.color.text3, fontWeight: '900', fontSize: 11 },
  statValue: { marginTop: 6, color: theme.color.text, fontWeight: '900', fontSize: 14 },

  sectionTitle: { color: theme.color.text, fontWeight: '900', fontSize: 16 },
  sectionSub: { marginTop: 6, color: theme.color.text2, fontWeight: '700', fontSize: 12 },

  input: {
    marginTop: theme.space.md,
    borderWidth: 1,
    borderColor: theme.color.border,
    backgroundColor: theme.color.surface2,
    borderRadius: theme.radius.lg,
    paddingHorizontal: theme.space.lg,
    paddingVertical: 12,
    color: theme.color.text,
    fontWeight: '800',
  },

  hint: { marginTop: 10, color: theme.color.text3, fontSize: 12, fontWeight: '700' },
});
