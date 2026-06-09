// ─── Configuração ────────────────────────────────────────────────────────────

export type ModoNMP = 'classico' | 'rapido' | 'festa' | 'dificil';

export type NomeDeck =
  | 'cotidiano'
  | 'brasil'
  | 'cultura_pop'
  | 'internet'
  | 'futebol'
  | 'sentimentos'
  | 'surpresa';

export interface Jogador {
  id: string;
  nome: string;
}

export interface ConfiguracaoNMP {
  modo: ModoNMP;
  jogadoresTimeA: Jogador[]; // inclui o mestre
  jogadoresTimeB: Jogador[]; // inclui o mestre
  mestreTimeA: string; // id do jogador
  mestreTimeB: string; // id do jogador
  deck: NomeDeck;
}

// ─── Estado do jogo ──────────────────────────────────────────────────────────

/** Tipo de cada célula na grade */
export type TipoPalavra = 'time_a' | 'time_b' | 'neutra' | 'perigosa';

/** Fases do jogo */
export type FaseNMP =
  | 'aguardando_pista'      // time ativo aguarda mestre ver mapa ou dar pista
  | 'vendo_mapa'            // mestre está visualizando o mapa privado
  | 'dando_pista'           // mestre confirmou o mapa, digitando pista + número
  | 'adivinhando'           // time ativo escolhe palavras
  | 'resultado_turno'       // resumo do turno antes de passar
  | 'encerrado';            // jogo encerrado com vencedor definido

export type TimeAtivo = 'time_a' | 'time_b';
export type Vencedor = 'time_a' | 'time_b' | null;

export interface CelulaNMP {
  palavra: string;
  tipo: TipoPalavra;
  revelada: boolean;
}

/** Pista dada pelo mestre durante um turno */
export interface PistaNMP {
  texto: string;
  /** Quantidade de palavras que o mestre quer cobrir. 0 = ilimitado. */
  numero: number;
  tentativasFeitas: number;
  tentativasCorretas: number;
}

/** Resumo do que aconteceu num turno (para fase resultado_turno) */
export type MotivoEncerramentoTurno =
  | 'passou'          // time escolheu parar
  | 'neutro'          // tocou palavra neutra
  | 'adversario'      // tocou palavra do time oposto
  | 'perigosa'        // tocou palavra perigosa
  | 'limite'          // atingiu o número de tentativas da pista
  | 'vitoria';        // revelou todas as palavras do time

export interface ResultadoTurno {
  timeQueJogou: TimeAtivo;
  pistaDada: PistaNMP;
  acertos: number;
  motivo: MotivoEncerramentoTurno;
}

/** Momentos sociais registrados durante a partida */
export type MomentoNMP =
  | 'pista_perfeita'        // time acertou todas as palavras da pista
  | 'mestre_ousado'         // pista com número ≥ 3
  | 'chute_fatal'           // tocou na palavra perigosa
  | 'chute_livre_correto'   // tentativa extra além do número acertou
  | 'ajudou_adversario'     // tocou em palavra do time oposto
  | 'vitoria_por_sincronia' // vitória acertando a última pista completa
  | 'time_perdido';         // time errou 2+ vezes seguidas no mesmo turno

export interface EstadoNMP {
  config: ConfiguracaoNMP;

  /** Grade de palavras. Sempre 25 (Clássico/Festa/Difícil) ou 16 (Rápido). */
  grade: CelulaNMP[];

  /** Número de colunas da grade (5 para 5×5, 4 para 4×4). */
  colunas: number;

  /** Time que está jogando agora. */
  timeAtivo: TimeAtivo;

  /** Fase atual do jogo. */
  fase: FaseNMP;

  /** Pista em andamento (definida durante adivinhando). */
  pistaAtual: PistaNMP | null;

  /** Quantas palavras ainda faltam para o Time A vencer. */
  restantesTimeA: number;

  /** Quantas palavras ainda faltam para o Time B vencer. */
  restantesTimeB: number;

  /** Pontuação para modo Festa (+1 acerto, -2 perigosa). Null nos outros modos. */
  pontosTimeA: number | null;
  pontosTimeB: number | null;

  /** Time vencedor. Null enquanto o jogo não terminou. */
  vencedor: Vencedor;

  /** Histórico de todos os turnos jogados. */
  historicoTurnos: ResultadoTurno[];

  /** Momentos sociais registrados. */
  momentos: MomentoNMP[];

  /** Contagem de erros consecutivos do turno atual (para detectar time_perdido). */
  errosConsecutivos: number;
}

// ─── Distribuição de palavras por modo ───────────────────────────────────────

export interface DistribuicaoGrade {
  timeA: number;
  timeB: number;
  neutras: number;
  perigosa: number;
  total: number;
  colunas: number;
}

export const DISTRIBUICAO_POR_MODO: Record<ModoNMP, DistribuicaoGrade> = {
  classico: { timeA: 9, timeB: 8, neutras: 7, perigosa: 1, total: 25, colunas: 5 },
  rapido:   { timeA: 5, timeB: 4, neutras: 6, perigosa: 1, total: 16, colunas: 4 },
  festa:    { timeA: 9, timeB: 8, neutras: 7, perigosa: 1, total: 25, colunas: 5 },
  dificil:  { timeA: 8, timeB: 7, neutras: 9, perigosa: 1, total: 25, colunas: 5 },
};
