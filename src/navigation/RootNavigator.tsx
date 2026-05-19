import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import type { RootStackParamList } from '@/navigation/types';
import { GameScreen } from '@/screens/GameScreen';
import { GameScreenMostLikely } from '@/screens/GameScreenMostLikely';
import { GameScreenNaPontaDaLingua } from '@/screens/GameScreenNaPontaDaLingua';
import { TelaCadastroJogadores } from '@/screens/TelaCadastroJogadores';
import { TelaConfiguracaoJogo } from '@/screens/TelaConfiguracaoJogo';
import { TelaConfiguracaoLocal } from '@/screens/TelaConfiguracaoLocal';
import { TelaConfiguracaoLocalMostLikely } from '@/screens/TelaConfiguracaoLocalMostLikely';
import { TelaConfiguracaoLocalNaPontaDaLingua } from '@/screens/TelaConfiguracaoLocalNaPontaDaLingua';
import { TelaJogoLocalMostLikely } from '@/screens/TelaJogoLocalMostLikely';
import { TelaJogoLocalNaPontaDaLingua } from '@/screens/TelaJogoLocalNaPontaDaLingua';
import { TelaConfiguracaoMostLikely } from '@/screens/TelaConfiguracaoMostLikely';
import { TelaCriarSala } from '@/screens/TelaCriarSala';
import { TelaDetalhesJogo } from '@/screens/TelaDetalhesJogo';
import { TelaEntrarSala } from '@/screens/TelaEntrarSala';
import { TelaInicio } from '@/screens/TelaInicio';
import { TelaIntro } from '@/screens/TelaIntro';
import { TelaJogoLocal } from '@/screens/TelaJogoLocal';
import { TelaLobby } from '@/screens/TelaLobby';
import { TelaSelecaoDinamica } from '@/screens/TelaSelecaoDinamica';
import { TelaSelecaoJogo } from '@/screens/TelaSelecaoJogo';
import { TelaTutorial } from '@/screens/TelaTutorial';
import { cores } from '@/theme/colors';

// Dispatcher de gameplay: roteia para o GameScreen correto pelo jogoId.
// Mr White mantém comportamento idêntico — o novo código só é atingido por 'most-likely-to'.
function GameScreenGateway({
  route,
  navigation,
}: NativeStackScreenProps<RootStackParamList, 'Game'>) {
  const { jogoId, roomCode, jogadorId } = route.params;

  if (jogoId === 'most-likely-to') {
    return (
      <GameScreenMostLikely
        roomCode={roomCode}
        jogoId={jogoId}
        jogadorId={jogadorId}
        onJogarDeNovo={() => navigation.navigate('SelecaoDinamica', { jogoId })}
        onVoltar={() => navigation.navigate('SelecaoJogo')}
      />
    );
  }

  if (jogoId === 'na-ponta-da-lingua') {
    return <GameScreenNaPontaDaLingua route={route} navigation={navigation} />;
  }

  return <GameScreen route={route} navigation={navigation} />;
}

// Dispatcher de configuração: roteia para a tela de config correta pelo jogoId.
// TelaConfiguracaoJogo (Mr White) fica intacta — só 'most-likely-to' desvia.
function ConfiguracaoJogoGateway({
  route,
  navigation,
}: NativeStackScreenProps<RootStackParamList, 'ConfiguracaoJogo'>) {
  if (route.params.jogoId === 'most-likely-to') {
    return <TelaConfiguracaoMostLikely route={route} navigation={navigation} />;
  }
  return <TelaConfiguracaoJogo route={route} navigation={navigation} />;
}

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Intro"
      screenOptions={{
        headerStyle: { backgroundColor: cores.fundo },
        headerTintColor: cores.primaria,
        headerTitleStyle: {
          color: cores.texto,
          fontWeight: '700',
        },
        headerBackTitleVisible: false,
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
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Lobby"
        component={TelaLobby}
        options={{ title: 'Sala de Espera', headerBackVisible: false }}
      />
      <Stack.Screen
        name="ConfiguracaoJogo"
        component={ConfiguracaoJogoGateway}
        options={{ title: 'Configurar' }}
      />
      <Stack.Screen
        name="Game"
        component={GameScreenGateway}
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
      <Stack.Screen
        name="ConfiguracaoLocalMostLikely"
        component={TelaConfiguracaoLocalMostLikely}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="JogoLocalMostLikely"
        component={TelaJogoLocalMostLikely}
        options={{
          headerShown: false,
          animation: 'fade_from_bottom',
          animationDuration: 400,
        }}
      />
      <Stack.Screen
        name="ConfiguracaoLocalNaPontaDaLingua"
        component={TelaConfiguracaoLocalNaPontaDaLingua}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="JogoLocalNaPontaDaLingua"
        component={TelaJogoLocalNaPontaDaLingua}
        options={{
          headerShown: false,
          animation: 'fade_from_bottom',
          animationDuration: 400,
        }}
      />
    </Stack.Navigator>
  );
}
