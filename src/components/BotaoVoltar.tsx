import { Pressable, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { cores, tamanhos, tipografia } from '@/theme/colors';

interface Props {
  onPress: () => void;
  posicao?: 'esquerda' | 'direita';
  topOffset?: number;
  variante?: 'voltar' | 'fechar';
}

export function BotaoVoltar({
  onPress,
  posicao = 'esquerda',
  topOffset = 8,
  variante = 'voltar',
}: Props) {
  const insets = useSafeAreaInsets();
  const label = variante === 'fechar' ? 'Fechar' : 'Voltar';
  const icone = variante === 'fechar' ? '×' : '←';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        estilos.botao,
        { top: insets.top + topOffset },
        posicao === 'esquerda' ? estilos.esquerda : estilos.direita,
        pressed && estilos.pressionado,
      ]}
      hitSlop={12}
      accessibilityLabel={label}
      accessibilityRole="button"
    >
      <Text style={estilos.icone}>{icone}</Text>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  botao: {
    alignItems: 'center',
    backgroundColor: cores.superficie,
    borderColor: cores.borda,
    borderRadius: tamanhos.botaoVoltar / 2,
    borderWidth: 1,
    height: tamanhos.botaoVoltar,
    justifyContent: 'center',
    position: 'absolute',
    width: tamanhos.botaoVoltar,
    zIndex: 100,
  },
  direita: {
    right: 16,
  },
  esquerda: {
    left: 16,
  },
  icone: {
    color: cores.texto,
    fontSize: tipografia.tamanhoIconeMedio,
    fontWeight: tipografia.pesoBold,
    lineHeight: 26,
  },
  pressionado: {
    backgroundColor: cores.fundoSecundario,
    transform: [{ scale: 0.94 }],
  },
});
