/**
 * Emotional Tracker — detecta e atualiza a temperatura da sessão.
 *
 * Regras de temperatura:
 *   frio    → início, nenhum jogo completo ainda
 *   morno   → primeiro jogo completo
 *   quente  → 2+ jogos completos OU peso de caos ≥ 2
 *   colapso → peso de caos ≥ 5 OU temperatura === 'quente' + peso ≥ 4
 *
 * Nunca retroage: quente não volta para morno.
 *
 * Calibração Inquisição:
 *   - Momentos de Inquisição têm peso maior (corruption = 2, inversão = 2)
 *   - Grupo paranoico tem thresholds reduzidos em 1 (evolui mais rápido)
 */

import {
  getSessaoAtual,
  atualizarTemperatura,
  getJogosCompletos,
  contarMomentos,
} from './sessionStore';
import type { TemperaturaEmocional, TipoMomento } from './types';

// ─── Debug hook (apenas __DEV__) ──────────────────────────────────────────────
//
// Permite que o DebugPanelInquisicao observe mudanças de temperatura
// sem acoplar o módulo de sessão ao código de debug.

type DebugTemperaturaFn = (temp: TemperaturaEmocional, momento: TipoMomento | null) => void;
let _debugCallback: DebugTemperaturaFn | null = null;

/**
 * Registra callback que dispara após cada mudança de temperatura.
 * No-op em produção — guard interno garante zero overhead.
 */
export function __dev__setTemperaturaCallback(fn: DebugTemperaturaFn | null): void {
  if (__DEV__) _debugCallback = fn;
}

// ─── Pesos de momentos caóticos ───────────────────────────────────────────────
//
// Peso padrão = 1. Momentos de Inquisição são mais impactantes emocionalmente.
// inversao (corrompidos vencem) → peso 2: aquece fortemente
// corrupcao_revelada            → peso 2: cada corrupção aumenta temperatura
// colapso_inquisicao            → peso 2: grupo eliminou inocente — peso alto
// paranoia_maxima               → peso 1: empate caótico — mesmo nível dos outros

const PESO_MOMENTOS_CAOS: Partial<Record<TipoMomento, number>> = {
  unanimidade: 1,
  paranoia_total: 1,
  colapso_npl: 1,
  virada: 1,
  // Inquisição
  corrupcao_revelada: 2,
  inversao: 2,
  paranoia_maxima: 1,
  colapso_inquisicao: 2,
};

// ─── Cálculo de peso total ────────────────────────────────────────────────────

function calcularPesoCaos(): number {
  return (Object.entries(PESO_MOMENTOS_CAOS) as [TipoMomento, number][]).reduce(
    (acc, [tipo, peso]) => acc + contarMomentos(tipo) * peso,
    0,
  );
}

// ─── Cálculo ──────────────────────────────────────────────────────────────────

function calcularNovaTemperatura(): TemperaturaEmocional {
  const sessao = getSessaoAtual();
  if (!sessao) return 'frio';

  const jogosCompletos = getJogosCompletos().length;
  const pesoCaos = calcularPesoCaos();
  const atual = sessao.temperatura;

  // Grupo paranoico evolui mais rápido — thresholds reduzidos em 1
  const paranoico = sessao.grupoIdentidade === 'paranoico';
  const limiarQuente  = paranoico ? 1 : 2;
  const limiarColapso = paranoico ? 4 : 5;
  const limiarColapsoDeCima = paranoico ? 3 : 4;

  // Nunca retrocede
  const ordem: TemperaturaEmocional[] = ['frio', 'morno', 'quente', 'colapso'];
  const indiceAtual = ordem.indexOf(atual);

  let nova: TemperaturaEmocional = atual;

  if (pesoCaos >= limiarColapso) {
    nova = 'colapso';
  } else if (atual === 'quente' && pesoCaos >= limiarColapsoDeCima) {
    nova = 'colapso';
  } else if (jogosCompletos >= 2 || pesoCaos >= limiarQuente) {
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
export function atualizarEstadoEmocional(momento?: TipoMomento): void {
  const anterior = getSessaoAtual()?.temperatura ?? 'frio';
  const nova = calcularNovaTemperatura();
  atualizarTemperatura(nova);

  // Notificar debug panel quando temperatura muda
  if (__DEV__ && _debugCallback && nova !== anterior) {
    _debugCallback(nova, momento ?? null);
  }
}

/**
 * Retorna a temperatura atual sem modificar o estado.
 */
export function calcularTemperatura(): TemperaturaEmocional {
  return calcularNovaTemperatura();
}
