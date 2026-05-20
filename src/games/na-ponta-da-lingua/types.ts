import type { GameAction, PlayerId } from '@/engine/types';

// ─── Categorias editoriais ────────────────────────────────────────────────────

export type CategoriaIdNPL =
  // Originais (reformatadas)
  | 'internet_br'
  | 'cotidiano'
  | 'comida'
  | 'cultura_pop'
  | 'objetos'
  | 'profissoes'
  | 'festas'
  | 'relacionamentos'
  | 'lugares'
  | 'brasil'
  | 'traumas_millennials'
  | 'memes_br'
  | 'vida_adulta'
  | 'date_ruim'
  | 'escritorio'
  | 'universidade'
  | 'carnaval'
  | 'reality_shows'
  | 'celebridades_br'
  // Novas categorias premium
  | 'caos_familiar'
  | 'churrasco_br'
  | 'uber_br'
  | 'academia_br'
  | 'terapia_br'
  | 'tiktok_br'
  | 'dating_moderno'
  | 'startup_culture'
  | 'coaching_br'
  | 'apartamento_br'
  | 'whatsapp_familia'
  | 'viagem_grupo'
  | 'aeroporto_br'
  | 'caos_financeiro'
  | 'nostalgia_br'
  | 'caos_urbano'
  | 'luxo_cafona'
  | 'condominio_br'
  | 'micro_cena'
  | 'brainrot_br'
  | 'frases_br'
  // Categoria especial — dificuldade extrema
  | 'colapso_br'
  | 'vergonha_social';

// ─── Tipos cognitivos ─────────────────────────────────────────────────────────

/**
 * Tipo cognitivo da carta — determina como o cérebro processa a palavra.
 * Usado pelo sistema de seleção adaptativa para garantir diversidade cognitiva.
 */
export type TipoCognitivoNPL =
  | 'visual_imediata'      // Objeto/cena instantaneamente visualizável
  | 'memoria_afetiva'      // Evoca memória emocional forte
  | 'frase_br'             // Expressão oral brasileira
  | 'situacao_social'      // Situação coletiva/constrangedora
  | 'micro_cena'           // Mini-cena completa com contexto
  | 'contradicao'          // Conceito paradoxal difícil de explicar
  | 'brainrot'             // Caos da internet / meme contemporâneo
  | 'caos_mental'          // Conceito que colapsa sob pressão
  | 'colapso_verbal'       // Induz colapso verbal garantido
  | 'vergonha_social'      // Situação de vergonha coletiva
  | 'improviso_extremo'    // Exige improviso criativo máximo
  | 'cultura_br'           // Memória coletiva brasileira profunda
  | 'caos_corporativo'     // Linguagem corporativa / escritório
  | 'meme_contemporaneo'   // Meme ou gíria recente
  | 'memoria_coletiva'     // Referência de geração compartilhada
  | 'caos_urbano'          // Caos do cotidiano urbano
  | 'pressao_social'       // Situação de pressão social direta
  | 'nostalgia_brasileira' // Nostalgia específica do BR
  | 'oralidade_pura'       // Linguagem estritamente falada
  | 'inferencia_indireta'; // Requer associação indireta/abstrata

// ─── Condições especiais ──────────────────────────────────────────────────────

/**
 * Modificadores de mecânica da carta.
 * Afetam a UI e/ou a experiência durante o turno.
 */
export type CondicaoEspecialNPL =
  | 'relampago'          // Reduz o timer temporariamente (−15s)
  | 'colapso_visual'     // UI entra em colapso visual mais cedo
  | 'proibidas_ocultas'  // Proibidas aparecem só após 10s
  | 'surto';             // Intensidade máxima desde o primeiro segundo

// ─── Dificuldade calibrada ────────────────────────────────────────────────────

export type DificuldadeNPL = 'facil' | 'medio' | 'dificil' | 'colapso';

/**
 * Taxa esperada de acerto por dificuldade:
 *   facil   → 70-85%  (warm-up, gera confiança, ritmo rápido)
 *   medio   → 45-65%  (tensão divertida, improviso ativo)
 *   dificil → 20-40%  (colapso cognitivo, desespero criativo)
 *   colapso →  5-20%  (impossível, caos absoluto, "eu sei mas não consigo falar")
 */

// ─── Carta ───────────────────────────────────────────────────────────────────

/**
 * Filosofia das proibidas:
 *
 * NÃO devem bloquear a DEFINIÇÃO — devem bloquear os REFLEXOS IMEDIATOS.
 * O objetivo é travar os primeiros 2–3 caminhos, não destruir a carta.
 *
 * ERRADO (destrói a carta):
 *   Churrasco → carne, fogo, espeto, grelha, churrasqueira
 *
 * CORRETO (abre espaço criativo):
 *   Churrasco → domingo, carvão, cerveja, fumaça, assar
 *
 * Regra de ouro: após as proibidas, devem restar ≥ 3 rotas cognitivas viáveis.
 */
export interface Carta {
  id: string;
  palavra: string;
  /** Exactamente 5 palavras — bloqueiam os reflexos, não a definição */
  proibidas: [string, string, string, string, string];
  categoria: CategoriaIdNPL;
  dificuldade: DificuldadeNPL;

