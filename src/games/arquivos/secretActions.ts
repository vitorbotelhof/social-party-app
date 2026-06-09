import type { PlayerId } from '@/engine/types';
import {
  adicionarEvidenciaVisivel,
  definirAcaoSecretaAtiva,
  desbloquearArquivoPrivado,
  moverAcaoSecretaParaHistorico,
} from './privateView';
import type {
  ArquivosCase,
  ArquivosGameState,
  ArquivosPhase,
  ArquivosPrivateSecretActionState,
  ArquivosSecretAction,
  ArquivosSecretActionId,
  ArquivosSecretActionPublicRecord,
  ArquivosSecretActionStatus,
} from './types';

export function atribuirAcoesSecretasDaFase(
  state: ArquivosGameState,
  caso: ArquivosCase,
  phase: ArquivosPhase,
  at: number,
): ArquivosGameState {
  const publicRecords: ArquivosSecretActionPublicRecord[] = [
    ...state.publicState.secretActionProgress,
  ];
  const privateStates = { ...state.privateStates };
  const actionsForPhase = caso.secretActions.filter(
    (action) => action.phaseAvailable === phase,
  );

  for (const playerState of Object.values(privateStates)) {
    if (playerState.activeSecretAction) continue;

    const action = encontrarAcaoParaPersonagem(
      actionsForPhase,
      playerState.character.id,
      playerState.completedSecretActions.map((item) => item.action.id),
    );

    if (!action) continue;

    const actionState: ArquivosPrivateSecretActionState = {
      action,
      status: 'pendente',
      rewardRevealed: false,
      reward: null,
      updatedAt: at,
    };

    privateStates[playerState.playerId] = definirAcaoSecretaAtiva(
      playerState,
      actionState,
    );
    publicRecords.push({
      actionId: action.id,
      playerId: playerState.playerId,
      status: 'pendente',
      updatedAt: at,
    });
  }

  return {
    ...state,
    publicState: {
      ...state.publicState,
      secretActionProgress: publicRecords,
      updatedAt: at,
    },
    privateStates,
  };
}

export function resolverAcaoSecreta(
  state: ArquivosGameState,
  caso: ArquivosCase,
  playerId: PlayerId,
  actionId: ArquivosSecretActionId,
  status: Extract<ArquivosSecretActionStatus, 'concluida' | 'recusada'>,
  at: number,
): ArquivosGameState {
  const privateState = state.privateStates[playerId];
  const activeAction = privateState?.activeSecretAction;
  if (!privateState || !activeAction || activeAction.action.id !== actionId) {
    return state;
  }

  const reward =
    status === 'concluida'
      ? activeAction.action.reward
      : activeAction.action.alternativaAcessivel.reward;

  const completedAction: ArquivosPrivateSecretActionState = {
    ...activeAction,
    status,
    reward,
    rewardRevealed: true,
    updatedAt: at,
  };

  let nextPrivateState = moverAcaoSecretaParaHistorico(
    privateState,
    completedAction,
  );
  if (reward.fileId) {
    nextPrivateState = desbloquearArquivoPrivado(
      nextPrivateState,
      caso,
      reward.fileId,
      at,
    );
  }
  if (reward.evidenceId) {
    nextPrivateState = adicionarEvidenciaVisivel(
      nextPrivateState,
      reward.evidenceId,
      at,
    );
  }

  return {
    ...state,
    publicState: {
      ...state.publicState,
      secretActionProgress: state.publicState.secretActionProgress.map(
        (record) =>
          record.playerId === playerId && record.actionId === actionId
            ? { ...record, status, updatedAt: at }
            : record,
      ),
      updatedAt: at,
    },
    privateStates: {
      ...state.privateStates,
      [playerId]: nextPrivateState,
    },
  };
}

function encontrarAcaoParaPersonagem(
  actions: readonly ArquivosSecretAction[],
  characterId: string,
  completedActionIds: readonly ArquivosSecretActionId[],
): ArquivosSecretAction | null {
  return (
    actions.find(
      (action) =>
        action.recipientCharacterIds.includes(characterId) &&
        !completedActionIds.includes(action.id),
    ) ?? null
  );
}
