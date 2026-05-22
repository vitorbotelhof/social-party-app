/**
 * Sugestão de próximo jogo — baseada na energia real da sessão.
 *
 * Lógica emocional, não algoritmo de recomendação.
 * O app lê o grupo e sugere: mais tensão, mais caos ou mudança de dinâmica.
 *
 * Regras de temperatura:
 *   frio    → sem sugestão (primeiro jogo acabou de começar)
 *   morno   → variar dinâmica — trocar de jogo
 *   quente  → manter ou subir intensidade
 *   colapso → baixar (most-likely é mais leve)
 *
 * Regras emocionais (prioridade sobre temperatura):
 *   grupo paranoico          → sugerir Inquisição (tensão social máxima)
 *   após Inquisição          → sugerir Most Likely To (cooldown emocional)
 *   após Inquisição          → nunca sugerir Mr White (mesma dinâmica de tensão)
 */

import { getSessaoAtual } from './sessionStore';
import { JOGOS } from '@/games/gameRegistry';
import type { DefinicaoJogo } from '@/games/gameRegistry';

// ─── Rotação base ─────────────────────────────────────────────────────────────

/**
 * Ordem de rotação padrão — usada como fallback quando nenhuma regra emocional
 * se aplica. Alterna entre tipos de dinâmica para variar a sessão.
 */
const ROTACAO = [
  'mrwhite',
  'most-likely-to',
  'faz-ai',
  'na-ponta-da-lingua',
  'inquisicao',
] as const;

function proximoNaRotacao(jogoAtualId: string): string {
  const idx = ROTACAO.indexOf(jogoAtualId as (typeof ROTACAO)[number]);
  return ROTACAO[(idx + 1) % ROTACAO.length]!;
}

/** Resolve o ID para uma DefinicaoJogo disponível. */
function resolverJogo(id: string): DefinicaoJogo | null {
  return JOGOS.find((j) => j.id === id && j.disponivel) ?? null;
}

// ─── Engine ───────────────────────────────────────────────────────────────────

/**
 * Retorna um jogo sugerido baseado no estado emocional da sessão.
 *
 * Nota: não filtra por supportsLocal — a sugestão é informativa e pode aparecer
 * em contextos realtime. O componente que exibe a sugestão é responsável pela
 * ação de navegação, não esta função.
 *
 * Retorna null se não há sessão, temperatura 'frio' ou nenhum jogo adequado.
 */
export function sugerirProximoJogo(jogoAtualId: string): DefinicaoJogo | null {
  const sessao = getSessaoAtual();
  if (!sessao || sessao.temperatura === 'frio') return null;

  // ── Regras emocionais (maior prioridade) ────────────────────────────────────

  // Grupo paranoico → Inquisição: tensão social máxima, dedução de identidades.
  // Única dinâmica que converte a paranoia do grupo em mecânica de jogo.
  if (sessao.grupoIdentidade === 'paranoico' && jogoAtualId !== 'inquisicao') {
    return resolverJogo('inquisicao');
  }

  // Após Inquisição → Most Likely To: cooldown emocional obrigatório.
  // Inquisição deixa o grupo pesado. MLT reorienta para leveza sem perder energia.
  // Nunca sugerir Mr White logo depois: mesma categoria (tensao_misterio), não varia.
  if (jogoAtualId === 'inquisicao') {
    return resolverJogo('most-likely-to');
  }

  // Após Faz Aí → se o grupo ficou físico demais, troca para leitura social.
  // Mantém energia sem exigir que todo mundo continue performando.
  if (jogoAtualId === 'faz-ai') {
    if (sessao.grupoIdentidade === 'caotico')
      return resolverJogo('most-likely-to');
    if (sessao.temperatura === 'colapso')
      return resolverJogo('voce-me-conhece');
    return resolverJogo('na-ponta-da-lingua');
  }

  // Após Mr White e grupo destrutivo/caótico → considerar Inquisição para subir tensão.
  if (
    jogoAtualId === 'mrwhite' &&
    (sessao.grupoIdentidade === 'destrutivo' ||
      sessao.grupoIdentidade === 'caotico') &&
    sessao.temperatura === 'quente'
  ) {
    return resolverJogo('inquisicao');
  }

  // ── Regras de temperatura ───────────────────────────────────────────────────

  let jogoSugeridoId: string;

  switch (sessao.temperatura) {
    case 'morno':
      // Variar dinâmica: trocar de jogo sem subir muito a aposta emocional.
      jogoSugeridoId = proximoNaRotacao(jogoAtualId);
      break;

    case 'quente':
      if (jogoAtualId === 'most-likely-to') {
        // Subir de MLT: ir para algo com mais tensão de identidade.
        if (sessao.grupoIdentidade === 'paranoico') {
          jogoSugeridoId = 'inquisicao';
        } else if (sessao.grupoIdentidade === 'competitivo') {
          jogoSugeridoId = 'mrwhite';
        } else {
          jogoSugeridoId = 'faz-ai';
        }
      } else if (jogoAtualId === 'na-ponta-da-lingua') {
        // De NPL: muda a dinâmica para social/dedução.
        jogoSugeridoId = 'mrwhite';
      } else {
        // De Mr White: manter intensidade, variar tipo.
        jogoSugeridoId = 'na-ponta-da-lingua';
      }
      break;

    case 'colapso':
      // Baixar intensidade — mudar dinâmica sem resetar energia.
      // MLT é mais leve e social, bom para grupos no limite.
      jogoSugeridoId = 'most-likely-to';
      break;

    default:
      return null;
  }

  // Não sugerir o mesmo jogo de novo
  if (jogoSugeridoId === jogoAtualId) {
    jogoSugeridoId = proximoNaRotacao(jogoAtualId);
  }

  return resolverJogo(jogoSugeridoId);
}
