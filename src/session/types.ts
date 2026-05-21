import type { CategoriaEmocional } from '@/games/gameRegistry';
import type { GameId, PlayerId } from '@/engine/types';
import type { IntensidadeInquisicao } from '@/games/inquisicao/types';

// ─── Re-export ────────────────────────────────────────────────────────────────
// Vibe da sessão = categoria emocional escolhida ou detectada.
export type VibeId = CategoriaEmocional;

// ─── Temperatura emocional ────────────────────────────────────────────────────

/**
 * Estado emocional acumulado da sessão.
 *
 * frio    → início, primeiro jogo ainda não terminou
 * morno   → energia crescente, primeiro jogo completo
 * quente  → caos detectado, momentos acumulando
 * colapso → temperatura máxima — grupo perdeu o controle
 */
export type TemperaturaEmocional = 'frio' | 'morno' | 'quente' | 'colapso';

// ─── Identidade do grupo ──────────────────────────────────────────────────────

/**
 * Padrão dominante de comportamento do grupo, detectado pelo sistema.
 * Influencia callbacks, pacing e dossiê.
 */
export type GrupoIdentidade =
  | 'caotico'
  | 'competitivo'
  | 'silencioso'
  | 'eficiente'
  | 'paranoico'
  | 'intimo'
  | 'destrutivo';

// ─── Momentos memoráveis ──────────────────────────────────────────────────────

/**
 * Tipos de momento que o sistema detecta e armazena.
 * Cada tipo alimenta callbacks, identidade de grupo e dossiê.
 */
export type TipoMomento =
  | 'unanimidade'         // todos votaram na mesma pessoa (MLT ou voting)
  | 'clutch'              // Mr White adivinhou corretamente
  | 'sobrevivente'        // Mr White sobreviveu múltiplas rodadas de votação
  | 'colapso_npl'         // NPL: turno com mais falhas que acertos
  | 'paranoia_total'      // votação caótica / empate geral — ninguém acorda
  | 'julgamento'          // MLT: prompt de alta exposição com consenso rápido
  | 'revelacao'           // resultado inesperado — coalizão que ninguém esperava
  | 'virada'              // Mr White venceu após estar em vantagem dos civis
  | 'perfeito'            // NPL: turno sem nenhuma falha
  // ── Inquisição ──────────────────────────────────────────────────────────────
  | 'corrupcao_revelada'  // inocente foi convertido — grupo encolheu por dentro
  | 'inversao'            // corrompidos venceram — grupo dominado pela corrupção
  | 'paranoia_maxima'     // votação empatada / sem maioria — ninguém eliminado
  | 'colapso_inquisicao'  // grupo votou e eliminou um inocente por engano
  // ── Você Me Conhece? ────────────────────────────────────────────────────────
  | 'leitura_perfeita_vmc' // todos previram corretamente a escolha do ranqueador
  | 'desconhecido_vmc'     // ninguém acertou — ranqueador é um mistério para o grupo
  | 'sinergia_vmc';        // >70% de acerto no jogo — grupo muito sincronizado

export interface Momento {
  id: string;
  tipo: TipoMomento;
  jogoId: GameId;
  /** Rodada dentro do jogo onde o momento ocorreu. */
  rodada: number;
  timestamp: number;
  /** Jogadores protagonistas do momento. */
  jogadoresIds: PlayerId[];
  /** Dados específicos do jogo — para o dossiê e callbacks. */
  dados: Record<string, unknown>;
}

// ─── Estatísticas de jogo dentro da sessão ───────────────────────────────────

export interface MrWhiteSessaoStats {
  mrWhiteIds: PlayerId[];
  vencedor: 'civis' | 'mrwhite' | null;
  rodadasVotacao: number;
  palpiteCorreto: boolean | null;
  totalJogadores: number;
}

export interface MLTSessaoStats {
  totalRodadas: number;
  unanimidades: number;
  julgadoMaisVezes: PlayerId | null;
  rodadasComEmpate: number;
}

export interface NPLSessaoStats {
  totalTurnos: number;
  melhorStreak: number;
  jogadorMaisAcertos: PlayerId | null;
  taxaAcerto: number; // 0.0–1.0
}

export interface InquisicaoSessaoStats {
  vencedor: 'inocentes' | 'corrompidos';
  totalLoops: number;
  intensidade: IntensidadeInquisicao;
  totalContaminacoes: number;
  /** Inocentes/guardiões eliminados por voto (falsos positivos). */
  eliminadosInocentes: number;
  /** Corrompidos eliminados por voto (acertos). */
  eliminadosCorrompidos: number;
}

