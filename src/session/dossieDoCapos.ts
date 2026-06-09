/**
 * Dossiê do Caos — resumo gerado ao fim da sessão.
 *
 * Gera até 4 destaques individuais e uma frase final que resume o grupo.
 * Tom: host social direto, não teatral.
 *
 * Requires: pelo menos 1 jogo completo.
 */

import { getSessaoAtual } from './sessionStore';
import { obterCallbackSimples } from './callbackEngine';
import type {
  DossieDoCapos,
  DestaqueJogador,
  SessaoJogador,
  Momento,
} from './types';
import type { PlayerId } from '@/engine/types';

// ─── Destaques individuais ────────────────────────────────────────────────────

function destaqueVezesVotado(
  jogadores: SessaoJogador[],
  _nomes: Map<PlayerId, string>,
): DestaqueJogador | null {
  const top = [...jogadores].sort((a, b) => b.vezesVotado - a.vezesVotado)[0];
  if (!top || top.vezesVotado < 2) return null;

  return {
    jogadorId: top.id,
    titulo: 'o mais suspeito',
    descricao: `recebeu ${top.vezesVotado} votos na sessão`,
  };
}

function destaqueClutch(
  jogadores: SessaoJogador[],
  _nomes: Map<PlayerId, string>,
): DestaqueJogador | null {
  const top = [...jogadores].sort(
    (a, b) => b.clutchsMrWhite - a.clutchsMrWhite,
  )[0];
  if (!top || top.clutchsMrWhite < 1) return null;

  return {
    jogadorId: top.id,
    titulo: 'o escapista',
    descricao:
      top.clutchsMrWhite === 1
        ? 'foi mr white e adivinhou a palavra'
        : `foi mr white ${top.clutchsMrWhite}x e adivinhou`,
  };
}

function destaqueJulgado(
  jogadores: SessaoJogador[],
  _nomes: Map<PlayerId, string>,
): DestaqueJogador | null {
  const top = [...jogadores].sort((a, b) => b.vezesJulgado - a.vezesJulgado)[0];
  if (!top || top.vezesJulgado < 2) return null;

  return {
    jogadorId: top.id,
    titulo: 'o grande julgado',
    descricao: `foi o mais votado em ${top.vezesJulgado} rodadas`,
  };
}

function destaquePontos(
  jogadores: SessaoJogador[],
  _nomes: Map<PlayerId, string>,
): DestaqueJogador | null {
  const top = [...jogadores].sort((a, b) => b.pontosTotais - a.pontosTotais)[0];
  if (!top || top.pontosTotais < 5) return null;

  return {
    jogadorId: top.id,
    titulo: 'o mais afiado',
    descricao: `${top.pontosTotais} pontos na ponta da língua`,
  };
}

function destaqueColapso(
  jogadores: SessaoJogador[],
  _nomes: Map<PlayerId, string>,
): DestaqueJogador | null {
  const top = [...jogadores].sort((a, b) => b.colapsos - a.colapsos)[0];
  if (!top || top.colapsos < 2) return null;

  return {
    jogadorId: top.id,
    titulo: 'o que travou',
    descricao: `${top.colapsos} turnos com mais falhas que acertos`,
  };
}

function destaqueContaminado(
  jogadores: SessaoJogador[],
  _nomes: Map<PlayerId, string>,
): DestaqueJogador | null {
  const top = [...jogadores].sort(
    (a, b) => b.vezesContaminado - a.vezesContaminado,
  )[0];
  if (!top || top.vezesContaminado < 1) return null;

  return {
    jogadorId: top.id,
    titulo: 'o corrompido oculto',
    descricao:
      top.vezesContaminado === 1
        ? 'foi convertido durante a noite — ninguém percebeu'
        : `foi convertido ${top.vezesContaminado}x — virou o inimigo`,
  };
}

function destaqueAgenteDuplo(
  jogadores: SessaoJogador[],
  _nomes: Map<PlayerId, string>,
): DestaqueJogador | null {
  const top = [...jogadores].sort(
    (a, b) => b.acoesCorrompidas - a.acoesCorrompidas,
  )[0];
  if (!top || top.acoesCorrompidas < 2) return null;

  return {
    jogadorId: top.id,
    titulo: 'o agente da corrupção',
    descricao: `executou ${top.acoesCorrompidas} ações na noite como corrompido`,
  };
}

function destaqueEliminado(
  jogadores: SessaoJogador[],
  _nomes: Map<PlayerId, string>,
): DestaqueJogador | null {
  const top = [...jogadores].sort(
    (a, b) => b.vezesEliminado - a.vezesEliminado,
  )[0];
  if (!top || top.vezesEliminado < 2) return null;

  return {
    jogadorId: top.id,
    titulo: 'o mais eliminado',
    descricao: `foi eliminado por votação ${top.vezesEliminado}x na sessão`,
  };
}

