import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import type { AppStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<AppStackParamList, 'Intro'>;

const CHAVE_INTRO = 'intro_visto_v1';

// Exibe o mesmo splash.png do nativo para que a transição seja imperceptível.
// Navegação instantânea para as abas principais — sem delay artificial.
export function TelaIntro({ navigation }: Props) {
  useEffect(() => {
    void AsyncStorage.setItem(CHAVE_INTRO, '1');
    navigation.replace('Main');
  }, [navigation]);

  return (
    <View style={estilos.tela}>
      <Image
        source={require('../../assets/splash.png')}
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  tela: {
    backgroundColor: '#FAF5EE',
    flex: 1,
  },
});
