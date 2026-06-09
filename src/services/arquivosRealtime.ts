import {
  get,
  onDisconnect,
  onValue,
  ref,
  remove,
  set,
  update,
} from 'firebase/database';

import type {
  GameState,
  Player,
  PlayerId,
  Room,
  RoomCode,
} from '@/engine/types';
import {
  avancarFaseArquivos,
  criarPartidaArquivos,
  gerarRevelacaoFinalArquivos,
  processarAcaoArquivos,
} from '@/games/arquivos/engine';
import { CASO_DOSSIE_SUMIDO } from '@/games/arquivos/casos';
import { ARQUIVOS_DISPONIVEL } from '@/games/arquivos/releaseFlags';
import type {
  ArquivosAction,
  ArquivosCase,
  ArquivosEvent,
  ArquivosFinalReveal,
  ArquivosGameState,
  ArquivosPhase,
  ArquivosPrivateState,
  ArquivosPublicState,
  ArquivosSecretActionId,
  ArquivosVerdict,
} from '@/games/arquivos/types';
import { comTimeout } from '@/services/comTimeout';
import { getRealtimeDb } from '@/services/firebase';
import { logError, logInfo, logWarn } from '@/services/arquivosLogger';
import type { DadosJogador, RoomListener, Unsubscribe } from '@/types/room';

const PASTA = 'salas';
const JOGO_ID_ARQUIVOS = 'arquivos';
const LETRAS = 'ABCDEFGHJKLMNPRSTUVWXYZ';
const TAMANHO_CODIGO = 4;
const WRITE_TIMEOUT_MS = 10_000;
const READ_TIMEOUT_MS = 8_000;

export interface ArquivosPlayerView {
  readonly publicState: ArquivosPublicState;
  readonly privateState: ArquivosPrivateState | null;
}

export interface ArquivosHostSnapshot extends ArquivosGameState {
  readonly room: Room;
}

/** Estado de conectividade observável — usado pela UI para degradação graciosa. */
export type ArquivosConnectionState = 'conectado' | 'reconectando' | 'offline';

function refSala(codigo: RoomCode) {
  return ref(getRealtimeDb(), `${PASTA}/${codigo}`);
}

function refEstadoPublico(codigo: RoomCode) {
  return ref(getRealtimeDb(), `${PASTA}/${codigo}/estado/estadoPublico`);
}

function refPrivados(codigo: RoomCode) {
  return ref(getRealtimeDb(), `${PASTA}/${codigo}/arquivosPrivados`);
}

function refPrivado(codigo: RoomCode, playerId: PlayerId) {
  return ref(
    getRealtimeDb(),
    `${PASTA}/${codigo}/arquivosPrivados/${playerId}`,
  );
}

function refEventos(codigo: RoomCode) {
  return ref(getRealtimeDb(), `${PASTA}/${codigo}/arquivosEventos`);
}

function refReady(codigo: RoomCode) {
  return ref(getRealtimeDb(), `${PASTA}/${codigo}/arquivosReady`);
}

function refReadyJogador(codigo: RoomCode, playerId: PlayerId) {
  return ref(getRealtimeDb(), `${PASTA}/${codigo}/arquivosReady/${playerId}`);
}

function refPresencaJogador(codigo: RoomCode, playerId: PlayerId) {
  return ref(
    getRealtimeDb(),
    `${PASTA}/${codigo}/jogadores/${playerId}/estaConectado`,
  );
}

function gerarCodigo(): RoomCode {
  let codigo = '';
  for (let i = 0; i < TAMANHO_CODIGO; i += 1) {
    codigo += LETRAS[Math.floor(Math.random() * LETRAS.length)];
  }
  return codigo;
}

async function gerarCodigoUnico(): Promise<RoomCode> {
  for (let i = 0; i < 20; i += 1) {
    const candidato = gerarCodigo();
    const snap = await get(refSala(candidato));
    if (!snap.exists()) return candidato;
  }
  throw new Error('Não foi possível gerar um código de sala único.');
}

/**
 * Observa o estado de conexão do Firebase RTDB.
 *
 * O nó especial `.info/connected` do Firebase é `true` quando o SDK está
 * conectado ao servidor e `false` (ou ausente) quando offline ou reconectando.
 *
 * Uso: permite que a UI exiba um aviso de reconexão sem bloquear o jogador.
 *
 * Sprint 14 — Beta Fechado: resilência de conexão para sessões de campo.
 */
