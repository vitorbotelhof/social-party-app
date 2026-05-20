/**
 * Vibe Engine — detecta a vibe da sessão a partir dos padrões emergentes.
 *
 * A vibe detectada é diferente da vibe selecionada pelo grupo na home.
 * É inferida pelo comportamento real durante os jogos.
 *
 * Mapeamento de jogos por vibe:
 *   revelacao   → Mr White, Na Ponta da Língua
 *   julgamento  → Most Likely To
 *   caos        → todos (quando temperatura = quente/colapso)
 *   cumplicidade → unanimidades altas
 *   pressao     → colapsos NPL, paranoia
 *   competicao  → clutches, sobreviventes
 *   intimidade  → grupo íntimo, pouca paranoia
 */

import {
  getSessaoAtual,
  contarMomentos,
  getJogosCompletos,
  atualizarVibeDetectada,
} from './sessionStore';
import type { VibeId } from './types';
import type { CategoriaEmocional } from '@/games/gameRegistry';

// ─── Mapa de jogos para vibe ──────────────────────────────────────────────────

const JOGO_POR_VIBE: Record<string, CategoriaEmocional> = {
  'mr-white': 'tensao_misterio',
  'most-likely-to': 'votacao_exposicao',
  'na-ponta-da-lingua': 'festa_barulho',
};

// ─── Pontuação de vibe ────────────────────────────────────────────────────────

function pontuarVibes(): Map<CategoriaEmocional, number> {
  const sessao = getSessaoAtual();
  if (!sessao) return new Map();

  const pontos = new Map<CategoriaEmocional, number>();

  const add = (vibe: CategoriaEmocional, n: number) => {
    pontos.set(vibe, (pontos.get(vibe) ?? 0) + n);
  };

  // Sinais de comportamento
  const unanimidades = contarMomentos('unanimidade');
  const clutches = contarMomentos('clutch');
  const paranoia = contarMomentos('paranoia_total');
  const colapsos = contarMomentos('colapso_npl');
  const sobreviventes = contarMomentos('sobrevivente');
  const viradas = contarMomentos('virada');

  // Unanimidades → votação_exposicao / revelacoes_caos
  if (unanimidades >= 2) add('votacao_exposicao', unanimidades * 2);
  if (unanimidades >= 3) add('revelacoes_caos', unanimidades);

  // Clutches e sobreviventes → tensao_misterio
  if (clutches >= 1) add('tensao_misterio', clutches * 3);
  if (sobreviventes >= 2) add('tensao_misterio', sobreviventes);

  // Paranoia → revelacoes_caos / quem_voces_sao
  if (paranoia >= 2) add('revelacoes_caos', paranoia * 2);
  if (paranoia >= 1) add('quem_voces_sao', paranoia);

  // Colapsos → festa_barulho
  if (colapsos >= 2) add('festa_barulho', colapsos * 2);

  // Viradas → revelacoes_caos / tensao_misterio
  if (viradas >= 1) {
    add('revelacoes_caos', viradas);
    add('tensao_misterio', viradas);
  }

  // Temperatura geral → revelacoes_caos
  if (sessao.temperatura === 'quente') add('revelacoes_caos', 2);
  if (sessao.temperatura === 'colapso') add('revelacoes_caos', 5);

  // Jogos jogados → peso pela vibe do jogo
  const jogosCompletos = getJogosCompletos();
  for (const jogo of jogosCompletos) {
    const vibeDojogo = JOGO_POR_VIBE[jogo.jogoId];
    if (vibeDojogo) add(vibeDojogo, 1);
  }

  // Grupo íntimo → casal_intimidade / conversa_profunda
  if (sessao.grupoIdentidade === 'intimo') {
    add('casal_intimidade', 2);
    add('conversa_profunda', 1);
  }
  if (sessao.grupoIdentidade === 'competitivo') add('revelacoes_caos', 1);
  if (sessao.grupoIdentidade === 'destrutivo') add('revelacoes_caos', 3);

  return pontos;
}

// ─── Detecção ─────────────────────────────────────────────────────────────────

function detectar(): VibeId | null {
  const sessao = getSessaoAtual();
  if (!sessao) return null;

  const jogosCompletos = getJogosCompletos().length;
  if (jogosCompletos === 0) return null;

  const pontos = pontuarVibes();
  if (pontos.size === 0) return null;

  let melhor: CategoriaEmocional | null = null;
  let melhorPontos = 0;

  for (const [vibe, pts] of pontos) {
    if (pts > melhorPontos) {
      melhor = vibe;
      melhorPontos = pts;
    }
  }

  // Requer pontuação mínima para declarar
  if (melhorPontos < 2) return null;

  return melhor;
}

// ─── API pública ──────────────────────────────────────────────────────────────

/**
 * Detecta e aplica a vibe emergente da sessão.
 * Chamar após cada jogo finalizado.
 */
export function detectarVibe(): void {
  const vibe = detectar();
  atualizarVibeDetectada(vibe);
}

/**
 * Retorna a vibe detectada sem modificar o estado.
 */
export function calcularVibe(): VibeId | null {
  return detectar();
}

/**
 * Retorna a vibe primária de um jogo pelo ID.
 */
export function getVibePorJogo(jogoId: string): CategoriaEmocional | null {
  return JOGO_POR_VIBE[jogoId] ?? null;
}
