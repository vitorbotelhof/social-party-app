import { registrarJogo } from '@/engine/registry';
import { mrWhiteEngine } from '@/games/mr-white';
import { mostLikelyEngine } from '@/games/most-likely-to';

let jogosForamRegistrados = false;

/**
 * Registra todos os jogos disponíveis no engine.
 * Idempotente: chamadas extras são ignoradas (HMR-safe).
 */
export function registrarJogosDisponiveis(): void {
  if (jogosForamRegistrados) return;
  registrarJogo(mrWhiteEngine);
  registrarJogo(mostLikelyEngine);
  jogosForamRegistrados = true;
}

export { mrWhiteEngine, mostLikelyEngine };
