/**
 * INQUISIÇÃO LOCAL — TIPOS (modo 1 celular)
 *
 * Separado propositalmente do contrato Firebase (types.ts raiz).
 * O modo local não usa Firebase, não usa realtime, não usa listeners.
 * Toda a informação vive em memória, no engine, neste processo.
 *
 * Convenção deste arquivo:
 *   - Tipos públicos (EstadoLocalPublico, ConfiguracaoLocal): UI lê
 *   - Tipos privados (PapelAtribuidoLocal): UI consulta pontualmente
 *   - Nenhum tipo aqui referencia Firebase ou realtime
 */

// ─────────────────────────────────────────────────────────────────────────────
// §1  PRIMITIVOS
// ─────────────────────────────────────────────────────────────────────────────

export type PlayerId = string;

/** Papel base do jogador. Corrompidos contaminados mantêm papel 'inocente'
 *  como papelOriginal, mas agem como corrompidos a partir da contaminação. */
export type PapelLocal = 'inocente' | 'corrompido' | 'guardiao';

/** Intensidade do jogo — determina guardião, protocolo de votação, mensagens. */
export type ModoLocal = 'leve' | 'padrao' | 'paranoia';

/** Tipo de ação noturna. Proteger é exclusivo do guardião. */
export type TipoAcaoLocal = 'eliminar' | 'contaminar' | 'proteger';

// ─────────────────────────────────────────────────────────────────────────────
// §2  FASES DO JOGO
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Máquina de estados do engine local.
 *
 * Fluxo canônico (loop ≥ 2):
 *   distribuindo_papeis
 *     → dia
 *     → chamando_votacao
 *     → revelando_eliminacao
 *     → aguardando_noite
 *     → noite_corrompidos        [4s — engine timer]
 *     → noite_guardioes          [4s — engine timer, sempre narrado]
 *     → encerrando_noite
 *     → distribuindo_papeis (próximo loop)
 *     → finalizado
 *
 * Eliminação por noite (silenciosa) encurta o caminho:
 *   noite_guardioes → encerrando_noite → distribuindo_papeis (sem revelacao_eliminacao)
 *
 * Eliminação por votação (pública) usa revelando_eliminacao.
 */
export type FaseLocal =
  | 'distribuindo_papeis'    // revelação sequencial, um jogador por vez
  | 'dia'                    // discussão livre, sem timer, host-driven
  | 'chamando_votacao'       // host registra o eliminado após apontamento físico
  | 'revelando_eliminacao'   // papel do eliminado visível, silêncio de absorção
  | 'aguardando_noite'       // beat entre revelação e início da noite
  | 'noite_corrompidos'      // janela de 4s — corrompido ativo age
  | 'noite_guardioes'        // janela de 4s — guardião age (narrado mesmo sem guardião)
  | 'encerrando_noite'       // mensagem ambígua — host lê em voz alta
  | 'finalizado';            // vencedor determinado

// ─────────────────────────────────────────────────────────────────────────────
// §3  ENTIDADES
// ─────────────────────────────────────────────────────────────────────────────

export interface JogadorLocal {
  id: PlayerId;
  nome: string;
}

export interface ConfiguracaoLocal {
  modo: ModoLocal;

  /** Guardião incluído. Leve → false. Padrão/Paranoia → true. */
  incluirGuardiao: boolean;

  /** Corrompidos iniciais. Engine garante máx floor(n/3). */
  numeroCorrompidosInicial: number;

  /**
   * Duração de cada janela de ação noturna em ms.
   * Fixo em 4000ms. Engine controla — nunca o UI.
   * Garantia de timing uniforme entre papéis.
   */
  duracaoJanelaNoiteMs: number;

  /**
   * Duração do auto-avanço na distribuição de papéis em ms.
   * UI controla — engine apenas fornece o valor de referência.
   * 3000ms default: tempo para ler papel + aliados + absorver.
   */
  duracaoDistribuicaoMs: number;
}

export interface EliminadoLocal {
  jogadorId: PlayerId;

  /** Papel revelado no momento da eliminação (votação). */
  papel: PapelLocal;

  /** Loop em que foi eliminado. */
  loop: number;

  /** Origem: votação pública ou eliminação noturna silenciosa. */
  origem: 'votacao' | 'noite';
}

// ─────────────────────────────────────────────────────────────────────────────
// §4  ESTADO PÚBLICO (lido pelo UI sem restrição)
// ─────────────────────────────────────────────────────────────────────────────

export interface EstadoDistribuicao {
  /** Índice do jogador atualmente revelando seu papel (0-based). */
  indiceAtual: number;

  /** Ordem de passagem do celular neste loop (IDs). */
  jogadoresOrdem: PlayerId[];
}

export interface EstadoLocalPublico {
  fase: FaseLocal;
  loop: number;

