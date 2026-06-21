import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  getFocusedRouteNameFromRoute,
  type RouteProp,
} from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { StyleProp, ViewStyle } from 'react-native';
import Svg, { Circle, Rect } from 'react-native-svg';

import type {
  AppStackParamList,
  MainTabParamList,
  RootStackParamList,
} from '@/navigation/types';
import { SoloNavigator } from '@/navigation/SoloNavigator';
import { TelaArquivos } from '@/screens/arquivos/TelaArquivos';
import { TelaConfiguracaoArquivos } from '@/screens/arquivos/TelaConfiguracaoArquivos';
import { TelaInquisicao } from '@/screens/inquisicao/TelaInquisicao';
import { TelaConfiguracaoLocalAlianca } from '@/screens/alianca/local/TelaConfiguracaoLocalAlianca';
import { TelaLocalAlianca } from '@/screens/alianca/local/TelaLocalAlianca';
import { TelaConfiguracaoLocalDuvido } from '@/screens/TelaConfiguracaoLocalDuvido';
import { TelaJogoLocalDuvido } from '@/screens/TelaJogoLocalDuvido';
import { TelaResultadoLocalDuvido } from '@/screens/TelaResultadoLocalDuvido';
import { TelaConfiguracaoLocalEuNunca } from '@/screens/TelaConfiguracaoLocalEuNunca';
import { TelaJogoLocalEuNunca } from '@/screens/TelaJogoLocalEuNunca';
import { TelaConfiguracaoLocalVerdadeDesafio } from '@/screens/TelaConfiguracaoLocalVerdadeDesafio';
import { TelaJogoLocalVerdadeDesafio } from '@/screens/TelaJogoLocalVerdadeDesafio';
import { TelaConfiguracaoLocalQuemNaSala } from '@/screens/TelaConfiguracaoLocalQuemNaSala';
import { TelaJogoLocalQuemNaSala } from '@/screens/TelaJogoLocalQuemNaSala';
import { TelaConfiguracaoLocalDe0a10 } from '@/screens/TelaConfiguracaoLocalDe0a10';
import { TelaJogoLocalDe0a10 } from '@/screens/TelaJogoLocalDe0a10';
import { TelaConfiguracaoLocalSincronia } from '@/screens/TelaConfiguracaoLocalSincronia';
import { TelaJogoLocalSincronia } from '@/screens/TelaJogoLocalSincronia';
import { TelaConfiguracaoLocalNaMesmaPagina } from '@/screens/TelaConfiguracaoLocalNaMesmaPagina';
import { TelaJogoLocalNaMesmaPagina } from '@/screens/TelaJogoLocalNaMesmaPagina';
import { TelaConfiguracaoLocalOperacaoResgate } from '@/screens/TelaConfiguracaoLocalOperacaoResgate';
import { TelaJogoLocalOperacaoResgate } from '@/screens/TelaJogoLocalOperacaoResgate';
import { TelaListaEntrelinhas } from '@/screens/TelaListaEntrelinhas';
import { TelaJogoLocalEntrelinhas } from '@/screens/TelaJogoLocalEntrelinhas';
import { TelaConfiguracaoLocalInquisicao } from '@/screens/inquisicao/local/TelaConfiguracaoLocalInquisicao';
import { TelaLocalInquisicao } from '@/screens/inquisicao/local/TelaLocalInquisicao';
import { TelaConfiguracaoLocalVMC } from '@/screens/voce-me-conhece/local/TelaConfiguracaoLocalVMC';
import { TelaLocalVMC } from '@/screens/voce-me-conhece/local/TelaLocalVMC';
import { GameScreen } from '@/screens/GameScreen';
import { GameScreenMostLikely } from '@/screens/GameScreenMostLikely';
import { GameScreenNaPontaDaLingua } from '@/screens/GameScreenNaPontaDaLingua';
import { TelaCadastroJogadores } from '@/screens/TelaCadastroJogadores';
import { TelaConfiguracaoJogo } from '@/screens/TelaConfiguracaoJogo';
import { TelaConfiguracaoInquisicao } from '@/screens/TelaConfiguracaoInquisicao';
import { TelaConfiguracaoLocal } from '@/screens/TelaConfiguracaoLocal';
import { TelaConfiguracaoLocalMostLikely } from '@/screens/TelaConfiguracaoLocalMostLikely';
import { TelaConfiguracaoLocalFazAi } from '@/screens/TelaConfiguracaoLocalFazAi';
import { TelaConfiguracaoLocalNaPontaDaLingua } from '@/screens/TelaConfiguracaoLocalNaPontaDaLingua';
import { TelaJogoLocalFazAi } from '@/screens/TelaJogoLocalFazAi';
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
        onJogarDeNovo={() => navigation.navigate('Inicio')}
        onVoltar={() => navigation.navigate('SelecaoJogo')}
      />
    );
  }

  if (jogoId === 'na-ponta-da-lingua') {
    return <GameScreenNaPontaDaLingua route={route} navigation={navigation} />;
  }

  if (jogoId === 'inquisicao') {
    return (
      <TelaInquisicao
        roomCode={roomCode}
        jogoId={jogoId}
        jogadorId={jogadorId}
        onJogarDeNovo={() => navigation.navigate('Inicio')}
        onVoltar={() => navigation.navigate('SelecaoJogo')}
      />
    );
  }

  if (jogoId === 'arquivos') {
    return <TelaArquivos route={route} navigation={navigation} />;
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
  if (route.params.jogoId === 'inquisicao') {
    return <TelaConfiguracaoInquisicao route={route} navigation={navigation} />;
  }
  if (route.params.jogoId === 'arquivos') {
    return <TelaConfiguracaoArquivos route={route} navigation={navigation} />;
  }
  return <TelaConfiguracaoJogo route={route} navigation={navigation} />;
}

