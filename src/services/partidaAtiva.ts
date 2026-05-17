import AsyncStorage from '@react-native-async-storage/async-storage';

const CHAVE = '@entre-nos/partida-ativa';

export interface PartidaAtiva {
  roomCode: string;
  jogoId: string;
  jogadorId: string;
}

let memoria: PartidaAtiva | null = null;

export function setPartidaAtiva(p: PartidaAtiva | null): void {
  memoria = p;
}

export function getPartidaAtiva(): PartidaAtiva | null {
  return memoria;
}

export async function salvarPartida(p: PartidaAtiva): Promise<void> {
  await AsyncStorage.setItem(CHAVE, JSON.stringify(p));
}

export async function carregarPartida(): Promise<PartidaAtiva | null> {
  const raw = await AsyncStorage.getItem(CHAVE);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PartidaAtiva;
  } catch {
    return null;
  }
}

export async function limparPartida(): Promise<void> {
  memoria = null;
  await AsyncStorage.removeItem(CHAVE);
}
