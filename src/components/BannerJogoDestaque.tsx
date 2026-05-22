import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRef } from 'react';
import {
  Animated,
  ImageBackground,
  type ImageSourcePropType,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  cores,
  espacamento,
  familias,
  raio,
  sombra,
  tipografia,
} from '@/theme/colors';

const GRADIENTE_BANNER: [string, string, string, string] = [
  'rgba(22,14,10,0)',
  'rgba(22,14,10,0.12)',
  'rgba(22,14,10,0.70)',
  'rgba(22,14,10,0.94)',
];

export interface JogoDestaqueItem {
  id: string;
  nome: string;
  cover: ImageSourcePropType;
  banner?: ImageSourcePropType;
}

export interface DestaqueCatalogoItem {
  jogo: JogoDestaqueItem;
  badge: string;
  descricao: string;
}

interface Props {
  destaque: DestaqueCatalogoItem;
  onPress: (jogo: JogoDestaqueItem) => void;
}

export function BannerJogoDestaque({ destaque, onPress }: Props) {
  const escala = useRef(new Animated.Value(1)).current;
  const { jogo, badge, descricao } = destaque;

  function aoPressionar() {
    Animated.spring(escala, {
      toValue: 0.985,
      useNativeDriver: true,
      speed: 45,
      bounciness: 0,
    }).start();
  }

  function aoSoltar() {
    Animated.spring(escala, {
      toValue: 1,
      useNativeDriver: true,
      speed: 35,
      bounciness: 4,
    }).start();
  }

  function aoTocar() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress(jogo);
  }

  return (
    <Animated.View
      style={[estilos.container, { transform: [{ scale: escala }] }]}
    >
      <Pressable
        onPress={aoTocar}
        onPressIn={aoPressionar}
        onPressOut={aoSoltar}
        accessibilityRole="button"
        accessibilityLabel={`Jogar ${jogo.nome}`}
        style={estilos.pressavel}
      >
        <ImageBackground
          source={jogo.banner ?? jogo.cover}
          style={estilos.imagem}
          imageStyle={estilos.imagemInterna}
          resizeMode="cover"
        >
          <LinearGradient
            colors={GRADIENTE_BANNER}
            locations={[0, 0.34, 0.68, 1]}
            style={StyleSheet.absoluteFillObject}
          />

          <View style={estilos.badge}>
            <Text style={estilos.badgeTexto}>{badge}</Text>
          </View>

          <View style={estilos.conteudo}>
            <Text style={estilos.nome}>{jogo.nome}</Text>
            <Text style={estilos.descricao} numberOfLines={2}>
              {descricao}
            </Text>
            <View style={estilos.cta}>
              <Text style={estilos.ctaTexto}>jogar agora</Text>
            </View>
          </View>
        </ImageBackground>
      </Pressable>
    </Animated.View>
  );
}

const estilos = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: cores.primaria,
    borderRadius: raio.pill,
    marginLeft: espacamento.md,
    marginTop: espacamento.md,
    paddingHorizontal: espacamento.md,
    paddingVertical: 6,
  },
  badgeTexto: {
    color: cores.textoSobrePrimaria,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoMicro,
    fontWeight: tipografia.pesoExtraBold,
    letterSpacing: 0,
    textTransform: 'lowercase',
  },
  container: {
    borderRadius: raio.sm,
    marginBottom: espacamento.xl + espacamento.sm,
    ...sombra.media,
  },
  conteudo: {
    gap: espacamento.sm,
    marginTop: 'auto',
    paddingBottom: espacamento.lg,
    paddingHorizontal: espacamento.md,
  },
  cta: {
    alignSelf: 'flex-start',
    backgroundColor: cores.primaria,
    borderRadius: raio.pill,
    marginTop: espacamento.xs,
    paddingHorizontal: espacamento.lg,
    paddingVertical: espacamento.sm,
  },
  ctaTexto: {
    color: cores.textoSobrePrimaria,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpo,
    fontWeight: tipografia.pesoExtraBold,
    letterSpacing: 0,
  },
  descricao: {
    color: cores.textoSobreEscuro,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpoMenor,
    lineHeight: 20,
  },
  imagem: {
    aspectRatio: 16 / 9,
    minHeight: 194,
  },
  imagemInterna: {
    borderRadius: raio.sm,
  },
  nome: {
    color: cores.textoSobrePrimaria,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoTitulo,
    fontWeight: tipografia.pesoBlack,
    letterSpacing: 0,
    lineHeight: 31,
  },
  pressavel: {
    borderRadius: raio.sm,
    overflow: 'hidden',
  },
});
