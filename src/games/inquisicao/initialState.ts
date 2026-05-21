/**
 * INQUISIÇÃO — ESTADO INICIAL E UTILITÁRIOS DE FASE
 *
 * Cria o EstadoFirebaseInquisicao que o host escreve em /estado
 * ao iniciar uma partida. Fornece também utilitários de timer,
 * condição de vitória e construção de atualizações parciais de fase.
 *
 * Responsabilidade: estado PÚBLICO apenas.
 *   Estado privado (papéis, aliados)   → roleDistribution.ts
 *   Resolução de noite e corrupção     → nightResolution.ts
 *   Resolução de votação               → votingResolution.ts
 *
 * Fluxo de inicialização (responsabilidade do host/service):
 *   1. distribuirPapeis(jogadores, intensidade) → ResultadoDistribuicao
 *   2. criarEstadoInicial(distribuicao.configuracao, jogadores) → EstadoFirebaseInquisicao
 *   3. Escrever /estado, /privados/{id}, /noiteControle atomicamente no Firebase
 *
 * Estrutura de um loop completo:
 *   revelando_papeis (só no loop 1)
 *   → conversa → votando → apurando → noite → conversa (loop N+1) → …
 *                                                ↓
 *                                          finalizado
 */

import type { Player, PlayerId } from '@/engine/types';
import type {
  ConfiguracaoPartida,
  EstadoFirebaseInquisicao,
  ResultadoPartida,
  SubFaseInquisicao,
} from '@/games/inquisicao/types';

// ─────────────────────────────────────────────────────────────────────────────
// §1  CONSTANTES DE DURAÇÃO DE FASE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Duração fixa da fase de revelação de papéis (ms).
 *
 * Fixo e não configurável por intensidade: todos precisam do mesmo tempo.
 * 30 segundos é generoso para evitar stress de abertura — o jogo ainda
 * não começou, não há pressão social a criar aqui.
 */
const DURACAO_REVELANDO_PAPEIS_MS = 30_000;

/**
 * Duração da fase de votação (ms).
 *
 * Fixo: tempo suficiente para votar sem abrir espaço para deliberação
 * prolongada. A deliberação acontece na fase de conversa — aqui é decisão.
 * Timer curto cria pressão e evita "votação parlamentar".
 */
const DURACAO_VOTANDO_MS = 30_000;

/**
 * Duração da fase de apuração do resultado da votação (ms).
 *
 * 7s: tempo suficiente para absorver o resultado emocionalmente antes
 * de avançar para a noite. 5s era curto demais — a eliminação chegava
 * antes do grupo processar quem havia sido eliminado.
 */
const DURACAO_APURANDO_MS = 7_000;

// ─────────────────────────────────────────────────────────────────────────────
// §2  CÁLCULO DE PRAZO DE FASE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calcula o timestamp Unix (ms) de deadline para uma sub-fase.
 *
 * Retorna null apenas para 'finalizado' — partida encerrada, sem timer.
 * Todas as outras fases têm timer automático para evitar bloqueio caso
 * um jogador desconecte ou não interaja.
 *
 * Timers por sub-fase:
 *   revelando_papeis → 30s fixo (visualização de papel — início de partida)
 *   conversa         → configuracao.duracaoConversaSegundos (30–50s por intensidade)
 *   votando          → 30s fixo (pressão de decisão)
 *   apurando         → 7s fixo (absorção emocional da eliminação)
 *   noite            → configuracao.duracaoNoiteMaxSegundos (12–15s por intensidade)
 *   finalizado       → null (permanece até jogadores saírem explicitamente)
 *
 * O host é o único responsável por avançar fases quando o timer expira.
 * Clientes usam este valor apenas para exibição de contagem regressiva.
 *
 * @param subFase      Sub-fase para calcular o prazo.
 * @param configuracao Configuração da partida (intensidade já aplicada).
 * @param agora        Timestamp base para o cálculo (Unix ms).
 */
export function calcularPrazoFase(
  subFase: SubFaseInquisicao,
  configuracao: ConfiguracaoPartida,
  agora: number,
): number | null {
  switch (subFase) {
    case 'revelando_papeis':
      return agora + DURACAO_REVELANDO_PAPEIS_MS;

    case 'conversa':
      return agora + configuracao.duracaoConversaSegundos * 1_000;

    case 'votando':
      return agora + DURACAO_VOTANDO_MS;

    case 'apurando':
      return agora + DURACAO_APURANDO_MS;

    case 'noite':
      return agora + configuracao.duracaoNoiteMaxSegundos * 1_000;

    case 'finalizado':
      return null;
  }
}

