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

export { reavaliarGrupo, detectarIdentidadeGrupo } from './groupProfile';

// ─── Callback engine ──────────────────────────────────────────────────────────

export {
  obterCallback,
  obterCallbackSimples,
  getTemplates,
} from './callbackEngine';

// ─── Dossiê do Caos ───────────────────────────────────────────────────────────

export { gerarDossie } from './dossieDoCapos';

// ─── Vibe engine ──────────────────────────────────────────────────────────────

export { detectarVibe, calcularVibe, getVibePorJogo } from './vibeEngine';

// ─── Recomendações ───────────────────────────────────────────────────────────

export { sugerirProximoJogo, sugerirProximosJogos } from './sugestaoJogo';

export type { SugestaoJogoPontuada } from './sugestaoJogo';

// ─── Game adapters ────────────────────────────────────────────────────────────

export { processarResultadoMrWhite } from './mrWhiteAdapter';

export type { ResultadoMrWhite } from './mrWhiteAdapter';

export { processarRodadaMLT, processarResultadoMLT } from './mltAdapter';

export type { RodadaMLT, ResultadoMLT } from './mltAdapter';

export { processarTurnoNPL, processarResultadoNPL } from './nplAdapter';

export type { TurnoNPL, ResultadoNPL } from './nplAdapter';

export {
  processarLoopInquisicao,
  processarResultadoInquisicao,
  construirLoopInquisicao,
} from './inquisicaoAdapter';

export type { LoopInquisicao, ResultadoInquisicao } from './inquisicaoAdapter';

export {
  processarTurnoFazAi,
  processarResultadoFazAi,
} from './fazAiLocalAdapter';

export type {
  RodadaResolvidaFazAi,
  ResultadoFazAiFinalizado,
} from '@/games/faz-ai/types';

export {
  processarRodadaAlianca,
  processarRejeicaoAlianca,
  processarResultadoAlianca,
} from './aliancaAdapter';

export type {
  EquipeAliancaRejeitada,
  RodadaAliancaResolvida,
  ResultadoAliancaFinalizado,
} from '@/games/alianca';

export { processarResultadoEuNunca } from './euNuncaLocalAdapter';
export type { ResultadoEuNunca } from './euNuncaLocalAdapter';

export {
  processarRodadaQuemNaSala,
  processarResultadoQuemNaSala,
} from './quemNaSalaLocalAdapter';
export type {
  RodadaQuemNaSala,
  ResultadoQuemNaSala,
} from './quemNaSalaLocalAdapter';

export {
  processarTurnoVerdadeDesafio,
  processarResultadoVerdadeDesafio,
} from './verdadeDesafioLocalAdapter';
export type {
  TurnoVerdadeDesafio,
  ResultadoVerdadeDesafio,
} from './verdadeDesafioLocalAdapter';

export {
  processarResultadoArquivos,
  processarEvidenciaLiberada,
  processarAcaoSecretaConcluida,
  processarVereditoRegistrado,
} from './arquivosAdapter';
export type { ResultadoArquivos } from './arquivosAdapter';

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
  InquisicaoSessaoStats,
  FazAiSessaoStats,
  AliancaSessaoStats,
  EuNuncaSessaoStats,
  QuemNaSalaSessaoStats,
  VerdadeDesafioSessaoStats,
  ArquivosSessaoStats,
  DestaqueJogador,
  DossieDoCapos,
  MomentoCallback,
  CallbackTemplate,
} from './types';
