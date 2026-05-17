import AsyncStorage from '@react-native-async-storage/async-storage';

import { gerarIdJogador } from '@/utils/ids';

const CHAVE_NOME = '@entre-nos/jogador/nome';
const CHAVE_ID = '@entre-nos/jogador/id';

export async function salvarNome(nome: string): Promise<void> {
  await AsyncStorage.setItem(CHAVE_NOME, nome);
}

export async function carregarNome(): Promise<string | null> {
  return AsyncStorage.getItem(CHAVE_NOME);
}

export async function salvarId(id: string): Promise<void> {
  await AsyncStorage.setItem(CHAVE_ID, id);
}

export async function carregarId(): Promise<string | null> {
  return AsyncStorage.getItem(CHAVE_ID);
}

export async function obterOuCriarJogador(): Promise<{
  id: string;
  nome: string | null;
}> {
  let id = await carregarId();
  if (!id) {
    id = gerarIdJogador();
    await salvarId(id);
  }
  const nome = await carregarNome();
  return { id, nome };
}
