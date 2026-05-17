/**
 * Faz race da promise contra um timeout. Se a promise não resolver
 * em `ms`, rejeita com a mensagem fornecida.
 *
 * Importante: ações já enviadas (ex.: runTransaction no Firebase) podem
 * continuar executando depois do timeout — o efeito só é local, a UI
 * para de esperar. Use mensagens que orientem o usuário a tentar de novo.
 */
export async function comTimeout<T>(
  promise: Promise<T>,
  ms = 15000,
  mensagem = 'A ação demorou demais. Tenta de novo.',
): Promise<T> {
  let timerId: ReturnType<typeof setTimeout> | null = null;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timerId = setTimeout(() => reject(new Error(mensagem)), ms);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timerId !== null) clearTimeout(timerId);
  }
}
