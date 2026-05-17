import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { tipografia } from '@/theme/colors';

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
      <Text style={estilos.texto}>📱 1 celular</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  badge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    position: 'absolute',
    right: 16,
    zIndex: 100,
  },
  texto: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 11,
    fontWeight: tipografia.pesoSemibold,
    letterSpacing: 0.3,
  },
});
