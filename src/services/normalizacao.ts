import type { GameState, PlayerId } from '@/engine/types';

export function normalizarEstadoPublico(pub: unknown): Record<string, unknown> {
  const base = (pub && typeof pub === 'object' ? pub : {}) as Record<
    string,
    unknown
  >;
  return {
    ...base,
    // ── campos compartilhados ──────────────────────────────────────────────
    ordemJogadores: base.ordemJogadores ?? [],
    votos: base.votos ?? {},
    // ── Mr White ──────────────────────────────────────────────────────────
    idsPorAntiguidade: base.idsPorAntiguidade ?? [],
    jogadoresQueViram: base.jogadoresQueViram ?? [],
    pistas: base.pistas ?? [],
    eliminadosIds: base.eliminadosIds ?? [],
    mrWhiteIdsRevelados: base.mrWhiteIdsRevelados ?? [],
    prazoTurnoEm: base.prazoTurnoEm ?? null,
    duracaoTurnoSegundos: base.duracaoTurnoSegundos ?? 60,
    // ── Mr White multi-round ──────────────────────────────────────────────
    ordemAtiva: base.ordemAtiva ?? base.ordemJogadores ?? [],
    rodadaVotacao: base.rodadaVotacao ?? 1,
    ultimoEliminadoId: base.ultimoEliminadoId ?? null,
    ultimoEliminadoEraMrWhite: base.ultimoEliminadoEraMrWhite ?? null,
    prazoProximaRodadaEm: base.prazoProximaRodadaEm ?? null,
    mrWhitesEliminados: base.mrWhitesEliminados ?? 0,
    civilsEliminados: base.civilsEliminados ?? 0,
    modoJogo: base.modoJogo ?? 'classico',
    // ── Most Likely To ────────────────────────────────────────────────────
    resultados: base.resultados ?? [],
    indicesPromptUsados: base.indicesPromptUsados ?? [],
    vencedorRodadaAtual: base.vencedorRodadaAtual ?? null,
    foiEmpate: base.foiEmpate ?? false,
    rodadaIniciadaEm: base.rodadaIniciadaEm ?? 0,
  };
}

export function normalizarEstado(raw: unknown): GameState | null {
  if (!raw || typeof raw !== 'object') return null;
  const e = raw as Record<string, unknown>;
  return {
    fase: (e.fase as GameState['fase']) ?? 'lobby',
    rodada: (e.rodada as number) ?? 0,
    jogadorAtualId: (e.jogadorAtualId as PlayerId | null) ?? null,
    estadoPublico: normalizarEstadoPublico(e.estadoPublico),
    estadosPrivados: (e.estadosPrivados as Record<PlayerId, unknown>) ?? {},
    vencedorIds: (e.vencedorIds as PlayerId[]) ?? [],
    iniciadoEm: (e.iniciadoEm as number) ?? 0,
    atualizadoEm: (e.atualizadoEm as number) ?? 0,
  };
}