function destaqueAcertosFazAi(
  jogadores: SessaoJogador[],
  _nomes: Map<PlayerId, string>,
): DestaqueJogador | null {
  const top = [...jogadores].sort((a, b) => b.acertosFazAi - a.acertosFazAi)[0];
  if (!top || top.acertosFazAi < 4) return null;

  return {
    jogadorId: top.id,
    titulo: 'o mais reconhecível',
    descricao: `${top.acertosFazAi} cenas acertadas no faz aí`,
  };
}

function destaqueAtuacaoDuvidosaFazAi(
  jogadores: SessaoJogador[],
  _nomes: Map<PlayerId, string>,
): DestaqueJogador | null {
  const top = [...jogadores].sort((a, b) => b.passesFazAi - a.passesFazAi)[0];
  if (!top || top.passesFazAi < 3) return null;

  return {
    jogadorId: top.id,
    titulo: 'atuação questionável',
    descricao: `${top.passesFazAi} cenas passaram sem o grupo entender`,
  };
}

function destaqueCaosFazAi(
  jogadores: SessaoJogador[],
  _nomes: Map<PlayerId, string>,
): DestaqueJogador | null {
  const top = [...jogadores].sort(
    (a, b) => b.turnosCaoticosFazAi - a.turnosCaoticosFazAi,
  )[0];
  if (!top || top.turnosCaoticosFazAi < 1) return null;

  return {
    jogadorId: top.id,
    titulo: 'o corpo do caos',
    descricao:
      top.turnosCaoticosFazAi === 1
        ? 'teve um turno de energia social alta'
        : `${top.turnosCaoticosFazAi} turnos de energia social alta`,
  };
}

function destaquePoliticoAlianca(
  jogadores: SessaoJogador[],
  _nomes: Map<PlayerId, string>,
): DestaqueJogador | null {
  const top = [...jogadores].sort(
    (a, b) => b.liderancasAlianca - a.liderancasAlianca,
  )[0];
  if (!top || top.liderancasAlianca < 2) return null;

  return {
    jogadorId: top.id,
    titulo: 'o articulador',
    descricao: `liderou ${top.liderancasAlianca} propostas na aliança`,
  };
}

function destaqueTraidorAlianca(
  jogadores: SessaoJogador[],
  _nomes: Map<PlayerId, string>,
): DestaqueJogador | null {
  const top = [...jogadores].sort(
    (a, b) => b.vezesTraidorAlianca - a.vezesTraidorAlianca,
  )[0];
  if (!top || top.vezesTraidorAlianca < 1) return null;

  return {
    jogadorId: top.id,
    titulo: 'confiança perigosa',
    descricao: 'terminou revelado como traidor na aliança',
  };
}

// ─── Destaques Arquivos ───────────────────────────────────────────────────────

function destaqueInvestigadorArquivos(
  jogadores: SessaoJogador[],
  _nomes: Map<PlayerId, string>,
): DestaqueJogador | null {
  const top = [...jogadores].sort(
    (a, b) =>
      (b.objetivosArquivosAlcancados ?? 0) -
      (a.objetivosArquivosAlcancados ?? 0),
  )[0];
  if (!top || (top.objetivosArquivosAlcancados ?? 0) < 1) return null;

  return {
    jogadorId: top.id,
    titulo: 'o melhor investigador',
    descricao: `alcançou o objetivo pessoal em arquivos`,
  };
}

function destaqueSegredoExpostoArquivos(
  jogadores: SessaoJogador[],
  _nomes: Map<PlayerId, string>,
): DestaqueJogador | null {
  const top = [...jogadores].sort(
    (a, b) =>
      (b.segredosExpostosArquivos ?? 0) - (a.segredosExpostosArquivos ?? 0),
  )[0];
  if (!top || (top.segredosExpostosArquivos ?? 0) < 1) return null;

  return {
    jogadorId: top.id,
    titulo: 'o exposto',
    descricao: 'o segredo foi percebido durante a investigação',
  };
}

function destaqueAgenteCampoArquivos(
  jogadores: SessaoJogador[],
  _nomes: Map<PlayerId, string>,
): DestaqueJogador | null {
  const top = [...jogadores].sort(
    (a, b) =>
      (b.acoesArquivosConcluidas ?? 0) - (a.acoesArquivosConcluidas ?? 0),
  )[0];
  if (!top || (top.acoesArquivosConcluidas ?? 0) < 2) return null;

  return {
    jogadorId: top.id,
    titulo: 'o agente de campo',
    descricao: `cumpriu ${top.acoesArquivosConcluidas} ações secretas em arquivos`,
  };
}

