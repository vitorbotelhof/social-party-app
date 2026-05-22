import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { cores, raio, sombra, tipografia } from '@/theme/colors';

/**
 * Badge discreto que aparece no canto superior direito das telas
 * do modo "1 celular". Marca visualmente o modo offline.
 */
export function BadgeUmCelular() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[estilos.badge, { top: insets.top + 8 }]} pointerEvents="none">
      <Text style={estilos.texto}>1 celular</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  // Light-mode badge — superficie com borda quente
  badge: {
    backgroundColor: cores.superficie,
    borderColor: cores.borda,
    borderRadius: raio.pill,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    position: 'absolute',
    right: 16,
    ...sombra.baixa,
    zIndex: 100,
  },
  texto: {
    color: cores.textoMudo,
    fontSize: tipografia.tamanhoLabelSecao,
    fontWeight: tipografia.pesoSemibold,
    letterSpacing: 0.3,
  },
});
