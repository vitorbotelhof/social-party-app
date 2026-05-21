/**
 * INQUISIÇÃO — DISTRIBUIÇÃO DE PAPÉIS  (versão final de produção)
 *
 * Módulo puro de distribuição de papéis e criação de estado inicial privado.
 *
 * Princípios:
 *   - Funções puras sem efeitos colaterais (exceto o embaralhamento)
 *   - Falha rápido com mensagens de erro descritivas
 *   - Nenhuma informação privada vaza entre jogadores
 *   - Todas as invariantes verificadas defensivamente após geração
 *
 * Uso típico pelo host:
 *   const resultado = distribuirPapeis(jogadores, 'padrao');
 *   // host escreve cada entrada de resultado.estadoPrivadoPorId individualmente:
 *   //   set(ref(db, `/privados/${id}`), resultado.estadoPrivadoPorId[id])
 *   // host escreve resultado.controleNoiteInicial em /noiteControle
 *   // host usa resultado.configuracao em /estado/configuracao
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * AVISO DE SEGURANÇA
 * ═══════════════════════════════════════════════════════════════════════════
 * estadoPrivadoPorId contém os papéis secretos de TODOS os jogadores.
 * NUNCA escrever o objeto inteiro em um nó Firebase acessível a clientes.
 * Cada entrada deve ser escrita no nó /privados/{playerId} individualmente.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import type { Player, PlayerId } from '@/engine/types';
import type {
  ConfiguracaoPartida,
  ControleNoiteInquisicao,
  EstadoPrivadoInquisicao,
  IntensidadeInquisicao,
  PapelInquisicao,
} from '@/games/inquisicao/types';
import { embaralhar, sortearUm } from '@/utils/random';

// ─────────────────────────────────────────────────────────────────────────────
// §1  CONSTANTES E LIMITES
// ─────────────────────────────────────────────────────────────────────────────

/** Limite mínimo de jogadores para iniciar uma partida. */
export const MIN_JOGADORES_INQUISICAO = 4;

/** Limite máximo de jogadores para iniciar uma partida. */
export const MAX_JOGADORES_INQUISICAO = 10;

/**
 * Loop mínimo para que uma conversão por corrupção possa ocorrer.
 *
 * No loop 1 não há confiança estabelecida para destruir — a mecânica
 * de corrupção requer que o grupo tenha criado alianças que valham
 * a pena quebrar.
 */
export const MIN_LOOP_PARA_CORRUPCAO = 2;

/**
 * Loops elegíveis para o sorteio do momento da PRIMEIRA corrupção.
 *
 * Janela 2–4:
 *   - Antes do loop 2: sem confiança para destruir.
 *   - Após o loop 4: paranoia já difusa, reinterpretação retroativa perde força.
 *
 * Usado exclusivamente em criarControleNoite (primeira conversão).
 * Para conversões subsequentes, usar sortearProximoLoopDeCorrupcao().
 */
const LOOPS_ELEGIVEIS_PRIMEIRA_CORRUPCAO = [2, 3, 4] as const;

// ─────────────────────────────────────────────────────────────────────────────
// §2  TABELA DE DISTRIBUIÇÃO BASE
//
// Frozen no PROMPT 2 do game design.
// Regra-mestra: corrompidos nunca > 1/3 do grupo.
//
// ⚠ ATENÇÃO (edge case documentado):
//   Paranoia + 6 jogadores = 2 corrompidos, 0 guardião, 4 inocentes.
//   Com maxCorrupcoes=2, uma ÚNICA conversão (loop 2) pode levar imediatamente
//   a 3 corrompidos vs 3 inocentes → vitória corrompidos no loop 2.
//   A partida pode encerrar antes de criar paranoia significativa.
//   Comportamento esperado pelo design (partida curta em paranoia), mas hosts
//   devem estar cientes ao selecionar paranoia com grupos pequenos.
// ─────────────────────────────────────────────────────────────────────────────

interface EntradaDistribuicao {
  readonly corrompidos: number;
  /** Guardião disponível neste player count (antes de aplicar modificadores de intensidade). */
  readonly temGuardiao: boolean;
}

/**
 * Distribuição base por número de jogadores.
 *
 * 'temGuardiao' indica disponibilidade pelo player count.
 * Modo paranoia sempre anula o guardião, independente desta tabela.
 *
 * Para 8–10 jogadores, seguimos floor conservador de N/3:
 *   8 → 2 (8/3 ≈ 2.67 — conservador)
 *   9 → 3 (9/3 = 3 — exato)
 *  10 → 3 (10/3 ≈ 3.33 — conservador)
 *
 * Invariante: todos os valores satisfazem corrompidos * 3 <= totalJogadores.
 */
