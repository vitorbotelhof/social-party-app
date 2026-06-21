/**
 * progressoShikaku — persistência local do progresso do jogador.
 *
 * Guarda, por puzzle: se foi concluído, o melhor tempo e as melhores estrelas.
 * Mantém um cache em memória para leitura síncrona pela UI após o carregamento.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import type { DificuldadeSolo } from '@/games/solo/types';

const CHAVE = '@entre-nos/solo/shikaku/progresso';

export interface ProgressoPuzzle {
  concluido: boolean;
  /** Melhor tempo em segundos. */
  melhorTempo: number;
  /** Melhor pontuação em estrelas (1–3). */
  melhoresEstrelas: number;
}

export type MapaProgressoShikaku = Record<string, ProgressoPuzzle>;

let cache: MapaProgressoShikaku = {};

// ─── Carregamento ─────────────────────────────────────────────────────────────

export async function carregarProgressoShikaku(): Promise<MapaProgressoShikaku> {
  const raw = await AsyncStorage.getItem(CHAVE);
  if (!raw) {
    cache = {};
    return cache;
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      cache = parsed as MapaProgressoShikaku;
      return cache;
    }
  } catch {
    // dados corrompidos — começa do zero
  }
  cache = {};
  return cache;
}

/** Leitura síncrona do cache (válida após carregarProgressoShikaku). */
export function obterProgressoCache(): MapaProgressoShikaku {
  return cache;
}

// ─── Gravação ─────────────────────────────────────────────────────────────────

/**
 * Registra a conclusão de um puzzle. Mantém o melhor tempo e as melhores
 * estrelas caso o jogador já tenha resolvido antes.
 */
export async function registrarConclusao(
  puzzleId: string,
  tempoSegundos: number,
  estrelas: number,
): Promise<MapaProgressoShikaku> {
  const anterior = cache[puzzleId];
  const registro: ProgressoPuzzle = {
    concluido: true,
    melhorTempo: anterior?.concluido
      ? Math.min(anterior.melhorTempo, tempoSegundos)
      : tempoSegundos,
    melhoresEstrelas: Math.max(anterior?.melhoresEstrelas ?? 0, estrelas),
  };
  cache = { ...cache, [puzzleId]: registro };
  await AsyncStorage.setItem(CHAVE, JSON.stringify(cache));
  return cache;
}

export async function resetarProgressoShikaku(): Promise<void> {
  cache = {};
  await AsyncStorage.removeItem(CHAVE);
}

// ─── Estrelas ─────────────────────────────────────────────────────────────────

/** Tempo (s) para ganhar 3 estrelas — sem usar dicas. */
const TEMPO_OURO: Record<DificuldadeSolo, number> = {
  facil: 60,
  medio: 150,
  dificil: 300,
};

/** Tempo (s) para ganhar ao menos 2 estrelas. */
const TEMPO_PRATA: Record<DificuldadeSolo, number> = {
  facil: 150,
  medio: 360,
  dificil: 600,
};

/**
 * Calcula a pontuação em estrelas:
 * 3 — rápido e sem dicas; 2 — tempo razoável; 1 — concluído.
 */
export function calcularEstrelas(
  dificuldade: DificuldadeSolo,
  tempoSegundos: number,
  dicasUsadas: number,
): number {
  if (dicasUsadas === 0 && tempoSegundos <= TEMPO_OURO[dificuldade]) return 3;
  if (tempoSegundos <= TEMPO_PRATA[dificuldade]) return 2;
  return 1;
}
