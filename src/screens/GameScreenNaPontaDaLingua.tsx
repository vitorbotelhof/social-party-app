/**
 * GameScreenNaPontaDaLingua — multiplayer realtime screen.
 *
 * Modes per device:
 *   ativo   — this jogadorId is the current describer; sees word + forbidden + timer + actions
 *   observador — sees timer running + player name + intensity visual
 *
 * Timer: driven by prazoTurnoEm (server Unix ms), not local state,
 * so all devices stay synced. Any device dispatches tempo_esgotado
 * when the deadline passes; the engine ignores duplicates.
 */

import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { TelaCarregamento } from '@/components';
import type { GameState, Player, PlayerId } from '@/engine/types';
import type {
  Carta,
  IntensidadeVisual,
  NPLPrivateState,
  NPLPublicState,
} from '@/games/na-ponta-da-lingua/types';
import { calcularIntensidade } from '@/games/na-ponta-da-lingua/types';
import type { RootStackParamList } from '@/navigation/types';
import {
  inicializarAudio,
  liberarAudio,
  iniciarDrone,
  pararDrone,
  setIntensidadeDrone,
  tocarTick,
  tocarFalha,
  tocarAcerto,
} from '@/games/na-ponta-da-lingua/audioEngine';
import { criarAcao, despacharAcao } from '@/services/gameActions';
import { setPartidaAtiva } from '@/services/partidaAtiva';
import { configurarPresenca } from '@/services/presenca';
import { observarEstadoDoJogo, observarJogadores } from '@/services/roomService';
import { cores, espacamento, familias, raio, tipografia } from '@/theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Game'>;
type EstadoNPL = GameState<NPLPublicState, NPLPrivateState>;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function nomePorId(jogadores: Player[], id: PlayerId | null): string {
  if (!id) return '...';
  return jogadores.find((j) => j.id === id)?.nome ?? '...';
}

function corIntensidade(nivel: IntensidadeVisual): string {
  switch (nivel) {
    case 'calmo':   return cores.textoMudo;
    case 'pressao': return cores.acento;
    case 'panico':  return cores.acentoQuente;
    case 'colapso': return cores.erro;
  }
}

