import type { SQLiteDatabase } from 'expo-sqlite';
import { create } from 'zustand';

export type FrequencyType = 'daily' | 'specific';

export type Habit = {
  id: number;
  name: string;
  icon: string;
  color: string;
  frequency_type: FrequencyType;
  /** Zilele săptămânii: 0 = duminică ... 6 = sâmbătă (gol pentru „în fiecare zi”). */
  target_days: number[];
  reminder_time: string | null;
};

export type HabitInput = Omit<Habit, 'id'>;

type Row = Omit<Habit, 'target_days'> & { target_days: string };

// Baza de date este setată o singură dată, la pornirea aplicației (vezi app/_layout.tsx).
let dbRef: SQLiteDatabase | null = null;
export function setHabitDb(db: SQLiteDatabase) {
  dbRef = db;
}
function getDb(): SQLiteDatabase {
  if (!dbRef) throw new Error('Baza de date nu este inițializată');
  return dbRef;
}

function parseDays(text: string): number[] {
  try {
    const v = JSON.parse(text);
    return Array.isArray(v) ? v.filter((n) => Number.isInteger(n)) : [];
  } catch {
    return [];
  }
}

type HabitState = {
  habits: Habit[];
  loaded: boolean;
  fetchHabits: () => Promise<void>;
  addHabit: (data: HabitInput) => Promise<void>;
  updateHabit: (id: number, data: HabitInput) => Promise<void>;
  deleteHabit: (id: number) => Promise<void>;
};

export const useHabitStore = create<HabitState>((set, get) => ({
  habits: [],
  loaded: false,

  fetchHabits: async () => {
    const rows = await getDb().getAllAsync<Row>('SELECT * FROM habits ORDER BY id');
    set({
      habits: rows.map((r) => ({ ...r, target_days: parseDays(r.target_days) })),
      loaded: true,
    });
  },

  addHabit: async (d) => {
    await getDb().runAsync(
      'INSERT INTO habits (name, icon, color, frequency_type, target_days, reminder_time) VALUES (?, ?, ?, ?, ?, ?)',
      d.name.trim(),
      d.icon,
      d.color,
      d.frequency_type,
      JSON.stringify(d.frequency_type === 'daily' ? [] : d.target_days),
      d.reminder_time,
    );
    await get().fetchHabits();
  },

  updateHabit: async (id, d) => {
    await getDb().runAsync(
      'UPDATE habits SET name = ?, icon = ?, color = ?, frequency_type = ?, target_days = ?, reminder_time = ? WHERE id = ?',
      d.name.trim(),
      d.icon,
      d.color,
      d.frequency_type,
      JSON.stringify(d.frequency_type === 'daily' ? [] : d.target_days),
      d.reminder_time,
      id,
    );
    await get().fetchHabits();
  },

  deleteHabit: async (id) => {
    const db = getDb();
    // Ștergem explicit și bifările (nu ne bazăm pe PRAGMA foreign_keys, care e per conexiune).
    await db.withTransactionAsync(async () => {
      await db.runAsync('DELETE FROM completions WHERE habit_id = ?', id);
      await db.runAsync('DELETE FROM habits WHERE id = ?', id);
    });
    await get().fetchHabits();
  },
}));

const DAY_LABELS = ['Dum', 'Lun', 'Mar', 'Mie', 'Joi', 'Vin', 'Sâm'];
/** Ordinea afișată: luni ... duminică. */
export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];
export const dayLabel = (d: number) => DAY_LABELS[d];

export function frequencyText(h: Pick<Habit, 'frequency_type' | 'target_days'>): string {
  if (h.frequency_type === 'daily') return 'În fiecare zi';
  const days = WEEK_ORDER.filter((d) => h.target_days.includes(d));
  return days.length ? days.map(dayLabel).join(', ') : 'Nicio zi aleasă';
}
