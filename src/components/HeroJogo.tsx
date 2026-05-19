import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRef } from 'react';
import { Animated, ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';

import type { DefinicaoJogo } from '@/games/gameRegistry';
import { cores, espacamento, familias, tipografia } from '@/theme/colors';

const ALTURA_HERO = 500;

// Gradient heavier at bottom — top 38% stays fully exposed for cinematic impact
const GRADIENTE_HERO: [string, string, string, string] = [
  'rgba(14,11,8,0)',
  'rgba(14,11,8,0)',
  'rgba(14,11,8,0.72)',
  'rgba(14,11,8,0.97)',
];

interface Props {
  jogo: DefinicaoJogo;
  onPress: () => void;
}

export function HeroJogo({ jogo, onPress }: Props) {
  const escala = useRef(new Animated.Value(1)).current;

  function aoPressionar() {
    Animated.spring(escala, {
      toValue: 0.985,
      useNativeDriver: true,
      speed: 40,
      bounciness: 0,
    }).start();
  }

  function aoSoltar() {
    Animated.spring(escala, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 4,
    }).start();
  }

  function aoTocar() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }

  return (
    <Animated.View style={[estilos.container, { transform: [{ scale: escala }] }]}>
      <Pressable
        onPress={aoTocar}
        onPressIn={aoPressionar}
        onPressOut={aoSoltar}
        accessibilityLabel={`Jogar ${jogo.nome}`}
        accessibilityRole="button"
        style={estilos.pressavel}
      >
        <ImageBackground source={jogo.cover} style={estilos.imagem}>
          <LinearGradient
            colors={GRADIENTE_HERO}
            locations={[0, 0.38, 0.68, 1]}
            style={estilos.gradiente}
          />

          <View style={estilos.conteudo}>
            <Text style={estilos.nome}>{jogo.nome}</Text>
            <Text style={estilos.slogan} numberOfLines={2}>
              {jogo.slogan}
            </Text>
            <Text style={estilos.cta}>jogar  →</Text>
          </View>
        </ImageBackground>
      </Pressable>
    </Animated.View>
  );
}

const estilos = StyleSheet.create({
  // Full-bleed: breaks out of the ScrollView's horizontal padding
  container: {
    marginBottom: espacamento.xl + 4,
    marginHorizontal: -espacamento.lg,
  },
  pressavel: {
    overflow: 'hidden',
  },
  imagem: {
    height: ALTURA_HERO,
    justifyContent: 'flex-end',
  },
  gradiente: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  conteudo: {
    gap: espacamento.sm - 2,
    paddingBottom: espacamento.lg + espacamento.md,
    paddingHorizontal: espacamento.lg,
  },
  nome: {
    color: cores.textoSobrePrimaria,
    fontFamily: familias.serifDisplay,
    fontSize: 38,
    letterSpacing: tipografia.letraSpacingTitulo,
    lineHeight: 46,
  },
  slogan: {
    color: 'rgba(245,240,235,0.68)',
    fontSize: tipografia.tamanhoCorpoMenor,
    fontWeight: tipografia.pesoLeve,
    letterSpacing: 0.15,
    lineHeight: 22,
  },
  cta: {
    color: cores.acento,
    fontSize: tipografia.tamanhoLegenda,
    fontWeight: tipografia.pesoSemibold,
    letterSpacing: 0.5,
    marginTop: espacamento.xs,
  },
});
