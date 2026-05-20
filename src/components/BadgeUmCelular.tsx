import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { cores, raio, tipografia } from '@/theme/colors';

/**
 * Badge discreto que aparece no canto superior direito das telas
 * do modo "1 celular". Marca visualmente o modo offline.
 */
export function BadgeUmCelular() {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[estilos.badge, { top: insets.top + 8 }]}
      pointerEvents="none"
    >
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
    // Sombra sutil para flutuar sobre o conteúdo
    elevation: 2,
    shadowColor: '#161616',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    zIndex: 100,
  },
  texto: {
    color: cores.textoMudo,
    fontSize: 11,
    fontWeight: tipografia.pesoSemibold,
    letterSpacing: 0.3,
  },
});
