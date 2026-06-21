import { createNativeStackNavigator } from '@react-navigation/native-stack';

import type { SoloStackParamList } from '@/navigation/types';
import { TelaCodigoSecreto } from '@/screens/solo/TelaCodigoSecreto';
import { TelaSelecaoCodigoSecreto } from '@/screens/solo/TelaSelecaoCodigoSecreto';
import { TelaSelecaoShikaku } from '@/screens/solo/TelaSelecaoShikaku';
import { TelaShikaku } from '@/screens/solo/TelaShikaku';
import { TelaSoloHome } from '@/screens/solo/TelaSoloHome';
import { cores } from '@/theme/colors';

const Stack = createNativeStackNavigator<SoloStackParamList>();

/**
 * Stack da aba "Solo" — jogos individuais de lógica.
 * Telas de jogo (Shikaku) são registradas conforme são desenvolvidas.
 */
export function SoloNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="SoloHome"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: cores.fundo },
        animation: 'slide_from_right',
        animationDuration: 250,
      }}
    >
      <Stack.Screen name="SoloHome" component={TelaSoloHome} />
      <Stack.Screen name="SelecaoShikaku" component={TelaSelecaoShikaku} />
      <Stack.Screen
        name="Shikaku"
        component={TelaShikaku}
        options={{ animation: 'fade_from_bottom', animationDuration: 220 }}
      />
      <Stack.Screen
        name="SelecaoCodigoSecreto"
        component={TelaSelecaoCodigoSecreto}
      />
      <Stack.Screen
        name="CodigoSecreto"
        component={TelaCodigoSecreto}
        options={{ animation: 'fade_from_bottom', animationDuration: 220 }}
      />
    </Stack.Navigator>
  );
}
