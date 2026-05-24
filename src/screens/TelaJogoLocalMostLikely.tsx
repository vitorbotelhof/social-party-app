import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BotaoEncerrarJogo } from '@/components';
import { FeedbackSessao } from '@/components/FeedbackSessao';
import { PROMPTS } from '@/games/most-likely-to/prompts';
import type {
  EnergiaPrompt,
  ModoMostLikely,
} from '@/games/most-likely-to/types';
import type { RootStackParamList } from '@/navigation/types';
import { processarResultadoMLT } from '@/session/mltAdapter';
import { cores, espacamento, familias, raio, tipografia } from '@/theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'JogoLocalMostLikely'>;

type Fase =
  | 'prompt'
  | 'apontando'
  | 'selecionar'
  | 'reveal'
  | 'pos_reveal'
  | 'resultado';

interface Jogador {
  id: string;
  nome: string;
}

interface ResultadoRodada {
  prompt: string;
  vencedorId: string | null; // null = empate
}

function selecionarPrompt(
  usados: number[],
  rodada: number,
  modo: ModoMostLikely,
): { texto: string; indice: number } {
  const energias: EnergiaPrompt[] = (() => {
    if (rodada === 1) return ['leve'];
    if (rodada <= 3) return ['leve', 'medio'];
    return modo === 'sincero'
      ? ['leve', 'medio', 'intenso']
      : ['leve', 'medio'];
  })();

  const candidatos = PROMPTS.map((p, i) => ({ p, i })).filter(
    ({ p, i }) => energias.includes(p.energia) && !usados.includes(i),
  );
  const pool =
    candidatos.length > 0
      ? candidatos
      : PROMPTS.map((p, i) => ({ p, i })).filter(({ p }) =>
          energias.includes(p.energia),
        );

  const escolhido = pool[Math.floor(Math.random() * pool.length)]!;
  return { texto: escolhido.p.texto, indice: escolhido.i };
}

