/**
 * Sugestão de próximo jogo — baseada na energia real da sessão.
 *
 * Lógica emocional, não algoritmo de recomendação.
 * O app lê o grupo e sugere: mais tensão, mais caos ou mudança de dinâmica.
 *
 * Regras:
 *   frio    → sem sugestão (primeiro jogo acabou de começar)
 *   morno   → sugerir jogo diferente do atual (variar dinâmica)
 *   quente  → manter ou subir intensidade
 *   colapso → baixar (most-likely é mais leve que mrwhite/npl)
 */

import { getSessaoAtual } from './sessionStore';
import { JOGOS } from '@/games/gameRegistry';
import type { DefinicaoJogo } from '@/games/gameRegistry';

/** Rotação simples: dado o jogo atual, sugere o próximo da lista local disponível. */
function proximoNaRotacao(jogoAtualId: string): string {
  const ordem = ['mrwhite', 'most-likely-to', 'na-ponta-da-lingua'];
  const idx = ordem.indexOf(jogoAtualId);
  return ordem[(idx + 1) % ordem.length]!;
}

/**
 * Retorna um jogo sugerido baseado no estado emocional da sessão.
 * Retorna null se não há sessão, temperatura 'frio' ou nenhum jogo adequado.
 */
export function sugerirProximoJogo(jogoAtualId: string): DefinicaoJogo | null {
  const sessao = getSessaoAtual();
  if (!sessao || sessao.temperatura === 'frio') return null;

  let jogoSugeridoId: string;

  switch (sessao.temperatura) {
    case 'morno':
      // Variar dinâmica: trocar de jogo
      jogoSugeridoId = proximoNaRotacao(jogoAtualId);
      break;

    case 'quente':
      // Manter ou subir intensidade
      if (jogoAtualId === 'most-likely-to') {
        // Subir: ir pro mais intenso
        jogoSugeridoId = sessao.grupoIdentidade === 'paranoico'
          ? 'mrwhite'
          : 'na-ponta-da-lingua';
      } else {
        // Manter energia mas trocar dinâmica
        jogoSugeridoId = jogoAtualId === 'mrwhite'
          ? 'na-ponta-da-lingua'
          : 'mrwhite';
      }
      break;

    case 'colapso':
      // Baixar intensidade levemente — mudar dinâmica sem resetar energia
      jogoSugeridoId = 'most-likely-to';
      break;

    default:
      return null;
  }

  // Não sugerir o mesmo jogo de novo
  if (jogoSugeridoId === jogoAtualId) {
    jogoSugeridoId = proximoNaRotacao(jogoAtualId);
  }

  return JOGOS.find((j) => j.id === jogoSugeridoId && j.disponivel && j.supportsLocal) ?? null;
}