// Wrapper de tela para o jogo local VMC — extrai params da rota.
function JogoLocalVMCScreen({
  route,
  navigation,
}: NativeStackScreenProps<RootStackParamList, 'JogoLocalVMC'>) {
  const { jogadores, config } = route.params;
  return (
    <TelaLocalVMC
      jogadores={jogadores}
      config={config}
      onVoltar={() => navigation.navigate('Inicio')}
    />
  );
}

// Wrapper de tela para o jogo local Inquisição — extrai params da rota.
function JogoLocalInquisicaoScreen({
  route,
  navigation,
}: NativeStackScreenProps<RootStackParamList, 'JogoLocalInquisicao'>) {
  const { jogadores, config } = route.params;
  return (
    <TelaLocalInquisicao
      jogadores={jogadores}
      config={config}
      onVoltar={() => navigation.navigate('Inicio')}
    />
  );
}

function JogoLocalAliancaScreen({
  route,
  navigation,
}: NativeStackScreenProps<RootStackParamList, 'JogoLocalAlianca'>) {
  const { jogadores, config } = route.params;
  return (
    <TelaLocalAlianca
      jogadores={jogadores}
      config={config}
      onVoltar={() => navigation.navigate('Inicio')}
    />
  );
}

const Stack = createNativeStackNavigator<RootStackParamList>();

