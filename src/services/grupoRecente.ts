/**
 * grupoRecente — memória leve e invisível do grupo.
 *
 * Persiste apenas os nomes do último grupo para reuso imediato.
 * Sem perfis, sem contas, sem onboarding — só continuidade.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const CHAVE = '@entre-nos/grupo/recente';

/**
 * Salva os nomes do grupo atual.
 * Chamado no momento de iniciar o jogo — não antes.
 */
export async function salvarGrupoRecente(nomes: string[]): Promise<void> {
  const validos = nomes.map((n) => n.trim()).filter((n) => n.length >= 2);
  if (validos.length === 0) return;
  await AsyncStorage.setItem(CHAVE, JSON.stringify(validos));
}

/**
 * Retorna os nomes do último grupo ou null se não houver histórico.
 * Filtra nomes inválidos para robustez contra dados corrompidos.
 */
export async function carregarGrupoRecente(): Promise<string[] | null> {
  const raw = await AsyncStorage.getItem(CHAVE);
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      Array.isArray(parsed) &&
      parsed.every((n): n is string => typeof n === 'string')
    ) {
      const validos = parsed.filter((n) => n.trim().length >= 2);
      return validos.length >= 2 ? validos : null;
    }
    return null;
  } catch {
    return null;
  }
}
