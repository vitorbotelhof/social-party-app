/**
 * progressoCodigoSecreto — persistência local do progresso do jogador.
 *
 * Diferente do Shikaku (puzzles fixos), Código Secreto é procedural —
 * não há puzzleId. Guarda estatísticas agregadas por dificuldade.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import type { DificuldadeSolo } from '@/games/solo/types';

const CHAVE = '@entre-nos/solo/codigo-secreto/progresso';

export interface ProgressoDificuldadeCS {
  vitorias: number;
  derrotas: number;
  /** Menor número de tentativas usadas numa vitória. Null se nunca venceu. */
  melhorTentativas: number | null;
}

export type MapaProgressoCS = Record<DificuldadeSolo, ProgressoDificuldadeCS>;

const PADRAO: MapaProgressoCS = {
  facil:   { vitorias: 0, derrotas: 0, melhorTentativas: null },
  medio:   { vitorias: 0, derrotas: 0, melhorTentativas: null },
  dificil: { vitorias: 0, derrotas: 0, melhorTentativas: null },
};

let cache: MapaProgressoCS = { ...PADRAO };

// ─── Carregamento ─────────────────────────────────────────────────────────────

export async function carregarProgressoCS(): Promise<MapaProgressoCS> {
  const raw = await AsyncStorage.getItem(CHAVE);
  if (!raw) {
    cache = { ...PADRAO };
    return cache;
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      cache = { ...PADRAO, ...(parsed as MapaProgressoCS) };
      return cache;
    }
  } catch {
    // dados corrompidos — começa do zero
  }
  cache = { ...PADRAO };
  return cache;
}

/** Leitura síncrona do cache (válida após carregarProgressoCS). */
export function obterProgressoCacheCS(): MapaProgressoCS {
  return cache;
}

// ─── Gravação ─────────────────────────────────────────────────────────────────

export async function registrarResultadoCS(
  dificuldade: DificuldadeSolo,
  venceu: boolean,
  tentativasUsadas: number,
): Promise<MapaProgressoCS> {
  const anterior = cache[dificuldade];
  const registro: ProgressoDificuldadeCS = {
    vitorias: anterior.vitorias + (venceu ? 1 : 0),
    derrotas: anterior.derrotas + (venceu ? 0 : 1),
    melhorTentativas: venceu
      ? anterior.melhorTentativas === null
        ? tentativasUsadas
        : Math.min(anterior.melhorTentativas, tentativasUsadas)
      : anterior.melhorTentativas,
  };
  cache = { ...cache, [dificuldade]: registro };
  await AsyncStorage.setItem(CHAVE, JSON.stringify(cache));
  return cache;
}

export async function resetarProgressoCS(): Promise<void> {
  cache = { ...PADRAO };
  await AsyncStorage.removeItem(CHAVE);
}
