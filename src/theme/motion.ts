/**
 * Motion System — Entre Nós v2.
 *
 * Princípio: "O app é rápido. As emoções são profundas."
 *
 * Velocidade transmite confiança. Animações lentas fazem o app parecer pesado.
 * Animações rápidas com easing correto parecem vivas — não bruscas.
 *
 * Regras:
 *   - Micro-interações (press, toggle, chip): 100–180ms
 *   - Transições de estado (card flip, expand): 200–280ms
 *   - Transições de tela (push, modal): 280–360ms
 *   - Animações emocionais (tensão, colapso NPL): até 450ms
 *   - JAMAIS > 500ms em resposta a toque direto
 *
 * Easing:
 *   - Entrar no viewport: ease-out (desacelera ao chegar)
 *   - Sair do viewport: ease-in (acelera ao partir)
 *   - Feedback de toque: spring (física real, interruptível)
 *   - Transições narrativas: ease-in-out (fluido, cinematográfico quando necessário)
 */

// ─── DURAÇÕES ─────────────────────────────────────────────────────────────────

/** Durações em milissegundos. */
export const duracao = {
  // Micro — feedback imediato de toque
  instantaneo: 80,    // ripple, highlight de press
  rapido: 120,        // toggle, checkbox, chip select
  micro: 160,         // ícone swap, badge appear

  // Padrão — transições de estado dentro de uma tela
  curto: 200,         // card expand, accordion open
  padrao: 240,        // transição padrão — use este quando em dúvida
  medio: 280,         // modal aparecer, bottom sheet

  // Navegação — entre telas
  navegacao: 320,     // push/pop de tela
  modal: 360,         // modal de tela inteira

  // Emocional — animações de tensão e feedback narrativo
  expressivo: 400,    // colapso visual do NPL, reveal de carta
  maximo: 450,        // tensão máxima, animações de jogo

  // Stagger — delay entre itens em lista/grid
  staggerItem: 40,    // delay por item (10 itens = 400ms total max)
} as const;

// ─── EASING ───────────────────────────────────────────────────────────────────

/**
 * Curvas de easing para Animated.timing().
 * Compatíveis com Easing do React Native.
 *
 * Uso com Animated:
 *   Animated.timing(valor, {
 *     toValue: 1,
 *     duration: duracao.padrao,
 *     easing: easing.entrar,
 *     useNativeDriver: true,
 *   })
 */
export const easingValues = {
  /** Entrar no viewport — desacelera ao chegar. Confortável. */
  entrar: [0.0, 0.0, 0.2, 1.0] as [number, number, number, number],

  /** Sair do viewport — acelera ao partir. Não hesita. */
  sair: [0.4, 0.0, 1.0, 1.0] as [number, number, number, number],

  /** Estado para estado — levemente ease-in-out. Fluxo. */
  estado: [0.4, 0.0, 0.2, 1.0] as [number, number, number, number],

  /** Enfatizado — overshoot sutil. Expressivo, não infantil. */
  enfatizado: [0.2, 0.0, 0.0, 1.0] as [number, number, number, number],

  /** Linear — apenas para opacidade simples ou timers. */
  linear: [0.0, 0.0, 1.0, 1.0] as [number, number, number, number],
} as const;

// ─── CONFIGURAÇÕES DE SPRING ─────────────────────────────────────────────────

/**
 * Configurações de spring para Animated.spring() e react-native-reanimated.
 * Springs são interruptíveis — essencial para gestos e toques.
 */
export const spring = {
  /** Resposta rápida — botões, chips, press feedback. */
  snap: {
    damping: 20,
    stiffness: 300,
    mass: 0.8,
    overshootClamping: false,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 0.01,
  },

  /** Resposta padrão — cards, toggles, modais. */
  padrao: {
    damping: 18,
    stiffness: 200,
    mass: 1.0,
    overshootClamping: false,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 0.01,
  },

  /** Resposta suave — transições narrativas, reveals. */
  suave: {
    damping: 25,
    stiffness: 120,
    mass: 1.2,
    overshootClamping: false,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 0.01,
  },

  /** Bottom sheet / drag — inércia natural. */
  inercial: {
    damping: 30,
    stiffness: 100,
    mass: 1.5,
    overshootClamping: false,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 0.01,
  },
} as const;

// ─── PRESETS PRONTOS ──────────────────────────────────────────────────────────

/**
 * Presets compostos — usar diretamente no Animated.timing().
 * Já incluem duration + easing pré-configurados.
 */
export const preset = {
  /** Press scale feedback — 44ms, snap. */
  pressIn: { duration: duracao.instantaneo, easing: easingValues.sair },
  pressOut: { duration: duracao.rapido, easing: easingValues.entrar },

  /** Aparecer / fade-in de elemento. */
  aparecer: { duration: duracao.curto, easing: easingValues.entrar },

  /** Desaparecer / fade-out de elemento. */
  desaparecer: { duration: duracao.rapido, easing: easingValues.sair },

  /** Transição padrão entre estados na mesma tela. */
  estado: { duration: duracao.padrao, easing: easingValues.estado },

  /** Transição de tela (push). */
  navegacao: { duration: duracao.navegacao, easing: easingValues.entrar },

  /** Modal slide-up. */
  modalAbrir: { duration: duracao.modal, easing: easingValues.entrar },
  modalFechar: { duration: duracao.medio, easing: easingValues.sair },

  /** NPL — reveal de palavra com impacto. */
  nplReveal: { duration: duracao.expressivo, easing: easingValues.enfatizado },

  /** NPL — colapso visual de tensão. */
  nplColapso: { duration: duracao.maximo, easing: easingValues.estado },
} as const;

// ─── REDUCED MOTION ───────────────────────────────────────────────────────────

/**
 * Durações reduzidas para usuários com preferência de movimento reduzido.
 * Usar com AccessibilityInfo.isReduceMotionEnabled().
 *
 * Regra: manter a transição, mas torná-la quase instantânea.
 * Nunca remover completamente — state changes ainda precisam de feedback.
 */
export const duracaoReduzida = {
  qualquer: 80, // substitui qualquer duração quando reduce motion está ativo
} as const;
