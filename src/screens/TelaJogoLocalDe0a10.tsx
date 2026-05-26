import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import {
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
  calcularResultadoRodada,
  criarSessao,
  getCategoria,
  iniciarPalpites,
  iniciarRodada,
  jogoEncerrado,
  registrarPalpite,
  registrarRespostas,
  respondenteDaRodada,
  type CategoriaId,
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
const COR_PROX = '#F59E0B';   // palpite ±2 — aviso
const COR_LONGE = '#EF4444';  // palpite ±3+ — longe
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
        <Text
          style={estilos.vezDeNome}
          numberOfLines={2}
          adjustsFontSizeToFit
        >
          {respondente.nome}
        </Text>
        <Text style={estilos.vezDeContador}>
          rodada {sessao.rodadasCompletas + 1} de {sessao.totalRodadas}
        </Text>

        <View style={estilos.vezDeDivider} />

        <Text style={estilos.vezDeInstrucao}>
          passe o celular para {respondente.nome}.{'\n'}
          quando estiver pronto, toque em "começar".
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
}: {
  sessao: SessaoDe0a10;
  onMostrar: (respostas: RespostaCategoria[]) => void;
}) {
  const rodada = sessao.rodadaAtual!;
  const [textos, setTextos] = useState<Record<string, string>>(
    Object.fromEntries(rodada.categorias.map((id) => [id, ''])),
  );
  const [puladas, setPuladas] = useState<Set<CategoriaId>>(new Set());

  const respostasValidas = rodada.categorias.filter(
    (id) => !puladas.has(id) && textos[id]!.trim().length > 0,
  );
  const podeConfirmar = respostasValidas.length >= 2;

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
    const respostas: RespostaCategoria[] = rodada.categorias.map((id) => ({
      categoriaId: id,
      resposta: puladas.has(id) ? null : textos[id]!.trim() || null,
    }));
    onMostrar(respostas);
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <SafeAreaView
        style={[estilos.tela, { backgroundColor: COR_TELA_PRIVADA }]}
        edges={['top', 'bottom']}
      >
        {/* Nota em destaque */}
        <View style={estilos.notaContainer}>
          <Text style={estilos.notaLabel}>sua nota é</Text>
          <Text style={estilos.notaNumero}>{rodada.nota}</Text>
          <Text style={estilos.notaInstrucao}>
            responda cada categoria de acordo com ela.{'\n'}
            primeira associação que vier. não pense.
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
            return (
              <View
                key={id}
                style={[
                  estilos.campoCard,
                  pulada && estilos.campoCardPulado,
                ]}
              >
                <View style={estilos.campoHeader}>
                  <Text style={estilos.campoEmoji}>{cat.emoji}</Text>
                  <Text style={[estilos.campoNome, pulada && estilos.campoNomePulado]}>
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
                    accessibilityLabel={pulada ? `Desfazer pulo de ${cat.nome}` : `Pular ${cat.nome}`}
                    disabled={!pulada && puladas.size >= 1}
                  >
                    <Text
                      style={[
                        estilos.chipPularTexto,
                        pulada && estilos.chipPularTextoAtivo,
                        !pulada && puladas.size >= 1 && estilos.chipPularDesabilitado,
                      ]}
                    >
                      {pulada ? 'desfa.' : 'pular'}
                    </Text>
                  </Pressable>
                </View>
                {!pulada && (
                  <TextInput
                    style={estilos.campoInput}
                    placeholder={cat.instrucao}
                    placeholderTextColor="rgba(255,255,255,0.25)"
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
                {pulada && (
                  <Text style={estilos.campoPuladoTexto}>—</Text>
                )}
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
        style={{ flex: 1 }}
        contentContainerStyle={estilos.scrollDebateConteudo}
        showsVerticalScrollIndicator={false}
      >
        <Text style={estilos.debateTitulo}>o que {rodada.respondente.nome} disse</Text>
        <Text style={estilos.debateSubtitulo}>
          discutam o padrão. qual é a nota?
        </Text>

        <View style={estilos.listaRespostas}>
          {rodada.categorias.map((id) => {
            const cat = getCategoria(id);
            const resp = rodada.respostas.find((r) => r.categoriaId === id);
            const texto = resp?.resposta ?? null;
            return (
              <View key={id} style={estilos.respostaLinha}>
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
}: {
  sessao: SessaoDe0a10;
  onVotar: (nota: NotaDe0a10) => void;
}) {
  const rodada = sessao.rodadaAtual!;
  const votante = adivinhandorAtual(sessao);
  const [selecionado, setSelecionado] = useState<NotaDe0a10 | null>(null);
  const totalAdivinhadores = rodada.adivinhadores.length;
  const votosFeitos = rodada.palpites.length;

  if (!votante) return null;

  return (
    <SafeAreaView
      style={[estilos.tela, { backgroundColor: COR_TELA_PRIVADA }]}
      edges={['top', 'bottom']}
    >
      <View style={estilos.headerVotacao}>
        <Text style={estilos.votacaoIndicador}>
          {votosFeitos + 1} de {totalAdivinhadores}
        </Text>
        <Text style={estilos.votacaoLabel}>seu palpite, {votante.nome}</Text>
        <Text style={estilos.votacaoSubtitulo}>
          ninguém vai ver seu voto agora
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
          const sel = selecionado === n;
          return (
            <Pressable
              key={n}
              onPress={() => {
                void Haptics.selectionAsync();
                setSelecionado(n);
              }}
              style={({ pressed }) => [
                estilos.botoaoNota,
                sel && estilos.botoaoNotaSelecionado,
                pressed && estilos.pressionado,
              ]}
              accessibilityRole="radio"
              accessibilityState={{ selected: sel }}
              accessibilityLabel={`Nota ${n}`}
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

      {/* Extras: 0 e 10 */}
      <View style={estilos.gradeExtras}>
        {NOTAS_EXTRAS.map((n) => {
          const sel = selecionado === n;
          return (
            <Pressable
              key={n}
              onPress={() => {
                void Haptics.selectionAsync();
                setSelecionado(n);
              }}
              style={({ pressed }) => [
                estilos.botoaoNotaExtra,
                sel && estilos.botoaoNotaSelecionado,
                pressed && estilos.pressionado,
              ]}
              accessibilityRole="radio"
              accessibilityState={{ selected: sel }}
              accessibilityLabel={`Nota ${n}`}
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

      <View style={estilos.rodapePrivado}>
        <Pressable
          onPress={() => {
            if (selecionado === null) return;
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onVotar(selecionado);
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
    </SafeAreaView>
  );
}

// ─── Sub-tela: Reveal ─────────────────────────────────────────────────────────
function corPalpite(erro: number): string {
  if (erro <= 1) return COR_D010;
  if (erro <= 2) return COR_PROX;
  return COR_LONGE;
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
        style={{ flex: 1 }}
        contentContainerStyle={estilos.scrollRevealConteudo}
        showsVerticalScrollIndicator={false}
      >
        {/* Nota real */}
        <View style={estilos.revealNotaContainer}>
          <Text style={estilos.revealLabel}>
            a nota de {resultado.respondente.nome}
          </Text>
          <Text style={estilos.revealNota}>{resultado.notaReal}</Text>
          {resultado.divergencia >= 3 ? (
            <Text style={estilos.revealDivergencia}>
              🌊 grupo divergiu {resultado.divergencia} pontos
            </Text>
          ) : resultado.divergencia === 0 ? (
            <Text style={estilos.revealDivergencia}>✨ grupo unânime</Text>
          ) : (
            <Text style={estilos.revealDivergencia}>
              spread de {resultado.divergencia} ponto{resultado.divergencia !== 1 ? 's' : ''}
            </Text>
          )}
        </View>

        {/* Palpites */}
        <View style={estilos.listaPalpites}>
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
                <View style={[estilos.palpiteIndicador, { backgroundColor: cor + '20', borderColor: cor + '40' }]}>
                  <Text style={[estilos.palpiteErro, { color: cor }]}>
                    {erro === 0 ? '✓ exato' : erro === 1 ? '±1' : `±${erro}`}
                  </Text>
                </View>
                {sessao.modoCompetitivo && (
                  <Text style={estilos.palpitePontos}>
                    {pontos > 0 ? `+${pontos}` : ''}
                  </Text>
                )}
              </View>
            );
          })}
        </View>

        {/* Pontuação do respondente (modo competitivo) */}
        {sessao.modoCompetitivo && resultado.pontosRespondente > 0 && (
          <View style={estilos.pontoRespondente}>
            <Text style={estilos.pontoRespondenteTexto}>
              🎭 {resultado.respondente.nome} ganhou +1 por ser difícil de ler
            </Text>
          </View>
        )}

        {/* Placar corrente (modo competitivo) */}
        {sessao.modoCompetitivo && (
          <View style={estilos.placarContainer}>
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
          </View>
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
          {sessao.rodadasCompletas} rodada{sessao.rodadasCompletas !== 1 ? 's' : ''} no total
        </Text>

        {sessao.modoCompetitivo && (
          <View style={estilos.placarFim}>
            <Text style={estilos.placarTitulo}>placar final</Text>
            {[...sessao.placar]
              .sort((a, b) => b.total - a.total)
              .map((entrada, i) => (
                <View key={entrada.jogadorId} style={[
                  estilos.placarLinha,
                  i === 0 && estilos.placarLinhaVencedor,
                ]}>
                  <Text style={estilos.placarPosicao}>{i + 1}.</Text>
                  <Text style={estilos.placarNome} numberOfLines={1}>
                    {entrada.nome}
                  </Text>
                  <Text style={[estilos.placarPontos, i === 0 && { color: COR_D010 }]}>
                    {entrada.total} pt
                  </Text>
                </View>
              ))}
            {vencedor && (
              <Text style={estilos.fimVencedor}>
                🏆 {vencedor.nome} ganhou
              </Text>
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

  function handlePalpite(nota: NotaDe0a10) {
    setSessao((s) => {
      const nova = registrarPalpite(s, adivinhandorAtual(s)!.id, nota);
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
    return <TelaPalpites sessao={sessao} onVotar={handlePalpite} />;
  }

  if (sessao.subFase === 'reveal' && resultadoAtual) {
    const ultimaRodada =
      sessao.rodadasCompletas + 1 >= sessao.totalRodadas;
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
  campoInput: {
    color: '#FFFFFF',
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpo,
    paddingBottom: espacamento.xs,
    borderBottomColor: 'rgba(255,255,255,0.15)',
    borderBottomWidth: 1,
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
  listaRespostas: { gap: espacamento.sm },
  respostaLinha: {
    alignItems: 'center',
    backgroundColor: cores.superficie,
    borderColor: cores.borda,
    borderRadius: raio.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: espacamento.md,
    padding: espacamento.md,
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
  revealNotaContainer: {
    alignItems: 'center',
    marginBottom: espacamento.xl,
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
    color: COR_D010,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    fontWeight: tipografia.pesoBold,
    minWidth: 28,
    textAlign: 'right',
  },
  pontoRespondente: {
    backgroundColor: COR_D010_FUNDO,
    borderColor: COR_D010_BORDA,
    borderRadius: raio.md,
    borderWidth: 1,
    marginTop: espacamento.md,
    padding: espacamento.md,
  },
  pontoRespondenteTexto: {
    color: COR_D010,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
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
