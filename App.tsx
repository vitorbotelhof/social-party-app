import {
  createNavigationContainerRef,
  NavigationContainer,
} from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { registrarJogosDisponiveis } from '@/games';
import type { RootStackParamList } from '@/navigation/types';
import { RootNavigator } from '@/navigation/RootNavigator';
import { carregarPreferenciaSom } from '@/services/audio';
import { initFirebase } from '@/services/firebase';
import {
  carregarPartida,
  getPartidaAtiva,
  limparPartida,
  salvarPartida,
} from '@/services/partidaAtiva';
import { obterSala } from '@/services/roomService';
import { cores } from '@/theme/colors';

initFirebase();
registrarJogosDisponiveis();
void carregarPreferenciaSom();

const navegacaoRef = createNavigationContainerRef<RootStackParamList>();

const temaNavegacao = {
  dark: true,
  colors: {
    background: cores.fundo,
    border: cores.borda,
    card: cores.fundo,
    notification: cores.primaria,
    primary: cores.primaria,
    text: cores.texto,
  },
  fonts: {
    regular: { fontFamily: 'System', fontWeight: '400' as const },
    medium: { fontFamily: 'System', fontWeight: '500' as const },
    bold: { fontFamily: 'System', fontWeight: '700' as const },
    heavy: { fontFamily: 'System', fontWeight: '900' as const },
  },
};

async function restaurarPartidaSeNecessario(): Promise<void> {
  const dados = await carregarPartida();
  if (!dados) return;
  try {
    const sala = await obterSala(dados.roomCode);
    if (!sala) {
      await limparPartida();
      return;
    }
    // Confirma que o jogador ainda está dentro da sala.
    if (!sala.jogadores?.[dados.jogadorId]) {
      await limparPartida();
      return;
    }
    if (!navegacaoRef.isReady()) return;
    const rota = navegacaoRef.getCurrentRoute()?.name;
    // Evita navegar se já estamos na tela certa.
    if (rota === 'Game' || rota === 'Lobby') return;
    const destino = sala.estado.fase === 'lobby' ? 'Lobby' : 'Game';
    navegacaoRef.navigate(destino, {
      roomCode: dados.roomCode,
      jogoId: sala.jogoId,
      jogadorId: dados.jogadorId,
    });
  } catch {
    await limparPartida();
  }
}

export default function App() {
  const navegacaoPronta = useRef(false);

  useEffect(() => {
    function aoMudarAppState(state: AppStateStatus) {
      if (state === 'background' || state === 'inactive') {
        const ativa = getPartidaAtiva();
        if (ativa) {
          void salvarPartida(ativa);
        } else {
          void limparPartida();
        }
        return;
      }
      if (state === 'active' && navegacaoPronta.current) {
        void restaurarPartidaSeNecessario();
      }
    }

    const sub = AppState.addEventListener('change', aoMudarAppState);
    return () => sub.remove();
  }, []);

  return (
    <SafeAreaProvider>
      <NavigationContainer
        ref={navegacaoRef}
        theme={temaNavegacao}
        onReady={() => {
          navegacaoPronta.current = true;
          void restaurarPartidaSeNecessario();
        }}
      >
        <StatusBar style="light" />
        <RootNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
