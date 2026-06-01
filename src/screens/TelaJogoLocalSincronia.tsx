import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  avancarTurno,
  criarEstadoInicial,
  encerrarRodada,
  getRanking,
  iniciarContagem,
  iniciarRodada,
  podeSkip,
  quemAdivinha,
  quemDaDica,
  registrarAcerto,
  registrarInfracao,
  registrarSkip,
  tickContagem,
  totalTurnos,
  turnoAtual,
} from '@/games/sincronia/engine';
import type { ConfiguracaoSincronia, EstadoJogoSincronia } from '@/games/sincronia/types';
import type { RootStackParamList } from '@/navigation/types';
import { cores, espacamento, familias, raio, tipografia } from '@/theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'JogoLocalSincronia'>;

const COR_SINCRONIA = '#0EA5E9';
const COR_ACERTO = '#22C55E';
const COR_INFRACAO = '#EF4444';
const COR_SKIP = '#94A3B8';
const COR_TIMER_OK = '#22C55E';
const COR_TIMER_ATENCAO = '#F59E0B';
const COR_TIMER_CRITICO = '#EF4444';
const INTERVALO_MS = 100;

// ─── Sub-tela: VEZ DE ────────────────────────────────────────────────────────

interface SubTelaVezDeProps {
  estado: EstadoJogoSincronia;
  onProntos: () => void;
  onSair: () => void;
}

