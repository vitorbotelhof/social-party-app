import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
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
  PistaDada,
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
    ? (jogadores[adivinhandoId]?.nome ?? 'Mr White')
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
      <TelaEspera
        nomeAdivinhando={nomeAdivinhando}
        pistas={estado.estadoPublico.pistas}
        rodadaAtual={estado.estadoPublico.rodadaVotacao}
        jogadores={jogadores}
      />
    );
  }

  return (
    <TelaConfronto
      palpite={palpite}
      enviando={enviando}
      onChangePalpite={setPalpite}
      onEnviar={aoEnviar}
    />
  );
}

// ─── Vista dos civis: evento coletivo de tensão ───────────────────────────────
// Não é uma sala de espera. É um tribunal silencioso.
// O grupo especula, relembra as dicas, toma partido — sem quebrar o pacing.

interface TelaEsperaProps {
  nomeAdivinhando: string;
  pistas: PistaDada[];
  rodadaAtual: number;
  jogadores: Record<PlayerId, Player>;
}

function TelaEspera({
  nomeAdivinhando,
  pistas,
  rodadaAtual,
  jogadores,
}: TelaEsperaProps) {
  // Especulação local — não vai ao servidor, só engaja o civil no momento
  const [meuVoto, setMeuVoto] = useState<'sim' | 'nao' | null>(null);
  const [mostrarPistas, setMostrarPistas] = useState(false);
  const [mostrarVoto, setMostrarVoto] = useState(false);

  // ── Animated values
  const labelOp = useRef(new Animated.Value(0)).current;
  const labelY = useRef(new Animated.Value(8)).current;
  const nomeOp = useRef(new Animated.Value(0)).current;
  // Starts at 0.9 — springs to 1.0 on entry, then breathes 1.0 ↔ 1.022
  const pulsoEscala = useRef(new Animated.Value(0.9)).current;
  const pensandoOp = useRef(new Animated.Value(0)).current;
  const pistasOp = useRef(new Animated.Value(0)).current;
  const votoOp = useRef(new Animated.Value(0)).current;
  const votoEscala = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    // 1. Label de contexto aparece rápido
    Animated.parallel([
      Animated.timing(labelOp, { toValue: 1, duration: 240, useNativeDriver: true }),
      Animated.timing(labelY, { toValue: 0, duration: 240, useNativeDriver: true }),
    ]).start();

    // 2. Nome do Mr White: spring in + breathing loop contínuo
    const t1 = setTimeout(() => {
      Animated.timing(nomeOp, { toValue: 1, duration: 220, useNativeDriver: true }).start();
      Animated.spring(pulsoEscala, {
        toValue: 1,
        useNativeDriver: true,
        tension: 52,
        friction: 7,
      }).start(() => {
        // Breathing loop — sutil, nunca para
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulsoEscala, {
              toValue: 1.022,
              duration: 1300,
              useNativeDriver: true,
            }),
            Animated.timing(pulsoEscala, {
              toValue: 1.0,
              duration: 1300,
              useNativeDriver: true,
            }),
          ]),
        ).start();
      });
    }, 160);

    // 3. "pensando..." — pisca lentamente, mantém a tela viva
    const t2 = setTimeout(() => {
      Animated.timing(pensandoOp, { toValue: 1, duration: 300, useNativeDriver: true }).start(
        () => {
          Animated.loop(
            Animated.sequence([
              Animated.timing(pensandoOp, {
                toValue: 0.2,
                duration: 1000,
                useNativeDriver: true,
              }),
              Animated.timing(pensandoOp, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
              }),
            ]),
          ).start();
        },
      );
    }, 380);

    // 4. Recap das pistas — contexto que ativa a memória do grupo
    const t3 = setTimeout(() => {
      setMostrarPistas(true);
      Animated.timing(pistasOp, { toValue: 1, duration: 380, useNativeDriver: true }).start();
    }, 1800);

    // 5. Especulação — aparece depois de o grupo ter relembrado as pistas
    const t4 = setTimeout(() => {
      setMostrarVoto(true);
      Animated.parallel([
        Animated.timing(votoOp, { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.spring(votoEscala, {
          toValue: 1,
          useNativeDriver: true,
          speed: 20,
          bounciness: 4,
        }),
      ]).start();
    }, 3800);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pistas da rodada atual — últimas 8, ordem cronológica
  const pistasRodada = pistas
    .filter((p) => p.rodada === rodadaAtual)
    .slice(-8);

  function votar(opcao: 'sim' | 'nao') {
    if (meuVoto !== null) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMeuVoto(opcao);
  }

  return (
    <SafeAreaView style={estilos.tela} edges={['top', 'bottom']}>
      <IndicadorConexao />
      <BarraAcoesJogo />

      <ScrollView
        style={estilos.flex}
        contentContainerStyle={estilos.esperaScroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Contexto da situação */}
        <Animated.Text
          style={[
            estilos.esperaLabel,
            { opacity: labelOp, transform: [{ translateY: labelY }] },
          ]}
        >
          ele ainda tem uma chance.
        </Animated.Text>

        {/* Nome com breathing — indica que algo está acontecendo */}
        <Animated.Text
          style={[
            estilos.esperaNome,
            { opacity: nomeOp, transform: [{ scale: pulsoEscala }] },
          ]}
        >
          {nomeAdivinhando}
        </Animated.Text>

        {/* Indicador de atividade — nunca é uma tela morta */}
        <Animated.Text style={[estilos.pensando, { opacity: pensandoOp }]}>
          pensando...
        </Animated.Text>

        {/* ── Recap das pistas ──────────────────────────────────────────────── */}
        {/* Aparece com delay — dá ao grupo tempo de sentir a tensão antes */}
        {mostrarPistas && pistasRodada.length > 0 && (
          <Animated.View style={[estilos.pistasBloco, { opacity: pistasOp }]}>
            <View style={estilos.divisor} />
            <Text style={estilos.pistasLabel}>o que foi dito nessa rodada</Text>
            {pistasRodada.map((pista, i) => (
              <View key={i} style={estilos.pistaItem}>
                <Text style={estilos.pistaNome} numberOfLines={1}>
                  {jogadores[pista.jogadorId]?.nome ?? '?'}
                </Text>
                <Text style={estilos.pistaTexto} numberOfLines={2}>
                  "{pista.texto}"
                </Text>
              </View>
            ))}
          </Animated.View>
        )}

        {/* ── Especulação local ─────────────────────────────────────────────── */}
        {/* Sem servidor — só engaja o civil no momento presente. */}
        {/* Quando o resultado sair, cada um lembra sua aposta. */}
        {mostrarVoto && (
          <Animated.View
            style={[
              estilos.votoBloco,
              { opacity: votoOp, transform: [{ scale: votoEscala }] },
            ]}
          >
            <View style={estilos.divisor} />
            {meuVoto === null ? (
              <>
                <Text style={estilos.votoPergunta}>você acha que ele sabe?</Text>
                <View style={estilos.votoBotoes}>
                  <Pressable
                    onPress={() => votar('sim')}
                    style={({ pressed }) => [
                      estilos.votoBotao,
                      estilos.votoBotaoSim,
                      pressed && estilos.votoBotaoPressionado,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel="Ele sabe"
                  >
                    <Text style={estilos.votoBotaoSimTexto}>ele sabe.</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => votar('nao')}
                    style={({ pressed }) => [
                      estilos.votoBotao,
                      estilos.votoBotaoNao,
                      pressed && estilos.votoBotaoPressionado,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel="Não faz ideia"
                  >
                    <Text style={estilos.votoBotaoNaoTexto}>não faz ideia.</Text>
                  </Pressable>
                </View>
              </>
            ) : (
              <Text style={estilos.votoFeito}>
                {meuVoto === 'sim'
                  ? 'você apostou que ele sabe. vamos ver.'
                  : 'você apostou que ele não sabe. vamos ver.'}
              </Text>
            )}
          </Animated.View>
        )}
      </ScrollView>
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

function TelaConfronto({
  palpite,
  enviando,
  onChangePalpite,
  onEnviar,
}: TelaConfrontoProps) {
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

  // ── Civil: tensão coletiva ──
  esperaScroll: {
    alignItems: 'center',
    paddingHorizontal: espacamento.lg,
    paddingTop: espacamento.xxl,
    paddingBottom: espacamento.xxl,
  },
  esperaLabel: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    letterSpacing: 0.3,
    marginBottom: espacamento.lg,
    textAlign: 'center',
  },
  esperaNome: {
    color: cores.acento,
    fontFamily: familias.sans,
    fontWeight: '800' as const,
    fontSize: tipografia.tamanhoTituloGrande,
    letterSpacing: 0,
    lineHeight: 44,
    textAlign: 'center',
  },
  pensando: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    letterSpacing: 0.5,
    marginTop: espacamento.md,
    textAlign: 'center',
  },

  // ── Divisor ──
  divisor: {
    alignSelf: 'stretch',
    backgroundColor: cores.borda,
    height: 1,
    marginVertical: espacamento.xl,
  },

  // ── Recap de pistas ──
  pistasBloco: {
    alignSelf: 'stretch',
  },
  pistasLabel: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoMicro,
    fontWeight: tipografia.pesoMedio,
    letterSpacing: 0.3,
    marginBottom: espacamento.md,
    textAlign: 'left',
  },
  pistaItem: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: espacamento.sm,
    marginBottom: espacamento.sm,
  },
  pistaNome: {
    color: cores.textoSecundario,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCaption,
    fontWeight: tipografia.pesoSemibold,
    minWidth: 64,
  },
  pistaTexto: {
    color: cores.texto,
    flex: 1,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCaption,
    fontStyle: 'italic',
    lineHeight: 18,
  },

  // ── Especulação local ──
  votoBloco: {
    alignSelf: 'stretch',
  },
  votoPergunta: {
    color: cores.textoSecundario,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpoMenor,
    fontWeight: tipografia.pesoMedio,
    letterSpacing: 0.2,
    marginBottom: espacamento.md,
    textAlign: 'center',
  },
  votoBotoes: {
    flexDirection: 'row',
    gap: espacamento.sm,
  },
  votoBotao: {
    alignItems: 'center',
    borderRadius: raio.md,
    borderWidth: 1,
    flex: 1,
    paddingVertical: espacamento.md,
  },
  votoBotaoSim: {
    backgroundColor: 'rgba(255, 90, 95, 0.10)',
    borderColor: 'rgba(255, 90, 95, 0.35)',
  },
  votoBotaoNao: {
    backgroundColor: cores.superficieElevada,
    borderColor: cores.borda,
  },
  votoBotaoPressionado: {
    opacity: 0.65,
  },
  votoBotaoSimTexto: {
    color: cores.primaria,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpoMenor,
    fontWeight: tipografia.pesoBold,
  },
  votoBotaoNaoTexto: {
    color: cores.textoSecundario,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpoMenor,
    fontWeight: tipografia.pesoSemibold,
  },
  votoFeito: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpoMenor,
    fontStyle: 'italic',
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
    paddingBottom: espacamento.lg,
    paddingHorizontal: espacamento.lg,
    paddingTop: espacamento.xl,
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
    fontFamily: familias.sans,
    fontWeight: '800' as const,
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
    fontFamily: familias.sans,
    fontWeight: '800' as const,
    fontSize: 28,
    paddingHorizontal: espacamento.md,
    paddingVertical: espacamento.md,
    textAlign: 'center',
  },
  rodape: {
    padding: espacamento.lg,
  },
});
