/** Gera um id local pseudo-aleatório para um jogador. */
export function gerarIdJogador(): string {
  const aleatorio = Math.random().toString(36).slice(2, 10);
  return `p_${Date.now().toString(36)}_${aleatorio}`;
}
