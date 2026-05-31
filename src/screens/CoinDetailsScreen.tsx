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
import type { RouteProp } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';

import { useToast } from '../components/Toast';
import type { RootStackParamList } from '../navigation/types';
import { useMarketStore } from '../store/marketStore';
import { usePortfolioStore } from '../store/portfolioStore';
import { useSettingsStore } from '../store/settingsStore';
import { theme } from '../theme/theme';
import { Button, Card, Screen, Subtle, ChangePill } from '../components/ui';
import { formatMoney, formatBigNumber } from '../utils/formatters';

type Route = RouteProp<RootStackParamList, 'CoinDetails'>;
type Nav = NativeStackNavigationProp<RootStackParamList, 'CoinDetails'>;

export default function CoinDetailsScreen({ route }: { route: Route }) {
  const navigation = useNavigation<Nav>();
  const { id } = route.params;

  const currency = useSettingsStore((s) => s.currency);
  const currencySign = currency === 'EUR' ? '€' : '$';

  const addOrUpdate = usePortfolioStore((s) => s.addOrUpdate);
  const toast = useToast();

  // Read the coin data directly from the market store — no extra API call needed!
  // The market list already has everything we need: price, market cap, 24h change, image.
  const coin = useMarketStore((s) => s.coins.find((c) => c.id === id));

  const [amount, setAmount] = useState('1');

  const parsedAmount = useMemo(() => {
    const normalized = amount.replace(',', '.').trim();
    const n = Number(normalized);
    return Number.isFinite(n) ? n : NaN;
  }, [amount]);

  const onSavePortfolio = async () => {
    if (!coin) return;

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      toast.error('Invalid amount', 'Enter a number > 0 (e.g., 1 or 0.5)');
      return;
    }

    await addOrUpdate({
      coinId: coin.id,
      symbol: coin.symbol,
      name: coin.name,
      amount: parsedAmount,
    });

    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    toast.success('Saved', `${coin.name} added to portfolio`);
  };

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

  const price = coin.current_price;
  const change = coin.price_change_percentage_24h;
  const cap = coin.market_cap;

  const estimatedValue =
    Number.isFinite(parsedAmount) && parsedAmount > 0
      ? formatMoney(price * parsedAmount, currencySign)
      : null;

  return (
    <Screen style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Back */}
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={14}
          style={({ pressed }) => [styles.backBtn, pressed && styles.backPressed]}
        >
          <Text style={styles.backIcon}>‹</Text>
          <Text style={styles.backText}>Back</Text>
        </Pressable>

        {/* Hero card */}
        <Card style={styles.hero}>
          {/* Coin identity row */}
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

          {/* Divider */}
          <View style={styles.divider} />

          {/* Stats row */}
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

        {/* Add to portfolio card */}
        <Card style={styles.addCard}>
          <Text style={styles.sectionTitle}>Add to Portfolio</Text>
          <Text style={styles.sectionSub}>Enter how many {coin.symbol.toUpperCase()} you hold.</Text>

          <TextInput
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            placeholder="Amount (e.g., 1 or 0.5)"
            placeholderTextColor={theme.color.text3}
            style={styles.input}
          />

          {/* Estimated value preview */}
          {estimatedValue ? (
            <View style={styles.estimateRow}>
              <Text style={styles.estimateLabel}>Estimated value</Text>
              <Text style={styles.estimateValue}>{estimatedValue}</Text>
            </View>
          ) : null}

          <View style={{ marginTop: theme.space.lg }}>
            <Button title={`Add ${coin.name} to Portfolio`} onPress={() => void onSavePortfolio()} />
          </View>

          <Subtle style={{ marginTop: theme.space.sm, textAlign: 'center' }}>
            Long-press any item in Portfolio tab to remove it.
          </Subtle>
        </Card>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { paddingTop: theme.space.md },
  center: { justifyContent: 'center', alignItems: 'center', gap: 12 },
  scroll: { paddingBottom: 100, gap: theme.space.md },

  // Back button
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

  // Error
  errorCard: { width: '100%', alignItems: 'center' },
  errorEmoji: { fontSize: 40, marginBottom: theme.space.md },
  errTitle: { color: theme.color.text, fontWeight: '900', fontSize: theme.font.lg },
  errText: { color: theme.color.text2, marginTop: 6, textAlign: 'center' },

  // Hero
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

  priceBlock: { alignItems: 'flex-end' },
  priceLabel: { color: theme.color.text3, fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  priceValue: { marginTop: 4, color: theme.color.text, fontSize: theme.font.lg, fontWeight: '900' },

  divider: { height: 1, backgroundColor: theme.color.border, marginVertical: theme.space.md },

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

  // Add card
  addCard: { gap: 0 },
  sectionTitle: { color: theme.color.text, fontWeight: '900', fontSize: theme.font.lg },
  sectionSub: { marginTop: 6, color: theme.color.text3, fontWeight: '600', fontSize: theme.font.sm },

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
