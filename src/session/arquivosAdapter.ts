/**
 * Arquivos Adapter — traduz eventos e resultado de Arquivos
 * em momentos, estatísticas e sinais que o sistema de sessão entende.
 *
 * Integração:
 *   processarEvidenciaLiberada()     → chamar quando nova evidência pública é liberada
 *   processarAcaoSecretaConcluida()  → chamar quando jogador conclui ou recusa ação secreta
 *   processarVereditoRegistrado()    → chamar quando o host registra o veredito
 *   processarResultadoArquivos()     → chamar quando fase 'revelacao_resultados' inicia
 *
 * Momentos → temperatura:
 *   teoria_quebrada_arquivos               (peso 2) → nova evidência derruba teoria
 *   caso_resolvido_arquivos                (peso 1) → grupo acertou o caso
 *   caso_fracassou_arquivos                (peso 2) → grupo errou completamente
 *   objetivo_exposto_arquivos              (peso 1) → segredo de personagem percebido
 *   acao_secreta_gerou_suspeita_arquivos   (peso 1) → comportamento vira evidência social
 */

import type {
  ArquivosFinalReveal,
  ArquivosGameState,
  ArquivosCollectiveGrade,
} from '@/games/arquivos/types';
import type { PlayerId } from '@/engine/types';
import {
  atualizarEstadoEmocional,
} from './emotionalTracker';
import { reavaliarGrupo } from './groupProfile';
import { detectarVibe } from './vibeEngine';
import {
  getSessaoAtual,
  registrarJogoFinalizado,
  registrarMomento,
  atualizarJogadorSessao,
} from './sessionStore';
import type { ArquivosSessaoStats } from './types';

export interface ResultadoArquivos {
  reveal: ArquivosFinalReveal;
  state: ArquivosGameState;
}

// ─── Sinais de fase: evidência liberada ──────────────────────────────────────

/**
 * Processa a liberação de uma nova evidência pública.
 *
 * Se houver mudança de fase (de investigacao_inicial para nova_evidencia),
 * registra um momento de teoria quebrada — sinal de que o caso virou.
 *
 * Chamar quando `estado.publicState.phase === 'nova_evidencia'` pela primeira vez.
 */
export function processarEvidenciaLiberada(
  evidenceId: string,
  rodada: number,
): void {
  const sessao = getSessaoAtual();
  if (!sessao) return;

  registrarMomento({
    tipo: 'teoria_quebrada_arquivos',
    jogoId: 'arquivos',
    rodada,
    jogadoresIds: [],
    dados: { evidenceId },
  });

  atualizarEstadoEmocional('teoria_quebrada_arquivos');
  reavaliarGrupo();
}

// ─── Sinais de ação secreta ───────────────────────────────────────────────────

/**
 * Processa a conclusão ou recusa de uma ação secreta.
 *
 * Quando concluída (não recusada) e há metainformação para outros jogadores,
 * registra um momento de suspeita social — a mesa observa comportamento.
 *
 * Chamar após `concluirAcaoSecretaArquivos` ou `recusarAcaoSecretaArquivos`.
 */
export function processarAcaoSecretaConcluida(
  playerId: PlayerId,
  actionId: string,
  status: 'concluida' | 'recusada',
  temMetainfo: boolean,
  rodada: number,
): void {
  const sessao = getSessaoAtual();
  if (!sessao) return;

  if (status === 'concluida') {
    const jogador = sessao.jogadores.find((j) => j.id === playerId);
    atualizarJogadorSessao(playerId, {
      acoesArquivosConcluidas: (jogador?.acoesArquivosConcluidas ?? 0) + 1,
    });

    if (temMetainfo) {
      registrarMomento({
        tipo: 'acao_secreta_gerou_suspeita_arquivos',
        jogoId: 'arquivos',
        rodada,
        jogadoresIds: [playerId],
        dados: { actionId, status },
      });

      atualizarEstadoEmocional('acao_secreta_gerou_suspeita_arquivos');
      reavaliarGrupo();
    }
  }
}

// ─── Sinais de veredito ───────────────────────────────────────────────────────

/**
 * Processa o registro do veredito coletivo.
 *
 * Neste ponto não calculamos ainda o resultado (isso ocorre no servidor),
 * mas registramos que o grupo chegou a um consenso — útil para callbacks.
 *
 * Chamar após `registrarVereditoArquivosRealtime`.
 */
