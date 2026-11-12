/** Regulile jocului: XP, nivel și statistici. */

export const XP_PER_COMPLETION = 30;

/** Câți XP sunt necesari ca să treci de la nivelul `level` la următorul. */
export function xpNeeded(level: number): number {
  return 100 * level;
}

export type StatName = 'str' | 'int' | 'vit' | 'spi';

/** Fiecare obicei întărește o statistică, în funcție de iconița lui. */
const STAT_BY_ICON: Record<string, StatName> = {
  '🏃': 'str',
  '💪': 'str',
  '📖': 'int',
  '💻': 'int',
  '🎯': 'int',
  '✍️': 'int',
  '🌙': 'vit',
  '😴': 'vit',
  '🍎': 'vit',
  '💧': 'vit',
  '🧘': 'spi',
  '🎧': 'spi',
};

export function statFor(icon: string): StatName {
  return STAT_BY_ICON[icon] ?? 'spi';
}

export type Hero = {
  level: number;
  xp: number;
  hp: number;
  str: number;
  int: number;
  vit: number;
  spi: number;
};

/** Bifare: adaugă XP, urcă nivelul dacă e cazul și întărește statistica. */
export function applyCompletion(hero: Hero, icon: string): Hero {
  const next = { ...hero, xp: hero.xp + XP_PER_COMPLETION };
  while (next.xp >= xpNeeded(next.level)) {
    next.xp -= xpNeeded(next.level);
    next.level += 1;
  }
  const stat = statFor(icon);
  next[stat] += 1;
  return next;
}

/** Anulare în aceeași zi: face invers decât `applyCompletion`. */
export function undoCompletion(hero: Hero, icon: string): Hero {
  const next = { ...hero, xp: hero.xp - XP_PER_COMPLETION };
  while (next.xp < 0 && next.level > 1) {
    next.level -= 1;
    next.xp += xpNeeded(next.level);
  }
  if (next.xp < 0) next.xp = 0;
  const stat = statFor(icon);
  next[stat] = Math.max(0, next[stat] - 1);
  return next;
}
