// ─── Verdade ou Desafio — Seleção de Cartas ──────────────────────────────────
//
// Seleciona a carta certa do tipo escolhido pelo jogador,
// respeitando filtros de categoria, intensidade, +18 e progressão emocional.

import { CARTAS_VD, pesoIntensidade } from './cards';
import type {
  CartaVD,
  CategoriaVDId,
  FaseVD,
  IntensidadeVD,
  TipoCartaVD,
} from './types';

function calcularFase(totalTurnos: number): FaseVD {
  if (totalTurnos < 3) return 'aquecimento';
  if (totalTurnos < 8) return 'subida';
  if (totalTurnos < 15) return 'pico';
  return 'release';
}

function pesoMaxPorFase(fase: FaseVD): number {
  const pesos: Record<FaseVD, number> = {
    aquecimento: 1,
    subida: 2,
    pico: 3,
    release: 4,
  };
  return pesos[fase];
}

export function selecionarCartaVD(
  tipo: TipoCartaVD,
  cartasUsadas: string[],
  categorias: CategoriaVDId[] | 'todas',
  intensidade: IntensidadeVD | 'todas',
  incluirMais18: boolean,
  totalTurnos: number,
): CartaVD | null {
  const fase = calcularFase(totalTurnos);
  const pesoMax = pesoMaxPorFase(fase);
  const usadas = new Set(cartasUsadas);
  const categoriasSet = categorias === 'todas' ? null : new Set(categorias);

  // Pool com filtros completos (incluindo fase)
  const poolComFase = CARTAS_VD.filter((c) => {
    if (c.tipo !== tipo) return false;
    if (usadas.has(c.id)) return false;
    if (categoriasSet && !categoriasSet.has(c.categoria)) return false;
    if (!incluirMais18 && c.mais18) return false;
    if (intensidade !== 'todas' && c.intensidade !== intensidade) return false;
    if (pesoIntensidade(c.intensidade) > pesoMax) return false;
    return true;
  });

  // Prefere cartas da fase exata
  const dafase = poolComFase.filter((c) => c.fase === fase);
  const pool = dafase.length > 0 ? dafase : poolComFase;

  if (pool.length > 0) {
    return pool[Math.floor(Math.random() * pool.length)]!;
  }

  // Fallback: sem restrição de fase
  const semFase = CARTAS_VD.filter((c) => {
    if (c.tipo !== tipo) return false;
    if (usadas.has(c.id)) return false;
    if (categoriasSet && !categoriasSet.has(c.categoria)) return false;
    if (!incluirMais18 && c.mais18) return false;
    if (intensidade !== 'todas' && c.intensidade !== intensidade) return false;
    return true;
  });

  if (semFase.length > 0) {
    return semFase[Math.floor(Math.random() * semFase.length)]!;
  }

  // Deck esgotado: reinicia (exceto última carta)
  const ultimaUsada = cartasUsadas.at(-1);
  const reiniciado = CARTAS_VD.filter((c) => {
    if (c.tipo !== tipo) return false;
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

export { calcularFase };
