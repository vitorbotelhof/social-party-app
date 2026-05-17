import type { GameState, PlayerId } from '@/engine/types';

export function normalizarEstadoPublico(pub: unknown): Record<string, unknown> {
  const base = (pub && typeof pub === 'object' ? pub : {}) as Record<
    string,
    unknown
  >;
  return {
    ...base,
    ordemJogadores: base.ordemJogadores ?? [],
    idsPorAntiguidade: base.idsPorAntiguidade ?? [],
    jogadoresQueViram: base.jogadoresQueViram ?? [],
    pistas: base.pistas ?? [],
    votos: base.votos ?? {},
    eliminadosIds: base.eliminadosIds ?? [],
    mrWhiteIdsRevelados: base.mrWhiteIdsRevelados ?? [],
    prazoTurnoEm: base.prazoTurnoEm ?? null,
    duracaoTurnoSegundos: base.duracaoTurnoSegundos ?? 60,
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