// Stack da aba "Social" — contém todo o app de jogos sociais existente.
function SocialNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Inicio"
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
        name="Inicio"
        component={TelaInicio}
        options={{
          headerShown: false,
          animation: 'fade',
          animationDuration: 250,
        }}
      />
      <Stack.Screen
        name="SelecaoJogo"
        component={TelaSelecaoJogo}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="DetalhesJogo"
        component={TelaDetalhesJogo}
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
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="EntrarSala"
        component={TelaEntrarSala}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Lobby"
        component={TelaLobby}
        options={{ headerShown: false, headerBackVisible: false }}
      />
      <Stack.Screen
        name="ConfiguracaoJogo"
        component={ConfiguracaoJogoGateway}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Game"
        component={GameScreenGateway}
        options={{
          headerShown: false,
          animation: 'fade_from_bottom',
          animationDuration: 220,
        }}
      />
      <Stack.Screen
        name="CadastroJogadores"
        component={TelaCadastroJogadores}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="JogoLocal"
        component={TelaJogoLocal}
        options={{
          headerShown: false,
          animation: 'fade_from_bottom',
          animationDuration: 220,
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
          animationDuration: 220,
        }}
      />
      <Stack.Screen
        name="ConfiguracaoLocalNaPontaDaLingua"
        component={TelaConfiguracaoLocalNaPontaDaLingua}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ConfiguracaoLocalInquisicao"
        component={TelaConfiguracaoLocalInquisicao}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ConfiguracaoLocalVMC"
        component={TelaConfiguracaoLocalVMC}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ConfiguracaoLocalFazAi"
        component={TelaConfiguracaoLocalFazAi}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ConfiguracaoLocalAlianca"
        component={TelaConfiguracaoLocalAlianca}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="JogoLocalVMC"
        component={JogoLocalVMCScreen}
        options={{
          headerShown: false,
          animation: 'fade_from_bottom',
          animationDuration: 220,
        }}
      />
      <Stack.Screen
        name="JogoLocalInquisicao"
        component={JogoLocalInquisicaoScreen}
        options={{
          headerShown: false,
          animation: 'fade_from_bottom',
          animationDuration: 220,
        }}
      />
      <Stack.Screen
        name="JogoLocalNaPontaDaLingua"
        component={TelaJogoLocalNaPontaDaLingua}
        options={{
          headerShown: false,
          animation: 'fade_from_bottom',
          animationDuration: 220,
        }}
      />
      <Stack.Screen
        name="JogoLocalFazAi"
        component={TelaJogoLocalFazAi}
        options={{
          headerShown: false,
          animation: 'fade_from_bottom',
          animationDuration: 220,
        }}
      />
      <Stack.Screen
        name="JogoLocalAlianca"
        component={JogoLocalAliancaScreen}
        options={{
          headerShown: false,
          animation: 'fade_from_bottom',
          animationDuration: 220,
        }}
      />
      <Stack.Screen
        name="ConfiguracaoLocalDuvido"
        component={TelaConfiguracaoLocalDuvido}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ConfiguracaoLocalEuNunca"
        component={TelaConfiguracaoLocalEuNunca}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="JogoLocalDuvido"
        component={TelaJogoLocalDuvido}
        options={{
          headerShown: false,
          animation: 'fade_from_bottom',
          animationDuration: 220,
        }}
      />
      <Stack.Screen
        name="ResultadoLocalDuvido"
        component={TelaResultadoLocalDuvido}
        options={{
          headerShown: false,
          animation: 'fade',
          animationDuration: 300,
        }}
      />
      <Stack.Screen
        name="JogoLocalEuNunca"
        component={TelaJogoLocalEuNunca}
        options={{
          headerShown: false,
          animation: 'fade_from_bottom',
          animationDuration: 220,
        }}
      />
      <Stack.Screen
        name="ConfiguracaoLocalVerdadeDesafio"
        component={TelaConfiguracaoLocalVerdadeDesafio}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="JogoLocalVerdadeDesafio"
        component={TelaJogoLocalVerdadeDesafio}
        options={{
          headerShown: false,
          animation: 'fade_from_bottom',
          animationDuration: 220,
        }}
      />
      <Stack.Screen
        name="ConfiguracaoLocalDe0a10"
        component={TelaConfiguracaoLocalDe0a10}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="JogoLocalDe0a10"
        component={TelaJogoLocalDe0a10}
        options={{
          headerShown: false,
          animation: 'fade_from_bottom',
          animationDuration: 220,
        }}
      />
      <Stack.Screen
        name="ConfiguracaoLocalSincronia"
        component={TelaConfiguracaoLocalSincronia}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="JogoLocalSincronia"
        component={TelaJogoLocalSincronia}
        options={{
          headerShown: false,
          animation: 'fade_from_bottom',
          animationDuration: 220,
        }}
      />
      <Stack.Screen
        name="ConfiguracaoLocalNaMesmaPagina"
        component={TelaConfiguracaoLocalNaMesmaPagina}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="JogoLocalNaMesmaPagina"
        component={TelaJogoLocalNaMesmaPagina}
        options={{
          headerShown: false,
          animation: 'fade_from_bottom',
          animationDuration: 220,
        }}
      />
      <Stack.Screen
        name="ConfiguracaoLocalOperacaoResgate"
        component={TelaConfiguracaoLocalOperacaoResgate}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="JogoLocalOperacaoResgate"
        component={TelaJogoLocalOperacaoResgate}
        options={{
          headerShown: false,
          animation: 'fade_from_bottom',
          animationDuration: 220,
        }}
      />
      <Stack.Screen
        name="ListaEntrelinhas"
        component={TelaListaEntrelinhas}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="JogoLocalEntrelinhas"
        component={TelaJogoLocalEntrelinhas}
        options={{
          headerShown: false,
          animation: 'fade_from_bottom',
          animationDuration: 220,
        }}
      />
      <Stack.Screen
        name="ConfiguracaoLocalQuemNaSala"
        component={TelaConfiguracaoLocalQuemNaSala}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="JogoLocalQuemNaSala"
        component={TelaJogoLocalQuemNaSala}
        options={{
          headerShown: false,
          animation: 'fade_from_bottom',
          animationDuration: 220,
        }}
      />
    </Stack.Navigator>
  );
}

