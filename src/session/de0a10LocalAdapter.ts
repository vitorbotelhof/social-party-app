// ─── De 0 a 10 — Session Adapter ─────────────────────────────────────────────
//
// Processa o resultado de uma sessão local e alimenta o sistema de sessão:
// statsde jogo, momentos memoráveis, estado emocional e perfil do grupo.

import { atualizarEstadoEmocional } from './emotionalTracker';
import { reavaliarGrupo } from './groupProfile';
import { registrarJogoFinalizado } from './sessionStore';
import type { De0a10SessaoStats } from './types';
import { detectarVibe } from './vibeEngine';
import type { ResultadoRodada, SessaoDe0a10 } from '@/games/de-0-a-10';

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
    historico.length > 0
      ? Math.max(...historico.map((r) => r.divergencia))
      : 0;

  // Acertos exatos (erro = 0)
  const acertosExatos = todosErros.filter((e) => e === 0).length;

  // Jogador mais legível: menor erro médio como respondente
  const erroPorRespondente: Record<string, number[]> = {};
  for (const rodada of historico) {
    const id = rodada.respondente.id;
    const erros = rodada.palpites.map((p) => Math.abs(p.nota - rodada.notaReal));
    erroPorRespondente[id] = [...(erroPorRespondente[id] ?? []), ...erros];
  }

  let jogadorMaisLegivelId: string | null = null;
  let menorErroMedio = Infinity;
  let jogadorMaisDificilId: string | null = null;
  let maiorErroMedio = -Infinity;

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

  // Vencedor (só se competitivo)
  const vencedorId = sessao.modoCompetitivo
    ? ([...sessao.placar].sort((a, b) => b.total - a.total)[0]?.jogadorId ?? null)
    : null;

  return {
    totalRodadas: sessao.totalRodadas,
    rodadasCompletas: sessao.rodadasCompletas,
    mediaErroGrupo: Math.round(mediaErroGrupo * 10) / 10,
    maiorDivergencia,
    acertosExatos,
    jogadorMaisLegivelId,
    jogadorMaisDificilId,
    modoCompetitivo: sessao.modoCompetitivo,
    vencedorId,
    duracaoMs: Date.now() - sessao.iniciouEm,
    encerradaVoluntariamente,
  };
}

// ─── Detector de momentos ─────────────────────────────────────────────────────

export function detectarMomentosDe0a10(historico: ResultadoRodada[]) {
  const momentos: { tipo: string; rodada: number; jogadoresIds: string[] }[] =
    [];

  historico.forEach((rodada, i) => {
    const totalAdivinhadores = rodada.palpites.length;

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
        rodada: i + 1,
        jogadoresIds: [
          rodada.respondente.id,
          ...acertosProximos.map((p) => p.jogadorId),
        ],
      });
    }

    // Acerto exato: alguém acertou a nota sem margem
    const exatos = rodada.palpites.filter((p) => p.nota === rodada.notaReal);
    if (exatos.length > 0) {
      momentos.push({
        tipo: 'acerto_exato_d010',
        rodada: i + 1,
        jogadoresIds: exatos.map((p) => p.jogadorId),
      });
    }

    // Grupo perdido: divergência ≥ 5
    if (rodada.divergencia >= 5) {
      momentos.push({
        tipo: 'grupo_perdido_d010',
        rodada: i + 1,
        jogadoresIds: rodada.palpites.map((p) => p.jogadorId),
      });
    }
  });

  return momentos;
}

// ─── Processamento principal ──────────────────────────────────────────────────

export function processarResultadoDe0a10(
  sessao: SessaoDe0a10,
  encerradaVoluntariamente: boolean,
): void {
  const stats = buildResultadoDe0a10(sessao, encerradaVoluntariamente);
  registrarJogoFinalizado('de-0-a-10', { de0a10: stats });
  atualizarEstadoEmocional();
  reavaliarGrupo();
  detectarVibe();
}
