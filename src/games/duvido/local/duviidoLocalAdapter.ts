/**
 * DUVIDO — LOCAL ADAPTER
 *
 * Traduz os callbacks do engine local em sinais para o SessionStore.
 *
 * Uso:
 *   const callbacks = criarCallbacksDuvido();
 *   const { estado, despachar, ... } = useDuviidoLocal({ ..., callbacks });
 *
 * Separação de responsabilidades:
 *   localEngine.ts        — gera os callbacks via DuvidoCallbacks
 *   duviidoLocalAdapter.ts — decide o que cada callback significa para a sessão
 *   sessionStore.ts        — armazena e notifica ouvintes
 *
 * Convenção de nomes:
 *   "duviido" (duplo i) mantém consistência com o comentário em types.ts.
 */

import type { PlayerId } from '@/engine/types';
import {
  getSessaoAtual,
  registrarJogoFinalizado,
  registrarMomento,
  atualizarJogadorSessao,
} from '@/session/sessionStore';
import { atualizarEstadoEmocional } from '@/session/emotionalTracker';
import { reavaliarGrupo } from '@/session/groupProfile';
import { detectarVibe } from '@/session/vibeEngine';
import type {
  DuvidoCallbacks,
  DuvidaResolvidaParams,
  RankingFinalizadoParams,
  JogoFinalizadoParams,
} from '../types';
import type { DuvidoSessaoStats } from '@/session/types';

// ─── Constante de ID do jogo ──────────────────────────────────────────────────

const JOGO_ID = 'duvido' as const;

// ─── Helpers internos ─────────────────────────────────────────────────────────

/**
 * Incrementa um campo numérico de um jogador na sessão.
 * Safe: ignora silenciosamente se a sessão não estiver ativa.
 */
function incrementarJogador(
  jogadorId: PlayerId,
  campo: 'dubidasCertasDuvido' | 'rankingsVencidosDuvido',
  delta = 1,
): void {
  const sessao = getSessaoAtual();
  if (!sessao) return;

  const atual = sessao.jogadores.find((j) => j.id === jogadorId);
  if (!atual) return;

  atualizarJogadorSessao(jogadorId, {
    [campo]: (atual[campo] ?? 0) + delta,
  });
}

// ─── Processadores individuais ────────────────────────────────────────────────

/**
 * Processa o resultado de cada confronto "duvido".
 *
 * Registra:
 *   - Momento 'leitura_perfeita_duvido' → duvidou e estava certo
 *   - Momento 'aposta_errada_duvido'    → duvidou de item válido
 *   - Stat dubidasCertasDuvido no jogador que leu corretamente
 */
function processarDuvidaResolvida(params: DuvidaResolvidaParams): void {
  const sessao = getSessaoAtual();
  if (!sessao) return;

  const { rankingId, rankingAtual, respondeuId, duvidouId, item, tipoMomento } =
    params;

  if (tipoMomento === 'leitura_perfeita') {
    // Duvidou de item inválido → leu o bluff
    incrementarJogador(duvidouId, 'dubidasCertasDuvido');

    registrarMomento({
      tipo: 'leitura_perfeita_duvido',
      jogoId: JOGO_ID,
      rodada: rankingAtual + 1,
      jogadoresIds: [duvidouId, respondeuId],
      dados: { rankingId, item, eliminadoId: params.eliminadoId },
    });
  } else {
    // tipoMomento === 'aposta_errada' — duvidou de item válido
    registrarMomento({
      tipo: 'aposta_errada_duvido',
      jogoId: JOGO_ID,
      rodada: rankingAtual + 1,
      jogadoresIds: [duvidouId, respondeuId],
      dados: { rankingId, item, eliminadoId: params.eliminadoId },
    });
  }
}

/**
 * Processa o final de cada ranking individual.
 *
 * Registra:
 *   - Stat rankingsVencidosDuvido no vencedor
 *
 * Não chama registrarJogoFinalizado — isso ocorre apenas ao fim da sessão
 * (onJogoFinalizado), seguindo o padrão dos outros adapters.
 */
function processarRankingFinalizado(params: RankingFinalizadoParams): void {
  if (!params.vencedorId) return;

  incrementarJogador(params.vencedorId, 'rankingsVencidosDuvido');
}

/**
 * Processa o fim da sessão completa de Duvido.
 *
 * Registra:
 *   - Stats consolidadas via registrarJogoFinalizado
 *   - Atualiza temperatura emocional
 *   - Reavalia perfil de grupo
 *   - Detecta vibe
 */
function processarJogoFinalizado(params: JogoFinalizadoParams): void {
  const stats: DuvidoSessaoStats = {
    totalRankings: params.totalRankings,
    totalDuvidas: params.totalDuvidas,
    vencedoresPorRanking: _extrairVencedoresPorRanking(params),
    melhorLeitorId: params.melhorLeitorId,
    maiorBlufferSemPunicaoId: params.maiorBlufferSemPunicaoId,
    temperatura: params.temperatura,
  };

  registrarJogoFinalizado(JOGO_ID, { duvido: stats });

  atualizarEstadoEmocional();
  reavaliarGrupo();
  detectarVibe();
}

/**
 * Extrai a lista ordenada de vencedores por ranking a partir dos dados da sessão.
 *
 * Como `JogoFinalizadoParams` não carrega o histórico diretamente,
 * extraímos os IDs com mais vitórias em ordem decrescente como proxy.
 * Para o histórico exato por ranking, usar `estado.historicoPorRanking` na tela.
 */
function _extrairVencedoresPorRanking(
  params: JogoFinalizadoParams,
): PlayerId[] {
  // Ordena jogadores por número de rankings vencidos (desc) como representação resumida
  return Object.entries(params.rankingsVencidosPorJogador)
    .sort(([, a], [, b]) => b - a)
    .map(([id]) => id);
}

// ─── API PÚBLICA ──────────────────────────────────────────────────────────────

/**
 * Cria o objeto DuvidoCallbacks pré-conectado ao SessionStore.
 *
 * Uso canônico:
 * ```tsx
 * const callbacks = useMemo(() => criarCallbacksDuvido(), []);
 * const { estado, despachar } = useDuviidoLocal({ configuracao, rankingsSelecionados, callbacks });
 * ```
 *
 * Os callbacks são funções estáveis — não precisam ser recriados a cada render.
 * Use `useMemo` ou defina fora do componente se preferir.
 */
export function criarCallbacksDuvido(): DuvidoCallbacks {
  return {
    // Sem ação de sessão para item aceito — baixa intensidade, não registra momento.
    onItemAceito: undefined,

    onDuvidaResolvida: (params) => processarDuvidaResolvida(params),

    onRankingFinalizado: (params) => processarRankingFinalizado(params),

    onJogoFinalizado: (params) => processarJogoFinalizado(params),
  };
}
