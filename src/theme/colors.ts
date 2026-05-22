/**
 * Sistema de Cores — Entre Nós v2.
 *
 * Identidade: plataforma de energia social presencial.
 * Direção: rápido, humano, tátil, brasileiro.
 *
 * Base: papel quente (#F6F3EE) → preto denso (#161616)
 * Acentos sociais por função emocional, não por decoração.
 *
 * COMPATIBILIDADE: todos os tokens legados foram preservados —
 * os 42 arquivos que importam daqui continuam compilando.
 * Os valores mudaram; o shape da interface permanece idêntico.
 */

// ─── FUNDAÇÃO ─────────────────────────────────────────────────────────────────

export const cores = {
  // Backgrounds — papel quente, presença humana, não noir
  fundo: '#F6F3EE',
  fundoSecundario: '#FFFFFF',
  superficie: '#FFFFFF',
  superficieElevada: '#FDFCFA',
  borda: '#E7E2DA',
  bordaForte: '#C8C2BA',

  // Brand principal — vermelho social
  // Energia, presença, intensidade. Não perigo, não erro — vida social.
  primaria: '#FF5A5F',
  primariaPressionada: '#E04449',
  acento: '#FF5A5F', // alias → primaria
  acentoQuente: '#FF7A7F', // versão mais suave
  acentoEscuro: '#CC3338',
  acentoPressionado: '#E04449',

  // Identidades por jogo — cada jogo tem sua assinatura cromática
  mrWhite: '#FF5A5F', // vermelho: paranóia, suspeita, tensão
  mostLikely: '#FFBE0B', // amarelo: julgamento, revelação, humor
  npl: '#8B5CF6', // roxo: colapso cognitivo, pressão mental

  // Energia social — estados emocionais mapeados em cor
  conversa: '#4D7CFE', // azul: diálogo, fluxo, conexão
  reacao: '#22C55E', // verde: acerto, reação, celebração
  caos: '#FFBE0B', // amarelo: caos, surpresa, instabilidade
  energia: '#8B5CF6', // roxo: intensidade, pressão, colapso
  social: '#FF5A5F', // vermelho: presença humana ativa

  // Estados do sistema
  sucesso: '#22C55E',
  alerta: '#FFBE0B',
  erro: '#FF5A5F',

  // Tipografia — denso, legível, humano
  texto: '#161616',
  textoSecundario: '#5E5E5E',
  textoMudo: '#9E9E9E',
  textoSobrePrimaria: '#FFFFFF',
  textoSobreEscuro: '#F6F3EE',
} as const;

// ─── GRADIENTES ───────────────────────────────────────────────────────────────

export const gradientes = {
  /** Principal: vermelho social → laranja quente. Botão primário, CTAs. */
  principal: ['#FF5A5F', '#FF8C61'] as [string, string],

  /** Acento: roxo energia → azul conversa. Momentos de alta intensidade. */
  acento: ['#8B5CF6', '#4D7CFE'] as [string, string],

  /** NPL: roxo colapso → violeta profundo. Gameplay de pressão cognitiva. */
  npl: ['#8B5CF6', '#6D28D9'] as [string, string],

  /** Most Likely: amarelo → laranja. Julgamento com leveza. */
  mostLikely: ['#FFBE0B', '#FF8C61'] as [string, string],

  /** Fade de fundo: transparente → papel quente. Para cards e sobreposições. */
  fundoSutil: ['rgba(246,243,238,0)', 'rgba(246,243,238,1)'] as [
    string,
    string,
  ],

  /** Superfície elevada: branco puro → papel levíssimo. */
  superficieSutil: ['#FFFFFF', '#FDFCFA'] as [string, string],
} as const;

// ─── ESPAÇAMENTO ──────────────────────────────────────────────────────────────

export const espacamento = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

// ─── RAIOS ────────────────────────────────────────────────────────────────────

export const raio = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  pill: 999,
} as const;

// ─── TIPOGRAFIA ───────────────────────────────────────────────────────────────

