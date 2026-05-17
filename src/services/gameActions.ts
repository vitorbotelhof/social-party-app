import { ref, runTransaction } from 'firebase/database';

import { obterJogo } from '@/engine/registry';
import type {
  GameAction,
  GameId,
  PlayerId,
  RoomCode,
} from '@/engine/types';
import { comTimeout } from '@/services/comTimeout';
import { getRealtimeDb } from '@/services/firebase';
import { normalizarEstado } from '@/services/normalizacao';

export function criarAcao<TPayload>(
  tipo: string,
  jogadorId: PlayerId,
  payload: TPayload,
): GameAction<TPayload> {
  return { tipo, jogadorId, payload, em: Date.now() };
}

export async function despacharAcao(
  codigo: RoomCode,
  jogoId: GameId,
  acao: GameAction,
): Promise<void> {
  const engine = obterJogo(jogoId);
  if (!engine) {
    throw new Error(`Jogo "${jogoId}" não está registrado.`);
  }

  await comTimeout(
    runTransaction(
      ref(getRealtimeDb(), `salas/${codigo}/estado`),
      (estadoRaw) => {
        if (estadoRaw === null || estadoRaw === undefined) return estadoRaw;
        const estadoNormalizado = normalizarEstado(estadoRaw);
        if (!estadoNormalizado) return estadoRaw;
        return engine.processarAcao(estadoNormalizado, acao);
      },
    ),
  );
}
