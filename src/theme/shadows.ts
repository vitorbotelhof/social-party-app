/**
 * Shadow & Elevation System — Entre Nós v2.
 *
 * Sombras quentes, sutis, humanas.
 * Base: sombra marrom-acinzentada quente (#161616 com baixa opacidade).
 * Jamais sombra azul-acinzentada genérica — ela mata o calor do papel.
 *
 * Escala de elevação (inspirado em Material 3, adaptado para UI clara):
 *
 *   Level 0 — sem elevação (fundo de tela, inputs)
 *   Level 1 — elevação sutil (cards em fundo, botões ghost)
 *   Level 2 — elevação média (cards ativos, bottom sheet)
 *   Level 3 — elevação alta (modais, overlays)
 *   Level 4 — elevação máxima (FAB, toasts, alertas críticos)
 *
 * Compatibilidade React Native:
 *   iOS   → shadow* props
 *   Android → elevation prop
 *   Web → boxShadow (via StyleSheet)
 *
 * Cada nível exporta um objeto com as props corretas para cada plataforma.
 */

import { Platform } from 'react-native';
import type { ViewStyle } from 'react-native';

// Cor base das sombras — marrom quente, não cinza frio
const COR_SOMBRA = '#161616';

// ─── BUILDER INTERNO ──────────────────────────────────────────────────────────

function sombra(
  ios: { radius: number; opacity: number; offsetX: number; offsetY: number },
  androidElev: number,
): ViewStyle {
  if (Platform.OS === 'android') {
    return { elevation: androidElev };
  }
  return {
    shadowColor: COR_SOMBRA,
    shadowOffset: { width: ios.offsetX, height: ios.offsetY },
    shadowOpacity: ios.opacity,
    shadowRadius: ios.radius,
  };
}

// ─── NÍVEIS DE ELEVAÇÃO ───────────────────────────────────────────────────────

/** Sem sombra — superfícies no nível do fundo. */
export const sombra0: ViewStyle = {};

/**
 * Elevação 1 — presença mínima.
 * Cards sobre fundo, chips, separadores elevados.
 */
export const sombra1: ViewStyle = sombra(
  { radius: 4, opacity: 0.06, offsetX: 0, offsetY: 1 },
  1,
);

/**
 * Elevação 2 — card padrão.
 * Cards de conteúdo, list items, avatares de jogador.
 */
export const sombra2: ViewStyle = sombra(
  { radius: 8, opacity: 0.09, offsetX: 0, offsetY: 2 },
  3,
);

/**
 * Elevação 3 — elementos interativos em destaque.
 * Botões primários, cards pressionáveis, chips selecionados.
 */
export const sombra3: ViewStyle = sombra(
  { radius: 16, opacity: 0.12, offsetX: 0, offsetY: 4 },
  6,
);

/**
 * Elevação 4 — overlays e modais.
 * Bottom sheets, modais de confirmação, toasts críticos.
 */
export const sombra4: ViewStyle = sombra(
  { radius: 24, opacity: 0.16, offsetX: 0, offsetY: 8 },
  12,
);

/**
 * Elevação máxima — FAB, alertas de sistema.
 * Raramente usado — apenas quando o elemento PRECISA flutuar.
 */
export const sombra5: ViewStyle = sombra(
  { radius: 32, opacity: 0.20, offsetX: 0, offsetY: 12 },
  20,
);

// ─── SOMBRAS CONTEXTUAIS ──────────────────────────────────────────────────────

/** Sombra para borda de card (substitui borda em superfícies brancas). */
export const sombraBordaCard: ViewStyle = sombra(
  { radius: 6, opacity: 0.08, offsetX: 0, offsetY: 1 },
  2,
);

/** Sombra de botão primário — levemente mais intensa para transmitir toque. */
export const sombraBotaoPrimario: ViewStyle = sombra(
  { radius: 12, opacity: 0.22, offsetX: 0, offsetY: 4 },
  6,
);

/** Sombra de bottom sheet sobre conteúdo. */
export const sombraBottomSheet: ViewStyle = sombra(
  { radius: 40, opacity: 0.18, offsetX: 0, offsetY: -4 },
  16,
);

/** Sombra de toast / notificação flutuante. */
export const sombraToast: ViewStyle = sombra(
  { radius: 20, opacity: 0.20, offsetX: 0, offsetY: 6 },
  10,
);

// ─── UTILITÁRIO ───────────────────────────────────────────────────────────────

/** Array indexado — útil para map/select de nível: sombras[2] === sombra2. */
export const sombras = [sombra0, sombra1, sombra2, sombra3, sombra4, sombra5] as const;
