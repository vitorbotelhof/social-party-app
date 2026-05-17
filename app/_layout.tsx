/**
 * Root layout do Expo Router.
 *
 * ⚠️ ONDA 1 — preparação apenas.
 *
 * Este arquivo ainda NÃO é executado em runtime: o entry point continua
 * `index.ts` → `App.tsx` → <NavigationContainer/>. O `main` em
 * package.json segue como "index.ts" e a navegação atual (React Navigation
 * + RootNavigator) controla 100% do app.
 *
 * Para ATIVAR o Expo Router (Onda 2):
 *   1. Trocar "main" em package.json para "expo-router/entry"
 *   2. Apagar index.ts e App.tsx (ou deixar como referência temporária)
 *   3. Mover as telas atuais pra /app/... uma a uma
 *
 * Quando ativado, este layout substitui a função do <NavigationContainer>
 * + <Stack.Navigator> que vive hoje em App.tsx + RootNavigator.tsx.
 */
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { cores } from '@/theme/colors';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: cores.fundo },
          headerTintColor: cores.primaria,
          headerTitleStyle: {
            color: cores.texto,
            fontWeight: '700',
          },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: cores.fundo },
          animation: 'slide_from_right',
          animationDuration: 250,
        }}
      />
    </SafeAreaProvider>
  );
}
