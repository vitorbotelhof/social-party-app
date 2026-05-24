/**
 * Callback Engine — comentários contextuais de host social.
 *
 * Tom: host social direto, nunca teatral.
 *   ✓ "vocês continuam piorando."
 *   ✗ "Que rodada ÉPICA foi essa! 🔥"
 *
 * Cada template tem uma condição e um gerador.
 * O engine filtra pelos templates aplicáveis, ordena por prioridade,
 * e retorna o mais relevante que ainda não foi usado na sessão.
 */

import {
  getSessaoAtual,
  construirMapaNomes,
  marcarCallbackUsado,
} from './sessionStore';
import type {
  CallbackTemplate,
  MomentoCallback,
  SessionIdentity,
} from './types';
import type { PlayerId } from '@/engine/types';

// ─── Templates ────────────────────────────────────────────────────────────────

const TEMPLATES: CallbackTemplate[] = [
  // ── Pós-jogo ────────────────────────────────────────────────────────────────

  {
    id: 'pos_jogo_colapso',
    momento: 'pos_jogo',
    prioridade: 100,
    condicao: (s) => s.temperatura === 'colapso',
    gerar: (s, _nomes) => {
      const total = s.momentosMemoraveis.length;
      return `${total} momentos nessa sessão. vocês não têm jeito.`;
    },
  },

  {
    id: 'pos_jogo_mrwhite_clutch',
    momento: 'pos_jogo',
    prioridade: 90,
    condicao: (s) => s.momentosMemoraveis.some((m) => m.tipo === 'clutch'),
    gerar: (s, nomes) => {
      const clutch = [...s.momentosMemoraveis]
        .reverse()
        .find((m) => m.tipo === 'clutch');
      if (!clutch || clutch.jogadoresIds.length === 0)
        return 'essa foi difícil de assistir.';
      const nome = nomes.get(clutch.jogadoresIds[0]) ?? 'alguém';
      return `${nome} estava jogando no escuro e adivinhou. respeito.`;
    },
  },

  {
    id: 'pos_jogo_unanimidade',
    momento: 'pos_jogo',
    prioridade: 85,
    condicao: (s) => s.momentosMemoraveis.some((m) => m.tipo === 'unanimidade'),
    gerar: (s, nomes) => {
      const u = [...s.momentosMemoraveis]
        .reverse()
        .find((m) => m.tipo === 'unanimidade');
      if (!u || u.jogadoresIds.length === 0)
        return 'todo mundo concordou uma vez. raro.';
      const nome = nomes.get(u.jogadoresIds[0]) ?? 'alguém';
      return `todo mundo escolheu ${nome} ao mesmo tempo. nem combinado fica assim.`;
    },
  },

  {
    id: 'pos_jogo_sobrevivente',
    momento: 'pos_jogo',
    prioridade: 80,
    condicao: (s) =>
      s.momentosMemoraveis.some((m) => m.tipo === 'sobrevivente'),
    gerar: (s, nomes) => {
      const sv = [...s.momentosMemoraveis]
        .reverse()
        .find((m) => m.tipo === 'sobrevivente');
      if (!sv || sv.jogadoresIds.length === 0)
        return 'alguém sobreviveu mais do que devia.';
      const nome = nomes.get(sv.jogadoresIds[0]) ?? 'alguém';
      return `${nome} sobreviveu rodadas suficientes pra ficar confortável demais.`;
    },
  },

  {
    id: 'pos_jogo_paranoia',
    momento: 'pos_jogo',
    prioridade: 75,
    condicao: (s) =>
      s.momentosMemoraveis.some((m) => m.tipo === 'paranoia_total'),
    gerar: () =>
      'ninguém concordou com ninguém. ou vocês não se conhecem ou se conhecem bem demais.',
  },

  {
    id: 'pos_jogo_primeiro',
    momento: 'pos_jogo',
    prioridade: 10,
    condicao: (s) =>
      s.jogosDaSessao.filter((j) => j.finalizadoEm !== null).length === 1,
    gerar: () => 'primeiro jogo. ainda estão se aquecendo.',
  },

  // ── Entre jogos ─────────────────────────────────────────────────────────────

  {
    id: 'entre_jogos_quente',
    momento: 'entre_jogos',
    prioridade: 80,
    condicao: (s) => s.temperatura === 'quente' || s.temperatura === 'colapso',
    gerar: (s) => {
      const n = s.jogosDaSessao.filter((j) => j.finalizadoEm !== null).length;
      return `${n} jogos. a sala já esquentou. qual é o próximo?`;
    },
  },

  {
    id: 'entre_jogos_grupo_caotico',
    momento: 'entre_jogos',
    prioridade: 70,
    condicao: (s) => s.grupoIdentidade === 'caotico',
    gerar: () => 'esse grupo não consegue fazer nada simples. próximo jogo.',
  },

  {
    id: 'entre_jogos_grupo_competitivo',
    momento: 'entre_jogos',
    prioridade: 70,
    condicao: (s) => s.grupoIdentidade === 'competitivo',
    gerar: () => 'vocês levam tudo a sério. mais um.',
  },

  {
    id: 'entre_jogos_grupo_intimo',
    momento: 'entre_jogos',
    prioridade: 70,
    condicao: (s) => s.grupoIdentidade === 'intimo',
    gerar: () => 'concordam demais pra ser normal. curiosos.',
  },

  {
    id: 'entre_jogos_dois_jogos',
    momento: 'entre_jogos',
    prioridade: 20,
    condicao: (s) =>
      s.jogosDaSessao.filter((j) => j.finalizadoEm !== null).length === 2,
    gerar: () => 'dois jogos. a sessão começou de verdade.',
  },

  // ── Pós-resultado ───────────────────────────────────────────────────────────

  {
    id: 'pos_resultado_virada',
    momento: 'pos_resultado',
    prioridade: 90,
    condicao: (s) => s.momentosMemoraveis.some((m) => m.tipo === 'virada'),
    gerar: (s, nomes) => {
      const v = [...s.momentosMemoraveis]
        .reverse()
        .find((m) => m.tipo === 'virada');
      if (!v || v.jogadoresIds.length === 0) return 'virada inesperada.';
      const nome = nomes.get(v.jogadoresIds[0]) ?? 'alguém';
      return `${nome} virou o jogo. ninguém esperava.`;
    },
  },

  {
    id: 'pos_resultado_perfeito',
    momento: 'pos_resultado',
    prioridade: 85,
    condicao: (s) => s.momentosMemoraveis.some((m) => m.tipo === 'perfeito'),
    gerar: (s, nomes) => {
      const p = [...s.momentosMemoraveis]
        .reverse()
        .find((m) => m.tipo === 'perfeito');
      if (!p || p.jogadoresIds.length === 0) return 'turno perfeito. acontece.';
      const nome = nomes.get(p.jogadoresIds[0]) ?? 'alguém';
      return `${nome} não errou nada. mostra que é possível.`;
    },
  },

  {
    id: 'pos_resultado_colapso_npl',
    momento: 'pos_resultado',
    prioridade: 80,
    condicao: (s) => s.momentosMemoraveis.some((m) => m.tipo === 'colapso_npl'),
    gerar: (s, nomes) => {
      const c = [...s.momentosMemoraveis]
        .reverse()
        .find((m) => m.tipo === 'colapso_npl');
      if (!c || c.jogadoresIds.length === 0)
        return 'esse turno foi difícil de ver.';
      const nome = nomes.get(c.jogadoresIds[0]) ?? 'alguém';
      return `${nome} travou completamente. acontece com todo mundo.`;
    },
  },

  // ── Inquisição: pós-jogo ────────────────────────────────────────────────────

  {
    id: 'inq_pos_corrompidos_venceram',
    momento: 'pos_jogo',
    prioridade: 95,
    condicao: (s) => {
      const ultimo = [...s.jogosDaSessao]
        .reverse()
        .find((j) => j.jogoId === 'inquisicao' && j.finalizadoEm !== null);
      return ultimo?.inquisicao?.vencedor === 'corrompidos';
    },
    gerar: (s) => {
      const inq = [...s.jogosDaSessao]
        .reverse()
        .find((j) => j.jogoId === 'inquisicao')?.inquisicao;
      const loops = inq?.totalLoops ?? 0;
      return `os corrompidos venceram em ${loops} ${loops === 1 ? 'loop' : 'loops'}. vocês não se conhecem tão bem assim.`;
    },
  },

  {
    id: 'inq_pos_inocentes_venceram',
    momento: 'pos_jogo',
    prioridade: 86,
    condicao: (s) => {
      const ultimo = [...s.jogosDaSessao]
        .reverse()
        .find((j) => j.jogoId === 'inquisicao' && j.finalizadoEm !== null);
      return ultimo?.inquisicao?.vencedor === 'inocentes';
    },
    gerar: () => 'os inocentes sobreviveram. mas ficou perto.',
  },

  {
    id: 'inq_pos_corrupcao_em_cadeia',
    momento: 'pos_jogo',
    prioridade: 92,
    condicao: (s) =>
      s.momentosMemoraveis.filter((m) => m.tipo === 'corrupcao_revelada')
        .length >= 2,
    gerar: (s) => {
      const n = s.momentosMemoraveis.filter(
        (m) => m.tipo === 'corrupcao_revelada',
      ).length;
      return `${n} conversões. o grupo mudou de lado sem perceber.`;
    },
  },

  {
    id: 'inq_pos_guardiao_salvou',
    momento: 'pos_jogo',
    prioridade: 84,
    condicao: (s) =>
      s.momentosMemoraveis.some(
        (m) =>
          m.tipo === 'corrupcao_revelada' && m.dados.eliminarBloqueado === true,
      ),
    gerar: (_s, nomes) => {
      const m = [..._s.momentosMemoraveis]
        .reverse()
        .find(
          (x) =>
            x.tipo === 'corrupcao_revelada' &&
            x.dados.eliminarBloqueado === true,
        );
      if (!m || m.jogadoresIds.length === 0)
        return 'alguém salvou alguém. sem saber.';
      const salvo = nomes.get(m.jogadoresIds[0]) ?? 'alguém';
      return `${salvo} foi salvo pelo guardião sem saber que precisava.`;
    },
  },

  // ── Inquisição: pós-resultado ───────────────────────────────────────────────

  {
    id: 'inq_votou_inocente',
    momento: 'pos_resultado',
    prioridade: 90,
    condicao: (s) =>
      s.momentosMemoraveis.some((m) => m.tipo === 'colapso_inquisicao'),
    gerar: (s, nomes) => {
      const m = [...s.momentosMemoraveis]
        .reverse()
        .find((x) => x.tipo === 'colapso_inquisicao');
      if (!m || m.jogadoresIds.length === 0)
        return 'vocês eliminaram alguém inocente.';
      const nome = nomes.get(m.jogadoresIds[0]) ?? 'alguém';
      return `${nome} era inocente. vocês erraram feio.`;
    },
  },

  {
    id: 'inq_paranoia_maxima',
    momento: 'pos_resultado',
    prioridade: 82,
    condicao: (s) =>
      s.momentosMemoraveis.some((m) => m.tipo === 'paranoia_maxima'),
    gerar: () => 'ninguém chegou a um acordo. a paranoia venceu a lógica.',
  },

  {
    id: 'inq_inversao_pos_resultado',
    momento: 'pos_resultado',
    prioridade: 88,
    condicao: (s) => s.momentosMemoraveis.some((m) => m.tipo === 'inversao'),
    gerar: (s) => {
      const inq = [...s.jogosDaSessao]
        .reverse()
        .find((j) => j.jogoId === 'inquisicao')?.inquisicao;
      const n = inq?.totalContaminacoes ?? 0;
      if (n === 0) return 'o grupo virou. sem que ninguém percebesse.';
      return `${n} ${n === 1 ? 'conversão' : 'conversões'} mudaram o resultado. a corrupção foi mais rápida que a confiança.`;
    },
  },

  // ── Inquisição: entre jogos ─────────────────────────────────────────────────

  {
    id: 'inq_entre_grupo_paranoico',
    momento: 'entre_jogos',
    prioridade: 75,
    condicao: (s) =>
      s.grupoIdentidade === 'paranoico' &&
      s.jogosDaSessao.some((j) => j.jogoId === 'inquisicao'),
    gerar: () => 'vocês não confiam em ninguém. nem em si mesmos.',
  },

  {
    id: 'inq_entre_grupo_destrutivo',
    momento: 'entre_jogos',
    prioridade: 72,
    condicao: (s) =>
      s.grupoIdentidade === 'destrutivo' &&
      s.jogosDaSessao.some((j) => j.jogoId === 'inquisicao'),
    gerar: () => 'esse grupo se autodestrói sem perceber. próximo.',
  },

  // ── Inquisição: dossiê ──────────────────────────────────────────────────────

  {
    id: 'inq_dossie_corrompidos_venceram',
    momento: 'dossie',
    prioridade: 95,
    condicao: (s) =>
      s.momentosMemoraveis.some((m) => m.tipo === 'inversao') &&
      (s.temperatura === 'quente' || s.temperatura === 'colapso'),
    gerar: (s) => {
      const inq = [...s.jogosDaSessao]
        .reverse()
        .find((j) => j.jogoId === 'inquisicao')?.inquisicao;
      const loops = inq?.totalLoops ?? 0;
      const corrupções = inq?.totalContaminacoes ?? 0;
      return `${loops} loops. ${corrupções} ${corrupções === 1 ? 'conversão' : 'conversões'}. esse grupo não resiste à pressão de dentro.`;
    },
  },

  {
    id: 'inq_dossie_paranoia_final',
    momento: 'dossie',
    prioridade: 88,
    condicao: (s) =>
      s.momentosMemoraveis.filter((m) => m.tipo === 'paranoia_maxima').length >=
      2,
    gerar: (s) => {
      const n = s.momentosMemoraveis.filter(
        (m) => m.tipo === 'paranoia_maxima',
      ).length;
      return `${n} vezes o grupo empatou. quando todo mundo desconfia, ninguém decide.`;
    },
  },

  // ── Você Me Conhece?: pós-jogo ─────────────────────────────────────────────

  {
    id: 'vmc_pos_sinergia',
    momento: 'pos_jogo',
    prioridade: 93,
    condicao: (s) =>
      s.momentosMemoraveis.some((m) => m.tipo === 'sinergia_vmc'),
    gerar: (s, nomes) => {
      const vmc = [...s.jogosDaSessao]
        .reverse()
        .find((j) => j.jogoId === 'voce-me-conhece')?.vmc;
      const melhor = vmc?.melhorLeitorId ? nomes.get(vmc.melhorLeitorId) : null;
      if (melhor)
        return `${melhor} leu o grupo como um livro. esse nível de sintonia é raro.`;
      return 'esse grupo se conhece melhor do que admite.';
    },
  },

  {
    id: 'vmc_pos_desconhecido',
    momento: 'pos_jogo',
    prioridade: 88,
    condicao: (s) =>
      s.momentosMemoraveis.some((m) => m.tipo === 'desconhecido_vmc'),
    gerar: (s, nomes) => {
      const m = [...s.momentosMemoraveis]
        .reverse()
        .find((x) => x.tipo === 'desconhecido_vmc');
      if (!m || m.jogadoresIds.length === 0)
        return 'alguém aqui é um mistério para o grupo.';
      const nome = nomes.get(m.jogadoresIds[0] as PlayerId) ?? 'alguém';
      return `${nome} surpreendeu todo mundo. ninguém acertou uma vez sequer.`;
    },
  },

  {
    id: 'vmc_pos_leitura_perfeita',
    momento: 'pos_jogo',
    prioridade: 84,
    condicao: (s) =>
      s.momentosMemoraveis.filter((m) => m.tipo === 'leitura_perfeita_vmc')
        .length >= 2,
    gerar: (s) => {
      const n = s.momentosMemoraveis.filter(
        (m) => m.tipo === 'leitura_perfeita_vmc',
      ).length;
      return `${n} rodadas com leitura perfeita. esse grupo não tem muitos segredos.`;
    },
  },

  // ── Você Me Conhece?: entre jogos ───────────────────────────────────────────

  {
    id: 'vmc_entre_intimo',
    momento: 'entre_jogos',
    prioridade: 72,
    condicao: (s) =>
      s.grupoIdentidade === 'intimo' &&
      s.jogosDaSessao.some((j) => j.jogoId === 'voce-me-conhece'),
    gerar: () =>
      'depois do que viram agora, difícil fingir que não se conhecem.',
  },

  // ── Faz Aí: pós-jogo ──────────────────────────────────────────────────────

  {
    id: 'faz_ai_pos_surto',
    momento: 'pos_jogo',
    prioridade: 94,
    condicao: (s) =>
      s.momentosMemoraveis.some((m) => m.tipo === 'surto_faz_ai'),
    gerar: (s, nomes) => {
      const momento = [...s.momentosMemoraveis]
        .reverse()
        .find((m) => m.tipo === 'surto_faz_ai');
      if (!momento || momento.jogadoresIds.length === 0) {
        return 'teve uma atuação ali que ninguém vai conseguir explicar depois.';
      }
      const nome = nomes.get(momento.jogadoresIds[0] as PlayerId) ?? 'alguém';
      return `${nome} entrou em modo físico. difícil desver.`;
    },
  },

  {
    id: 'faz_ai_pos_identificacao',
    momento: 'pos_jogo',
    prioridade: 89,
    condicao: (s) =>
      s.momentosMemoraveis.filter((m) => m.tipo === 'identificacao_imediata')
        .length >= 2,
    gerar: (s) => {
      const n = s.momentosMemoraveis.filter(
        (m) => m.tipo === 'identificacao_imediata',
      ).length;
      return `${n} cenas reconhecidas rápido. esse grupo tem repertório demais.`;
    },
  },

  {
    id: 'faz_ai_pos_atuacao_duvidosa',
    momento: 'pos_jogo',
    prioridade: 83,
    condicao: (s) =>
      s.momentosMemoraveis.some((m) => m.tipo === 'atuacao_duvidosa'),
    gerar: (s, nomes) => {
      const momento = [...s.momentosMemoraveis]
        .reverse()
        .find((m) => m.tipo === 'atuacao_duvidosa');
      if (!momento || momento.jogadoresIds.length === 0) {
        return 'algumas atuações exigiram fé do grupo.';
      }
      const nome = nomes.get(momento.jogadoresIds[0] as PlayerId) ?? 'alguém';
      return `${nome} fez escolhas artísticas. o grupo não acompanhou.`;
    },
  },

  // ── Faz Aí: entre jogos ────────────────────────────────────────────────────

  {
    id: 'faz_ai_entre_caotico',
    momento: 'entre_jogos',
    prioridade: 73,
    condicao: (s) =>
      s.grupoIdentidade === 'caotico' &&
      s.jogosDaSessao.some((j) => j.jogoId === 'faz-ai'),
    gerar: () => 'depois dessas atuações, qualquer jogo parece normal.',
  },

  // ── Faz Aí: dossiê ─────────────────────────────────────────────────────────

  {
    id: 'faz_ai_dossie_vergonha',
    momento: 'dossie',
    prioridade: 92,
    condicao: (s) =>
      s.jogosDaSessao.some(
        (j) =>
          j.jogoId === 'faz-ai' &&
          j.finalizadoEm !== null &&
          (j.fazAi?.vergonhaColetiva ?? 0) >= 2.7,
      ),
    gerar: (s) => {
      const fazAi = [...s.jogosDaSessao]
        .reverse()
        .find((j) => j.jogoId === 'faz-ai')?.fazAi;
      const total = fazAi?.totalCartas ?? 0;
      return `${total} cenas depois, ficou claro: esse grupo reconhece vergonha rápido demais.`;
    },
  },

  // ── Aliança: pós-jogo ─────────────────────────────────────────────────────

  {
    id: 'alianca_pos_traidores',
    momento: 'pos_jogo',
    prioridade: 96,
    condicao: (s) => {
      const ultimo = [...s.jogosDaSessao]
        .reverse()
        .find((j) => j.jogoId === 'alianca' && j.finalizadoEm !== null);
      return ultimo?.alianca?.vencedor === 'traidores';
    },
    gerar: (s) => {
      const alianca = [...s.jogosDaSessao]
        .reverse()
        .find((j) => j.jogoId === 'alianca')?.alianca;
      const sabotagens = alianca?.sabotagensTraidores ?? 0;
      return `${sabotagens} sabotagens. vocês aprovaram a própria derrota.`;
    },
  },

  {
    id: 'alianca_pos_leais',
    momento: 'pos_jogo',
    prioridade: 87,
    condicao: (s) => {
      const ultimo = [...s.jogosDaSessao]
        .reverse()
        .find((j) => j.jogoId === 'alianca' && j.finalizadoEm !== null);
      return ultimo?.alianca?.vencedor === 'leais';
    },
    gerar: () =>
      'os leais venceram. confiar em alguém ainda funciona, às vezes.',
  },

  {
    id: 'alianca_pos_sabotagem_em_cadeia',
    momento: 'pos_jogo',
    prioridade: 91,
    condicao: (s) =>
      s.momentosMemoraveis.filter((m) => m.tipo === 'missao_sabotada_alianca')
        .length >= 2,
    gerar: (s) => {
      const n = s.momentosMemoraveis.filter(
        (m) => m.tipo === 'missao_sabotada_alianca',
      ).length;
      return `${n} missões sabotadas. a política falhou bastante.`;
    },
  },

  // ── Aliança: entre jogos ──────────────────────────────────────────────────

  {
    id: 'alianca_entre_paranoico',
    momento: 'entre_jogos',
    prioridade: 74,
    condicao: (s) =>
      s.grupoIdentidade === 'paranoico' &&
      s.jogosDaSessao.some((j) => j.jogoId === 'alianca'),
    gerar: () => 'depois da Aliança, qualquer defesa parece manipulação.',
  },

  // ── Aliança: dossiê ───────────────────────────────────────────────────────

  {
    id: 'alianca_dossie_sabotagens',
    momento: 'dossie',
    prioridade: 93,
    condicao: (s) =>
      s.jogosDaSessao.some(
        (j) =>
          j.jogoId === 'alianca' &&
          j.finalizadoEm !== null &&
          (j.alianca?.missoesSabotadas ?? 0) >= 2,
      ),
    gerar: (s) => {
      const alianca = [...s.jogosDaSessao]
        .reverse()
        .find((j) => j.jogoId === 'alianca')?.alianca;
      const n = alianca?.missoesSabotadas ?? 0;
      return `${n} sabotagens depois, ninguém deveria sair daqui achando que convence bem.`;
    },
  },

  // ── Dossiê ──────────────────────────────────────────────────────────────────

  {
    id: 'dossie_colapso_final',
    momento: 'dossie',
    prioridade: 100,
    condicao: (s) => s.temperatura === 'colapso',
    gerar: (s) => {
      const min = Math.round((Date.now() - s.iniciadoEm) / 60000);
      return `${min} minutos. ${s.momentosMemoraveis.length} momentos. esse grupo tem um problema sério.`;
    },
  },

  {
    id: 'dossie_quente_final',
    momento: 'dossie',
    prioridade: 90,
    condicao: (s) => s.temperatura === 'quente',
    gerar: (s) => {
      const jogos = s.jogosDaSessao.filter(
        (j) => j.finalizadoEm !== null,
      ).length;
      return `${jogos} jogos, ${s.momentosMemoraveis.length} momentos. boa noite.`;
    },
  },

  {
    id: 'dossie_morno_final',
    momento: 'dossie',
    prioridade: 80,
    condicao: (s) => s.temperatura === 'morno',
    gerar: (s) => {
      const jogos = s.jogosDaSessao.filter(
        (j) => j.finalizadoEm !== null,
      ).length;
      return `${jogos} ${jogos === 1 ? 'jogo' : 'jogos'}. estava só começando.`;
    },
  },

  {
    id: 'dossie_frio_final',
    momento: 'dossie',
    prioridade: 70,
    condicao: () => true,
    gerar: () => 'sessão curta. mas foi algo.',
  },
];