export function observarConexaoArquivos(
  callback: RoomListener<ArquivosConnectionState>,
): Unsubscribe {
  const connectedRef = ref(getRealtimeDb(), '.info/connected');
  let primeiraLeitura = true;

  return onValue(connectedRef, (snap) => {
    const conectado = snap.val() === true;
    if (primeiraLeitura) {
      // Primeira leitura: `false` significa carregando, não necessariamente offline.
      primeiraLeitura = false;
      callback(conectado ? 'conectado' : 'reconectando');
      return;
    }
    callback(conectado ? 'conectado' : 'reconectando');
  });
}

/**
 * Reconecta presença de um jogador após desconexão e volta de rede.
 *
 * Deve ser chamado pela UI quando o estado de conexão volta de 'offline'
 * ou 'reconectando' para 'conectado', para garantir que o Firebase
 * `onDisconnect` seja re-registrado para o próximo ciclo de desconexão.
 *
 * Falhas silenciosas são aceitáveis — a presença é best-effort no MVP.
 *
 * Sprint 14 — Beta Fechado: recuperação de host e jogador ao reconectar.
 */
export async function reconectarPresencaArquivos(
  codigo: RoomCode,
  playerId: PlayerId,
): Promise<void> {
  try {
    await registrarPresencaArquivos(codigo, playerId);
    logInfo(codigo, 'presenca_reconectada', { playerId });
  } catch (erro) {
    logWarn(codigo, 'falha_reconectar_presenca', {
      playerId,
      erro: erro instanceof Error ? erro.message : 'desconhecido',
    });
  }
}

export async function criarSalaArquivos(
  anfitriao: DadosJogador,
): Promise<Room> {
  // Sprint 15 — Release Interno: guarda de disponibilidade.
  // Alterar ARQUIVOS_DISPONIVEL em releaseFlags.ts para pausar o jogo.
  if (!ARQUIVOS_DISPONIVEL) {
    throw new Error(
      'Arquivos não está disponível no momento. Tente novamente em breve.',
    );
  }
  const codigo = await gerarCodigoUnico();
  const agora = Date.now();
  const jogadorHost: Player = {
    id: anfitriao.id,
    nome: anfitriao.nome,
    papelSecreto: null,
    ehAnfitriao: true,
    estaConectado: true,
    entrouEm: agora,
  };
  const sala: Room = {
    codigo,
    jogoId: JOGO_ID_ARQUIVOS,
    anfitriaoId: jogadorHost.id,
    jogadores: {
      [jogadorHost.id]: jogadorHost,
    },
    estado: criarEstadoLobbyArquivos(agora),
    criadoEm: agora,
    atualizadoEm: agora,
  };

  try {
    await comTimeout(
      set(refSala(codigo), sala),
      WRITE_TIMEOUT_MS,
      'Falha ao criar sala de Arquivos.',
    );
    await registrarPresencaArquivos(codigo, jogadorHost.id);
    logInfo(codigo, 'sala_criada', { hostId: anfitriao.id });
    return sala;
  } catch (erro) {
    logError(codigo, 'falha_criar_sala', {
      hostId: anfitriao.id,
      erro: erro instanceof Error ? erro.message : 'desconhecido',
    });
    throw erro;
  }
}

