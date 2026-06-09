// ─── Enumerações ──────────────────────────────────────────────────────────────

export type PapelOR =
  | 'alvo'
  | 'ameaca'
  | 'agente'
  | 'informante'
  | 'operador'
  | 'duplo_agente'; // reservado para modo avançado

export type FaccaoOR = 'resgate' | 'sabotagem';

export type ZonaOR = 'zona_a' | 'zona_b';

export type ModoOR = 'rapido' | 'padrao' | 'avancado';

export type FaseOR =
  | 'distribuindo'       // revelação privada de cartas, uma por vez
  | 'zonas_iniciais'     // mostrando separação inicial antes da 1ª rodada
  | 'discussao'          // rodada ativa — discussão livre
  | 'decisao_zona_a'     // líder da Zona A escolhe quem enviar para Zona B
  | 'decisao_zona_b'     // líder da Zona B escolhe quem enviar para Zona A
  | 'resultado_rodada'   // exibindo novas composições após a troca
  | 'evento'             // evento especial entre rodadas (modo avançado)
  | 'verificacao_final'  // calculando resultado após última rodada
  | 'debrief';           // revelação completa pós-jogo

// ─── Jogadores ────────────────────────────────────────────────────────────────

export interface JogadorOR {
  id: string;
  nome: string;
  papel: PapelOR;
  faccao: FaccaoOR;
  zona: ZonaOR;
  /** Fragmento de informação para papéis Informante. Null para os demais. */
  informacao: string | null;
  /** Objetivo secundário (modo avançado). Null no v1. */
  objetivoSecundario: string | null;
  /** Indica que o jogador já leu e ocultou sua carta privada. */
  cartaLida: boolean;
}

// ─── Configuração ─────────────────────────────────────────────────────────────

export interface ConfiguracaoOR {
  modo: ModoOR;
  jogadores: { id: string; nome: string }[];
  /** Se true, exibe timer durante a fase de discussão. */
  timerDiscussao: boolean;
  /** Duração da discussão em segundos (ignorado se timerDiscussao = false). */
  duracaoDiscussaoSegundos: 90 | 120 | 180 | 240;
  /** Ativa eventos especiais entre rodadas. Só disponível no modo avançado. */
  comEventos: boolean;
}

// ─── Histórico de rodadas ─────────────────────────────────────────────────────

export interface RodadaOR {
  numero: number;
  liderZonaA: string;         // id do jogador líder da Zona A
  liderZonaB: string;         // id do jogador líder da Zona B
  enviadoDaA: string | null;  // id do jogador enviado da Zona A para Zona B
  enviadoDaB: string | null;  // id do jogador enviado da Zona B para Zona A
  eventoId: string | null;    // id do evento especial sorteado (se houver)
}

// ─── Eventos especiais ────────────────────────────────────────────────────────

export interface EventoEspecialOR {
  id: string;
  titulo: string;
  descricao: string;
  /**
   * Quantas trocas extras por zona este evento adiciona.
   * 0 = sem efeito nas trocas (evento só narrativo).
   */
  trocasExtras: number;
  /**
   * Override da duração da discussão em segundos.
   * -1 = usa o valor padrão da configuração.
   */
  timerOverride: number;
}

// ─── Estado completo do jogo ──────────────────────────────────────────────────

export interface EstadoOR {
  config: ConfiguracaoOR;

  /** Lista de todos os jogadores com seus papéis e zonas atuais. */
  jogadores: JogadorOR[];

  /** Fase atual do jogo. */
  fase: FaseOR;

  /**
   * Índice do jogador que está visualizando sua carta privada (0-based).
   * Só relevante na fase 'distribuindo'.
   */
  distribuicaoIndex: number;

  /** Rodada atual (1-based). Zero antes da primeira rodada começar. */
  rodadaAtual: number;

  /** Total de rodadas da partida (definido pelo modo). */
  totalRodadas: number;

  /** Histórico completo de todas as rodadas concluídas. */
  historico: RodadaOR[];

  /**
   * Rodada sendo construída durante as fases de decisão.
   * Null fora das fases decisao_zona_a / decisao_zona_b.
   */
  rodadaEmCurso: Partial<RodadaOR> | null;

  /** Evento especial sorteado para a rodada atual. */
  eventoAtual: EventoEspecialOR | null;

  /** Facção vencedora após verificação final. Null durante o jogo. */
  vencedor: FaccaoOR | null;

  /**
   * Descrição da decisão que determinou o resultado (para debrief).
   * Ex: "Rodada 3 — enviar Diego para a Zona A foi decisivo."
   */
  decisaoChave: string | null;
}

// ─── Distribuição de papéis ───────────────────────────────────────────────────

/** Quantos de cada papel além de Alvo (1) e Ameaça (1). */
export interface DistribuicaoPapeisOR {
  agentes: number;
  informantes: number;
  operadores: number;
  duploAgentes: number; // sempre 0 no modo não-avançado
}

// ─── Texto da carta privada ───────────────────────────────────────────────────

export interface CartaPrivadaOR {
  titulo: string;   // ex: "Alvo"
  corpo: string;    // descrição do papel
  objetivo: string; // o que o jogador precisa fazer
  informacao: string | null; // fragment extra para Informante
}
