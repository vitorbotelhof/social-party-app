import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  BotaoEncerrarJogo,
  BotaoPrimario,
  CombinadoDeConforto,
  FeedbackSessao,
} from '@/components';
import {
  calcularFase,
  getCategoria,
  selecionarCartaVD,
  type CartaVD,
  type CategoriaVDId,
  type IntensidadeVD,
  type TipoCartaVD,
} from '@/games/verdade-desafio';
import type { RootStackParamList } from '@/navigation/types';
import {
  processarResultadoVerdadeDesafio,
  processarTurnoVerdadeDesafio,
} from '@/session/verdadeDesafioLocalAdapter';
import { cores, espacamento, familias, raio, tipografia } from '@/theme/colors';

type Props = NativeStackScreenProps<
  RootStackParamList,
  'JogoLocalVerdadeDesafio'
>;

// ─── Cores ───────────────────────────────────────────────────────────────────
const COR_VERDADE = '#3B82F6'; // azul — revelação, confiança
const COR_DESAFIO = '#EF4444'; // vermelho — ação, coragem
const COR_VD = '#6366F1'; // índigo — identidade geral do jogo
const COR_VD_FUNDO = 'rgba(99, 102, 241, 0.10)';
const COR_VERDADE_FUNDO = 'rgba(59, 130, 246, 0.08)';
const COR_DESAFIO_FUNDO = 'rgba(239, 68, 68, 0.08)';
const COR_VERDADE_BORDA = 'rgba(59, 130, 246, 0.35)';
const COR_DESAFIO_BORDA = 'rgba(239, 68, 68, 0.35)';

type SubFase = 'escolhendo' | 'executando';
interface TurnoRegistrado {
  jogadorId: string;
  tipo: TipoCartaVD;
  resultado: 'cumpriu' | 'passou';
}

function labelIntensidade(i: IntensidadeVD): string {
  const labels: Record<IntensidadeVD, string> = {
    leve: 'leve',
    social: 'social',
    pesado: 'pesado',
    caotico: 'caótico',
  };
  return labels[i];
}

function corIntensidade(i: IntensidadeVD): string {
  const c: Record<IntensidadeVD, string> = {
    leve: '#22C55E',
    social: '#4D7CFE',
    pesado: COR_VD,
    caotico: COR_DESAFIO,
  };
  return c[i];
}

