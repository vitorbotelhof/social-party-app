// ─── De 0 a 10 — Leitura Coletiva ───────────────────────────────────────────
//
// O resultado precisa dizer o que aconteceu entre as pessoas, não apenas
// expor números. Esta classificação alimenta o reveal e momentos de sessão.

import type {
  LeituraColetivaDe0a10,
  NotaDe0a10,
  PalpiteJogador,
} from './types';

export interface AnaliseLeituraColetiva {
  leituraColetiva: LeituraColetivaDe0a10;
  acertosExatos: number;
  acertosProximos: number;
}

export function analisarLeituraColetiva(
  notaReal: NotaDe0a10,
  palpites: readonly PalpiteJogador[],
  divergencia: number,
): AnaliseLeituraColetiva {
  const acertosExatos = palpites.filter(
    (palpite) => palpite.nota === notaReal,
  ).length;
  const acertosProximos = palpites.filter(
    (palpite) => Math.abs(palpite.nota - notaReal) <= 1,
  ).length;
  const todos = palpites.length;

  let leituraColetiva: LeituraColetivaDe0a10;
  if (todos > 0 && acertosExatos === todos) {
    leituraColetiva = 'cravaram';
  } else if (todos > 0 && acertosProximos === todos) {
    leituraColetiva = 'te_leram';
  } else if (divergencia >= 4) {
    leituraColetiva = 'divididos';
  } else if (acertosProximos === 0) {
    leituraColetiva = 'nao_te_leram';
  } else if (acertosProximos >= Math.ceil(todos / 2)) {
    leituraColetiva = 'quase';
  } else {
    leituraColetiva = 'nao_te_leram';
  }

  return { leituraColetiva, acertosExatos, acertosProximos };
}