export async function entrarSalaArquivos(
  codigo: RoomCode,
  jogador: DadosJogador,
): Promise<Room> {
  const sala = await lerSalaArquivos(codigo);
  if (!sala) throw new Error(`Sala ${codigo} não existe.`);
  if (sala.jogoId !== JOGO_ID_ARQUIVOS) {
    throw new Error('Esta sala não é de Arquivos.');
  }
  if (sala.estado.fase !== 'lobby') {
    throw new Error('A partida já começou.');
  }
  const jogadoresAtuais = sala.jogadores ?? {};
  // Conta jogadores incluindo desconectados temporariamente.
  // No MVP com 6 jogadores fixos, uma desconexão não libera vaga para novo jogador.
  // Jogadores reconectados reusam seu ID existente (caminho `jogadoresAtuais[jogador.id]` acima).
  if (
    Object.keys(jogadoresAtuais).length >= CASO_DOSSIE_SUMIDO.config.maxPlayers
  ) {
    throw new Error('Sala cheia para O Dossiê Sumido.');
  }
  if (jogadoresAtuais[jogador.id]) {
    await registrarPresencaArquivos(codigo, jogador.id);
    return sala;
  }

  const agora = Date.now();
  const novoJogador: Player = {
    id: jogador.id,
    nome: jogador.nome,
    papelSecreto: null,
    ehAnfitriao: false,
    estaConectado: true,
    entrouEm: agora,
  };

  await comTimeout(
    update(refSala(codigo), {
      [`jogadores/${novoJogador.id}`]: novoJogador,
      atualizadoEm: agora,
    }),
    WRITE_TIMEOUT_MS,
    'Falha ao entrar na sala de Arquivos.',
  );
  await registrarPresencaArquivos(codigo, novoJogador.id);

  return {
    ...sala,
    jogadores: {
      ...jogadoresAtuais,
      [novoJogador.id]: novoJogador,
    },
    atualizadoEm: agora,
  };
}

export async function registrarPresencaArquivos(
  codigo: RoomCode,
  playerId: PlayerId,
): Promise<void> {
  const presenceRef = refPresencaJogador(codigo, playerId);
  await comTimeout(set(presenceRef, true), WRITE_TIMEOUT_MS);
  await onDisconnect(presenceRef).set(false);
}

export async function definirProntoArquivos(
  codigo: RoomCode,
  playerId: PlayerId,
  pronto: boolean,
): Promise<void> {
  await comTimeout(
    pronto
      ? set(refReadyJogador(codigo, playerId), true)
      : remove(refReadyJogador(codigo, playerId)),
    WRITE_TIMEOUT_MS,
    'Falha ao atualizar prontidão.',
  );
}

export async function iniciarPartidaArquivosRealtime(
  codigo: RoomCode,
  hostPlayerId: PlayerId,
  caso: ArquivosCase = CASO_DOSSIE_SUMIDO,
): Promise<ArquivosGameState> {
  const sala = await lerSalaArquivos(codigo);
  if (!sala) throw new Error(`Sala ${codigo} não existe.`);
  if (sala.anfitriaoId !== hostPlayerId) {
    throw new Error('Apenas o anfitrião pode iniciar Arquivos.');
  }

  const players = Object.values(sala.jogadores ?? {}).map((player) => ({
    id: player.id,
    nome: player.nome,
  }));
  const gameState = criarPartidaArquivos({
    caso,
    roomCode: codigo,
    hostPlayerId,
    players,
  });

  try {
    await persistirEstadoCompletoArquivos(codigo, gameState);
    logInfo(codigo, 'partida_iniciada', {
      hostId: hostPlayerId,
      caseId: caso.id,
      totalJogadores: players.length,
    });
    return gameState;
  } catch (erro) {
    logError(codigo, 'falha_iniciar_partida', {
      hostId: hostPlayerId,
      erro: erro instanceof Error ? erro.message : 'desconhecido',
    });
    throw erro;
  }
}

export async function marcarLeituraConcluidaArquivos(
  codigo: RoomCode,
  playerId: PlayerId,
): Promise<void> {
  const { publicState, privateState, events } = await lerVisaoJogadorComEventos(
    codigo,
    playerId,
  );
  if (!privateState)
    throw new Error('Estado privado de Arquivos não encontrado.');
  // Idempotência: se o jogador já marcou leitura, ignora sem erro.
  if (publicState.phaseProgress.readyPlayerIds.includes(playerId)) {
    logInfo(codigo, 'leitura_ja_concluida_ignorada', { playerId });
    return;
  }
  const result = processarAcaoArquivos(
    {
      publicState,
      privateStates: { [playerId]: privateState },
      events,
    },
    CASO_DOSSIE_SUMIDO,
    {
      tipo: 'marcar_leitura_concluida',
      playerId,
    },
  );
  try {
    await persistirResultadoJogador(codigo, result.state, playerId);
    logInfo(codigo, 'leitura_concluida', { playerId });
  } catch (erro) {
    logError(codigo, 'falha_marcar_leitura', {
      playerId,
      erro: erro instanceof Error ? erro.message : 'desconhecido',
    });
    throw erro;
  }
}

