import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BotaoPrimario, BotaoSecundario, BotaoVoltar } from '@/components';
import type { ArquivosCharacter } from '@/games/arquivos/types';
import { CASO_DOSSIE_SUMIDO } from '@/games/arquivos/casos';
import {
  processarEvidenciaLiberada,
  processarAcaoSecretaConcluida,
  processarVereditoRegistrado,
  processarResultadoArquivos,
} from '@/session/arquivosAdapter';
import type {
  ArquivosEvidence,
  ArquivosPhase,
  ArquivosPrivateFile,
  ArquivosPrivateSecretActionState,
  ArquivosPrivateState,
  ArquivosPublicState,
  ArquivosQuestionId,
  ArquivosSecretActionId,
  ArquivosVerdictAnswer,
} from '@/games/arquivos/types';
import { obterProximaFase } from '@/games/arquivos/phaseMachine';
import type { RootStackParamList } from '@/navigation/types';
import type { ArquivosConnectionState } from '@/services/arquivosRealtime';
import {
  avancarFaseArquivosRealtime,
  concluirAcaoSecretaArquivos,
  marcarLeituraConcluidaArquivos,
  observarConexaoArquivos,
  observarEstadoPrivadoArquivos,
  observarEstadoPublicoArquivos,
  recusarAcaoSecretaArquivos,
  reconectarPresencaArquivos,
  registrarVereditoArquivosRealtime,
} from '@/services/arquivosRealtime';
import { logError, logInfo, limparLogsArquivos } from '@/services/arquivosLogger';
import { cores, espacamento, familias, raio, sombra, tipografia } from '@/theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Game'>;

/**
 * Cor identidade de Arquivos — azul investigação.
 *
 * O jogo é sobre reconstrução de evidências e documentos — o azul "conversa"
 * do sistema de cores comunica esse tom sem criar um produto diferente.
 * Usado como acento em bordas de destaque, horários de linha do tempo e
 * indicadores de progresso em lugar do vermelho social.
 */
const COR_ARQUIVOS = cores.conversa;

const ROTULOS_FASE: Record<ArquivosPhase, string> = {
  lobby: 'lobby',
  apresentacao_caso: 'apresentação',
  leitura_privada: 'leitura privada',
  investigacao_inicial: 'investigação',
  nova_evidencia: 'nova evidência',
  confronto: 'confronto',
  veredito: 'veredito',
  revelacao_resultados: 'revelação',
  finalizado: 'finalizado',
};

const ORIENTACOES_FASE: Record<
  ArquivosPhase,
  { titulo: string; texto: string }
> = {
  lobby: {
    titulo: 'aguardando sala',
    texto: 'o caso ainda não começou.',
  },
  apresentacao_caso: {
    titulo: 'entrem no caso',
    texto:
      'leiam o incidente em voz alta. a meta é reconstruir o que aconteceu — não encontrar um culpado a qualquer custo.',
  },
  leitura_privada: {
    titulo: 'não mostre a tela',
    texto:
      'leia tudo com calma. guarde o que pode te prejudicar — você decide quando revelar.',
  },
  investigacao_inicial: {
    titulo: 'mesa aberta',
    texto:
      'compartilhem o que sabem, resumam o que convém, escondam o que é arriscado. a conversa acontece aqui.',
  },
  nova_evidencia: {
    titulo: 'algo mudou',
    texto:
      'releiam a evidência abaixo. o que ela contradiz? quem ela favorece? o que vocês estavam errados?',
  },
  confronto: {
    titulo: 'fechem o caso',
    texto:
      'pressionem horários, inconsistências e omissões. o objetivo é chegar a uma versão que se sustente.',
  },
  veredito: {
    titulo: 'decisão final',
    texto:
      'discutam em voz alta e cheguem a um consenso. o anfitrião registra quando a mesa fechar.',
  },
  revelacao_resultados: {
    titulo: 'a verdade',
    texto:
      'veja o que realmente aconteceu e como o veredito do grupo se compara com a realidade.',
  },
  finalizado: {
    titulo: 'caso encerrado',
    texto: 'a investigação terminou. a história agora pertence à mesa.',
  },
};

const GRADE_LABELS = {
  caso_resolvido: 'caso resolvido',
  caso_quase_resolvido: 'quase resolvido',
  parcialmente_resolvido: 'parcialmente resolvido',
  verdade_distorcida: 'verdade distorcida',
  fracasso_investigativo: 'fracasso investigativo',
} as const;

const STATUS_INDIVIDUAL_LABELS = {
  alcancado: 'objetivo alcançado',
  parcial: 'objetivo parcial',
  falhou: 'objetivo falhou',
} as const;

/**
 * Chave de sessão para persistir o flag de resultado processado.
 *
 * Sprint 14 — Bug de duplo processamento documentado no Sprint 10:
 * se o jogador desconecta e reconecta durante revelacao_resultados,
 * o componente remonta e os useRefs são reinicializados, disparando
 * processarResultadoArquivos uma segunda vez.
 *
 * Solução: manter uma chave de sessão estável no escopo do módulo,
 * fora do componente, para sobreviver a remontagens.
 */
const resultadosProcessadosPorSessao = new Set<string>();

