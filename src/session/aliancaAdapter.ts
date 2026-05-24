/**
 * Aliança Local Adapter — traduz missões e resultado em sinais de sessão.
 *
 * Chamar em: missão resolvida + jogo finalizado.
 */

import type {
  EquipeAliancaRejeitada,
  ResultadoAliancaFinalizado,
  RodadaAliancaResolvida,
} from '@/games/alianca';
import type { PlayerId } from '@/engine/types';
import { atualizarEstadoEmocional } from './emotionalTracker';
import { reavaliarGrupo } from './groupProfile';
import { detectarVibe } from './vibeEngine';
import {
  atualizarJogadorSessao,
  getSessaoAtual,
  registrarJogoFinalizado,
  registrarMomento,
} from './sessionStore';
import type { AliancaSessaoStats } from './types';

function incrementar(
  jogadorId: PlayerId,
  campo: 'liderancasAlianca' | 'missoesAlianca' | 'vezesTraidorAlianca',
  quantidade = 1,
): void {
  const sessao = getSessaoAtual();
  if (!sessao) return;
  const atual = sessao.jogadores.find((j) => j.id === jogadorId);
  atualizarJogadorSessao(jogadorId, {
    [campo]: ((atual?.[campo] as number | undefined) ?? 0) + quantidade,
  });
}

export function processarRodadaAlianca(rodada: RodadaAliancaResolvida): void {
  const sessao = getSessaoAtual();
  if (!sessao) return;

  incrementar(rodada.liderId, 'liderancasAlianca');
  for (const jogadorId of rodada.equipe) {
    incrementar(jogadorId, 'missoesAlianca');
  }

  if (!rodada.sucesso) {
    registrarMomento({
      tipo: 'missao_sabotada_alianca',
      jogoId: 'alianca',
      rodada: rodada.rodada,
      jogadoresIds: rodada.equipe,
      dados: {
        liderId: rodada.liderId,
        aprovacoes: rodada.aprovacoes,
        rejeicoes: rodada.rejeicoes,
        sabotagens: rodada.sabotagens,
      },
    });
  }

  if (rodada.sucesso && rodada.rejeicoes >= rodada.aprovacoes - 1) {
    registrarMomento({
      tipo: 'confianca_restaurada_alianca',
      jogoId: 'alianca',
      rodada: rodada.rodada,
      jogadoresIds: rodada.equipe,
      dados: {
        liderId: rodada.liderId,
        aprovacoes: rodada.aprovacoes,
        rejeicoes: rodada.rejeicoes,
      },
    });
  }

  if (rodada.rejeicoesSeguidasAntesDaMissao >= 2) {
    registrarMomento({
      tipo: 'rejeicao_em_cadeia_alianca',
      jogoId: 'alianca',
      rodada: rodada.rodada,
      jogadoresIds: [rodada.liderId],
      dados: {
        rejeicoesSeguidasAntesDaMissao: rodada.rejeicoesSeguidasAntesDaMissao,
      },
    });
  }
}

export function processarRejeicaoAlianca(
  rejeicao: EquipeAliancaRejeitada,
): void {
  const sessao = getSessaoAtual();
  if (!sessao) return;

  incrementar(rejeicao.liderId, 'liderancasAlianca');

  if (rejeicao.rejeicoesSeguidas >= 2) {
    registrarMomento({
      tipo: 'rejeicao_em_cadeia_alianca',
      jogoId: 'alianca',
      rodada: rejeicao.rodada,
      jogadoresIds: [rejeicao.liderId],
      dados: {
        equipe: rejeicao.equipe,
        aprovacoes: rejeicao.aprovacoes,
        rejeicoes: rejeicao.rejeicoes,
        rejeicoesSeguidas: rejeicao.rejeicoesSeguidas,
      },
    });
  }
}

export function processarResultadoAlianca(
  resultado: ResultadoAliancaFinalizado,
): void {
  const traidoresIds = Object.entries(resultado.papeisPorJogador)
    .filter(([, papel]) => papel === 'traidor')
    .map(([jogadorId]) => jogadorId as PlayerId);

  for (const jogadorId of traidoresIds) {
    incrementar(jogadorId, 'vezesTraidorAlianca');
  }

  const liderancasAprovadas = new Map<PlayerId, number>();
  for (const missao of resultado.historicoMissoes) {
    if (!missao.aprovada) continue;
    liderancasAprovadas.set(
      missao.liderId,
      (liderancasAprovadas.get(missao.liderId) ?? 0) + 1,
    );
  }

  const liderMaisAprovadoId =
    [...liderancasAprovadas.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ??
    null;

  const stats: AliancaSessaoStats = {
    vencedor: resultado.vencedor,
    totalRodadas: resultado.totalRodadas,
    totalJogadores: resultado.totalJogadores,
    sucessosLeais: resultado.sucessosLeais,
    sabotagensTraidores: resultado.sabotagensTraidores,
    rejeicoesSeguidas: resultado.rejeicoesSeguidas,
    totalRejeicoes: resultado.historicoMissoes.reduce(
      (acc, missao) => acc + missao.rejeicoes,
      0,
    ),
    missoesSabotadas: resultado.historicoMissoes.filter(
      (missao) => !missao.sucesso,
    ).length,
    liderMaisAprovadoId,
    traidoresIds,
  };

  registrarJogoFinalizado('alianca', { alianca: stats });

  atualizarEstadoEmocional();
  reavaliarGrupo();
  detectarVibe();
}
