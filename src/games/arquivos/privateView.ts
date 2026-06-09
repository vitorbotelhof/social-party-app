import type { PlayerId } from '@/engine/types';
import type {
  ArquivosCase,
  ArquivosCharacter,
  ArquivosCharacterAssignment,
  ArquivosEvidenceId,
  ArquivosFileId,
  ArquivosIndividualResult,
  ArquivosPrivateFile,
  ArquivosPrivateState,
  ArquivosPrivateSecretActionState,
} from './types';

function encontrarPersonagem(
  caso: ArquivosCase,
  characterId: string,
): ArquivosCharacter {
  const character = caso.characters.find((item) => item.id === characterId);
  if (!character) {
    throw new Error(`Personagem de Arquivos não encontrado: ${characterId}`);
  }
  return character;
}

function encontrarArquivo(
  caso: ArquivosCase,
  fileId: ArquivosFileId,
): ArquivosPrivateFile {
  const file = caso.files.find((item) => item.id === fileId);
  if (!file) {
    throw new Error(`Arquivo de Arquivos não encontrado: ${fileId}`);
  }
  return file;
}

export function criarEstadosPrivadosArquivos(
  caso: ArquivosCase,
  assignments: readonly ArquivosCharacterAssignment[],
  at: number,
): Record<PlayerId, ArquivosPrivateState> {
  return Object.fromEntries(
    assignments.map((assignment) => {
      const character = encontrarPersonagem(caso, assignment.characterId);
      const initialFiles = character.initialFileIds.map((fileId) =>
        encontrarArquivo(caso, fileId),
      );
      const visibleEvidenceIds = uniqueIds(
        initialFiles.flatMap((file) => file.evidenceIds),
      );

      return [
        assignment.playerId,
        {
          playerId: assignment.playerId,
          character,
          initialFiles,
          unlockedFiles: [],
          visibleEvidenceIds,
          activeSecretAction: null,
          completedSecretActions: [],
          individualResult: null,
          updatedAt: at,
        },
      ];
    }),
  );
}

export function desbloquearArquivoPrivado(
  estado: ArquivosPrivateState,
  caso: ArquivosCase,
  fileId: ArquivosFileId,
  at: number,
): ArquivosPrivateState {
  if (
    estado.initialFiles.some((file) => file.id === fileId) ||
    estado.unlockedFiles.some((file) => file.id === fileId)
  ) {
    return estado;
  }

  const file = encontrarArquivo(caso, fileId);

  return {
    ...estado,
    unlockedFiles: [...estado.unlockedFiles, file],
    visibleEvidenceIds: uniqueIds([
      ...estado.visibleEvidenceIds,
      ...file.evidenceIds,
    ]),
    updatedAt: at,
  };
}

export function adicionarEvidenciaVisivel(
  estado: ArquivosPrivateState,
  evidenceId: ArquivosEvidenceId,
  at: number,
): ArquivosPrivateState {
  if (estado.visibleEvidenceIds.includes(evidenceId)) return estado;

  return {
    ...estado,
    visibleEvidenceIds: [...estado.visibleEvidenceIds, evidenceId],
    updatedAt: at,
  };
}

export function definirAcaoSecretaAtiva(
  estado: ArquivosPrivateState,
  actionState: ArquivosPrivateSecretActionState,
): ArquivosPrivateState {
  return {
    ...estado,
    activeSecretAction: actionState,
    updatedAt: actionState.updatedAt,
  };
}

export function moverAcaoSecretaParaHistorico(
  estado: ArquivosPrivateState,
  actionState: ArquivosPrivateSecretActionState,
): ArquivosPrivateState {
  return {
    ...estado,
    activeSecretAction: null,
    completedSecretActions: [...estado.completedSecretActions, actionState],
    updatedAt: actionState.updatedAt,
  };
}

export function aplicarResultadoIndividual(
  estado: ArquivosPrivateState,
  result: ArquivosIndividualResult,
  at: number,
): ArquivosPrivateState {
  return {
    ...estado,
    individualResult: result,
    updatedAt: at,
  };
}

function uniqueIds<T extends string>(ids: readonly T[]): T[] {
  return Array.from(new Set(ids));
}