// ─── Componente principal ─────────────────────────────────────────────────────
export function TelaJogoLocalVerdadeDesafio({ navigation, route }: Props) {
  const { jogadores, intensidade, categorias, incluirMais18, voltas } =
    route.params;

  const [indiceTurno, setIndiceTurno] = useState(0);
  const [totalTurnos, setTotalTurnos] = useState(0);
  const [cartasUsadas, setCartasUsadas] = useState<string[]>([]);
  const [subFase, setSubFase] = useState<SubFase>('escolhendo');
  const [tipoEscolhido, setTipoEscolhido] = useState<TipoCartaVD | null>(null);
  const [cartaAtual, setCartaAtual] = useState<CartaVD | null>(null);
  const [turnosRegistrados, setTurnosRegistrados] = useState<TurnoRegistrado[]>(
    [],
  );
  const [finalizado, setFinalizado] = useState(false);
  const resultadoProcessado = useRef(false);
  const iniciouEm = useRef(Date.now());
  const interacaoBloqueada = useRef(false);

  // Animações do card
  const opacidadeCard = useRef(new Animated.Value(0)).current;
  const translateYCard = useRef(new Animated.Value(30)).current;
  const escalaCard = useRef(new Animated.Value(0.96)).current;

  // Animação dos botões de escolha
  const opacidadeEscolha = useRef(new Animated.Value(1)).current;

  const jogadorAtual = jogadores[indiceTurno % jogadores.length];
  const fase = calcularFase(totalTurnos);
  const metaTurnos = jogadores.length * voltas;

  function animarEntradaCard(onComplete?: () => void) {
    opacidadeCard.setValue(0);
    translateYCard.setValue(30);
    escalaCard.setValue(0.96);

    Animated.parallel([
      Animated.timing(opacidadeCard, {
        toValue: 1,
        duration: 260,
        useNativeDriver: true,
      }),
      Animated.spring(translateYCard, {
        toValue: 0,
        damping: 22,
        stiffness: 260,
        useNativeDriver: true,
      }),
      Animated.spring(escalaCard, {
        toValue: 1,
        damping: 22,
        stiffness: 260,
        useNativeDriver: true,
      }),
    ]).start(onComplete);
  }

  function animarSaidaCard(cb: () => void) {
    Animated.parallel([
      Animated.timing(opacidadeCard, {
        toValue: 0,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(translateYCard, {
        toValue: -20,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start(cb);
  }

  function escolherTipo(tipo: TipoCartaVD) {
    if (interacaoBloqueada.current) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const carta = selecionarCartaVD(
      tipo,
      cartasUsadas,
      categorias as CategoriaVDId[] | 'todas',
      intensidade as IntensidadeVD | 'todas',
      incluirMais18,
      totalTurnos,
    );
    if (!carta) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    interacaoBloqueada.current = true;

    // Anima botões saindo
    Animated.timing(opacidadeEscolha, {
      toValue: 0,
      duration: 100,
      useNativeDriver: true,
    }).start(() => {
      setTipoEscolhido(tipo);
      setCartaAtual(carta);
      setSubFase('executando');
      animarEntradaCard(() => {
        interacaoBloqueada.current = false;
      });
    });
  }

  function resolverTurno(resultado: 'cumpriu' | 'passou') {
    if (!tipoEscolhido || !jogadorAtual) return;
    if (interacaoBloqueada.current) return;
    interacaoBloqueada.current = true;
    void Haptics.impactAsync(
      resultado === 'cumpriu'
        ? Haptics.ImpactFeedbackStyle.Light
        : Haptics.ImpactFeedbackStyle.Rigid,
    );

    const novasUsadas = cartaAtual
      ? [...cartasUsadas, cartaAtual.id]
      : cartasUsadas;
    const turno: TurnoRegistrado = {
      jogadorId: jogadorAtual.id,
      tipo: tipoEscolhido,
      resultado,
    };
    const turnosAtualizados = [...turnosRegistrados, turno];
    setTurnosRegistrados(turnosAtualizados);
    processarTurnoVerdadeDesafio(turno);
    animarSaidaCard(() => {
      setCartasUsadas(novasUsadas);
      if (turnosAtualizados.length >= metaTurnos) {
        finalizarPartida(turnosAtualizados);
        return;
      }
      setTotalTurnos((t) => t + 1);
      setIndiceTurno((i) => (i + 1) % jogadores.length);
      setSubFase('escolhendo');
      setTipoEscolhido(null);
      setCartaAtual(null);
      opacidadeEscolha.setValue(1);
      interacaoBloqueada.current = false;
    });
  }

  function finalizarPartida(turnos = turnosRegistrados) {
    if (!resultadoProcessado.current) {
      resultadoProcessado.current = true;
      const desafiosCumpridosPorJogador = new Map<string, number>();
      for (const turno of turnos) {
        if (turno.tipo === 'desafio' && turno.resultado === 'cumpriu') {
          desafiosCumpridosPorJogador.set(
            turno.jogadorId,
            (desafiosCumpridosPorJogador.get(turno.jogadorId) ?? 0) + 1,
          );
        }
      }
      const ranking = [...desafiosCumpridosPorJogador.entries()].sort(
        (a, b) => b[1] - a[1],
      );
      const jogadorMaisCorajosoId =
        ranking.length > 0 && ranking[0]![1] > (ranking[1]?.[1] ?? -1)
          ? ranking[0]![0]
          : null;
      processarResultadoVerdadeDesafio({
        totalTurnos: turnos.length,
        verdadesEscolhidas: turnos.filter((turno) => turno.tipo === 'verdade')
          .length,
        desafiosEscolhidos: turnos.filter((turno) => turno.tipo === 'desafio')
          .length,
        desafiosCumpridos: turnos.filter(
          (turno) => turno.tipo === 'desafio' && turno.resultado === 'cumpriu',
        ).length,
        cartasPassadas: turnos.filter((turno) => turno.resultado === 'passou')
          .length,
        jogadorMaisCorajosoId,
        categorias: categorias === 'todas' ? ['todas'] : categorias,
        duracaoMs: Date.now() - iniciouEm.current,
        duracaoMediaTurnoMs:
          turnos.length > 0
            ? Math.round((Date.now() - iniciouEm.current) / turnos.length)
            : 0,
      });
    }
    setFinalizado(true);
  }

  const categoria = cartaAtual ? getCategoria(cartaAtual.categoria) : null;
  const corTipo = tipoEscolhido === 'verdade' ? COR_VERDADE : COR_DESAFIO;
  const fundoTipo =
    tipoEscolhido === 'verdade' ? COR_VERDADE_FUNDO : COR_DESAFIO_FUNDO;

  if (finalizado) {
    const desafios = turnosRegistrados.filter(
      (turno) => turno.tipo === 'desafio',
    );
    const cumpridos = desafios.filter(
      (turno) => turno.resultado === 'cumpriu',
    ).length;
    return (
      <SafeAreaView style={estilos.tela} edges={['top', 'bottom']}>
        <View style={estilos.final}>
          <Text style={estilos.finalLabel}>fim de partida</Text>
          <Text style={estilos.finalTitulo}>coragem na medida certa.</Text>
          <Text style={estilos.finalResumo}>
            {turnosRegistrados.length}{' '}
            {turnosRegistrados.length === 1 ? 'turno jogado' : 'turnos jogados'}
            {desafios.length > 0 ? ` · ${cumpridos} desafios cumpridos` : ''}
          </Text>
          <FeedbackSessao jogoId="verdade-desafio" />
          <BotaoPrimario
            titulo="escolher outro jogo"
            onPress={() => navigation.navigate('Inicio')}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={estilos.tela} edges={['top', 'bottom']}>
      <BotaoEncerrarJogo onConfirmar={finalizarPartida} />
      {/* Header */}
      <View style={estilos.header}>
        <View style={estilos.headerEspaco} />
        <View style={estilos.headerCentro}>
          <Text style={estilos.turnosTexto}>
            {totalTurnos > 0
              ? `turno ${totalTurnos + 1} de ${metaTurnos}`
              : `turno 1 de ${metaTurnos}`}
          </Text>
        </View>
        <View style={estilos.headerEspaco} />
      </View>

      {/* Nome do jogador da vez */}
      <View style={estilos.jogadorContainer}>
        <Text style={estilos.jogadorLabel}>vez de</Text>
        <Text style={estilos.jogadorNome} numberOfLines={1}>
          {jogadorAtual?.nome ?? ''}
        </Text>
        {/* Indicador de fase (4 segmentos) */}
        <View style={estilos.faseBar}>
          {(['aquecimento', 'subida', 'pico', 'release'] as const).map(
            (f, idx) => (
              <View
                key={f}
                style={[
                  estilos.faseSegmento,
                  (fase === 'aquecimento' && idx === 0) ||
                  (fase === 'subida' && idx <= 1) ||
                  (fase === 'pico' && idx <= 2) ||
                  fase === 'release'
                    ? estilos.faseSegmentoAtivo
                    : null,
                ]}
              />
            ),
          )}
        </View>
      </View>

      {/* ── FASE ESCOLHENDO ── */}
      {subFase === 'escolhendo' && (
        <Animated.View
          style={[estilos.areaEscolha, { opacity: opacidadeEscolha }]}
        >
          <Text style={estilos.perguntaEscolha}>o que vai ser?</Text>
          <CombinadoDeConforto
            compacto
            texto="passar é permitido, sem penalidade e sem justificativa."
          />

          <View style={estilos.botoesEscolha}>
            {/* Verdade */}
            <Pressable
              onPress={() => escolherTipo('verdade')}
              style={({ pressed }) => [
                estilos.botaoEscolha,
                estilos.botaoVerdade,
                pressed && estilos.botaoEscolhaPressionado,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Escolher Verdade"
            >
              <Text style={estilos.botaoEscolhaEmoji}>💬</Text>
              <Text
                style={[estilos.botaoEscolhaTitulo, { color: COR_VERDADE }]}
              >
                Verdade
              </Text>
              <Text style={estilos.botaoEscolhaSubtitulo}>
                confissão honesta
              </Text>
            </Pressable>

            {/* Desafio */}
            <Pressable
              onPress={() => escolherTipo('desafio')}
              style={({ pressed }) => [
                estilos.botaoEscolha,
                estilos.botaoDesafio,
                pressed && estilos.botaoEscolhaPressionado,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Escolher Desafio"
            >
              <Text style={estilos.botaoEscolhaEmoji}>⚡</Text>
              <Text
                style={[estilos.botaoEscolhaTitulo, { color: COR_DESAFIO }]}
              >
                Desafio
              </Text>
              <Text style={estilos.botaoEscolhaSubtitulo}>
                missão pra cumprir
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      )}

      {/* ── FASE EXECUTANDO ── */}
      {subFase === 'executando' && (
        <Animated.View
          style={[
            estilos.areaCard,
            {
              opacity: opacidadeCard,
              transform: [
                { translateY: translateYCard },
                { scale: escalaCard },
              ],
            },
          ]}
        >
          {/* Tipo badge */}
          <View
            style={[
              estilos.tipoBadge,
              { backgroundColor: fundoTipo, borderColor: corTipo + '55' },
            ]}
          >
            <Text style={[estilos.tipoBadgeTexto, { color: corTipo }]}>
              {tipoEscolhido === 'verdade' ? '💬 Verdade' : '⚡ Desafio'}
            </Text>
          </View>

          {/* Texto da carta */}
          <View style={estilos.card}>
            {cartaAtual ? (
              <>
                <Text
                  style={estilos.cartaTexto}
                  adjustsFontSizeToFit
                  minimumFontScale={0.55}
                >
                  {cartaAtual.texto}
                </Text>

                {/* Metadados */}
                <View style={estilos.metadados}>
                  {categoria && (
                    <View style={estilos.chipCategoria}>
                      <Text style={estilos.chipEmoji}>{categoria.emoji}</Text>
                      <Text style={estilos.chipNome}>{categoria.nome}</Text>
                    </View>
                  )}
                  <View
                    style={[
                      estilos.chipIntensidade,
                      {
                        backgroundColor:
                          corIntensidade(cartaAtual.intensidade) + '18',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        estilos.chipIntensidadeTexto,
                        { color: corIntensidade(cartaAtual.intensidade) },
                      ]}
                    >
                      {labelIntensidade(cartaAtual.intensidade)}
                    </Text>
                  </View>
                  {cartaAtual.mais18 && (
                    <View style={estilos.chip18}>
                      <Text style={estilos.chip18Texto}>+18</Text>
                    </View>
                  )}
                </View>
              </>
            ) : (
              <Text style={estilos.semCartas}>
                nenhuma carta disponível com as configurações atuais.
              </Text>
            )}
          </View>

          {/* Ações de resolução */}
          <View style={estilos.acoesResolucao}>
            <Pressable
              onPress={() => resolverTurno('passou')}
              style={({ pressed }) => [
                estilos.botaoPassou,
                pressed && estilos.pressionado,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Passou"
            >
              <Text style={estilos.botaoPassouTexto}>passou</Text>
            </Pressable>
            <Pressable
              onPress={() => resolverTurno('cumpriu')}
              style={({ pressed }) => [
                estilos.botaoCumpriu,
                { backgroundColor: corTipo },
                pressed && estilos.pressionado,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Cumpriu"
            >
              <Text style={estilos.botaoCumpriuTexto}>cumpriu ✓</Text>
            </Pressable>
          </View>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  acoesResolucao: {
    flexDirection: 'row',
    gap: espacamento.sm,
    paddingBottom: espacamento.lg,
    paddingHorizontal: espacamento.lg,
    paddingTop: espacamento.sm,
  },
  areaCard: {
    flex: 1,
    gap: espacamento.sm,
  },
  areaEscolha: {
    alignItems: 'center',
    flex: 1,
    gap: espacamento.lg,
    justifyContent: 'center',
    paddingHorizontal: espacamento.lg,
    paddingVertical: espacamento.xl,
  },
  botaoDesafio: {
    borderColor: COR_DESAFIO_BORDA,
  },
  botaoEscolha: {
    alignItems: 'center',
    backgroundColor: cores.superficie,
    borderRadius: 20,
    borderWidth: 1.5,
    flex: 1,
    gap: 6,
    minHeight: 160,
    paddingHorizontal: espacamento.md,
    paddingVertical: espacamento.xl,
    shadowColor: cores.texto,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  botaoEscolhaEmoji: {
    fontSize: 36,
  },
  botaoEscolhaPressionado: {
    opacity: 0.8,
    transform: [{ scale: 0.97 }],
  },
  botaoEscolhaSubtitulo: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoMicro,
    textAlign: 'center',
  },
  botaoEscolhaTitulo: {
    fontFamily: familias.sans,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  botaoPassou: {
    alignItems: 'center',
    backgroundColor: cores.superficie,
    borderColor: cores.borda,
    borderRadius: raio.lg,
    borderWidth: 1,
    flex: 1,
    height: 56,
    justifyContent: 'center',
  },
  botaoPassouTexto: {
    color: cores.textoSecundario,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpo,
    fontWeight: tipografia.pesoBold,
  },
  botaoCumpriu: {
    alignItems: 'center',
    borderRadius: raio.lg,
    flex: 2,
    height: 56,
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 5,
  },
  botaoCumpriuTexto: {
    color: cores.textoSobrePrimaria,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpo,
    fontWeight: tipografia.pesoExtraBold,
    letterSpacing: 0.3,
  },
  botaoVerdade: {
    borderColor: COR_VERDADE_BORDA,
  },
  botoesEscolha: {
    flexDirection: 'row',
    gap: espacamento.md,
    width: '100%',
  },
  card: {
    backgroundColor: cores.superficie,
    borderColor: cores.borda,
    borderRadius: 22,
    borderWidth: 1,
    flex: 1,
    gap: espacamento.lg,
    justifyContent: 'space-between',
    marginHorizontal: espacamento.lg,
    padding: espacamento.xl,
    shadowColor: cores.texto,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 2,
  },
  cartaTexto: {
    color: cores.texto,
    flex: 1,
    fontFamily: familias.sans,
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.4,
    lineHeight: 32,
  },
  chip18: {
    alignItems: 'center',
    backgroundColor: COR_VD_FUNDO,
    borderRadius: raio.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  chip18Texto: {
    color: COR_VD,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoMicro,
    fontWeight: tipografia.pesoBold,
  },
  chipCategoria: {
    alignItems: 'center',
    backgroundColor: cores.superficieElevada,
    borderColor: cores.borda,
    borderRadius: raio.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  chipEmoji: {
    fontSize: 13,
  },
  chipIntensidade: {
    alignItems: 'center',
    borderRadius: raio.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  chipIntensidadeTexto: {
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoMicro,
    fontWeight: tipografia.pesoBold,
  },
  chipNome: {
    color: cores.textoSecundario,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoMicro,
    fontWeight: tipografia.pesoBold,
  },
  faseBar: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 6,
  },
  final: {
    flex: 1,
    gap: espacamento.lg,
    justifyContent: 'center',
    padding: espacamento.xl,
  },
  finalLabel: {
    color: COR_VD,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLabelSecao,
    fontWeight: tipografia.pesoExtraBold,
    textTransform: 'uppercase',
  },
  finalResumo: {
    color: cores.textoSecundario,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpo,
    lineHeight: 24,
  },
  finalTitulo: {
    color: cores.texto,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoTituloGrande,
    fontWeight: tipografia.pesoExtraBold,
  },
  faseSegmento: {
    backgroundColor: cores.borda,
    borderRadius: 3,
    flex: 1,
    height: 3,
  },
  faseSegmentoAtivo: {
    backgroundColor: COR_VD,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: espacamento.lg,
    paddingVertical: espacamento.md,
  },
  headerCentro: {
    alignItems: 'center',
    flex: 1,
  },
  headerEspaco: {
    height: 36,
    width: 36,
  },
  jogadorContainer: {
    alignItems: 'center',
    borderBottomColor: cores.borda,
    borderBottomWidth: 1,
    paddingBottom: espacamento.lg,
    paddingHorizontal: espacamento.lg,
    paddingTop: espacamento.sm,
  },
  jogadorLabel: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  jogadorNome: {
    color: cores.texto,
    fontFamily: familias.sans,
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.8,
    marginTop: 2,
    textAlign: 'center',
  },
  metadados: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  perguntaEscolha: {
    color: cores.textoSecundario,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpoMenor,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  pressionado: {
    opacity: 0.75,
    transform: [{ scale: 0.98 }],
  },
  semCartas: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpo,
    textAlign: 'center',
  },
  tela: {
    backgroundColor: cores.fundo,
    flex: 1,
  },
  tipoBadge: {
    alignSelf: 'center',
    borderRadius: raio.pill,
    borderWidth: 1,
    marginTop: espacamento.md,
    paddingHorizontal: 16,
    paddingVertical: 7,
  },
  tipoBadgeTexto: {
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    fontWeight: tipografia.pesoExtraBold,
    letterSpacing: 0.3,
  },
  turnosTexto: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    fontWeight: tipografia.pesoBold,
  },
});
