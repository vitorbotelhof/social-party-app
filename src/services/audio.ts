import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

export type TipoSom = 'ping' | 'whoosh' | 'click' | 'vitoria' | 'derrota';

const CHAVE = '@entre-nos/som-ativo';

let somAtivo = true;
const ouvintes = new Set<(v: boolean) => void>();

function notificar(): void {
  for (const cb of ouvintes) cb(somAtivo);
}

export async function carregarPreferenciaSom(): Promise<void> {
  const v = await AsyncStorage.getItem(CHAVE);
  if (v !== null) somAtivo = v === '1';
  notificar();
}

export function getSomAtivo(): boolean {
  return somAtivo;
}

export function observarSomAtivo(cb: (v: boolean) => void): () => void {
  ouvintes.add(cb);
  cb(somAtivo);
  return () => {
    ouvintes.delete(cb);
  };
}

export async function setSomAtivo(v: boolean): Promise<void> {
  somAtivo = v;
  await AsyncStorage.setItem(CHAVE, v ? '1' : '0');
  notificar();
}

/**
 * "Toca" o feedback associado ao tipo. Usa expo-haptics como vibração tátil
 * — garantido em iOS e Android, sem precisar de arquivos de áudio.
 * Se o toggle de som estiver desligado, é no-op.
 */
export async function tocar(tipo: TipoSom): Promise<void> {
  if (!somAtivo) return;
  try {
    switch (tipo) {
      case 'ping':
      case 'click':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        return;
      case 'whoosh':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        return;
      case 'vitoria':
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        );
        return;
      case 'derrota':
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Error,
        );
        return;
    }
  } catch {
    // expo-haptics pode não estar disponível em alguns ambientes — fail silent.
  }
}