// ─── Ícones das abas ──────────────────────────────────────────────────────────

interface IconeAbaProps {
  cor: string;
  tamanho: number;
}

/** Social — duas pessoas (círculos sobrepostos). */
function IconeSocial({ cor, tamanho }: IconeAbaProps) {
  return (
    <Svg width={tamanho} height={tamanho} viewBox="0 0 24 24">
      <Circle cx={9} cy={8} r={3.2} fill={cor} />
      <Circle cx={16} cy={9} r={2.6} fill={cor} opacity={0.55} />
      <Rect x={3} y={13} width={12} height={7} rx={3.5} fill={cor} />
      <Rect
        x={13.5}
        y={14}
        width={8}
        height={6}
        rx={3}
        fill={cor}
        opacity={0.55}
      />
    </Svg>
  );
}

/** Solo — grade de retângulos (lógica/puzzle). */
function IconeSolo({ cor, tamanho }: IconeAbaProps) {
  return (
    <Svg width={tamanho} height={tamanho} viewBox="0 0 24 24">
      <Rect x={3} y={3} width={11} height={7} rx={1.6} fill={cor} />
      <Rect
        x={16}
        y={3}
        width={5}
        height={11}
        rx={1.6}
        fill={cor}
        opacity={0.55}
      />
      <Rect
        x={3}
        y={12}
        width={5}
        height={9}
        rx={1.6}
        fill={cor}
        opacity={0.55}
      />
      <Rect
        x={10}
        y={12}
        width={11}
        height={4}
        rx={1.6}
        fill={cor}
        opacity={0.85}
      />
      <Rect
        x={10}
        y={18}
        width={11}
        height={3}
        rx={1.5}
        fill={cor}
        opacity={0.4}
      />
    </Svg>
  );
}

// ─── Tab bar ──────────────────────────────────────────────────────────────────

const ESTILO_TAB_BAR: ViewStyle = {
  backgroundColor: cores.fundoSecundario,
  borderTopColor: cores.borda,
  borderTopWidth: 1,
  paddingTop: 6,
};

/**
 * A tab bar só aparece nos "hubs" de cada aba. Dentro de um jogo
 * (telas full-screen com rodapés próprios) ela some para não conflitar.
 */
function estiloTabBarPorRota(
  route: RouteProp<MainTabParamList, keyof MainTabParamList>,
  rotasComBarra: string[],
): StyleProp<ViewStyle> {
  const nome = getFocusedRouteNameFromRoute(route) ?? rotasComBarra[0];
  return rotasComBarra.includes(nome) ? ESTILO_TAB_BAR : { display: 'none' };
}

const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="Social"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: cores.primaria,
        tabBarInactiveTintColor: cores.textoMudo,
        tabBarStyle: ESTILO_TAB_BAR,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tab.Screen
        name="Social"
        component={SocialNavigator}
        options={({ route }) => ({
          tabBarLabel: 'Social',
          tabBarIcon: ({ color, size }) => (
            <IconeSocial cor={color} tamanho={size} />
          ),
          tabBarStyle: estiloTabBarPorRota(route, ['Inicio']),
        })}
      />
      <Tab.Screen
        name="Solo"
        component={SoloNavigator}
        options={({ route }) => ({
          tabBarLabel: 'Solo',
          tabBarIcon: ({ color, size }) => (
            <IconeSolo cor={color} tamanho={size} />
          ),
          tabBarStyle: estiloTabBarPorRota(route, [
            'SoloHome',
            'SelecaoShikaku',
          ]),
        })}
      />
    </Tab.Navigator>
  );
}

// ─── Navegador raiz da aplicação ──────────────────────────────────────────────

const AppStack = createNativeStackNavigator<AppStackParamList>();

export function RootNavigator() {
  return (
    <AppStack.Navigator
      initialRouteName="Intro"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: cores.fundo },
      }}
    >
      <AppStack.Screen
        name="Intro"
        component={TelaIntro}
        options={{ animation: 'none' }}
      />
      <AppStack.Screen name="Main" component={MainTabNavigator} />
    </AppStack.Navigator>
  );
}
