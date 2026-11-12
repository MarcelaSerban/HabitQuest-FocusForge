import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { SQLiteProvider, useSQLiteContext } from 'expo-sqlite';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { migrateDbIfNeeded } from '@/src/database/db';
import { setHabitDb } from '@/src/store/useHabitStore';
import { AppThemeProvider, useAppTheme } from '@/src/theme';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  anchor: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <SQLiteProvider databaseName="focusforge.db" onInit={migrateDbIfNeeded}>
      <AppThemeProvider>
        <RootLayoutNav />
      </AppThemeProvider>
    </SQLiteProvider>
  );
}

function RootLayoutNav() {
  const { colors } = useAppTheme();
  // Dăm store-ului Zustand conexiunea la baza de date, înainte să se deseneze ecranele.
  setHabitDb(useSQLiteContext());

  return (
    <ThemeProvider value={colors.mode === 'dark' ? DarkTheme : DefaultTheme}>
      <StatusBar style={colors.mode === 'dark' ? 'light' : 'dark'} />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="habit-form" options={{ presentation: 'modal' }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
}