/**
 * Verifica se o timer de uma fase expirou.
 *
 * O host chama este predicado em seu loop de monitoramento (setInterval).
 * Quando retorna true, o host avança a sub-fase imediatamente.
 *
 * 'finalizado' nunca expira — partida encerrada permanece encerrada.
 * prazoFaseEm === null indica fase sem timer (nunca deve ocorrer fora de 'finalizado').
 *
 * @param prazoFaseEm Timestamp de prazo do estado atual.
 * @param subFase     Sub-fase atual (guard contra 'finalizado').
 * @param agora       Timestamp atual para comparação.
 */
export function deveAvancarPorTimer(
  prazoFaseEm: number | null,
  subFase: SubFaseInquisicao,
  agora: number,
): boolean {
  if (subFase === 'finalizado') return false;
  if (prazoFaseEm === null) return false;
  return agora >= prazoFaseEm;
}

// ─────────────────────────────────────────────────────────────────────────────
// §3  CONDIÇÃO DE VITÓRIA
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Verifica se a condição de vitória foi atingida dado o estado atual.
 *
 * Condições do game design:
 *   Inocentes vencem:  todos os corrompidos eliminados (corrompidosVivos === 0)
 *   Corrompidos vencem: corrompidosVivos >= inocentesVivos
 *
 * "Inocentes" aqui significa todos os não-corrompidos: inocentes + guardião.
 * O guardião sempre pertence à facção dos inocentes enquanto não convertido.
 * Após conversão, passa para corrompidosAtuais (atualizado pelo host).
 *
 * Parâmetros derivados de fontes distintas (privado vs. público):
 *   jogadoresAtivos   → /estado/jogadoresAtivos (público — todos leem)
 *   corrompidosAtuais → /noiteControle/corrompidosAtuais (privado — só host lê)
 *
 * Este helper é chamado pelo host após cada eliminação ou conversão.
 *
 * Exemplos:
 *   4 ativos, 2 corrompidos, 2 inocentes → 2 >= 2 → corrompidos vencem ✓
 *   4 ativos, 1 corrompido, 3 inocentes  → 1 >= 3 → false → continua ✓
 *   3 ativos, 2 corrompidos, 1 inocente  → 2 >= 1 → corrompidos vencem ✓
 *   3 ativos, 0 corrompidos, 3 inocentes → 0 === 0 → inocentes vencem ✓
 *
 * @param jogadoresAtivos   IDs dos jogadores ainda na partida.
 * @param corrompidosAtuais IDs de todos os corrompidos atuais (originais + convertidos).
 * @returns 'inocentes' | 'corrompidos' | null (partida continua)
 */
export function verificarCondicaoVitoria(
  jogadoresAtivos: readonly PlayerId[],
  corrompidosAtuais: readonly PlayerId[],
): ResultadoPartida | null {
  // Corrompidos vivos = interseção entre corrompidosAtuais e jogadoresAtivos.
  // Um corrompido convertido eliminado não conta — já saiu de jogadoresAtivos.
  const corrompidosVivos = corrompidosAtuais.filter((id) =>
    jogadoresAtivos.includes(id),
  );

  // Inocentes vencem: nenhum corrompido restante
  if (corrompidosVivos.length === 0) return 'inocentes';

  const inocentesVivos = jogadoresAtivos.length - corrompidosVivos.length;

  // Corrompidos vencem: igualam ou superam inocentes
  if (corrompidosVivos.length >= inocentesVivos) return 'corrompidos';

  return null; // partida continua
}

/**
 * Retorna os IDs dos jogadores da facção vencedora.
 *
 * Usado pelo host para preencher EstadoFirebaseInquisicao.vencedorIds
 * ao finalizar a partida.
 *
 * @param vencedor          Facção vencedora (nunca null — chamar só após vitória confirmada).
 * @param corrompidosAtuais IDs de todos os corrompidos (originais + convertidos).
 * @param todosJogadorIds   IDs de TODOS os jogadores (ativos + eliminados).
 */
export function obterIdsDosVencedores(
  vencedor: ResultadoPartida,
  corrompidosAtuais: readonly PlayerId[],
  todosJogadorIds: readonly PlayerId[],
): PlayerId[] {
  if (vencedor === 'corrompidos') {
    // Todos os corrompidos (ativos e eliminados) são vencedores.
    // Corrompidos eliminados "venceram" retroativamente — fizeram parte do plano.
    return todosJogadorIds.filter((id) => corrompidosAtuais.includes(id));
  }

  // Inocentes: todos os não-corrompidos (ativos e eliminados que sempre foram inocentes).
  // Corrompidos convertidos não são vencedores mesmo que sejam inocentes originais.
  return todosJogadorIds.filter((id) => !corrompidosAtuais.includes(id));
}

