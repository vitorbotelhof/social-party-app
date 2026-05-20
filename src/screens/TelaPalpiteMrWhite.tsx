import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
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
import { cores, espacamento, familias, raio, tipografia } from '@/theme/colors';

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
    return <TelaEspera nomeAdivinhando={nomeAdivinhando} />;
  }

  return <TelaConfronto palpite={palpite} enviando={enviando} onChangePalpite={setPalpite} onEnviar={aoEnviar} />;
}

// ─── Vista dos civis: testemunhando o confronto ──────────────────────────────

function TelaEspera({ nomeAdivinhando }: { nomeAdivinhando: string }) {
  const labelOpacidade = useRef(new Animated.Value(0)).current;
  const labelY = useRef(new Animated.Value(8)).current;
  const hairlineOpacidade = useRef(new Animated.Value(0)).current;
  const nomeOpacidade = useRef(new Animated.Value(0)).current;
  const nomeEscala = useRef(new Animated.Value(0.88)).current;
  const subtextoOpacidade = useRef(new Animated.Value(0)).current;
  const subtextoY = useRef(new Animated.Value(6)).current;
  const animRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    // Reveal rápido em cascata — social momentum, sem suspense cinematográfico
    const entrada = Animated.parallel([
      Animated.parallel([
        Animated.timing(labelOpacidade, { toValue: 1, duration: 240, useNativeDriver: true }),
        Animated.timing(labelY, { toValue: 0, duration: 240, useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.delay(100),
        Animated.timing(hairlineOpacidade, { toValue: 0.4, duration: 220, useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.delay(180),
        Animated.parallel([
          Animated.timing(nomeOpacidade, { toValue: 1, duration: 220, useNativeDriver: true }),
          Animated.spring(nomeEscala, { toValue: 1, useNativeDriver: true, tension: 52, friction: 7 }),
        ]),
      ]),
      Animated.sequence([
        Animated.delay(320),
        Animated.parallel([
          Animated.timing(subtextoOpacidade, { toValue: 1, duration: 240, useNativeDriver: true }),
          Animated.timing(subtextoY, { toValue: 0, duration: 240, useNativeDriver: true }),
        ]),
      ]),
    ]);

    animRef.current = entrada;
    animRef.current.start();

    return () => { animRef.current?.stop(); };
  }, [labelOpacidade, labelY, hairlineOpacidade, nomeOpacidade, nomeEscala, subtextoOpacidade, subtextoY]);

  return (
    <SafeAreaView style={[estilos.tela, estilos.espera]}>
      <IndicadorConexao />
      <BarraAcoesJogo />
      <View style={estilos.esperaBloco}>
        <Animated.Text
          style={[
            estilos.esperaLabel,
            { opacity: labelOpacidade, transform: [{ translateY: labelY }] },
          ]}
        >
          ele ainda tem uma chance.
        </Animated.Text>
        <Animated.View style={[estilos.hairline, { opacity: hairlineOpacidade }]} />
        <Animated.Text
          style={[
            estilos.esperaNome,
            { opacity: nomeOpacidade, transform: [{ scale: nomeEscala }] },
          ]}
        >
          {nomeAdivinhando}
        </Animated.Text>
        <Animated.Text
          style={[
            estilos.esperaSubtexto,
            { opacity: subtextoOpacidade, transform: [{ translateY: subtextoY }] },
          ]}
        >
          tentando adivinhar a palavra.
        </Animated.Text>
      </View>
    </SafeAreaView>
  );
}

// ─── Vista do Mr White: o confronto final ────────────────────────────────────

interface TelaConfrontoProps {
  palpite: string;
  enviando: boolean;
  onChangePalpite: (v: string) => void;
  onEnviar: () => void;
}

function TelaConfronto({ palpite, enviando, onChangePalpite, onEnviar }: TelaConfrontoProps) {
  const opacidadeIntro = useRef(new Animated.Value(0)).current;
  const yIntro = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacidadeIntro, { toValue: 1, duration: 260, useNativeDriver: true }),
      Animated.timing(yIntro, { toValue: 0, duration: 260, useNativeDriver: true }),
    ]).start();
  }, [opacidadeIntro, yIntro]);

  return (
    <SafeAreaView style={estilos.tela} edges={['top', 'bottom']}>
      <IndicadorConexao />
      <BarraAcoesJogo />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={estilos.flex}
      >
        <Animated.View
          style={[
            estilos.introWrapper,
            { opacity: opacidadeIntro, transform: [{ translateY: yIntro }] },
          ]}
        >
          <View style={estilos.cabecalho}>
            <Text style={estilos.confrontoLegenda}>você foi descoberto.</Text>
            <Text style={estilos.confrontoTitulo}>qual é a palavra?</Text>
            <Text style={estilos.confrontoSubtitulo}>acerte e o jogo vira.</Text>
          </View>

          <View style={estilos.corpo}>
            <TextInput
              value={palpite}
              onChangeText={onChangePalpite}
              placeholder="a palavra era..."
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
              titulo={enviando ? 'enviando...' : 'é essa palavra!'}
              carregando={enviando}
              disabled={palpite.trim().length === 0 || enviando}
              onPress={onEnviar}
            />
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  // ── Shared ──
  tela: {
    backgroundColor: cores.fundo,
    flex: 1,
  },
  flex: {
    flex: 1,
  },

  // ── Civil: espera ──
  espera: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  esperaBloco: {
    alignItems: 'center',
    gap: espacamento.md,
    paddingHorizontal: espacamento.lg,
  },
  esperaLabel: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  hairline: {
    backgroundColor: cores.borda,
    height: 1,
    width: 48,
  },
  esperaNome: {
    color: cores.acento,
    fontFamily: familias.sans, fontWeight: '800' as const,
    fontSize: tipografia.tamanhoTituloGrande,
    letterSpacing: 0,
    lineHeight: 44,
    textAlign: 'center',
  },
  esperaSubtexto: {
    color: cores.textoSecundario,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpoMenor,
    letterSpacing: 0.2,
    lineHeight: 22,
    textAlign: 'center',
  },

  // ── Mr White: confronto ──
  introWrapper: {
    flex: 1,
  },
  cabecalho: {
    alignItems: 'center',
    paddingHorizontal: espacamento.lg,
    paddingTop: espacamento.xl,
    paddingBottom: espacamento.lg,
  },
  confrontoLegenda: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  confrontoTitulo: {
    color: cores.texto,
    fontFamily: familias.sans, fontWeight: '800' as const,
    fontSize: tipografia.tamanhoTituloGrande,
    letterSpacing: 0,
    lineHeight: 44,
    marginTop: espacamento.sm,
    textAlign: 'center',
  },
  confrontoSubtitulo: {
    color: cores.textoSecundario,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpoMenor,
    letterSpacing: 0.2,
    marginTop: espacamento.sm,
    textAlign: 'center',
  },
  corpo: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: espacamento.lg,
  },
  input: {
    backgroundColor: cores.superficie,
    borderColor: cores.borda,
    borderRadius: raio.md,
    borderWidth: 1,
    color: cores.texto,
    fontFamily: familias.sans, fontWeight: '800' as const,
    fontSize: 28,
    paddingHorizontal: espacamento.md,
    paddingVertical: espacamento.md,
    textAlign: 'center',
  },
  rodape: {
    padding: espacamento.lg,
  },
});