export async function avancarFaseArquivosRealtime(
  codigo: RoomCode,
  hostPlayerId: PlayerId,
  targetPhase: ArquivosPhase,
): Promise<void> {
  const snapshot = await lerEstadoCompletoHostArquivos(codigo);
  const faseAnterior = snapshot.publicState.phase;
  const result = avancarFaseArquivos(
    snapshot,
    CASO_DOSSIE_SUMIDO,
    hostPlayerId,
    targetPhase,
  );
  try {
    await persistirEstadoCompletoArquivos(codigo, result.state);
    logInfo(codigo, 'fase_avancada', {
      de: faseAnterior,
      para: targetPhase,
      hostId: hostPlayerId,
    });
  } catch (erro) {
    logError(codigo, 'falha_avancar_fase', {
      de: faseAnterior,
      para: targetPhase,
      hostId: hostPlayerId,
      erro: erro instanceof Error ? erro.message : 'desconhecido',
    });
    throw erro;
  }
}

export async function concluirAcaoSecretaArquivos(
  codigo: RoomCode,
  playerId: PlayerId,
  actionId: ArquivosSecretActionId,
): Promise<void> {
  await resolverAcaoSecretaJogador(codigo, playerId, {
    tipo: 'concluir_acao_secreta',
    playerId,
    actionId,
  });
}

export async function recusarAcaoSecretaArquivos(
  codigo: RoomCode,
  playerId: PlayerId,
  actionId: ArquivosSecretActionId,
): Promise<void> {
  await resolverAcaoSecretaJogador(codigo, playerId, {
    tipo: 'recusar_acao_secreta',
    playerId,
    actionId,
  });
}

export async function registrarVereditoArquivosRealtime(
  codigo: RoomCode,
  hostPlayerId: PlayerId,
  verdict: ArquivosVerdict,
): Promise<void> {
  const snapshot = await lerEstadoCompletoHostArquivos(codigo);
  // Idempotência: se já há veredito registrado, a engine ignorará silenciosamente.
  // Registramos um aviso para rastrear chamadas duplicadas em campo.
  if (snapshot.publicState.verdict !== null) {
    logWarn(codigo, 'veredito_duplicado_ignorado', { hostId: hostPlayerId });
    return;
  }
  const result = processarAcaoArquivos(snapshot, CASO_DOSSIE_SUMIDO, {
    tipo: 'registrar_veredito',
    playerId: hostPlayerId,
    verdict,
  });
  try {
    await persistirEstadoCompletoArquivos(codigo, result.state);
    logInfo(codigo, 'veredito_registrado', { hostId: hostPlayerId });
  } catch (erro) {
    logError(codigo, 'falha_registrar_veredito', {
      hostId: hostPlayerId,
      erro: erro instanceof Error ? erro.message : 'desconhecido',
    });
    throw erro;
  }
}

export async function obterRevelacaoFinalArquivos(
  codigo: RoomCode,
): Promise<ArquivosFinalReveal | null> {
  const snapshot = await lerEstadoCompletoHostArquivos(codigo);
  return gerarRevelacaoFinalArquivos(snapshot, CASO_DOSSIE_SUMIDO);
}

export async function lerEstadoCompletoHostArquivos(
  codigo: RoomCode,
): Promise<ArquivosHostSnapshot> {
  const sala = await lerSalaArquivos(codigo);
  if (!sala) throw new Error(`Sala ${codigo} não existe.`);
  const publicState = normalizarEstadoPublicoArquivos(
    sala.estado.estadoPublico,
  );
  const privateStates = await lerTodosPrivadosArquivos(codigo);
  const events = await lerEventosArquivos(codigo);
  return {
    room: sala,
    publicState,
    privateStates,
    events,
  };
}

export async function lerVisaoJogadorArquivos(
  codigo: RoomCode,
  playerId: PlayerId,
): Promise<ArquivosPlayerView> {
  const { publicState, privateState } = await lerVisaoJogadorComEventos(
    codigo,
    playerId,
  );
  return { publicState, privateState };
}

