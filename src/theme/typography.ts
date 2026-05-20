/**
 * Typography System — Entre Nós v2.
 *
 * Dois papéis, uma missão:
 *
 * EDITORIAL (serif)  — Playfair Display
 *   Palavras do NPL, títulos de jogos, heroes de impacto.
 *   Presença, peso, memorabilidade.
 *   Aparece poucas vezes, mas quando aparece, para tudo.
 *
 * UI (sans — System)  — SF Pro (iOS) / Roboto (Android)
 *   Botões, labels, instruções, scores, nomes, regras.
 *   Rápido, legível, nativo. O celular some, sobra a interação.
 *
 * Regra de uso:
 *   - Mais de 2 linhas de texto? → sans.
 *   - Palavra única de impacto emocional? → serif.
 *   - Instrução de ação? → sans bold.
 *   - Nome do jogo em hero? → serif bold.
 */

import { familias, tipografia } from './colors';
import type { TextStyle } from 'react-native';

// ─── ESTILOS SEMÂNTICOS ────────────────────────────────────────────────────────
//
// Usar estes objetos diretamente em StyleSheet.create() ou inline.
// Não incluem `color` — cor é contexto, não tipografia.

/** Palavra-destaque do NPL. O coração emocional do jogo. */
export const estiloPalavraJogo: TextStyle = {
  fontFamily: familias.serifDisplay,
  fontSize: tipografia.tamanhoDisplay,
  letterSpacing: tipografia.spacingHero,
  lineHeight: tipografia.tamanhoDisplay * tipografia.alturaLinhaTitulo,
};

/** Nome do jogo em telas hero (DetalhesJogo, TelaInicio). */
export const estiloNomeJogoHero: TextStyle = {
  fontFamily: familias.serifDisplay,
  fontSize: tipografia.tamanhoHero,
  letterSpacing: tipografia.spacingHero,
  lineHeight: tipografia.tamanhoHero * tipografia.alturaLinhaTitulo,
};

/** Título principal de tela — sans, denso. */
export const estiloTituloPrincipal: TextStyle = {
  fontFamily: familias.sans,
  fontSize: tipografia.tamanhoTituloGrande,
  fontWeight: tipografia.pesoBold,
  letterSpacing: tipografia.spacingTitulo,
  lineHeight: tipografia.tamanhoTituloGrande * tipografia.alturaLinhaTitulo,
};

/** Subtítulo / seção — sans, peso médio. */
export const estiloSubtitulo: TextStyle = {
  fontFamily: familias.sans,
  fontSize: tipografia.tamanhoSubtitulo,
  fontWeight: tipografia.pesoSemibold,
  letterSpacing: tipografia.spacingNormal,
  lineHeight: tipografia.tamanhoSubtitulo * tipografia.alturaLinhaCompacto,
};

/** Corpo de texto principal — legível, confortável. */
export const estiloCorpo: TextStyle = {
  fontFamily: familias.sans,
  fontSize: tipografia.tamanhoCorpo,
  fontWeight: tipografia.pesoRegular,
  letterSpacing: tipografia.spacingNormal,
  lineHeight: tipografia.tamanhoCorpo * tipografia.alturaLinhaCorpo,
};

/** Corpo secundário — levemente menor, mudo. */
export const estiloCorpoSecundario: TextStyle = {
  fontFamily: familias.sans,
  fontSize: tipografia.tamanhoCorpoMenor,
  fontWeight: tipografia.pesoRegular,
  letterSpacing: tipografia.spacingNormal,
  lineHeight: tipografia.tamanhoCorpoMenor * tipografia.alturaLinhaCorpo,
};

/** Label de botão primário — energético, direto. */
export const estiloBotaoPrimario: TextStyle = {
  fontFamily: familias.sans,
  fontSize: tipografia.tamanhoCorpoMaior,
  fontWeight: tipografia.pesoBold,
  letterSpacing: tipografia.spacingLabel,
};

/** Label de botão secundário — menor, sem maiúsculas forçadas. */
export const estiloBotaoSecundario: TextStyle = {
  fontFamily: familias.sans,
  fontSize: tipografia.tamanhoCorpo,
  fontWeight: tipografia.pesoSemibold,
  letterSpacing: tipografia.spacingNormal,
};

/** Chip / tag — compacto, readable. */
export const estiloChip: TextStyle = {
  fontFamily: familias.sans,
  fontSize: tipografia.tamanhoCaption,
  fontWeight: tipografia.pesoSemibold,
  letterSpacing: tipografia.spacingLabel,
};

/** Score / número em destaque — tabular para estabilidade visual. */
export const estiloScore: TextStyle = {
  fontFamily: familias.sans,
  fontSize: tipografia.tamanhoTituloGrande,
  fontWeight: tipografia.pesoBlack,
  letterSpacing: tipografia.spacingApertado,
  lineHeight: tipografia.tamanhoTituloGrande * 1.1,
};

/** Legenda / timestamp / metadado. */
export const estiloLegenda: TextStyle = {
  fontFamily: familias.sans,
  fontSize: tipografia.tamanhoLegenda,
  fontWeight: tipografia.pesoRegular,
  letterSpacing: tipografia.spacingLegenda,
};

/** Nome de jogador dentro de gameplay. */
export const estiloNomeJogador: TextStyle = {
  fontFamily: familias.sans,
  fontSize: tipografia.tamanhoSubtitulo,
  fontWeight: tipografia.pesoBold,
  letterSpacing: tipografia.spacingApertado,
};

/** Instrução breve de gameplay — sans, médio, compacto. */
export const estiloInstrucao: TextStyle = {
  fontFamily: familias.sans,
  fontSize: tipografia.tamanhoCorpoMenor,
  fontWeight: tipografia.pesoMedio,
  letterSpacing: tipografia.spacingNormal,
  lineHeight: tipografia.tamanhoCorpoMenor * tipografia.alturaLinhaCorpo,
};

/** Palavra proibida no NPL — serif itálico, tensão visual. */
export const estiloProibida: TextStyle = {
  fontFamily: familias.serifItalico,
  fontSize: tipografia.tamanhoCorpoMaior,
  letterSpacing: tipografia.spacingNormal,
};

/** Timer de jogo — display mono-weight, sem serif. */
export const estiloTimer: TextStyle = {
  fontFamily: familias.sans,
  fontSize: tipografia.tamanhoDisplay,
  fontWeight: tipografia.pesoBlack,
  letterSpacing: tipografia.spacingApertado,
};
