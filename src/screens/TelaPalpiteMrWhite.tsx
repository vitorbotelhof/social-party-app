import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  BarraAcoesJogo,
  BotaoPrimario,
  IndicadorConexao,
} from '@/components';
import type {
  GameId,
  GameState,
  Player,
  PlayerId,
  RoomCode,
} from '@/engine/types';
import type {
  MrWhitePrivateState,
  MrWhitePublicState,
} from '@/games/mr-white/types';
import { observarJogadores } from '@/services/roomService';
import { criarAcao, despacharAcao } from '@/services/gameActions';
import { cores, espacamento, raio } from '@/theme/colors';

type EstadoMrWhite = GameState<MrWhitePublicState, MrWhitePrivateState>;

interface Props {
  estado: EstadoMrWhite;
  roomCode: RoomCode;
  jogoId: GameId;
  jogadorId: PlayerId;
}

export function TelaPalpiteMrWhite({
  estado,
  roomCode,
  jogoId,
  jogadorId,
}: Props) {
  const [palpite, setPalpite] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [jogadores, setJogadores] = useState<Record<PlayerId, Player>>({});
  const ultimoCliqueRef = useRef(0);

  useEffect(
    () =>
      observarJogadores(roomCode, (lista) => {
        setJogadores(Object.fromEntries(lista.map((j) => [j.id, j])));
      }),
    [roomCode],
  );

  const adivinhandoId = estado.estadoPublico.jogadorAdivinhandoId;
  const souEu = adivinhandoId === jogadorId;
  const nomeAdivinhando = adivinhandoId
    ? jogadores[adivinhandoId]?.nome ?? 'Mr White'
    : 'Mr White';

  async function aoEnviar() {
    const palavra = palpite.trim();
    if (palavra.length === 0 || enviando) return;
    const agora = Date.now();
    if (agora - ultimoCliqueRef.current < 1000) return;
    ultimoCliqueRef.current = agora;
    setEnviando(true);
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await despacharAcao(
        roomCode,
        jogoId,
        criarAcao('palpite_final', jogadorId, { palavra }),
      );
    } finally {
      setEnviando(false);
    }
  }

  if (!souEu) {
    return (
      <SafeAreaView style={[estilos.tela, estilos.centralizada]}>
        <IndicadorConexao />
        <BarraAcoesJogo />
        <Text style={estilos.legenda}>MR WHITE DESCOBERTO</Text>
        <Text style={estilos.titulo}>{nomeAdivinhando}</Text>
        <Text style={estilos.subtitulo}>
          está tentando adivinhar a palavra dos civis...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={estilos.tela} edges={['top', 'bottom']}>
      <IndicadorConexao />
      <BarraAcoesJogo />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={estilos.flex}
      >
        <View style={estilos.cabecalho}>
          <Text style={estilos.legenda}>VOCÊ FOI DESCOBERTO</Text>
          <Text style={estilos.titulo}>última chance!</Text>
          <Text style={estilos.subtitulo}>
            adivinha qual era a palavra dos civis. acertou, vira o jogo!
          </Text>
        </View>

        <View style={estilos.corpo}>
          <Text style={estilos.rotulo}>seu palpite</Text>
          <TextInput
            value={palpite}
            onChangeText={setPalpite}
            placeholder="digita a palavra..."
            placeholderTextColor={cores.textoMudo}
            autoCapitalize="words"
            autoCorrect={false}
            maxLength={40}
            style={estilos.input}
            autoFocus
          />
        </View>

        <View style={estilos.rodape}>
          <BotaoPrimario
            titulo="é essa palavra!"
            carregando={enviando}
            disabled={palpite.trim().length === 0 || enviando}
            onPress={aoEnviar}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  cabecalho: {
    padding: espacamento.lg,
  },
  centralizada: {
    alignItems: 'center',
    gap: espacamento.md,
    justifyContent: 'center',
    padding: espacamento.lg,
  },
  corpo: {
    flex: 1,
    paddingHorizontal: espacamento.lg,
  },
  flex: {
    flex: 1,
  },
  input: {
    backgroundColor: cores.superficie,
    borderColor: cores.borda,
    borderRadius: raio.md,
    borderWidth: 1,
    color: cores.texto,
    fontSize: 22,
    paddingHorizontal: espacamento.md,
    paddingVertical: espacamento.md,
    textAlign: 'center',
  },
  legenda: {
    color: cores.primaria,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
  },
  rodape: {
    padding: espacamento.lg,
  },
  rotulo: {
    color: cores.textoSecundario,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: espacamento.sm,
    textTransform: 'uppercase',
  },
  subtitulo: {
    color: cores.textoSecundario,
    fontSize: 16,
    marginTop: espacamento.sm,
    textAlign: 'center',
  },
  tela: {
    backgroundColor: cores.fundo,
    flex: 1,
  },
  titulo: {
    color: cores.texto,
    fontSize: 32,
    fontWeight: '900',
    marginTop: espacamento.sm,
    textAlign: 'center',
  },
});
