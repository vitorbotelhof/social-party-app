// ─── Entrelinhas — Engine de Rodada ──────────────────────────────────────────
//
// Uma história por rodada. Máquina linear:
//   narrando → investigando → reveal
//
// O grupo escolhe a próxima história na tela de lista — não aqui.

import { HISTORIAS } from './historias';
import type {
  ResultadoRodada,
  RodadaEntrelinhas,
} from './types';

// ─── Criação de rodada ────────────────────────────────────────────────────────

export function criarRodada(historiaId: string): RodadaEntrelinhas | null {
  const historia = HISTORIAS.find((h) => h.id === historiaId);
  if (!historia) return null;
  return {
    historia,
    subFase: 'narrando',
    resultado: null,
  };
}

// ─── Transições de estado ─────────────────────────────────────────────────────

/** Narrador tocou "grupo está pronto" — começa a rodada de perguntas. */
export function iniciarInvestigacao(
  rodada: RodadaEntrelinhas,
): RodadaEntrelinhas {
  if (rodada.subFase !== 'narrando') return rodada;
  return { ...rodada, subFase: 'investigando' };
}

/** Narrador tocou "revelar" — registra resultado e mostra solução. */
export function revelarSolucao(
  rodada: RodadaEntrelinhas,
  resultado: ResultadoRodada,
): RodadaEntrelinhas {
  if (rodada.subFase !== 'investigando') return rodada;
  return { ...rodada, subFase: 'reveal', resultado };
}