const DISTRIBUICAO_BASE: Readonly<Record<number, EntradaDistribuicao>> = {
  4:  { corrompidos: 1, temGuardiao: false },
  5:  { corrompidos: 1, temGuardiao: false },
  6:  { corrompidos: 2, temGuardiao: true  },
  7:  { corrompidos: 2, temGuardiao: true  },
  8:  { corrompidos: 2, temGuardiao: true  },
  9:  { corrompidos: 3, temGuardiao: true  },
  10: { corrompidos: 3, temGuardiao: true  },
};

// ─────────────────────────────────────────────────────────────────────────────
// §3  CONFIGURAÇÕES POR INTENSIDADE
// ─────────────────────────────────────────────────────────────────────────────

interface ModificadoresIntensidade {
  /** Quantas conversões por corrupção são permitidas na partida inteira. */
  readonly maxCorrupcoes: number;

  /**
   * Guardião permitido nesta intensidade.
   * false = nunca existe guardião (paranoia).
   * true = depende do player count (tabela base).
   */
  readonly permiteGuardiao: boolean;

  readonly revelarPapelAoEliminar: boolean;
  readonly delayRevelacaoMs: number;
  readonly duracaoConversaSegundos: number;
  readonly duracaoNoiteMaxSegundos: number;
}

const MODIFICADORES_POR_INTENSIDADE: Readonly<
  Record<IntensidadeInquisicao, ModificadoresIntensidade>
