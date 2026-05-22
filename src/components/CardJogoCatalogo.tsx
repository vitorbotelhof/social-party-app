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

import { cores, espacamento, familias, raio, tipografia } from '@/theme/colors';

const LARGURA_PADRAO = 124;
const ALTURA_IMAGEM_PADRAO = 124;
const LARGURA_COMPACTA = 112;
const ALTURA_IMAGEM_COMPACTA = 112;

const GRADIENTE_CARD: [string, string, string] = [
  'rgba(22,14,10,0)',
  'rgba(22,14,10,0.16)',
  'rgba(22,14,10,0.58)',
];
const COR_OVERLAY_INDISPONIVEL = 'rgba(22,14,10,0.58)';
const COR_SELO_FUNDO = 'rgba(255,255,255,0.18)';
const COR_SELO_BORDA = 'rgba(255,255,255,0.38)';

export interface JogoCatalogoItem {
  id: string;
  nome: string;
  slogan: string;
  cover: ImageSourcePropType;
  disponivel: boolean;
  meta?: string;
}

interface Props {
  jogo: JogoCatalogoItem;
  onPress: (jogo: JogoCatalogoItem) => void;
  compacto?: boolean;
  largura?: number;
  alturaImagem?: number;
}

export function CardJogoCatalogo({
  jogo,
  onPress,
  compacto = false,
  largura,
  alturaImagem,
}: Props) {
  const escala = useRef(new Animated.Value(1)).current;
  const larguraCard = largura ?? (compacto ? LARGURA_COMPACTA : LARGURA_PADRAO);
  const alturaImagemCard =
    alturaImagem ?? (compacto ? ALTURA_IMAGEM_COMPACTA : ALTURA_IMAGEM_PADRAO);

  function aoPressionar() {
    Animated.spring(escala, {
      toValue: 0.97,
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
      bounciness: 5,
    }).start();
  }

  function aoTocar() {
    if (!jogo.disponivel) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress(jogo);
  }

  return (
    <Animated.View
      style={[
        estilos.container,
        { width: larguraCard, transform: [{ scale: escala }] },
      ]}
    >
      <Pressable
        onPress={aoTocar}
        onPressIn={aoPressionar}
        onPressOut={aoSoltar}
        disabled={!jogo.disponivel}
        accessibilityRole="button"
        accessibilityLabel={`${jogo.disponivel ? 'Jogar' : 'Em breve'} ${jogo.nome}`}
        style={estilos.pressavel}
      >
        <ImageBackground
          source={jogo.cover}
          style={[estilos.imagem, { height: alturaImagemCard }]}
          imageStyle={estilos.imagemRaio}
        >
          <LinearGradient
            colors={GRADIENTE_CARD}
            style={StyleSheet.absoluteFillObject}
          />

          {!jogo.disponivel && (
            <View style={estilos.overlayIndisponivel}>
              <View style={estilos.selo}>
                <Text style={estilos.seloTexto}>em breve</Text>
              </View>
            </View>
          )}
        </ImageBackground>

        <View style={estilos.textos}>
          <Text style={estilos.nome} numberOfLines={2}>
            {jogo.nome}
          </Text>
          <Text style={estilos.slogan} numberOfLines={compacto ? 2 : 3}>
            {jogo.slogan}
          </Text>
          {jogo.meta ? (
            <Text style={estilos.meta} numberOfLines={1}>
              {jogo.meta}
            </Text>
          ) : null}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const estilos = StyleSheet.create({
  container: {
    flexShrink: 0,
  },
  imagem: {
    backgroundColor: cores.superficieElevada,
    borderRadius: raio.sm,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  imagemRaio: {
    borderRadius: raio.sm,
  },
  meta: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoMicro,
    lineHeight: 14,
  },
  nome: {
    color: cores.texto,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCaption,
    fontWeight: tipografia.pesoExtraBold,
    letterSpacing: 0,
    lineHeight: 17,
  },
  overlayIndisponivel: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    backgroundColor: COR_OVERLAY_INDISPONIVEL,
    justifyContent: 'center',
  },
  pressavel: {
    gap: espacamento.sm - 2,
  },
  selo: {
    backgroundColor: COR_SELO_FUNDO,
    borderColor: COR_SELO_BORDA,
    borderRadius: raio.sm,
    borderWidth: 1,
    paddingHorizontal: espacamento.sm,
    paddingVertical: 5,
  },
  seloTexto: {
    color: cores.textoSobrePrimaria,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoMicro,
    fontWeight: tipografia.pesoBold,
    letterSpacing: 0,
    textTransform: 'lowercase',
  },
  slogan: {
    color: cores.textoSecundario,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    lineHeight: 15,
  },
  textos: {
    gap: 2,
    minHeight: 76,
  },
});