export interface VMCSessaoStats {
  totalRodadas: number;
  leiturasPerfeitasTotal: number;
  desconhecidosTotal: number;
  melhorLeitorId: string | null;
  menosPrevistoId: string | null;
  /** IDs das categorias jogadas nesta partida. */
  categorias: string[];
}

export interface JogoSessao {
  jogoId: GameId;
  iniciadoEm: number;
  finalizadoEm: number | null;
  momentos: Momento[];

  mrWhite?: MrWhiteSessaoStats;
  mlt?: MLTSessaoStats;
  npl?: NPLSessaoStats;
  inquisicao?: InquisicaoSessaoStats;
  vmc?: VMCSessaoStats;
}

// ─── Jogador na sessão ────────────────────────────────────────────────────────

/**
 * Perfil acumulado do jogador ao longo de toda a sessão.
 * Alimenta destaques do dossiê e callbacks personalizados.
 */
export interface SessaoJogador {
  id: PlayerId;
  nome: string;

  // MLT
  vezesJulgado: number;   // foi o mais votado em uma rodada MLT

  // Mr White — votação
  vezesVotado: number;    // recebeu votos na eliminação do Mr White

  // Mr White — papel
  clutchsMrWhite: number; // acertou a palavra como Mr White

  // NPL
  colapsos: number;       // turnos com mais falhas que acertos
  pontosTotais: number;   // pontos acumulados no NPL

  // Inquisição
  vezesEliminado: number;   // foi eliminado por votação do grupo
  vezesContaminado: number; // foi convertido para corrompido durante a noite
  acoesCorrompidas: number; // executou ações noturnas como corrompido

  // Você Me Conhece?
  acertosLeitura: number;   // acertou a previsão sobre o ranqueador
  vezesDesconhecido: number; // foi ranqueador e ninguém acertou sua escolha
}

// ─── Sessão ───────────────────────────────────────────────────────────────────

/**
 * Identidade viva da sessão social.
 * Unidade principal do sistema — agrupa todos os jogos da noite.
 */
export interface SessionIdentity {
  id: string;
  iniciadoEm: number;
  finalizadoEm: number | null;

  jogadores: SessaoJogador[];

  /** Vibe escolhida pelo grupo na home antes de começar. */
  vibeSelecionada: VibeId | null;
  /** Vibe detectada pelo sistema a partir dos padrões de jogo. */
  vibeDetectada: VibeId | null;

  temperatura: TemperaturaEmocional;
  grupoIdentidade: GrupoIdentidade | null;

  jogosDaSessao: JogoSessao[];
  momentosMemoraveis: Momento[];

  /** IDs de callbacks já disparados — garante que não repetem. */
  callbacksUsados: string[];

  /** Número total de rodadas jogadas em todos os jogos. */
  totalRodadas: number;
}

// ─── Dossiê do Caos ──────────────────────────────────────────────────────────

export interface DestaqueJogador {
  jogadorId: PlayerId;
  /** Ex.: "o mais suspeito", "o grande julgado", "o sobrevivente" */
  titulo: string;
  /** Ex.: "recebeu 7 votos no mr white" */
  descricao: string;
}

export interface DossieDoCapos {
  sessaoId: string;
  duracaoMinutos: number;
  totalJogos: number;
  temperatura: TemperaturaEmocional;
  grupoIdentidade: GrupoIdentidade | null;

  /** Até 4 destaques individuais. */
  destaquesJogadores: DestaqueJogador[];
  /** Melhor momento da noite — para a "foto da sessão". */
  momentoDaSessao: Momento | null;
  /** Frase final que resume o grupo. Tom: host, não narrador. */
  fraseFinal: string;
}

// ─── Callback Engine ──────────────────────────────────────────────────────────

export type MomentoCallback =
  | 'pos_jogo'        // logo após um jogo terminar
  | 'entre_jogos'     // na tela de seleção entre jogos
  | 'pos_resultado'   // após reveal de resultado dentro de um jogo
  | 'dossie';         // no dossiê final

export interface CallbackTemplate {
  id: string;
  momento: MomentoCallback;
  /** Maior prioridade = exibido primeiro quando múltiplos se qualificam. */
  prioridade: number;
  /** Retorna true se este callback se aplica ao estado atual da sessão. */
  condicao: (sessao: SessionIdentity) => boolean;
  /**
   * Gera o texto do callback.
   * Tom: observação direta de host social — não teatral, não IA.
   * Exemplo correto: "vocês continuam piorando."
   * Exemplo errado:  "Que rodada ÉPICA foi essa! 🔥"
   */
  gerar: (sessao: SessionIdentity, nomes: Map<PlayerId, string>) => string;
}
