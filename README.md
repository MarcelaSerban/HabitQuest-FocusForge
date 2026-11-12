# Habit Quest — FocusForge

Aplicație mobilă de urmărit obiceiuri, **offline-first**, cu un strat de joc (XP, nivel, statistici).
În interfață aplicația se numește **FocusForge**.

Proiect pentru cursul ASSIST — React Native (Expo) + TypeScript.

## Ce poate face acum

- **Today:** arată doar obiceiurile scadente azi; bifare cu un singur tap, anulare în aceeași zi.
  Fiecare bifare dă **30 XP**; XP-ul duce la nivel nou și crește statisticile STR / INT / VIT / SPI.
- **Habits:** lista tuturor obiceiurilor, adăugare, editare, ștergere cu confirmare.
  Fiecare obicei are nume, iconiță, culoare și frecvență (în fiecare zi sau anumite zile Lun–Dum).
- **Stats:** calendar cu ultimele 12 săptămâni și rata de completare pentru fiecare obicei.
- **Temă zi / noapte**, comutator în ecranul Today.
- Datele sunt salvate local (SQLite) și rămân după repornirea aplicației.

## Tehnologii

- Expo SDK 58, Expo Router (rute pe fișiere, 3 tab-uri: Today / Habits / Stats)
- TypeScript
- `expo-sqlite` (bază de date locală)
- Zustand (starea obiceiurilor)

## Structură

```
app/
  _layout.tsx           Stack + inițializarea bazei de date
  (tabs)/               index (Today), habits, stats
  habit-form.tsx        formular adăugare / editare
src/
  database/db.ts        tabelele habits, completions, character
  database/queries.ts   interogările pentru ecranul Today
  store/useHabitStore.ts  store Zustand (fetch / add / update / delete)
  lib/                  date și regulile jocului (XP, nivel)
  theme.tsx             teme zi / noapte
```

## Baza de date

- `habits` (id, name, icon, color, frequency_type, target_days, reminder_time, created_at)
- `completions` (id, habit_id, completion_date, completed_at)
- `character` (id, level, xp, hp, str, int, vit, spi)

## Cum se rulează

```
npm install
npm install expo-sqlite@58.0.10
npm start
```

Apoi scanează codul QR cu aplicația Expo Go (versiunea 58) sau pornește un emulator Android / simulator iOS.

> Notă: pentru Expo Go se folosește `expo-sqlite@58.0.10`; versiunile mai noi nu se potrivesc cu modulul nativ din Expo Go.

## De făcut

- Ecran de detalii pentru fiecare obicei (istoric complet, serie curentă, serie maximă)
- Reguli de serie (streak)
- Notificări locale pentru fiecare obicei, feedback haptic
- Pierdere de HP când sunt ratate zile
- Widget
