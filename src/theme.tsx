import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

export type Palette = {
  mode: 'light' | 'dark';
  bg: string;
  card: string;
  cardBorder: string;
  text: string;
  textSub: string;
  accent: string;
  bar: string;
  barTrack: string;
  onAccent: string;
  checkBorder: string;
  tabBg: string;
};

const light: Palette = {
  mode: 'light',
  bg: '#FBF2EC',
  card: '#FFFFFF',
  cardBorder: '#E7DDD6',
  text: '#0B1A3D',
  textSub: '#5B6B8C',
  accent: '#1E6FE8',
  bar: '#19B5FF',
  barTrack: '#D7E6F5',
  onAccent: '#FFFFFF',
  checkBorder: '#B8C0CC',
  tabBg: '#FFFFFF',
};

const dark: Palette = {
  mode: 'dark',
  bg: '#0B1220',
  card: '#111B30',
  cardBorder: '#22D3EE',
  text: '#F8FAFC',
  textSub: '#9AA8C1',
  accent: '#22D3EE',
  bar: '#22D3EE',
  barTrack: '#1E2B4D',
  onAccent: '#04202A',
  checkBorder: '#475569',
  tabBg: '#0B1220',
};

type Ctx = { colors: Palette; toggle: () => void };
const ThemeCtx = createContext<Ctx>({ colors: dark, toggle: () => {} });

/** Pornește cu tema telefonului; butonul ☀️/🌙 o schimbă manual. */
export function AppThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const [mode, setMode] = useState<'light' | 'dark'>(system === 'light' ? 'light' : 'dark');
  const value = useMemo<Ctx>(
    () => ({
      colors: mode === 'light' ? light : dark,
      toggle: () => setMode((m) => (m === 'light' ? 'dark' : 'light')),
    }),
    [mode],
  );
  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

export const useAppTheme = () => useContext(ThemeCtx);
