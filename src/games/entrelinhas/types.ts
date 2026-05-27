// ─── Entrelinhas — Types ──────────────────────────────────────────────────────

import type { DificuldadeHistoria, Historia } from './historias';

export type { DificuldadeHistoria, Historia };

export type DificuldadeFiltro = DificuldadeHistoria | 'todas';

export type SubFaseEntrelinhas =
  | 'narrando'      // narrador lê o contexto para o grupo (celular privado)
  | 'investigando'  // grupo faz perguntas; narrador responde verbalmente
  | 'reveal';       // solução revelada para todos

export type ResultadoRodada = 'resolvida' | 'desistiu';

/** Estado de uma rodada — uma única história. */
export interface RodadaEntrelinhas {
  historia: Historia;
  subFase: SubFaseEntrelinhas;
  /** Preenchido após revelar. */
  resultado: ResultadoRodada | null;
}