export function processarVereditoRegistrado(rodada: number): void {
  const sessao = getSessaoAtual();
  if (!sessao) return;

  // Apenas registra o momento de chegada ao veredito.
  // O resultado real chega em processarResultadoArquivos.
  registrarMomento({
    tipo: 'teoria_quebrada_arquivos',
    jogoId: 'arquivos',
    rodada,
    jogadoresIds: [],
    dados: { evento: 'veredito_registrado' },
  });
}

// ─── Processamento de resultado final ────────────────────────────────────────

/**
 * Processa o encerramento de uma partida de Arquivos.
 *
 * Detecta e registra:
 *   - caso_resolvido_arquivos   → grupo acertou ao menos 2 de 3 perguntas obrigatórias
 *   - caso_fracassou_arquivos   → grupo errou todas as perguntas obrigatórias
 *   - objetivo_exposto_arquivos → segredo exposto para cada jogador afetado
 *   - Estatísticas completas no JogoSessao
 *   - Sinais individuais por jogador
 *
 * Chamar quando collectiveResult é disponibilizado (fase revelacao_resultados).
 */
export function processarResultadoArquivos(resultado: ResultadoArquivos): void {
  const sessao = getSessaoAtual();
  if (!sessao) return;

  const { reveal, state } = resultado;
  const { collectiveResult, individualResults } = reveal;
  const publicState = state.publicState;

  // ── Estatísticas gerais ──────────────────────────────────────────────────────

  const acoesResolvidas = publicState.secretActionProgress.filter(
    (record) => record.status === 'concluida' || record.status === 'recusada',
  ).length;

  const jogadoresComObjetivoAlcancado = individualResults.filter(
    (result) => result.status === 'alcancado',
  ).length;

  const stats: ArquivosSessaoStats = {
    caseId: reveal.caseId,
    grade: collectiveResult.grade,
    pontosObtidos: collectiveResult.pontosObtidos,
    pontosPossiveis: collectiveResult.pontosPossiveis,
    totalJogadores: publicState.players.length,
    acoesSecretasResolvidas: acoesResolvidas,
    jogadoresComObjetivoAlcancado,
  };

  registrarJogoFinalizado('arquivos', { arquivos: stats });

  // ── Momento: caso resolvido / fracassado ─────────────────────────────────────

  const acertos = collectiveResult.questionScores.filter((s) => s.acertou).length;
  const totalPerguntas = collectiveResult.questionScores.length;
  const rodadaFinal = 1; // Arquivos tem estrutura de fase única, não rodadas numeradas

  const gradesBoas: ArquivosCollectiveGrade[] = [
    'caso_resolvido',
    'caso_quase_resolvido',
  ];

  if (gradesBoas.includes(collectiveResult.grade)) {
    registrarMomento({
      tipo: 'caso_resolvido_arquivos',
      jogoId: 'arquivos',
      rodada: rodadaFinal,
      jogadoresIds: publicState.players.map((p) => p.id),
      dados: {
        grade: collectiveResult.grade,
        acertos,
        totalPerguntas,
        pontosObtidos: collectiveResult.pontosObtidos,
        pontosPossiveis: collectiveResult.pontosPossiveis,
      },
    });
  } else if (collectiveResult.grade === 'fracasso_investigativo') {
    registrarMomento({
      tipo: 'caso_fracassou_arquivos',
      jogoId: 'arquivos',
      rodada: rodadaFinal,
      jogadoresIds: publicState.players.map((p) => p.id),
      dados: {
        grade: collectiveResult.grade,
        acertos,
        totalPerguntas,
      },
    });
  }

  // ── Sinais individuais: objetivos e segredos ─────────────────────────────────

  for (const result of individualResults) {
    const jogador = sessao.jogadores.find((j) => j.id === result.playerId);
    if (!jogador) continue;

    if (result.status === 'alcancado') {
      atualizarJogadorSessao(result.playerId, {
        objetivosArquivosAlcancados:
          (jogador.objetivosArquivosAlcancados ?? 0) + 1,
      });
    }

    if (result.segredoExposto) {
      atualizarJogadorSessao(result.playerId, {
        segredosExpostosArquivos: (jogador.segredosExpostosArquivos ?? 0) + 1,
      });

      registrarMomento({
        tipo: 'objetivo_exposto_arquivos',
        jogoId: 'arquivos',
        rodada: rodadaFinal,
        jogadoresIds: [result.playerId],
        dados: {
          characterId: result.characterId,
          tituloPosJogo: result.tituloPosJogo,
          statusObjetivo: result.status,
        },
      });
    }
  }

  // ── Reavaliação final da sessão ──────────────────────────────────────────────

  atualizarEstadoEmocional();
  reavaliarGrupo();
  detectarVibe();
}
