import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  BotaoPrimario,
  BotaoSecundario,
  BotaoEncerrarJogo,
  FeedbackSessao,
  Temporizador,
} from '@/components';
import type { Player } from '@/engine/types';
import { getCategoriaFazAi } from '@/games/faz-ai/cards';
import { criarResultadoFinalFazAi, fazAiEngine } from '@/games/faz-ai/engine';
import type {
  AtuabilidadeFazAi,
  FazAiAction,
  FazAiPublicState,
  HistoricoTurnoFazAi,
  ModoAtuacaoFazAi,
} from '@/games/faz-ai/types';
import type { RootStackParamList } from '@/navigation/types';
import {
  processarResultadoFazAi,
  processarTurnoFazAi,
} from '@/session/fazAiLocalAdapter';
import { cores, espacamento, familias, raio, tipografia } from '@/theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'JogoLocalFazAi'>;
type TipoAcaoFazAi = FazAiAction['tipo'];

const TEMPO_CARTA_VISIVEL_MS = 3600;
const INTERVALO_TIMER_MS = 200;

function criarPlayers(jogadores: { id: string; nome: string }[]): Player[] {
  return jogadores.map((jogador, indice) => ({
    id: jogador.id,
    nome: jogador.nome,
    papelSecreto: null,
    ehAnfitriao: indice === 0,
    estaConectado: true,
    entrouEm: Date.now() + indice,
  }));
}

function nomeJogador(
  jogadores: { id: string; nome: string }[],
  jogadorId: string | null,
): string {
  return (
    jogadores.find((jogador) => jogador.id === jogadorId)?.nome ?? 'alguém'
  );
}

function textoIntensidade(publico: FazAiPublicState): string {
  if (publico.intensidade === 'absurda') return 'perigo social';
  if (publico.intensidade === 'caotica') return 'caos liberado';
  if (publico.intensidade === 'social') return 'vergonha controlada';
  return 'mistura progressiva';
}

function comentarioTurno(turno: HistoricoTurnoFazAi): string {
  if (turno.cartas.length === 0) return 'o corpo recusou participar.';
  if (turno.acertos >= 4 && turno.passes === 0)
    return 'limpo demais. suspeito.';
  if (turno.acertos >= 4) return 'o grupo reconheceu rápido.';
  if (turno.passes > turno.acertos) return 'atuação conceitual. talvez demais.';
  if (turno.vergonhaMedia >= 3) return 'a vergonha fez o trabalho.';
  if (turno.acertos === 0) return 'ninguém entendeu. isso também diz muito.';
  return 'deu pra reconhecer. do jeito que deu.';
}

function dicaModoAtuacao(modo: ModoAtuacaoFazAi): string {
  if (modo === 'gesto') return 'vai no gesto';
  if (modo === 'objeto') return 'usa objeto imaginário';
  if (modo === 'personagem') return 'vira o personagem';
  if (modo === 'emocao') return 'mostra pela cara';
  if (modo === 'referencia') return 'puxa a referência';
  return 'faz a cena';
}

function textoAtuabilidade(atuabilidade: AtuabilidadeFazAi): string {
  if (atuabilidade === 'direta') return 'direta';
  if (atuabilidade === 'boa') return 'boa de atuar';
  if (atuabilidade === 'sutil') return 'mais sutil';
  return 'difícil';
}

function exemplosResposta(respostas?: string[]): string | null {
  if (!respostas || respostas.length === 0) return null;
  return respostas.length >= 2 ? respostas.slice(0, 2).join(' / ') : null;
}

