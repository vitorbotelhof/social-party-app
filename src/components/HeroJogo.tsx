import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRef } from 'react';
import {
  Animated,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType,
} from 'react-native';

import {
  cores,
  espacamento,
  familias,
  raio,
  sombra,
  tipografia,
} from '@/theme/colors';

// Social Energy Card — não poster de cinema.
// 300px: conteúdo presente sem dominar a tela.
const ALTURA_HERO = 300;

// Overlay quente — imagem respira no topo, texto legível embaixo.
// Gradient começa em 38% (não 0%) — cover art visível, não sepultada.
const GRADIENTE_HERO: [string, string, string, string] = [
  'rgba(22,14,10,0)',
  'rgba(22,14,10,0.18)',
  'rgba(22,14,10,0.70)',
  'rgba(22,14,10,0.92)',
];

interface Props {
  jogo: {
    nome: string;
    slogan: string;
    cover: ImageSourcePropType;
    destaque?: boolean;
  };
  onPress: () => void;
}

const COR_TEXTO_SECUNDARIO_SOBRE_IMAGEM = 'rgba(255,255,255,0.68)';

export function HeroJogo({ jogo, onPress }: Props) {
  const escala = useRef(new Animated.Value(1)).current;

  function aoPressionar() {
    Animated.spring(escala, {
      toValue: 0.985,
      useNativeDriver: true,
      speed: 50,
      bounciness: 0,
    }).start();
  }

  function aoSoltar() {
    Animated.spring(escala, {
      toValue: 1,
      useNativeDriver: true,
      speed: 40,
      bounciness: 3,
    }).start();
  }

  function aoTocar() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }

  return (
    <Animated.View
      style={[estilos.container, { transform: [{ scale: escala }] }]}
    >
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

          {/* Badge de destaque — contexto social, não decoração */}
          {jogo.destaque && (
            <View style={estilos.badgeWrap}>
              <View style={estilos.badge}>
                <Text style={estilos.badgeTexto}>FAVORITO</Text>
              </View>
            </View>
          )}

          <View style={estilos.conteudo}>
            <Text style={estilos.nome}>{jogo.nome}</Text>
            <Text style={estilos.slogan} numberOfLines={1}>
              {jogo.slogan}
            </Text>
            {/* CTA explícito — não texto passivo */}
            <View style={estilos.ctaRow}>
              <View style={estilos.ctaBotao}>
                <Text style={estilos.ctaTexto}>jogar agora</Text>
              </View>
            </View>
          </View>
        </ImageBackground>
      </Pressable>
    </Animated.View>
  );
}

const estilos = StyleSheet.create({
  // Card format: flutuante no scroll, não poster colado na tela
  container: {
    borderRadius: 20,
    marginBottom: espacamento.xl,
    ...sombra.media,
  },
  pressavel: {
    borderRadius: 20,
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

  // Badge — identidade do jogo, posição discreta
  badgeWrap: {
    left: espacamento.md,
    position: 'absolute',
    top: espacamento.md,
  },
  badge: {
    backgroundColor: cores.primaria,
    borderRadius: raio.pill,
    paddingHorizontal: espacamento.sm + 2,
    paddingVertical: 4,
  },
  badgeTexto: {
    color: cores.textoSobrePrimaria,
    fontFamily: familias.sans,
    fontSize: 10,
    fontWeight: '700' as const,
    letterSpacing: 0.8,
  },

  // Conteúdo — compacto, direto ao ponto
  conteudo: {
    gap: espacamento.xs,
    paddingBottom: espacamento.md,
    paddingHorizontal: espacamento.md,
  },
  nome: {
    color: cores.textoSobrePrimaria,
    fontFamily: familias.sans,
    fontWeight: '800' as const,
    fontSize: tipografia.tamanhoTitulo, // 26px — legível, não cinematográfico
    letterSpacing: -0.4,
    lineHeight: 32,
  },
  slogan: {
    color: COR_TEXTO_SECUNDARIO_SOBRE_IMAGEM,
    fontSize: tipografia.tamanhoCorpoMenor,
    fontWeight: tipografia.pesoRegular,
    letterSpacing: 0,
    lineHeight: 20,
  },

  // CTA: botão vermelho explícito — ação social clara
  ctaRow: {
    alignItems: 'flex-start',
    marginTop: espacamento.xs,
  },
  ctaBotao: {
    backgroundColor: cores.primaria,
    borderRadius: raio.pill,
    paddingHorizontal: espacamento.md,
    paddingVertical: 7,
  },
  ctaTexto: {
    color: cores.textoSobrePrimaria,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCaption,
    fontWeight: '700' as const,
    letterSpacing: 0.1,
  },
});
