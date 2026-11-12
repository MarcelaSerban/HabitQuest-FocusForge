import { useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getHero, listDueHabits, toggleHabit, type TodayHabit } from '@/src/database/queries';
import { toDateKey } from '@/src/lib/dates';
import { XP_PER_COMPLETION, xpNeeded, type Hero } from '@/src/lib/game';
import { useAppTheme } from '@/src/theme';

const HERO_DAY = require('../../assets/images/hero-day.png');
const HERO_NIGHT = require('../../assets/images/hero-night.png');

const EMPTY_HERO: Hero = { level: 1, xp: 0, hp: 100, str: 0, int: 0, vit: 0, spi: 0 };

const STATS = [
  { key: 'str', label: 'STR', emoji: '💪', bg: '#FFF3DC', border: '#F5D58F' },
  { key: 'int', label: 'INT', emoji: '🧠', bg: '#EEE8FF', border: '#CFC2F5' },
  { key: 'vit', label: 'VIT', emoji: '❤️', bg: '#FFE8EE', border: '#F5BCCB' },
  { key: 'spi', label: 'SPI', emoji: '🌿', bg: '#E6F6E8', border: '#B5E0BC' },
] as const;

export default function TodayScreen() {
  const db = useSQLiteContext();
  const { colors, toggle } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const [hero, setHero] = useState<Hero>(EMPTY_HERO);
  const [habits, setHabits] = useState<TodayHabit[]>([]);
  const today = toDateKey();

  const load = useCallback(async () => {
    const [h, list] = await Promise.all([getHero(db), listDueHabits(db, today)]);
    setHero(h);
    setHabits(list);
  }, [db, today]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onToggle = async (habit: TodayHabit) => {
    await toggleHabit(db, habit, today);
    await load();
  };

  const isDark = colors.mode === 'dark';
  const doneCount = habits.filter((h) => h.done).length;
  const need = xpNeeded(hero.level);
  const heroW = width - 24;
  const heroH = heroW * 0.4;

  return (
    <ScrollView
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 24, paddingHorizontal: 12 }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {/* Imaginea cu bufnița + titlul + comutatorul zi/noapte */}
      <View style={[styles.heroWrap, { width: heroW, height: heroH }]}>
        <Image
          source={isDark ? HERO_NIGHT : HERO_DAY}
          style={isDark ? { width: heroW, height: heroW * (780 / 941), marginTop: -heroW * 0.1 } : { width: heroW, height: heroH }}
          resizeMode="cover"
        />
        <View style={styles.heroTitle}>
          <Text style={[styles.brand, { color: isDark ? '#FFFFFF' : '#16205B' }]}>
            Focus<Text style={{ color: isDark ? '#22D3EE' : '#1E6FE8' }}>Forge</Text>
          </Text>
          <Text style={[styles.tagline, { color: isDark ? '#CFE3FF' : '#16205B' }]}>BUILD YOUR DISCIPLINE</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Schimbă tema zi / noapte"
          onPress={toggle}
          style={styles.themeBtn}>
          <Text style={{ fontSize: 22 }}>{isDark ? '🌙' : '☀️'}</Text>
        </Pressable>
      </View>

      {/* Nivel + XP */}
      <View style={styles.levelRow}>
        <View style={[styles.shield, { backgroundColor: isDark ? '#0B2A6B' : '#12306E', borderColor: '#F0B84B' }]}>
          <Text style={styles.shieldText}>Lv.{hero.level}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.xpText, { color: colors.accent }]}>
            {hero.xp} / {need} XP
          </Text>
          <View style={[styles.track, { backgroundColor: colors.barTrack }]}>
            <View style={{ height: 14, width: `${Math.min(100, (hero.xp / need) * 100)}%`, backgroundColor: colors.bar, borderRadius: 7 }} />
          </View>
        </View>
      </View>

      {/* STR / INT / VIT / SPI */}
      <View style={styles.statsRow}>
        {STATS.map((s) => (
          <View key={s.key} style={[styles.stat, { backgroundColor: isDark ? colors.card : s.bg, borderColor: isDark ? colors.cardBorder : s.border }]}>
            <Text style={{ fontSize: 26 }}>{s.emoji}</Text>
            <View>
              <Text style={[styles.statLabel, { color: colors.textSub }]}>{s.label}</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>{hero[s.key]}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Lista Today */}
      <View style={styles.todayHeader}>
        <Text style={[styles.todayTitle, { color: colors.text }]}>{todayLabel()}</Text>
        <Text style={[styles.todayCount, { color: colors.accent }]}>
          {doneCount} / {habits.length} habits
        </Text>
      </View>

      <View style={[styles.list, { backgroundColor: isDark ? colors.card : '#FFFFFFAA', borderColor: isDark ? colors.cardBorder : colors.cardBorder }]}>
        {habits.length === 0 ? (
          <Text style={{ color: colors.textSub, padding: 16 }}>Niciun obicei programat pentru azi.</Text>
        ) : (
          habits.map((h) => (
            <Pressable
              key={h.id}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: h.done }}
              accessibilityLabel={`Bifează ${h.name}`}
              onPress={() => onToggle(h)}
              style={[styles.row, { backgroundColor: colors.card }]}>
              <View
                style={[
                  styles.check,
                  { borderColor: h.done ? colors.accent : colors.checkBorder, backgroundColor: h.done ? colors.accent : 'transparent' },
                ]}>
                {h.done ? <Text style={{ color: colors.onAccent, fontWeight: '800' }}>✓</Text> : null}
              </View>
              <View style={[styles.iconBubble, { backgroundColor: h.color + '33' }]}>
                <Text style={{ fontSize: 20 }}>{h.icon}</Text>
              </View>
              <Text
                style={[
                  styles.name,
                  { color: colors.text },
                  h.done ? { textDecorationLine: 'line-through', opacity: 0.55 } : null,
                ]}
                numberOfLines={1}>
                {h.name}
              </Text>
              <Text style={[styles.xp, { color: h.done ? colors.accent : colors.textSub }]}>+{XP_PER_COMPLETION} XP</Text>
            </Pressable>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const ZILE = ['Duminică', 'Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă'];
const LUNI = ['ian', 'feb', 'mar', 'apr', 'mai', 'iun', 'iul', 'aug', 'sep', 'oct', 'nov', 'dec'];
/** „Joi, 12 nov” — data reală de azi, scrisă ca text. */
function todayLabel() {
  const d = new Date();
  return `${ZILE[d.getDay()]}, ${d.getDate()} ${LUNI[d.getMonth()]}`;
}

const styles = StyleSheet.create({
  heroWrap: { borderRadius: 28, overflow: 'hidden' },
  heroTitle: { position: 'absolute', top: 14, left: 16 },
  brand: { fontSize: 24, fontWeight: '900', fontStyle: 'italic' },
  tagline: { fontSize: 8, fontWeight: '700', letterSpacing: 2 },
  themeBtn: {
    position: 'absolute', top: 10, right: 10, width: 38, height: 38, borderRadius: 13,
    backgroundColor: '#FFFFFFCC', alignItems: 'center', justifyContent: 'center',
  },
  levelRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 10 },
  shield: { width: 56, height: 60, borderRadius: 15, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  shieldText: { color: '#FFFFFF', fontWeight: '900', fontSize: 15 },
  xpText: { fontSize: 14, fontWeight: '700', textAlign: 'right', marginBottom: 6 },
  track: { height: 14, borderRadius: 7, overflow: 'hidden' },
  statsRow: { flexDirection: 'row', gap: 6, marginTop: 10 },
  stat: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 6, borderRadius: 14, borderWidth: 1.5,
  },
  statLabel: { fontSize: 11, fontWeight: '700' },
  statValue: { fontSize: 18, fontWeight: '900', lineHeight: 22 },
  todayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, marginBottom: 6 },
  todayTitle: { fontSize: 22, fontWeight: '800' },
  todayCount: { fontSize: 15, fontWeight: '700' },
  list: { borderRadius: 20, borderWidth: 1, padding: 6, gap: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 7, paddingHorizontal: 10, borderRadius: 16, minHeight: 46 },
  check: { width: 26, height: 26, borderRadius: 8, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  iconBubble: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  name: { flex: 1, fontSize: 15, fontWeight: '600' },
  xp: { fontSize: 12, fontWeight: '700' },
});
