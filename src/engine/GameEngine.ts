import type {
  GameAction,
  GameConfig,
  GamePhase,
  GameState,
  Player,
  PlayerId,
} from '@/engine/types';

/**
 * Engine abstrato que todo jogo deve estender.
 *
 * @template TPublic Estado público da partida (visível a todos).
 * @template TPrivate Estado privado por jogador (palavra secreta, cartas, etc.).
 * @template TAction União de ações suportadas pelo jogo.
 */
export abstract class GameEngine<
  TPublic = unknown,
  TPrivate = unknown,
  TAction extends GameAction = GameAction,
> {
  /** Metadados estáticos do jogo (id, nome, limites de jogadores). */
  abstract readonly config: GameConfig;

  /**
   * Constrói o estado inicial da partida quando o anfitrião dá o "iniciar".
   * Responsabilidades típicas: sortear papéis, palavras, ordem de turnos.
   * `opcoes` é o payload de configuração específico do jogo (categoria,
   * dificuldade, etc.). O engine deve narrar/validar internamente.
   */
  abstract criarEstadoInicial(
    jogadores: Player[],
    anfitriaoId: PlayerId,
    opcoes?: unknown,
  ): GameState<TPublic, TPrivate>;

  /**
   * Aplica uma ação de jogador, retornando o novo estado.
   * Deve ser puro: nunca mutar `estado`; sempre retornar um objeto novo.
   */
  abstract processarAcao(
    estado: GameState<TPublic, TPrivate>,
    acao: TAction,
  ): GameState<TPublic, TPrivate>;

  /**
   * Avança a fase do jogo (ex.: playing → voting).
   * Chamado automaticamente quando `deveAvancarFase` retorna `true`.
   */
  abstract avancarFase(
    estado: GameState<TPublic, TPrivate>,
  ): GameState<TPublic, TPrivate>;

  /** Verdadeiro quando a partida tem vencedor(es) definido(s). */
  abstract verificarFim(estado: GameState<TPublic, TPrivate>): boolean;

  /**
   * Hook opcional: o engine consulta antes de avançar fase automaticamente.
   * Padrão: nunca avança sem ação explícita do jogo.
   */
  deveAvancarFase(_estado: GameState<TPublic, TPrivate>): boolean {
    return false;
  }

  /**
   * Hook opcional: validação adicional de ação antes de processar.
   * Padrão: bloqueia se a fase não for `playing` ou `voting`.
   */
  podeProcessarAcao(
    estado: GameState<TPublic, TPrivate>,
    _acao: TAction,
  ): boolean {
    return estado.fase === 'playing' || estado.fase === 'voting';
  }

  /**
   * Hook opcional: define se um jogador pode entrar dada a fase atual.
   * Padrão: só permite entrar durante o lobby.
   */
  podeEntrar(
    estado: GameState<TPublic, TPrivate>,
    _jogador: Player,
  ): boolean {
    return estado.fase === 'lobby';
  }

  /**
   * Helper para subclasses: retorna o estado com fase trocada e timestamp atualizado.
   * Mantém imutabilidade do estado original.
   */
  protected comFase(
    estado: GameState<TPublic, TPrivate>,
    novaFase: GamePhase,
  ): GameState<TPublic, TPrivate> {
    return { ...estado, fase: novaFase, atualizadoEm: Date.now() };
  }
}
