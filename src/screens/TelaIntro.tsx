import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import type { RootStackParamList } from '@/navigation/types';
import { cores } from '@/theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Intro'>;

const CHAVE_INTRO = 'intro_visto_v1';

// O app é rápido. Sem cerimônia de abertura.
// A marca vive no header de TelaInicio — não precisa de splash screen.
export function TelaIntro({ navigation }: Props) {
  useEffect(() => {
    void AsyncStorage.setItem(CHAVE_INTRO, '1');
    navigation.replace('Inicio');
  }, [navigation]);

  // Fundo consistente durante a transição instantânea
  return <View style={estilos.tela} />;
}

const estilos = StyleSheet.create({
  tela: {
    backgroundColor: cores.fundo,
    flex: 1,
  },
});
