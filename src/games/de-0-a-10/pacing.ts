// ─── De 0 a 10 — Pacing ─────────────────────────────────────────────────────
//
// Em rodas grandes, exigir palpite privado de todos prende o celular tempo
// demais. Uma janela circular de leitores mantém o grupo em movimento e se
// desloca junto com o respondente a cada rodada.

import type { ModoLeituraDe0a10 } from './types';

const LIMIAR_JOGADORES_LEITURA_ROTATIVA = 8;
const TOTAL_LEITORES_RODADA_ROTATIVA = 4;
const LIMIAR_ADIVINHADORES_VOTO_RAPIDO = 7;

export function definirModoLeitura(totalJogadores: number): ModoLeituraDe0a10 {
  return totalJogadores >= LIMIAR_JOGADORES_LEITURA_ROTATIVA
    ? 'rotativa'
    : 'completa';
}

export function selecionarLeitoresDaRodada<T>(
  ordemCircular: readonly T[],
  modoLeitura: ModoLeituraDe0a10,
): T[] {
  if (modoLeitura === 'completa') return [...ordemCircular];
  return ordemCircular.slice(0, TOTAL_LEITORES_RODADA_ROTATIVA);
}

export function usarVotacaoRapida(
  qtdAdivinhadores: number,
  modoLeitura: ModoLeituraDe0a10 = 'completa',
): boolean {
  return (
    modoLeitura === 'rotativa' ||
    qtdAdivinhadores >= LIMIAR_ADIVINHADORES_VOTO_RAPIDO
  );
}
