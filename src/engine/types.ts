/** Identificador único de um jogador dentro de uma sala. */
export type PlayerId = string;

/** Código curto da sala (ex.: "ABCD") usado para outros jogadores entrarem. */
export type RoomCode = string;

/** Identificador único de um jogo registrado no engine (ex.: "mrwhite"). */
export type GameId = string;

/**
 * Fases pelas quais uma partida pode passar.
 * - `lobby`: aguardando jogadores entrarem na sala.
 * - `playing`: rodada em andamento, jogadores executando ações do jogo.
 * - `voting`: jogadores estão votando (eliminação, escolha, etc.).
 * - `results`: partida encerrada, exibindo resultado final.
 */
export type GamePhase = 'lobby' | 'playing' | 'voting' | 'results';

/** Jogador dentro de uma sala. */
export interface Player {
  id: PlayerId;
  nome: string;
  /** Papel secreto atribuído pelo jogo (ex.: "Mr White", "Civil"). Visível só ao próprio jogador. */
  papelSecreto: string | null;
  /** Se o anfitrião tem permissões especiais (iniciar partida, expulsar, etc.). */
  ehAnfitriao: boolean;
  estaConectado: boolean;
  entrouEm: number;
}

/** Configuração estática de um jogo — metadados que não mudam por partida. */
export interface GameConfig {
  id: GameId;
  nome: string;
  descricao: string;
  minJogadores: number;
  maxJogadores: number;
  /** Tempo máximo (segundos) de cada rodada. `null` significa sem limite. */
  tempoDeRodadaSegundos: number | null;
}

/**
 * Estado de uma partida em curso.
 * @template TPublic Estado visível para todos os jogadores.
 * @template TPrivate Estado específico de cada jogador (palavra secreta, mão de cartas, etc.).
 */
export interface GameState<TPublic = unknown, TPrivate = unknown> {
  fase: GamePhase;
  rodada: number;
  /** Jogador de quem é a vez. `null` quando a fase não tem turno definido. */
  jogadorAtualId: PlayerId | null;
  /** Dados públicos da partida, visíveis a todos. */
  estadoPublico: TPublic;
  /** Dados privados por jogador. Só o próprio jogador deve enxergar o seu. */
  estadosPrivados: Record<PlayerId, TPrivate>;
  vencedorIds: PlayerId[];
  iniciadoEm: number;
  atualizadoEm: number;
}

/** Sala persistida no banco em tempo real — agrega jogadores e estado de jogo. */
export interface Room<TState extends GameState = GameState> {
  codigo: RoomCode;
  jogoId: GameId;
  anfitriaoId: PlayerId;
  jogadores: Record<PlayerId, Player>;
  estado: TState;
  criadoEm: number;
  atualizadoEm: number;
}

/**
 * Eventos em tempo real emitidos pelo engine durante a partida.
 * Útil para feeds, notificações na tela e replays.
 */
export type GameEvent =
  | { tipo: 'jogador_entrou'; jogador: Player; em: number }
  | { tipo: 'jogador_saiu'; jogadorId: PlayerId; em: number }
  | {
      tipo: 'fase_mudou';
      faseAnterior: GamePhase;
      novaFase: GamePhase;
      em: number;
    }
  | { tipo: 'rodada_iniciou'; rodada: number; em: number }
  | { tipo: 'acao_executada'; jogadorId: PlayerId; acaoTipo: string; em: number }
  | {
      tipo: 'voto_registrado';
      eleitorId: PlayerId;
      alvoId: PlayerId;
      em: number;
    }
  | { tipo: 'partida_finalizada'; vencedorIds: PlayerId[]; em: number };

/** Ação genérica enviada por um jogador. Cada jogo define seu próprio tipo. */
export interface GameAction<TPayload = unknown> {
  tipo: string;
  jogadorId: PlayerId;
  payload: TPayload;
  em: number;
}