/**
 * Famílias tipográficas.
 *
 * Display serif (Playfair Display): momentos de alto impacto emocional —
 * palavras do NPL, nomes de jogos, heroes. Presença editorial.
 *
 * System sans (SF Pro iOS / Roboto Android): toda UI funcional —
 * botões, labels, instruções, scores. Rápido, legível, nativo.
 */
export const familias = {
  serifDisplay: 'PlayfairDisplay_700Bold',
  serifItalico: 'PlayfairDisplay_400Regular_Italic',
  sans: 'System',
} as const;

export const tipografia = {
  // ── Pesos ──────────────────────────────────────────────────
  pesoLeve: '300' as const,
  pesoRegular: '400' as const,
  pesoMedio: '500' as const,
  pesoSemibold: '600' as const,
  pesoBold: '700' as const,
  pesoExtraBold: '800' as const,
  pesoBlack: '900' as const,

  // ── Escala modular — 4pt base, razão ~1.25 ─────────────────
  // Cada nível tem nome semântico; evitar raw numbers no código.
  tamanhoMicro: 11, // badges, contadores mínimos
  tamanhoLabelSecao: 11, // labels compactos de seção em uppercase
  tamanhoLegenda: 12, // subtítulos de seção, legendas
  tamanhoCaption: 13, // textos de ajuda, descrições curtas
  tamanhoSegmento: 15, // segment controls, tabs de ação
  tamanhoCorpoMenor: 14, // corpo de texto secundário
  tamanhoCorpo: 16, // corpo de texto padrão (mínimo sem zoom iOS)
  tamanhoCorpoMaior: 17, // inputs, itens de lista, destaque leve
  tamanhoIconePequeno: 18, // ícones pequenos, glyphs de navegação, setas
  tamanhoSubtitulo: 20, // subtítulos, cabeçalhos de seção
  tamanhoSubtituloGrande: 22, // subtítulos proeminentes
  tamanhoIconeMedio: 24, // glyphs de ação inline, "×" remoção
  tamanhoTitulo: 26, // títulos de seção, "+/-" stepper
  tamanhoIconeGrande: 28, // ícones de ação grandes, código de sala
  tamanhoTituloGrande: 32, // títulos de página, destaque forte
  tamanhoTimer: 36, // contadores visuais, temporizadores
  tamanhoHero: 40, // display de pontuação, números hero
  tamanhoPlacar: 44, // valor central do stepper, placar principal
  tamanhoStepper: 44, // valor central do controlador numérico
  tamanhoDisplay: 52, // título máximo — nome do jogo na tela serif

  // ── Letter spacing ──────────────────────────────────────────
  spacingApertado: -0.8,
  spacingTitulo: -0.5,
  spacingHero: -1.2,
  spacingNormal: 0,
  spacingLeve: 0.2,
  spacingLegenda: 0.8,
  spacingLabel: 1.2,
  spacingCaps: 2.0,
  // Aliases legados — preservados para compatibilidade
  spacingHero_legado: -1,
  letraSpacingLegenda: 1.5,
  letraSpacingTitulo: -0.5,

  // ── Altura de linha ─────────────────────────────────────────
  alturaLinhaTitulo: 1.15,
  alturaLinhaCorpo: 1.6,
  alturaLinhaCompacto: 1.35,
} as const;

// ─── SOMBRAS ──────────────────────────────────────────────────────────────────

/**
 * Sistema de sombras — 5 níveis de elevação.
 *
 * Uso: espalhe diretamente em StyleSheet.create():
 *   card: { ...sombra.sutil, borderRadius: raio.md, ... }
 *
 * Cor base '#161616' (texto): sombra quente, não noir puro.
 * Nunca use shadowColor: '#000000' — quebra a identidade "papel quente".
 */
