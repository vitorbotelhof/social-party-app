/**
 * Sugestão de próximo jogo — baseada na taxonomia viva do catálogo.
 *
 * A recomendação combina:
 * - temperatura emocional da sessão
 * - identidade do grupo
 * - histórico de jogos já jogados
 * - variação de mecânica/categoria em relação ao jogo atual
 * - perfil de descoberta do jogo
 *
 * A intenção não é prever gosto como e-commerce. É agir como host social:
 * ler o estado da sala e sugerir uma próxima energia.
 */

import { JOGOS, type DefinicaoJogo } from '@/games/gameRegistry';
import type {
  CategoriaPrincipalId,
  IntencaoSocial,
  TagSocialId,
} from '@/games/taxonomia';
import { getSessaoAtual } from './sessionStore';
import type {
  GrupoIdentidade,
  SessionIdentity,
  TemperaturaEmocional,
} from './types';

export interface SugestaoJogoPontuada {
  jogo: DefinicaoJogo;
  pontuacao: number;
  motivos: string[];
}

const BONUS_FORTE = 6;
const BONUS_MEDIO = 3;
const BONUS_LEVE = 1.5;
const PENALIDADE_FORTE = -8;
const PENALIDADE_MEDIA = -4;
const PENALIDADE_LEVE = -2;

const ROTACAO_FALLBACK = [
  'mrwhite',
  'most-likely-to',
  'faz-ai',
  'na-ponta-da-lingua',
  'voce-me-conhece',
  'inquisicao',
] as const;

const CATEGORIAS_POR_TEMPERATURA: Record<
  TemperaturaEmocional,
  CategoriaPrincipalId[]
> = {
  frio: ['rapidos_para_esquentar', 'improviso_performance'],
  morno: [
    'rapidos_para_esquentar',
    'conhecimento_grupo',
    'improviso_performance',
  ],
  quente: ['votacao_exposicao', 'improviso_performance', 'blefe_deducao'],
  colapso: ['conhecimento_grupo', 'votacao_exposicao', 'confissoes_revelacoes'],
};

const TAGS_POR_GRUPO: Record<GrupoIdentidade, TagSocialId[]> = {
  caotico: ['gritaria', 'fisico', 'improviso', 'sem_vergonha'],
  competitivo: ['competitivo', 'blefe', 'deducao', 'votacao'],
  silencioso: ['rapido', 'baixo_texto', 'vergonha_leve', 'conversa'],
  eficiente: ['rapido', 'baixo_texto', 'competitivo'],
  paranoico: ['deducao', 'blefe', 'paranoia', 'segredo'],
  intimo: ['grupo_intimo', 'conversa', 'segredo', 'exposicao'],
  destrutivo: ['conversa', 'vergonha_leve', 'votacao'],
};

const INTENCOES_POR_TEMPERATURA: Record<
  TemperaturaEmocional,
  IntencaoSocial[]
> = {
  frio: ['aquecer', 'conectar'],
  morno: ['aquecer', 'conectar', 'gerar_historia'],
  quente: ['expor', 'provocar', 'gerar_historia'],
  colapso: ['conectar', 'aquecer', 'revelar'],
};

function jogosDisponiveis(): DefinicaoJogo[] {
  return JOGOS.filter((jogo) => jogo.disponivel);
}

function getJogo(id: string): DefinicaoJogo | null {
  return JOGOS.find((jogo) => jogo.id === id) ?? null;
}

function proximoFallback(jogoAtualId: string): DefinicaoJogo | null {
  const idx = ROTACAO_FALLBACK.indexOf(
    jogoAtualId as (typeof ROTACAO_FALLBACK)[number],
  );
  const inicio = idx >= 0 ? idx + 1 : 0;

  for (let offset = 0; offset < ROTACAO_FALLBACK.length; offset += 1) {
    const id = ROTACAO_FALLBACK[(inicio + offset) % ROTACAO_FALLBACK.length]!;
    const jogo = getJogo(id);
    if (jogo?.disponivel && jogo.id !== jogoAtualId) return jogo;
  }

  return null;
}

function idsJogosCompletos(sessao: SessionIdentity): string[] {
  return sessao.jogosDaSessao
    .filter((jogo) => jogo.finalizadoEm !== null)
    .map((jogo) => jogo.jogoId);
}

function contarOcorrencias(ids: string[], id: string): number {
  return ids.filter((item) => item === id).length;
}

function intersecao<T extends string>(a: readonly T[], b: readonly T[]): T[] {
  return a.filter((item) => b.includes(item));
}

