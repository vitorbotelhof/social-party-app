// ─── De 0 a 10 — Types ───────────────────────────────────────────────────────

// Escala jogável: 1–9 como padrão. 0 e 10 são notas especiais/raras (fase pico).
export type NotaDe0a10 = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export type TierCategoria = 'S' | 'A' | 'B';
export type ExposicaoCategoria = 'leve' | 'pessoal' | 'intima';
export type FaseExposicaoDe0a10 = 'aquecimento' | 'conversa' | 'aberta';
export type ModoLeituraDe0a10 = 'completa' | 'rotativa';

export type CategoriaId =
  // Tier S — máximo potencial de debate
  | 'filme'
  | 'profissao'
  | 'animal'
  | 'sabor'
  | 'bebida'
  | 'red_flag'
  | 'ex'
  // Tier A — ótimo na maioria dos grupos
  | 'comida'
  | 'serie'
  | 'superpoder'
  | 'emoji'
  | 'cidade'
  | 'cantor'
  | 'cor'
  | 'frase'
  | 'viagem'
  | 'marca'
  // Tier B — bom com ressalvas
  | 'dia_da_semana'
  | 'esporte'
  | 'app'
  | 'famoso'
  | 'clima'
  // +18 — só com incluirMais18 ativo
  | 'fantasia'
  | 'pecado';

export interface Categoria {
  id: CategoriaId;
  emoji: string;
  nome: string;
  /**
   * 3–5 perguntas específicas para esta categoria.
   * Cada pergunta tem âncoras de 0 e 10 embutidas.
   * O engine sorteia uma por rodada.
   */
  perguntas: string[];
  tier: TierCategoria;
  exposicao: ExposicaoCategoria;
  mais18?: boolean;
}

export type HistoricoPerguntasPorCategoria = Partial<
  Record<CategoriaId, string[]>
>;

// Resposta do jogador para uma categoria. null = usou o skip.
export interface RespostaCategoria {
  categoriaId: CategoriaId;
  resposta: string | null;
}

// Palpite individual de um adivinhador
export interface PalpiteJogador {
  jogadorId: string;
  nota: NotaDe0a10;
}

export type LeituraColetivaDe0a10 =
  | 'cravaram'
  | 'te_leram'
  | 'quase'
  | 'divididos'
  | 'nao_te_leram';

export interface PulsoSocialDe0a10 {
  id: string;
  chamada: string;
  texto: string;
}

// Resultado calculado após todos os adivinhadores votarem
export interface ResultadoRodada {
  respondente: { id: string; nome: string };
  notaReal: NotaDe0a10;
  categorias: CategoriaId[];
  respostas: RespostaCategoria[];
  palpites: PalpiteJogador[];
  mediaGuesses: number;
  divergencia: number; // spread = max(palpites) - min(palpites)
  leituraColetiva: LeituraColetivaDe0a10;
  acertosExatos: number;
  acertosProximos: number;
  pulsoSocial: PulsoSocialDe0a10;
  modoLeitura: ModoLeituraDe0a10;
  // Pontuação (só usada se modoCompetitivo)
  // Respondente: ganha 1 pt por adivinhador que acertou dentro de ±1
  pontosRespondente: number;
  // Adivinhador: 2 pts se erro = 0 (exato), 1 pt se erro = 1 (beirada), 0 pts se erro ≥ 2
  pontosPorAdivinhador: Record<string, 0 | 1 | 2>;
}

// Sub-fases do jogo — cada uma mapeia para um sub-componente na tela
export type SubFaseDe0a10 =
  | 'vez_de' // "Vez de [Nome] — pegue o celular"
  | 'nota_secreta' // Jogador vê nota + digita respostas (tela privada/escura)
  | 'debate' // Tela compartilhada: categorias + respostas, grupo discute
  | 'palpites' // Passação: cada adivinhador vota em segredo (tela escura)
  | 'reveal'; // Reveal da nota real + palpites + pontuação

// Fase da sessão — controla quais notas ficam disponíveis
export type FaseDe0a10 = 'calibracao' | 'tensao' | 'pico';

// Estado da rodada em andamento
export interface RodadaAtual {
  respondente: { id: string; nome: string };
  nota: NotaDe0a10;
  /** Se a fase individual do respondente permite 0 e 10 sem revelar a nota real. */
  permiteNotasExtremas: boolean;
  faseExposicao: FaseExposicaoDe0a10;
  modoLeitura: ModoLeituraDe0a10;
  categorias: CategoriaId[];
  /** Pergunta específica sorteada para cada categoria desta rodada. */
  perguntasPorCategoria: Record<string, string>;
  respostas: RespostaCategoria[];
  palpites: PalpiteJogador[];
  // Lista de jogadores que devem palpitar (todos exceto o respondente)
  adivinhadores: { id: string; nome: string }[];
  // Índice do adivinhador atual na passação (0 = primeiro ainda não votou)
  indiceAdivinhandoAtual: number;
}

export interface PlacarJogador {
  jogadorId: string;
  nome: string;
  pontosAdivinhador: number;
  pontosRespondente: number;
  total: number;
}

export interface SessaoDe0a10 {
  jogadores: { id: string; nome: string }[];
  voltas: 1 | 2 | 3;
  modoCompetitivo: boolean;
  incluirMais18: boolean;
  subFase: SubFaseDe0a10;
  indiceRespondenteAtual: number;
  rodadaAtual: RodadaAtual | null;
  categoriasUsadasNaSessao: CategoriaId[];
  notasUsadasPorJogador: Record<string, NotaDe0a10[]>;
  historico: ResultadoRodada[];
  placar: PlacarJogador[];
  rodadasCompletas: number;
  totalRodadas: number; // jogadores.length * voltas
  iniciouEm: number;
  perguntasUsadasPorCategoria: HistoricoPerguntasPorCategoria;
}

export interface ConfiguracaoDe0a10 {
  jogadores: { id: string; nome: string }[];
  voltas: 1 | 2 | 3;
  modoCompetitivo: boolean;
  incluirMais18: boolean;
}
