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
  | 'unanimidade' // todos votaram na mesma pessoa (MLT ou voting)
  | 'clutch' // Mr White adivinhou corretamente
  | 'sobrevivente' // Mr White sobreviveu múltiplas rodadas de votação
  | 'colapso_npl' // NPL: turno com mais falhas que acertos
  | 'paranoia_total' // votação caótica / empate geral — ninguém acorda
  | 'julgamento' // MLT: prompt de alta exposição com consenso rápido
  | 'revelacao' // resultado inesperado — coalizão que ninguém esperava
  | 'virada' // Mr White venceu após estar em vantagem dos civis
  | 'perfeito' // NPL: turno sem nenhuma falha
  // ── Inquisição ──────────────────────────────────────────────────────────────
  | 'corrupcao_revelada' // inocente foi convertido — grupo encolheu por dentro
  | 'inversao' // corrompidos venceram — grupo dominado pela corrupção
  | 'paranoia_maxima' // votação empatada / sem maioria — ninguém eliminado
  | 'colapso_inquisicao' // grupo votou e eliminou um inocente por engano
  // ── Você Me Conhece? ────────────────────────────────────────────────────────
  | 'leitura_perfeita_vmc' // todos previram corretamente a escolha do ranqueador
  | 'desconhecido_vmc' // ninguém acertou — ranqueador é um mistério para o grupo
  | 'sinergia_vmc' // >70% de acerto no jogo — grupo muito sincronizado
  // ── Faz Aí ─────────────────────────────────────────────────────────────────
  | 'surto_faz_ai' // carta absurda/caótica acertada rápido
  | 'vergonha_coletiva' // sequência com alta exposição social
  | 'atuacao_duvidosa' // turno com muitos passes e pouco acerto
  | 'identificacao_imediata' // carta reconhecida em poucos segundos
  // ── Aliança ────────────────────────────────────────────────────────────────
  | 'missao_sabotada_alianca' // missão aprovada falhou sem revelar autoria
  | 'confianca_restaurada_alianca' // equipe suspeita passou limpa
  | 'rejeicao_em_cadeia_alianca' // grupo recusou equipes em sequência
  // ── Duvido ─────────────────────────────────────────────────────────────────
  | 'leitura_perfeita_duvido' // duvidou de item inválido — leu o bluff corretamente
  | 'aposta_errada_duvido' // duvidou de item válido — pagou o preço
  // ── De 0 a 10 ──────────────────────────────────────────────────────────────
  | 'leitura_perfeita_d010'  // todos adivinhadores acertaram ±1 na mesma rodada
  | 'acerto_exato_d010'      // alguém acertou a nota exata (erro = 0)
  | 'grupo_perdido_d010';    // divergência ≥ 5 — grupo totalmente sem calibração

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

export interface FazAiSessaoStats {
  totalTurnos: number;
  totalCartas: number;
  jogadorMaisCaoticoId: PlayerId | null;
  quemMaisAcertaId: PlayerId | null;
  quemAtuaPiorId: PlayerId | null;
  energiaMediaGrupo: number;
  vergonhaColetiva: number;
  categoriasFavoritas: string[];
}

export interface DuvidoSessaoStats {
  /** Total de rankings jogados na sessão. */
  totalRankings: number;

  /** Total de confrontos "duvido" em toda a sessão. */
  totalDuvidas: number;

  /** IDs dos vencedores por ranking, em ordem de jogo. */
  vencedoresPorRanking: PlayerId[];

  /** Jogador com mais dúvidas certas — melhor leitor de bluff. null em empate. */
  melhorLeitorId: PlayerId | null;

  /** Jogador com mais itens aceitos sem ser duvidado — maior bluffador. null em empate. */
  maiorBlufferSemPunicaoId: PlayerId | null;

  /** Temperatura emocional calculada pelo engine local. */
  temperatura: 'competitivo' | 'caótico' | 'equilibrado';
}

