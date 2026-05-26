// ─── De 0 a 10 — Session Adapter ─────────────────────────────────────────────
//
// Processa o resultado de uma sessão local e alimenta o sistema de sessão:
// statsde jogo, momentos memoráveis, estado emocional e perfil do grupo.

import { atualizarEstadoEmocional } from './emotionalTracker';
import { reavaliarGrupo } from './groupProfile';
import { registrarJogoFinalizado, registrarMomento } from './sessionStore';
import type { De0a10SessaoStats, Momento } from './types';
import { detectarVibe } from './vibeEngine';
import type { ResultadoRodada, SessaoDe0a10 } from '@/games/de-0-a-10';
import type { PlayerId } from '@/engine/types';

// ─── Builder de stats ─────────────────────────────────────────────────────────

export function buildResultadoDe0a10(
  sessao: SessaoDe0a10,
  encerradaVoluntariamente: boolean,
): De0a10SessaoStats {
  const historico = sessao.historico;

  // Erro médio global (todos os palpites de todas as rodadas)
  const todosErros: number[] = historico.flatMap((r) =>
    r.palpites.map((p) => Math.abs(p.nota - r.notaReal)),
  );
  const mediaErroGrupo =
    todosErros.length > 0
      ? todosErros.reduce((a, b) => a + b, 0) / todosErros.length
      : 0;

  // Maior divergência em uma única rodada
  const maiorDivergencia =
    historico.length > 0 ? Math.max(...historico.map((r) => r.divergencia)) : 0;

  // Acertos exatos (erro = 0)
  const acertosExatos = todosErros.filter((e) => e === 0).length;
  const leiturasPerfeitas = historico.filter(
    (rodada) =>
      rodada.leituraColetiva === 'cravaram' ||
      rodada.leituraColetiva === 'te_leram',
  ).length;
  const rodadasSemLeitura = historico.filter(
    (rodada) => rodada.leituraColetiva === 'nao_te_leram',
  ).length;
  const gruposPartidos = historico.filter(
    (rodada) => rodada.leituraColetiva === 'divididos',
  ).length;
  const rodadasComLeituraRotativa = historico.filter(
    (rodada) => rodada.modoLeitura === 'rotativa',
  ).length;

  // Jogador mais legível: menor erro médio como respondente
  const erroPorRespondente: Record<string, number[]> = {};
  for (const rodada of historico) {
    const id = rodada.respondente.id;
    const erros = rodada.palpites.map((p) =>
      Math.abs(p.nota - rodada.notaReal),
    );
    erroPorRespondente[id] = [...(erroPorRespondente[id] ?? []), ...erros];
  }

  let jogadorMaisLegivelId: string | null = null;
  let menorErroMedio = Infinity;
  let jogadorMaisDificilId: string | null = null;
  let maiorErroMedio = -Infinity;
  const semLeituraPorRespondente: Record<string, number> = {};

  for (const [id, erros] of Object.entries(erroPorRespondente)) {
    if (erros.length === 0) continue;
    const media = erros.reduce((a, b) => a + b, 0) / erros.length;
    if (media < menorErroMedio) {
      menorErroMedio = media;
      jogadorMaisLegivelId = id;
    }
    if (media > maiorErroMedio) {
      maiorErroMedio = media;
      jogadorMaisDificilId = id;
    }
  }

  for (const rodada of historico) {
    if (rodada.leituraColetiva === 'nao_te_leram') {
      semLeituraPorRespondente[rodada.respondente.id] =
        (semLeituraPorRespondente[rodada.respondente.id] ?? 0) + 1;
    }
  }
  const jogadorMaisImprevisivelId =
    Object.entries(semLeituraPorRespondente)
      .filter(([, total]) => total >= 2)
      .sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  // Vencedor (só se competitivo)
  const vencedorId = sessao.modoCompetitivo
    ? ([...sessao.placar].sort((a, b) => b.total - a.total)[0]?.jogadorId ??
      null)
    : null;

  return {
    totalRodadas: sessao.totalRodadas,
    rodadasCompletas: sessao.rodadasCompletas,
    mediaErroGrupo: Math.round(mediaErroGrupo * 10) / 10,
    maiorDivergencia,
    acertosExatos,
    leiturasPerfeitas,
    rodadasSemLeitura,
    gruposPartidos,
    rodadasComLeituraRotativa,
    jogadorMaisLegivelId,
    jogadorMaisDificilId,
    jogadorMaisImprevisivelId,
    modoCompetitivo: sessao.modoCompetitivo,
    vencedorId,
    duracaoMs: Date.now() - sessao.iniciouEm,
    encerradaVoluntariamente,
  };
}

