/**
 * debug/index — Barrel export do sistema de playtesting.
 *
 * Importar apenas em __DEV__ contexts ou com guards explícitos.
 * Todo o código aqui é no-op em produção via __DEV__ guards internos.
 */

// UI
export { DebugPanelInquisicao } from './inquisicao/DebugPanelInquisicao';

// Logger de fase
export { logMudancaSubFase, resetPhaseLogger } from './inquisicao/phaseLogger';

// Pacing tracker
export {
  iniciarSubFase,
  finalizarSubFase,
  registrarEventoPublico,
  registrarEventoPrivadoLido,
  registrarFimDeLoop,
  registrarDistribuicaoVotos,
  registrarAcaoNoturna,
  registrarJogoFinalizado,
  registrarReplay,
  resetPacingTracker,
} from './inquisicao/pacingTracker';

// Loop replay
export { processarEstadoParaReplay, exportarReplay, resetLoopReplay } from './inquisicao/loopReplay';

// Debug store (para consumo externo, ex: emotionalTracker)
export { adicionarEmocionalLog } from './inquisicao/debugStore';

// Types
export type {
  AbaDebug,
  DebugConfig,
  DebugState,
  EmocionalLog,
  FaseLog,
  LoopSnapshot,
  PacingMetrics,
} from './inquisicao/debugTypes';
