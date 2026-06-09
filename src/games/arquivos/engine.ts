import type { PlayerId, RoomCode } from '@/engine/types';
import {
  criarProgressoFase,
  fasePermiteVeredito,
  marcarJogadorPronto,
  podeAvancarParaFase,
} from './phaseMachine';
import {
  aplicarResultadoIndividual,
  criarEstadosPrivadosArquivos,
} from './privateView';
import {
  calcularResultadoColetivo,
  calcularResultadosIndividuais,
} from './scoring';
import {
  atribuirAcoesSecretasDaFase,
  resolverAcaoSecreta,
} from './secretActions';
import type {
  ArquivosAction,
  ArquivosCase,
  ArquivosCharacterAssignment,
  ArquivosEngineResult,
  ArquivosEvent,
  ArquivosFinalReveal,
  ArquivosGameState,
  ArquivosPhase,
  ArquivosPlayerRef,
  ArquivosPublicEvidenceRecord,
  ArquivosSecretActionId,
  ArquivosVerdict,
} from './types';

export interface CriarPartidaArquivosInput {
  readonly caso: ArquivosCase;
  readonly roomCode: RoomCode;
  readonly hostPlayerId: PlayerId;
  readonly players: readonly ArquivosPlayerRef[];
  readonly at?: number;
}

export function criarPartidaArquivos({
  caso,
  roomCode,
  hostPlayerId,
  players,
  at = Date.now(),
}: CriarPartidaArquivosInput): ArquivosGameState {
  validarJogadores(caso, players, hostPlayerId);
  const assignments = distribuirPersonagens(caso, players);
  const privateStates = criarEstadosPrivadosArquivos(caso, assignments, at);
  const state: ArquivosGameState = {
    publicState: {
      caseId: caso.id,
      roomCode,
      phase: 'apresentacao_caso',
      phaseStartedAt: at,
      hostPlayerId,
      players,
      assignments,
      releasedPublicEvidences: [],
      secretActionProgress: [],
      phaseProgress: criarProgressoFase(players.length),
      verdict: null,
      collectiveResult: null,
      startedAt: at,
      finishedAt: null,
      updatedAt: at,
    },
    privateStates,
    events: [
      {
        tipo: 'partida_iniciada',
        caseId: caso.id,
        at,
      },
    ],
  };

  return atribuirAcoesSecretasDaFase(state, caso, 'apresentacao_caso', at);
}

export function processarAcaoArquivos(
  state: ArquivosGameState,
  caso: ArquivosCase,
  action: ArquivosAction,
  at = Date.now(),
): ArquivosEngineResult {
  switch (action.tipo) {
    case 'marcar_leitura_concluida':
      return marcarLeituraConcluida(state, action.playerId, at);
    case 'avancar_fase':
      return avancarFaseArquivos(
        state,
        caso,
        action.playerId,
        action.targetPhase,
        at,
      );
    case 'concluir_acao_secreta':
      return resolverAcaoSecretaComEvento(
        state,
        caso,
        action.playerId,
        action.actionId,
        'concluida',
        at,
      );
    case 'recusar_acao_secreta':
      return resolverAcaoSecretaComEvento(
        state,
        caso,
        action.playerId,
        action.actionId,
        'recusada',
        at,
      );
    case 'registrar_veredito':
      return registrarVereditoArquivos(
        state,
        caso,
        action.playerId,
        action.verdict,
        at,
      );
  }
}

export function avancarFaseArquivos(
  state: ArquivosGameState,
  caso: ArquivosCase,
  playerId: PlayerId,
  targetPhase: ArquivosPhase,
  at = Date.now(),
): ArquivosEngineResult {
  const publicState = state.publicState;
  if (playerId !== publicState.hostPlayerId) return resultadoComEstado(state);
  if (!podeAvancarParaFase(publicState.phase, targetPhase)) {
    return resultadoComEstado(state);
  }
  if (publicState.phase === targetPhase) return resultadoComEstado(state);

  let nextState: ArquivosGameState = {
    ...state,
    publicState: {
      ...publicState,
      phase: targetPhase,
      phaseStartedAt: at,
      phaseProgress: criarProgressoFase(publicState.players.length),
      releasedPublicEvidences:
        targetPhase === 'nova_evidencia'
          ? [
              ...publicState.releasedPublicEvidences,
              ...liberarEvidenciasPublicasDaFase(
                caso,
                publicState.releasedPublicEvidences.map(
                  (record) => record.evidenceId,
                ),
                targetPhase,
                at,
              ),
            ]
          : publicState.releasedPublicEvidences,
      finishedAt: targetPhase === 'finalizado' ? at : publicState.finishedAt,
      updatedAt: at,
    },
  };

  nextState = atribuirAcoesSecretasDaFase(nextState, caso, targetPhase, at);

  const events: ArquivosEvent[] = [
    {
      tipo: 'fase_alterada',
      from: publicState.phase,
      to: targetPhase,
      at,
    },
  ];

  if (targetPhase === 'nova_evidencia') {
    events.push(
      ...nextState.publicState.releasedPublicEvidences
        .filter((record) => record.liberadaEm === at)
        .map<ArquivosEvent>((record) => ({
          tipo: 'evidencia_liberada',
          evidenceId: record.evidenceId,
          at,
        })),
    );
  }

  return resultadoComEstado(nextState, events);
}

