/**
 * INQUISIÇÃO LOCAL — BANCO DE MENSAGENS PÓS-NOITE
 *
 * Requisitos de cada mensagem:
 *   ✓ Plausível para qualquer resultado (eliminação, contaminação, proteção, nada)
 *   ✓ Nunca nomeia jogadores nem descreve ações específicas
 *   ✓ Tom ambíguo — mais atmosfera do que informação
 *   ✓ Curta — host lê em voz baixa, 2–4 palavras idealmente
 *
 * Mensagens INVÁLIDAS (descartadas):
 *   ✗ "alguém não voltará"  → implica eliminação
 *   ✗ "a cura chegou"       → implica proteção
 *   ✗ "nada aconteceu"      → implica que guardião bloqueou ou não houve ação
 *
 * Anti-repetição: sortearMensagemNoite() nunca retorna a mesma mensagem
 * em noites consecutivas. Para sessões longas (>12 loops), repetição eventual
 * é aceitável — o banco é grande o suficiente para não ser previsível.
 */

const MENSAGENS: readonly string[] = [
  'algo se moveu nas sombras.',
  'algo mudou enquanto todos dormiam.',
  'a noite guardou seus segredos.',
  'uma escolha foi feita.',
  'nem tudo ficou igual.',
  'alguém esteve acordado.',
  'o silêncio esconde muita coisa.',
  'o que foi feito, foi feito.',
  'a madrugada passou.',
  'o jogo continua.',
  'as sombras voltaram ao lugar.',
  'algo ficou no ar.',
  'a cidade respirou.',
  'o escuro ouviu tudo.',
  // revisadas — não implicam direção nem resultado
  'o que a noite ouviu, a noite guarda.',
  'a noite tem seus segredos.',
  'o dia vai mostrar o que falta.',
  'cada um sabe o que fez.',
  'a escuridão é imparcial.',
  'alguém dormiu bem demais.',
];

/**
 * Sorteia uma mensagem diferente da última exibida.
 *
 * @param ultimaMensagem - Última mensagem exibida. null → sorteia livremente.
 * @returns Mensagem para o host ler em voz alta.
 */
export function sortearMensagemNoite(ultimaMensagem: string | null): string {
  const candidatas =
    ultimaMensagem !== null
      ? MENSAGENS.filter((m) => m !== ultimaMensagem)
      : MENSAGENS;

  const indice = Math.floor(Math.random() * candidatas.length);
  // candidatas nunca é vazio: MENSAGENS tem 20 entradas, filtramos no máximo 1
  return candidatas[indice] ?? MENSAGENS[0]!;
}
