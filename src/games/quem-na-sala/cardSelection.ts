// ─── Quem na Sala? — Seleção de Cartas ───────────────────────────────────────

import { CARTAS_QNS, pesoIntensidade } from './cards';
import type {
  CartaQNS,
  CategoriaQNSId,
  FaseQNS,
  IntensidadeQNS,
} from './types';

export function calcularFase(totalRodadas: number): FaseQNS {
  if (totalRodadas < 3) return 'aquecimento';
  if (totalRodadas < 7) return 'subida';
  if (totalRodadas < 10) return 'pico';
  return 'release';
}

function pesoMaxPorFase(fase: FaseQNS): number {
  const pesos: Record<FaseQNS, number> = {
    aquecimento: 1,
    subida: 2,
    pico: 3,
    release: 4,
  };
  return pesos[fase];
}

export function selecionarCartaQNS(
  cartasUsadas: string[],
  categorias: CategoriaQNSId[] | 'todas',
  intensidade: IntensidadeQNS | 'todas',
  incluirMais18: boolean,
  totalRodadas: number,
): CartaQNS | null {
  const fase = calcularFase(totalRodadas);
  const pesoMax = pesoMaxPorFase(fase);
  const usadas = new Set(cartasUsadas);
  const categoriasSet = categorias === 'todas' ? null : new Set(categorias);

  const poolFase = CARTAS_QNS.filter((c) => {
    if (usadas.has(c.id)) return false;
    if (categoriasSet && !categoriasSet.has(c.categoria)) return false;
    if (!incluirMais18 && c.mais18) return false;
    if (intensidade !== 'todas' && c.intensidade !== intensidade) return false;
    if (pesoIntensidade(c.intensidade) > pesoMax) return false;
    return true;
  });

  const dafase = poolFase.filter((c) => c.fase === fase);
  const pool = dafase.length > 0 ? dafase : poolFase;

  if (pool.length > 0) {
    return pool[Math.floor(Math.random() * pool.length)]!;
  }

  // Fallback sem restrição de fase
  const semFase = CARTAS_QNS.filter((c) => {
    if (usadas.has(c.id)) return false;
    if (categoriasSet && !categoriasSet.has(c.categoria)) return false;
    if (!incluirMais18 && c.mais18) return false;
    if (intensidade !== 'todas' && c.intensidade !== intensidade) return false;
    return true;
  });

  if (semFase.length > 0) {
    return semFase[Math.floor(Math.random() * semFase.length)]!;
  }

  // Reinicia deck
  const ultimaUsada = cartasUsadas.at(-1);
  const reiniciado = CARTAS_QNS.filter((c) => {
    if (c.id === ultimaUsada) return false;
    if (categoriasSet && !categoriasSet.has(c.categoria)) return false;
    if (!incluirMais18 && c.mais18) return false;
    if (intensidade !== 'todas' && c.intensidade !== intensidade) return false;
    return true;
  });

  return reiniciado.length > 0
    ? reiniciado[Math.floor(Math.random() * reiniciado.length)]!
    : null;
}
