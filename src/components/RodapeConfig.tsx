import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BotaoPrimario } from '@/components/BotaoPrimario';
import { cores, espacamento, familias, tipografia } from '@/theme/colors';

interface Props {
  titulo: string;
  carregando?: boolean;
  disabled?: boolean;
  onPress: () => void;
  aviso?: string;
  usarInsetInferior?: boolean;
}

export function RodapeConfig({
  titulo,
  carregando,
  disabled,
  onPress,
  aviso,
  usarInsetInferior = false,
}: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        estilos.rodape,
        usarInsetInferior && {
          paddingBottom: insets.bottom + espacamento.md,
        },
      ]}
    >
      {aviso ? <Text style={estilos.aviso}>{aviso}</Text> : null}
      <BotaoPrimario
        titulo={titulo}
        carregando={carregando}
        disabled={disabled}
        onPress={onPress}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  aviso: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    marginBottom: espacamento.xs,
    textAlign: 'center',
  },
  rodape: {
    borderTopColor: cores.borda,
    borderTopWidth: 1,
    padding: espacamento.lg,
    paddingTop: espacamento.md,
  },
});
