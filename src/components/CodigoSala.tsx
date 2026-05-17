import { StyleSheet, Text, View } from 'react-native';

import { cores, espacamento, tipografia } from '@/theme/colors';

type Tamanho = 'medio' | 'grande';

interface Props {
  codigo: string;
  tamanho?: Tamanho;
}

export function CodigoSala({ codigo, tamanho = 'grande' }: Props) {
  const eGrande = tamanho === 'grande';
  return (
    <View style={estilos.linha}>
      {codigo.split('').map((letra, i) => (
        <View
          key={`${letra}-${i}`}
          style={[estilos.tile, eGrande ? estilos.tileGrande : estilos.tileMedio]}
        >
          <Text
            style={[
              estilos.letra,
              eGrande ? estilos.letraGrande : estilos.letraMedia,
            ]}
          >
            {letra}
          </Text>
        </View>
      ))}
    </View>
  );
}

const estilos = StyleSheet.create({
  letra: {
    color: cores.primaria,
    fontWeight: tipografia.pesoExtraBold,
  },
  letraGrande: {
    fontSize: 40,
    letterSpacing: -0.5,
  },
  letraMedia: {
    fontSize: 26,
  },
  linha: {
    flexDirection: 'row',
    gap: espacamento.sm,
  },
  tile: {
    alignItems: 'center',
    backgroundColor: cores.superficie,
    // borda roxa sutil (#8B5CF6 com 40% opacidade)
    borderColor: 'rgba(139, 92, 246, 0.4)',
    borderRadius: 12,
    borderWidth: 1,
    elevation: 3,
    justifyContent: 'center',
    // sombra roxa muito sutil
    shadowColor: cores.primaria,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
  },
  tileGrande: {
    height: 72,
    width: 60,
  },
  tileMedio: {
    height: 48,
    width: 40,
  },
});