function gerarDestaquesJogadores(
  jogadores: SessaoJogador[],
  nomes: Map<PlayerId, string>,
): DestaqueJogador[] {
  const candidatos = [
    destaqueVezesVotado(jogadores, nomes),
    destaqueClutch(jogadores, nomes),
    destaqueJulgado(jogadores, nomes),
    destaquePontos(jogadores, nomes),
    destaqueColapso(jogadores, nomes),
    // Inquisição — destaques específicos
    destaqueContaminado(jogadores, nomes),
    destaqueAgenteDuplo(jogadores, nomes),
    destaqueEliminado(jogadores, nomes),
    // Faz Aí
    destaqueAcertosFazAi(jogadores, nomes),
    destaqueCaosFazAi(jogadores, nomes),
    destaqueAtuacaoDuvidosaFazAi(jogadores, nomes),
    // Aliança
    destaquePoliticoAlianca(jogadores, nomes),
    destaqueTraidorAlianca(jogadores, nomes),
    // Arquivos
    destaqueInvestigadorArquivos(jogadores, nomes),
    destaqueSegredoExpostoArquivos(jogadores, nomes),
    destaqueAgenteCampoArquivos(jogadores, nomes),
  ].filter((d): d is DestaqueJogador => d !== null);

  // Evita destacar a mesma pessoa duas vezes — mantém o primeiro destaque
  const vistos = new Set<PlayerId>();
  return candidatos
    .filter((d) => {
      if (vistos.has(d.jogadorId)) return false;
      vistos.add(d.jogadorId);
      return true;
    })
    .slice(0, 4);
}

// ─── Momento da sessão ────────────────────────────────────────────────────────

const PRIORIDADE_MOMENTO: Record<string, number> = {
  clutch: 100,
  virada: 90,
  unanimidade: 80,
  sobrevivente: 70,
  paranoia_total: 65,
  revelacao: 60,
  perfeito: 55,
  julgamento: 50,
  colapso_npl: 40,
  // Inquisição
  inversao: 88, // corrompidos venceram — foto da sessão poderosa
  colapso_inquisicao: 85, // grupo eliminou inocente — momento mais doloroso
  corrupcao_revelada: 75, // conversão revelada — tensão social alta
  paranoia_maxima: 68, // empate caótico — ninguém chegou a um acordo
  // Faz Aí
  surto_faz_ai: 82,
  vergonha_coletiva: 72,
  identificacao_imediata: 62,
  atuacao_duvidosa: 48,
  // Aliança
  missao_sabotada_alianca: 86,
  rejeicao_em_cadeia_alianca: 74,
  confianca_restaurada_alianca: 58,
  // Arquivos
  teoria_quebrada_arquivos: 83, // nova evidência derruba teoria — virada forte
  caso_resolvido_arquivos: 89, // caso fechado — payoff coletivo de alto impacto
  caso_fracassou_arquivos: 79, // fracasso investigativo — memorable por frustração
  objetivo_exposto_arquivos: 76, // segredo revelado — exposição pessoal
  acao_secreta_gerou_suspeita_arquivos: 67, // comportamento suspeito na mesa
};

function escolherMomentoDaSessao(momentos: Momento[]): Momento | null {
  if (momentos.length === 0) return null;

  return [...momentos].sort(
    (a, b) =>
      (PRIORIDADE_MOMENTO[b.tipo] ?? 0) - (PRIORIDADE_MOMENTO[a.tipo] ?? 0),
  )[0];
}

// ─── Frase final ──────────────────────────────────────────────────────────────

function gerarFraseFinal(sessao: ReturnType<typeof getSessaoAtual>): string {
  if (!sessao) return 'sessão encerrada.';

  // Tenta usar callback do dossiê
  const callbackDossie = obterCallbackSimples('dossie', sessao);
  if (callbackDossie) return callbackDossie;

  // Fallback genérico
  const jogos = sessao.jogosDaSessao.filter(
    (j) => j.finalizadoEm !== null,
  ).length;
  const min = Math.round((Date.now() - sessao.iniciadoEm) / 60000);
  return `${jogos} ${jogos === 1 ? 'jogo' : 'jogos'} em ${min} minutos.`;
}

// ─── API pública ──────────────────────────────────────────────────────────────

/**
 * Gera o dossiê completo da sessão atual.
 * Retorna null se não há sessão ou nenhum jogo completo.
 */
export function gerarDossie(): DossieDoCapos | null {
  const sessao = getSessaoAtual();
  if (!sessao) return null;

  const jogosCompletos = sessao.jogosDaSessao.filter(
    (j) => j.finalizadoEm !== null,
  );
  if (jogosCompletos.length === 0) return null;

  const nomes = new Map(
    sessao.jogadores.map((j) => [j.id as PlayerId, j.nome]),
  );
  const duracaoMs = (sessao.finalizadoEm ?? Date.now()) - sessao.iniciadoEm;

  return {
    sessaoId: sessao.id,
    duracaoMinutos: Math.round(duracaoMs / 60000),
    totalJogos: jogosCompletos.length,
    temperatura: sessao.temperatura,
    grupoIdentidade: sessao.grupoIdentidade,
    destaquesJogadores: gerarDestaquesJogadores(sessao.jogadores, nomes),
    momentoDaSessao: escolherMomentoDaSessao(sessao.momentosMemoraveis),
    fraseFinal: gerarFraseFinal(sessao),
  };
}