export const sombra = {
  /** Sem elevação — superfície plana no papel. */
  nenhuma: {
    elevation: 0,
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
  },

  /** Sutil — cards de lista, itens de jogadores, surface elevada leve. */
  sutil: {
    elevation: 1,
    shadowColor: '#161616',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },

  /** Alias de Sprint 2 — sombra leve padrão para cards pequenos. */
  leve: {
    elevation: 1,
    shadowColor: '#161616',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },

  /** Baixa — badges, botão secundário, elementos flutuantes pequenos. */
  baixa: {
    elevation: 2,
    shadowColor: '#161616',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },

  /** Média — hero cards, ilustrações, elementos de destaque. */
  media: {
    elevation: 3,
    shadowColor: '#161616',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
  },

  /** Forte — botão primário, CTAs principais. */
  forte: {
    elevation: 3,
    shadowColor: '#161616',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
  },

  /** Elevada — bottom sheets, action bars flutuantes, modais. */
  elevada: {
    elevation: 16,
    shadowColor: '#161616',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
  },

  /** Alias de Sprint 2 — bottom sheets e modais. */
  modal: {
    elevation: 16,
    shadowColor: '#161616',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
  },
} as const;

// ─── DIMENSÕES ────────────────────────────────────────────────────────────────

/**
 * Dimensões de UI — touch targets, alturas de componentes, tamanhos de ícones.
 *
 * Apple HIG exige mínimo 44×44pt para alvos tocáveis.
 * Não use números mágicos — referencie este objeto.
 */
export const dimensoes = {
  // ── Touch targets ──────────────────────────────────────────
  /** Mínimo Apple HIG — 44×44pt. Nenhum botão tocável abaixo disso. */
  tocavelMinimo: 44,
  /** Controles compactos — back button, ações secundárias no jogo. */
  tocavelCompacto: 36,
  /** Inputs e botões de ação padrão — add player, stepper buttons. */
  tocavelPadrao: 52,
  /** Botão primário — CTA principal da tela. */
  tocavelPrimario: 56,

  // ── Botões ─────────────────────────────────────────────────
  /** Botão voltar circular. */
  botaoVoltar: 36,
  /** Botões quadrados de ação, como adicionar jogador. */
  botaoAcao: 52,
  /** Altura padrão de input. */
  inputAltura: 52,
  /** Altura padrão de CTA principal. */
  ctaAltura: 56,
  /** Largura do botão − / + do stepper numérico. */
  larguraStepperBotao: 60,
  /** Altura do botão − / + do stepper numérico. */
  alturaStepperBotao: 52,
  /** Largura mínima do bloco de valor central do stepper. */
  larguraStepperValor: 72,

  // ── Elementos de lista ─────────────────────────────────────
  /** Bolinha numerada de jogador — CadastroJogadores. */
  tamanhoBolinha: 32,
  /** Alias semântico da bolinha numerada. */
  avatarNumero: 32,
  /** Botão de remoção de item (hitSlop adiciona área real). */
  tamanhoRemover: 28,
} as const;

/**
 * Aliases enxutos para dimensões recorrentes de componentes.
 * Mantém a linguagem do diagnóstico da Sprint 2 enquanto `dimensoes`
 * segue disponível para nomes mais descritivos.
 */
export const tamanhos = {
  botaoAcao: dimensoes.botaoAcao,
  avatarNumero: dimensoes.avatarNumero,
  botaoVoltar: dimensoes.botaoVoltar,
  inputAltura: dimensoes.inputAltura,
  ctaAltura: dimensoes.ctaAltura,
  stepperAltura: dimensoes.alturaStepperBotao,
  stepperLargura: dimensoes.larguraStepperBotao,
  stepperValorMinimo: dimensoes.larguraStepperValor,
} as const;

// ─── AVATARES ─────────────────────────────────────────────────────────────────

/**
 * Paleta dos avatares — 8 cores sociais vibrantes.
 * Cada jogador recebe uma cor de identidade dentro da sessão.
 */
export const PALETA_AVATARES = [
  '#FF5A5F', // vermelho social
  '#4D7CFE', // azul conversa
  '#22C55E', // verde reação
  '#FFBE0B', // amarelo caos
  '#8B5CF6', // roxo energia
  '#FF7A7F', // vermelho suave
  '#6D7FFF', // azul suave
  '#34D399', // verde suave
] as const;
