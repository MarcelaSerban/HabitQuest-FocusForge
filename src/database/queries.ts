import type { SQLiteDatabase } from 'expo-sqlite';

import { weekdayOf } from '@/src/lib/dates';
import { applyCompletion, undoCompletion, type Hero } from '@/src/lib/game';

export type TodayHabit = {
  id: number;
  name: string;
  icon: string;
  color: string;
  done: boolean;
};

type HabitRow = {
  id: number;
  name: string;
  icon: string;
  color: string;
  frequency_type: 'daily' | 'specific';
  target_days: string;
  done: number;
};

export async function getHero(db: SQLiteDatabase): Promise<Hero> {
  const row = await db.getFirstAsync<Hero>(
    'SELECT level, xp, hp, str, int, vit, spi FROM "character" WHERE id = 1',
  );
  return row ?? { level: 1, xp: 0, hp: 100, str: 0, int: 0, vit: 0, spi: 0 };
}

/** Doar obiceiurile scadente în ziua `dateKey`, cu starea bifării. */
export async function listDueHabits(db: SQLiteDatabase, dateKey: string): Promise<TodayHabit[]> {
  const rows = await db.getAllAsync<HabitRow>(
    `SELECT h.id, h.name, h.icon, h.color, h.frequency_type, h.target_days,
            EXISTS (SELECT 1 FROM completions c
                    WHERE c.habit_id = h.id AND c.completion_date = ?) AS done
     FROM habits h ORDER BY h.id`,
    dateKey,
  );
  const weekday = weekdayOf(dateKey);
  return rows
    .filter((r) => {
      if (r.frequency_type === 'daily') return true;
      try {
        return (JSON.parse(r.target_days) as number[]).includes(weekday);
      } catch {
        return false;
      }
    })
    .map((r) => ({ id: r.id, name: r.name, icon: r.icon, color: r.color, done: r.done === 1 }));
}

/** Bifează sau anulează bifarea și actualizează personajul, totul într-o tranzacție. */
export async function toggleHabit(
  db: SQLiteDatabase,
  habit: TodayHabit,
  dateKey: string,
): Promise<void> {
  await db.withTransactionAsync(async () => {
    const hero = await getHero(db);
    let next: Hero;
    if (habit.done) {
      await db.runAsync(
        'DELETE FROM completions WHERE habit_id = ? AND completion_date = ?',
        habit.id,
        dateKey,
      );
      next = undoCompletion(hero, habit.icon);
    } else {
      await db.runAsync(
        'INSERT OR IGNORE INTO completions (habit_id, completion_date, completed_at) VALUES (?, ?, ?)',
        habit.id,
        dateKey,
        new Date().toISOString(),
      );
      next = applyCompletion(hero, habit.icon);
    }
    await db.runAsync(
      'UPDATE "character" SET level = ?, xp = ?, str = ?, int = ?, vit = ?, spi = ? WHERE id = 1',
      next.level, next.xp, next.str, next.int, next.vit, next.spi,
    );
  });
}
