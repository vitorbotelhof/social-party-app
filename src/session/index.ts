/**
 * Session — API pública da camada de identidade social.
 *
 * Importar daqui, não dos arquivos internos diretamente.
 *
 * @example
 * import {
 *   iniciarSessao,
 *   registrarJogoIniciado,
 *   processarResultadoMrWhite,
 *   obterCallback,
 *   gerarDossie,
 * } from '@/session';
 */

// ─── Core store ───────────────────────────────────────────────────────────────

export {
  iniciarSessao,
  finalizarSessao,
  resetarSessao,
  getSessaoAtual,
  observarSessao,
  registrarJogoIniciado,
  registrarJogoFinalizado,
  registrarMomento,
  atualizarJogadorSessao,
  atualizarTemperatura,
  atualizarGrupoIdentidade,
  atualizarVibeDetectada,
  marcarCallbackUsado,
  construirMapaNomes,
  contarMomentos,
  getJogosCompletos,
} from './sessionStore';

// ─── Emotional tracking ───────────────────────────────────────────────────────

export {
  atualizarEstadoEmocional,
  calcularTemperatura,
} from './emotionalTracker';

// ─── Group profile ────────────────────────────────────────────────────────────

export {
  reavaliarGrupo,
  detectarIdentidadeGrupo,
} from './groupProfile';

// ─── Callback engine ──────────────────────────────────────────────────────────

export {
  obterCallback,
  obterCallbackSimples,
  getTemplates,
} from './callbackEngine';

// ─── Dossiê do Caos ───────────────────────────────────────────────────────────

export { gerarDossie } from './dossieDoCapos';

// ─── Vibe engine ──────────────────────────────────────────────────────────────

export {
  detectarVibe,
  calcularVibe,
  getVibePorJogo,
} from './vibeEngine';

// ─── Game adapters ────────────────────────────────────────────────────────────

export {
  processarResultadoMrWhite,
} from './mrWhiteAdapter';

export type { ResultadoMrWhite } from './mrWhiteAdapter';

export {
  processarRodadaMLT,
  processarResultadoMLT,
} from './mltAdapter';

export type { RodadaMLT, ResultadoMLT } from './mltAdapter';

export {
  processarTurnoNPL,
  processarResultadoNPL,
} from './nplAdapter';

export type { TurnoNPL, ResultadoNPL } from './nplAdapter';

// ─── Types ────────────────────────────────────────────────────────────────────

export type {
  VibeId,
  TemperaturaEmocional,
  GrupoIdentidade,
  TipoMomento,
  Momento,
  JogoSessao,
  SessaoJogador,
  SessionIdentity,
  MrWhiteSessaoStats,
  MLTSessaoStats,
  NPLSessaoStats,
  DestaqueJogador,
  DossieDoCapos,
  MomentoCallback,
  CallbackTemplate,
} from './types';