  // ── Metadata de seleção inteligente (opcional — sistema usa defaults quando ausente)

  /** Tipo cognitivo — drive diversity no deck */
  tipo?: TipoCognitivoNPL;
  /** Energia emocional gerada: 1 (chill) → 5 (caos absoluto) */
  energiaEmocional?: 1 | 2 | 3 | 4 | 5;
  /** Velocidade cognitiva ideal: 1 (lento/reflexivo) → 5 (relâmpago) */
  velocidadeCognitiva?: 1 | 2 | 3 | 4 | 5;
  /** Potencial de caos social: 1 (zero drama) → 5 (colapso coletivo) */
  potencialCaos?: 1 | 2 | 3 | 4 | 5;
  /** Taxa esperada de acerto: 0.0–1.0 (0.75 = 75% dos grupos acerta) */
  taxaAcertoEsperada?: number;
  /** Condição especial que modifica a mecânica do turno */
  condicao?: CondicaoEspecialNPL;
}

// ─── Intensidade visual ───────────────────────────────────────────────────────

/**
 * Computed purely client-side from remaining time %.
 * NOT stored in engine state.
 *
 * Thresholds:
 *   calmo    → 100%–60%
 *   pressao  → 60%–30%
 *   panico   → 30%–10%
 *   colapso  → 10%–0%
 */
export type IntensidadeVisual = 'calmo' | 'pressao' | 'panico' | 'colapso';

export function calcularIntensidade(pct: number): IntensidadeVisual {
  if (pct > 0.6) return 'calmo';
  if (pct > 0.3) return 'pressao';
  if (pct > 0.1) return 'panico';
  return 'colapso';
}

// ─── Fase adaptativa da sessão ────────────────────────────────────────────────

/**
 * Fases emocionais da sessão — determinam a mixagem de energia.
 *
 *   warmup    → turnos 1–3: warm-up invisible, cartas visuais/fáceis
 *   crescendo → turnos 4–60%: pressão crescente, mix de energia
 *   pico      → 60%–80%: caos total, energia máxima
 *   colapso   → 80%+: improviso extremo, desestruturação
 */
export type FaseAdaptativaNPL = 'warmup' | 'crescendo' | 'pico' | 'colapso';

export function calcularFaseAdaptativa(
  turnosJogados: number,
  totalTurnos: number,
): FaseAdaptativaNPL {
  if (turnosJogados < 3) return 'warmup';
  const pct = turnosJogados / totalTurnos;
  if (pct < 0.6) return 'crescendo';
  if (pct < 0.8) return 'pico';
  return 'colapso';
}

// ─── Engine types ────────────────────────────────────────────────────────────

export type ResultadoRodada = 'acertou' | 'passou' | 'tempo_esgotado';

export type SubFaseNPL =
  | 'preparando'    // Jogador atual se prepara; outros olham pro lado
  | 'jogando'       // Timer correndo; jogador cicla por múltiplas palavras
  | 'resumo_turno'  // Timer acabou; resumo completo do turno
  | 'entre_rodadas' // Placar; próximo jogador prepara
  | 'finalizado';   // Todos os turnos completos

/** Uma palavra dentro de um turno contínuo */
export interface HistoricoTurnoItem {
  palavra: string;
  resultado: 'acertou' | 'passou';
}

export interface HistoricoRodada {
  rodada: number;
  jogadorId: PlayerId;
  carta: { palavra: string; proibidas: string[] };
  resultado: ResultadoRodada;
  duracaoMs: number;
}

export interface NPLPublicState {
  subFase: SubFaseNPL;
  anfitriaoId: PlayerId;

  duracaoSegundos: number;
  rodadasPorJogador: number;

  dificuldade: DificuldadeNPL | 'todas';
  categorias: CategoriaIdNPL[] | 'todas';

  indiceTurno: number;
  ordemJogadores: PlayerId[];
  turnosJogados: number;
  totalTurnos: number;

  turnoIniciadoEm: number | null;
  prazoTurnoEm: number | null;

  pontos: Record<PlayerId, number>;
  historico: HistoricoRodada[];
  cartasUsadas: string[];

  // ── Per-turn tracking ──────────────────────────────────────────────────────
  acertosTurnoAtual: number;
  passousTurnoAtual: number;
  streakTurnoAtual: number;
  melhorStreakTurnoAtual: number;
  historicoTurnoAtual: HistoricoTurnoItem[];
}

export interface NPLPrivateState {
  carta: Carta | null;
}

export type NPLAction =
  | (GameAction<Record<string, never>> & { tipo: 'pronto' })
  | (GameAction<Record<string, never>> & { tipo: 'acertou' })
  | (GameAction<Record<string, never>> & { tipo: 'passou' })
  | (GameAction<Record<string, never>> & { tipo: 'tempo_esgotado' })
  | (GameAction<Record<string, never>> & { tipo: 'avancar' });

export interface OpoesNPL {
  duracaoSegundos: 45 | 60 | 90;
  rodadasPorJogador: number;
  dificuldade: DificuldadeNPL | 'todas';
  categorias: CategoriaIdNPL[] | 'todas';
}

export type DificuldadeOuTodas = DificuldadeNPL | 'todas';
