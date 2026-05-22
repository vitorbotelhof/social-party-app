import { Pressable, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { cores, tamanhos, tipografia } from '@/theme/colors';

interface Props {
  onPress: () => void;
  topOffset?: number;
}

const COR_FUNDO = 'rgba(255, 255, 255, 0.06)';
const COR_BORDA = 'rgba(255, 255, 255, 0.18)';
const COR_PRESSIONADO = 'rgba(255, 255, 255, 0.14)';

export function BotaoVoltar({ onPress, topOffset = 8 }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        estilos.botao,
        { top: insets.top + topOffset },
        pressed && estilos.pressionado,
      ]}
      hitSlop={12}
      accessibilityLabel="Voltar"
      accessibilityRole="button"
    >
      <Text style={estilos.icone}>←</Text>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  botao: {
    alignItems: 'center',
    backgroundColor: COR_FUNDO,
    borderColor: COR_BORDA,
    borderRadius: tamanhos.botaoVoltar / 2,
    borderWidth: 1,
    height: tamanhos.botaoVoltar,
    justifyContent: 'center',
    left: 16,
    position: 'absolute',
    width: tamanhos.botaoVoltar,
    zIndex: 100,
  },
  icone: {
    color: cores.texto,
    fontSize: tipografia.tamanhoIconePequeno,
    fontWeight: tipografia.pesoBold,
    lineHeight: 20,
  },
  pressionado: {
    backgroundColor: COR_PRESSIONADO,
    transform: [{ scale: 0.94 }],
  },
});