> = {
  leve: {
    maxCorrupcoes: 0,
    permiteGuardiao: true,
    revelarPapelAoEliminar: true,
    delayRevelacaoMs: 0,
    duracaoConversaSegundos: 50,
    duracaoNoiteMaxSegundos: 15,
  },

  padrao: {
    maxCorrupcoes: 1,
    permiteGuardiao: true,
    revelarPapelAoEliminar: true,
    delayRevelacaoMs: 2000,
    duracaoConversaSegundos: 40,
    duracaoNoiteMaxSegundos: 15,
  },

  paranoia: {
    maxCorrupcoes: 2,
    permiteGuardiao: false, // nunca existe guardião em paranoia — design decision
    revelarPapelAoEliminar: false,
    delayRevelacaoMs: 0,    // irrelevante quando revelarPapelAoEliminar = false
    duracaoConversaSegundos: 30,
    duracaoNoiteMaxSegundos: 12,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// §4  TIPOS INTERNOS
// ─────────────────────────────────────────────────────────────────────────────

/** Resultado intermediário do cálculo + embaralhamento — uso interno. */
interface AtribuicaoPapeis {
  readonly corrompidoIds: readonly PlayerId[];
  readonly guardiaoId: PlayerId | null;
  readonly inocenteIds: readonly PlayerId[];
}

/**
 * Resultado completo exportado para o host.
 *
 * ⚠ AVISO DE SEGURANÇA — estadoPrivadoPorId:
 *   Contém os papéis secretos de TODOS os jogadores.
 *   NUNCA escrever o objeto inteiro em um nó Firebase acessível a clientes.
 *   Escrever cada entrada individualmente: /privados/{playerId}.
 *   Um write do objeto completo num nó público vaza todos os papéis.
 */
export interface ResultadoDistribuicao {
  /**
   * Configuração imutável da partida.
   * Escrever em /salas/{codigo}/estado/configuracao.
   */
  readonly configuracao: ConfiguracaoPartida;

  /**
   * Estado privado inicial de cada jogador.
   *
   * ⚠ ESCREVER UM A UM — não escrever o objeto inteiro num único nó.
   *
   * Correto:
   *   for (const [id, estado] of Object.entries(estadoPrivadoPorId)) {
   *     await set(ref(db, `/privados/${id}`), estado);
   *   }
   *
   * Errado (vaza todos os papéis):
   *   await set(ref(db, `/privados`), estadoPrivadoPorId);  // NÃO FAZER
   */
  readonly estadoPrivadoPorId: Readonly<Record<PlayerId, EstadoPrivadoInquisicao>>;

  /**
   * Estado inicial do controle de noite — exclusivo do host.
   * Escrever em /salas/{codigo}/noiteControle.
   * Protegido por Firebase Security Rules: somente o host lê/escreve.
   */
  readonly controleNoiteInicial: ControleNoiteInquisicao;
}

// ─────────────────────────────────────────────────────────────────────────────
// §5  VALIDAÇÃO DE ENTRADA
// ─────────────────────────────────────────────────────────────────────────────

function validarEntrada(jogadores: Player[]): void {
  const n = jogadores.length;

  if (n < MIN_JOGADORES_INQUISICAO) {
    throw new Error(
      `[RoleDistribution] Mínimo ${MIN_JOGADORES_INQUISICAO} jogadores. Recebido: ${n}.`,
    );
  }

  if (n > MAX_JOGADORES_INQUISICAO) {
    throw new Error(
      `[RoleDistribution] Máximo ${MAX_JOGADORES_INQUISICAO} jogadores. Recebido: ${n}.`,
    );
  }

  const ids = jogadores.map((j) => j.id);
  const idsUnicos = new Set(ids);
  if (idsUnicos.size !== ids.length) {
    const duplicados = ids.filter((id, idx) => ids.indexOf(id) !== idx);
    throw new Error(
      `[RoleDistribution] IDs duplicados detectados: ${duplicados.join(', ')}.`,
    );
  }

  for (const j of jogadores) {
    if (!j.id.trim()) {
      throw new Error('[RoleDistribution] Jogador com ID vazio detectado.');
    }
    if (!j.nome.trim()) {
      throw new Error(`[RoleDistribution] Jogador '${j.id}' tem nome vazio.`);
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// §6  CÁLCULO DE DISTRIBUIÇÃO
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calcula quantos corrompidos e se há guardião para esta combinação de
 * player count + intensidade.
 *
 * Hierarquia de regras:
 *   1. Tabela base define corrompidos e guardião pelo player count
 *   2. Modificadores de intensidade podem desativar guardião (paranoia)
 *   3. Intensidade nunca aumenta o número de corrompidos
 */
function calcularContagens(
  totalJogadores: number,
  intensidade: IntensidadeInquisicao,
): { totalCorrompidos: number; temGuardiao: boolean } {
  const base = DISTRIBUICAO_BASE[totalJogadores];

  if (!base) {
    throw new Error(
      `[RoleDistribution] Sem distribuição definida para ${totalJogadores} jogadores.`,
    );
  }

  const mod = MODIFICADORES_POR_INTENSIDADE[intensidade];
  const temGuardiao = mod.permiteGuardiao && base.temGuardiao;

  return { totalCorrompidos: base.corrompidos, temGuardiao };
}

/**
 * Embaralha os IDs dos jogadores e atribui papéis em sequência.
 *
 * Ordem de atribuição após embaralhamento:
 *   [0 .. totalCorrompidos-1] → corrompidos
 *   [totalCorrompidos]        → guardião (se houver)
 *   [restantes]               → inocentes
 *
 * O assert pós-shuffle protege contra bugs no embaralhamento que
 * retornariam menos elementos que o input.
 */
function atribuirPapeis(
  jogadorIds: readonly PlayerId[],
  totalCorrompidos: number,
  temGuardiao: boolean,
): AtribuicaoPapeis {
  const embaralhados = embaralhar(jogadorIds);

  // Assert defensivo: embaralhar() deve preservar o comprimento
  if (embaralhados.length !== jogadorIds.length) {
    throw new Error(
      `[RoleDistribution] embaralhar() retornou ${embaralhados.length} elementos ` +
      `para ${jogadorIds.length} jogadores — bug no embaralhamento.`,
    );
  }

  const corrompidoIds = embaralhados.slice(0, totalCorrompidos);
  const cursor = totalCorrompidos;

  let guardiaoId: PlayerId | null = null;
  let inocenteInicio = cursor;

  if (temGuardiao) {
    guardiaoId = embaralhados[cursor] ?? null;
    inocenteInicio = cursor + 1;
  }

  const inocenteIds = embaralhados.slice(inocenteInicio);

  return { corrompidoIds, guardiaoId, inocenteIds };
}

// ─────────────────────────────────────────────────────────────────────────────
// §7  CRIAÇÃO DE ConfiguracaoPartida
// ─────────────────────────────────────────────────────────────────────────────

function criarConfiguracao(
  totalJogadores: number,
  intensidade: IntensidadeInquisicao,
  temGuardiao: boolean,
): ConfiguracaoPartida {
  const mod = MODIFICADORES_POR_INTENSIDADE[intensidade];

  return {
    intensidade,
    totalJogadores,
    temGuardiao,
    maxCorrupcoes: mod.maxCorrupcoes,
    revelarPapelAoEliminar: mod.revelarPapelAoEliminar,
    delayRevelacaoMs: mod.delayRevelacaoMs,
    duracaoConversaSegundos: mod.duracaoConversaSegundos,
    duracaoNoiteMaxSegundos: mod.duracaoNoiteMaxSegundos,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// §8  CRIAÇÃO DE ESTADOS PRIVADOS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Cria o estado privado inicial de um corrompido original.
 *
 * corrompidosConhecidos: lista de todos os OUTROS corrompidos — nunca a si mesmo.
 * Invariante: o jogador não aparece em sua própria lista de aliados.
 */
function criarPrivadoCorrompido(
  jogadorId: PlayerId,
  todosCorrompidoIds: readonly PlayerId[],
  agora: number,
): EstadoPrivadoInquisicao {
  const aliados = todosCorrompidoIds.filter((id) => id !== jogadorId);

  return {
    papelOriginal: 'corrompido',
    convertidoNoLoop: null,  // corrompidos originais nunca foram convertidos
    corrompidosConhecidos: aliados,
    mensagemPrivada: null,
    mensagemLida: false,
    eventoPrivado: null,
    atualizadaEm: agora,
  };
}

/**
 * Cria o estado privado inicial do guardião.
 *
 * Guardião não conhece nenhum corrompido — age às cegas.
 * Isso é essencial por design: se o guardião soubesse quem é corrompido,
 * poderia proteger alvos de forma certeira, destruindo a paranoia.
 */
function criarPrivadoGuardiao(agora: number): EstadoPrivadoInquisicao {
  return {
    papelOriginal: 'guardiao',
    convertidoNoLoop: null,
    corrompidosConhecidos: [],
    mensagemPrivada: null,
    mensagemLida: false,
    eventoPrivado: null,
    atualizadaEm: agora,
  };
}

/**
 * Cria o estado privado inicial de um inocente.
 */
function criarPrivadoInocente(agora: number): EstadoPrivadoInquisicao {
  return {
    papelOriginal: 'inocente',
    convertidoNoLoop: null,
    corrompidosConhecidos: [],
    mensagemPrivada: null,
    mensagemLida: false,
    eventoPrivado: null,
    atualizadaEm: agora,
  };
}

/**
 * Monta o mapa completo de estados privados para todos os jogadores.
 * Cada entrada é independente e isolada das demais.
 */
function criarEstadosPrivados(
  atribuicao: AtribuicaoPapeis,
  agora: number,
): Record<PlayerId, EstadoPrivadoInquisicao> {
  const estados: Record<PlayerId, EstadoPrivadoInquisicao> = {};

  for (const id of atribuicao.corrompidoIds) {
    estados[id] = criarPrivadoCorrompido(id, atribuicao.corrompidoIds, agora);
  }

  if (atribuicao.guardiaoId !== null) {
    estados[atribuicao.guardiaoId] = criarPrivadoGuardiao(agora);
  }

  for (const id of atribuicao.inocenteIds) {
    estados[id] = criarPrivadoInocente(agora);
  }

  return estados;
}

// ─────────────────────────────────────────────────────────────────────────────
// §9  CRIAÇÃO DE ControleNoiteInquisicao
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Cria o controle de noite inicial para o host.
 *
 * ─── Agendamento de corrupção ────────────────────────────────────────────────
 *
 * proximoLoopDeCorrupcao armazena O PRÓXIMO loop em que a engine de night
 * resolution deve permitir uma ação de 'contaminar'. Após cada conversão:
 *
 *   1. Engine incrementa controle.totalCorrupcoes
 *   2. Se totalCorrupcoes < configuracao.maxCorrupcoes:
 *      engine chama sortearProximoLoopDeCorrupcao(loopAtual) e salva o resultado
 *      em controle.proximoLoopDeCorrupcao para agendar a próxima conversão.
 *   3. Se totalCorrupcoes >= configuracao.maxCorrupcoes:
 *      engine define controle.proximoLoopDeCorrupcao = null (esgotado).
 *
 * Este módulo agenda apenas a PRIMEIRA conversão (sorteia de [2, 3, 4]).
 * Conversões subsequentes são agendadas dinamicamente pela engine.
 *
 * ─── Edge case — corrupção que nunca ativa ───────────────────────────────────
 * Se a partida encerrar antes de atingir proximoLoopDeCorrupcao, a mecânica
 * de corrupção nunca é ativada. Resultado: partida paranoia sem conversão.
 * Comportamento esperado (o jogo terminou antes), mas pode ocorrer em games
 * rápidos com proximoLoopDeCorrupcao = 4 e inocentes muito eficientes.
 */
function criarControleNoite(
  corrompidoIds: readonly PlayerId[],
  totalCorrompidos: number,
  maxCorrupcoes: number,
): ControleNoiteInquisicao {
  const proximoLoopDeCorrupcao =
    maxCorrupcoes > 0
      ? sortearUm(LOOPS_ELEGIVEIS_PRIMEIRA_CORRUPCAO)
      : null;

  return {
    resolvidoLoop: null,
    tentandoResolver: false,
    tentativaEm: 0,
    corrompidosAtuais: [...corrompidoIds],
    totalCorrompidosInicial: totalCorrompidos,
    proximoLoopDeCorrupcao,
    totalCorrupcoes: 0,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// §10  VALIDAÇÃO DE INTEGRIDADE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Verifica invariantes matemáticos e estruturais da distribuição gerada.
 *
 * Rede de segurança para bugs de implementação. Em produção saudável, nunca
 * lança — os erros são para detectar regressões durante desenvolvimento.
 *
 * Invariantes verificados:
 *   1. Total de jogadores distribuídos = totalJogadores
 *   2. Estado privado existe para cada ID esperado (verificação bidirecional)
 *   3. papelOriginal de cada jogador é consistente com a atribuição
 *   4. Corrompido não se conhece a si mesmo
 *   5. TODOS os outros corrompidos estão na lista de aliados de cada corrompido
 *   6. Inocentes e guardião têm corrompidosConhecidos = []
 *   7. Corrompidos originais têm convertidoNoLoop = null
 *   8. Corrompidos nunca excedem 1/3 do grupo (aritmética inteira)
 */
function validarIntegridade(
  atribuicao: AtribuicaoPapeis,
  estados: Record<PlayerId, EstadoPrivadoInquisicao>,
  totalJogadores: number,
): void {
  // ── Invariante 1: contagem total ────────────────────────────────────────────
  const totalDistribuidos =
    atribuicao.corrompidoIds.length +
    (atribuicao.guardiaoId !== null ? 1 : 0) +
    atribuicao.inocenteIds.length;

  if (totalDistribuidos !== totalJogadores) {
    throw new Error(
      `[RoleDistribution] Contagem incorreta: ${totalDistribuidos} distribuídos para ${totalJogadores} jogadores.`,
    );
  }

  // ── Invariante 2: verificação bidirecional de IDs ─────────────────────────
  // Reconstrói lista de todos os IDs esperados da atribuição
  const todosIdsEsperados: PlayerId[] = [
    ...atribuicao.corrompidoIds,
    ...(atribuicao.guardiaoId !== null ? [atribuicao.guardiaoId] : []),
    ...atribuicao.inocenteIds,
  ];

  // Cada ID esperado deve ter um estado
  for (const id of todosIdsEsperados) {
    if (!(id in estados)) {
      throw new Error(
        `[RoleDistribution] Estado privado ausente para jogador '${id}'.`,
      );
    }
  }

  // Nenhum estado pode pertencer a um ID desconhecido
  for (const estadoId of Object.keys(estados)) {
    if (!todosIdsEsperados.includes(estadoId)) {
      throw new Error(
        `[RoleDistribution] Estado privado para ID não distribuído '${estadoId}'.`,
      );
    }
  }

  // ── Invariantes 3–5–7: corrompidos ───────────────────────────────────────
  for (const id of atribuicao.corrompidoIds) {
    const privado = estados[id]!; // existência garantida pelo invariante 2

    // Invariante 3: papelOriginal correto
    if (privado.papelOriginal !== 'corrompido') {
      throw new Error(
        `[RoleDistribution] '${id}' deveria ser corrompido, tem papelOriginal='${privado.papelOriginal}'.`,
      );
    }

    // Invariante 4: não se conhece a si mesmo
    if (privado.corrompidosConhecidos.includes(id)) {
      throw new Error(
        `[RoleDistribution] Corrompido '${id}' aparece em sua própria lista de aliados.`,
      );
    }

    // Invariante 5: TODOS os outros corrompidos estão na lista de aliados
    const aliados = privado.corrompidosConhecidos;
    const esperados = atribuicao.corrompidoIds.filter((outroId) => outroId !== id);

    if (aliados.length !== esperados.length) {
      throw new Error(
        `[RoleDistribution] Corrompido '${id}' tem ${aliados.length} aliados, ` +
        `esperado ${esperados.length}.`,
      );
    }

    for (const esperado of esperados) {
      if (!aliados.includes(esperado)) {
        throw new Error(
          `[RoleDistribution] Corrompido '${id}' deveria conhecer '${esperado}', mas não conhece.`,
        );
      }
    }

    // Invariante 7: corrompidos originais não foram convertidos
    if (privado.convertidoNoLoop !== null) {
      throw new Error(
        `[RoleDistribution] Corrompido original '${id}' não pode ter convertidoNoLoop !== null.`,
      );
    }
  }

  // ── Invariante 3–6: guardião ────────────────────────────────────────────
  if (atribuicao.guardiaoId !== null) {
    const privadoGuardiao = estados[atribuicao.guardiaoId]!;

    if (privadoGuardiao.papelOriginal !== 'guardiao') {
      throw new Error(
        `[RoleDistribution] Guardião '${atribuicao.guardiaoId}' tem papelOriginal='${privadoGuardiao.papelOriginal}'.`,
      );
    }

    if (privadoGuardiao.corrompidosConhecidos.length > 0) {
      throw new Error(
        `[RoleDistribution] Guardião '${atribuicao.guardiaoId}' não deveria conhecer corrompidos.`,
      );
    }
  }

  // ── Invariantes 3–6: inocentes ─────────────────────────────────────────
  for (const id of atribuicao.inocenteIds) {
    const privado = estados[id]!;

    if (privado.papelOriginal !== 'inocente') {
      throw new Error(
        `[RoleDistribution] '${id}' deveria ser inocente, tem papelOriginal='${privado.papelOriginal}'.`,
      );
    }

    if (privado.corrompidosConhecidos.length > 0) {
      throw new Error(
        `[RoleDistribution] Inocente '${id}' não deveria conhecer corrompidos.`,
      );
    }
  }

  // ── Invariante 8: regra de 1/3 (aritmética inteira — sem float) ─────────
  //
  // Equivalência:
  //   corrompidos / totalJogadores <= 1/3
  //   corrompidos * 3 <= totalJogadores  (sem divisão, sem imprecisão de float)
  //
  // Exemplos:
  //   2 corrompidos, 6 jogadores: 2*3=6 <= 6 → válido ✓
  //   3 corrompidos, 9 jogadores: 3*3=9 <= 9 → válido ✓
  //   4 corrompidos, 9 jogadores: 4*3=12 > 9 → inválido ✓
  if (atribuicao.corrompidoIds.length * 3 > totalJogadores) {
    throw new Error(
      `[RoleDistribution] ${atribuicao.corrompidoIds.length}/${totalJogadores} corrompidos ` +
      `violam a regra de 1/3 (${atribuicao.corrompidoIds.length}*3=${atribuicao.corrompidoIds.length * 3} > ${totalJogadores}).`,
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// §11  API PÚBLICA PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Distribui papéis e cria o estado inicial completo de uma partida do Inquisição.
 *
 * Função principal do módulo. Executa em sequência:
 *   1. Validação de entrada (jogadores, IDs únicos, nomes)
 *   2. Cálculo de contagens (corrompidos, guardião) pelo player count + intensidade
 *   3. Atribuição embaralhada de papéis (Fisher-Yates via embaralhar())
 *   4. Criação de ConfiguracaoPartida (pública, sem totalCorrompidos)
 *   5. Criação de estados privados individuais (papéis, aliados)
 *   6. Criação de controle de noite (scheduling da primeira corrupção)
 *   7. Validação de integridade (8 invariantes — rede de segurança)
 *
 * @param jogadores  Lista de jogadores. Mínimo 4, máximo 10.
 * @param intensidade Intensidade escolhida pelo host antes do início.
 * @param agora      Timestamp Unix ms. Injetável para testes (default: Date.now()).
 *
 * @returns ResultadoDistribuicao com tudo que o host precisa escrever no Firebase.
 *
 * @throws {Error} Se jogadores < 4 ou > 10.
 * @throws {Error} Se há IDs duplicados ou nomes inválidos.
 * @throws {Error} Se a distribuição gerada viola invariantes (bug de implementação).
 */
export function distribuirPapeis(
  jogadores: Player[],
  intensidade: IntensidadeInquisicao,
  agora: number = Date.now(),
): ResultadoDistribuicao {
  // ── Fase 1: Validação ─────────────────────────────────────────────────────
  validarEntrada(jogadores);

  const totalJogadores = jogadores.length;
  const jogadorIds = jogadores.map((j) => j.id);

  // ── Fase 2: Distribuição ──────────────────────────────────────────────────
  const { totalCorrompidos, temGuardiao } = calcularContagens(totalJogadores, intensidade);

  // ── Fase 3: Atribuição ────────────────────────────────────────────────────
  const atribuicao = atribuirPapeis(jogadorIds, totalCorrompidos, temGuardiao);

  // ── Fase 4: ConfiguracaoPartida ───────────────────────────────────────────
  const configuracao = criarConfiguracao(totalJogadores, intensidade, temGuardiao);

  // ── Fase 5: Estados privados ──────────────────────────────────────────────
  const estadoPrivadoPorId = criarEstadosPrivados(atribuicao, agora);

  // ── Fase 6: Controle de noite ─────────────────────────────────────────────
  const controleNoiteInicial = criarControleNoite(
    atribuicao.corrompidoIds,
    totalCorrompidos,
    configuracao.maxCorrupcoes,
  );

  // ── Fase 7: Validação de integridade ──────────────────────────────────────
  validarIntegridade(atribuicao, estadoPrivadoPorId, totalJogadores);

  return {
    configuracao,
    estadoPrivadoPorId,
    controleNoiteInicial,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// §12  SCHEDULING DE CORRUPÇÃO SUBSEQUENTE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sorteia o loop para a PRÓXIMA conversão por corrupção.
 *
 * Chamado pela engine de night resolution APÓS cada conversão bem-sucedida,
 * quando ainda restam conversões permitidas (totalCorrupcoes < maxCorrupcoes).
 *
 * Agenda a próxima conversão para 1 ou 2 loops a partir do loop atual,
 * criando imprevisibilidade para inocentes e corrompidos.
 *
 * Fluxo de uso pelo engine (nightResolution.ts):
 *   1. Conversão aplicada com sucesso
 *   2. controle.totalCorrupcoes++
 *   3. if (controle.totalCorrupcoes < config.maxCorrupcoes):
 *        controle.proximoLoopDeCorrupcao = sortearProximoLoopDeCorrupcao(loopAtual)
 *      else:
 *        controle.proximoLoopDeCorrupcao = null  // esgotado
 *
 * Distinção de LOOPS_ELEGIVEIS_PRIMEIRA_CORRUPCAO:
 *   - Primeira conversão: sorteada de [2, 3, 4] (janela de abertura)
 *   - Conversões seguintes: relativa ao loop atual + 1 ou + 2 (janela deslizante)
 *
 * @param loopAtual Loop em que a conversão ATUAL aconteceu.
 * @returns Loop em que a próxima conversão será permitida.
 */
export function sortearProximoLoopDeCorrupcao(loopAtual: number): number {
  return sortearUm([loopAtual + 1, loopAtual + 2] as const);
}

// ─────────────────────────────────────────────────────────────────────────────
// §13  HELPERS DE CONSULTA — USO PELO HOST
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Retorna o papel original de um jogador, ou null se o ID não existir.
 * Útil para queries pontuais sem iterar todos os estados.
 */
export function obterPapelDoJogador(
  estadoPrivadoPorId: Readonly<Record<PlayerId, EstadoPrivadoInquisicao>>,
  jogadorId: PlayerId,
): PapelInquisicao | null {
  return estadoPrivadoPorId[jogadorId]?.papelOriginal ?? null;
}

/**
 * Retorna os IDs dos corrompidos ORIGINAIS — somente os distribuídos no início.
 *
 * ⚠ NÃO inclui jogadores convertidos por corrupção mid-game.
 *
 * Para obter TODOS os corrompidos ativos (originais + convertidos), usar:
 *   ControleNoiteInquisicao.corrompidosAtuais
 *
 * Distinção crítica para o engine:
 *   "corrompidos originais" = papelOriginal === 'corrompido' (imutável)
 *   "corrompidos atuais"    = corrompidosAtuais em noiteControle (cresce com conversões)
 *
 * Usar "originais" para: reveal final, auditoria de distribuição.
 * Usar "atuais" para: condição de vitória, resolução de noite, conhecimento dos aliados.
 */
export function obterCorrompidosOriginais(
  estadoPrivadoPorId: Readonly<Record<PlayerId, EstadoPrivadoInquisicao>>,
): PlayerId[] {
  return Object.entries(estadoPrivadoPorId)
    .filter(([, privado]) => privado.papelOriginal === 'corrompido')
    .map(([id]) => id);
}

/**
 * Retorna o ID do guardião, ou null se não há guardião nesta partida.
 * null é esperado em: modo paranoia, partidas com 4–5 jogadores.
 */
export function obterGuardiao(
  estadoPrivadoPorId: Readonly<Record<PlayerId, EstadoPrivadoInquisicao>>,
): PlayerId | null {
  const entrada = Object.entries(estadoPrivadoPorId).find(
    ([, privado]) => privado.papelOriginal === 'guardiao',
  );
  return entrada ? (entrada[0] ?? null) : null;
}

/**
 * Retorna os IDs de todos os inocentes originais (incluindo guardião).
 *
 * ⚠ NÃO inclui jogadores convertidos (que tinham papelOriginal inocente/guardiao).
 *    Converted players mantêm papelOriginal inalterado — use corrompidosAtuais
 *    em noiteControle para saber quem age como corrompido em runtime.
 *
 * Usado principalmente para o reveal final.
 */
export function obterInocentesOriginais(
  estadoPrivadoPorId: Readonly<Record<PlayerId, EstadoPrivadoInquisicao>>,
): PlayerId[] {
  return Object.entries(estadoPrivadoPorId)
    .filter(([, privado]) => privado.papelOriginal !== 'corrompido')
    .map(([id]) => id);
}

// ─────────────────────────────────────────────────────────────────────────────
// §14  PREVIEW DE DISTRIBUIÇÃO
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Retorna informações SEGURAS para exibição pública na tela de configuração.
 *
 * NÃO inclui totalCorrompidos — exibir essa informação antes do jogo começar
 * transforma paranoia social em dedução lógica durante a partida.
 *
 * Adequado para: todos os jogadores verem na tela de lobby/configuração.
 *
 * @throws Se player count estiver fora do range válido.
 */
export function previewDistribuicaoPublico(
  totalJogadores: number,
  intensidade: IntensidadeInquisicao,
): {
  readonly temGuardiao: boolean;
  readonly maxCorrupcoes: number;
  readonly totalJogadores: number;
} {
  if (
    totalJogadores < MIN_JOGADORES_INQUISICAO ||
    totalJogadores > MAX_JOGADORES_INQUISICAO
  ) {
    throw new Error(
      `[RoleDistribution] Player count ${totalJogadores} fora do range (${MIN_JOGADORES_INQUISICAO}–${MAX_JOGADORES_INQUISICAO}).`,
    );
  }

  const { temGuardiao } = calcularContagens(totalJogadores, intensidade);
  const { maxCorrupcoes } = MODIFICADORES_POR_INTENSIDADE[intensidade];

  return { temGuardiao, maxCorrupcoes, totalJogadores };
}

/**
 * Retorna o breakdown completo da distribuição — incluindo totalCorrompidos.
 *
 * ⚠ HOST ONLY — não exibir este resultado para todos os jogadores.
 *   Expor totalCorrompidos destrói a mecânica de paranoia: o grupo passaria
 *   a fazer dedução lógica ("eliminamos 1, restam exatamente X") ao invés de
 *   viver a incerteza emocional central do Inquisição.
 *
 * Adequado para: painel interno do host, logs de debug, testes.
 *
 * @throws Se player count estiver fora do range válido.
 */
export function previewDistribuicaoParaHost(
  totalJogadores: number,
  intensidade: IntensidadeInquisicao,
): {
  readonly totalCorrompidos: number;
  readonly temGuardiao: boolean;
  readonly totalInocentes: number;
  readonly maxCorrupcoes: number;
} {
  if (
    totalJogadores < MIN_JOGADORES_INQUISICAO ||
    totalJogadores > MAX_JOGADORES_INQUISICAO
  ) {
    throw new Error(
      `[RoleDistribution] Player count ${totalJogadores} fora do range (${MIN_JOGADORES_INQUISICAO}–${MAX_JOGADORES_INQUISICAO}).`,
    );
  }

  const { totalCorrompidos, temGuardiao } = calcularContagens(totalJogadores, intensidade);
  const { maxCorrupcoes } = MODIFICADORES_POR_INTENSIDADE[intensidade];
  const guardiaoCount = temGuardiao ? 1 : 0;
  const totalInocentes = totalJogadores - totalCorrompidos - guardiaoCount;

  return { totalCorrompidos, temGuardiao, totalInocentes, maxCorrupcoes };
}

// ─────────────────────────────────────────────────────────────────────────────
// §15  PREDICADOS DE VALIDAÇÃO — EXPORTADOS PARA TESTES E ENGINE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Verifica se uma contagem de corrompidos respeita a regra de 1/3.
 *
 * Usa aritmética inteira para evitar imprecisão de float:
 *   corrompidos * 3 <= totalJogadores
 *   equivalente a: corrompidos / totalJogadores <= 1/3
 *
 * Exemplos:
 *   respeitaRegra1Terco(2, 6) → 2*3=6 <= 6 → true  ✓
 *   respeitaRegra1Terco(3, 9) → 3*3=9 <= 9 → true  ✓
 *   respeitaRegra1Terco(4, 9) → 4*3=12 > 9 → false ✓
 *
 * @param totalCorrompidos Número de corrompidos (originais ou atuais).
 * @param totalJogadores   Total de jogadores na partida.
 */
export function respeitaRegra1Terco(
  totalCorrompidos: number,
  totalJogadores: number,
): boolean {
  if (totalJogadores <= 0) return false;
  return totalCorrompidos * 3 <= totalJogadores;
}
