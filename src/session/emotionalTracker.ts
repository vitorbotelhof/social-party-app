/**
 * Emotional Tracker — detecta e atualiza a temperatura da sessão.
 *
 * Regras de temperatura:
 *   frio    → início, nenhum jogo completo ainda
 *   morno   → primeiro jogo completo
 *   quente  → 2+ jogos completos OU 2+ momentos caóticos
 *   colapso → 4+ momentos caóticos OU temperatura === 'quente' + 3+ momentos caóticos
 *
 * Nunca retroage: quente não volta para morno.
 */

import {
  getSessaoAtual,
  atualizarTemperatura,
  getJogosCompletos,
  contarMomentos,
} from './sessionStore';
import type { TemperaturaEmocional } from './types';

// ─── Tipos de momentos que indicam caos ──────────────────────────────────────

const MOMENTOS_CAOS = new Set([
  'unanimidade',
  'paranoia_total',
  'colapso_npl',
  'virada',
] as const);

// ─── Cálculo ──────────────────────────────────────────────────────────────────

function calcularNovaTemperatura(): TemperaturaEmocional {
  const sessao = getSessaoAtual();
  if (!sessao) return 'frio';

  const jogosCompletos = getJogosCompletos().length;
  const momentosCaos = [...MOMENTOS_CAOS].reduce(
    (acc, tipo) => acc + contarMomentos(tipo),
    0,
  );

  const atual = sessao.temperatura;

  // Nunca retrocede
  const ordem: TemperaturaEmocional[] = ['frio', 'morno', 'quente', 'colapso'];
  const indiceAtual = ordem.indexOf(atual);

  let nova: TemperaturaEmocional = atual;

  if (momentosCaos >= 4) {
    nova = 'colapso';
  } else if (atual === 'quente' && momentosCaos >= 3) {
    nova = 'colapso';
  } else if (jogosCompletos >= 2 || momentosCaos >= 2) {
    nova = 'quente';
  } else if (jogosCompletos >= 1) {
    nova = 'morno';
  }

  // Garante que não retroage
  const indiceNova = ordem.indexOf(nova);
  return indiceNova > indiceAtual ? nova : atual;
}

// ─── API pública ──────────────────────────────────────────────────────────────

/**
 * Recalcula e aplica a temperatura emocional da sessão.
 * Chamar após cada jogo finalizado ou momento registrado.
 */
export function atualizarEstadoEmocional(): void {
  const nova = calcularNovaTemperatura();
  atualizarTemperatura(nova);
}

/**
 * Retorna a temperatura atual sem modificar o estado.
 */
export function calcularTemperatura(): TemperaturaEmocional {
  return calcularNovaTemperatura();
}
