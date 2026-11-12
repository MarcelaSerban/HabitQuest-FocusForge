import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { frequencyText, useHabitStore, type Habit } from '@/src/store/useHabitStore';
import { useAppTheme } from '@/src/theme';

export default function HabitsScreen() {
  const { colors } = useAppTheme();
  const router = useRouter();
  const habits = useHabitStore((s) => s.habits);
  const fetchHabits = useHabitStore((s) => s.fetchHabits);
  const deleteHabit = useHabitStore((s) => s.deleteHabit);

  useFocusEffect(
    useCallback(() => {
      fetchHabits();
    }, [fetchHabits]),
  );

  const openForm = (id?: number) =>
    router.push({ pathname: '/habit-form', params: id ? { id: String(id) } : {} });

  const confirmDelete = (h: Habit) =>
    Alert.alert(
      'Ștergi obiceiul?',
      `„${h.name}” și tot istoricul lui vor fi șterse definitiv.`,
      [
        { text: 'Anulează', style: 'cancel' },
        { text: 'Șterge', style: 'destructive', onPress: () => deleteHabit(h.id) },
      ],
    );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <FlatList
        data={habits}
        keyExtractor={(h) => String(h.id)}
        contentContainerStyle={{ padding: 12, paddingTop: 12, paddingBottom: 110, gap: 10, flexGrow: 1 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{ fontSize: 56 }}>🦉</Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Niciun obicei încă</Text>
            <Text style={{ color: colors.textSub, textAlign: 'center' }}>
              Apasă butonul + ca să adaugi primul tău obicei.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => openForm(item.id)}
            style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={[styles.badge, { backgroundColor: item.color + '33', borderColor: item.color }]}>
              <Text style={{ fontSize: 22 }}>{item.icon}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.name, { color: colors.text }]}>{item.name}</Text>
              <View style={styles.freqRow}>
                <View style={[styles.dot, { backgroundColor: item.color }]} />
                <Text style={{ color: colors.textSub, fontSize: 13 }}>{frequencyText(item)}</Text>
              </View>
            </View>
            <Pressable
              hitSlop={10}
              accessibilityLabel={`Șterge ${item.name}`}
              onPress={() => confirmDelete(item)}
              style={styles.trash}>
              <Text style={{ fontSize: 20 }}>🗑️</Text>
            </Pressable>
          </Pressable>
        )}
      />
      <Pressable
        accessibilityLabel="Adaugă obicei"
        onPress={() => openForm()}
        style={[styles.fab, { backgroundColor: colors.accent }]}>
        <Text style={{ color: colors.onAccent, fontSize: 32, lineHeight: 34, fontWeight: '600' }}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 18, borderWidth: 1 },
  badge: { width: 46, height: 46, borderRadius: 14, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 16, fontWeight: '700' },
  freqRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  trash: { padding: 6 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 30, paddingTop: 60 },
  emptyTitle: { fontSize: 20, fontWeight: '800' },
  fab: {
    position: 'absolute', right: 20, bottom: 24, width: 60, height: 60, borderRadius: 30,
    alignItems: 'center', justifyContent: 'center', elevation: 6,
  },
});