// ─────────────────────────────────────────────────────────────────────────────
// §4  VALIDAÇÃO DE ENTRADA
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validação mínima para criação do estado inicial.
 *
 * roleDistribution.ts já valida extensivamente a lista de jogadores
 * (contagem, IDs únicos, nomes não-vazios). Aqui apenas garantimos que
 * não criamos um estado com lista vazia ou IDs duplicados por engano.
 */
function validarJogadoresParaInicio(jogadores: readonly Player[]): void {
  if (jogadores.length === 0) {
    throw new Error('[InitialState] Lista de jogadores vazia.');
  }

  const ids = jogadores.map((j) => j.id);
  const idsUnicos = new Set(ids);
  if (idsUnicos.size !== ids.length) {
    const duplicados = ids.filter((id, idx) => ids.indexOf(id) !== idx);
    throw new Error(
      `[InitialState] IDs de jogadores duplicados: ${duplicados.join(', ')}.`,
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// §5  CRIAÇÃO DO ESTADO INICIAL
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Cria o EstadoFirebaseInquisicao inicial da partida.
 *
 * Estado resultante:
 *   fase:     'playing'          — partida em andamento
 *   loop:     1                  — primeiro loop
 *   subFase:  'revelando_papeis' — todos visualizam seus papéis privados
 *   prazoFaseEm: agora + 30s    — timer automático de revelação
 *
 * Campos zerados intencionalmente:
 *   eliminados:    []    — nenhuma eliminação ainda
 *   votacaoAtual:  null  — votação não iniciada
 *   eventoAtivo:   null  — sem evento ativo no início
 *   vencedor:      null  — partida em andamento
 *
 * O host escreve este objeto em /salas/{codigo}/estado.
 *
 * Nota: estadosPrivados é sempre {} neste nó — estados privados vivem em
 * /salas/{codigo}/privados/{playerId} e são escritos separadamente.
 *
 * @param configuracao  ConfiguracaoPartida gerada por roleDistribution.ts.
 * @param jogadores     Lista completa de jogadores participantes.
 * @param agora         Timestamp Unix ms. Injetável para testes (default: Date.now()).
 *
 * @throws {Error} Se jogadores está vazio ou tem IDs duplicados.
 */
export function criarEstadoInicial(
  configuracao: ConfiguracaoPartida,
  jogadores: readonly Player[],
  agora: number = Date.now(),
): EstadoFirebaseInquisicao {
  validarJogadoresParaInicio(jogadores);

  const jogadorIds: PlayerId[] = jogadores.map((j) => j.id);
  const subFaseInicial: SubFaseInquisicao = 'revelando_papeis';

  return {
    // ── Compatibilidade com engine genérico ─────────────────────────────────
    fase: 'playing',
    rodada: 0,
    jogadorAtualId: null,
    estadosPrivados: {},       // estados privados vivem em /privados/{id}

    // ── Configuração ─────────────────────────────────────────────────────────
    configuracao,              // imutável durante toda a partida

    // ── Progressão ───────────────────────────────────────────────────────────
    loop: 1,
    subFase: subFaseInicial,

    // ── Jogadores ────────────────────────────────────────────────────────────
    jogadoresAtivos: jogadorIds,
    eliminados: [],

    // ── Votação ──────────────────────────────────────────────────────────────
    votacaoAtual: null,

    // ── Eventos ──────────────────────────────────────────────────────────────
    eventoAtivo: null,

    // ── Comunicação do sistema ───────────────────────────────────────────────
    mensagemDoSistema: null,

    // ── Timer ────────────────────────────────────────────────────────────────
    prazoFaseEm: calcularPrazoFase(subFaseInicial, configuracao, agora),

    // ── Fim de partida ───────────────────────────────────────────────────────
    vencedor: null,
    vencedorIds: [],
    revelacaoFinal: null,

    // ── Timestamps ───────────────────────────────────────────────────────────
    iniciadoEm: agora,
    atualizadoEm: agora,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// §6  HELPERS DE TRANSIÇÃO DE FASE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Campos opcionais que podem mudar em uma transição de fase.
 *
 * O caller passa apenas o que muda — o restante é calculado automaticamente
 * (subFase, prazoFaseEm, atualizadoEm sempre mudam em toda transição).
 */
export interface ExtrasTransicaoFase {
  /** Novo número de loop. Passado quando o loop incrementa (pós-noite → nova conversa). */
  loop?: number;

  /**
   * Votação atual. Passado explicitamente como null para limpar ao iniciar
   * nova conversa (loop N+1 começa sem votação ativa).
   */
  votacaoAtual?: EstadoFirebaseInquisicao['votacaoAtual'];

  /** Evento social ativo no início da fase. null para limpar evento anterior. */
  eventoAtivo?: EstadoFirebaseInquisicao['eventoAtivo'];

  /**
   * Mensagem ambígua do sistema.
   * Sempre escrita pelo host após resolução de noite ou votação.
   * null para limpar mensagem anterior.
   */
  mensagemDoSistema?: EstadoFirebaseInquisicao['mensagemDoSistema'];

  /**
   * Lista atualizada de jogadores ativos.
   * Passada após eliminação (votação ou noite).
   */
  jogadoresAtivos?: EstadoFirebaseInquisicao['jogadoresAtivos'];

  /**
   * Histórico de eliminações atualizado.
   * Passado junto com jogadoresAtivos após eliminação.
   */
  eliminados?: EstadoFirebaseInquisicao['eliminados'];

  /** Vencedor — passado ao finalizar a partida. */
  vencedor?: EstadoFirebaseInquisicao['vencedor'];

  /** IDs dos jogadores vencedores — passado junto com vencedor. */
  vencedorIds?: EstadoFirebaseInquisicao['vencedorIds'];

  /** Revelação final — passada ao finalizar. */
  revelacaoFinal?: EstadoFirebaseInquisicao['revelacaoFinal'];
}

/**
 * Constrói as atualizações parciais para uma transição de sub-fase.
 *
 * O host usa este objeto com Firebase update() — merge parcial, não
 * substituição total. Apenas os campos que mudam são incluídos.
 *
 * Campos que mudam em TODA transição (sempre incluídos):
 *   subFase, prazoFaseEm, atualizadoEm
 *
 * Campos condicionais (incluídos apenas se passados em extras):
 *   loop, votacaoAtual, eventoAtivo, mensagemDoSistema,
 *   jogadoresAtivos, eliminados, vencedor, vencedorIds, revelacaoFinal
 *
 * Uso típico:
 *   // Avançar conversa → votando
 *   const upd = criarAtualizacaoFase('votando', config, agora, {
 *     votacaoAtual: novaVotacaoEmAndamento,
 *     mensagemDoSistema: null,
 *   });
 *   await update(ref(db, `/salas/${codigo}/estado`), upd);
 *
 *   // Avançar noite → nova conversa (loop seguinte)
 *   const upd = criarAtualizacaoFase('conversa', config, agora, {
 *     loop: estadoAtual.loop + 1,
 *     votacaoAtual: null,
 *     eventoAtivo: proximoEvento,
 *     mensagemDoSistema: 'algo mudou.',
 *     jogadoresAtivos: [...ativos],
 *     eliminados: [...historico],
 *   });
 */
export function criarAtualizacaoFase(
  subFase: SubFaseInquisicao,
  configuracao: ConfiguracaoPartida,
  agora: number,
  extras: ExtrasTransicaoFase = {},
): Partial<EstadoFirebaseInquisicao> {
  const base: Partial<EstadoFirebaseInquisicao> = {
    subFase,
    prazoFaseEm: calcularPrazoFase(subFase, configuracao, agora),
    atualizadoEm: agora,
  };

  // Merge apenas dos extras fornecidos — undefined não sobrescreve Firebase
  if (extras.loop !== undefined)              base.loop              = extras.loop;
  if (extras.votacaoAtual !== undefined)      base.votacaoAtual      = extras.votacaoAtual;
  if (extras.eventoAtivo !== undefined)       base.eventoAtivo       = extras.eventoAtivo;
  if (extras.mensagemDoSistema !== undefined) base.mensagemDoSistema = extras.mensagemDoSistema;
  if (extras.jogadoresAtivos !== undefined)   base.jogadoresAtivos   = extras.jogadoresAtivos;
  if (extras.eliminados !== undefined)        base.eliminados        = extras.eliminados;
  if (extras.vencedor !== undefined)          base.vencedor          = extras.vencedor;
  if (extras.vencedorIds !== undefined)       base.vencedorIds       = extras.vencedorIds;
  if (extras.revelacaoFinal !== undefined)    base.revelacaoFinal    = extras.revelacaoFinal;

  return base;
}
