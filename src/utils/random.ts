/** Embaralha um array (Fisher-Yates), retornando uma cópia. */
export function embaralhar<T>(arr: readonly T[]): T[] {
  const copia = [...arr];
  for (let i = copia.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j]!, copia[i]!];
  }
  return copia;
}

/** Sorteia um elemento de uma lista não vazia. */
export function sortearUm<T>(arr: readonly T[]): T {
  if (arr.length === 0) {
    throw new Error('Não é possível sortear de um array vazio.');
  }
  return arr[Math.floor(Math.random() * arr.length)]!;
}