export function TelaJogoLocalFazAi({ navigation, route }: Props) {
  const {
    jogadores,
    duracaoSegundos,
    rodadasPorJogador,
    categorias,
    intensidade,
  } = route.params;

  const players = useMemo(() => criarPlayers(jogadores), [jogadores]);
  const [estado, setEstado] = useState(() =>
    fazAiEngine.criarEstadoInicial(players, jogadores[0]?.id ?? 'local-0', {
      duracaoSegundos,
      rodadasPorJogador,
      categorias,
      intensidade,
    }),
  );
  const [agora, setAgora] = useState(Date.now());
  const [cartaVisivel, setCartaVisivel] = useState(false);
  const turnosProcessados = useRef(new Set<string>());
  const resultadoProcessado = useRef(false);

  const publico = estado.estadoPublico;
  const jogadorAtualId = publico.ordemJogadores[publico.indiceTurno] ?? null;
  const jogadorAtualNome = nomeJogador(jogadores, jogadorAtualId);
  const cartaAtual = jogadorAtualId
    ? estado.estadosPrivados[jogadorAtualId]?.carta
    : null;
  const cartaAtualId = cartaAtual?.id ?? null;
  const segundosRestantes = publico.prazoTurnoEm
    ? Math.max(0, (publico.prazoTurnoEm - agora) / 1000)
    : publico.duracaoSegundos;
  const ultimoTurno = publico.historico.at(-1) ?? null;

  useEffect(() => {
    const timer = setInterval(() => setAgora(Date.now()), INTERVALO_TIMER_MS);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (publico.subFase !== 'atuando') return;
    if (!publico.prazoTurnoEm || publico.prazoTurnoEm > agora) return;
    finalizarTurnoPorTempo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agora, publico.prazoTurnoEm, publico.subFase]);

  useEffect(() => {
    if (publico.subFase !== 'atuando' || !cartaAtualId) return;
    setCartaVisivel(true);
    const timeout = setTimeout(
      () => setCartaVisivel(false),
      TEMPO_CARTA_VISIVEL_MS,
    );
    return () => clearTimeout(timeout);
  }, [cartaAtualId, publico.subFase]);

  function registrarTurnoSeNecessario(turno: HistoricoTurnoFazAi | null) {
    if (!turno) return;
    const chave = `${turno.jogadorId}-${turno.iniciadoEm}`;
    if (turnosProcessados.current.has(chave)) return;
    turnosProcessados.current.add(chave);
    processarTurnoFazAi({
      rodada: turno.rodada,
      jogadorId: turno.jogadorId,
      acertos: turno.acertos,
      passes: turno.passes,
      cartas: turno.cartas,
      energiaMedia: turno.energiaMedia,
      vergonhaMedia: turno.vergonhaMedia,
      duracaoMs: Math.max(0, turno.finalizadoEm - turno.iniciadoEm),
    });
  }

  function processarResultadoSeNecessario(publicoFinal: FazAiPublicState) {
    if (resultadoProcessado.current) return;
    resultadoProcessado.current = true;
    processarResultadoFazAi(criarResultadoFinalFazAi(publicoFinal));
  }

  function aplicarAcao(tipo: TipoAcaoFazAi) {
    if (!jogadorAtualId) return;
    const novoEstado = fazAiEngine.processarAcao(estado, {
      tipo,
      jogadorId: jogadorAtualId,
      payload: {},
      em: Date.now(),
    } as FazAiAction);

    if (novoEstado === estado) return;

    if (tipo === 'comecar') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setCartaVisivel(true);
    }
    if (tipo === 'acertou') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setCartaVisivel(true);
    }
    if (tipo === 'passou') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setCartaVisivel(true);
    }
    if (tipo === 'tempo_esgotado') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      registrarTurnoSeNecessario(
        novoEstado.estadoPublico.historico.at(-1) ?? null,
      );
    }
    if (tipo === 'avancar') {
      void Haptics.selectionAsync();
      if (novoEstado.estadoPublico.subFase === 'finalizado') {
        processarResultadoSeNecessario(novoEstado.estadoPublico);
      }
    }

    setEstado(novoEstado);
  }

  function finalizarTurnoPorTempo() {
    if (publico.subFase !== 'atuando') return;
    aplicarAcao('tempo_esgotado');
  }

  function sair() {
    navigation.navigate('Inicio');
  }

  return (
    <SafeAreaView style={estilos.tela} edges={['top', 'bottom']}>
      {publico.subFase !== 'finalizado' ? (
        <BotaoEncerrarJogo onConfirmar={sair} />
      ) : null}

      {publico.subFase === 'preparando' && (
        <TelaPreparando
          nome={jogadorAtualNome}
          rodada={estado.rodada}
          totalRodadas={rodadasPorJogador}
          meta={textoIntensidade(publico)}
          onComecar={() => aplicarAcao('comecar')}
        />
      )}

      {publico.subFase === 'atuando' && cartaAtual && (
        <TelaAtuando
          cartaVisivel={cartaVisivel}
          cartaTexto={cartaAtual.texto}
          categoria={getCategoriaFazAi(cartaAtual.categoria).nome}
          dicaAtuacao={dicaModoAtuacao(cartaAtual.modoAtuacao)}
          nivelAtuacao={textoAtuabilidade(cartaAtual.atuabilidade)}
          exemploResposta={exemplosResposta(cartaAtual.respostasAceitas)}
          jogadorNome={jogadorAtualNome}
          segundosTotais={publico.duracaoSegundos}
          segundosRestantes={segundosRestantes}
          acertos={publico.acertosTurnoAtual}
          passes={publico.passesTurnoAtual}
          onEsconder={() => setCartaVisivel(false)}
          onMostrar={() => setCartaVisivel(true)}
          onAcertou={() => aplicarAcao('acertou')}
          onPassou={() => aplicarAcao('passou')}
        />
      )}

      {publico.subFase === 'resumo_turno' && ultimoTurno && (
        <TelaResumoTurno
          nome={nomeJogador(jogadores, ultimoTurno.jogadorId)}
          turno={ultimoTurno}
          comentario={comentarioTurno(ultimoTurno)}
          onProximo={() => aplicarAcao('avancar')}
        />
      )}

      {publico.subFase === 'finalizado' && (
        <TelaFinal jogadores={jogadores} publico={publico} onInicio={sair} />
      )}
    </SafeAreaView>
  );
}

