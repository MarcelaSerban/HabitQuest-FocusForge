import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { toDateKey, weekdayOf } from '@/src/lib/dates';
import { useAppTheme } from '@/src/theme';

type HabitRow = {
  id: number;
  name: string;
  icon: string;
  color: string;
  frequency_type: 'daily' | 'specific';
  target_days: string;
  created_at: string;
};

type Rate = { id: number; name: string; icon: string; color: string; due: number; done: number };

const WEEKS = 12;
const CELL = 22;
const GAP = 4;

function addDays(key: string, n: number): string {
  const [y, m, d] = key.split('-').map(Number);
  return toDateKey(new Date(y, m - 1, d + n, 12));
}

function isDue(h: HabitRow, key: string): boolean {
  if (h.frequency_type === 'daily') return true;
  try {
    return (JSON.parse(h.target_days) as number[]).includes(weekdayOf(key));
  } catch {
    return false;
  }
}

export default function StatsScreen() {
  const db = useSQLiteContext();
  const { colors } = useAppTheme();
  const [cells, setCells] = useState<{ key: string; ratio: number; future: boolean }[]>([]);
  const [rates, setRates] = useState<Rate[]>([]);
  const [total, setTotal] = useState(0);

  const load = useCallback(async () => {
    const habits = await db.getAllAsync<HabitRow>('SELECT * FROM habits ORDER BY id');
    const comps = await db.getAllAsync<{ habit_id: number; completion_date: string }>(
      'SELECT habit_id, completion_date FROM completions',
    );
    const doneSet = new Set(comps.map((c) => `${c.habit_id}|${c.completion_date}`));
    const today = toDateKey();

    // Calendarul: ultimele 12 săptămâni, luni -> duminică. Intensitatea = bifate / scadente în ziua respectivă.
    const mondayIndex = (weekdayOf(today) + 6) % 7;
    const start = addDays(today, -mondayIndex - 7 * (WEEKS - 1));
    const out: { key: string; ratio: number; future: boolean }[] = [];
    for (let i = 0; i < WEEKS * 7; i++) {
      const key = addDays(start, i);
      if (key > today) {
        out.push({ key, ratio: 0, future: true });
        continue;
      }
      let due = 0;
      let done = 0;
      for (const h of habits) {
        if (key < h.created_at.slice(0, 10) || !isDue(h, key)) continue;
        due++;
        if (doneSet.has(`${h.id}|${key}`)) done++;
      }
      out.push({ key, ratio: due === 0 ? 0 : done / due, future: false });
    }
    setCells(out);

    // Rata de completare pentru fiecare obicei, de la crearea lui până azi.
    const r: Rate[] = habits.map((h) => {
      let due = 0;
      let done = 0;
      for (let k = h.created_at.slice(0, 10); k <= today; k = addDays(k, 1)) {
        if (!isDue(h, k)) continue;
        due++;
        if (doneSet.has(`${h.id}|${k}`)) done++;
      }
      return { id: h.id, name: h.name, icon: h.icon, color: h.color, due, done };
    });
    setRates(r);
    setTotal(comps.length);
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const shade = (ratio: number) =>
    ratio === 0 ? colors.barTrack : colors.accent + (ratio < 0.5 ? '66' : ratio < 1 ? 'AA' : 'FF');

  // Împărțim celulele pe coloane (câte o săptămână).
  const columns = Array.from({ length: WEEKS }, (_, w) => cells.slice(w * 7, w * 7 + 7));

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 40 }}>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <Text style={[styles.h, { color: colors.text }]}>Ultimele 12 săptămâni</Text>
        <View style={{ flexDirection: 'row', gap: GAP, marginTop: 10, alignSelf: 'center' }}>
          {columns.map((col, w) => (
            <View key={w} style={{ gap: GAP }}>
              {col.map((c) => (
                <View
                  key={c.key}
                  style={{
                    width: CELL,
                    height: CELL,
                    borderRadius: 6,
                    backgroundColor: c.future ? 'transparent' : shade(c.ratio),
                  }}
                />
              ))}
            </View>
          ))}
        </View>
        <Text style={{ color: colors.textSub, fontSize: 12, marginTop: 10, textAlign: 'center' }}>
          Rândurile sunt Lun–Dum. Culoarea e mai intensă cu cât ai bifat mai multe obiceiuri din ziua respectivă.
        </Text>
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <Text style={[styles.h, { color: colors.text }]}>Rata de completare</Text>
        <Text style={{ color: colors.textSub, fontSize: 12, marginBottom: 6 }}>{total} bifări în total</Text>
        {rates.length === 0 && <Text style={{ color: colors.textSub }}>Nu ai încă niciun obicei.</Text>}
        {rates.map((r) => {
          const pct = r.due === 0 ? 0 : Math.round((r.done / r.due) * 100);
          return (
            <View key={r.id} style={{ marginTop: 10 }}>
              <View style={styles.rateTop}>
                <Text style={{ color: colors.text, fontWeight: '700', flex: 1 }} numberOfLines={1}>
                  {r.icon} {r.name}
                </Text>
                <Text style={{ color: colors.textSub, fontWeight: '700' }}>
                  {r.done}/{r.due} · {pct}%
                </Text>
              </View>
              <View style={[styles.track, { backgroundColor: colors.barTrack }]}>
                <View style={{ width: `${pct}%`, height: '100%', backgroundColor: r.color, borderRadius: 6 }} />
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 20, borderWidth: 1, padding: 14 },
  h: { fontSize: 17, fontWeight: '800' },
  rateTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginBottom: 6 },
  track: { height: 12, borderRadius: 6, overflow: 'hidden' },
});