export function TelaArquivos({ navigation, route }: Props) {
  const { roomCode, jogadorId } = route.params;
  const [estadoPublico, setEstadoPublico] =
    useState<ArquivosPublicState | null>(null);
  const [estadoPrivado, setEstadoPrivado] =
    useState<ArquivosPrivateState | null>(null);
  const [conexao, setConexao] = useState<ArquivosConnectionState>('reconectando');
  const [erroEstado, setErroEstado] = useState<string | null>(null);
  const [marcandoLeitura, setMarcandoLeitura] = useState(false);
  const [avancandoFase, setAvancandoFase] = useState(false);
  const [enviandoVeredito, setEnviandoVeredito] = useState(false);
  const [resolvendoAcao, setResolvendoAcao] = useState(false);
  const [respostas, setRespostas] = useState<
    Record<ArquivosQuestionId, string>
  >({});

  // ── Refs para controle de sinais de sessão (evita duplicatas) ──────────────
  const evidenciasProcessadas = useRef<Set<string>>(new Set());
  // Chave de sessão estável: não é reinicializada em remontagens.
  const chaveResultadoSessao = `${roomCode}:${jogadorId}`;

  // ── Transição de fase — fade suave ao mudar de fase ────────────────────────
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const faseAnteriorRef = useRef<ArquivosPhase | null>(null);

  // ── Handlers públicos e privados ───────────────────────────────────────────

  const aoReceberEstadoPublico = useCallback(
    (novoEstado: ArquivosPublicState | null) => {
      if (novoEstado !== null) {
        setErroEstado(null);
      }
      setEstadoPublico(novoEstado);
    },
    [],
  );

  const aoReceberErroEstado = useCallback((erro: Error) => {
    logError(roomCode, 'erro_estado_publico', {
      mensagem: erro.message,
      jogadorId,
    });
    setErroEstado(erro.message);
  }, [roomCode, jogadorId]);

  // ── Observers de Firebase ──────────────────────────────────────────────────

  useEffect(() => {
    setErroEstado(null);
    // Funções de cancelamento inicializadas como no-op para evitar uso antes
    // de atribuição no bloco try. Se o setup falhar, o cleanup é seguro.
    let cancelarPublico: (() => void) = () => undefined;
    let cancelarPrivado: (() => void) = () => undefined;

    try {
      cancelarPublico = observarEstadoPublicoArquivos(
        roomCode,
        aoReceberEstadoPublico,
        aoReceberErroEstado,
      );
      cancelarPrivado = observarEstadoPrivadoArquivos(
        roomCode,
        jogadorId,
        setEstadoPrivado,
      );
    } catch (erro) {
      if (erro instanceof Error) aoReceberErroEstado(erro);
    }

    return () => {
      cancelarPublico();
      cancelarPrivado();
      limparLogsArquivos(roomCode);
    };
  }, [roomCode, jogadorId, aoReceberEstadoPublico, aoReceberErroEstado]);

  // ── Observar estado de conexão Firebase ────────────────────────────────────
  useEffect(() => {
    const cancelar = observarConexaoArquivos(setConexao);
    return cancelar;
  }, []);

  // ── Reconectar presença quando a conexão voltar ─────────────────────────────
  // Sprint 14: quando o Firebase reconecta, re-registra presença do jogador
  // para garantir que o onDisconnect seja atualizado para o próximo ciclo.
  const conexaoAnteriorRef = useRef<ArquivosConnectionState>('reconectando');
  useEffect(() => {
    const anterior = conexaoAnteriorRef.current;
    conexaoAnteriorRef.current = conexao;

    if (
      conexao === 'conectado' &&
      (anterior === 'offline' || anterior === 'reconectando')
    ) {
      logInfo(roomCode, 'reconexao_detectada', {
        jogadorId,
        estadoAnterior: anterior,
      });
      // Reconecta presença de forma best-effort — não bloqueia a UI.
      void reconectarPresencaArquivos(roomCode, jogadorId);
    }
  }, [conexao, roomCode, jogadorId]);

  // ── Transição de fase: fade ao mudar de fase ───────────────────────────────
  useEffect(() => {
    const fase = estadoPublico?.phase ?? null;
    if (faseAnteriorRef.current !== null && faseAnteriorRef.current !== fase) {
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 280,
        useNativeDriver: true,
      }).start();
    }
    faseAnteriorRef.current = fase;
  }, [estadoPublico?.phase, fadeAnim]);

  // ── Sinais de sessão: nova evidência liberada ───────────────────────────────
  useEffect(() => {
    if (!estadoPublico) return;
    if (estadoPublico.phase !== 'nova_evidencia') return;

    for (const record of estadoPublico.releasedPublicEvidences) {
      if (evidenciasProcessadas.current.has(record.evidenceId)) continue;
      evidenciasProcessadas.current.add(record.evidenceId);
      processarEvidenciaLiberada(record.evidenceId, 1);
    }
  }, [estadoPublico?.releasedPublicEvidences, estadoPublico?.phase]);

  // ── Sinais de sessão: resultado final disponível ────────────────────────────
  // Sprint 14: usa chave de sessão estável (módulo-level Set) para evitar
  // duplo processamento quando o componente remonta após reconexão.
  useEffect(() => {
    if (!estadoPublico || !estadoPrivado) return;
    if (resultadosProcessadosPorSessao.has(chaveResultadoSessao)) return;
    if (!estadoPublico.collectiveResult) return;
    if (
      estadoPublico.phase !== 'revelacao_resultados' &&
      estadoPublico.phase !== 'finalizado'
    )
      return;

    resultadosProcessadosPorSessao.add(chaveResultadoSessao);
    logInfo(roomCode, 'resultado_processado', { jogadorId });
    const resultadoIndividual = estadoPrivado.individualResult;
    processarResultadoArquivos({
      reveal: {
        caseId: estadoPublico.caseId,
        truth: CASO_DOSSIE_SUMIDO.truth,
        collectiveResult: estadoPublico.collectiveResult,
        // Apenas o resultado do jogador atual está disponível no cliente.
        // Outros resultados são privados e ficam em seus próprios dispositivos.
        individualResults: resultadoIndividual !== null ? [resultadoIndividual] : [],
      },
      state: {
        publicState: estadoPublico,
        privateStates: {},
        events: [],
      },
    });
  }, [
    estadoPublico?.collectiveResult,
    estadoPublico?.phase,
    estadoPrivado?.individualResult,
    chaveResultadoSessao,
    roomCode,
    jogadorId,
  ]);

  const arquivosVisiveis = useMemo(() => {
    if (!estadoPrivado) return [];
    return [...estadoPrivado.initialFiles, ...estadoPrivado.unlockedFiles];
  }, [estadoPrivado]);

  const evidenciasPublicas = useMemo(
    () =>
      (estadoPublico?.releasedPublicEvidences ?? [])
        .map((record) => encontrarEvidencia(record.evidenceId))
        .filter((evidencia): evidencia is ArquivosEvidence =>
          Boolean(evidencia),
        ),
    [estadoPublico?.releasedPublicEvidences],
  );

  const metainfosVisiveis = useMemo(() => {
    if (!estadoPublico || !estadoPrivado) return [];
    const meuChar = estadoPrivado.character.id;
    return estadoPublico.secretActionProgress
      .filter(
        (record) =>
          (record.status === 'concluida' || record.status === 'recusada') &&
          record.playerId !== jogadorId,
      )
      .flatMap((record) => {
        const action = CASO_DOSSIE_SUMIDO.secretActions.find(
          (a) => a.id === record.actionId,
        );
        if (!action) return [];
        if (!action.metainfoForCharacterIds.includes(meuChar)) return [];
        const quem =
          estadoPublico.players.find((p) => p.id === record.playerId)?.nome ??
          'alguém';
        return [
          {
            actionId: record.actionId,
            status: record.status,
            texto:
              record.status === 'concluida'
                ? `${quem} cumpriu uma ação privada nesta fase. Comportamento suspeito?`
                : `${quem} optou por não cumprir uma ação privada nesta fase.`,
          },
        ];
      });
  }, [estadoPublico, estadoPrivado, jogadorId]);

  async function aoConcluirLeitura() {
    if (marcandoLeitura) return;
    setMarcandoLeitura(true);
    try {
      await marcarLeituraConcluidaArquivos(roomCode, jogadorId);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (erro) {
      Alert.alert('não deu para marcar leitura', mensagemErro(erro));
    } finally {
      setMarcandoLeitura(false);
    }
  }

  async function aoAvancarFase() {
    if (!estadoPublico || avancandoFase) return;
    const proxima = obterProximaFase(estadoPublico.phase);
    if (!proxima) return;
    setAvancandoFase(true);
    try {
      await avancarFaseArquivosRealtime(roomCode, jogadorId, proxima);
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (erro) {
      Alert.alert('não deu para avançar', mensagemErro(erro));
    } finally {
      setAvancandoFase(false);
    }
  }

  function aoConfirmarForcarAvanco() {
    Alert.alert(
      'forçar avanço',
      'avançar mesmo sem todos terem concluído a leitura? jogadores que não terminaram perderão a leitura completa.',
      [
        { text: 'cancelar', style: 'cancel' },
        {
          text: 'avançar mesmo assim',
          style: 'destructive',
          onPress: () => {
            void aoAvancarFase();
          },
        },
      ],
    );
  }

  async function aoConcluirAcao(actionId: ArquivosSecretActionId) {
    if (resolvendoAcao) return;
    setResolvendoAcao(true);
    try {
      await concluirAcaoSecretaArquivos(roomCode, jogadorId, actionId);
      // Verifica se a ação tem metainformação para outros — sinal de suspeita social
      const action = CASO_DOSSIE_SUMIDO.secretActions.find(
        (a) => a.id === actionId,
      );
      const temMetainfo =
        (action?.metainfoForCharacterIds.length ?? 0) > 0;
      processarAcaoSecretaConcluida(jogadorId, actionId, 'concluida', temMetainfo, 1);
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (erro) {
      Alert.alert('não deu para concluir a ação', mensagemErro(erro));
    } finally {
      setResolvendoAcao(false);
    }
  }

  async function aoRecusarAcao(actionId: ArquivosSecretActionId) {
    if (resolvendoAcao) return;
    setResolvendoAcao(true);
    try {
      await recusarAcaoSecretaArquivos(roomCode, jogadorId, actionId);
      processarAcaoSecretaConcluida(jogadorId, actionId, 'recusada', false, 1);
    } catch (erro) {
      Alert.alert('não deu para recusar a ação', mensagemErro(erro));
    } finally {
      setResolvendoAcao(false);
    }
  }

  async function aoEnviarVeredito() {
    if (!estadoPublico || enviandoVeredito) return;
    // Guarda contra duplo envio: se o veredito já foi registrado, não envia novamente.
    if (estadoPublico.verdict !== null) return;
    const faltando = CASO_DOSSIE_SUMIDO.verdictQuestions.some(
      (question) => question.obrigatoria && !respostas[question.id],
    );
    if (faltando) {
      Alert.alert('veredito incompleto', 'responda as perguntas obrigatórias.');
      return;
    }

    const answeredAt = Date.now();
    const answers: ArquivosVerdictAnswer[] = CASO_DOSSIE_SUMIDO.verdictQuestions
      .filter((question) => respostas[question.id])
      .map((question) => ({
        questionId: question.id,
        value: respostas[question.id],
        answeredByPlayerId: jogadorId,
        answeredAt,
      }));

    setEnviandoVeredito(true);
    try {
      await registrarVereditoArquivosRealtime(roomCode, jogadorId, {
        submittedByPlayerId: jogadorId,
        submittedAt: answeredAt,
        answers,
      });
      processarVereditoRegistrado(1);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (erro) {
      Alert.alert('não deu para registrar', mensagemErro(erro));
    } finally {
      setEnviandoVeredito(false);
    }
  }

  // ── Estado de erro irrecuperável (estado corrompido ou inválido) ────────────
  if (erroEstado !== null) {
    return (
      <SafeAreaView style={[estilos.tela, estilos.centralizada]}>
        <View style={estilos.telaCarregamento}>
          <Text style={estilos.rotuloCarregamento}>arquivos</Text>
          <Text style={estilos.textoErroEstado}>
            não foi possível carregar o estado da partida.
          </Text>
          <Text style={estilos.textoCarregando}>
            feche e reabra o app. se o problema persistir, avise o anfitrião.
          </Text>
          <BotaoSecundario
            titulo="voltar ao início"
            onPress={() => navigation.navigate('Inicio')}
          />
        </View>
      </SafeAreaView>
    );
  }

  if (!estadoPublico || !estadoPrivado) {
    return (
      <SafeAreaView style={[estilos.tela, estilos.centralizada]}>
        <View style={estilos.telaCarregamento}>
          <Text style={estilos.rotuloCarregamento}>arquivos</Text>
          <ActivityIndicator
            color={COR_ARQUIVOS}
            size="small"
            accessibilityLabel="carregando arquivos"
          />
          <Text style={estilos.textoCarregando}>
            {conexao === 'offline' || conexao === 'reconectando'
              ? 'reconectando...'
              : 'abrindo seus arquivos...'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const ehHost = estadoPublico.hostPlayerId === jogadorId;
  const faseAtual = estadoPublico.phase;
  const orientacao = ORIENTACOES_FASE[faseAtual];
  const jaConcluiuLeitura =
    estadoPublico.phaseProgress.readyPlayerIds.includes(jogadorId);
  const prontos = estadoPublico.phaseProgress.readyPlayerIds.length;
  const totalEsperado = estadoPublico.phaseProgress.totalExpected;
  const todosLeram = prontos >= totalEsperado;
  const proximaFase = obterProximaFase(faseAtual);
  const podeAvancar =
    ehHost &&
    Boolean(proximaFase) &&
    faseAtual !== 'veredito' &&
    faseAtual !== 'finalizado' &&
    (faseAtual !== 'leitura_privada' || todosLeram);
  // Host pode forçar avanço na leitura_privada se houver jogadores desconectados
  // (prontos > 0 mas não todos) após um tempo ou por decisão explícita.
  const podeForcarAvanco =
    ehHost &&
    faseAtual === 'leitura_privada' &&
    !todosLeram &&
    prontos > 0;

  // Mapa de personagens atribuídos: playerId → ArquivosCharacter
  const personagensPorJogador = useMemo<
    ReadonlyMap<string, ArquivosCharacter>
  >(() => {
    const mapa = new Map<string, ArquivosCharacter>();
    for (const atribuicao of estadoPublico.assignments) {
      const personagem = CASO_DOSSIE_SUMIDO.characters.find(
        (c) => c.id === atribuicao.characterId,
      );
      if (personagem) {
        mapa.set(atribuicao.playerId, personagem);
      }
    }
    return mapa;
  }, [estadoPublico.assignments]);

  return (
    <SafeAreaView style={estilos.tela} edges={['top', 'bottom']}>
      {conexao !== 'conectado' && (
        <BannerReconexao estado={conexao} />
      )}
      <BotaoVoltar
        variante="fechar"
        posicao="direita"
        onPress={() => {
          logInfo(roomCode, 'saiu_da_partida', {
            jogadorId,
            fase: estadoPublico.phase,
          });
          navigation.navigate('Inicio');
        }}
      />

      <ScrollView
        contentContainerStyle={estilos.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
        <CabecalhoFase fase={faseAtual} titulo={orientacao.titulo} />
        <ResumoDaFase texto={orientacao.texto} />

        {faseAtual === 'apresentacao_caso' && (
          <>
            <IntroducaoCaso />
            <PersonagensNaMesa
              players={estadoPublico.players}
              personagensPorJogador={personagensPorJogador}
              jogadorAtualId={jogadorId}
            />
          </>
        )}

        {faseAtual === 'leitura_privada' && (
          <LeituraPrivada
            estadoPrivado={estadoPrivado}
            arquivos={arquivosVisiveis}
            jaConcluiuLeitura={jaConcluiuLeitura}
            marcandoLeitura={marcandoLeitura}
            prontos={prontos}
            totalEsperado={totalEsperado}
            onConcluirLeitura={aoConcluirLeitura}
          />
        )}

        {faseAtual === 'investigacao_inicial' && (
          <Investigacao
            estadoPrivado={estadoPrivado}
            arquivos={arquivosVisiveis}
            evidenciasPublicas={evidenciasPublicas}
            metainfos={metainfosVisiveis}
            resolvendoAcao={resolvendoAcao}
            players={estadoPublico.players}
            personagensPorJogador={personagensPorJogador}
            jogadorAtualId={jogadorId}
            onConcluirAcao={aoConcluirAcao}
            onRecusarAcao={aoRecusarAcao}
          />
        )}

        {faseAtual === 'nova_evidencia' && (
          <NovaEvidencia
            evidenciasPublicas={evidenciasPublicas}
            estadoPrivado={estadoPrivado}
            metainfos={metainfosVisiveis}
            resolvendoAcao={resolvendoAcao}
            onConcluirAcao={aoConcluirAcao}
            onRecusarAcao={aoRecusarAcao}
          />
        )}

        {faseAtual === 'confronto' && (
          <Confronto
            estadoPrivado={estadoPrivado}
            evidenciasPublicas={evidenciasPublicas}
            metainfos={metainfosVisiveis}
            resolvendoAcao={resolvendoAcao}
            onConcluirAcao={aoConcluirAcao}
            onRecusarAcao={aoRecusarAcao}
          />
        )}

        {faseAtual === 'veredito' && (
          <Veredito
            ehHost={ehHost}
            respostas={respostas}
            enviando={enviandoVeredito}
            vereditoRegistrado={estadoPublico.verdict !== null}
            onEscolher={(questionId, value) =>
              setRespostas((atuais) => ({ ...atuais, [questionId]: value }))
            }
            onEnviar={aoEnviarVeredito}
          />
        )}

        {(faseAtual === 'revelacao_resultados' ||
          faseAtual === 'finalizado') && (
          <Revelacao
            estadoPublico={estadoPublico}
            estadoPrivado={estadoPrivado}
          />
        )}

        {faseAtual === 'finalizado' && (
          <TelaCasoEncerrado onVoltar={() => navigation.navigate('Inicio')} />
        )}
        </Animated.View>
      </ScrollView>

      {ehHost &&
        faseAtual !== 'veredito' &&
        faseAtual !== 'revelacao_resultados' &&
        faseAtual !== 'finalizado' && (
          <View style={estilos.rodape}>
            {faseAtual === 'leitura_privada' && !todosLeram && (
              <>
                <Text style={estilos.textoRodape}>
                  aguardando leitura: {prontos}/{totalEsperado}
                </Text>
                {podeForcarAvanco && (
                  <BotaoSecundario
                    titulo="forçar avanço (jogador ausente)"
                    onPress={aoConfirmarForcarAvanco}
                  />
                )}
              </>
            )}
            <BotaoPrimario
              titulo={rotuloAvanco(faseAtual)}
              disabled={!podeAvancar}
              carregando={avancandoFase}
              onPress={aoAvancarFase}
            />
          </View>
        )}

      {ehHost && faseAtual === 'revelacao_resultados' && (
        <View style={estilos.rodape}>
          <BotaoSecundario
            titulo="encerrar caso"
            carregando={avancandoFase}
            onPress={aoAvancarFase}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

/**
 * BannerReconexao — faixa discreta que avisa sobre estado de conexão.
 *
 * Sprint 14 — Beta Fechado: degradação graciosa para conexões instáveis.
 * O banner não bloqueia a UI — o jogador pode continuar lendo arquivos
 * e conversando com a mesa enquanto a reconexão acontece em segundo plano.
 */
function BannerReconexao({ estado }: { estado: ArquivosConnectionState }) {
  if (estado === 'conectado') return null;
  return (
    <View style={estilos.bannerConexao} accessibilityLiveRegion="polite">
      <Text style={estilos.textoBannerConexao}>
        {estado === 'offline'
          ? 'sem conexão — ações pausadas'
          : 'reconectando...'}
      </Text>
    </View>
  );
}

function CabecalhoFase({
  fase,
  titulo,
}: {
  fase: ArquivosPhase;
  titulo: string;
}) {
  return (
    <View style={estilos.cabecalho} accessibilityLiveRegion="polite">
      <View style={estilos.linhaAcentoCabecalho} />
      <Text style={estilos.rotulo}>
        {CASO_DOSSIE_SUMIDO.intro.titulo} · {ROTULOS_FASE[fase]}
      </Text>
      <Text style={estilos.titulo} accessibilityRole="header">
        {titulo}
      </Text>
    </View>
  );
}

function ResumoDaFase({ texto }: { texto: string }) {
  return (
    <View style={estilos.painelCompacto}>
      <Text style={estilos.textoApoio}>{texto}</Text>
    </View>
  );
}

function IntroducaoCaso() {
  const duracao = CASO_DOSSIE_SUMIDO.config.targetDurationMinutes;
  return (
    <>
      <View style={estilos.painel}>
        <Text style={estilos.rotulo}>o que aconteceu</Text>
        <Text style={estilos.textoApoio}>
          {CASO_DOSSIE_SUMIDO.intro.resumoPublico}
        </Text>
        <Text style={estilos.textoMuted}>
          duração estimada: {duracao.min} a {duracao.max} minutos
        </Text>
      </View>

      <View style={estilos.painel}>
        <Text style={estilos.rotulo}>o que o grupo precisa descobrir</Text>
        {CASO_DOSSIE_SUMIDO.verdictQuestions
          .filter((question) => question.obrigatoria)
          .map((question) => (
            <Text key={question.id} style={estilos.itemTexto}>
              · {question.pergunta}
            </Text>
          ))}
      </View>
    </>
  );
}

function LeituraPrivada({
  estadoPrivado,
  arquivos,
  jaConcluiuLeitura,
  marcandoLeitura,
  prontos,
  totalEsperado,
  onConcluirLeitura,
}: {
  estadoPrivado: ArquivosPrivateState;
  arquivos: ArquivosPrivateFile[];
  jaConcluiuLeitura: boolean;
  marcandoLeitura: boolean;
  prontos: number;
  totalEsperado: number;
  onConcluirLeitura: () => void;
}) {
  return (
    <>
      <View style={estilos.painelCompacto}>
        <Text style={estilos.rotulo}>tempo sugerido</Text>
        <Text style={estilos.textoApoio}>
          leia com calma. 3 a 6 minutos. não compartilhe a tela.
        </Text>
        {!jaConcluiuLeitura ? (
          <Text style={estilos.textoMuted}>
            leitura concluída: {prontos}/{totalEsperado}
          </Text>
        ) : (
          <Text style={[estilos.textoMuted, { color: cores.sucesso }]}>
            você marcou leitura concluída · aguardando os outros
          </Text>
        )}
      </View>
      <FichaPersonagem estadoPrivado={estadoPrivado} />
      <ListaArquivos arquivos={arquivos} />
      <BotaoPrimario
        titulo={jaConcluiuLeitura ? 'leitura concluída ✓' : 'terminei de ler'}
        disabled={jaConcluiuLeitura || marcandoLeitura}
        carregando={marcandoLeitura}
        onPress={onConcluirLeitura}
      />
    </>
  );
}

interface AcoesProps {
  readonly metainfos: readonly {
    readonly actionId: string;
    readonly status: string;
    readonly texto: string;
  }[];
  readonly resolvendoAcao: boolean;
  readonly onConcluirAcao: (actionId: ArquivosSecretActionId) => void;
  readonly onRecusarAcao: (actionId: ArquivosSecretActionId) => void;
}

function Investigacao({
  estadoPrivado,
  arquivos,
  evidenciasPublicas,
  metainfos,
  resolvendoAcao,
  players,
  personagensPorJogador,
  jogadorAtualId,
  onConcluirAcao,
  onRecusarAcao,
}: {
  estadoPrivado: ArquivosPrivateState;
  arquivos: ArquivosPrivateFile[];
  evidenciasPublicas: ArquivosEvidence[];
  players: ArquivosPublicState['players'];
  personagensPorJogador: ReadonlyMap<string, ArquivosCharacter>;
  jogadorAtualId: string;
} & AcoesProps) {
  return (
    <>
      <PainelDeConversa
        itens={[
          'quem tinha oportunidade real de pegar o dossiê?',
          'qual arquivo contradiz alguma coisa que alguém disse?',
          'quem parece omitir algo que não é necessariamente culpa?',
        ]}
      />
      <PersonagensNaMesa
        players={players}
        personagensPorJogador={personagensPorJogador}
        jogadorAtualId={jogadorAtualId}
      />
      <AcaoPrivada
        estadoPrivado={estadoPrivado}
        resolvendoAcao={resolvendoAcao}
        onConcluirAcao={onConcluirAcao}
        onRecusarAcao={onRecusarAcao}
      />
      <PainelMetainfo metainfos={metainfos} />
      <ListaEvidencias evidencias={evidenciasPublicas} />
      <ListaArquivos arquivos={arquivos} compacta />
    </>
  );
}

function NovaEvidencia({
  evidenciasPublicas,
  estadoPrivado,
  metainfos,
  resolvendoAcao,
  onConcluirAcao,
  onRecusarAcao,
}: {
  evidenciasPublicas: ArquivosEvidence[];
  estadoPrivado: ArquivosPrivateState;
} & AcoesProps) {
  return (
    <>
      <ListaEvidencias evidencias={evidenciasPublicas} destaque />
      <PainelDeConversa
        itens={[
          'o que essa evidência muda na teoria que vocês tinham?',
          'quem ganhou ou perdeu motivo com isso?',
          'tem algum arquivo antigo que agora parece diferente?',
        ]}
      />
      <AcaoPrivada
        estadoPrivado={estadoPrivado}
        resolvendoAcao={resolvendoAcao}
        onConcluirAcao={onConcluirAcao}
        onRecusarAcao={onRecusarAcao}
      />
      <PainelMetainfo metainfos={metainfos} />
    </>
  );
}

function Confronto({
  estadoPrivado,
  evidenciasPublicas,
  metainfos,
  resolvendoAcao,
  onConcluirAcao,
  onRecusarAcao,
}: {
  estadoPrivado: ArquivosPrivateState;
  evidenciasPublicas: ArquivosEvidence[];
} & AcoesProps) {
  return (
    <>
      <PainelDeConversa
        itens={[
          'quem estava perto da sala no horário certo?',
          'qual motivação explica a retirada do envelope?',
          'tem algum segredo que parece suspeito mas não resolve o sumiço?',
        ]}
      />
      <AcaoPrivada
        estadoPrivado={estadoPrivado}
        resolvendoAcao={resolvendoAcao}
        onConcluirAcao={onConcluirAcao}
        onRecusarAcao={onRecusarAcao}
      />
      <PainelMetainfo metainfos={metainfos} />
      <ListaEvidencias evidencias={evidenciasPublicas} />
    </>
  );
}

function Veredito({
  ehHost,
  respostas,
  enviando,
  vereditoRegistrado,
  onEscolher,
  onEnviar,
}: {
  ehHost: boolean;
  respostas: Record<ArquivosQuestionId, string>;
  enviando: boolean;
  vereditoRegistrado: boolean;
  onEscolher: (questionId: ArquivosQuestionId, value: string) => void;
  onEnviar: () => void;
}) {
  // Veredito já foi enviado — aguardando host avançar para revelação.
  if (vereditoRegistrado) {
    return (
      <View style={estilos.painelDestaque}>
        <Text style={estilos.rotulo}>veredito registrado</Text>
        <Text style={estilos.tituloArquivo}>
          o grupo chegou a um consenso.
        </Text>
        <Text style={estilos.textoApoio}>
          {ehHost
            ? 'avance para revelar a verdade.'
            : 'aguardando o anfitrião revelar a verdade.'}
        </Text>
      </View>
    );
  }

  return (
    <View style={estilos.painel}>
      <Text style={estilos.rotulo}>
        {ehHost ? 'registre o consenso do grupo' : 'acompanhe as respostas'}
      </Text>
      {!ehHost && (
        <Text style={estilos.textoApoio}>
          discutam em voz alta. o anfitrião registra quando a mesa chegar a um consenso.
        </Text>
      )}
      {CASO_DOSSIE_SUMIDO.verdictQuestions.map((question) => (
        <View key={question.id} style={estilos.blocoPergunta}>
          <Text style={estilos.tituloArquivo}>
            {question.pergunta}
            {question.obrigatoria ? '' : ' (opcional)'}
          </Text>
          <View style={estilos.opcoes}>
            {(question.opcoes ?? []).map((opcao) => {
              const selecionada = respostas[question.id] === opcao;
              return (
                <Pressable
                  key={opcao}
                  disabled={!ehHost}
                  onPress={() => onEscolher(question.id, opcao)}
                  accessibilityRole="radio"
                  accessibilityLabel={rotuloOpcao(opcao)}
                  accessibilityState={{ selected: selecionada, disabled: !ehHost }}
                  style={({ pressed }) => [
                    estilos.opcao,
                    selecionada && estilos.opcaoSelecionada,
                    pressed && ehHost && estilos.opcaoPressionada,
                    !ehHost && estilos.opcaoDesabilitada,
                  ]}
                >
                  <Text
                    style={[
                      estilos.textoOpcao,
                      selecionada && estilos.textoOpcaoSelecionada,
                    ]}
                  >
                    {rotuloOpcao(opcao)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}
      {ehHost && (
        <BotaoPrimario
          titulo="revelar a verdade"
          carregando={enviando}
          onPress={onEnviar}
        />
      )}
    </View>
  );
}

function Revelacao({
  estadoPublico,
  estadoPrivado,
}: {
  estadoPublico: ArquivosPublicState;
  estadoPrivado: ArquivosPrivateState;
}) {
  const resultado = estadoPublico.collectiveResult;
  const individual = estadoPrivado.individualResult;
  const veredicto = estadoPublico.verdict;

  return (
    <>
      {resultado && (
        <ResultadoColetivoPainel resultado={resultado} />
      )}

      <View style={estilos.painelDestaque}>
        <Text style={estilos.rotulo}>o que realmente aconteceu</Text>
        <Text style={estilos.textoApoio}>
          {CASO_DOSSIE_SUMIDO.truth.resumo}
        </Text>
      </View>

      {resultado && veredicto && (
        <ComparacaoVeredito resultado={resultado} veredicto={veredicto} />
      )}

      {resultado && (
        <DocumentosDecisivos resultado={resultado} />
      )}

      <View style={estilos.painel}>
        <Text style={estilos.rotulo}>o que aconteceu — em ordem</Text>
        {CASO_DOSSIE_SUMIDO.truth.linhaDoTempoReal.map((evento) => (
          <View key={evento.id} style={estilos.eventoLinhaTempo}>
            <Text style={estilos.horario}>{evento.horario}</Text>
            <View style={estilos.eventoConteudo}>
              <Text style={estilos.tituloArquivo}>{evento.titulo}</Text>
              <Text style={estilos.corpoArquivo}>{evento.descricao}</Text>
            </View>
          </View>
        ))}
      </View>

      {individual && (
        <ResultadoIndividualPainel individual={individual} />
      )}

      {resultado && (
        <ResumoCompartilhavel
          resultado={resultado}
          individual={individual ?? null}
        />
      )}
    </>
  );
}

function ResultadoColetivoPainel({
  resultado,
}: {
  resultado: NonNullable<ArquivosPublicState['collectiveResult']>;
}) {
  const aproveitamento =
    resultado.pontosPossiveis === 0
      ? 0
      : resultado.pontosObtidos / resultado.pontosPossiveis;
  const percentual = Math.round(aproveitamento * 100);
  const acertos = resultado.questionScores.filter((s) => s.acertou).length;
  const total = resultado.questionScores.length;

  return (
    <View style={estilos.painelDestaque}>
      <Text style={estilos.rotulo}>investigação coletiva</Text>
      <Text style={estilos.valorFase}>{GRADE_LABELS[resultado.grade]}</Text>
      <Text style={estilos.textoApoio}>{resultado.resumo}</Text>
      <View style={estilos.barraProgresso}>
        <View
          style={[estilos.barraPreenchida, { width: `${percentual}%` }]}
        />
      </View>
      <Text style={estilos.textoStatistica}>
        {percentual}% de aproveitamento · {acertos}/{total} perguntas corretas
      </Text>
    </View>
  );
}

function ComparacaoVeredito({
  resultado,
  veredicto,
}: {
  resultado: NonNullable<ArquivosPublicState['collectiveResult']>;
  veredicto: NonNullable<ArquivosPublicState['verdict']>;
}) {
  return (
    <View style={estilos.painel}>
      <Text style={estilos.rotulo}>o que o grupo respondeu</Text>
      {CASO_DOSSIE_SUMIDO.verdictQuestions.map((question) => {
        const score = resultado.questionScores.find(
          (s) => s.questionId === question.id,
        );
        const answer = veredicto.answers.find(
          (a) => a.questionId === question.id,
        );
        const valorResposta = answer
          ? rotuloOpcao(
              typeof answer.value === 'string' ? answer.value : answer.value[0] ?? '',
            )
          : '—';
        const acertou = score?.acertou ?? false;
        const respostaCorreta = rotuloOpcao(question.respostaCorreta);

        return (
          <View key={question.id} style={estilos.blocoComparacao}>
            <Text style={estilos.tituloArquivo}>{question.pergunta}</Text>
            <View style={estilos.linhaComparacao}>
              <View
                style={[
                  estilos.indicador,
                  acertou ? estilos.indicadorAcerto : estilos.indicadorErro,
                ]}
              />
              <Text
                style={[
                  estilos.textoResposta,
                  acertou ? estilos.textoAcerto : estilos.textoErro,
                ]}
              >
                {valorResposta}
              </Text>
            </View>
            {!acertou && (
              <Text style={estilos.textoCorrecao}>
                resposta certa: {respostaCorreta}
              </Text>
            )}
          </View>
        );
      })}
    </View>
  );
}

function DocumentosDecisivos({
  resultado,
}: {
  resultado: NonNullable<ArquivosPublicState['collectiveResult']>;
}) {
  const decisivos = resultado.pistasDecisivasUsadas
    .map((id) => CASO_DOSSIE_SUMIDO.evidences.find((e) => e.id === id))
    .filter((e): e is ArquivosEvidence => Boolean(e));

  if (decisivos.length === 0) return null;

  return (
    <View style={estilos.painel}>
      <Text style={estilos.rotulo}>as pistas que mais importavam</Text>
      <Text style={estilos.textoApoio}>
        estas evidências eram essenciais para chegar à verdade.
      </Text>
      <View style={estilos.listaArquivos}>
        {decisivos.map((evidencia) => (
          <View key={evidencia.id} style={estilos.arquivo}>
            <Text style={estilos.tipoArquivo}>{evidencia.tipo}</Text>
            <Text style={estilos.tituloArquivo}>{evidencia.titulo}</Text>
            <Text style={estilos.corpoArquivo}>{evidencia.descricao}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function ResultadoIndividualPainel({
  individual,
}: {
  individual: NonNullable<ArquivosPrivateState['individualResult']>;
}) {
  const corBorda =
    individual.status === 'alcancado'
      ? cores.sucesso
      : individual.status === 'parcial'
        ? cores.alerta
        : cores.erro;

  return (
    <View style={[estilos.painelIndividual, { borderColor: corBorda }]}>
      <Text style={estilos.rotulo}>seu resultado pessoal</Text>
      <Text style={estilos.valorFase}>{individual.tituloPosJogo}</Text>
      <Text
        style={[
          estilos.rotuloStatus,
          individual.status === 'alcancado'
            ? estilos.statusAlcancado
            : individual.status === 'parcial'
              ? estilos.statusParcial
              : estilos.statusFalhou,
        ]}
      >
        {STATUS_INDIVIDUAL_LABELS[individual.status]}
      </Text>
      <Text style={estilos.textoApoio}>{individual.resumo}</Text>
      {individual.segredoExposto && (
        <Text style={estilos.avisoSegredo}>
          seu segredo foi percebido durante a investigação.
        </Text>
      )}
    </View>
  );
}

function ResumoCompartilhavel({
  resultado,
  individual,
}: {
  resultado: NonNullable<ArquivosPublicState['collectiveResult']>;
  individual: ArquivosPrivateState['individualResult'] | null;
}) {
  const acertos = resultado.questionScores.filter((s) => s.acertou).length;
  const total = resultado.questionScores.length;
  const percentual = Math.round(
    resultado.pontosPossiveis === 0
      ? 0
      : (resultado.pontosObtidos / resultado.pontosPossiveis) * 100,
  );

  return (
    <View style={estilos.painelResumo}>
      <Text style={estilos.rotulo}>sua partida em resumo</Text>
      <Text style={estilos.tituloResumo}>
        {CASO_DOSSIE_SUMIDO.intro.titulo}
      </Text>
      <Text style={estilos.linhaResumo}>
        investigação: {GRADE_LABELS[resultado.grade]}
      </Text>
      <Text style={estilos.linhaResumo}>
        acertos: {acertos}/{total} perguntas
      </Text>
      <Text style={estilos.linhaResumo}>
        aproveitamento: {percentual}%
      </Text>
      {individual && (
        <Text style={estilos.linhaResumo}>
          {individual.tituloPosJogo} —{' '}
          {STATUS_INDIVIDUAL_LABELS[individual.status]}
        </Text>
      )}
      <Text style={estilos.textoMuted}>
        responsável: {rotuloOpcao(CASO_DOSSIE_SUMIDO.truth.responsavelCharacterId)}
      </Text>
    </View>
  );
}

function FichaPersonagem({
  estadoPrivado,
}: {
  estadoPrivado: ArquivosPrivateState;
}) {
  const { character } = estadoPrivado;
  return (
    <View style={estilos.painel}>
      <Text style={estilos.rotulo}>você é</Text>
      <Text style={estilos.nomePersonagem}>{character.nome}</Text>
      <Text style={estilos.subtituloPersonagem}>{character.papelNoCaso}</Text>
      <View style={estilos.divisor} />
      <Text style={estilos.rotulo}>sua situação</Text>
      <Text style={estilos.textoApoio}>{character.contextoPrivado}</Text>
      <View style={estilos.divisor} />
      <Text style={estilos.rotulo}>o que você sabe</Text>
      {character.conhecimentos.map((fact) => (
        <Text key={fact} style={estilos.itemFato}>
          · {fact}
        </Text>
      ))}
      <View style={estilos.divisor} />
      <Text style={estilos.rotulo}>seu segredo</Text>
      <Text style={estilos.tituloArquivo}>{character.segredo.titulo}</Text>
      <Text style={estilos.corpoArquivo}>{character.segredo.descricao}</Text>
      <View style={estilos.divisor} />
      <Text style={estilos.rotulo}>seu objetivo</Text>
      <Text style={estilos.tituloArquivo}>
        {character.objetivoIndividual.titulo}
      </Text>
      <Text style={estilos.corpoArquivo}>
        {character.objetivoIndividual.descricao}
      </Text>
    </View>
  );
}

function ListaArquivos({
  arquivos,
  compacta = false,
}: {
  arquivos: ArquivosPrivateFile[];
  compacta?: boolean;
}) {
  return (
    <View style={estilos.painel}>
      <Text style={estilos.rotulo}>seus arquivos</Text>
      {arquivos.length === 0 ? (
        <Text style={estilos.textoMuted}>
          nenhum arquivo disponível neste momento.
        </Text>
      ) : (
        <View style={estilos.listaArquivos}>
          {arquivos.map((arquivo) => (
            <View key={arquivo.id} style={estilos.arquivo}>
              <Text style={estilos.tipoArquivo}>{arquivo.tipo}</Text>
              <Text style={estilos.tituloArquivo}>{arquivo.titulo}</Text>
              {!compacta && (
                <Text style={estilos.corpoArquivo}>{arquivo.corpo}</Text>
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function ListaEvidencias({
  evidencias,
  destaque = false,
}: {
  evidencias: ArquivosEvidence[];
  destaque?: boolean;
}) {
  if (evidencias.length === 0) return null;
  return (
    <View style={destaque ? estilos.painelDestaque : estilos.painel}>
      <Text style={estilos.rotulo}>
        {destaque ? 'nova evidência — para todos' : 'evidência compartilhada'}
      </Text>
      {evidencias.map((evidencia) => (
        <View key={evidencia.id} style={estilos.arquivo}>
          <Text style={estilos.tituloArquivo}>{evidencia.titulo}</Text>
          <Text style={estilos.corpoArquivo}>{evidencia.descricao}</Text>
        </View>
      ))}
    </View>
  );
}

function AcaoPrivada({
  estadoPrivado,
  resolvendoAcao,
  onConcluirAcao,
  onRecusarAcao,
}: {
  estadoPrivado: ArquivosPrivateState;
  resolvendoAcao: boolean;
  onConcluirAcao: (actionId: ArquivosSecretActionId) => void;
  onRecusarAcao: (actionId: ArquivosSecretActionId) => void;
}) {
  const acaoAtiva = estadoPrivado.activeSecretAction;
  const ultimaConcluidaComRecompensa =
    estadoPrivado.completedSecretActions.find(
      (item) => item.rewardRevealed && item.reward,
    ) ?? null;

  if (!acaoAtiva && !ultimaConcluidaComRecompensa) return null;

  return (
    <>
      {acaoAtiva && acaoAtiva.status === 'pendente' && (
        <AcaoPrivadaPendente
          acao={acaoAtiva}
          resolvendoAcao={resolvendoAcao}
          onConcluirAcao={onConcluirAcao}
          onRecusarAcao={onRecusarAcao}
        />
      )}
      {ultimaConcluidaComRecompensa?.reward && (
        <RecompensaPrivada acao={ultimaConcluidaComRecompensa} />
      )}
    </>
  );
}

function AcaoPrivadaPendente({
  acao,
  resolvendoAcao,
  onConcluirAcao,
  onRecusarAcao,
}: {
  acao: ArquivosPrivateSecretActionState;
  resolvendoAcao: boolean;
  onConcluirAcao: (actionId: ArquivosSecretActionId) => void;
  onRecusarAcao: (actionId: ArquivosSecretActionId) => void;
}) {
  const [mostrarAlternativa, setMostrarAlternativa] = useState(false);

  const instrucaoAtiva = mostrarAlternativa
    ? acao.action.alternativaAcessivel.instrucao
    : acao.action.instrucaoPrivada;

  return (
    <View style={estilos.painelDestaque}>
      <Text style={estilos.rotulo}>
        {mostrarAlternativa ? 'ação privada — alternativa' : 'ação privada'}
      </Text>
      <Text style={estilos.tituloArquivo}>{acao.action.titulo}</Text>
      <Text style={estilos.textoApoio}>{instrucaoAtiva}</Text>

      {mostrarAlternativa && (
        <Text style={estilos.textoMuted}>
          completar a alternativa desbloqueia uma recompensa menor.
        </Text>
      )}

      <View style={estilos.botoesAcao}>
        <BotaoPrimario
          titulo={mostrarAlternativa ? 'cumpri a alternativa' : 'cumpri a ação'}
          carregando={resolvendoAcao}
          onPress={() =>
            mostrarAlternativa
              ? onRecusarAcao(acao.action.id)
              : onConcluirAcao(acao.action.id)
          }
        />
        {!mostrarAlternativa && (
          <BotaoSecundario
            titulo="não consigo fazer isso"
            onPress={() => setMostrarAlternativa(true)}
          />
        )}
      </View>
    </View>
  );
}

function RecompensaPrivada({ acao }: { acao: ArquivosPrivateSecretActionState }) {
  if (!acao.reward) return null;
  return (
    <View style={estilos.painelRecompensa}>
      <Text style={estilos.rotulo}>pista desbloqueada</Text>
      <Text style={estilos.tituloArquivo}>{acao.reward.titulo}</Text>
      <Text style={estilos.textoApoio}>{acao.reward.descricao}</Text>
    </View>
  );
}

function PainelMetainfo({
  metainfos,
}: {
  metainfos: readonly { actionId: string; texto: string }[];
}) {
  if (metainfos.length === 0) return null;
  return (
    <View style={estilos.painelMeta}>
      <Text style={estilos.rotulo}>comportamento observado</Text>
      {metainfos.map((meta) => (
        <Text key={meta.actionId} style={estilos.textoMeta}>
          {meta.texto}
        </Text>
      ))}
    </View>
  );
}

function PainelDeConversa({ itens }: { itens: string[] }) {
  return (
    <View style={estilos.painelCompacto}>
      <Text style={estilos.rotulo}>puxem a conversa</Text>
      {itens.map((item) => (
        <Text key={item} style={estilos.itemTexto}>
          {item}
        </Text>
      ))}
    </View>
  );
}

// ─── Componentes de Sprint 11 ────────────────────────────────────────────────

/**
 * PersonagensNaMesa — lista pública de quem é quem na mesa.
 *
 * Fundamental para o playtest: os jogadores precisam saber quem está
 * interpretando qual personagem para direcionar perguntas e suspeitas.
 * Esta informação é pública (assignments está no estado público).
 */
function PersonagensNaMesa({
  players,
  personagensPorJogador,
  jogadorAtualId,
}: {
  players: ArquivosPublicState['players'];
  personagensPorJogador: ReadonlyMap<string, ArquivosCharacter>;
  jogadorAtualId: string;
}) {
  if (personagensPorJogador.size === 0) return null;

  return (
    <View style={estilos.painel}>
      <Text style={estilos.rotulo}>quem é quem na mesa</Text>
      <View style={estilos.listaArquivos}>
        {players.map((player) => {
          const personagem = personagensPorJogador.get(player.id);
          const souEu = player.id === jogadorAtualId;
          return (
            <View
              key={player.id}
              style={[
                estilos.linhaPersonagem,
                souEu && estilos.linhaPersonagemDestaque,
              ]}
            >
              <View style={estilos.colunaPersonagem}>
                <Text
                  style={[
                    estilos.nomeJogadorPersonagem,
                    souEu && estilos.textoDestaque,
                  ]}
                >
                  {player.nome}
                  {souEu ? ' (você)' : ''}
                </Text>
                {personagem && (
                  <Text style={estilos.textoApoio}>
                    {personagem.nome} — {personagem.resumoPublico}
                  </Text>
                )}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

/**
 * TelaCasoEncerrado — exibida na fase finalizado para todos os jogadores.
 *
 * Após a revelação, o host encerra o caso. Todos os jogadores veem esta
 * tela com um convite para continuar a conversa e sair.
 */
function TelaCasoEncerrado({ onVoltar }: { onVoltar: () => void }) {
  return (
    <View style={estilos.painelEncerramento}>
      <Text style={estilos.tituloEncerramento}>O Dossiê Sumido</Text>
      <Text style={estilos.textoApoio}>
        a investigação terminou.
      </Text>
      <Text style={estilos.textoApoio}>
        perguntem: quem sabia mais do que revelou? quem omitiu algo que teria mudado tudo? quem foi mais honesto do que precisava ser?
      </Text>
      <BotaoSecundario titulo="voltar ao início" onPress={onVoltar} />
    </View>
  );
}

function encontrarEvidencia(id: string) {
  return CASO_DOSSIE_SUMIDO.evidences.find((evidencia) => evidencia.id === id);
}

function rotuloOpcao(value: string) {
  const personagem = CASO_DOSSIE_SUMIDO.characters.find(
    (character) => character.id === value,
  );
  if (personagem) return personagem.nome;
  const evidencia = encontrarEvidencia(value);
  if (evidencia) return evidencia.titulo;
  return value;
}

function rotuloAvanco(fase: ArquivosPhase) {
  const proxima = obterProximaFase(fase);
  if (!proxima) return 'avançar';
  return `avançar para ${ROTULOS_FASE[proxima]}`;
}

function mensagemErro(erro: unknown) {
  return erro instanceof Error
    ? erro.message
    : 'algo deu errado, tenta de novo.';
}

const estilos = StyleSheet.create({
  // ── Carregamento e erro ────────────────────────────────────────────────────
  telaCarregamento: {
    alignItems: 'center',
    gap: espacamento.md,
  },
  rotuloCarregamento: {
    color: COR_ARQUIVOS,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoMicro,
    fontWeight: tipografia.pesoSemibold,
    letterSpacing: tipografia.spacingCaps,
    textTransform: 'uppercase',
  },
  textoErroEstado: {
    color: cores.erro,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpo,
    fontWeight: tipografia.pesoBold,
    lineHeight: 22,
    textAlign: 'center',
  },
  // ── Banner de reconexão ────────────────────────────────────────────────────
  bannerConexao: {
    alignItems: 'center',
    backgroundColor: cores.alerta,
    paddingHorizontal: espacamento.md,
    paddingVertical: espacamento.sm,
  },
  textoBannerConexao: {
    color: cores.texto,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoMicro,
    fontWeight: tipografia.pesoSemibold,
  },

  // ── Estrutura principal ───────────────────────────────────────────────────
  arquivo: {
    borderColor: cores.borda,
    borderRadius: raio.sm,
    borderWidth: 1,
    gap: espacamento.sm,
    padding: espacamento.md,
  },
  botoesAcao: {
    gap: espacamento.sm,
  },
  painelMeta: {
    backgroundColor: cores.superficie,
    borderColor: cores.borda,
    borderRadius: raio.md,
    borderWidth: 1,
    borderLeftColor: COR_ARQUIVOS,
    borderLeftWidth: 3,
    gap: espacamento.sm,
    padding: espacamento.md,
  },
  painelRecompensa: {
    backgroundColor: cores.superficieElevada,
    borderColor: cores.sucesso,
    borderRadius: raio.lg,
    borderWidth: 1,
    gap: espacamento.md,
    padding: espacamento.lg,
    ...sombra.sutil,
  },
  textoMeta: {
    color: cores.textoSecundario,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpoMenor,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  textoMuted: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoMicro,
    fontWeight: tipografia.pesoMedio,
  },
  blocoPergunta: {
    gap: espacamento.md,
  },
  cabecalho: {
    gap: espacamento.sm,
  },
  linhaAcentoCabecalho: {
    backgroundColor: COR_ARQUIVOS,
    borderRadius: raio.pill,
    height: 3,
    width: 32,
  },
  centralizada: {
    alignItems: 'center',
    gap: espacamento.md,
    justifyContent: 'center',
    padding: espacamento.lg,
  },
  corpoArquivo: {
    color: cores.textoSecundario,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpoMenor,
    lineHeight: 21,
  },
  divisor: {
    backgroundColor: cores.borda,
    height: 1,
  },
  eventoConteudo: {
    flex: 1,
    gap: espacamento.xs,
  },
  eventoLinhaTempo: {
    flexDirection: 'row',
    gap: espacamento.md,
  },
  horario: {
    color: COR_ARQUIVOS,
    fontSize: tipografia.tamanhoCorpoMenor,
    fontWeight: tipografia.pesoBold,
    width: 48,
  },
  itemTexto: {
    color: cores.texto,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpo,
    lineHeight: 23,
  },
  listaArquivos: {
    gap: espacamento.md,
  },
  nomePersonagem: {
    color: cores.texto,
    fontSize: tipografia.tamanhoTitulo,
    fontWeight: tipografia.pesoExtraBold,
  },
  subtituloPersonagem: {
    color: cores.textoSecundario,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpoMenor,
    fontWeight: tipografia.pesoMedio,
    marginTop: -espacamento.sm,
  },
  itemFato: {
    color: cores.textoSecundario,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpo,
    lineHeight: 23,
  },
  opcao: {
    borderColor: cores.borda,
    borderRadius: raio.md,
    borderWidth: 1,
    paddingHorizontal: espacamento.md,
    paddingVertical: espacamento.sm,
  },
  opcaoDesabilitada: {
    opacity: 0.7,
  },
  opcaoPressionada: {
    opacity: 0.8,
  },
  opcaoSelecionada: {
    backgroundColor: COR_ARQUIVOS,
    borderColor: COR_ARQUIVOS,
  },
  opcoes: {
    gap: espacamento.sm,
  },
  painel: {
    backgroundColor: cores.superficie,
    borderColor: cores.borda,
    borderRadius: raio.lg,
    borderWidth: 1,
    gap: espacamento.md,
    padding: espacamento.lg,
    ...sombra.sutil,
  },
  painelCompacto: {
    backgroundColor: cores.superficie,
    borderColor: cores.borda,
    borderRadius: raio.md,
    borderWidth: 1,
    gap: espacamento.md,
    padding: espacamento.md,
    ...sombra.sutil,
  },
  painelDestaque: {
    backgroundColor: cores.superficieElevada,
    borderColor: COR_ARQUIVOS,
    borderRadius: raio.lg,
    borderWidth: 1,
    gap: espacamento.md,
    padding: espacamento.lg,
    ...sombra.sutil,
  },
  rodape: {
    gap: espacamento.sm,
    padding: espacamento.lg,
  },
  rotulo: {
    color: cores.textoMudo,
    fontSize: tipografia.tamanhoMicro,
    fontWeight: tipografia.pesoMedio,
    letterSpacing: tipografia.spacingLeve,
  },
  scroll: {
    gap: espacamento.lg,
    padding: espacamento.lg,
    paddingTop: espacamento.xxl,
  },
  subtitulo: {
    color: cores.textoSecundario,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpo,
    lineHeight: 23,
  },
  tela: {
    backgroundColor: cores.fundo,
    flex: 1,
  },
  textoApoio: {
    color: cores.textoSecundario,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpo,
    lineHeight: 23,
  },
  textoCarregando: {
    color: cores.textoSecundario,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpoMenor,
  },
  textoOpcao: {
    color: cores.texto,
    fontSize: tipografia.tamanhoCorpoMenor,
    fontWeight: tipografia.pesoSemibold,
    lineHeight: 20,
  },
  textoOpcaoSelecionada: {
    color: cores.textoSobrePrimaria,
  },
  textoRodape: {
    color: cores.textoSecundario,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpoMenor,
    textAlign: 'center',
  },
  tipoArquivo: {
    color: cores.textoMudo,
    fontSize: tipografia.tamanhoMicro,
    fontWeight: tipografia.pesoMedio,
  },
  titulo: {
    color: cores.texto,
    fontSize: tipografia.tamanhoTituloGrande,
    fontWeight: tipografia.pesoExtraBold,
    lineHeight: 38,
  },
  tituloArquivo: {
    color: cores.texto,
    fontSize: tipografia.tamanhoCorpo,
    fontWeight: tipografia.pesoBold,
    lineHeight: 22,
  },
  valorFase: {
    color: cores.texto,
    fontSize: tipografia.tamanhoSubtituloGrande,
    fontWeight: tipografia.pesoBold,
    lineHeight: 28,
  },
  // Sprint 8 — Veredito, Pontuação e Revelação Final
  barraProgresso: {
    backgroundColor: cores.borda,
    borderRadius: raio.pill,
    height: 6,
    overflow: 'hidden',
  },
  barraPreenchida: {
    backgroundColor: COR_ARQUIVOS,
    borderRadius: raio.pill,
    height: 6,
  },
  textoStatistica: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpoMenor,
    fontWeight: tipografia.pesoMedio,
  },
  blocoComparacao: {
    gap: espacamento.sm,
    paddingVertical: espacamento.sm,
    borderBottomColor: cores.borda,
    borderBottomWidth: 1,
  },
  linhaComparacao: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: espacamento.sm,
  },
  indicador: {
    borderRadius: raio.pill,
    height: 8,
    width: 8,
  },
  indicadorAcerto: {
    backgroundColor: cores.sucesso,
  },
  indicadorErro: {
    backgroundColor: cores.erro,
  },
  textoResposta: {
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpo,
    fontWeight: tipografia.pesoSemibold,
    lineHeight: 22,
  },
  textoAcerto: {
    color: cores.sucesso,
  },
  textoErro: {
    color: cores.erro,
  },
  textoCorrecao: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpoMenor,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  painelIndividual: {
    backgroundColor: cores.superficieElevada,
    borderRadius: raio.lg,
    borderWidth: 2,
    gap: espacamento.md,
    padding: espacamento.lg,
  },
  rotuloStatus: {
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpoMenor,
    fontWeight: tipografia.pesoBold,
    letterSpacing: tipografia.spacingLeve,
  },
  statusAlcancado: {
    color: cores.sucesso,
  },
  statusParcial: {
    color: cores.alerta,
  },
  statusFalhou: {
    color: cores.erro,
  },
  avisoSegredo: {
    color: cores.alerta,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpoMenor,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  painelResumo: {
    backgroundColor: cores.fundo,
    borderColor: cores.bordaForte,
    borderRadius: raio.lg,
    borderWidth: 1,
    gap: espacamento.sm,
    padding: espacamento.lg,
  },
  tituloResumo: {
    color: cores.texto,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoSubtitulo,
    fontWeight: tipografia.pesoExtraBold,
    lineHeight: 26,
  },
  linhaResumo: {
    color: cores.textoSecundario,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpo,
    lineHeight: 23,
  },
  // Sprint 11 — Playtest Alpha
  linhaPersonagem: {
    borderBottomColor: cores.borda,
    borderBottomWidth: 1,
    paddingVertical: espacamento.sm,
  },
  linhaPersonagemDestaque: {
    borderLeftColor: COR_ARQUIVOS,
    borderLeftWidth: 3,
    paddingLeft: espacamento.sm,
  },
  colunaPersonagem: {
    flex: 1,
    gap: 2,
  },
  nomeJogadorPersonagem: {
    color: cores.texto,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpo,
    fontWeight: tipografia.pesoBold,
    lineHeight: 22,
  },
  textoDestaque: {
    color: COR_ARQUIVOS,
  },
  painelEncerramento: {
    alignItems: 'center',
    backgroundColor: cores.superficie,
    borderColor: cores.borda,
    borderRadius: raio.lg,
    borderWidth: 1,
    gap: espacamento.md,
    padding: espacamento.xl,
  },
  tituloEncerramento: {
    color: cores.texto,
    fontSize: tipografia.tamanhoSubtituloGrande,
    fontWeight: tipografia.pesoExtraBold,
    lineHeight: 30,
    textAlign: 'center',
  },
});