function SubTelaVezDe({ estado, onProntos, onSair }: SubTelaVezDeProps) {
  const dupla = estado.duplas[estado.duplaIndice];
  if (!dupla) return null;

  const quemDica = quemDaDica(dupla, estado.voltaAtual);
  const quemAdv = quemAdivinha(dupla, estado.voltaAtual);
  const turno = turnoAtual(estado);
  const total = totalTurnos(estado);

  return (
    <SafeAreaView style={estilos.tela} edges={['top', 'bottom']}>
      <View style={estilos.vezDeContainer}>
        {/* Progresso */}
        <View style={estilos.progressoTopo}>
          <Text style={estilos.progressoTexto}>
            rodada {turno} de {total}
          </Text>
          <Text style={estilos.voltaTexto}>
            volta {estado.voltaAtual}/{estado.config.voltasPorDupla}
          </Text>
        </View>

        {/* Dupla */}
        <View style={estilos.duplaBloco}>
          <Text style={estilos.vezDeLabel}>vez de</Text>
          <Text style={estilos.duplaNome}>
            {dupla.jogador0.nome} + {dupla.jogador1.nome}
          </Text>
        </View>

        {/* Papéis */}
        <View style={estilos.papeisContainer}>
          <View style={estilos.papelCard}>
            <Text style={estilos.papelEmoji}>💬</Text>
            <Text style={estilos.papelRotulo}>dando dicas</Text>
            <Text style={estilos.papelNome}>{quemDica.nome}</Text>
          </View>

          <View style={estilos.papelSeparador}>
            <Text style={estilos.papelSeparadorTexto}>↔</Text>
          </View>

          <View style={estilos.papelCard}>
            <Text style={estilos.papelEmoji}>🎯</Text>
            <Text style={estilos.papelRotulo}>adivinhando</Text>
            <Text style={estilos.papelNome}>{quemAdv.nome}</Text>
          </View>
        </View>

        <Text style={estilos.instrucaoVezDe}>
          {quemDica.nome} vê a palavra. {quemAdv.nome} tenta adivinhar.{'\n'}
          o resto do grupo fica de fora.
        </Text>

        {/* Config rápida */}
        <View style={estilos.configRapida}>
          <Text style={estilos.configRapidaItem}>
            ⏱ {estado.config.duracaoSegundos}s
          </Text>
          <Text style={estilos.configRapidaPonto}>·</Text>
          <Text style={estilos.configRapidaItem}>
            ↩{' '}
            {estado.config.skipsPorRodada === null
              ? '∞'
              : estado.config.skipsPorRodada}{' '}
            pulos
          </Text>
        </View>

        {/* CTA */}
        <Pressable
          onPress={onProntos}
          style={({ pressed }) => [
            estilos.botaoProntos,
            pressed && estilos.botaoProntosPressionado,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Prontos, começar rodada"
        >
          <Text style={estilos.botaoProntosTexto}>prontos — começar</Text>
        </Pressable>

        <Pressable
          onPress={onSair}
          style={estilos.botaoSair}
          accessibilityRole="button"
          accessibilityLabel="Encerrar jogo"
        >
          <Text style={estilos.botaoSairTexto}>encerrar jogo</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

// ─── Sub-tela: CONTAGEM ───────────────────────────────────────────────────────

interface SubTelaContagemProps {
  contagem: number;
}

function SubTelaContagem({ contagem }: SubTelaContagemProps) {
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    scaleAnim.setValue(0.5);
    opacityAnim.setValue(0);
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 20,
        bounciness: 8,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  }, [contagem, opacityAnim, scaleAnim]);

  return (
    <View style={estilos.contagemTela}>
      <Animated.Text
        style={[
          estilos.contagemNumero,
          { transform: [{ scale: scaleAnim }], opacity: opacityAnim },
        ]}
      >
        {contagem}
      </Animated.Text>
      <Text style={estilos.contagemLabel}>preparar...</Text>
    </View>
  );
}

// ─── Sub-tela: RODADA ATIVA ──────────────────────────────────────────────────

interface SubTelaRodadaAtivaProps {
  estado: EstadoJogoSincronia;
  tempoRestante: number;
  larguraBarraAnim: Animated.Value;
  onAcerto: () => void;
  onInfracao: () => void;
  onSkip: () => void;
}

function SubTelaRodadaAtiva({
  estado,
  tempoRestante,
  larguraBarraAnim,
  onAcerto,
  onInfracao,
  onSkip,
}: SubTelaRodadaAtivaProps) {
  const duracaoTotal = estado.config.duracaoSegundos * 1000;
  const proporcao = tempoRestante / duracaoTotal;

  const corBarra =
    proporcao > 0.4
      ? COR_TIMER_OK
      : proporcao > 0.2
        ? COR_TIMER_ATENCAO
        : COR_TIMER_CRITICO;

  const segundos = Math.ceil(tempoRestante / 1000);
  const skipsPossiveis = podeSkip(estado);
  const skipsRestantes =
    estado.config.skipsPorRodada === null
      ? '∞'
      : String(estado.config.skipsPorRodada - estado.skipsUsados);

  const dupla = estado.duplas[estado.duplaIndice];
  const quemDica = dupla ? quemDaDica(dupla, estado.voltaAtual) : null;

  return (
    <SafeAreaView style={estilos.tela} edges={['top', 'bottom']}>
      <View style={estilos.rodadaContainer}>
        {/* Timer bar — usa Animated.Value para transição suave */}
        <View style={estilos.timerBarFundo}>
          <Animated.View
            style={[
              estilos.timerBarPreenchimento,
              { width: larguraBarraAnim, backgroundColor: corBarra },
            ]}
          />
        </View>

        {/* Topo: quem dá dica + acertos */}
        <View style={estilos.rodadaTopo}>
          <View style={estilos.quemDicaBloco}>
            <Text style={estilos.quemDicaLabel}>dando dicas</Text>
            <Text style={estilos.quemDicaNome}>{quemDica?.nome ?? '—'}</Text>
          </View>
          <View style={estilos.acertosBloco}>
            <Text style={estilos.acertosNumero}>{estado.acertosRodada}</Text>
            <Text style={estilos.acertosLabel}>acertos</Text>
          </View>
        </View>

        {/* Palavra */}
        <View style={estilos.palavraContainer}>
          <Text style={estilos.palavraTexto} adjustsFontSizeToFit numberOfLines={1}>
            {estado.palavraAtual ?? '—'}
          </Text>
          <Text style={estilos.timerTexto}>{segundos}s</Text>
        </View>

        {/* Botões */}
        <View style={estilos.botoesContainer}>
          {/* Pular (ghost) */}
          <Pressable
            onPress={onSkip}
            disabled={!skipsPossiveis}
            style={({ pressed }) => [
              estilos.botaoSkip,
              !skipsPossiveis && estilos.botaoDesabilitado,
              pressed && skipsPossiveis && estilos.botaoSkipPressionado,
            ]}
            accessibilityRole="button"
            accessibilityLabel={`Pular palavra. ${skipsRestantes} pulos restantes`}
          >
            <Text
              style={[
                estilos.botaoSkipTexto,
                !skipsPossiveis && estilos.textoDesabilitado,
              ]}
            >
              ↩ pular ({skipsRestantes})
            </Text>
          </Pressable>

          {/* Infração (secondary) */}
          <Pressable
            onPress={onInfracao}
            style={({ pressed }) => [
              estilos.botaoInfracao,
              pressed && estilos.botaoInfracaoPressionado,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Registrar infração"
          >
            <Text style={estilos.botaoInfracaoTexto}>✗ infração</Text>
          </Pressable>

          {/* Acertou (primary/large) */}
          <Pressable
            onPress={onAcerto}
            style={({ pressed }) => [
              estilos.botaoAcerto,
              pressed && estilos.botaoAcertoPressionado,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Registrar acerto"
          >
            <Text style={estilos.botaoAcertoTexto}>✓ acertou</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

// ─── Sub-tela: RESULTADO DA RODADA ───────────────────────────────────────────

interface SubTelaResultadoProps {
  estado: EstadoJogoSincronia;
  onProximo: () => void;
}

function SubTelaResultado({ estado, onProximo }: SubTelaResultadoProps) {
  const resultado = estado.ultimoResultado;
  const dupla = estado.duplas[estado.duplaIndice];
  const ranking = getRanking(estado);
  // Verifica se esta é a última rodada do jogo (próximo avanço encerrará)
  const ehUltimaTurno =
    estado.duplaIndice + 1 >= estado.duplas.length &&
    estado.voltaAtual >= estado.config.voltasPorDupla;
  const proximoLabel = ehUltimaTurno ? 'ver resultado final' : 'próxima dupla';

  if (!resultado || !dupla) return null;

  return (
    <SafeAreaView style={estilos.tela} edges={['top', 'bottom']}>
      <ScrollView
        style={estilos.resultadoScroll}
        contentContainerStyle={estilos.resultadoScrollConteudo}
        showsVerticalScrollIndicator={false}
      >
        {/* Resultado da rodada */}
        <View style={estilos.resultadoHeader}>
          <Text style={estilos.resultadoDuplaLabel}>
            {dupla.jogador0.nome} + {dupla.jogador1.nome}
          </Text>
          <Text style={estilos.resultadoPontos}>
            +{resultado.pontosGanhos} ponto{resultado.pontosGanhos !== 1 ? 's' : ''}
          </Text>
        </View>

        <View style={estilos.resultadoStats}>
          <View style={estilos.statItem}>
            <Text style={[estilos.statNumero, { color: COR_ACERTO }]}>
              {resultado.acertos}
            </Text>
            <Text style={estilos.statLabel}>acertos</Text>
          </View>
          <View style={estilos.statItem}>
            <Text style={[estilos.statNumero, { color: COR_INFRACAO }]}>
              {resultado.infracoes}
            </Text>
            <Text style={estilos.statLabel}>infrações</Text>
          </View>
          <View style={estilos.statItem}>
            <Text style={[estilos.statNumero, { color: COR_SKIP }]}>
              {resultado.skips}
            </Text>
            <Text style={estilos.statLabel}>pulos</Text>
          </View>
        </View>

        {/* Placar completo */}
        <View style={estilos.placarSecao}>
          <Text style={estilos.placarTitulo}>placar geral</Text>
          {ranking.map(({ dupla: d, placar }, index) => {
            const ehAtual = d.id === dupla.id;
            return (
              <View
                key={d.id}
                style={[
                  estilos.placarLinha,
                  ehAtual && estilos.placarLinhaAtual,
                ]}
              >
                <Text style={estilos.placarPosicao}>{index + 1}.</Text>
                <View style={estilos.placarNomes}>
                  <Text
                    style={[
                      estilos.placarNomeTexto,
                      ehAtual && estilos.placarNomeAtual,
                    ]}
                  >
                    {d.jogador0.nome} + {d.jogador1.nome}
                  </Text>
                </View>
                <Text
                  style={[
                    estilos.placarPontos,
                    ehAtual && estilos.placarPontosAtual,
                  ]}
                >
                  {placar.pontos} pts
                </Text>
              </View>
            );
          })}
        </View>

        <Pressable
          onPress={onProximo}
          style={({ pressed }) => [
            estilos.botaoProntos,
            pressed && estilos.botaoProntosPressionado,
          ]}
          accessibilityRole="button"
          accessibilityLabel={proximoLabel}
        >
          <Text style={estilos.botaoProntosTexto}>{proximoLabel}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Sub-tela: ENCERRADO ──────────────────────────────────────────────────────

interface SubTelaEncerradoProps {
  estado: EstadoJogoSincronia;
  onJogarDeNovo: () => void;
  onSair: () => void;
}

function SubTelaEncerrado({
  estado,
  onJogarDeNovo,
  onSair,
}: SubTelaEncerradoProps) {
  const ranking = getRanking(estado);
  const vencedor = ranking[0];

  return (
    <SafeAreaView style={estilos.tela} edges={['top', 'bottom']}>
      <ScrollView
        style={estilos.resultadoScroll}
        contentContainerStyle={estilos.resultadoScrollConteudo}
        showsVerticalScrollIndicator={false}
      >
        <Text style={estilos.encerradoTitulo}>fim de jogo</Text>

        {vencedor && (
          <View style={estilos.vencedorBloco}>
            <Text style={estilos.vencedorLabel}>vencedores</Text>
            <Text style={estilos.vencedorNome}>
              {vencedor.dupla.jogador0.nome} + {vencedor.dupla.jogador1.nome}
            </Text>
            <Text style={estilos.vencedorPontos}>
              {vencedor.placar.pontos} pontos
            </Text>
          </View>
        )}

        <View style={estilos.placarSecao}>
          <Text style={estilos.placarTitulo}>classificação final</Text>
          {ranking.map(({ dupla, placar }, index) => {
            const ehVencedor = index === 0;
            return (
              <View
                key={dupla.id}
                style={[
                  estilos.placarLinha,
                  ehVencedor && estilos.placarLinhaVencedor,
                ]}
              >
                <Text
                  style={[
                    estilos.placarPosicao,
                    ehVencedor && estilos.placarPosicaoVencedor,
                  ]}
                >
                  {index + 1}.
                </Text>
                <View style={estilos.placarNomes}>
                  <Text
                    style={[
                      estilos.placarNomeTexto,
                      ehVencedor && estilos.placarNomeAtual,
                    ]}
                  >
                    {dupla.jogador0.nome} + {dupla.jogador1.nome}
                  </Text>
                  <Text style={estilos.placarSubInfo}>
                    {placar.acertos} acertos · {placar.infracoes} infrações
                  </Text>
                </View>
                <Text
                  style={[
                    estilos.placarPontos,
                    ehVencedor && estilos.placarPontosAtual,
                  ]}
                >
                  {placar.pontos} pts
                </Text>
              </View>
            );
          })}
        </View>

        <View style={estilos.botoesFinais}>
          <Pressable
            onPress={onJogarDeNovo}
            style={({ pressed }) => [
              estilos.botaoProntos,
              pressed && estilos.botaoProntosPressionado,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Jogar de novo"
          >
            <Text style={estilos.botaoProntosTexto}>jogar de novo</Text>
          </Pressable>

          <Pressable
            onPress={onSair}
            style={estilos.botaoSair}
            accessibilityRole="button"
            accessibilityLabel="Sair do jogo"
          >
            <Text style={estilos.botaoSairTexto}>sair</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Tela principal ───────────────────────────────────────────────────────────

export function TelaJogoLocalSincronia({ route, navigation }: Props) {
  const config = route.params as ConfiguracaoSincronia;

  const [estado, setEstado] = useState<EstadoJogoSincronia>(() =>
    criarEstadoInicial(config),
  );
  const [tempoRestante, setTempoRestante] = useState(
    config.duracaoSegundos * 1000,
  );
  const larguraBarraAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const contagemRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const pararTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const pararContagem = useCallback(() => {
    if (contagemRef.current) {
      clearInterval(contagemRef.current);
      contagemRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      pararTimer();
      pararContagem();
    };
  }, [pararTimer, pararContagem]);

  // Timer da rodada ativa
  useEffect(() => {
    if (estado.fase !== 'rodada_ativa') {
      pararTimer();
      larguraBarraAnim.stopAnimation();
      return;
    }

    // Animação suave da barra de progresso: 1 → 0 ao longo de toda a duração
    larguraBarraAnim.setValue(1);
    Animated.timing(larguraBarraAnim, {
      toValue: 0,
      duration: config.duracaoSegundos * 1000,
      useNativeDriver: false, // width não suporta native driver
    }).start();

    setTempoRestante(config.duracaoSegundos * 1000);

    timerRef.current = setInterval(() => {
      setTempoRestante((prev) => {
        const proximo = prev - INTERVALO_MS;
        if (proximo <= 0) {
          clearInterval(timerRef.current!);
          timerRef.current = null;
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          setEstado((e) => {
            const encerrado = encerrarRodada(e);
            return encerrado;
          });
          return 0;
        }
        // Haptic nos últimos 3 segundos
        if (proximo <= 3000 && proximo % 1000 < INTERVALO_MS) {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
        return proximo;
      });
    }, INTERVALO_MS);

    return pararTimer;
  }, [estado.fase, config.duracaoSegundos, pararTimer]);

  function iniciarContagemRegressiva() {
    const novoEstado = iniciarContagem(estado);
    setEstado(novoEstado);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    let valor = 3;
    contagemRef.current = setInterval(() => {
      valor -= 1;
      if (valor <= 0) {
        clearInterval(contagemRef.current!);
        contagemRef.current = null;
        setEstado((e) => iniciarRodada(e));
      } else {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setEstado((e) => tickContagem(e, valor));
      }
    }, 900);
  }

  function aoAcerto() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setEstado((e) => registrarAcerto(e));
  }

  function aoInfracao() {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    setEstado((e) => registrarInfracao(e));
  }

  function aoSkip() {
    const resultado = registrarSkip(estado);
    if (!resultado) return;
    void Haptics.selectionAsync();
    setEstado(resultado);
  }

  function aoProximo() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const proximo = avancarTurno(estado);
    setEstado(proximo);
  }

  function aoJogarDeNovo() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEstado(criarEstadoInicial(config));
    setTempoRestante(config.duracaoSegundos * 1000);
  }

  function aoSair() {
    navigation.navigate('Inicio');
  }

  // ── Render ──
  const { fase } = estado;

  if (fase === 'vez_de') {
    return (
      <SubTelaVezDe
        estado={estado}
        onProntos={iniciarContagemRegressiva}
        onSair={aoSair}
      />
    );
  }

  if (fase === 'contagem') {
    return <SubTelaContagem contagem={estado.contagemAtual ?? 3} />;
  }

  if (fase === 'rodada_ativa') {
    // Converte Animated.Value [0,1] para largura percentual [0%,100%]
    const larguraBarraInterpolada = larguraBarraAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0%', '100%'],
    });
    return (
      <SubTelaRodadaAtiva
        estado={estado}
        tempoRestante={tempoRestante}
        larguraBarraAnim={larguraBarraInterpolada as unknown as Animated.Value}
        onAcerto={aoAcerto}
        onInfracao={aoInfracao}
        onSkip={aoSkip}
      />
    );
  }

  if (fase === 'resultado_rodada') {
    return <SubTelaResultado estado={estado} onProximo={aoProximo} />;
  }

  if (fase === 'encerrado') {
    return (
      <SubTelaEncerrado
        estado={estado}
        onJogarDeNovo={aoJogarDeNovo}
        onSair={aoSair}
      />
    );
  }

  return null;
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const estilos = StyleSheet.create({
  // Shared
  tela: {
    backgroundColor: cores.fundo,
    flex: 1,
  },

  // VEZ DE
  vezDeContainer: {
    flex: 1,
    paddingHorizontal: espacamento.lg,
    paddingTop: espacamento.lg,
    paddingBottom: espacamento.xl,
    gap: espacamento.lg,
  },
  progressoTopo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressoTexto: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
  },
  voltaTexto: {
    color: COR_SINCRONIA,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    fontWeight: '600',
  },
  duplaBloco: {
    alignItems: 'center',
    marginTop: espacamento.md,
  },
  vezDeLabel: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpo,
    marginBottom: 4,
  },
  duplaNome: {
    color: cores.texto,
    fontFamily: familias.sans,
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
  },
  papeisContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacamento.sm,
  },
  papelCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: cores.fundoSecundario,
    borderRadius: raio.md,
    borderWidth: 1,
    borderColor: cores.borda,
    paddingVertical: espacamento.md,
    paddingHorizontal: espacamento.sm,
    gap: 4,
  },
  papelEmoji: {
    fontSize: 28,
  },
  papelRotulo: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
  },
  papelNome: {
    color: cores.texto,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpo,
    fontWeight: '700',
    textAlign: 'center',
  },
  papelSeparador: {
    alignItems: 'center',
    width: 32,
  },
  papelSeparadorTexto: {
    color: cores.textoMudo,
    fontSize: 20,
  },
  instrucaoVezDe: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    lineHeight: 20,
    textAlign: 'center',
  },
  configRapida: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: espacamento.sm,
  },
  configRapidaItem: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
  },
  configRapidaPonto: {
    color: cores.borda,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
  },
  botaoProntos: {
    backgroundColor: COR_SINCRONIA,
    borderRadius: raio.md,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 'auto',
  },
  botaoProntosPressionado: {
    opacity: 0.8,
  },
  botaoProntosTexto: {
    color: '#FFFFFF',
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoSubtitulo,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  botaoSair: {
    alignItems: 'center',
    paddingVertical: espacamento.sm,
  },
  botaoSairTexto: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
  },

  // CONTAGEM
  contagemTela: {
    flex: 1,
    backgroundColor: COR_SINCRONIA,
    alignItems: 'center',
    justifyContent: 'center',
    gap: espacamento.md,
  },
  contagemNumero: {
    color: '#FFFFFF',
    fontFamily: familias.sans,
    fontSize: 120,
    fontWeight: '800',
    lineHeight: 130,
  },
  contagemLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoSubtitulo,
  },

  // RODADA ATIVA
  rodadaContainer: {
    flex: 1,
    paddingBottom: espacamento.xl,
  },
  timerBarFundo: {
    height: 6,
    backgroundColor: cores.borda,
    width: '100%',
  },
  timerBarPreenchimento: {
    height: '100%',
    borderRadius: 0,
  },
  rodadaTopo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: espacamento.lg,
    paddingTop: espacamento.lg,
    paddingBottom: espacamento.sm,
  },
  quemDicaBloco: {
    gap: 2,
  },
  quemDicaLabel: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
  },
  quemDicaNome: {
    color: cores.texto,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpo,
    fontWeight: '700',
  },
  acertosBloco: {
    alignItems: 'flex-end',
    gap: 2,
  },
  acertosNumero: {
    color: COR_ACERTO,
    fontFamily: familias.sans,
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 36,
  },
  acertosLabel: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
  },
  palavraContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: espacamento.lg,
    gap: espacamento.sm,
  },
  palavraTexto: {
    color: cores.texto,
    fontFamily: familias.sans,
    fontSize: 52,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -1,
    lineHeight: 58,
  },
  timerTexto: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoTitulo,
    fontWeight: '700',
    marginTop: espacamento.sm,
  },
  botoesContainer: {
    paddingHorizontal: espacamento.lg,
    gap: espacamento.sm,
  },
  botaoAcerto: {
    backgroundColor: COR_ACERTO,
    borderRadius: raio.md,
    paddingVertical: 20,
    alignItems: 'center',
  },
  botaoAcertoPressionado: {
    opacity: 0.85,
  },
  botaoAcertoTexto: {
    color: '#FFFFFF',
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoTitulo,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  botaoInfracao: {
    backgroundColor: cores.fundoSecundario,
    borderRadius: raio.md,
    borderWidth: 1.5,
    borderColor: COR_INFRACAO,
    paddingVertical: 14,
    alignItems: 'center',
  },
  botaoInfracaoPressionado: {
    opacity: 0.7,
  },
  botaoInfracaoTexto: {
    color: COR_INFRACAO,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoSubtitulo,
    fontWeight: '700',
  },
  botaoSkip: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  botaoSkipPressionado: {
    opacity: 0.6,
  },
  botaoSkipTexto: {
    color: cores.textoSecundario,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpo,
    fontWeight: '600',
  },
  botaoDesabilitado: {
    opacity: 0.35,
  },
  textoDesabilitado: {
    color: cores.textoMudo,
  },

  // RESULTADO
  resultadoScroll: {
    flex: 1,
  },
  resultadoScrollConteudo: {
    padding: espacamento.lg,
    paddingBottom: espacamento.xl * 2,
    gap: espacamento.lg,
  },
  resultadoHeader: {
    alignItems: 'center',
    gap: 4,
    marginTop: espacamento.md,
  },
  resultadoDuplaLabel: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpo,
  },
  resultadoPontos: {
    color: COR_SINCRONIA,
    fontFamily: familias.sans,
    fontSize: 44,
    fontWeight: '800',
    lineHeight: 50,
  },
  resultadoStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: cores.fundoSecundario,
    borderRadius: raio.md,
    borderWidth: 1,
    borderColor: cores.borda,
    paddingVertical: espacamento.md,
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  statNumero: {
    fontFamily: familias.sans,
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 36,
  },
  statLabel: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
  },
  placarSecao: {
    gap: espacamento.xs,
  },
  placarTitulo: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: espacamento.xs,
  },
  placarLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: cores.fundoSecundario,
    borderRadius: raio.sm,
    borderWidth: 1,
    borderColor: cores.borda,
    paddingVertical: 10,
    paddingHorizontal: espacamento.md,
    gap: espacamento.sm,
  },
  placarLinhaAtual: {
    borderColor: COR_SINCRONIA,
    backgroundColor: `${COR_SINCRONIA}10`,
  },
  placarLinhaVencedor: {
    borderColor: '#F59E0B',
    backgroundColor: 'rgba(245,158,11,0.08)',
  },
  placarPosicao: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpo,
    fontWeight: '600',
    width: 24,
  },
  placarPosicaoVencedor: {
    color: '#F59E0B',
  },
  placarNomes: {
    flex: 1,
    gap: 2,
  },
  placarNomeTexto: {
    color: cores.textoSecundario,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpo,
    fontWeight: '600',
  },
  placarNomeAtual: {
    color: cores.texto,
  },
  placarSubInfo: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
  },
  placarPontos: {
    color: cores.textoSecundario,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoSubtitulo,
    fontWeight: '800',
  },
  placarPontosAtual: {
    color: COR_SINCRONIA,
  },

  // ENCERRADO
  encerradoTitulo: {
    color: cores.texto,
    fontFamily: familias.sans,
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: espacamento.md,
  },
  vencedorBloco: {
    alignItems: 'center',
    backgroundColor: 'rgba(245,158,11,0.08)',
    borderRadius: raio.md,
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    paddingVertical: espacamento.lg,
    gap: 4,
  },
  vencedorLabel: {
    color: '#F59E0B',
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  vencedorNome: {
    color: cores.texto,
    fontFamily: familias.sans,
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
  },
  vencedorPontos: {
    color: '#F59E0B',
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoSubtitulo,
    fontWeight: '700',
  },
  botoesFinais: {
    gap: espacamento.sm,
    marginTop: espacamento.md,
  },
});