// ─── Detector de momentos ─────────────────────────────────────────────────────

type MomentoDe0a10 = Omit<Momento, 'id' | 'timestamp'>;

export function detectarMomentosDe0a10(
  historico: ResultadoRodada[],
): MomentoDe0a10[] {
  const momentos: MomentoDe0a10[] = [];
  const surpresasPorRespondente = new Map<PlayerId, number>();

  historico.forEach((rodada, i) => {
    const totalAdivinhadores = rodada.palpites.length;
    const respondenteId = rodada.respondente.id as PlayerId;

    // Leitura perfeita: todos adivinharam ±1
    const acertosProximos = rodada.palpites.filter(
      (p) => Math.abs(p.nota - rodada.notaReal) <= 1,
    );
    if (
      totalAdivinhadores > 0 &&
      acertosProximos.length === totalAdivinhadores
    ) {
      momentos.push({
        tipo: 'leitura_perfeita_d010',
        jogoId: 'de-0-a-10',
        rodada: i + 1,
        jogadoresIds: [
          respondenteId,
          ...acertosProximos.map((p) => p.jogadorId as PlayerId),
        ],
        dados: {
          notaReal: rodada.notaReal,
          totalAdivinhadores,
          modoLeitura: rodada.modoLeitura,
        },
      });
    }

    // Acerto exato: alguém acertou a nota sem margem
    const exatos = rodada.palpites.filter((p) => p.nota === rodada.notaReal);
    if (exatos.length > 0) {
      momentos.push({
        tipo: 'acerto_exato_d010',
        jogoId: 'de-0-a-10',
        rodada: i + 1,
        jogadoresIds: exatos.map((p) => p.jogadorId as PlayerId),
        dados: {
          respondenteId,
          notaReal: rodada.notaReal,
          totalExatos: exatos.length,
          modoLeitura: rodada.modoLeitura,
        },
      });
    }

    // Grupo partido: a mesma pessoa produziu interpretações incompatíveis.
    if (rodada.leituraColetiva === 'divididos') {
      momentos.push({
        tipo: 'grupo_partido_d010',
        jogoId: 'de-0-a-10',
        rodada: i + 1,
        jogadoresIds: [respondenteId],
        dados: {
          notaReal: rodada.notaReal,
          divergencia: rodada.divergencia,
          modoLeitura: rodada.modoLeitura,
        },
      });
    }

    // Sem leitura: ninguém chegou sequer à faixa próxima.
    if (rodada.leituraColetiva === 'nao_te_leram') {
      momentos.push({
        tipo: 'ninguem_entendeu_d010',
        jogoId: 'de-0-a-10',
        rodada: i + 1,
        jogadoresIds: [respondenteId],
        dados: {
          notaReal: rodada.notaReal,
          divergencia: rodada.divergencia,
          modoLeitura: rodada.modoLeitura,
        },
      });

      const totalSurpresas =
        (surpresasPorRespondente.get(respondenteId) ?? 0) + 1;
      surpresasPorRespondente.set(respondenteId, totalSurpresas);
      if (totalSurpresas === 2) {
        momentos.push({
          tipo: 'imprevisivel_em_serie_d010',
          jogoId: 'de-0-a-10',
          rodada: i + 1,
          jogadoresIds: [respondenteId],
          dados: {
            totalSurpresas,
            modoLeitura: rodada.modoLeitura,
          },
        });
      }
    }
  });

  return momentos;
}

// ─── Processamento principal ──────────────────────────────────────────────────

export function processarResultadoDe0a10(
  sessao: SessaoDe0a10,
  encerradaVoluntariamente: boolean,
): void {
  for (const momento of detectarMomentosDe0a10(sessao.historico)) {
    registrarMomento(momento);
  }

  const stats = buildResultadoDe0a10(sessao, encerradaVoluntariamente);
  registrarJogoFinalizado('de-0-a-10', { de0a10: stats });
  atualizarEstadoEmocional();
  reavaliarGrupo();
  detectarVibe();
}