function labelIntensidade(nivel: IntensidadeVisual): string {
  switch (nivel) {
    case 'calmo':   return 'calmo';
    case 'pressao': return 'pressão';
    case 'panico':  return 'pânico';
    case 'colapso': return 'colapso';
  }
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export function GameScreenNaPontaDaLingua({ navigation, route }: Props) {
  const { roomCode, jogoId, jogadorId } = route.params;

  const [estado, setEstado] = useState<EstadoNPL | null>(null);
  const [jogadores, setJogadores] = useState<Player[]>([]);
  const [tempoRestanteMs, setTempoRestanteMs] = useState<number>(0);
  const tempoEsgotadoDespachado = useRef(false);

  // ── Firebase observation ────────────────────────────────────────────────────

  useEffect(
    () =>
      observarEstadoDoJogo(roomCode, (e) => {
        setEstado(e as EstadoNPL | null);
      }),
    [roomCode],
  );

  useEffect(() => observarJogadores(roomCode, setJogadores), [roomCode]);

  useEffect(() => {
    setPartidaAtiva({ roomCode, jogoId, jogadorId });
    return () => setPartidaAtiva(null);
  }, [roomCode, jogoId, jogadorId]);

  useEffect(
    () => configurarPresenca(roomCode, jogadorId),
    [roomCode, jogadorId],
  );

  // ── Back-to-lobby guard ─────────────────────────────────────────────────────

  useEffect(() => {
    if (estado?.fase === 'lobby') {
      navigation.replace('Lobby', { roomCode, jogoId, jogadorId });
    }
  }, [estado?.fase, navigation, roomCode, jogoId, jogadorId]);

  // ── Audio lifecycle ─────────────────────────────────────────────────────────

  useEffect(() => {
    void inicializarAudio();
    return () => { void liberarAudio(); };
  }, []);

  // ── Client-side timer from server deadline ──────────────────────────────────

  useEffect(() => {
    const pub = estado?.estadoPublico;
    if (!pub || pub.subFase !== 'jogando' || !pub.prazoTurnoEm) {
      setTempoRestanteMs(0);
      tempoEsgotadoDespachado.current = false;
      return;
    }

    const prazo = pub.prazoTurnoEm;

    const tick = setInterval(() => {
      const restante = Math.max(0, prazo - Date.now());
      setTempoRestanteMs(restante);

      if (restante === 0 && !tempoEsgotadoDespachado.current) {
        tempoEsgotadoDespachado.current = true;
        void despacharAcao(
          roomCode,
          jogoId,
          criarAcao('tempo_esgotado', jogadorId, {}),
        );
      }
    }, 100);

    // Seed immediately
    setTempoRestanteMs(Math.max(0, prazo - Date.now()));

    return () => clearInterval(tick);
  }, [estado?.estadoPublico.subFase, estado?.estadoPublico.prazoTurnoEm, roomCode, jogoId, jogadorId]);

  // ── Derived state ───────────────────────────────────────────────────────────

  const pub = estado?.estadoPublico;
  const jogadorAtualId = pub?.ordemJogadores[pub.indiceTurno] ?? null;
  const estatico = jogadorAtualId === jogadorId;
  const duracaoMs = (pub?.duracaoSegundos ?? 60) * 1000;
  const intensidade = pub?.subFase === 'jogando'
    ? calcularIntensidade(tempoRestanteMs / duracaoMs)
    : 'calmo';

  // Private card — only visible if this device is the active player
  const carta: Carta | null =
    estatico && pub?.subFase === 'jogando'
      ? (estado?.estadosPrivados[jogadorId]?.carta ?? null)
      : null;

  // ── Dispatchers ─────────────────────────────────────────────────────────────

  function despachar(tipo: string) {
    void despacharAcao(roomCode, jogoId, criarAcao(tipo, jogadorId, {}));
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  if (!estado || !pub) {
    return <TelaCarregamento mensagem="Carregando partida..." />;
  }

  switch (pub.subFase) {
    case 'preparando':
      return (
        <FasePreparando
          eAtivo={estatico}
          nomeAtivo={nomePorId(jogadores, jogadorAtualId)}
          turnoAtual={pub.turnosJogados + 1}
          totalTurnos={pub.totalTurnos}
          onPronto={() => despachar('pronto')}
        />
      );

    case 'jogando':
      return (
        <FaseJogando
          eAtivo={estatico}
          carta={carta}
          nomeAtivo={nomePorId(jogadores, jogadorAtualId)}
          tempoRestanteMs={tempoRestanteMs}
          intensidade={intensidade}
          acertosTurno={pub.acertosTurnoAtual}
          onAcertou={() => {
            void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            void tocarAcerto();
            despachar('acertou');
          }}
          onPassou={() => {
            // Medium impact — dismissal, not a hit
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            void tocarFalha();
            despachar('passou');
          }}
        />
      );

    case 'resumo_turno':
      return (
        <FaseResumoTurno
          eAtivo={estatico}
          nomeAtivo={nomePorId(jogadores, jogadorAtualId)}
          acertos={pub.acertosTurnoAtual}
          passou={pub.passousTurnoAtual}
          melhorStreak={pub.melhorStreakTurnoAtual}
          historicoPalavras={pub.historicoTurnoAtual}
          onAvancar={estatico ? () => despachar('avancar') : undefined}
        />
      );

    case 'finalizado':
      return (
        <FaseFinalizado
          jogadores={jogadores}
          pontos={pub.pontos}
          jogadorId={jogadorId}
          onVoltar={() => navigation.navigate('SelecaoJogo')}
        />
      );

    default:
      return <TelaCarregamento mensagem="..." />;
  }
}

// ─── FasePreparando ────────────────────────────────────────────────────────────

function FasePreparando({
  eAtivo, nomeAtivo, turnoAtual, totalTurnos, onPronto,
}: {
  eAtivo: boolean;
  nomeAtivo: string;
  turnoAtual: number;
  totalTurnos: number;
  onPronto: () => void;
}) {
  const op = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(op, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, [op]);

  return (
    <Animated.View style={[estilos.tela, { opacity: op }]}>
      <Text style={estilos.progresso}>
        turno {turnoAtual} de {totalTurnos}
      </Text>

      {eAtivo ? (
        <>
          <Text style={estilos.preparandoLabel}>sua vez.</Text>
          <Text style={estilos.preparandoSub}>
            pegue o celular. os outros olham para o lado.
          </Text>
          <Pressable
            style={({ pressed }) => [estilos.botaoPronto, pressed && estilos.botaoProntoPressionado]}
            onPress={onPronto}
          >
            <Text style={estilos.botaoProntoTexto}>pronto</Text>
          </Pressable>
        </>
      ) : (
        <>
          <Text style={estilos.preparandoLabel}>{nomeAtivo}</Text>
          <Text style={estilos.preparandoSub}>
            está se preparando.{'\n'}olhem para o outro lado.
          </Text>
          <View style={estilos.aguardandoIndicador}>
            <AguardandoDots />
          </View>
        </>
      )}
    </Animated.View>
  );
}

function AguardandoDots() {
  const dot1 = useRef(new Animated.Value(0.2)).current;
  const dot2 = useRef(new Animated.Value(0.2)).current;
  const dot3 = useRef(new Animated.Value(0.2)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.stagger(200, [
        Animated.sequence([
          Animated.timing(dot1, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(dot1, { toValue: 0.2, duration: 400, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(dot2, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(dot2, { toValue: 0.2, duration: 400, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(dot3, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(dot3, { toValue: 0.2, duration: 400, useNativeDriver: true }),
        ]),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [dot1, dot2, dot3]);

  return (
    <View style={estilos.dots}>
      {([dot1, dot2, dot3] as Animated.Value[]).map((d, i) => (
        <Animated.View key={i} style={[estilos.dot, { opacity: d }]} />
      ))}
    </View>
  );
}

// ─── FaseJogando ───────────────────────────────────────────────────────────────

function FaseJogando({
  eAtivo, carta, nomeAtivo, tempoRestanteMs,
  intensidade, acertosTurno, onAcertou, onPassou,
}: {
  eAtivo: boolean;
  carta: Carta | null;
  nomeAtivo: string;
  tempoRestanteMs: number;
  intensidade: IntensidadeVisual;
  acertosTurno: number;
  onAcertou: () => void;
  onPassou: () => void;
}) {
  const seg = Math.ceil(tempoRestanteMs / 1000);
  const corTimer = corIntensidade(intensidade);

  const timerScale = useRef(new Animated.Value(1)).current;
  const timerOp = useRef(new Animated.Value(1)).current;
  const ultimoSegRef = useRef(seg);
  const droneIniciado = useRef(false);

  // Drone audio lifecycle
  useEffect(() => {
    if (!droneIniciado.current) {
      droneIniciado.current = true;
      void iniciarDrone();
    }
    return () => { void pararDrone(); };
  }, []);

  // Intensity → drone volume
  useEffect(() => {
    void setIntensidadeDrone(intensidade);
  }, [intensidade]);

  // Timer tick pulse + audio tick
  useEffect(() => {
    if (seg !== ultimoSegRef.current && tempoRestanteMs > 0) {
      ultimoSegRef.current = seg;
      if (seg <= 12 && intensidade !== 'calmo') {
        void tocarTick();
      }
      timerScale.setValue(1.08);
      timerOp.setValue(1);
      Animated.parallel([
        Animated.spring(timerScale, { toValue: 1, useNativeDriver: true, tension: 80, friction: 6 }),
        Animated.timing(timerOp, { toValue: intensidade === 'colapso' ? 0.7 : 1, duration: 400, useNativeDriver: true }),
      ]).start();
    }
  }, [seg, tempoRestanteMs, intensidade, timerScale, timerOp]);

  if (eAtivo) {
    return (
      <View style={estilos.tela}>
        {/* Timer */}
        <Animated.Text
          style={[
            estilos.timerGrande,
            { color: corTimer, transform: [{ scale: timerScale }], opacity: timerOp },
          ]}
        >
          {seg}
        </Animated.Text>

        {/* Palavra principal */}
        <View style={estilos.palavraBloco}>
          <Text style={estilos.palavraPrincipal}>
            {carta?.palavra ?? '...'}
          </Text>
        </View>

        {/* Palavras proibidas */}
        {carta && (
          <View style={estilos.proibidasBloco}>
            <Text style={estilos.proibidasLabel}>proibidas</Text>
            <View style={estilos.proibidasLinha}>
              {carta.proibidas.map((p) => (
                <View key={p} style={estilos.proibidaTag}>
                  <Text style={estilos.proibidaTexto}>{p}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Acertos do turno */}
        {acertosTurno > 0 && (
          <Text style={estilos.acertosTurno}>+{acertosTurno}</Text>
        )}

        {/* Ações */}
        <View style={estilos.acoesBloco}>
          <Pressable
            style={({ pressed }) => [estilos.botaoPassou, pressed && estilos.botaoPassouPressionado]}
            onPress={onPassou}
          >
            <Text style={estilos.botaoPassouTexto}>passou</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [estilos.botaoAcertou, pressed && estilos.botaoAcertouPressionado]}
            onPress={onAcertou}
          >
            <Text style={estilos.botaoAcertouTexto}>acertou</Text>
          </Pressable>
        </View>

        {/* Intensity vignette */}
        {(intensidade === 'panico' || intensidade === 'colapso') && (
          <IntensidadeVignette nivel={intensidade} />
        )}
      </View>
    );
  }

  // ── Observer view ───────────────────────────────────────────────────────────
  return (
    <View style={estilos.tela}>
      <Text style={[estilos.observadorIntensidade, { color: corTimer }]}>
        {labelIntensidade(intensidade)}
      </Text>

      <Animated.Text
        style={[
          estilos.timerGrande,
          { color: corTimer, transform: [{ scale: timerScale }], opacity: timerOp },
        ]}
      >
        {seg}
      </Animated.Text>

      <Text style={estilos.observadorNome}>{nomeAtivo}</Text>
      <Text style={estilos.observadorSub}>está descrevendo.</Text>

      {acertosTurno > 0 && (
        <Text style={estilos.observadorAcertos}>
          {acertosTurno} {acertosTurno === 1 ? 'acerto' : 'acertos'}
        </Text>
      )}

      {(intensidade === 'panico' || intensidade === 'colapso') && (
        <IntensidadeVignette nivel={intensidade} />
      )}
    </View>
  );
}

function IntensidadeVignette({ nivel }: { nivel: 'panico' | 'colapso' }) {
  const op = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const target = nivel === 'colapso' ? 0.35 : 0.18;
    Animated.timing(op, { toValue: target, duration: 800, useNativeDriver: true }).start();
  }, [nivel, op]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[estilos.vinheta, { opacity: op }]}
    />
  );
}

// ─── FaseResumoTurno ───────────────────────────────────────────────────────────

function FaseResumoTurno({
  eAtivo, nomeAtivo, acertos, passou, melhorStreak, historicoPalavras, onAvancar,
}: {
  eAtivo: boolean;
  nomeAtivo: string;
  acertos: number;
  passou: number;
  melhorStreak: number;
  historicoPalavras: Array<{ palavra: string; resultado: 'acertou' | 'passou' }>;
  onAvancar?: () => void;
}) {
  const op = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(op, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, damping: 26, mass: 0.8, stiffness: 180, useNativeDriver: true }),
    ]).start();
  }, [op, translateY]);

  return (
    <Animated.View style={[estilos.tela, { opacity: op, transform: [{ translateY }] }]}>
      <Text style={estilos.resumoTitulo}>
        {eAtivo ? 'seu turno acabou.' : `vez de ${nomeAtivo}.`}
      </Text>

      {/* Numbers */}
      <View style={estilos.resumoNumerosBloco}>
        <View style={estilos.resumoNumeroItem}>
          <Text style={estilos.resumoNumero}>{acertos}</Text>
          <Text style={estilos.resumoNumeroLabel}>acertos</Text>
        </View>
        <View style={estilos.resumoSeparador} />
        <View style={estilos.resumoNumeroItem}>
          <Text style={estilos.resumoNumero}>{passou}</Text>
          <Text style={estilos.resumoNumeroLabel}>passados</Text>
        </View>
        {melhorStreak >= 2 && (
          <>
            <View style={estilos.resumoSeparador} />
            <View style={estilos.resumoNumeroItem}>
              <Text style={[estilos.resumoNumero, { color: cores.acento }]}>{melhorStreak}</Text>
              <Text style={estilos.resumoNumeroLabel}>streak</Text>
            </View>
          </>
        )}
      </View>

      {/* Word list */}
      {historicoPalavras.length > 0 && (
        <ScrollView style={estilos.historicoScroll} showsVerticalScrollIndicator={false}>
          {historicoPalavras.map((item, i) => (
            <View key={i} style={estilos.historicoItem}>
              <View
                style={[
                  estilos.historicoIndicador,
                  { backgroundColor: item.resultado === 'acertou' ? cores.sucesso : cores.textoMudo },
                ]}
              />
              <Text
                style={[
                  estilos.historicoPalavra,
                  item.resultado === 'passou' && estilos.historicoPalavraPassou,
                ]}
              >
                {item.palavra}
              </Text>
            </View>
          ))}
        </ScrollView>
      )}

      {onAvancar && (
        <Pressable
          style={({ pressed }) => [estilos.botaoProximo, pressed && estilos.botaoProximoPressionado]}
          onPress={onAvancar}
        >
          <Text style={estilos.botaoProximoTexto}>próximo</Text>
        </Pressable>
      )}

      {!onAvancar && (
        <Text style={estilos.aguardandoProximo}>
          aguardando {nomeAtivo} avançar...
        </Text>
      )}
    </Animated.View>
  );
}

// ─── FaseFinalizado ────────────────────────────────────────────────────────────

function FaseFinalizado({
  jogadores, pontos, jogadorId, onVoltar,
}: {
  jogadores: Player[];
  pontos: Record<PlayerId, number>;
  jogadorId: PlayerId;
  onVoltar: () => void;
}) {
  const op = useRef(new Animated.Value(0)).current;
  const tituloY = useRef(new Animated.Value(20)).current;

  const ranking = useMemo(() => {
    return [...jogadores]
      .sort((a, b) => (pontos[b.id] ?? 0) - (pontos[a.id] ?? 0));
  }, [jogadores, pontos]);

  const maxPontos = ranking[0] ? (pontos[ranking[0].id] ?? 0) : 0;
  const vencedores = ranking.filter((j) => (pontos[j.id] ?? 0) === maxPontos);

  useEffect(() => {
    Animated.sequence([
      Animated.delay(200),
      Animated.parallel([
        Animated.timing(op, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.spring(tituloY, { toValue: 0, damping: 24, mass: 0.9, stiffness: 160, useNativeDriver: true }),
      ]),
    ]).start();
  }, [op, tituloY]);

  return (
    <ScrollView
      style={estilos.finalizadoScroll}
      contentContainerStyle={estilos.finalizadoConteudo}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View style={{ opacity: op, transform: [{ translateY: tituloY }] }}>
        {/* Vencedor */}
        {vencedores.length === 1 && (
          <View style={estilos.vencedorBloco}>
            <Text style={estilos.vencedorLabel}>vencedor</Text>
            <Text style={estilos.vencedorNome}>{vencedores[0]?.nome ?? '...'}</Text>
            <Text style={estilos.vencedorPontos}>{maxPontos} acertos</Text>
          </View>
        )}

        {vencedores.length > 1 && (
          <View style={estilos.vencedorBloco}>
            <Text style={estilos.vencedorLabel}>empate</Text>
            {vencedores.map((v) => (
              <Text key={v.id} style={estilos.vencedorNome}>{v.nome}</Text>
            ))}
            <Text style={estilos.vencedorPontos}>{maxPontos} acertos cada</Text>
          </View>
        )}

        <View style={estilos.hairline} />

        {/* Ranking completo */}
        <View style={estilos.rankingBloco}>
          {ranking.map((j, i) => (
            <View key={j.id} style={estilos.rankingItem}>
              <Text style={[estilos.rankingPos, i === 0 && { color: cores.acento }]}>
                {i + 1}
              </Text>
              <Text
                style={[
                  estilos.rankingNome,
                  j.id === jogadorId && { color: cores.acento },
                ]}
              >
                {j.nome}
                {j.id === jogadorId ? ' (você)' : ''}
              </Text>
              <Text style={estilos.rankingPontos}>{pontos[j.id] ?? 0}</Text>
            </View>
          ))}
        </View>

        {/* Only host can restart — for now both can exit */}
        <Pressable
          style={({ pressed }) => [estilos.botaoVoltar, pressed && estilos.botaoVoltarPressionado]}
          onPress={onVoltar}
        >
          <Text style={estilos.botaoVoltarTexto}>voltar aos jogos</Text>
        </Pressable>
      </Animated.View>
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const estilos = StyleSheet.create({
  // Layout base
  tela: {
    alignItems: 'center',
    backgroundColor: cores.fundo,
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: espacamento.lg,
    paddingVertical: espacamento.xl,
  },

  // Progresso
  progresso: {
    color: cores.textoMudo,
    fontFamily: familias.serifItalico,
    fontSize: tipografia.tamanhoLegenda,
    letterSpacing: tipografia.spacingLeve,
    marginBottom: espacamento.xxl,
    textAlign: 'center',
  },

  // Preparando
  preparandoLabel: {
    color: cores.texto,
    fontFamily: familias.serifDisplay,
    fontSize: tipografia.tamanhoTitulo,
    letterSpacing: tipografia.spacingTitulo,
    marginBottom: espacamento.md,
    textAlign: 'center',
  },
  preparandoSub: {
    color: cores.textoSecundario,
    fontFamily: familias.serifItalico,
    fontSize: tipografia.tamanhoCorpoMenor,
    lineHeight: 22,
    marginBottom: espacamento.xxl,
    textAlign: 'center',
  },
  aguardandoIndicador: {
    marginTop: espacamento.md,
  },
  dots: {
    flexDirection: 'row',
    gap: espacamento.sm,
  },
  dot: {
    backgroundColor: cores.textoMudo,
    borderRadius: 4,
    height: 8,
    width: 8,
  },

  // Botão pronto
  botaoPronto: {
    backgroundColor: cores.primaria,
    borderRadius: raio.pill,
    paddingHorizontal: espacamento.xxl,
    paddingVertical: espacamento.md,
  },
  botaoProntoPressionado: {
    backgroundColor: cores.primariaPressionada,
  },
  botaoProntoTexto: {
    color: cores.textoSobrePrimaria,
    fontFamily: familias.serifDisplay,
    fontSize: tipografia.tamanhoCorpoMaior,
    letterSpacing: tipografia.spacingLeve,
  },

  // Timer
  timerGrande: {
    fontFamily: familias.serifDisplay,
    fontSize: tipografia.tamanhoHero,
    letterSpacing: tipografia.spacingHero,
    lineHeight: 56,
    marginBottom: espacamento.lg,
    textAlign: 'center',
  },

  // Observer
  observadorIntensidade: {
    fontFamily: familias.serifItalico,
    fontSize: tipografia.tamanhoLegenda,
    letterSpacing: tipografia.spacingLabel,
    marginBottom: espacamento.sm,
    textAlign: 'center',
    textTransform: 'lowercase',
  },
  observadorNome: {
    color: cores.texto,
    fontFamily: familias.serifDisplay,
    fontSize: tipografia.tamanhoSubtituloGrande,
    letterSpacing: tipografia.spacingTitulo,
    marginBottom: espacamento.xs,
    textAlign: 'center',
  },
  observadorSub: {
    color: cores.textoMudo,
    fontFamily: familias.serifItalico,
    fontSize: tipografia.tamanhoCorpoMenor,
    marginBottom: espacamento.lg,
    textAlign: 'center',
  },
  observadorAcertos: {
    color: cores.sucesso,
    fontFamily: familias.serifDisplay,
    fontSize: tipografia.tamanhoCorpo,
    letterSpacing: tipografia.spacingLeve,
    marginTop: espacamento.md,
    textAlign: 'center',
  },

  // Palavra
  palavraBloco: {
    alignItems: 'center',
    marginBottom: espacamento.lg,
    marginTop: espacamento.sm,
  },
  palavraPrincipal: {
    color: cores.texto,
    fontFamily: familias.serifDisplay,
    fontSize: tipografia.tamanhoTituloGrande,
    letterSpacing: tipografia.spacingTitulo,
    textAlign: 'center',
  },

  // Proibidas
  proibidasBloco: {
    alignItems: 'center',
    marginBottom: espacamento.xl,
    width: '100%',
  },
  proibidasLabel: {
    color: cores.textoMudo,
    fontFamily: familias.serifItalico,
    fontSize: tipografia.tamanhoMicro,
    letterSpacing: tipografia.spacingLabel,
    marginBottom: espacamento.sm,
    textAlign: 'center',
    textTransform: 'lowercase',
  },
  proibidasLinha: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: espacamento.sm,
    justifyContent: 'center',
  },
  proibidaTag: {
    backgroundColor: 'rgba(232,106,90,0.1)',
    borderColor: 'rgba(232,106,90,0.25)',
    borderRadius: raio.sm,
    borderWidth: 1,
    paddingHorizontal: espacamento.sm,
    paddingVertical: espacamento.xs,
  },
  proibidaTexto: {
    color: cores.erro,
    fontFamily: familias.serifDisplay,
    fontSize: tipografia.tamanhoCorpoMenor,
    letterSpacing: tipografia.spacingLeve,
  },

  // Acertos em tempo real
  acertosTurno: {
    color: cores.sucesso,
    fontFamily: familias.serifDisplay,
    fontSize: tipografia.tamanhoSubtitulo,
    letterSpacing: tipografia.spacingTitulo,
    marginBottom: espacamento.md,
  },

  // Ações
  acoesBloco: {
    flexDirection: 'row',
    gap: espacamento.md,
    marginTop: espacamento.sm,
    width: '100%',
  },
  botaoPassou: {
    alignItems: 'center',
    borderColor: cores.borda,
    borderRadius: raio.lg,
    borderWidth: 1,
    flex: 1,
    paddingVertical: espacamento.md,
  },
  botaoPassouPressionado: {
    backgroundColor: cores.superficie,
  },
  botaoPassouTexto: {
    color: cores.textoSecundario,
    fontFamily: familias.serifDisplay,
    fontSize: tipografia.tamanhoCorpoMaior,
    letterSpacing: tipografia.spacingLeve,
  },
  botaoAcertou: {
    alignItems: 'center',
    backgroundColor: cores.primaria,
    borderRadius: raio.lg,
    flex: 2,
    paddingVertical: espacamento.md,
  },
  botaoAcertouPressionado: {
    backgroundColor: cores.primariaPressionada,
  },
  botaoAcertouTexto: {
    color: cores.textoSobrePrimaria,
    fontFamily: familias.serifDisplay,
    fontSize: tipografia.tamanhoCorpoMaior,
    letterSpacing: tipografia.spacingLeve,
  },

  // Vinheta intensidade
  vinheta: {
    backgroundColor: cores.erro,
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },

  // Resumo turno
  resumoTitulo: {
    color: cores.texto,
    fontFamily: familias.serifDisplay,
    fontSize: tipografia.tamanhoTitulo,
    letterSpacing: tipografia.spacingTitulo,
    marginBottom: espacamento.xl,
    textAlign: 'center',
  },
  resumoNumerosBloco: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: espacamento.xl,
  },
  resumoNumeroItem: {
    alignItems: 'center',
    minWidth: 64,
  },
  resumoNumero: {
    color: cores.texto,
    fontFamily: familias.serifDisplay,
    fontSize: tipografia.tamanhoTituloGrande,
    letterSpacing: tipografia.spacingTitulo,
  },
  resumoNumeroLabel: {
    color: cores.textoMudo,
    fontFamily: familias.serifItalico,
    fontSize: tipografia.tamanhoMicro,
    letterSpacing: tipografia.spacingLeve,
    marginTop: 2,
  },
  resumoSeparador: {
    backgroundColor: cores.borda,
    height: 32,
    marginHorizontal: espacamento.md,
    width: 1,
  },
  historicoScroll: {
    alignSelf: 'stretch',
    maxHeight: 220,
    marginBottom: espacamento.lg,
  },
  historicoItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: espacamento.sm,
    paddingVertical: 6,
  },
  historicoIndicador: {
    borderRadius: 3,
    height: 6,
    width: 6,
  },
  historicoPalavra: {
    color: cores.texto,
    fontFamily: familias.serifDisplay,
    fontSize: tipografia.tamanhoCorpo,
    letterSpacing: tipografia.spacingLeve,
  },
  historicoPalavraPassou: {
    color: cores.textoMudo,
    textDecorationLine: 'line-through',
  },
  botaoProximo: {
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: cores.primaria,
    borderRadius: raio.pill,
    paddingVertical: espacamento.md,
  },
  botaoProximoPressionado: {
    backgroundColor: cores.primariaPressionada,
  },
  botaoProximoTexto: {
    color: cores.textoSobrePrimaria,
    fontFamily: familias.serifDisplay,
    fontSize: tipografia.tamanhoCorpoMaior,
    letterSpacing: tipografia.spacingLeve,
  },
  aguardandoProximo: {
    color: cores.textoMudo,
    fontFamily: familias.serifItalico,
    fontSize: tipografia.tamanhoCorpoMenor,
    marginTop: espacamento.md,
    textAlign: 'center',
  },

  // Finalizado
  finalizadoScroll: {
    backgroundColor: cores.fundo,
    flex: 1,
  },
  finalizadoConteudo: {
    alignItems: 'center',
    padding: espacamento.lg,
    paddingBottom: espacamento.xxl,
    paddingTop: espacamento.xxl,
  },
  vencedorBloco: {
    alignItems: 'center',
    marginBottom: espacamento.xl,
  },
  vencedorLabel: {
    color: cores.textoMudo,
    fontFamily: familias.serifItalico,
    fontSize: tipografia.tamanhoLegenda,
    letterSpacing: tipografia.spacingLabel,
    marginBottom: espacamento.sm,
    textAlign: 'center',
  },
  vencedorNome: {
    color: cores.acento,
    fontFamily: familias.serifDisplay,
    fontSize: tipografia.tamanhoTituloGrande,
    letterSpacing: tipografia.spacingTitulo,
    textAlign: 'center',
  },
  vencedorPontos: {
    color: cores.textoSecundario,
    fontFamily: familias.serifItalico,
    fontSize: tipografia.tamanhoCorpoMenor,
    marginTop: espacamento.xs,
    textAlign: 'center',
  },
  hairline: {
    alignSelf: 'stretch',
    backgroundColor: cores.borda,
    height: 1,
    marginBottom: espacamento.xl,
  },
  rankingBloco: {
    alignSelf: 'stretch',
    gap: espacamento.sm,
    marginBottom: espacamento.xxl,
  },
  rankingItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: espacamento.md,
    paddingVertical: espacamento.sm,
  },
  rankingPos: {
    color: cores.textoMudo,
    fontFamily: familias.serifDisplay,
    fontSize: tipografia.tamanhoCorpoMenor,
    minWidth: 24,
    textAlign: 'center',
  },
  rankingNome: {
    color: cores.texto,
    flex: 1,
    fontFamily: familias.serifDisplay,
    fontSize: tipografia.tamanhoCorpo,
    letterSpacing: tipografia.spacingLeve,
  },
  rankingPontos: {
    color: cores.textoSecundario,
    fontFamily: familias.serifDisplay,
    fontSize: tipografia.tamanhoCorpoMenor,
    letterSpacing: tipografia.spacingLeve,
  },

  // Voltar
  botaoVoltar: {
    alignItems: 'center',
    alignSelf: 'stretch',
    borderColor: cores.borda,
    borderRadius: raio.pill,
    borderWidth: 1,
    paddingVertical: espacamento.md,
  },
  botaoVoltarPressionado: {
    backgroundColor: cores.superficie,
  },
  botaoVoltarTexto: {
    color: cores.textoSecundario,
    fontFamily: familias.serifDisplay,
    fontSize: tipografia.tamanhoCorpoMenor,
    letterSpacing: tipografia.spacingLeve,
  },
});
