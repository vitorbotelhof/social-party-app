/**
 * Identidade visual oficial — Entre Nós.
 * Paleta noir quente: carvão escuro / vinho / âmbar. Sem azul frio, sem neon.
 */
export const cores = {
  // Backgrounds — carvão com subtom castanho, não azul
  fundo: '#0E0B08',
  fundoSecundario: '#141009',
  superficie: '#1C1610',
  superficieElevada: '#231A12',
  borda: '#352A1C',

  // Brand — vinho profundo como primária, âmbar como acento
  primaria: '#A0522D',        // sienna: terra, calor, presença
  primariaPressionada: '#7A3D20',
  acento: '#C9893A',          // âmbar dourado: tensão, luz baixa
  acentoQuente: '#D4633A',    // laranja cobre: emoção quente
  acentoEscuro: '#6B3318',
  acentoPressionado: '#7A3D20',

  // States — verde mais quente, alerta já era bom, erro levemente mais quente
  sucesso: '#2ECC8A',
  alerta: '#FFB020',
  erro: '#E86A5A',

  // Text — off-white quente, secundário sepia, mudo terra
  texto: '#F5F0EB',
  textoSecundario: '#9A8878',
  textoMudo: '#6B5A4A',
  textoSobrePrimaria: '#FFFFFF',
} as const;

/** Gradientes oficiais — usar com expo-linear-gradient. */
export const gradientes = {
  /** Principal: vinho → âmbar. Botão primário, destaques. */
  principal: ['#A0522D', '#C9893A'] as [string, string],
  /** Acento: sépia profundo → cobre. Avatares, detalhes. */
  acento: ['#6B3318', '#D4633A'] as [string, string],
} as const;

export const espacamento = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const raio = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

/**
 * Tokens de tipografia.
 * Hierarquia: heros (36-48 / 800) → títulos (28 / 700) →
 * subtítulos (20-24 / 600) → corpo (15-16 / 400) → legendas (12-13 / 700).
 */
/**
 * Famílias tipográficas — display serif para momentos de alto impacto.
 * UI funcional usa System (sans-serif).
 */
export const familias = {
  serifDisplay: 'PlayfairDisplay_700Bold',
  serifItalico: 'PlayfairDisplay_400Regular_Italic',
} as const;

export const tipografia = {
  pesoRegular: '400' as const,
  pesoMedio: '500' as const,
  pesoSemibold: '600' as const,
  pesoBold: '700' as const,
  pesoExtraBold: '800' as const,
  pesoBlack: '900' as const,
  pesoLeve: '300' as const,

  tamanhoHero: 48,
  tamanhoTituloGrande: 36,
  tamanhoTitulo: 28,
  tamanhoSubtituloGrande: 24,
  tamanhoSubtitulo: 20,
  tamanhoCorpoMaior: 17,
  tamanhoCorpo: 16,
  tamanhoCorpoMenor: 15,
  tamanhoLegenda: 13,
  tamanhoMicro: 12,

  // letter spacing
  spacingHero: -1,
  spacingTitulo: -0.5,
  spacingLeve: 0.3,
  spacingLegenda: 1.5,
  spacingLabel: 2,
  // aliases mantidos
  letraSpacingLegenda: 1.5,
  letraSpacingTitulo: -0.5,
} as const;

/** Paleta dos avatares — derivada da identidade vinho/âmbar/cobre. */
export const PALETA_AVATARES = [
  '#A0522D',
  '#C9893A',
  '#D4633A',
  '#7A3D20',
  '#B87333',
  '#C46A2E',
  '#8B4513',
  '#E8924A',
] as const;
