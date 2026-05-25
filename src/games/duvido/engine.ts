/**
 * DUVIDO — ENGINE PURO
 *
 * Lógica de jogo sem efeito colateral.
 * Sem React, sem Firebase, sem navegação.
 *
 * Contrato:
 *   processarEvento(estado, evento, ranking) → novo EstadoDuvido
 *
 * A única responsabilidade deste módulo é a máquina de estados do Duvido.
 * Seleção de ranking, callbacks de sessão e estado React vivem em localEngine.ts.
 *
 * Regra de imutabilidade:
 *   Nenhuma função aqui muta o estado recebido.
 *   Todo retorno é um novo objeto.
 */

import type {
  ConfiguracaoDuvido,
  EstadoDuvido,
  EventoDuvido,
  JogadorDuvido,
  PlayerId,
  RankingDuvido,
  RankingPublicoDuvido,
  ResultadoDuvida,
} from './types';
import { criarJogadoresDuvido, proximoAtivoNoCirculo } from './types';

// ─────────────────────────────────────────────────────────────────────────────
// §1  NORMALIZAÇÃO
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Normaliza um item para comparação:
 *   - lowercase
 *   - remove diacríticos (ã → a, é → e, ç → c)
 *   - trim e colapsa espaços internos
 *
 * Usado em toda verificação de item — nunca comparar strings brutas.
 */
export function normalizarItem(item: string): string {
  return item
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .replace(/\s+/g, ' ');
}

// ─────────────────────────────────────────────────────────────────────────────
// §2  VERIFICAÇÃO DE ITEM
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Encontra a forma canônica de um item dentro do ranking.
 * Verifica itens canônicos e todas as variantes aceitas.
 * Retorna null se o item não pertencer ao ranking.
 *
 * @internal
 */
function encontrarCanônico(
  item: string,
  ranking: RankingDuvido,
): string | null {
  const normalizado = normalizarItem(item);

  // Checar itens canônicos diretamente
  for (const canônico of ranking.itens) {
    if (normalizarItem(canônico) === normalizado) return canônico;
  }

  // Checar variantes
  for (const [canônico, variantes] of Object.entries(ranking.variantes)) {
    for (const variante of variantes) {
      if (normalizarItem(variante) === normalizado) return canônico;
    }
  }

  return null;
}

/**
 * Constrói o Set de formas canônicas já usadas neste ranking.
 * Expande cada item dito para seu canônico — impede que "CR7" e
 * "Cristiano Ronaldo" sejam aceitos como itens distintos.
 *
 * @internal
 */
function buildCanônicosUsados(
  itensDitos: string[],
  ranking: RankingDuvido,
): Set<string> {
  const usados = new Set<string>();
  for (const itemDito of itensDitos) {
    const canônico = encontrarCanônico(itemDito, ranking);
    if (canônico) usados.add(canônico);
  }
  return usados;
}

/**
 * Verifica se um item é válido para o estado atual do jogo.
 *
 * Um item é válido quando:
 *   1. Pertence ao ranking (canônico ou variante reconhecida)
 *   2. Não foi confirmado ainda neste ranking (sem repetição de forma canônica)
 *
 * Exportado para uso na UI (hint visual antes de enviar o evento).
 */
export function verificarItem(
  item: string,
  ranking: RankingDuvido,
  itensDitos: string[],
): boolean {
  const canônico = encontrarCanônico(item, ranking);
  if (!canônico) return false;

  const usados = buildCanônicosUsados(itensDitos, ranking);
  return !usados.has(canônico);
}

/**
 * Verifica se um item já foi dito e confirmado neste ranking.
 * Atalho semântico para uso na UI.
 */
export function itemJaFoiDito(item: string, estado: EstadoDuvido, ranking: RankingDuvido): boolean {
  const canônico = encontrarCanônico(item, ranking);
  if (!canônico) return false;
  const usados = buildCanônicosUsados(estado.itensDitos, ranking);
  return usados.has(canônico);
}

// ─────────────────────────────────────────────────────────────────────────────
// §3  RESOLUÇÃO DE DÚVIDA
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Resolve o confronto gerado por um "Duvido".
 *
 * Lógica:
 *   - valido = item está no ranking E ainda não foi confirmado
 *   - Se valido: quem duvidou errou → duvidador eliminado
 *   - Se inválido: quem respondeu errou → respondedor eliminado
 *
 * Não muta estado — retorna apenas o resultado do confronto.
 */