  /** IDs de jogadores ainda em jogo. */
  jogadoresAtivos: PlayerId[];

  /** Histórico de eliminados. */
  eliminados: EliminadoLocal[];

  /** Presente apenas na fase distribuindo_papeis. */
  distribuicao: EstadoDistribuicao | null;

  /**
   * Mensagem ambígua pós-noite.
   * Lida em voz alta pelo host. Plausível para qualquer resultado.
   * Presente durante encerrando_noite e mantida no estado durante dia.
   */
  mensagemNoite: string | null;

  /**
   * Eliminado aguardando reveal explícito (votação).
   * Presente apenas durante revelando_eliminacao.
   * Eliminações noturnas NÃO passam por este campo — são silenciosas.
   */
  eliminadoPendente: EliminadoLocal | null;

  vencedor: 'corrompidos' | 'inocentes' | null;
  revelacaoFinal: RevelacaoFinalLocal | null;
  configuracao: ConfiguracaoLocal;
  totalJogadores: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// §5  CONSULTAS PRIVADAS (UI acessa somente quando o celular está com o jogador)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Informação privada de um jogador específico.
 * NUNCA deixar visível para outros jogadores.
 * UI deve consultar engine.getPapelAtribuido(id) apenas na tela correta.
 */
export interface PapelAtribuidoLocal {
  papel: PapelLocal;

  /**
   * IDs dos outros corrompidos — apenas para papel corrompido.
   * Inocentes e guardião recebem array vazio.
   */
  aliados: PlayerId[];

  /**
   * Se este corrompido é o ator desta noite (rotação por loop).
   * Apenas relevante para papel corrompido.
   */
  isAtorNoite: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// §6  REVELAÇÃO FINAL
// ─────────────────────────────────────────────────────────────────────────────

export interface RevelacaoFinalLocal {
  papeisPorJogador: Record<
    PlayerId,
    {
      /** Papel no momento do encerramento (corrompido se foi contaminado). */
      papelFinal: PapelLocal;

      /** Papel com que iniciou o jogo. */
      papelOriginal: PapelLocal;

      /** Número do loop em que virou corrompido. null = sempre foi corrompido. */
      convertidoNoLoop: number | null;
    }
  >;
  totalLoops: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// §7  CALLBACKS DE SESSÃO
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Dados emitidos ao fim de cada loop para o sistema de sessão.
 *
 * Alinha com LoopInquisicao do adapter realtime — mesma semântica, sem
 * votosFinais (votação local é física, sem tracking por jogador).
 */
export interface LoopLocalResolvido {
  loop: number;

  /** Jogador eliminado por votação neste loop. null = nenhum. */
  eliminadoId: PlayerId | null;

  /** Papel do eliminado no momento da votação. */
  eliminadoEraPapel: PapelLocal | null;

  /** Total de jogadores ativos após a eliminação (antes da noite). */
  totalAtivos: number;

  /** Jogadores que serão convertidos para corrompidos no próximo loop. */
  contaminados: PlayerId[];

  /** Alvo da ação de eliminar (antes de bloqueio). null = sem ação. */
  eliminarAlvoId: PlayerId | null;

  /** Guardião bloqueou a eliminação noturna neste loop. */
  eliminarBloqueado: boolean;
}

/**
 * Dados emitidos quando o jogo encerra, para estatísticas e dossiê.
 */
export interface ResultadoLocalFinalizado {
  vencedor: 'inocentes' | 'corrompidos';
  totalLoops: number;
  totalJogadores: number;

  /** Papel original e loop de conversão por jogador. */
  papeisPorJogador: Record<
    PlayerId,
    {
      papelOriginal: PapelLocal;
      convertidoNoLoop: number | null;
    }
  >;

  /** Eliminações por votação em ordem cronológica. */
  eliminadosPorVotacao: Array<{
    jogadorId: PlayerId;
    loop: number;
    /** Papel no momento da eliminação — para detectar falsos positivos. */
    papelNoMomento: PapelLocal;
  }>;

  /** Número de ações noturnas executadas por corrompido (agente → contagem). */
  acoesCorrompidas: Record<PlayerId, number>;
}

// ─────────────────────────────────────────────────────────────────────────────
// §8  FACTORY DE CONFIGURAÇÃO
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Cria a configuração padrão para um modo e número de jogadores.
 * Ponto de entrada canônico — evita configurações inconsistentes.
 */
export function criarConfiguracaoLocal(
  modo: ModoLocal,
  numJogadores: number,
): ConfiguracaoLocal {
  return {
    modo,
    incluirGuardiao: modo !== 'leve',
    numeroCorrompidosInicial: numJogadores >= 8 ? 2 : 1,
    duracaoJanelaNoiteMs: 4_000,
    duracaoDistribuicaoMs: 4_000,
  };
}