export function observarEstadoPublicoArquivos(
  codigo: RoomCode,
  callback: RoomListener<ArquivosPublicState | null>,
  onErro?: (erro: Error) => void,
): Unsubscribe {
  return onValue(refEstadoPublico(codigo), (snap) => {
    try {
      callback(
        snap.exists() ? normalizarEstadoPublicoArquivos(snap.val()) : null,
      );
    } catch (erro) {
      const erroNormalizado =
        erro instanceof Error ? erro : new Error('Estado público inválido.');
      logError(codigo, 'erro_normalizar_estado_publico', {
        mensagem: erroNormalizado.message,
      });
      if (onErro) {
        onErro(erroNormalizado);
      }
    }
  });
}

export function observarEstadoPrivadoArquivos(
  codigo: RoomCode,
  playerId: PlayerId,
  callback: RoomListener<ArquivosPrivateState | null>,
): Unsubscribe {
  return onValue(refPrivado(codigo, playerId), (snap) => {
    callback(snap.exists() ? (snap.val() as ArquivosPrivateState) : null);
  });
}

export function observarProntosArquivos(
  codigo: RoomCode,
  callback: RoomListener<Record<PlayerId, true>>,
): Unsubscribe {
  return onValue(refReady(codigo), (snap) => {
    callback(snap.exists() ? (snap.val() as Record<PlayerId, true>) : {});
  });
}

async function resolverAcaoSecretaJogador(
  codigo: RoomCode,
  playerId: PlayerId,
  action: Extract<
    ArquivosAction,
    { tipo: 'concluir_acao_secreta' | 'recusar_acao_secreta' }
  >,
): Promise<void> {
  const { publicState, privateState, events } = await lerVisaoJogadorComEventos(
    codigo,
    playerId,
  );
  if (!privateState)
    throw new Error('Estado privado de Arquivos não encontrado.');
  const result = processarAcaoArquivos(
    {
      publicState,
      privateStates: { [playerId]: privateState },
      events,
    },
    CASO_DOSSIE_SUMIDO,
    action,
  );
  await persistirResultadoJogador(codigo, result.state, playerId);
}

async function lerVisaoJogadorComEventos(
  codigo: RoomCode,
  playerId: PlayerId,
): Promise<ArquivosPlayerView & { readonly events: readonly ArquivosEvent[] }> {
  const publicSnap = await comTimeout(
    get(refEstadoPublico(codigo)),
    READ_TIMEOUT_MS,
    'Falha ao ler estado público de Arquivos.',
  );
  if (!publicSnap.exists()) {
    throw new Error('Estado público de Arquivos não encontrado.');
  }
  const privateSnap = await comTimeout(
    get(refPrivado(codigo, playerId)),
    READ_TIMEOUT_MS,
    'Falha ao ler estado privado de Arquivos.',
  );
  return {
    publicState: normalizarEstadoPublicoArquivos(publicSnap.val()),
    privateState: privateSnap.exists()
      ? (privateSnap.val() as ArquivosPrivateState)
      : null,
    events: await lerEventosArquivos(codigo),
  };
}

async function lerSalaArquivos(codigo: RoomCode): Promise<Room | null> {
  const snap = await comTimeout(
    get(refSala(codigo)),
    READ_TIMEOUT_MS,
    'Falha ao ler sala de Arquivos.',
  );
  if (!snap.exists()) return null;
  return snap.val() as Room;
}

async function lerTodosPrivadosArquivos(
  codigo: RoomCode,
): Promise<Record<PlayerId, ArquivosPrivateState>> {
  const snap = await comTimeout(
    get(refPrivados(codigo)),
    READ_TIMEOUT_MS,
    'Falha ao ler estados privados de Arquivos.',
  );
  return snap.exists()
    ? (snap.val() as Record<PlayerId, ArquivosPrivateState>)
    : {};
}

async function lerEventosArquivos(
  codigo: RoomCode,
): Promise<readonly ArquivosEvent[]> {
  const snap = await comTimeout(
    get(refEventos(codigo)),
    READ_TIMEOUT_MS,
    'Falha ao ler eventos de Arquivos.',
  );
  return snap.exists() ? (snap.val() as ArquivosEvent[]) : [];
}

