import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIXO = '@entre-nos/tutorial/';

export async function tutorialFoiVisto(chave: string): Promise<boolean> {
  const valor = await AsyncStorage.getItem(PREFIXO + chave);
  return valor === '1';
}

export async function marcarTutorialComoVisto(chave: string): Promise<void> {
  await AsyncStorage.setItem(PREFIXO + chave, '1');
}
