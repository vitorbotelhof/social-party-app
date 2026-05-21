/**
 * phaseLogger — Registra transições de sub-fase com timestamps.
 *
 * Chamado por TelaInquisicao a cada mudança de estadoPublico.subFase.
 * Calcula a duração de cada fase automaticamente.
 */

import { adicionarFaseLog } from './debugStore';
import type { FaseLog } from './debugTypes';

let _ultimoLog: FaseLog | null = null;
let _contadorId = 0;

/**
 * Registra uma mudança de sub-fase.
 * Calcular a duração da fase anterior (tempo desde o último log).
 */
export function logMudancaSubFase(subFase: string, loop: number): void {
  if (!__DEV__) return;

  const agora = Date.now();
  const duracaoAnteriorMs = _ultimoLog !== null ? agora - _ultimoLog.timestamp : null;

  const log: FaseLog = {
    id: `fase_${++_contadorId}`,
    subFase,
    loop,
    timestamp: agora,
    duracaoAnteriorMs,
  };

  _ultimoLog = log;
  adicionarFaseLog(log);
}

/** Reseta o logger — chamar ao iniciar nova partida. */
export function resetPhaseLogger(): void {
  _ultimoLog = null;
  _contadorId = 0;
}