async function persistirEstadoCompletoArquivos(
  codigo: RoomCode,
  state: ArquivosGameState,
): Promise<void> {
  const atualizadoEm = Date.now();
  await comTimeout(
    update(refSala(codigo), {
      estado: criarEstadoFirebaseArquivos(state, atualizadoEm),
      arquivosPrivados: state.privateStates,
      arquivosEventos: state.events,
      atualizadoEm,
    }),
    WRITE_TIMEOUT_MS,
    'Falha ao persistir estado de Arquivos.',
  );
}

async function persistirResultadoJogador(
  codigo: RoomCode,
  state: ArquivosGameState,
  playerId: PlayerId,
): Promise<void> {
  const atualizadoEm = Date.now();
  const privateState = state.privateStates[playerId];
  // Jogadores atualizam apenas seu próprio estado privado e o estado público
  // (phaseProgress). Eventos são escritos exclusivamente pelo host para evitar
  // injeção de eventos falsos por clientes sem autoridade.
  const patch: Record<string, unknown> = {
    estado: criarEstadoFirebaseArquivos(state, atualizadoEm),
    atualizadoEm,
  };
  if (privateState) {
    patch[`arquivosPrivados/${playerId}`] = privateState;
  }

  await comTimeout(
    update(refSala(codigo), patch),
    WRITE_TIMEOUT_MS,
    'Falha ao persistir ação de Arquivos.',
  );
}

function criarEstadoFirebaseArquivos(
  state: ArquivosGameState,
  atualizadoEm: number,
): GameState<ArquivosPublicState, Record<string, never>> {
  return {
    fase: mapearFaseGlobal(state.publicState.phase),
    rodada: obterIndiceFase(state.publicState.phase),
    jogadorAtualId: null,
    estadoPublico: state.publicState,
    estadosPrivados: {},
    vencedorIds: [],
    iniciadoEm: state.publicState.startedAt ?? 0,
    atualizadoEm,
  };
}

function criarEstadoLobbyArquivos(
  atualizadoEm: number,
): GameState<Record<string, never>, Record<string, never>> {
  return {
    fase: 'lobby',
    rodada: 0,
    jogadorAtualId: null,
    estadoPublico: {},
    estadosPrivados: {},
    vencedorIds: [],
    iniciadoEm: 0,
    atualizadoEm,
  };
}

function mapearFaseGlobal(fase: ArquivosPhase): GameState['fase'] {
  if (fase === 'lobby') return 'lobby';
  if (fase === 'veredito') return 'voting';
  if (fase === 'revelacao_resultados' || fase === 'finalizado') {
    return 'results';
  }
  return 'playing';
}

function obterIndiceFase(fase: ArquivosPhase): number {
  const ordem: readonly ArquivosPhase[] = [
    'lobby',
    'apresentacao_caso',
    'leitura_privada',
    'investigacao_inicial',
    'nova_evidencia',
    'confronto',
    'veredito',
    'revelacao_resultados',
    'finalizado',
  ];
  return ordem.indexOf(fase);
}

function normalizarEstadoPublicoArquivos(raw: unknown): ArquivosPublicState {
  if (!raw || typeof raw !== 'object') {
    logError('—', 'estado_publico_invalido', {
      tipo: typeof raw,
      nulo: raw === null,
    });
    throw new Error('Estado público de Arquivos inválido.');
  }
  const estado = raw as Record<string, unknown>;
  // Validação mínima para detectar estrutura corrompida antes de propagar.
  // Logamos o problema para rastrear reconexões com estado parcial em campo.
  if (typeof estado['phase'] !== 'string') {
    logError(
      typeof estado['roomCode'] === 'string' ? estado['roomCode'] : '—',
      'estado_publico_corrompido',
      { campo: 'phase', tipo: typeof estado['phase'] },
    );
    throw new Error(
      'Estado público de Arquivos corrompido: campo "phase" ausente ou inválido.',
    );
  }
  if (typeof estado['caseId'] !== 'string') {
    logError(
      typeof estado['roomCode'] === 'string' ? estado['roomCode'] : '—',
      'estado_publico_corrompido',
      { campo: 'caseId', tipo: typeof estado['caseId'] },
    );
    throw new Error(
      'Estado público de Arquivos corrompido: campo "caseId" ausente ou inválido.',
    );
  }
  return raw as ArquivosPublicState;
}