export interface AliancaSessaoStats {
  vencedor: 'leais' | 'traidores';
  totalRodadas: number;
  totalJogadores: number;
  sucessosLeais: number;
  sabotagensTraidores: number;
  rejeicoesSeguidas: number;
  totalRejeicoes: number;
  missoesSabotadas: number;
  liderMaisAprovadoId: PlayerId | null;
  traidoresIds: PlayerId[];
}

export interface EuNuncaSessaoStats {
  totalCartas: number;
  cartasPuladas: number;
  categorias: string[];
  intensidadeMaxima: string | null;
  encerradaVoluntariamente: boolean;
  duracaoMs: number;
}

export interface QuemNaSalaSessaoStats {
  totalRodadas: number;
  jogadorMaisVotadoId: PlayerId | null;
  totalEmpates: number;
  perguntasPuladas: number;
  categorias: string[];
  duracaoMs: number;
  duracaoMediaRodadaMs: number;
}

export interface VerdadeDesafioSessaoStats {
  totalTurnos: number;
  verdadesEscolhidas: number;
  desafiosEscolhidos: number;
  desafiosCumpridos: number;
  cartasPassadas: number;
  jogadorMaisCorajosoId: PlayerId | null;
  categorias: string[];
  duracaoMs: number;
  duracaoMediaTurnoMs: number;
}

export interface De0a10SessaoStats {
  totalRodadas: number;
  rodadasCompletas: number;
  mediaErroGrupo: number;       // erro médio em todos os palpites (|palpite - nota|)
  maiorDivergencia: number;     // maior spread (max-min palpites) em uma única rodada
  acertosExatos: number;        // total de palpites com erro = 0
  jogadorMaisLegivelId: string | null;   // cuja nota foi mais fácil de ler (menor erro médio)
  jogadorMaisDificilId: string | null;   // mais difícil de ler (maior divergência ao responder)
  modoCompetitivo: boolean;
  vencedorId: string | null;    // só se modoCompetitivo
  duracaoMs: number;
  encerradaVoluntariamente: boolean;
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
  fazAi?: FazAiSessaoStats;
  alianca?: AliancaSessaoStats;
  duvido?: DuvidoSessaoStats;
  euNunca?: EuNuncaSessaoStats;
  quemNaSala?: QuemNaSalaSessaoStats;
  verdadeDesafio?: VerdadeDesafioSessaoStats;
  de0a10?: De0a10SessaoStats;
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
  vezesJulgado: number; // foi o mais votado em uma rodada MLT

  // Mr White — votação
  vezesVotado: number; // recebeu votos na eliminação do Mr White

  // Mr White — papel
  clutchsMrWhite: number; // acertou a palavra como Mr White

  // NPL
  colapsos: number; // turnos com mais falhas que acertos
  pontosTotais: number; // pontos acumulados no NPL

  // Inquisição
  vezesEliminado: number; // foi eliminado por votação do grupo
  vezesContaminado: number; // foi convertido para corrompido durante a noite
  acoesCorrompidas: number; // executou ações noturnas como corrompido

  // Você Me Conhece?
  acertosLeitura: number; // acertou a previsão sobre o ranqueador
  vezesDesconhecido: number; // foi ranqueador e ninguém acertou sua escolha

  // Faz Aí
  acertosFazAi: number; // cartas reconhecidas durante atuações
  passesFazAi: number; // cartas puladas ou perdidas no tempo
  turnosCaoticosFazAi: number; // turnos de alta energia/vergonha

  // Aliança
  liderancasAlianca: number; // liderou proposta de missão
  missoesAlianca: number; // participou de missões aprovadas
  vezesTraidorAlianca: number; // terminou revelado como traidor

  // Duvido
  dubidasCertasDuvido: number; // duvidou de item inválido — leu o bluff
  rankingsVencidosDuvido: number; // sobreviveu como último ativo no ranking
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
  | 'pos_jogo' // logo após um jogo terminar
  | 'entre_jogos' // na tela de seleção entre jogos
  | 'pos_resultado' // após reveal de resultado dentro de um jogo
  | 'dossie'; // no dossiê final

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
