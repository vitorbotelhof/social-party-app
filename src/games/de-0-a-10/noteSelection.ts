// ─── De 0 a 10 — Seleção de Nota ─────────────────────────────────────────────
//
// Regras de seleção:
//   • Fase calibracao (rounds 0-1): pool [2, 3, 7, 8, 9] — âncoras claras
//   • Fase tensao (rounds 2-4): pool [1, 2, 3, 4, 6, 7, 8, 9] — sem o 5
//   • Fase pico (rounds 5+): pool [1-9] completo + rara chance de 0 ou 10
//   • 5 nunca aparece nas duas primeiras fases (difícil de representar)
//   • 0 e 10 são eventos raros (8% de chance) na fase pico
//   • Notas já usadas pelo jogador nas últimas 2 rodadas são evitadas
//   • Zona 4-7 tem peso 3x maior para maximizar ambiguidade e debate

import type { FaseDe0a10, NotaDe0a10 } from './types';

// Pools por fase (sem 0 e 10 — esses entram via mecanismo especial)
const POOL_CALIBRACAO: NotaDe0a10[] = [2, 3, 7, 8, 9];
const POOL_TENSAO: NotaDe0a10[] = [1, 2, 3, 4, 6, 7, 8, 9];
const POOL_PICO: NotaDe0a10[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];

// Peso de cada nota — zona 4-7 é 3x mais provável (máxima ambiguidade)
function pesoNota(nota: NotaDe0a10): number {
  if (nota >= 4 && nota <= 7) return 3;
  if (nota === 3 || nota === 8) return 2;
  return 1;
}

export function calcularFase(rodadasCompletas: number): FaseDe0a10 {
  if (rodadasCompletas < 2) return 'calibracao';
  if (rodadasCompletas < 5) return 'tensao';
  return 'pico';
}

export function selecionarNota(
  notasUsadasPeloJogador: NotaDe0a10[],
  rodadasCompletas: number,
): NotaDe0a10 {
  const fase = calcularFase(rodadasCompletas);

  // Notas especiais: 0 e 10 aparecem raramente na fase pico
  if (fase === 'pico' && Math.random() < 0.08) {
    return Math.random() < 0.5 ? 0 : 10;
  }

  const pool =
    fase === 'calibracao'
      ? POOL_CALIBRACAO
      : fase === 'tensao'
        ? POOL_TENSAO
        : POOL_PICO;

  // Evita repetir notas recentes do mesmo jogador (últimas 2 rodadas)
  const recentesSet = new Set(notasUsadasPeloJogador.slice(-2));
  const poolFiltrado = pool.filter((n) => !recentesSet.has(n));
  const poolFinal = poolFiltrado.length > 0 ? poolFiltrado : pool;

  // Seleção ponderada
  const pesos = poolFinal.map(pesoNota);
  const totalPeso = pesos.reduce((a, b) => a + b, 0);
  let aleatorio = Math.random() * totalPeso;

  for (let i = 0; i < poolFinal.length; i++) {
    aleatorio -= pesos[i]!;
    if (aleatorio <= 0) return poolFinal[i]!;
  }

  return poolFinal[poolFinal.length - 1]!;
}
