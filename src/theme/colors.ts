/**
 * Identidade visual oficial — Entre Nós.
 * Paleta noturna roxa/rosa-vinho com texto off-white quente.
 */
export const cores = {
  // Backgrounds
  fundo: '#0D0D0D',
  fundoSecundario: '#141414',
  superficie: '#1C1C2E',
  superficieElevada: '#252538',
  borda: '#2E2E45',

  // Brand
  primaria: '#8B5CF6',
  primariaPressionada: '#7C3AED',
  acento: '#C084FC',
  acentoQuente: '#E879A0',
  acentoEscuro: '#6D28D9',
  // alias mantido para compat com código antigo
  acentoPressionado: '#7C3AED',

  // States
  sucesso: '#34D399',
  alerta: '#FFB020',
  erro: '#F87171',

  // Text
  texto: '#F5F0EB',
  textoSecundario: '#9090A8',
  textoMudo: '#5A5A72',
  textoSobrePrimaria: '#FFFFFF',
} as const;

/** Gradientes oficiais — usar com expo-linear-gradient. */
export const gradientes = {
  /** Principal: roxo vibrante → rosa vinho. Botão primário, destaques. */
  principal: ['#8B5CF6', '#E879A0'] as [string, string],
  /** Acento: roxo profundo → lilás claro. Avatares, detalhes. */
  acento: ['#6D28D9', '#C084FC'] as [string, string],
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

/** Paleta dos avatares — derivada da identidade roxo/rosa. */
export const PALETA_AVATARES = [
  '#8B5CF6',
  '#C084FC',
  '#E879A0',
  '#7C3AED',
  '#A78BFA',
  '#F9A8D4',
  '#6366F1',
  '#EC4899',
] as const;