// ─── Engine ───────────────────────────────────────────────────────────────────

/**
 * Retorna o texto do callback mais relevante para o momento dado.
 * Marca como usado automaticamente.
 * Retorna null se não há callback aplicável.
 */
export function obterCallback(momento: MomentoCallback): string | null {
  const sessao = getSessaoAtual();
  if (!sessao) return null;

  const nomes = construirMapaNomes();

  const candidatos = TEMPLATES.filter((t) => t.momento === momento)
    .filter((t) => !sessao.callbacksUsados.includes(t.id))
    .filter((t) => t.condicao(sessao))
    .sort((a, b) => b.prioridade - a.prioridade);

  if (candidatos.length === 0) return null;

  const escolhido = candidatos[0];
  marcarCallbackUsado(escolhido.id);

  return escolhido.gerar(sessao, nomes);
}

/**
 * Versão sem side-effect — não marca como usado.
 * Útil para preview e testes.
 */
export function obterCallbackSimples(
  momento: MomentoCallback,
  sessao: SessionIdentity,
): string | null {
  const nomes = new Map(
    sessao.jogadores.map((j) => [j.id as PlayerId, j.nome]),
  );

  const candidatos = TEMPLATES.filter((t) => t.momento === momento)
    .filter((t) => !sessao.callbacksUsados.includes(t.id))
    .filter((t) => t.condicao(sessao))
    .sort((a, b) => b.prioridade - a.prioridade);

  if (candidatos.length === 0) return null;

  return candidatos[0].gerar(sessao, nomes);
}

/**
 * Retorna todos os templates disponíveis — para debugging e testes.
 */
export function getTemplates(): readonly CallbackTemplate[] {
  return TEMPLATES;
}