function perfilIdealTemperatura(temp: TemperaturaEmocional) {
  if (temp === 'frio') {
    return { ritmoMin: 4, exposicaoMax: 3, complexidadeMax: 2 };
  }
  if (temp === 'morno') {
    return { ritmoMin: 3, exposicaoMax: 4, complexidadeMax: 3 };
  }
  if (temp === 'quente') {
    return { ritmoMin: 3, exposicaoMin: 3, complexidadeMax: 4 };
  }
  return {
    ritmoMin: 2,
    exposicaoMax: 4,
    complexidadeMax: 3,
    energiaFisicaMax: 3,
  };
}

function pontuarPerfilPorTemperatura(
  jogo: DefinicaoJogo,
  temperatura: TemperaturaEmocional,
): { pontos: number; motivos: string[] } {
  const p = jogo.descoberta;
  const ideal = perfilIdealTemperatura(temperatura);
  const exposicaoMin = ideal.exposicaoMin;
  const exposicaoMax = ideal.exposicaoMax;
  const energiaFisicaMax = ideal.energiaFisicaMax;
  let pontos = 0;
  const motivos: string[] = [];

  if (p.ritmo >= ideal.ritmoMin) {
    pontos += BONUS_LEVE;
    motivos.push('ritmo combina com a sessão');
  }
  if (exposicaoMin !== undefined && p.exposicao >= exposicaoMin) {
    pontos += BONUS_MEDIO;
    motivos.push('sobe a exposição no momento certo');
  }
  if (exposicaoMax !== undefined && p.exposicao <= exposicaoMax) {
    pontos += BONUS_MEDIO;
    motivos.push('reduz o peso social');
  }
  if (p.complexidade <= ideal.complexidadeMax) {
    pontos += BONUS_LEVE;
  } else {
    pontos += PENALIDADE_LEVE;
  }
  if (energiaFisicaMax !== undefined && p.energiaFisica > energiaFisicaMax) {
    pontos += PENALIDADE_MEDIA;
    motivos.push('evita exigir mais corpo agora');
  }

  return { pontos, motivos };
}

function pontuarTemperatura(
  jogo: DefinicaoJogo,
  temperatura: TemperaturaEmocional,
): { pontos: number; motivos: string[] } {
  const categorias = CATEGORIAS_POR_TEMPERATURA[temperatura];
  const intencoes = INTENCOES_POR_TEMPERATURA[temperatura];
  const categoriasCombinam = intersecao(jogo.categoriasPrincipais, categorias);
  let pontos = 0;
  const motivos: string[] = [];

  if (categoriasCombinam.length > 0) {
    pontos += BONUS_MEDIO + categoriasCombinam.length;
    motivos.push('categoria combina com a temperatura');
  }
  if (intencoes.includes(jogo.descoberta.intencaoSocial)) {
    pontos += BONUS_MEDIO;
    motivos.push('intenção social encaixa agora');
  }

  const perfil = pontuarPerfilPorTemperatura(jogo, temperatura);
  pontos += perfil.pontos;
  motivos.push(...perfil.motivos);

  return { pontos, motivos };
}

function pontuarIdentidadeGrupo(
  jogo: DefinicaoJogo,
  identidade: GrupoIdentidade | null,
): { pontos: number; motivos: string[] } {
  if (!identidade) return { pontos: 0, motivos: [] };

  const tagsDesejadas = TAGS_POR_GRUPO[identidade];
  const tagsCombinam = intersecao(jogo.tagsSociais, tagsDesejadas);
  let pontos = tagsCombinam.length * BONUS_LEVE;
  const motivos: string[] = [];

  if (tagsCombinam.length > 0) {
    motivos.push(`combina com grupo ${identidade}`);
  }

  if (identidade === 'silencioso' && jogo.descoberta.exposicao >= 5) {
    pontos += PENALIDADE_MEDIA;
  }
  if (
    identidade === 'paranoico' &&
    jogo.descoberta.mecanicaPrincipal === 'deducao'
  ) {
    pontos += BONUS_FORTE;
    motivos.push('usa a paranoia como mecânica');
  }
  if (identidade === 'intimo' && jogo.descoberta.conversaPosRodada >= 4) {
    pontos += BONUS_MEDIO;
    motivos.push('aproveita intimidade do grupo');
  }
  if (identidade === 'destrutivo' && jogo.descoberta.exposicao >= 5) {
    pontos += PENALIDADE_MEDIA;
    motivos.push('baixa a chance de se destruir de novo');
  }

  return { pontos, motivos };
}

function pontuarVariacao(
  jogo: DefinicaoJogo,
  jogoAtual: DefinicaoJogo | null,
): { pontos: number; motivos: string[] } {
  if (!jogoAtual) return { pontos: 0, motivos: [] };

  let pontos = 0;
  const motivos: string[] = [];
  const mesmaMecanica =
    jogo.descoberta.mecanicaPrincipal ===
    jogoAtual.descoberta.mecanicaPrincipal;
  const categoriasEmComum = intersecao(
    jogo.categoriasPrincipais,
    jogoAtual.categoriasPrincipais,
  );

  if (mesmaMecanica) {
    pontos += PENALIDADE_MEDIA;
  } else {
    pontos += BONUS_MEDIO;
    motivos.push('muda a dinâmica do grupo');
  }

  if (categoriasEmComum.length === 0) {
    pontos += BONUS_LEVE;
  } else if (categoriasEmComum.length >= 2) {
    pontos += PENALIDADE_LEVE;
  }

  return { pontos, motivos };
}

