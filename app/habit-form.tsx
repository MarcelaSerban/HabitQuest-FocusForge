import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import {
  WEEK_ORDER,
  dayLabel,
  useHabitStore,
  type FrequencyType,
} from '@/src/store/useHabitStore';
import { useAppTheme } from '@/src/theme';

const ICONS = ['🏃', '💪', '📖', '💻', '🎯', '✍️', '🌙', '😴', '🍎', '💧', '🧘', '🎧'];
const COLORS = ['#3B82F6', '#F59E0B', '#6366F1', '#F97316', '#EF4444', '#10B981', '#EC4899', '#14B8A6'];

export default function HabitFormScreen() {
  const { colors } = useAppTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const editingId = id ? Number(id) : null;

  const habits = useHabitStore((s) => s.habits);
  const addHabit = useHabitStore((s) => s.addHabit);
  const updateHabit = useHabitStore((s) => s.updateHabit);
  const deleteHabit = useHabitStore((s) => s.deleteHabit);

  const [name, setName] = useState('');
  const [icon, setIcon] = useState(ICONS[0]);
  const [color, setColor] = useState(COLORS[0]);
  const [freq, setFreq] = useState<FrequencyType>('daily');
  const [days, setDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [error, setError] = useState('');

  // La editare, completăm formularul cu datele obiceiului.
  useEffect(() => {
    if (editingId === null) return;
    const h = habits.find((x) => x.id === editingId);
    if (!h) return;
    setName(h.name);
    setIcon(h.icon);
    setColor(h.color);
    setFreq(h.frequency_type);
    if (h.target_days.length) setDays(h.target_days);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingId]);

  const toggleDay = (d: number) =>
    setDays((cur) => (cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d]));

  const save = async () => {
    if (!name.trim()) return setError('Scrie un nume pentru obicei.');
    if (freq === 'specific' && days.length === 0) return setError('Alege cel puțin o zi a săptămânii.');
    setError('');
    const data = { name, icon, color, frequency_type: freq, target_days: days, reminder_time: null };
    if (editingId === null) await addHabit(data);
    else await updateHabit(editingId, data);
    router.back();
  };

  const confirmDelete = () =>
    Alert.alert('Ștergi obiceiul?', 'Obiceiul și tot istoricul lui vor fi șterse definitiv.', [
      { text: 'Anulează', style: 'cancel' },
      {
        text: 'Șterge',
        style: 'destructive',
        onPress: async () => {
          if (editingId !== null) await deleteHabit(editingId);
          router.back();
        },
      },
    ]);

  const label = [styles.label, { color: colors.textSub }];

  return (
    <ScrollView
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: 16, gap: 8, paddingBottom: 40 }}
      keyboardShouldPersistTaps="handled">
      <Stack.Screen
        options={{
          title: editingId === null ? 'Obicei nou' : 'Editează obiceiul',
          presentation: 'modal',
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.text,
        }}
      />

      <Text style={label}>NUME</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="ex. Citit 20 de minute"
        placeholderTextColor={colors.textSub}
        maxLength={40}
        style={[styles.input, { color: colors.text, backgroundColor: colors.card, borderColor: error && !name.trim() ? '#EF4444' : colors.cardBorder }]}
      />

      <Text style={label}>ICONIȚĂ</Text>
      <View style={styles.wrap}>
        {ICONS.map((i) => (
          <Pressable
            key={i}
            onPress={() => setIcon(i)}
            style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: icon === i ? colors.accent : colors.cardBorder, borderWidth: icon === i ? 3 : 1 }]}>
            <Text style={{ fontSize: 24 }}>{i}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={label}>CULOARE</Text>
      <View style={styles.wrap}>
        {COLORS.map((c) => (
          <Pressable
            key={c}
            onPress={() => setColor(c)}
            style={[styles.colorBtn, { backgroundColor: c, borderColor: color === c ? colors.text : 'transparent' }]}>
            {color === c && <Text style={{ color: '#fff', fontWeight: '900' }}>✓</Text>}
          </Pressable>
        ))}
      </View>

      <Text style={label}>FRECVENȚĂ</Text>
      <View style={styles.row}>
        {(['daily', 'specific'] as const).map((t) => (
          <Pressable
            key={t}
            onPress={() => setFreq(t)}
            style={[styles.seg, { backgroundColor: freq === t ? colors.accent : colors.card, borderColor: colors.cardBorder }]}>
            <Text style={{ color: freq === t ? colors.onAccent : colors.text, fontWeight: '700' }}>
              {t === 'daily' ? 'În fiecare zi' : 'Anumite zile'}
            </Text>
          </Pressable>
        ))}
      </View>

      {freq === 'specific' && (
        <View style={styles.row}>
          {WEEK_ORDER.map((d) => {
            const on = days.includes(d);
            return (
              <Pressable
                key={d}
                onPress={() => toggleDay(d)}
                style={[styles.day, { backgroundColor: on ? color : colors.card, borderColor: on ? color : colors.cardBorder }]}>
                <Text style={{ color: on ? '#fff' : colors.text, fontWeight: '700', fontSize: 12 }}>{dayLabel(d)}</Text>
              </Pressable>
            );
          })}
        </View>
      )}

      {!!error && <Text style={{ color: '#EF4444', fontWeight: '600' }}>{error}</Text>}

      <Pressable onPress={save} style={[styles.save, { backgroundColor: colors.accent }]}>
        <Text style={{ color: colors.onAccent, fontWeight: '800', fontSize: 16 }}>
          {editingId === null ? 'Adaugă obiceiul' : 'Salvează modificările'}
        </Text>
      </Pressable>

      {editingId !== null && (
        <Pressable onPress={confirmDelete} style={[styles.save, { borderWidth: 2, borderColor: '#EF4444' }]}>
          <Text style={{ color: '#EF4444', fontWeight: '800', fontSize: 16 }}>Șterge obiceiul</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 12, fontWeight: '800', letterSpacing: 1, marginTop: 12 },
  input: { borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  row: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  iconBtn: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  colorBtn: { width: 40, height: 40, borderRadius: 20, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  seg: { flex: 1, paddingVertical: 12, borderRadius: 14, borderWidth: 1, alignItems: 'center' },
  day: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  save: { marginTop: 18, paddingVertical: 14, borderRadius: 16, alignItems: 'center' },
});
