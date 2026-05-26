import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
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

import { BotaoEncerrarJogo } from '@/components';
import {
  adivinhandorAtual,
  avancarRodada,
  avaliarRepeticoesResposta,
  calcularResultadoRodada,
  criarSessao,
  getCategoria,
  iniciarPalpites,
  iniciarRodada,
  jogoEncerrado,
  registrarPalpite,
  registrarRespostas,
  respostasTemRepeticao,
  respondenteDaRodada,
  usarVotacaoRapida,
  type CategoriaId,
  type LeituraColetivaDe0a10,
  type NotaDe0a10,
  type RespostaCategoria,
  type ResultadoRodada,
  type SessaoDe0a10,
} from '@/games/de-0-a-10';
import type { RootStackParamList } from '@/navigation/types';
import { processarResultadoDe0a10 } from '@/session/de0a10LocalAdapter';
import { cores, espacamento, familias, raio, tipografia } from '@/theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'JogoLocalDe0a10'>;

// ─── Identidade visual ────────────────────────────────────────────────────────
const COR_D010 = '#10B981';
const COR_D010_FUNDO = 'rgba(16, 185, 129, 0.10)';
const COR_D010_BORDA = 'rgba(16, 185, 129, 0.35)';
const COR_PROX = '#F59E0B'; // palpite ±2 — aviso
const COR_LONGE = '#EF4444'; // palpite ±3+ — longe
const COR_TELA_PRIVADA = '#111111';

