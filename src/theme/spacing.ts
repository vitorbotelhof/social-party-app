/**
 * Spacing System — Entre Nós v2.
 *
 * Base: 4pt grid (alinhado com Material Design e Apple HIG).
 * Todos os valores são múltiplos de 4.
 *
 * Filosofia:
 *   - Espaçamento NÃO é decoração — é respiração e agrupamento.
 *   - Itens relacionados: espaço pequeno (4–8pt).
 *   - Seções distintas: espaço médio (16–24pt).
 *   - Separação de contexto: espaço grande (32–48pt).
 *   - Touch targets: mínimo 44pt de área sensível.
 */

// ─── ESCALA BASE ──────────────────────────────────────────────────────────────

export const escala = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
  11: 44,
  12: 48,
  14: 56,
  16: 64,
  20: 80,
  24: 96,
  28: 112,
  32: 128,
} as const;

// ─── ALIASES SEMÂNTICOS ───────────────────────────────────────────────────────

/** Espaçamentos nomeados — o que usar no dia a dia. */
export const layout = {
  // Micro — separação interna de elementos afins
  gap2: escala[2],   // 8pt — gap entre ícone e label

  // Pequeno — padding interno de componentes compactos
  padXS: escala[1],  // 4pt
  padSM: escala[2],  // 8pt — chip, tag, badge
  padMD: escala[4],  // 16pt — card padding padrão
  padLG: escala[6],  // 24pt — tela horizontal padding

  // Gap entre elementos na mesma seção
  gapXS: escala[1],  // 4pt
  gapSM: escala[2],  // 8pt
  gapMD: escala[4],  // 16pt
  gapLG: escala[6],  // 24pt

  // Margem vertical entre seções de tela
  secaoSM: escala[4],   // 16pt
  secaoMD: escala[6],   // 24pt
  secaoLG: escala[8],   // 32pt
  secaoXL: escala[12],  // 48pt

  // Padding de tela (horizontal safe-area)
  telaPadding: escala[5],  // 20pt — margem lateral padrão de tela
  telaTop: escala[6],      // 24pt — margem superior após safe area
  telaBottom: escala[8],   // 32pt — margem inferior antes de safe area

  // Touch targets — mínimo Apple HIG: 44×44pt
  touchMin: escala[11],    // 44pt
  touchConfortavel: 56,    // 56pt — botões primários
  touchGeneroso: 64,       // 64pt — botões hero / FAB

  // Cards
  cardPadH: escala[4],    // 16pt — horizontal
  cardPadV: escala[4],    // 16pt — vertical
  cardPadHG: escala[6],   // 24pt — card grande
  cardPadVG: escala[5],   // 20pt — card grande vertical

  // Raio de borda (atalho)
  raioBotao: 12,
  raioCard: 16,
  raioCardGrande: 24,
  raioChip: 999,

  // Largura máxima de conteúdo (para tablets / landscape)
  maxLargura: 480,
} as const;

// ─── SAFE AREA OFFSETS ────────────────────────────────────────────────────────

/**
 * Offsets adicionais para elementos próximos às bordas físicas do dispositivo.
 * Usar em conjunto com useSafeAreaInsets() — NUNCA hardcodar valores de notch.
 */
export const safeArea = {
  /** Buffer extra acima do safe area top (Dynamic Island, notch). */
  topBuffer: 8,
  /** Buffer extra abaixo do home indicator. */
  bottomBuffer: 8,
  /** Margem mínima de itens do lado de botões de volume etc. */
  sideBuffer: 4,
} as const;