export function registrarVereditoArquivos(
  state: ArquivosGameState,
  caso: ArquivosCase,
  playerId: PlayerId,
  verdict: ArquivosVerdict,
  at = Date.now(),
): ArquivosEngineResult {
  if (!fasePermiteVeredito(state.publicState.phase)) {
    return resultadoComEstado(state);
  }
  if (playerId !== state.publicState.hostPlayerId) {
    return resultadoComEstado(state);
  }
  // Guarda contra duplo envio: se o veredito já foi registrado, ignora silenciosamente.
  if (state.publicState.verdict !== null) {
    return resultadoComEstado(state);
  }

  const collectiveResult = calcularResultadoColetivo(caso, verdict);
  const individualResults = calcularResultadosIndividuais(
    caso,
    state.privateStates,
    collectiveResult,
  );
  const privateStates = { ...state.privateStates };
  for (const result of individualResults) {
    const privateState = privateStates[result.playerId];
    if (!privateState) continue;
    privateStates[result.playerId] = aplicarResultadoIndividual(
      privateState,
      result,
      at,
    );
  }

  const nextState: ArquivosGameState = {
    ...state,
    publicState: {
      ...state.publicState,
      verdict,
      collectiveResult,
      phase: 'revelacao_resultados',
      phaseStartedAt: at,
      phaseProgress: criarProgressoFase(state.publicState.players.length),
      updatedAt: at,
    },
    privateStates,
  };

  const individualEvents: ArquivosEvent[] = individualResults.map((result) => ({
    tipo: 'objetivo_individual_resolvido',
    playerId: result.playerId,
    status: result.status,
    at,
  }));

  return resultadoComEstado(nextState, [
    {
      tipo: 'veredito_registrado',
      at,
    },
    {
      tipo: 'caso_revelado',
      grade: collectiveResult.grade,
      at,
    },
    ...individualEvents,
  ]);
}

export function gerarRevelacaoFinalArquivos(
  state: ArquivosGameState,
  caso: ArquivosCase,
): ArquivosFinalReveal | null {
  const collectiveResult = state.publicState.collectiveResult;
  if (!collectiveResult) return null;

  return {
    caseId: caso.id,
    truth: caso.truth,
    collectiveResult,
    individualResults: Object.values(state.privateStates)
      .map((privateState) => privateState.individualResult)
      .filter(
        (result): result is NonNullable<typeof result> => result !== null,
      ),
  };
}

function marcarLeituraConcluida(
  state: ArquivosGameState,
  playerId: PlayerId,
  at: number,
): ArquivosEngineResult {
  if (state.publicState.phase !== 'leitura_privada') {
    return resultadoComEstado(state);
  }
  if (!state.privateStates[playerId]) return resultadoComEstado(state);
  if (state.publicState.phaseProgress.readyPlayerIds.includes(playerId)) {
    return resultadoComEstado(state);
  }

  return resultadoComEstado(
    {
      ...state,
      publicState: {
        ...state.publicState,
        phaseProgress: marcarJogadorPronto(
          state.publicState.phaseProgress,
          playerId,
        ),
        updatedAt: at,
      },
    },
    [
      {
        tipo: 'leitura_concluida',
        playerId,
        at,
      },
    ],
  );
}

function resolverAcaoSecretaComEvento(
  state: ArquivosGameState,
  caso: ArquivosCase,
  playerId: PlayerId,
  actionId: ArquivosSecretActionId,
  status: 'concluida' | 'recusada',
  at: number,
): ArquivosEngineResult {
  const nextState = resolverAcaoSecreta(
    state,
    caso,
    playerId,
    actionId,
    status,
    at,
  );

  if (nextState === state) return resultadoComEstado(state);

  return resultadoComEstado(nextState, [
    {
      tipo: 'acao_secreta_resolvida',
      actionId,
      playerId,
      status,
      at,
    },
  ]);
}

function resultadoComEstado(
  state: ArquivosGameState,
  events: readonly ArquivosEvent[] = [],
): ArquivosEngineResult {
  return {
    state: {
      ...state,
      events: [...state.events, ...events],
    },
    events,
  };
}

function distribuirPersonagens(
  caso: ArquivosCase,
  players: readonly ArquivosPlayerRef[],
): ArquivosCharacterAssignment[] {
  return players.map((player, index) => {
    const character = caso.characters[index];
    if (!character) {
      throw new Error(`Caso ${caso.id} não possui personagens suficientes.`);
    }
    return {
      playerId: player.id,
      characterId: character.id,
    };
  });
}

function liberarEvidenciasPublicasDaFase(
  caso: ArquivosCase,
  alreadyReleasedIds: readonly string[],
  phase: ArquivosPhase,
  at: number,
): ArquivosPublicEvidenceRecord[] {
  return caso.evidences
    .filter(
      (evidence) =>
        evidence.phaseAvailable === phase &&
        evidence.visibilidade === 'publica' &&
        !alreadyReleasedIds.includes(evidence.id),
    )
    .map((evidence) => ({
      evidenceId: evidence.id,
      titulo: evidence.titulo,
      liberadaEm: at,
      phase,
    }));
}

function validarJogadores(
  caso: ArquivosCase,
  players: readonly ArquivosPlayerRef[],
  hostPlayerId: PlayerId,
): void {
  if (players.length < caso.config.minPlayers) {
    throw new Error(
      `Arquivos exige pelo menos ${caso.config.minPlayers} jogadores.`,
    );
  }
  if (players.length > caso.config.maxPlayers) {
    throw new Error(
      `Arquivos aceita no máximo ${caso.config.maxPlayers} jogadores.`,
    );
  }
  if (players.length > caso.characters.length) {
    throw new Error(`Caso ${caso.id} não possui personagens suficientes.`);
  }
  if (!players.some((player) => player.id === hostPlayerId)) {
    throw new Error('O anfitrião precisa estar na lista de jogadores.');
  }
}
