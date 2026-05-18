import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, StyleSheet, View } from 'react-native';

import type { RootStackParamList } from '@/navigation/types';
import { cores, familias } from '@/theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Intro'>;

const CHAVE_INTRO = 'intro_visto_v1';

// Timing — slow enough to register, fast enough to not overstay
const T_FADE_IN = 600;
const T_HOLD = 950;
const T_FADE_OUT = 380;

export function TelaIntro({ navigation }: Props) {
  const opacidade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    async function iniciar() {
      const [visto, reducaoMovimento] = await Promise.all([
        AsyncStorage.getItem(CHAVE_INTRO),
        AccessibilityInfo.isReduceMotionEnabled(),
      ]);

      if (visto || reducaoMovimento) {
        navigation.replace('Inicio');
        return;
      }

      await AsyncStorage.setItem(CHAVE_INTRO, '1');

      Animated.sequence([
        Animated.timing(opacidade, {
          toValue: 1,
          duration: T_FADE_IN,
          useNativeDriver: true,
        }),
        Animated.delay(T_HOLD),
        Animated.timing(opacidade, {
          toValue: 0,
          duration: T_FADE_OUT,
          useNativeDriver: true,
        }),
      ]).start(() => {
        navigation.replace('Inicio');
      });
    }

    void iniciar();
  }, [navigation, opacidade]);

  return (
    <View style={estilos.tela}>
      <Animated.Text style={[estilos.titulo, { opacity: opacidade }]}>
        entre nós.
      </Animated.Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  tela: {
    alignItems: 'center',
    backgroundColor: cores.fundo,
    flex: 1,
    justifyContent: 'center',
  },
  titulo: {
    color: cores.texto,
    fontFamily: familias.serifItalico,
    fontSize: 28,
    letterSpacing: 0.4,
    opacity: 0.92,
  },
});