function pontuarHistorico(
  jogo: DefinicaoJogo,
  sessao: SessionIdentity,
): { pontos: number; motivos: string[] } {
  const jogados = idsJogosCompletos(sessao);
  const vezesJogado = contarOcorrencias(jogados, jogo.id);
  const ultimoJogado = jogados.at(-1);
  let pontos = 0;
  const motivos: string[] = [];

  if (vezesJogado === 0) {
    pontos += BONUS_MEDIO;
    motivos.push('traz uma dinâmica nova');
  } else {
    pontos += PENALIDADE_MEDIA * vezesJogado;
  }
  if (ultimoJogado === jogo.id) {
    pontos += PENALIDADE_FORTE;
  }

  return { pontos, motivos };
}

function pontuarTamanhoGrupo(
  jogo: DefinicaoJogo,
  sessao: SessionIdentity,
): { pontos: number; motivos: string[] } {
  const total = sessao.jogadores.length;
  if (total < jogo.minJogadores || total > jogo.maxJogadores) {
    return {
      pontos: PENALIDADE_FORTE,
      motivos: ['não encaixa tão bem no grupo'],
    };
  }

  const folgaMin = total - jogo.minJogadores;
  const folgaMax = jogo.maxJogadores - total;
  if (folgaMin >= 1 && folgaMax >= 1) {
    return { pontos: BONUS_LEVE, motivos: ['encaixa no tamanho do grupo'] };
  }

  return { pontos: 0, motivos: [] };
}

function pontuarDuracaoSessao(
  jogo: DefinicaoJogo,
  sessao: SessionIdentity,
): { pontos: number; motivos: string[] } {
  const minutos = Math.round((Date.now() - sessao.iniciadoEm) / 60000);
  if (minutos < 30) return { pontos: 0, motivos: [] };

  if (
    jogo.tagsSociais.includes('rapido') ||
    jogo.descoberta.complexidade <= 2
  ) {
    return {
      pontos: BONUS_LEVE,
      motivos: ['funciona bem sem alongar a sessão'],
    };
  }

  if (jogo.descoberta.complexidade >= 5) {
    return { pontos: PENALIDADE_LEVE, motivos: [] };
  }

  return { pontos: 0, motivos: [] };
}

function limitarMotivos(motivos: string[]): string[] {
  return [...new Set(motivos)].slice(0, 3);
}

function pontuarJogo(
  jogo: DefinicaoJogo,
  sessao: SessionIdentity,
  jogoAtual: DefinicaoJogo | null,
): SugestaoJogoPontuada {
  const partes = [
    pontuarTemperatura(jogo, sessao.temperatura),
    pontuarIdentidadeGrupo(jogo, sessao.grupoIdentidade),
    pontuarVariacao(jogo, jogoAtual),
    pontuarHistorico(jogo, sessao),
    pontuarTamanhoGrupo(jogo, sessao),
    pontuarDuracaoSessao(jogo, sessao),
  ];

  const base = jogo.destaque ? BONUS_LEVE : 0;
  const pontuacao = partes.reduce((acc, parte) => acc + parte.pontos, base);
  const motivos = limitarMotivos(partes.flatMap((parte) => parte.motivos));

  return { jogo, pontuacao, motivos };
}

export function sugerirProximosJogos(
  jogoAtualId: string,
  limite = 3,
): SugestaoJogoPontuada[] {
  const sessao = getSessaoAtual();
  if (!sessao || sessao.temperatura === 'frio') return [];

  const jogoAtual = getJogo(jogoAtualId);
  return jogosDisponiveis()
    .filter((jogo) => jogo.id !== jogoAtualId)
    .map((jogo) => pontuarJogo(jogo, sessao, jogoAtual))
    .sort((a, b) => b.pontuacao - a.pontuacao)
    .slice(0, limite);
}

/**
 * Retorna um jogo sugerido baseado no estado emocional da sessão.
 *
 * Retorna null se não há sessão, temperatura 'frio' ou nenhum jogo adequado.
 */
export function sugerirProximoJogo(jogoAtualId: string): DefinicaoJogo | null {
  const sugestao = sugerirProximosJogos(jogoAtualId, 1)[0];
  if (sugestao) return sugestao.jogo;

  const sessao = getSessaoAtual();
  if (!sessao || sessao.temperatura === 'frio') return null;

  return proximoFallback(jogoAtualId);
}