export function TelaJogoLocalMostLikely({ navigation, route }: Props) {
  const { jogadores, totalRodadas, modo } = route.params;
  const insets = useSafeAreaInsets();

  const [fase, setFase] = useState<Fase>('prompt');
  const [rodadaAtual, setRodadaAtual] = useState(1);
  const [promptTexto, setPromptTexto] = useState('');
  const [indicesUsados, setIndicesUsados] = useState<number[]>([]);
  const [vencedorId, setVencedorId] = useState<string | null>(null);
  const [foiEmpate, setFoiEmpate] = useState(false);
  const [resultados, setResultados] = useState<ResultadoRodada[]>([]);
  const [posRevealSegundos, setPosRevealSegundos] = useState(30);
  const [posRevealAtivo, setPosRevealAtivo] = useState(false);

  const promptOp = useRef(new Animated.Value(0)).current;
  const nomeOp = useRef(new Animated.Value(0)).current;
  const nomeScale = useRef(new Animated.Value(0.85)).current;
  const cristalizacaoOp = useRef(new Animated.Value(0)).current;
  const proximaOp = useRef(new Animated.Value(0)).current;

  // Inicializa a primeira rodada.
  useEffect(() => {
    const { texto, indice } = selecionarPrompt([], rodadaAtual, modo);
    setPromptTexto(texto);
    setIndicesUsados([indice]);
    Animated.timing(promptOp, {
      toValue: 1,
      duration: 240,
      useNativeDriver: true,
    }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Apontando ────────────────────────────────────────────────────────────

  function irParaApontando() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setFase('apontando');
  }

  function irParaSelecionar() {
    setFase('selecionar');
  }

  // ─── Seleção do vencedor ─────────────────────────────────────────────────

  function selecionarVencedor(jogadorId: string) {
    setVencedorId(jogadorId);
    setFoiEmpate(false);
    revelarResultado(jogadorId, false);
  }

  function declararEmpate() {
    setVencedorId(null);
    setFoiEmpate(true);
    revelarResultado(null, true);
  }

  // ─── Reveal cinematográfico ───────────────────────────────────────────────

  function revelarResultado(_vencedor: string | null, _empate: boolean) {
    setFase('reveal');
    nomeOp.setValue(0);
    nomeScale.setValue(0.85);
    cristalizacaoOp.setValue(0);
    proximaOp.setValue(0);

    // B0: 100ms para o haptic chegar antes do visual
    setTimeout(() => {
      // B1: nome/empate aparece
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Animated.parallel([
        Animated.timing(nomeOp, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.spring(nomeScale, {
          toValue: 1,
          speed: 22,
          bounciness: 4,
          useNativeDriver: true,
        }),
      ]).start();

      // B2: cristalização após 400ms
      setTimeout(() => {
        Animated.timing(cristalizacaoOp, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();

        // B3: "próxima" após 700ms
        setTimeout(() => {
          Animated.timing(proximaOp, {
            toValue: 1,
            duration: 180,
            useNativeDriver: true,
          }).start();
        }, 700);
      }, 400);
    }, 100);
  }

  // ─── Pós-reveal ──────────────────────────────────────────────────────────

  function irParaPosReveal() {
    const novoResultado: ResultadoRodada = {
      prompt: promptTexto,
      vencedorId: foiEmpate ? null : vencedorId,
    };
    setResultados((r) => [...r, novoResultado]);
    setPosRevealSegundos(30);
    setPosRevealAtivo(true);
    setFase('pos_reveal');
  }

  useEffect(() => {
    if (fase !== 'pos_reveal' || !posRevealAtivo) return;
    if (posRevealSegundos <= 0) {
      setPosRevealAtivo(false);
      return;
    }
    const t = setTimeout(() => setPosRevealSegundos((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [fase, posRevealAtivo, posRevealSegundos]);

  // ─── Próxima rodada / Resultado ───────────────────────────────────────────

  function proximaRodada() {
    const proxima = rodadaAtual + 1;
    if (proxima > totalRodadas) {
      setFase('resultado');
      return;
    }
    const { texto, indice } = selecionarPrompt(indicesUsados, proxima, modo);
    setIndicesUsados((u) => [...u, indice]);
    setPromptTexto(texto);
    setRodadaAtual(proxima);
    setVencedorId(null);
    setFoiEmpate(false);
    promptOp.setValue(0);
    Animated.timing(promptOp, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
    setFase('prompt');
  }

  function sairLimpo() {
    navigation.navigate('Inicio');
  }

  // ─── Renders por fase ─────────────────────────────────────────────────────

  if (fase === 'resultado') {
    return (
      <FaseResultado
        resultados={resultados}
        jogadores={jogadores}
        onSair={sairLimpo}
        insets={insets}
      />
    );
  }

  return (
    <View
      style={[
        estilos.tela,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      <BotaoEncerrarJogo onConfirmar={sairLimpo} />

      {/* Cabeçalho: rodada + sair */}
      <View style={estilos.cabecalho}>
        <Text style={estilos.rodadaLabel}>
          {rodadaAtual} / {totalRodadas}
        </Text>
      </View>

      {/* Conteúdo por fase */}
      {fase === 'prompt' && (
        <FasePrompt
          promptTexto={promptTexto}
          promptOp={promptOp}
          onPress={irParaApontando}
        />
      )}

      {fase === 'apontando' && <FaseApontando onJa={irParaSelecionar} />}

      {fase === 'selecionar' && (
        <FaseSelecionar
          jogadores={jogadores}
          onSelecionar={selecionarVencedor}
          onEmpate={declararEmpate}
        />
      )}

      {fase === 'reveal' && (
        <FaseReveal
          vencedorNome={
            vencedorId
              ? (jogadores.find((j) => j.id === vencedorId)?.nome ?? '')
              : null
          }
          foiEmpate={foiEmpate}
          promptTexto={promptTexto}
          nomeOp={nomeOp}
          nomeScale={nomeScale}
          cristalizacaoOp={cristalizacaoOp}
          proximaOp={proximaOp}
          onProxima={irParaPosReveal}
        />
      )}

      {fase === 'pos_reveal' && (
        <FasePosReveal
          vencedorNome={
            vencedorId
              ? (jogadores.find((j) => j.id === vencedorId)?.nome ?? '')
              : null
          }
          foiEmpate={foiEmpate}
          segundos={posRevealSegundos}
          onProxima={proximaRodada}
          isUltimaRodada={rodadaAtual >= totalRodadas}
        />
      )}
    </View>
  );
}

// ─── Sub-componentes de fase ───────────────────────────────────────────────────

function FasePrompt({
  promptTexto,
  promptOp,
  onPress,
}: {
  promptTexto: string;
  promptOp: Animated.Value;
  onPress: () => void;
}) {
  return (
    <Pressable style={estilos.faseTela} onPress={onPress}>
      <Animated.View style={[estilos.promptContainer, { opacity: promptOp }]}>
        <Text style={estilos.promptTexto}>{promptTexto}</Text>
        <Text style={estilos.toque}>toque para começar</Text>
      </Animated.View>
    </Pressable>
  );
}

function FaseApontando({ onJa }: { onJa: () => void }) {
  const jaOp = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const t = setTimeout(() => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      Animated.timing(jaOp, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }).start();
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Pressable style={estilos.faseTela} onPress={onJa}>
      <Text style={estilos.apontandoTexto}>apontem.</Text>
      <Animated.Text style={[estilos.apontandoJa, { opacity: jaOp }]}>
        já.
      </Animated.Text>
    </Pressable>
  );
}

function FaseSelecionar({
  jogadores,
  onSelecionar,
  onEmpate,
}: {
  jogadores: Jogador[];
  onSelecionar: (id: string) => void;
  onEmpate: () => void;
}) {
  return (
    <View style={estilos.selecionarContainer}>
      <Text style={estilos.selecionarLabel}>quem recebeu mais votos?</Text>
      <View style={estilos.selecionarLista}>
        {jogadores.map((j) => (
          <Pressable
            key={j.id}
            onPress={() => onSelecionar(j.id)}
            style={({ pressed }) => [
              estilos.selecionarItem,
              pressed && estilos.selecionarItemPressionado,
            ]}
          >
            <Text style={estilos.selecionarNome}>{j.nome}</Text>
            <Text style={estilos.selecionarSeta}>→</Text>
          </Pressable>
        ))}
      </View>
      <Pressable
        onPress={onEmpate}
        style={({ pressed }) => [
          estilos.empateBtn,
          pressed && { opacity: 0.6 },
        ]}
      >
        <Text style={estilos.empateTexto}>foi empate</Text>
      </Pressable>
    </View>
  );
}

function FaseReveal({
  vencedorNome,
  foiEmpate,
  promptTexto,
  nomeOp,
  nomeScale,
  cristalizacaoOp,
  proximaOp,
  onProxima,
}: {
  vencedorNome: string | null;
  foiEmpate: boolean;
  promptTexto: string;
  nomeOp: Animated.Value;
  nomeScale: Animated.Value;
  cristalizacaoOp: Animated.Value;
  proximaOp: Animated.Value;
  onProxima: () => void;
}) {
  return (
    <View style={estilos.revealContainer}>
      <Text style={estilos.revealPrompt}>{promptTexto}</Text>

      <Animated.View
        style={[
          estilos.revealNomeBloco,
          { opacity: nomeOp, transform: [{ scale: nomeScale }] },
        ]}
      >
        {foiEmpate ? (
          <Text style={estilos.revealEmpate}>
            o grupo não{'\n'}conseguiu decidir.
          </Text>
        ) : (
          <Text style={estilos.revealNome}>{vencedorNome}</Text>
        )}
      </Animated.View>

      <Animated.Text
        style={[estilos.revealCristalizacao, { opacity: cristalizacaoOp }]}
      >
        {foiEmpate ? 'às vezes o grupo é honesto demais.' : 'o grupo falou.'}
      </Animated.Text>

      <Animated.View
        style={[estilos.revealProximaBloco, { opacity: proximaOp }]}
      >
        <Pressable onPress={onProxima} style={estilos.revealProximaBtn}>
          <Text style={estilos.revealProximaTexto}>próxima →</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

function FasePosReveal({
  vencedorNome,
  foiEmpate,
  segundos,
  onProxima,
  isUltimaRodada,
}: {
  vencedorNome: string | null;
  foiEmpate: boolean;
  segundos: number;
  onProxima: () => void;
  isUltimaRodada: boolean;
}) {
  return (
    <Pressable style={estilos.posRevealContainer} onPress={onProxima}>
      <Text style={estilos.posRevealNome}>
        {foiEmpate ? 'empate' : vencedorNome}
      </Text>
      <Text style={estilos.posRevealFrase}>30 segundos.{'\n'}se defendam.</Text>
      <Text style={estilos.posRevealTimer}>{segundos}s</Text>
      <Text style={estilos.posRevealContinuar}>
        {isUltimaRodada
          ? 'toque para ver o resultado →'
          : 'toque para a próxima →'}
      </Text>
    </Pressable>
  );
}

function FaseResultado({
  resultados,
  jogadores,
  onSair,
  insets,
}: {
  resultados: ResultadoRodada[];
  jogadores: Jogador[];
  onSair: () => void;
  insets: { top: number; bottom: number };
}) {
  const adaptadorChamado = useRef(false);

  // Processa o resultado na sessão uma única vez ao montar
  useEffect(() => {
    if (adaptadorChamado.current) return;
    adaptadorChamado.current = true;

    const contagemId = new Map<string, number>();
    for (const r of resultados) {
      if (r.vencedorId) {
        contagemId.set(r.vencedorId, (contagemId.get(r.vencedorId) ?? 0) + 1);
      }
    }
    let julgadoMax = 0;
    let julgadoMaisVezes: string | null = null;
    for (const [id, n] of contagemId) {
      if (n > julgadoMax) {
        julgadoMax = n;
        julgadoMaisVezes = id;
      }
    }
    processarResultadoMLT({
      totalRodadas: resultados.length,
      unanimidades: resultados.filter((r) => r.vencedorId !== null).length,
      julgadoMaisVezes: julgadoMaisVezes as string | null,
      rodadasComEmpate: resultados.filter((r) => r.vencedorId === null).length,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const contagem = new Map<string, number>();
  for (const r of resultados) {
    if (r.vencedorId) {
      contagem.set(r.vencedorId, (contagem.get(r.vencedorId) ?? 0) + 1);
    }
  }

  const ranking = [...jogadores].sort(
    (a, b) => (contagem.get(b.id) ?? 0) - (contagem.get(a.id) ?? 0),
  );

  const maisNomeado = ranking[0];
  const maxVotos = maisNomeado ? (contagem.get(maisNomeado.id) ?? 0) : 0;

  return (
    <View
      style={[
        estilos.resultadoTela,
        { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 },
      ]}
    >
      <Text style={estilos.resultadoTitulo}>a noite decidiu.</Text>

      {maisNomeado && maxVotos > 0 && (
        <View style={estilos.resultadoDestaqueBloco}>
          <Text style={estilos.resultadoDestaquePre}>mais votado</Text>
          <Text style={estilos.resultadoDestaqueNome}>{maisNomeado.nome}</Text>
          <Text style={estilos.resultadoDestaqueVotos}>
            {maxVotos}× o grupo escolheu você.
          </Text>
        </View>
      )}

      <View style={estilos.resultadoRanking}>
        {ranking.map((j, i) => {
          const votos = contagem.get(j.id) ?? 0;
          return (
            <View key={j.id} style={estilos.resultadoRankingItem}>
              <Text style={estilos.resultadoRankingPos}>{i + 1}</Text>
              <Text style={estilos.resultadoRankingNome}>{j.nome}</Text>
              <Text style={estilos.resultadoRankingVotos}>{votos}×</Text>
            </View>
          );
        })}
      </View>

      <FeedbackSessao jogoId="most-likely-to" />

      <Pressable
        onPress={onSair}
        style={({ pressed }) => [
          estilos.resultadoSair,
          pressed && { opacity: 0.6 },
        ]}
      >
        <Text style={estilos.resultadoSairTexto}>jogar de novo →</Text>
      </Pressable>
    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const estilos = StyleSheet.create({
  apontandoJa: {
    color: cores.mostLikely,
    fontFamily: familias.sans,
    fontSize: 48,
    marginTop: espacamento.xl,
    textAlign: 'center',
  },
  apontandoTexto: {
    color: cores.texto,
    fontFamily: familias.sans,
    fontWeight: '800' as const,
    fontSize: 56,
    letterSpacing: -1,
    textAlign: 'center',
  },
  cabecalho: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: espacamento.lg,
    paddingVertical: espacamento.sm,
  },
  empateBtn: {
    borderColor: cores.borda,
    borderRadius: raio.pill,
    borderWidth: 1,
    marginTop: espacamento.xl,
    paddingHorizontal: espacamento.xl,
    paddingVertical: espacamento.sm + 2,
  },
  empateTexto: {
    color: cores.textoMudo,
    fontSize: 14,
    letterSpacing: 0.4,
  },
  faseTela: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: espacamento.xl,
  },
  posRevealContainer: {
    alignItems: 'center',
    flex: 1,
    gap: espacamento.lg,
    justifyContent: 'center',
    paddingHorizontal: espacamento.xl,
  },
  posRevealContinuar: {
    color: cores.textoMudo,
    fontSize: tipografia.tamanhoLegenda,
    letterSpacing: 0.3,
    marginTop: espacamento.xl,
    textAlign: 'center',
  },
  posRevealFrase: {
    color: cores.textoSecundario,
    fontFamily: familias.sans,
    fontSize: 22,
    lineHeight: 30,
    textAlign: 'center',
  },
  posRevealNome: {
    color: cores.mostLikely,
    fontFamily: familias.sans,
    fontWeight: '800' as const,
    fontSize: 36,
    textAlign: 'center',
  },
  posRevealTimer: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontWeight: '800' as const,
    fontSize: 28,
    marginTop: espacamento.sm,
    textAlign: 'center',
  },
  promptContainer: {
    alignItems: 'center',
    gap: espacamento.xl,
  },
  promptTexto: {
    color: cores.texto,
    fontFamily: familias.sans,
    fontWeight: '800' as const,
    fontSize: 26,
    letterSpacing: 0.2,
    lineHeight: 36,
    textAlign: 'center',
  },
  resultadoDestaqueBloco: {
    alignItems: 'center',
    borderColor: cores.mostLikely,
    borderRadius: raio.xl,
    borderWidth: 1,
    gap: espacamento.xs,
    marginBottom: espacamento.xl,
    paddingHorizontal: espacamento.xl,
    paddingVertical: espacamento.lg,
    width: '100%',
  },
  resultadoDestaqueNome: {
    color: cores.mostLikely,
    fontFamily: familias.sans,
    fontWeight: '800' as const,
    fontSize: 36,
    textAlign: 'center',
  },
  resultadoDestaquePre: {
    color: cores.textoMudo,
    fontSize: tipografia.tamanhoMicro,
    fontWeight: tipografia.pesoMedio,
    letterSpacing: 0.3,
  },
  resultadoDestaqueVotos: {
    color: cores.textoSecundario,
    fontFamily: familias.sans,
    fontSize: 15,
    marginTop: 4,
    textAlign: 'center',
  },
  resultadoRanking: {
    gap: espacamento.sm,
    width: '100%',
  },
  resultadoRankingItem: {
    alignItems: 'center',
    backgroundColor: cores.superficie,
    borderColor: cores.borda,
    borderRadius: raio.md,
    borderWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: espacamento.md,
    paddingVertical: espacamento.md,
  },
  resultadoRankingNome: {
    color: cores.texto,
    flex: 1,
    fontSize: tipografia.tamanhoCorpoMaior,
    fontWeight: tipografia.pesoSemibold,
    marginLeft: espacamento.md,
  },
  resultadoRankingPos: {
    color: cores.textoMudo,
    fontSize: tipografia.tamanhoLegenda,
    fontWeight: tipografia.pesoExtraBold,
    width: 20,
  },
  resultadoRankingVotos: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontWeight: '800' as const,
    fontSize: 18,
  },
  resultadoSair: {
    borderColor: cores.mostLikely,
    borderRadius: raio.pill,
    borderWidth: 1,
    marginTop: espacamento.xl,
    paddingHorizontal: espacamento.xl,
    paddingVertical: espacamento.md,
  },
  resultadoSairTexto: {
    color: cores.mostLikely,
    fontSize: tipografia.tamanhoCorpo,
    fontWeight: tipografia.pesoSemibold,
  },
  resultadoTela: {
    alignItems: 'center',
    backgroundColor: cores.fundo,
    flex: 1,
    paddingHorizontal: espacamento.lg,
  },
  resultadoTitulo: {
    color: cores.texto,
    fontFamily: familias.sans,
    fontWeight: '800' as const,
    fontSize: 32,
    marginBottom: espacamento.xl,
    textAlign: 'center',
  },
  revealCristalizacao: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: 16,
    letterSpacing: 0.3,
    marginTop: espacamento.lg,
    textAlign: 'center',
  },
  revealContainer: {
    alignItems: 'center',
    flex: 1,
    gap: espacamento.lg,
    justifyContent: 'center',
    paddingHorizontal: espacamento.xl,
  },
  revealEmpate: {
    color: cores.textoSecundario,
    fontFamily: familias.sans,
    fontSize: 28,
    lineHeight: 38,
    textAlign: 'center',
  },
  revealNome: {
    color: cores.texto,
    fontFamily: familias.sans,
    fontWeight: '800' as const,
    fontSize: 52,
    letterSpacing: -1,
    textAlign: 'center',
  },
  revealNomeBloco: {
    alignItems: 'center',
  },
  revealPrompt: {
    color: cores.textoMudo,
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 20,
    marginBottom: espacamento.sm,
    textAlign: 'center',
  },
  revealProximaBloco: {
    marginTop: espacamento.xxl,
  },
  revealProximaBtn: {
    borderColor: cores.borda,
    borderRadius: raio.pill,
    borderWidth: 1,
    paddingHorizontal: espacamento.xl,
    paddingVertical: espacamento.md,
  },
  revealProximaTexto: {
    color: cores.textoSecundario,
    fontSize: tipografia.tamanhoCorpo,
    letterSpacing: 0.3,
  },
  rodadaLabel: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontWeight: '800' as const,
    fontSize: 16,
    letterSpacing: 0.5,
  },
  selecionarContainer: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: espacamento.lg,
    paddingTop: espacamento.xl,
  },
  selecionarItem: {
    alignItems: 'center',
    backgroundColor: cores.superficie,
    borderColor: cores.borda,
    borderRadius: raio.md,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: espacamento.lg,
    paddingVertical: espacamento.md + 4,
    width: '100%',
  },
  selecionarItemPressionado: {
    backgroundColor: 'rgba(255, 190, 11, 0.12)',
    borderColor: cores.mostLikely,
  },
  selecionarLabel: {
    color: cores.textoSecundario,
    fontFamily: familias.sans,
    fontSize: 20,
    marginBottom: espacamento.lg,
    textAlign: 'center',
  },
  selecionarLista: {
    gap: espacamento.sm,
    width: '100%',
  },
  selecionarNome: {
    color: cores.texto,
    fontSize: tipografia.tamanhoCorpoMaior,
    fontWeight: tipografia.pesoSemibold,
  },
  selecionarSeta: {
    color: cores.mostLikely,
    fontSize: 18,
  },
  tela: {
    backgroundColor: cores.fundo,
    flex: 1,
  },
  toque: {
    color: cores.textoMudo,
    fontSize: tipografia.tamanhoLegenda,
    letterSpacing: 0.3,
    marginTop: espacamento.xl,
  },
});