// ─── Sub-tela: Vez de ─────────────────────────────────────────────────────────
function TelaVezDe({
  sessao,
  onIniciar,
  onEncerrar,
}: {
  sessao: SessaoDe0a10;
  onIniciar: () => void;
  onEncerrar: () => void;
}) {
  const respondente = respondenteDaRodada(sessao);
  return (
    <SafeAreaView style={estilos.tela} edges={['top', 'bottom']}>
      <View style={estilos.headerBase}>
        <View style={estilos.headerEspaco} />
        <Text style={estilos.headerLabel}>DE 0 A 10</Text>
        <BotaoEncerrarJogo onConfirmar={onEncerrar} />
      </View>

      <View style={estilos.corpoVezDe}>
        <Text style={estilos.vezDeLabel}>vez de</Text>
        <Text style={estilos.vezDeNome} numberOfLines={2} adjustsFontSizeToFit>
          {respondente.nome}
        </Text>
        <Text style={estilos.vezDeContador}>
          rodada {sessao.rodadasCompletas + 1} de {sessao.totalRodadas}
        </Text>

        <View style={estilos.vezDeDivider} />

        <Text style={estilos.vezDeInstrucao}>
          passe o celular para {respondente.nome}.{'\n'}
          quando estiver pronto, toque em começar.
        </Text>
      </View>

      <View style={estilos.rodape}>
        <Pressable
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onIniciar();
          }}
          style={({ pressed }) => [
            estilos.botaoPrimario,
            pressed && estilos.pressionado,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Começar rodada"
        >
          <Text style={estilos.botaoPrimarioTexto}>estou com o celular →</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

// ─── Sub-tela: Nota Secreta ───────────────────────────────────────────────────
function TelaNotaSecreta({
  sessao,
  onMostrar,
  onEncerrar,
}: {
  sessao: SessaoDe0a10;
  onMostrar: (respostas: RespostaCategoria[]) => void;
  onEncerrar: () => void;
}) {
  const rodada = sessao.rodadaAtual!;
  const [textos, setTextos] = useState<Record<string, string>>(
    Object.fromEntries(rodada.categorias.map((id) => [id, ''])),
  );
  const [puladas, setPuladas] = useState<Set<CategoriaId>>(new Set());

  const respostasRascunho: RespostaCategoria[] = rodada.categorias.map(
    (id) => ({
      categoriaId: id,
      resposta: puladas.has(id) ? null : textos[id]!.trim() || null,
    }),
  );
  const repeticoes = avaliarRepeticoesResposta(
    respostasRascunho,
    rodada.respondente.id,
    sessao.historico,
  );
  const respostasValidas = rodada.categorias.filter(
    (id) => !puladas.has(id) && textos[id]!.trim().length > 0,
  );
  const podeConfirmar =
    respostasValidas.length >= 2 && !respostasTemRepeticao(repeticoes);

  function alternarPulo(id: CategoriaId) {
    void Haptics.selectionAsync();
    setPuladas((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        // máximo 1 skip por rodada
        if (next.size < 1) next.add(id);
      }
      return next;
    });
  }

  function confirmar() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onMostrar(respostasRascunho);
  }

  return (
    <KeyboardAvoidingView
      style={estilos.preencher}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <SafeAreaView
        style={[estilos.tela, { backgroundColor: COR_TELA_PRIVADA }]}
        edges={['top', 'bottom']}
      >
        <BotaoEncerrarJogo onConfirmar={onEncerrar} />

        {/* Nota em destaque */}
        <View style={estilos.notaContainer}>
          <Text style={estilos.notaLabel}>sua nota é</Text>
          <Text style={estilos.notaNumero}>{rodada.nota}</Text>
          <Text style={estilos.notaInstrucao}>
            responda cada pergunta de acordo com a sua nota.{'\n'}
            pense bem — cada resposta ajuda o grupo a te calibrar.
          </Text>
        </View>

        {/* Campos de resposta */}
        <ScrollView
          style={estilos.scrollCampos}
          contentContainerStyle={estilos.scrollCamposConteudo}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {rodada.categorias.map((id) => {
            const cat = getCategoria(id);
            const pulada = puladas.has(id);
            const repetidaNaSessao = repeticoes.naSessao.has(id);
            const repetidaNaRodada = repeticoes.naRodada.has(id);
            return (
              <View
                key={id}
                style={[estilos.campoCard, pulada && estilos.campoCardPulado]}
              >
                <View style={estilos.campoHeader}>
                  <Text style={estilos.campoEmoji}>{cat.emoji}</Text>
                  <Text
                    style={[
                      estilos.campoNome,
                      pulada && estilos.campoNomePulado,
                    ]}
                  >
                    {cat.nome}
                  </Text>
                  <Pressable
                    onPress={() => alternarPulo(id)}
                    style={({ pressed }) => [
                      estilos.chipPular,
                      pulada && estilos.chipPularAtivo,
                      pressed && estilos.pressionado,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={
                      pulada
                        ? `Desfazer pulo de ${cat.nome}`
                        : `Pular ${cat.nome}`
                    }
                    disabled={!pulada && puladas.size >= 1}
                  >
                    <Text
                      style={[
                        estilos.chipPularTexto,
                        pulada && estilos.chipPularTextoAtivo,
                        !pulada &&
                          puladas.size >= 1 &&
                          estilos.chipPularDesabilitado,
                      ]}
                    >
                      {pulada ? 'desfa.' : 'pular'}
                    </Text>
                  </Pressable>
                </View>
                {!pulada && (
                  <Text style={estilos.campoPergunta}>
                    {rodada.perguntasPorCategoria[id]}
                  </Text>
                )}
                {!pulada && (
                  <TextInput
                    style={[
                      estilos.campoInput,
                      (repetidaNaSessao || repetidaNaRodada) &&
                        estilos.campoInputRepetido,
                    ]}
                    placeholder="sua resposta"
                    placeholderTextColor="rgba(255,255,255,0.20)"
                    value={textos[id]}
                    onChangeText={(t) =>
                      setTextos((prev) => ({ ...prev, [id]: t }))
                    }
                    returnKeyType="next"
                    maxLength={40}
                    autoCorrect={false}
                    autoCapitalize="none"
                  />
                )}
                {!pulada && repetidaNaRodada && (
                  <Text style={estilos.campoAviso}>
                    use respostas diferentes nesta rodada
                  </Text>
                )}
                {!pulada && !repetidaNaRodada && repetidaNaSessao && (
                  <Text style={estilos.campoAviso}>
                    você já usou essa resposta. tenta outra.
                  </Text>
                )}
                {pulada && <Text style={estilos.campoPuladoTexto}>—</Text>}
              </View>
            );
          })}

          <View style={{ height: espacamento.xl }} />
        </ScrollView>

        {/* CTA */}
        <View style={estilos.rodapePrivado}>
          <Pressable
            onPress={confirmar}
            disabled={!podeConfirmar}
            style={({ pressed }) => [
              estilos.botaoPrimario,
              !podeConfirmar && estilos.botaoPrimarioDesabilitado,
              pressed && podeConfirmar && estilos.pressionado,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Mostrar respostas ao grupo"
          >
            <Text
              style={[
                estilos.botaoPrimarioTexto,
                !podeConfirmar && estilos.botaoPrimarioTextoDesabilitado,
              ]}
            >
              mostrar ao grupo →
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

// ─── Sub-tela: Debate ─────────────────────────────────────────────────────────
function TelaDebate({
  sessao,
  onIniciarVotacao,
  onEncerrar,
}: {
  sessao: SessaoDe0a10;
  onIniciarVotacao: () => void;
  onEncerrar: () => void;
}) {
  const rodada = sessao.rodadaAtual!;

  return (
    <SafeAreaView style={estilos.tela} edges={['top', 'bottom']}>
      <View style={estilos.headerBase}>
        <View style={estilos.headerEspaco} />
        <Text style={estilos.headerLabel}>DE 0 A 10</Text>
        <BotaoEncerrarJogo onConfirmar={onEncerrar} />
      </View>

      <ScrollView
        style={estilos.preencher}
        contentContainerStyle={estilos.scrollDebateConteudo}
        showsVerticalScrollIndicator={false}
      >
        <Text style={estilos.debateTitulo}>
          o que {rodada.respondente.nome} disse
        </Text>
        <Text style={estilos.debateSubtitulo}>
          discutam o padrão. qual é a nota?
        </Text>

        {rodada.modoLeitura === 'rotativa' && (
          <View style={estilos.avisoLeituraRotativa}>
            <Text style={estilos.avisoLeituraRotativaTitulo}>
              leitura relâmpago
            </Text>
            <Text style={estilos.avisoLeituraRotativaTexto}>
              quatro pessoas vão palpitar agora. os leitores mudam na próxima
              rodada.
            </Text>
          </View>
        )}

        <View style={estilos.listaRespostas}>
          {rodada.categorias.map((id) => {
            const cat = getCategoria(id);
            const resp = rodada.respostas.find((r) => r.categoriaId === id);
            const texto = resp?.resposta ?? null;
            const pergunta = rodada.perguntasPorCategoria[id];
            return (
              <View key={id} style={estilos.respostaCard}>
                {/* Pergunta como contexto de debate */}
                {pergunta && (
                  <Text style={estilos.respostaPergunta}>{pergunta}</Text>
                )}
                {/* Categoria + resposta */}
                <View style={estilos.respostaLinha}>
                  <View style={estilos.respostaCategoriaCol}>
                    <Text style={estilos.respostaEmoji}>{cat.emoji}</Text>
                    <Text style={estilos.respostaCatNome}>{cat.nome}</Text>
                  </View>
                  <Text
                    style={[
                      estilos.respostaTexto,
                      texto === null && estilos.respostaTextoVazio,
                    ]}
                  >
                    {texto ?? '—'}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        <View style={{ height: espacamento.xl }} />
      </ScrollView>

      <View style={estilos.rodape}>
        <Pressable
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onIniciarVotacao();
          }}
          style={({ pressed }) => [
            estilos.botaoPrimario,
            pressed && estilos.pressionado,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Iniciar votação"
        >
          <Text style={estilos.botaoPrimarioTexto}>iniciar votação →</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

// ─── Sub-tela: Palpites ───────────────────────────────────────────────────────
const NOTAS_GRID: NotaDe0a10[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const NOTAS_EXTRAS: NotaDe0a10[] = [0, 10];

function TelaPalpites({
  sessao,
  onVotar,
  onEncerrar,
}: {
  sessao: SessaoDe0a10;
  onVotar: (jogadorId: string, nota: NotaDe0a10) => void;
  onEncerrar: () => void;
}) {
  const rodada = sessao.rodadaAtual!;
  const votante = adivinhandorAtual(sessao);
  const [selecao, setSelecao] = useState<{
    jogadorId: string;
    nota: NotaDe0a10;
  } | null>(null);
  const totalAdivinhadores = rodada.adivinhadores.length;
  const votosFeitos = rodada.palpites.length;
  const votoRapido = usarVotacaoRapida(totalAdivinhadores, rodada.modoLeitura);
  const selecionado =
    selecao && selecao.jogadorId === votante?.id ? selecao.nota : null;

  function escolherNota(nota: NotaDe0a10) {
    if (votoRapido) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (votante) onVotar(votante.id, nota);
      return;
    }
    void Haptics.selectionAsync();
    if (votante) setSelecao({ jogadorId: votante.id, nota });
  }

  if (!votante) return null;

  return (
    <SafeAreaView
      style={[estilos.tela, { backgroundColor: COR_TELA_PRIVADA }]}
      edges={['top', 'bottom']}
    >
      <BotaoEncerrarJogo onConfirmar={onEncerrar} />

      <View style={estilos.headerVotacao}>
        <Text style={estilos.votacaoIndicador}>
          {rodada.modoLeitura === 'rotativa' ? 'leitor ' : ''}
          {votosFeitos + 1} de {totalAdivinhadores}
        </Text>
        <Text style={estilos.votacaoLabel}>seu palpite, {votante.nome}</Text>
        <Text style={estilos.votacaoSubtitulo}>
          {votoRapido
            ? 'toque na nota e passe o celular'
            : 'ninguém vai ver seu voto agora'}
        </Text>
      </View>

      {/* Respostas compactas para referência */}
      <View style={estilos.respostasReferencia}>
        {rodada.categorias.map((id) => {
          const cat = getCategoria(id);
          const resp = rodada.respostas.find((r) => r.categoriaId === id);
          return (
            <View key={id} style={estilos.refLinha}>
              <Text style={estilos.refEmoji}>{cat.emoji}</Text>
              <Text style={estilos.refTexto} numberOfLines={1}>
                {resp?.resposta ?? '—'}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Grade de números */}
      <View style={estilos.gradeNumeros}>
        {NOTAS_GRID.map((n) => {
          const sel = !votoRapido && selecionado === n;
          return (
            <Pressable
              key={n}
              onPress={() => escolherNota(n)}
              style={({ pressed }) => [
                estilos.botoaoNota,
                sel && estilos.botoaoNotaSelecionado,
                pressed && estilos.pressionado,
              ]}
              accessibilityRole="radio"
              accessibilityState={{ selected: sel }}
              accessibilityLabel={
                votoRapido ? `Votar nota ${n}` : `Selecionar nota ${n}`
              }
            >
              <Text
                style={[
                  estilos.botoaoNotaTexto,
                  sel && estilos.botoaoNotaTextoSelecionado,
                ]}
              >
                {n}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {rodada.permiteNotasExtremas ? (
        <View style={estilos.gradeExtras}>
          {NOTAS_EXTRAS.map((n) => {
            const sel = !votoRapido && selecionado === n;
            return (
              <Pressable
                key={n}
                onPress={() => escolherNota(n)}
                style={({ pressed }) => [
                  estilos.botoaoNotaExtra,
                  sel && estilos.botoaoNotaSelecionado,
                  pressed && estilos.pressionado,
                ]}
                accessibilityRole="radio"
                accessibilityState={{ selected: sel }}
                accessibilityLabel={
                  votoRapido ? `Votar nota ${n}` : `Selecionar nota ${n}`
                }
              >
                <Text
                  style={[
                    estilos.botoaoNotaExtraTexto,
                    sel && estilos.botoaoNotaTextoSelecionado,
                  ]}
                >
                  {n}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {!votoRapido && (
        <View style={estilos.rodapePrivado}>
          <Pressable
            onPress={() => {
              if (selecionado === null) return;
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onVotar(votante.id, selecionado);
            }}
            disabled={selecionado === null}
            style={({ pressed }) => [
              estilos.botaoPrimario,
              selecionado === null && estilos.botaoPrimarioDesabilitado,
              pressed && selecionado !== null && estilos.pressionado,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Confirmar palpite"
          >
            <Text
              style={[
                estilos.botaoPrimarioTexto,
                selecionado === null && estilos.botaoPrimarioTextoDesabilitado,
              ]}
            >
              confirmar →
            </Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

// ─── Sub-tela: Reveal ─────────────────────────────────────────────────────────
function corPalpite(erro: number): string {
  if (erro <= 1) return COR_D010;
  if (erro <= 2) return COR_PROX;
  return COR_LONGE;
}

interface CopyLeitura {
  titulo: string;
  resumo: string;
  cor: string;
}

function copyDaLeitura(leitura: LeituraColetivaDe0a10): CopyLeitura {
  switch (leitura) {
    case 'cravaram':
      return {
        titulo: 'vocês cravaram.',
        resumo: 'todo mundo enxergou exatamente a mesma nota.',
        cor: COR_D010,
      };
    case 'te_leram':
      return {
        titulo: 'vocês conhecem essa pessoa.',
        resumo: 'todo mundo chegou a um ponto da nota real.',
        cor: COR_D010,
      };
    case 'quase':
      return {
        titulo: 'metade do grupo sacou.',
        resumo: 'alguns entenderam a lógica antes dos outros.',
        cor: COR_PROX,
      };
    case 'divididos':
      return {
        titulo: 'vocês viram pessoas diferentes.',
        resumo: 'os palpites abriram lados opostos do grupo.',
        cor: COR_LONGE,
      };
    case 'nao_te_leram':
      return {
        titulo: 'ninguém te entendeu.',
        resumo: 'a lógica passou longe do grupo.',
        cor: COR_LONGE,
      };
  }
}

function TelaReveal({
  sessao,
  resultado,
  onProxima,
  onEncerrar,
  ultimaRodada,
}: {
  sessao: SessaoDe0a10;
  resultado: ResultadoRodada;
  onProxima: () => void;
  onEncerrar: () => void;
  ultimaRodada: boolean;
}) {
  const copy = copyDaLeitura(resultado.leituraColetiva);
  const entrada = useRef(new Animated.Value(0)).current;
  const detalhes = useRef(new Animated.Value(0)).current;
  const momento = useRef(new Animated.Value(0)).current;
  const placar = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (
      resultado.leituraColetiva === 'cravaram' ||
      resultado.leituraColetiva === 'te_leram'
    ) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else if (
      resultado.leituraColetiva === 'divididos' ||
      resultado.leituraColetiva === 'nao_te_leram'
    ) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } else {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    Animated.sequence([
      Animated.timing(entrada, {
        toValue: 1,
        duration: 240,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(detalhes, {
        toValue: 1,
        duration: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(momento, {
        toValue: 1,
        duration: 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(placar, {
        toValue: 1,
        duration: 160,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [detalhes, entrada, momento, placar, resultado.leituraColetiva]);

  const palpitesOrdenados = [...resultado.palpites].sort((a, b) => {
    const erroA = Math.abs(a.nota - resultado.notaReal);
    const erroB = Math.abs(b.nota - resultado.notaReal);
    return erroA - erroB;
  });

  return (
    <SafeAreaView style={estilos.tela} edges={['top', 'bottom']}>
      <View style={estilos.headerBase}>
        <View style={estilos.headerEspaco} />
        <Text style={estilos.headerLabel}>DE 0 A 10</Text>
        <BotaoEncerrarJogo onConfirmar={onEncerrar} />
      </View>

      <ScrollView
        style={estilos.preencher}
        contentContainerStyle={estilos.scrollRevealConteudo}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[estilos.revealNotaContainer, { opacity: entrada }]}
        >
          <Text style={estilos.revealLabel}>
            a nota de {resultado.respondente.nome}
          </Text>
          <Text style={estilos.revealNota}>{resultado.notaReal}</Text>
          <Text style={estilos.revealDivergencia}>
            {resultado.acertosExatos > 0
              ? `${resultado.acertosExatos} cravou a nota`
              : `${resultado.acertosProximos} chegou a ±1`}
            {'  '}·{'  '}
            diferença máxima {resultado.divergencia}
          </Text>
          {resultado.modoLeitura === 'rotativa' && (
            <Text style={estilos.revealAmostra}>
              leitura relâmpago com {resultado.palpites.length} pessoas
            </Text>
          )}
        </Animated.View>

        {/* Palpites */}
        <Animated.View style={[estilos.listaPalpites, { opacity: detalhes }]}>
          {palpitesOrdenados.map((p) => {
            const jogador = sessao.jogadores.find((j) => j.id === p.jogadorId);
            const erro = Math.abs(p.nota - resultado.notaReal);
            const cor = corPalpite(erro);
            const pontos = resultado.pontosPorAdivinhador[p.jogadorId] ?? 0;
            return (
              <View key={p.jogadorId} style={estilos.palpiteLinha}>
                <Text style={estilos.palpiteNome} numberOfLines={1}>
                  {jogador?.nome ?? '—'}
                </Text>
                <Text style={[estilos.palpiteNota, { color: cor }]}>
                  {p.nota}
                </Text>
                <View
                  style={[
                    estilos.palpiteIndicador,
                    { backgroundColor: cor + '20', borderColor: cor + '40' },
                  ]}
                >
                  <Text style={[estilos.palpiteErro, { color: cor }]}>
                    {erro === 0 ? '✓ exato' : erro === 1 ? '±1' : `±${erro}`}
                  </Text>
                </View>
                {sessao.modoCompetitivo && (
                  <Text
                    style={[
                      estilos.palpitePontos,
                      pontos === 2 && estilos.palpitePontosExato,
                      pontos === 1 && estilos.palpitePontosBeirada,
                    ]}
                  >
                    {pontos === 2 ? '+2 ★' : pontos === 1 ? '+1' : ''}
                  </Text>
                )}
              </View>
            );
          })}
        </Animated.View>

        <Animated.View
          style={[
            estilos.revealMomento,
            {
              opacity: momento,
              transform: [
                {
                  translateY: momento.interpolate({
                    inputRange: [0, 1],
                    outputRange: [10, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={[estilos.revealMomentoTitulo, { color: copy.cor }]}>
            {copy.titulo}
          </Text>
          <Text style={estilos.revealMomentoResumo}>{copy.resumo}</Text>
        </Animated.View>

        <Animated.View style={[estilos.conversaReveal, { opacity: momento }]}>
          <Text style={estilos.conversaRevealLabel}>
            {resultado.pulsoSocial.chamada}
          </Text>
          <Text style={estilos.conversaRevealTexto}>
            {resultado.pulsoSocial.texto}
          </Text>
        </Animated.View>

        {/* Pontuação do respondente (modo competitivo) */}
        {sessao.modoCompetitivo && (
          <Animated.View
            style={[
              estilos.pontoRespondente,
              resultado.pontosRespondente === 0 && estilos.pontoRespondenteZero,
              { opacity: placar },
            ]}
          >
            <Text
              style={[
                estilos.pontoRespondenteTexto,
                resultado.pontosRespondente === 0 &&
                  estilos.pontoRespondenteTextoZero,
              ]}
            >
              {resultado.pontosRespondente > 0
                ? `🎯 ${resultado.respondente.nome} ficou legível para ${resultado.pontosRespondente} de ${resultado.palpites.length} — +${resultado.pontosRespondente} pt`
                : `😶 ninguém acertou a nota de ${resultado.respondente.nome}`}
            </Text>
          </Animated.View>
        )}

        {/* Placar corrente (modo competitivo) */}
        {sessao.modoCompetitivo && (
          <Animated.View style={[estilos.placarContainer, { opacity: placar }]}>
            <Text style={estilos.placarTitulo}>placar</Text>
            {[...sessao.placar]
              .sort((a, b) => b.total - a.total)
              .map((entrada, i) => (
                <View key={entrada.jogadorId} style={estilos.placarLinha}>
                  <Text style={estilos.placarPosicao}>{i + 1}.</Text>
                  <Text style={estilos.placarNome} numberOfLines={1}>
                    {entrada.nome}
                  </Text>
                  <Text style={estilos.placarPontos}>{entrada.total} pt</Text>
                </View>
              ))}
          </Animated.View>
        )}

        <View style={{ height: espacamento.xl }} />
      </ScrollView>

      <View style={estilos.rodape}>
        <Pressable
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onProxima();
          }}
          style={({ pressed }) => [
            estilos.botaoPrimario,
            pressed && estilos.pressionado,
          ]}
          accessibilityRole="button"
          accessibilityLabel={ultimaRodada ? 'Encerrar jogo' : 'Próxima rodada'}
        >
          <Text style={estilos.botaoPrimarioTexto}>
            {ultimaRodada ? 'encerrar' : 'próxima rodada →'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

// ─── Sub-tela: Fim ────────────────────────────────────────────────────────────
function TelaFim({
  sessao,
  onVoltar,
}: {
  sessao: SessaoDe0a10;
  onVoltar: () => void;
}) {
  const vencedor = sessao.modoCompetitivo
    ? [...sessao.placar].sort((a, b) => b.total - a.total)[0]
    : null;

  return (
    <SafeAreaView style={estilos.tela} edges={['top', 'bottom']}>
      <View style={estilos.corpoFim}>
        <Text style={estilos.fimEmoji}>🎯</Text>
        <Text style={estilos.fimTitulo}>jogo encerrado</Text>
        <Text style={estilos.fimSubtitulo}>
          {sessao.rodadasCompletas} rodada
          {sessao.rodadasCompletas !== 1 ? 's' : ''} no total
        </Text>

        {sessao.modoCompetitivo && (
          <View style={estilos.placarFim}>
            <Text style={estilos.placarTitulo}>placar final</Text>
            {[...sessao.placar]
              .sort((a, b) => b.total - a.total)
              .map((entrada, i) => (
                <View
                  key={entrada.jogadorId}
                  style={[
                    estilos.placarLinha,
                    i === 0 && estilos.placarLinhaVencedor,
                  ]}
                >
                  <Text style={estilos.placarPosicao}>{i + 1}.</Text>
                  <Text style={estilos.placarNome} numberOfLines={1}>
                    {entrada.nome}
                  </Text>
                  <Text
                    style={[
                      estilos.placarPontos,
                      i === 0 && { color: COR_D010 },
                    ]}
                  >
                    {entrada.total} pt
                  </Text>
                </View>
              ))}
            {vencedor && (
              <Text style={estilos.fimVencedor}>🏆 {vencedor.nome} ganhou</Text>
            )}
          </View>
        )}
      </View>

      <View style={estilos.rodape}>
        <Pressable
          onPress={onVoltar}
          style={({ pressed }) => [
            estilos.botaoPrimario,
            pressed && estilos.pressionado,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Voltar ao início"
        >
          <Text style={estilos.botaoPrimarioTexto}>voltar ao início</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export function TelaJogoLocalDe0a10({ route, navigation }: Props) {
  const { jogadores, voltas, modoCompetitivo, incluirMais18 } = route.params;

  const [sessao, setSessao] = useState<SessaoDe0a10>(() =>
    criarSessao({ jogadores, voltas, modoCompetitivo, incluirMais18 }),
  );
  const [resultadoAtual, setResultadoAtual] = useState<ResultadoRodada | null>(
    null,
  );
  const [encerrado, setEncerrado] = useState(false);

  // Chamado após confirmação do BotaoEncerrarJogo (Alert já foi mostrado pelo componente)
  function handleEncerrar() {
    processarResultadoDe0a10(sessao, true);
    navigation.goBack();
  }

  // ── Transições de sub-fase ────────────────────────────────────────────────

  function handleIniciarRodada() {
    setSessao((s) => iniciarRodada(s));
  }

  function handleRegistrarRespostas(respostas: RespostaCategoria[]) {
    setSessao((s) => registrarRespostas(s, respostas));
  }

  function handleIniciarPalpites() {
    setSessao((s) => iniciarPalpites(s));
  }

  function handlePalpite(jogadorId: string, nota: NotaDe0a10) {
    setSessao((s) => {
      const nova = registrarPalpite(s, jogadorId, nota);
      // Se todos votaram (subFase virou 'reveal'), calcula resultado
      if (nova.subFase === 'reveal') {
        const resultado = calcularResultadoRodada(nova);
        if (resultado) setResultadoAtual(resultado);
      }
      return nova;
    });
  }

  function handleProximaRodada() {
    if (!resultadoAtual) return;
    setSessao((s) => {
      const nova = avancarRodada(s, resultadoAtual);
      if (jogoEncerrado(nova)) {
        setEncerrado(true);
      }
      return nova;
    });
    setResultadoAtual(null);
  }

  // ── Renderização ──────────────────────────────────────────────────────────

  if (encerrado) {
    return (
      <TelaFim
        sessao={sessao}
        onVoltar={() => {
          processarResultadoDe0a10(sessao, false);
          navigation.goBack();
        }}
      />
    );
  }

  if (sessao.subFase === 'vez_de') {
    return (
      <TelaVezDe
        sessao={sessao}
        onIniciar={handleIniciarRodada}
        onEncerrar={handleEncerrar}
      />
    );
  }

  if (sessao.subFase === 'nota_secreta') {
    return (
      <TelaNotaSecreta
        sessao={sessao}
        onMostrar={handleRegistrarRespostas}
        onEncerrar={handleEncerrar}
      />
    );
  }

  if (sessao.subFase === 'debate') {
    return (
      <TelaDebate
        sessao={sessao}
        onIniciarVotacao={handleIniciarPalpites}
        onEncerrar={handleEncerrar}
      />
    );
  }

  if (sessao.subFase === 'palpites') {
    return (
      <TelaPalpites
        sessao={sessao}
        onVotar={handlePalpite}
        onEncerrar={handleEncerrar}
      />
    );
  }

  if (sessao.subFase === 'reveal' && resultadoAtual) {
    const ultimaRodada = sessao.rodadasCompletas + 1 >= sessao.totalRodadas;
    return (
      <TelaReveal
        sessao={sessao}
        resultado={resultadoAtual}
        onProxima={handleProximaRodada}
        onEncerrar={handleEncerrar}
        ultimaRodada={ultimaRodada}
      />
    );
  }

  return null;
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const estilos = StyleSheet.create({
  preencher: {
    flex: 1,
  },
  tela: {
    backgroundColor: cores.fundo,
    flex: 1,
  },

  // ── Header ──
  headerBase: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: espacamento.md,
    paddingVertical: espacamento.sm,
  },
  headerLabel: {
    color: COR_D010,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    fontWeight: tipografia.pesoExtraBold,
    letterSpacing: 2,
  },
  headerEspaco: { width: 40 },

  // ── VezDe ──
  corpoVezDe: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: espacamento.xl,
  },
  vezDeLabel: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpo,
    marginBottom: espacamento.xs,
  },
  vezDeNome: {
    color: cores.texto,
    fontFamily: familias.sans,
    fontSize: 40,
    fontWeight: tipografia.pesoExtraBold,
    lineHeight: 46,
    textAlign: 'center',
  },
  vezDeContador: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    marginTop: espacamento.sm,
  },
  vezDeDivider: {
    backgroundColor: cores.borda,
    height: 1,
    marginVertical: espacamento.xl,
    width: '60%',
  },
  vezDeInstrucao: {
    color: cores.textoSecundario,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpo,
    lineHeight: 22,
    textAlign: 'center',
  },

  // ── NotaSecreta ──
  notaContainer: {
    alignItems: 'center',
    paddingHorizontal: espacamento.xl,
    paddingTop: espacamento.xl,
    paddingBottom: espacamento.lg,
  },
  notaLabel: {
    color: 'rgba(255,255,255,0.45)',
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    letterSpacing: 1,
    marginBottom: espacamento.xs,
    textTransform: 'uppercase',
  },
  notaNumero: {
    color: COR_D010,
    fontFamily: familias.sans,
    fontSize: 96,
    fontWeight: tipografia.pesoExtraBold,
    lineHeight: 100,
  },
  notaInstrucao: {
    color: 'rgba(255,255,255,0.40)',
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    lineHeight: 19,
    marginTop: espacamento.sm,
    textAlign: 'center',
  },
  scrollCampos: { flex: 1 },
  scrollCamposConteudo: {
    gap: espacamento.sm,
    paddingHorizontal: espacamento.md,
  },
  campoCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderColor: 'rgba(255,255,255,0.10)',
    borderRadius: raio.lg,
    borderWidth: 1,
    padding: espacamento.md,
  },
  campoCardPulado: {
    opacity: 0.45,
  },
  campoHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: espacamento.sm,
    marginBottom: espacamento.sm,
  },
  campoEmoji: { fontSize: 18 },
  campoNome: {
    color: 'rgba(255,255,255,0.70)',
    flex: 1,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    fontWeight: tipografia.pesoBold,
  },
  campoNomePulado: { color: 'rgba(255,255,255,0.30)' },
  chipPular: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: raio.pill,
    borderWidth: 1,
    paddingHorizontal: espacamento.sm,
    paddingVertical: 4,
  },
  chipPularAtivo: {
    backgroundColor: COR_D010 + '20',
    borderColor: COR_D010 + '60',
  },
  chipPularTexto: {
    color: 'rgba(255,255,255,0.45)',
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoMicro,
    fontWeight: tipografia.pesoBold,
  },
  chipPularTextoAtivo: { color: COR_D010 },
  chipPularDesabilitado: { opacity: 0.3 },
  campoPergunta: {
    color: 'rgba(255,255,255,0.45)',
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoMicro,
    lineHeight: 16,
    marginBottom: espacamento.sm,
  },
  campoInput: {
    color: '#FFFFFF',
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpo,
    paddingBottom: espacamento.xs,
    borderBottomColor: 'rgba(255,255,255,0.15)',
    borderBottomWidth: 1,
  },
  campoInputRepetido: {
    borderBottomColor: COR_PROX,
  },
  campoAviso: {
    color: COR_PROX,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoMicro,
    lineHeight: 16,
    marginTop: espacamento.xs,
  },
  campoPuladoTexto: {
    color: 'rgba(255,255,255,0.25)',
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpo,
  },

  // ── Debate ──
  scrollDebateConteudo: {
    paddingHorizontal: espacamento.md,
    paddingTop: espacamento.md,
  },
  respostaCard: {
    backgroundColor: cores.superficie,
    borderColor: cores.borda,
    borderRadius: raio.lg,
    borderWidth: 1,
    padding: espacamento.md,
  },
  respostaPergunta: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoMicro,
    lineHeight: 16,
    marginBottom: espacamento.sm,
  },
  debateTitulo: {
    color: cores.texto,
    fontFamily: familias.sans,
    fontSize: 22,
    fontWeight: tipografia.pesoExtraBold,
    marginBottom: espacamento.xs,
  },
  debateSubtitulo: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpo,
    marginBottom: espacamento.lg,
  },
  avisoLeituraRotativa: {
    backgroundColor: COR_D010_FUNDO,
    borderColor: COR_D010_BORDA,
    borderRadius: raio.md,
    borderWidth: 1,
    marginBottom: espacamento.lg,
    padding: espacamento.md,
  },
  avisoLeituraRotativaTitulo: {
    color: COR_D010,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    fontWeight: tipografia.pesoBold,
  },
  avisoLeituraRotativaTexto: {
    color: cores.textoSecundario,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    lineHeight: 18,
    marginTop: espacamento.xs,
  },
  listaRespostas: { gap: espacamento.sm },
  respostaLinha: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: espacamento.md,
  },
  respostaCategoriaCol: {
    alignItems: 'center',
    gap: 2,
    width: 60,
  },
  respostaEmoji: { fontSize: 22 },
  respostaCatNome: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoMicro,
    textAlign: 'center',
  },
  respostaTexto: {
    color: cores.texto,
    flex: 1,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpo,
    fontWeight: tipografia.pesoBold,
  },
  respostaTextoVazio: { color: cores.textoMudo },

  // ── Palpites ──
  headerVotacao: {
    alignItems: 'center',
    paddingHorizontal: espacamento.md,
    paddingTop: espacamento.xl,
    paddingBottom: espacamento.md,
  },
  votacaoIndicador: {
    color: 'rgba(255,255,255,0.35)',
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    marginBottom: espacamento.xs,
  },
  votacaoLabel: {
    color: '#FFFFFF',
    fontFamily: familias.sans,
    fontSize: 22,
    fontWeight: tipografia.pesoExtraBold,
  },
  votacaoSubtitulo: {
    color: 'rgba(255,255,255,0.40)',
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    marginTop: 4,
  },
  respostasReferencia: {
    flexDirection: 'row',
    gap: espacamento.sm,
    justifyContent: 'center',
    paddingHorizontal: espacamento.md,
    marginBottom: espacamento.lg,
    flexWrap: 'wrap',
  },
  refLinha: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: raio.md,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: espacamento.sm,
    paddingVertical: 6,
  },
  refEmoji: { fontSize: 14 },
  refTexto: {
    color: 'rgba(255,255,255,0.60)',
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    maxWidth: 80,
  },
  gradeNumeros: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: espacamento.sm,
    justifyContent: 'center',
    paddingHorizontal: espacamento.xl,
    marginBottom: espacamento.md,
  },
  botoaoNota: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: raio.md,
    borderWidth: 1,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  botoaoNotaSelecionado: {
    backgroundColor: COR_D010_FUNDO,
    borderColor: COR_D010_BORDA,
  },
  botoaoNotaTexto: {
    color: 'rgba(255,255,255,0.55)',
    fontFamily: familias.sans,
    fontSize: 22,
    fontWeight: tipografia.pesoExtraBold,
  },
  botoaoNotaTextoSelecionado: { color: COR_D010 },
  gradeExtras: {
    flexDirection: 'row',
    gap: espacamento.md,
    justifyContent: 'center',
    marginBottom: espacamento.lg,
  },
  botoaoNotaExtra: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: raio.md,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 72,
  },
  botoaoNotaExtraTexto: {
    color: 'rgba(255,255,255,0.35)',
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpo,
    fontWeight: tipografia.pesoBold,
  },

  // ── Reveal ──
  scrollRevealConteudo: {
    paddingHorizontal: espacamento.md,
    paddingTop: espacamento.md,
  },
  revealMomento: {
    alignItems: 'center',
    marginTop: espacamento.xl,
    paddingHorizontal: espacamento.sm,
  },
  revealMomentoTitulo: {
    fontFamily: familias.sans,
    fontSize: 26,
    fontWeight: tipografia.pesoExtraBold,
    lineHeight: 31,
    textAlign: 'center',
  },
  revealMomentoResumo: {
    color: cores.textoSecundario,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpo,
    lineHeight: 22,
    marginTop: espacamento.xs,
    textAlign: 'center',
  },
  revealNotaContainer: {
    alignItems: 'center',
    marginBottom: espacamento.xl,
  },
  conversaReveal: {
    borderColor: cores.borda,
    borderTopWidth: 1,
    marginTop: espacamento.lg,
    paddingTop: espacamento.md,
  },
  conversaRevealLabel: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoMicro,
    fontWeight: tipografia.pesoBold,
    textTransform: 'uppercase',
  },
  conversaRevealTexto: {
    color: cores.texto,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpo,
    fontWeight: tipografia.pesoBold,
    lineHeight: 22,
    marginTop: espacamento.xs,
  },
  revealLabel: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpo,
    marginBottom: espacamento.xs,
  },
  revealNota: {
    color: COR_D010,
    fontFamily: familias.sans,
    fontSize: 88,
    fontWeight: tipografia.pesoExtraBold,
    lineHeight: 92,
  },
  revealDivergencia: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    marginTop: espacamento.sm,
  },
  revealAmostra: {
    color: COR_D010,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoMicro,
    fontWeight: tipografia.pesoBold,
    marginTop: espacamento.xs,
  },
  listaPalpites: { gap: espacamento.xs },
  palpiteLinha: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: espacamento.sm,
    paddingVertical: espacamento.sm,
    borderBottomColor: cores.borda,
    borderBottomWidth: 1,
  },
  palpiteNome: {
    color: cores.texto,
    flex: 1,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpo,
  },
  palpiteNota: {
    fontFamily: familias.sans,
    fontSize: 22,
    fontWeight: tipografia.pesoExtraBold,
    minWidth: 32,
    textAlign: 'center',
  },
  palpiteIndicador: {
    borderRadius: raio.sm,
    borderWidth: 1,
    paddingHorizontal: espacamento.sm,
    paddingVertical: 3,
  },
  palpiteErro: {
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoMicro,
    fontWeight: tipografia.pesoBold,
  },
  palpitePontos: {
    color: 'transparent', // base — cor sobrescrita por variantes abaixo
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    fontWeight: tipografia.pesoBold,
    minWidth: 32,
    textAlign: 'right',
  },
  palpitePontosExato: {
    color: COR_D010, // +2: verde vivo — acerto exato
  },
  palpitePontosBeirada: {
    color: '#6EE7B7', // +1: verde mais suave — beirada ±1
  },
  pontoRespondente: {
    backgroundColor: COR_D010_FUNDO,
    borderColor: COR_D010_BORDA,
    borderRadius: raio.md,
    borderWidth: 1,
    marginTop: espacamento.md,
    padding: espacamento.md,
  },
  pontoRespondenteZero: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: cores.borda,
  },
  pontoRespondenteTexto: {
    color: COR_D010,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
  },
  pontoRespondenteTextoZero: {
    color: cores.textoMudo,
  },
  placarContainer: {
    marginTop: espacamento.xl,
    gap: espacamento.xs,
  },
  placarTitulo: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    fontWeight: tipografia.pesoBold,
    letterSpacing: 1,
    marginBottom: espacamento.sm,
    textTransform: 'uppercase',
  },
  placarLinha: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: espacamento.sm,
    paddingVertical: 6,
  },
  placarLinhaVencedor: {
    backgroundColor: COR_D010_FUNDO,
    borderRadius: raio.sm,
    paddingHorizontal: espacamento.sm,
  },
  placarPosicao: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    width: 20,
  },
  placarNome: {
    color: cores.texto,
    flex: 1,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpo,
  },
  placarPontos: {
    color: cores.textoSecundario,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpo,
    fontWeight: tipografia.pesoBold,
  },

  // ── Fim ──
  corpoFim: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: espacamento.xl,
  },
  fimEmoji: { fontSize: 56, marginBottom: espacamento.md },
  fimTitulo: {
    color: cores.texto,
    fontFamily: familias.sans,
    fontSize: 28,
    fontWeight: tipografia.pesoExtraBold,
    marginBottom: espacamento.xs,
  },
  fimSubtitulo: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpo,
    marginBottom: espacamento.xl,
  },
  placarFim: {
    alignSelf: 'stretch',
    gap: espacamento.xs,
  },
  fimVencedor: {
    color: COR_D010,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpo,
    fontWeight: tipografia.pesoBold,
    marginTop: espacamento.md,
    textAlign: 'center',
  },

  // ── Shared ──
  rodape: {
    padding: espacamento.md,
    paddingBottom: espacamento.lg,
  },
  rodapePrivado: {
    padding: espacamento.md,
    paddingBottom: espacamento.lg,
    backgroundColor: COR_TELA_PRIVADA,
  },
  botaoPrimario: {
    alignItems: 'center',
    backgroundColor: COR_D010,
    borderRadius: raio.pill,
    minHeight: 52,
    justifyContent: 'center',
    paddingHorizontal: espacamento.xl,
    paddingVertical: espacamento.md,
  },
  botaoPrimarioDesabilitado: {
    backgroundColor: cores.borda,
  },
  botaoPrimarioTexto: {
    color: '#FFFFFF',
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpo,
    fontWeight: tipografia.pesoExtraBold,
  },
  botaoPrimarioTextoDesabilitado: {
    color: cores.textoMudo,
  },
  pressionado: {
    opacity: 0.72,
    transform: [{ scale: 0.98 }],
  },
});
