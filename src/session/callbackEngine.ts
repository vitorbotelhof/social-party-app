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
    condicao: (s) =>
      s.momentosMemoraveis.some((m) => m.tipo === 'clutch'),
    gerar: (s, nomes) => {
      const clutch = [...s.momentosMemoraveis]
        .reverse()
        .find((m) => m.tipo === 'clutch');
      if (!clutch || clutch.jogadoresIds.length === 0) return 'essa foi difícil de assistir.';
      const nome = nomes.get(clutch.jogadoresIds[0]) ?? 'alguém';
      return `${nome} estava jogando no escuro e adivinhou. respeito.`;
    },
  },

  {
    id: 'pos_jogo_unanimidade',
    momento: 'pos_jogo',
    prioridade: 85,
    condicao: (s) =>
      s.momentosMemoraveis.some((m) => m.tipo === 'unanimidade'),
    gerar: (s, nomes) => {
      const u = [...s.momentosMemoraveis]
        .reverse()
        .find((m) => m.tipo === 'unanimidade');
      if (!u || u.jogadoresIds.length === 0) return 'todo mundo concordou uma vez. raro.';
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
      if (!sv || sv.jogadoresIds.length === 0) return 'alguém sobreviveu mais do que devia.';
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
    condicao: (s) => s.jogosDaSessao.filter((j) => j.finalizadoEm !== null).length === 1,
    gerar: () => 'primeiro jogo. ainda estão se aquecendo.',
  },

  // ── Entre jogos ─────────────────────────────────────────────────────────────

  {
    id: 'entre_jogos_quente',
    momento: 'entre_jogos',
    prioridade: 80,
    condicao: (s) =>
      s.temperatura === 'quente' || s.temperatura === 'colapso',
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
    condicao: (s) =>
      s.momentosMemoraveis.some((m) => m.tipo === 'virada'),
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
    condicao: (s) =>
      s.momentosMemoraveis.some((m) => m.tipo === 'perfeito'),
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
    condicao: (s) =>
      s.momentosMemoraveis.some((m) => m.tipo === 'colapso_npl'),
    gerar: (s, nomes) => {
      const c = [...s.momentosMemoraveis]
        .reverse()
        .find((m) => m.tipo === 'colapso_npl');
      if (!c || c.jogadoresIds.length === 0) return 'esse turno foi difícil de ver.';
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
      const ultimo = [...s.jogosDaSessao].reverse().find(
        (j) => j.jogoId === 'inquisicao' && j.finalizadoEm !== null,
      );
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
      const ultimo = [...s.jogosDaSessao].reverse().find(
        (j) => j.jogoId === 'inquisicao' && j.finalizadoEm !== null,
      );
      return ultimo?.inquisicao?.vencedor === 'inocentes';
    },
    gerar: () => 'os inocentes sobreviveram. mas ficou perto.',
  },

  {
    id: 'inq_pos_corrupcao_em_cadeia',
    momento: 'pos_jogo',
    prioridade: 92,
    condicao: (s) =>
      s.momentosMemoraveis.filter((m) => m.tipo === 'corrupcao_revelada').length >= 2,
    gerar: (s) => {
      const n = s.momentosMemoraveis.filter((m) => m.tipo === 'corrupcao_revelada').length;
      return `${n} conversões. o grupo mudou de lado sem perceber.`;
    },
  },

  {
    id: 'inq_pos_guardiao_salvou',
    momento: 'pos_jogo',
    prioridade: 84,
    condicao: (s) =>
      s.momentosMemoraveis.some(
        (m) => m.tipo === 'corrupcao_revelada' && m.dados.eliminarBloqueado === true,
      ),
    gerar: (_s, nomes) => {
      const m = [..._s.momentosMemoraveis]
        .reverse()
        .find((x) => x.tipo === 'corrupcao_revelada' && x.dados.eliminarBloqueado === true);
      if (!m || m.jogadoresIds.length === 0) return 'alguém salvou alguém. sem saber.';
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
      if (!m || m.jogadoresIds.length === 0) return 'vocês eliminaram alguém inocente.';
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
    gerar: () =>
      'ninguém chegou a um acordo. a paranoia venceu a lógica.',
  },

  {
    id: 'inq_inversao_pos_resultado',
    momento: 'pos_resultado',
    prioridade: 88,
    condicao: (s) =>
      s.momentosMemoraveis.some((m) => m.tipo === 'inversao'),
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
      s.momentosMemoraveis.filter((m) => m.tipo === 'paranoia_maxima').length >= 2,
    gerar: (s) => {
      const n = s.momentosMemoraveis.filter((m) => m.tipo === 'paranoia_maxima').length;
      return `${n} vezes o grupo empatou. quando todo mundo desconfia, ninguém decide.`;
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
      const jogos = s.jogosDaSessao.filter((j) => j.finalizadoEm !== null).length;
      return `${jogos} jogos, ${s.momentosMemoraveis.length} momentos. boa noite.`;
    },
  },

  {
    id: 'dossie_morno_final',
    momento: 'dossie',
    prioridade: 80,
    condicao: (s) => s.temperatura === 'morno',
    gerar: (s) => {
      const jogos = s.jogosDaSessao.filter((j) => j.finalizadoEm !== null).length;
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

  const candidatos = TEMPLATES
    .filter((t) => t.momento === momento)
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
  const nomes = new Map(sessao.jogadores.map((j) => [j.id as PlayerId, j.nome]));

  const candidatos = TEMPLATES
    .filter((t) => t.momento === momento)
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
