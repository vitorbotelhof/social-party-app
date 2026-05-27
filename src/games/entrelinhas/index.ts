// ─── Entrelinhas — Public API ─────────────────────────────────────────────────

export { HISTORIAS } from './historias';
export type { DificuldadeHistoria, Historia } from './historias';

export {
  criarRodada,
  iniciarInvestigacao,
  revelarSolucao,
} from './engine';

export type {
  DificuldadeFiltro,
  ResultadoRodada,
  RodadaEntrelinhas,
  SubFaseEntrelinhas,
} from './types';
