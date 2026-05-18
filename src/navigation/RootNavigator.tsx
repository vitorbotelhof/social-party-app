import { createNativeStackNavigator } from '@react-navigation/native-stack';

import type { RootStackParamList } from '@/navigation/types';
import { GameScreen } from '@/screens/GameScreen';
import { TelaConfiguracaoJogo } from '@/screens/TelaConfiguracaoJogo';
import { TelaCriarSala } from '@/screens/TelaCriarSala';
import { TelaDetalhesJogo } from '@/screens/TelaDetalhesJogo';
import { TelaEntrarSala } from '@/screens/TelaEntrarSala';
import { TelaCadastroJogadores } from '@/screens/TelaCadastroJogadores';
import { TelaConfiguracaoLocal } from '@/screens/TelaConfiguracaoLocal';
import { TelaInicio } from '@/screens/TelaInicio';
import { TelaIntro } from '@/screens/TelaIntro';
import { TelaJogoLocal } from '@/screens/TelaJogoLocal';
import { TelaLobby } from '@/screens/TelaLobby';
import { TelaSelecaoDinamica } from '@/screens/TelaSelecaoDinamica';
import { TelaSelecaoJogo } from '@/screens/TelaSelecaoJogo';
import { TelaTutorial } from '@/screens/TelaTutorial';
import { cores } from '@/theme/colors';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Intro"
      screenOptions={{
        headerStyle: { backgroundColor: cores.fundo },
        // Back button na cor primária (roxo vibrante);
        // título mantém off-white via headerTitleStyle.
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
    >
      <Stack.Screen
        name="Intro"
        component={TelaIntro}
        options={{ headerShown: false, animation: 'none' }}
      />
      <Stack.Screen
        name="Inicio"
        component={TelaInicio}
        options={{ headerShown: false, animation: 'fade', animationDuration: 500 }}
      />
      <Stack.Screen
        name="SelecaoJogo"
        component={TelaSelecaoJogo}
        options={{ title: 'Jogos' }}
      />
      <Stack.Screen
        name="DetalhesJogo"
        component={TelaDetalhesJogo}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="SelecaoDinamica"
        component={TelaSelecaoDinamica}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Tutorial"
        component={TelaTutorial}
        options={{ headerShown: false, animation: 'fade' }}
      />
      <Stack.Screen
        name="CriarSala"
        component={TelaCriarSala}
        options={{ title: 'Sua Sala' }}
      />
      <Stack.Screen
        name="EntrarSala"
        component={TelaEntrarSala}
        options={{ title: 'Entrar' }}
      />
      <Stack.Screen
        name="Lobby"
        component={TelaLobby}
        options={{ title: 'Sala de Espera', headerBackVisible: false }}
      />
      <Stack.Screen
        name="ConfiguracaoJogo"
        component={TelaConfiguracaoJogo}
        options={{ title: 'Configurar' }}
      />
      <Stack.Screen
        name="Game"
        component={GameScreen}
        options={{
          headerShown: false,
          animation: 'fade_from_bottom',
          animationDuration: 400,
        }}
      />
      <Stack.Screen
        name="CadastroJogadores"
        component={TelaCadastroJogadores}
        options={{ title: 'Jogadores' }}
      />
      <Stack.Screen
        name="JogoLocal"
        component={TelaJogoLocal}
        options={{
          headerShown: false,
          animation: 'fade_from_bottom',
          animationDuration: 400,
        }}
      />
      <Stack.Screen
        name="ConfiguracaoLocal"
        component={TelaConfiguracaoLocal}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