export function resolverDuvida(
  item: string,
  ranking: RankingDuvido,
  itensDitos: string[],
  jogadorAtivoId: PlayerId,
  duvidadorId: PlayerId,
): ResultadoDuvida {
  const valido = verificarItem(item, ranking, itensDitos);
  const eliminadoId = valido ? duvidadorId : jogadorAtivoId;

  return {
    itemDito: item,
    itemNormalizado: normalizarItem(item),
    valido,
    eliminadoId,
    eliminadouPapel: eliminadoId === jogadorAtivoId ? 'respondeu' : 'duvidou',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// §4  CONVERSÃO PARA ESTADO PÚBLICO
// ─────────────────────────────────────────────────────────────────────────────

/** Extrai a versão pública do ranking (sem itens). */
export function toRankingPublico(ranking: RankingDuvido): RankingPublicoDuvido {
  return {
    id: ranking.id,
    titulo: ranking.titulo,
    fonte: ranking.fonte,
    tamanho: ranking.tamanho,
    categoria: ranking.categoria,
    dificuldade: ranking.dificuldade,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// §5  CRIAÇÃO DE ESTADO INICIAL
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Cria o estado inicial para o começo de um ranking.
 * Pode ser o primeiro ranking da sessão ou um ranking subsequente.
 *
 * Todos os jogadores iniciam ativos — eliminações de rankings anteriores
 * não carregam entre rankings (cada ranking é uma disputa independente).
 *
 * @param configuracao        Configuração da sessão
 * @param ranking             Ranking completo (com itens)
 * @param rankingAtual        Índice 0-based deste ranking na sessão
 * @param totalRankings       Total de rankings desta sessão
 * @param historicoAnterior   Histórico de rankings já jogados (passado entre rankings)
 */
export function criarEstadoInicial(
  configuracao: ConfiguracaoDuvido,
  ranking: RankingDuvido,
  rankingAtual: number,
  totalRankings: number,
  historicoAnterior: EstadoDuvido['historicoPorRanking'] = [],
): EstadoDuvido {
  const jogadores = criarJogadoresDuvido(configuracao);
  const ativos = jogadores.filter((j) => j.ativo);

  if (ativos.length < 2) {
    throw new Error(
      `[Duvido] criarEstadoInicial: mínimo de 2 jogadores necessário. Recebido: ${ativos.length}`,
    );
  }

  const primeiro = ativos[0]!;
  const segundo = proximoAtivoNoCirculo(jogadores, primeiro.posicaoCirculo);

  if (!segundo) {
    throw new Error(
      '[Duvido] criarEstadoInicial: não foi possível determinar o segundo jogador.',
    );
  }

  return {
    fase: 'exibindo_ranking',
    rankingAtual,
    totalRankings,
    rankingPublico: toRankingPublico(ranking),
    rankingRevelado: null,
    jogadores,
    jogadoresAtivos: ativos.map((j) => j.id),
    jogadorAtivoId: primeiro.id,
    proximoJogadorId: segundo.id,
    itensDitos: [],
    ultimoItemDito: null,
    resultadoDuvida: null,
    vencedorId: null,
    historicoPorRanking: historicoAnterior,
    configuracao,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// §6  HELPERS INTERNOS DO REDUCER
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Elimina um jogador e recalcula jogadoresAtivos.
 * Retorna o novo array de JogadorDuvido com o jogador marcado como inativo.
 * @internal
 */
function eliminarJogador(
  jogadores: JogadorDuvido[],
  eliminadoId: PlayerId,
  rankingAtual: number,
): JogadorDuvido[] {
  return jogadores.map((j) =>
    j.id === eliminadoId
      ? { ...j, ativo: false, eliminadoNoRanking: rankingAtual, eliminadoNaFase: 'revelando' }
      : j,
  );
}

/**
 * Calcula o próximo jogadorAtivoId e proximoJogadorId após uma mudança no círculo.
 *
 * Regras da corrente de pressão:
 *   - Após ACEITO: quem aceitou vira ativo. Próximo = ativo seguinte após ele.
 *   - Após DUVIDA CERTA (duvidador correto): respondedor eliminado.
 *     Duvidador vira ativo. Próximo = ativo seguinte após o duvidador.
 *   - Após DUVIDA ERRADA (duvidador errado): duvidador eliminado.
 *     Respondedor permanece ativo. Próximo = ativo seguinte após posição do eliminado.
 *
 * @internal
 */
function calcularProximaPressao(
  jogadores: JogadorDuvido[], // já com eliminado marcado como inativo
  novoAtivoId: PlayerId,
): { jogadorAtivoId: PlayerId; proximoJogadorId: PlayerId } | null {
  const novoAtivo = jogadores.find((j) => j.id === novoAtivoId);
  if (!novoAtivo) return null;

  const proximo = proximoAtivoNoCirculo(jogadores, novoAtivo.posicaoCirculo);
  if (!proximo) return null; // só 1 ativo — não deveria chegar aqui

  return { jogadorAtivoId: novoAtivo.id, proximoJogadorId: proximo.id };
}

// ─────────────────────────────────────────────────────────────────────────────
// §7  HANDLERS DE EVENTO
// ─────────────────────────────────────────────────────────────────────────────

function handleIniciarRanking(estado: EstadoDuvido): EstadoDuvido {
  if (estado.fase !== 'exibindo_ranking') return estado;
  return { ...estado, fase: 'aguardando_resposta' };
}

function handleItemDito(estado: EstadoDuvido, item: string): EstadoDuvido {
  if (estado.fase !== 'aguardando_resposta') return estado;
  if (!item.trim()) return estado;

  return {
    ...estado,
    fase: 'aguardando_decisao',
    ultimoItemDito: item.trim(),
  };
}

function handleAceito(
  estado: EstadoDuvido,
  ranking: RankingDuvido,
): EstadoDuvido {
  if (estado.fase !== 'aguardando_decisao') return estado;
  if (!estado.ultimoItemDito) return estado;

  // Item aceito sem desafio → entra nos confirmados
  const itensDitosAtualizado = [...estado.itensDitos, estado.ultimoItemDito];

  // Quem aceitou vira ativo — a pressão passa para ele
  const novoAtivoId = estado.proximoJogadorId;
  const jogadoresAtuais = estado.jogadores;

  const novoAtivo = jogadoresAtuais.find((j) => j.id === novoAtivoId);
  if (!novoAtivo) return estado;

  const proximo = proximoAtivoNoCirculo(jogadoresAtuais, novoAtivo.posicaoCirculo);
  if (!proximo) return estado;

  // Verificar se o ranking esgotou todos os itens possíveis
  const rankingEsgotado =
    buildCanônicosUsados(itensDitosAtualizado, ranking).size >= ranking.tamanho;

  if (rankingEsgotado) {
    // Caso raro: todos os itens foram ditos sem nenhuma dúvida
    // Não há vencedor por eliminação — encerra como reveal direto
    return {
      ...estado,
      fase: 'reveal_final',
      itensDitos: itensDitosAtualizado,
      ultimoItemDito: null,
      rankingRevelado: [...ranking.itens],
      vencedorId: novoAtivo.id, // quem aceitou o último item
    };
  }

  return {
    ...estado,
    fase: 'aguardando_resposta',
    itensDitos: itensDitosAtualizado,
    ultimoItemDito: null,
    jogadorAtivoId: novoAtivoId,
    proximoJogadorId: proximo.id,
  };
}

function handleDuvidado(
  estado: EstadoDuvido,
  ranking: RankingDuvido,
): EstadoDuvido {
  if (estado.fase !== 'aguardando_decisao') return estado;
  if (!estado.ultimoItemDito) return estado;

  const resultado = resolverDuvida(
    estado.ultimoItemDito,
    ranking,
    estado.itensDitos,
    estado.jogadorAtivoId,
    estado.proximoJogadorId,
  );

  return {
    ...estado,
    fase: 'revelando',
    resultadoDuvida: resultado,
  };
}

function handleConfirmarEliminacao(
  estado: EstadoDuvido,
  ranking: RankingDuvido,
): EstadoDuvido {
  if (estado.fase !== 'revelando') return estado;
  if (!estado.resultadoDuvida) return estado;

  const { eliminadoId, valido, itemDito } = estado.resultadoDuvida;

  // Aplicar eliminação
  const jogadoresAtualizado = eliminarJogador(
    estado.jogadores,
    eliminadoId,
    estado.rankingAtual,
  );
  const ativosRestantes = jogadoresAtualizado.filter((j) => j.ativo);

  // Item só entra nos confirmados se era válido
  const itensDitosAtualizado = valido
    ? [...estado.itensDitos, itemDito]
    : estado.itensDitos;

  // Último sobrevivente → reveal final
  if (ativosRestantes.length <= 1) {
    const vencedor = ativosRestantes[0] ?? null;
    return {
      ...estado,
      fase: 'reveal_final',
      jogadores: jogadoresAtualizado,
      jogadoresAtivos: ativosRestantes.map((j) => j.id),
      itensDitos: itensDitosAtualizado,
      ultimoItemDito: null,
      resultadoDuvida: null,
      vencedorId: vencedor?.id ?? null,
      rankingRevelado: [...ranking.itens],
    };
  }

  // Determinar próximo par (jogadorAtivo, proximoJogador) após eliminação
  //
  // Se item era válido (duvidador errou → duvidador eliminado):
  //   Respondedor sobreviveu → continua ativo
  //   Próximo = ativo seguinte após posição do respondedor
  //
  // Se item era inválido (respondedor errou → respondedor eliminado):
  //   Duvidador estava certo → vira ativo
  //   Próximo = ativo seguinte após posição do duvidador

  const novoAtivoId = valido
    ? estado.jogadorAtivoId   // respondedor sobreviveu
    : estado.proximoJogadorId; // duvidador estava certo

  const pressao = calcularProximaPressao(jogadoresAtualizado, novoAtivoId);

  // Fallback defensivo — não deveria acontecer com ativosRestantes > 1
  if (!pressao) return estado;

  return {
    ...estado,
    fase: 'aguardando_resposta',
    jogadores: jogadoresAtualizado,
    jogadoresAtivos: ativosRestantes.map((j) => j.id),
    itensDitos: itensDitosAtualizado,
    ultimoItemDito: null,
    resultadoDuvida: null,
    jogadorAtivoId: pressao.jogadorAtivoId,
    proximoJogadorId: pressao.proximoJogadorId,
  };
}

function handleConfirmarRevealFinal(
  estado: EstadoDuvido,
  ranking: RankingDuvido,
): EstadoDuvido {
  if (estado.fase !== 'reveal_final') return estado;

  const novoHistorico: EstadoDuvido['historicoPorRanking'] = [
    ...estado.historicoPorRanking,
    {
      rankingId: ranking.id,
      vencedorId: estado.vencedorId ?? '',
      totalEliminacoes:
        estado.jogadores.filter((j) => !j.ativo).length,
      itensDitos: estado.itensDitos,
    },
  ];

  return {
    ...estado,
    fase: 'finalizado',
    historicoPorRanking: novoHistorico,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// §8  PROCESSADOR PRINCIPAL DE EVENTOS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Reducer principal do jogo Duvido.
 *
 * Recebe o estado atual, um evento do UI e o ranking completo.
 * Retorna o novo estado — nunca muta o estado recebido.
 *
 * Eventos inválidos para a fase atual retornam o estado inalterado.
 * A UI pode confiar que estados impossíveis não são produzidos.
 *
 * @param estado  Estado público atual
 * @param evento  Evento disparado pelo UI
 * @param ranking Ranking completo (com itens) — mantido pelo localEngine
 */
export function processarEvento(
  estado: EstadoDuvido,
  evento: EventoDuvido,
  ranking: RankingDuvido,
): EstadoDuvido {
  switch (evento.tipo) {
    case 'IniciarRanking':
      return handleIniciarRanking(estado);

    case 'ItemDito':
      return handleItemDito(estado, evento.item);

    case 'Aceito':
      return handleAceito(estado, ranking);

    case 'Duvidado':
      return handleDuvidado(estado, ranking);

    case 'ConfirmarEliminacao':
      return handleConfirmarEliminacao(estado, ranking);

    case 'ConfirmarRevealFinal':
      return handleConfirmarRevealFinal(estado, ranking);
  }
}