function TelaPreparando({
  nome,
  rodada,
  totalRodadas,
  meta,
  onComecar,
}: {
  nome: string;
  rodada: number;
  totalRodadas: number;
  meta: string;
  onComecar: () => void;
}) {
  return (
    <View style={estilos.centro}>
      <Text style={estilos.eyebrow}>
        rodada {rodada} de {totalRodadas}
      </Text>
      <Text style={estilos.tituloGrande}>passa pra {nome}</Text>
      <Text style={estilos.subtitulo}>lê rápido. atua mais rápido.</Text>
      <View style={estilos.pill}>
        <Text style={estilos.pillTexto}>{meta}</Text>
      </View>
      <BotaoPrimario titulo="ver carta" onPress={onComecar} />
    </View>
  );
}

function TelaAtuando({
  cartaVisivel,
  cartaTexto,
  categoria,
  dicaAtuacao,
  nivelAtuacao,
  exemploResposta,
  jogadorNome,
  segundosTotais,
  segundosRestantes,
  acertos,
  passes,
  onEsconder,
  onMostrar,
  onAcertou,
  onPassou,
}: {
  cartaVisivel: boolean;
  cartaTexto: string;
  categoria: string;
  dicaAtuacao: string;
  nivelAtuacao: string;
  exemploResposta: string | null;
  jogadorNome: string;
  segundosTotais: number;
  segundosRestantes: number;
  acertos: number;
  passes: number;
  onEsconder: () => void;
  onMostrar: () => void;
  onAcertou: () => void;
  onPassou: () => void;
}) {
  return (
    <View style={estilos.jogo}>
      <View style={estilos.topoJogo}>
        <View>
          <Text style={estilos.eyebrow}>{jogadorNome}</Text>
          <Text style={estilos.tituloJogo}>faz aí</Text>
        </View>
        <Temporizador
          segundosTotais={segundosTotais}
          segundosRestantes={segundosRestantes}
          tamanho={92}
        />
      </View>

      <View style={estilos.cartaoArea}>
        {cartaVisivel ? (
          <Pressable
            onPress={onEsconder}
            style={({ pressed }) => [
              estilos.cartaoCarta,
              pressed && estilos.pressionado,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Esconder carta"
          >
            <Text style={estilos.categoria}>{categoria}</Text>
            <View style={estilos.dicasLinha}>
              <Text style={estilos.dicaChip}>{dicaAtuacao}</Text>
              <Text style={estilos.dicaChip}>{nivelAtuacao}</Text>
            </View>
            <Text style={estilos.cartaTexto}>{cartaTexto}</Text>
            <Text style={estilos.regraAcerto}>
              {exemploResposta
                ? `vale algo tipo: ${exemploResposta}`
                : 'vale acertar a ideia. não precisa ser literal.'}
            </Text>
            <Text style={estilos.esconderTexto}>toca pra esconder</Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={onMostrar}
            style={({ pressed }) => [
              estilos.cartaoEscondido,
              pressed && estilos.pressionado,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Mostrar carta de novo"
          >
            <Text style={estilos.escondidoTitulo}>celular pra baixo</Text>
            <Text style={estilos.escondidoTexto}>o grupo olha pra pessoa.</Text>
          </Pressable>
        )}
      </View>

      <View style={estilos.placarLinha}>
        <Text style={estilos.placarTexto}>
          {acertos} acerto{acertos === 1 ? '' : 's'}
        </Text>
        <Text style={estilos.placarTexto}>
          {passes} passada{passes === 1 ? '' : 's'}
        </Text>
      </View>

      <View style={estilos.acoes}>
        <Pressable
          onPress={onPassou}
          style={({ pressed }) => [
            estilos.botaoAcao,
            estilos.botaoPassar,
            pressed && estilos.pressionado,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Passar carta"
        >
          <Text style={estilos.botaoPassarTexto}>passar</Text>
        </Pressable>
        <Pressable
          onPress={onAcertou}
          style={({ pressed }) => [
            estilos.botaoAcao,
            estilos.botaoAcertou,
            pressed && estilos.pressionado,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Marcar que acertaram a ideia"
        >
          <Text style={estilos.botaoAcertouTexto}>acertou a ideia</Text>
        </Pressable>
      </View>
    </View>
  );
}

function TelaResumoTurno({
  nome,
  turno,
  comentario,
  onProximo,
}: {
  nome: string;
  turno: HistoricoTurnoFazAi;
  comentario: string;
  onProximo: () => void;
}) {
  return (
    <View style={estilos.resumo}>
      <Text style={estilos.eyebrow}>{nome}</Text>
      <Text style={estilos.tituloGrande}>
        {turno.acertos} acerto{turno.acertos === 1 ? '' : 's'}.
      </Text>
      <Text style={estilos.subtitulo}>{comentario}</Text>

      <ScrollView
        style={estilos.listaCartas}
        contentContainerStyle={estilos.listaCartasConteudo}
        showsVerticalScrollIndicator={false}
      >
        {turno.cartas.map((carta) => (
          <View
            key={`${carta.cartaId}-${carta.duracaoMs}`}
            style={estilos.itemCarta}
          >
            <Text style={estilos.itemCartaTexto}>{carta.texto}</Text>
            {carta.resultado === 'passou' &&
              carta.ideiaCentral !== carta.texto && (
                <Text style={estilos.itemCartaIdeia}>
                  ideia: {carta.ideiaCentral}
                </Text>
              )}
            {carta.resultado === 'passou' && carta.respostasAceitas?.length ? (
              <Text style={estilos.itemCartaIdeia}>
                valia: {exemplosResposta(carta.respostasAceitas)}
              </Text>
            ) : null}
            <Text
              style={[
                estilos.itemCartaResultado,
                carta.resultado === 'acertou' && estilos.itemCartaAcerto,
              ]}
            >
              {carta.resultado === 'acertou' ? 'acertou' : 'passou'}
            </Text>
          </View>
        ))}
      </ScrollView>

      <BotaoPrimario titulo="próximo" onPress={onProximo} />
    </View>
  );
}

function TelaFinal({
  jogadores,
  publico,
  onInicio,
}: {
  jogadores: { id: string; nome: string }[];
  publico: FazAiPublicState;
  onInicio: () => void;
}) {
  const resultado = criarResultadoFinalFazAi(publico);
  const maisAcertou = nomeJogador(jogadores, resultado.quemMaisAcertaId);
  const maisCaotico = nomeJogador(jogadores, resultado.jogadorMaisCaoticoId);
  const piorAtor = nomeJogador(jogadores, resultado.quemAtuaPiorId);

  return (
    <View style={estilos.final}>
      <Text style={estilos.eyebrow}>fim de sessão</Text>
      <Text style={estilos.tituloGrande}>o grupo sobreviveu.</Text>
      <View style={estilos.finalCards}>
        <ResumoFinalItem rotulo="mais reconhecido" valor={maisAcertou} />
        <ResumoFinalItem rotulo="mais caótico" valor={maisCaotico} />
        <ResumoFinalItem rotulo="atuação duvidosa" valor={piorAtor} />
      </View>
      <Text style={estilos.finalMeta}>
        {resultado.totalCartas} cenas jogadas · vergonha média{' '}
        {resultado.vergonhaColetiva.toFixed(1)}
      </Text>
      <FeedbackSessao jogoId="faz-ai" />
      <BotaoPrimario titulo="voltar pra home" onPress={onInicio} />
      <BotaoSecundario titulo="jogar outro" onPress={onInicio} />
    </View>
  );
}

function ResumoFinalItem({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <View style={estilos.finalItem}>
      <Text style={estilos.finalRotulo}>{rotulo}</Text>
      <Text style={estilos.finalValor}>{valor}</Text>
    </View>
  );
}

const COR_CARTA_FUNDO = '#FFFDF8';
const COR_ACERTO = '#22C55E';
const COR_PASSAR = '#E7E2DA';

const estilos = StyleSheet.create({
  acoes: {
    flexDirection: 'row',
    gap: espacamento.sm,
  },
  botaoAcao: {
    alignItems: 'center',
    borderRadius: raio.lg,
    flex: 1,
    justifyContent: 'center',
    minHeight: 64,
  },
  botaoAcertou: {
    backgroundColor: cores.texto,
  },
  botaoAcertouTexto: {
    color: cores.fundo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpo,
    fontWeight: tipografia.pesoExtraBold,
  },
  botaoPassar: {
    backgroundColor: COR_PASSAR,
  },
  botaoPassarTexto: {
    color: cores.textoSecundario,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpo,
    fontWeight: tipografia.pesoExtraBold,
  },
  cartaoArea: {
    flex: 1,
    justifyContent: 'center',
  },
  cartaoCarta: {
    backgroundColor: COR_CARTA_FUNDO,
    borderColor: cores.borda,
    borderRadius: raio.xl,
    borderWidth: 1,
    gap: espacamento.md,
    minHeight: 330,
    padding: espacamento.lg,
  },
  cartaoEscondido: {
    alignItems: 'center',
    backgroundColor: cores.texto,
    borderRadius: raio.xl,
    justifyContent: 'center',
    minHeight: 330,
    padding: espacamento.lg,
  },
  cartaTexto: {
    color: cores.texto,
    fontFamily: familias.sans,
    fontSize: 34,
    fontWeight: tipografia.pesoBlack,
    letterSpacing: 0,
    lineHeight: 38,
  },
  categoria: {
    color: cores.primaria,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    fontWeight: tipografia.pesoExtraBold,
  },
  centro: {
    flex: 1,
    gap: espacamento.lg,
    justifyContent: 'center',
    padding: espacamento.lg,
  },
  escondidoTexto: {
    color: cores.textoSobreEscuro,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpoMenor,
    marginTop: espacamento.xs,
    opacity: 0.72,
  },
  escondidoTitulo: {
    color: cores.textoSobreEscuro,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoTitulo,
    fontWeight: tipografia.pesoBlack,
    letterSpacing: 0,
  },
  dicaChip: {
    backgroundColor: cores.superficie,
    borderColor: cores.borda,
    borderRadius: raio.pill,
    borderWidth: 1,
    color: cores.textoSecundario,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoMicro,
    fontWeight: tipografia.pesoBold,
    paddingHorizontal: espacamento.sm,
    paddingVertical: 6,
  },
  dicasLinha: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: espacamento.xs,
  },
  esconderTexto: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    marginTop: 'auto',
  },
  eyebrow: {
    color: cores.primaria,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    fontWeight: tipografia.pesoExtraBold,
    letterSpacing: 0,
  },
  final: {
    flex: 1,
    gap: espacamento.lg,
    justifyContent: 'center',
    padding: espacamento.lg,
  },
  finalCards: {
    gap: espacamento.sm,
  },
  finalItem: {
    backgroundColor: cores.superficie,
    borderColor: cores.borda,
    borderRadius: raio.lg,
    borderWidth: 1,
    padding: espacamento.md,
  },
  finalMeta: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    lineHeight: 18,
    textAlign: 'center',
  },
  finalRotulo: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoMicro,
    fontWeight: tipografia.pesoBold,
    marginBottom: 2,
  },
  finalValor: {
    color: cores.texto,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpo,
    fontWeight: tipografia.pesoExtraBold,
  },
  itemCarta: {
    alignItems: 'flex-start',
    backgroundColor: cores.superficie,
    borderColor: cores.borda,
    borderRadius: raio.lg,
    borderWidth: 1,
    gap: espacamento.xs,
    padding: espacamento.md,
  },
  itemCartaAcerto: {
    color: COR_ACERTO,
  },
  itemCartaResultado: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoMicro,
    fontWeight: tipografia.pesoBold,
  },
  itemCartaIdeia: {
    color: cores.textoSecundario,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoMicro,
    lineHeight: 16,
  },
  itemCartaTexto: {
    color: cores.texto,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpoMenor,
    fontWeight: tipografia.pesoSemibold,
    lineHeight: 20,
  },
  jogo: {
    flex: 1,
    gap: espacamento.md,
    padding: espacamento.lg,
    paddingTop: espacamento.xl + espacamento.md,
  },
  listaCartas: {
    flexGrow: 0,
    maxHeight: 280,
  },
  listaCartasConteudo: {
    gap: espacamento.sm,
  },
  pill: {
    alignSelf: 'flex-start',
    backgroundColor: cores.superficie,
    borderColor: cores.borda,
    borderRadius: raio.pill,
    borderWidth: 1,
    paddingHorizontal: espacamento.md,
    paddingVertical: espacamento.sm,
  },
  pillTexto: {
    color: cores.textoSecundario,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    fontWeight: tipografia.pesoBold,
  },
  placarLinha: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  placarTexto: {
    color: cores.textoSecundario,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    fontWeight: tipografia.pesoBold,
  },
  pressionado: {
    opacity: 0.82,
    transform: [{ scale: 0.98 }],
  },
  regraAcerto: {
    color: cores.textoSecundario,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpoMenor,
    lineHeight: 20,
  },
  resumo: {
    flex: 1,
    gap: espacamento.lg,
    justifyContent: 'center',
    padding: espacamento.lg,
  },
  subtitulo: {
    color: cores.textoSecundario,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpo,
    lineHeight: 24,
  },
  tela: {
    backgroundColor: cores.fundo,
    flex: 1,
  },
  tituloGrande: {
    color: cores.texto,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoTituloGrande,
    fontWeight: tipografia.pesoBlack,
    letterSpacing: 0,
    lineHeight: 38,
  },
  tituloJogo: {
    color: cores.texto,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoTitulo,
    fontWeight: tipografia.pesoBlack,
    letterSpacing: 0,
  },
  topoJogo: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
