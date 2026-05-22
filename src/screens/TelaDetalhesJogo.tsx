import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useRef } from 'react';
import {
  Animated,
  Image,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BotaoPrimario, BotaoSecundario, BotaoVoltar } from '@/components';
import { JOGOS } from '@/games/gameRegistry';
import type { RootStackParamList } from '@/navigation/types';
import { tutorialFoiVisto } from '@/services/tutorial';
import { cores, espacamento, raio, tipografia } from '@/theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'DetalhesJogo'>;

const FATOR_ALTURA_COVER = 0.45;
const ALTURA_GRADIENTE_BASE = 96;
const RAIO_CARD = 24;
const GRADIENTE_FADE: [string, string] = ['rgba(13, 13, 13, 0)', cores.fundo];
const COR_TRANSPARENTE = 'rgba(0,0,0,0)';

export function TelaDetalhesJogo({ navigation, route }: Props) {
  const { jogoId } = route.params;
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const alturaCover = height * FATOR_ALTURA_COVER;
  const jogo = JOGOS.find((j) => j.id === jogoId);
  const scrollY = useRef(new Animated.Value(0)).current;

  if (!jogo) {
    return (
      <View
        style={[
          estilos.estadoVazio,
          { paddingTop: insets.top, paddingBottom: insets.bottom },
        ]}
      >
        <Text style={estilos.estadoVazioTexto}>Jogo não encontrado.</Text>
        <BotaoSecundario titulo="Voltar" onPress={() => navigation.goBack()} />
      </View>
    );
  }

  const intensidadeTexto = '·'.repeat(jogo.intensidade);

  async function aoCriarSala() {
    if (jogo!.id === 'mrwhite' && !(await tutorialFoiVisto('mrwhite'))) {
      navigation.navigate('Tutorial', { jogoId: jogo!.id });
      return;
    }
    navigation.navigate('CriarSala', { jogoId: jogo!.id });
  }

  function aoEntrarSala() {
    navigation.navigate('EntrarSala');
  }

  const aoScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: true },
  );

  const imagemTranslateY = scrollY.interpolate({
    inputRange: [0, alturaCover],
    outputRange: [0, -alturaCover / 2],
    extrapolate: 'clamp',
  });

  const alturaRodape =
    espacamento.md + espacamento.md + 56 + 56 + espacamento.sm;
  const paddingBottomConteudo =
    alturaRodape + Math.max(insets.bottom, espacamento.md) + espacamento.lg;

  return (
    <View style={estilos.tela}>
      <Animated.View
        style={[
          estilos.imagemWrapper,
          {
            height: alturaCover,
            transform: [{ translateY: imagemTranslateY }],
          },
        ]}
        pointerEvents="none"
      >
        <Image source={jogo.cover} style={estilos.imagem} resizeMode="cover" />
        <LinearGradient
          colors={GRADIENTE_FADE}
          style={[estilos.fadeBase, { height: ALTURA_GRADIENTE_BASE }]}
        />
      </Animated.View>

      <Animated.ScrollView
        style={estilos.scroll}
        contentContainerStyle={{ paddingTop: alturaCover - RAIO_CARD }}
        onScroll={aoScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        <View style={[estilos.card, { paddingBottom: paddingBottomConteudo }]}>
          <Text style={estilos.nome}>{jogo.nome}</Text>
          <Text style={estilos.slogan}>{jogo.slogan}</Text>

          <View style={estilos.badges}>
            <View style={estilos.badge}>
              <Text style={estilos.badgeTexto}>
                {jogo.minJogadores}–{jogo.maxJogadores} jogadores
              </Text>
            </View>
            <View style={estilos.badge}>
              <Text style={estilos.badgeTexto}>{jogo.tempoMedio}</Text>
            </View>
            <View style={estilos.badge}>
              <Text style={estilos.badgeTexto}>{intensidadeTexto}</Text>
            </View>
          </View>

          <View style={estilos.divisor} />

          <Text style={estilos.descricao}>{jogo.instrucoes.objetivo}</Text>

          <Text style={estilos.rotuloSecao}>como jogar</Text>
          <View style={estilos.listaPassos}>
            {jogo.instrucoes.passos.map((passo, indice) => (
              <View key={indice} style={estilos.passo}>
                <View style={estilos.numeroCirculo}>
                  <Text style={estilos.numeroTexto}>{indice + 1}</Text>
                </View>
                <Text style={estilos.passoTexto}>{passo}</Text>
              </View>
            ))}
          </View>

          <Text style={estilos.rotuloSecao}>dicas</Text>
          <View style={estilos.listaDicas}>
            {jogo.instrucoes.dicas.map((dica, indice) => (
              <View key={indice} style={estilos.dica}>
                <Text style={estilos.dicaBullet}>▸</Text>
                <Text style={estilos.dicaTexto}>{dica}</Text>
              </View>
            ))}
          </View>
        </View>
      </Animated.ScrollView>

      <BotaoVoltar
        onPress={() => navigation.goBack()}
        topOffset={espacamento.md}
      />

      <View
        style={[
          estilos.rodape,
          { paddingBottom: Math.max(insets.bottom, espacamento.md) },
        ]}
      >
        <BotaoPrimario titulo="criar sala" onPress={aoCriarSala} />
        <BotaoSecundario titulo="entrar em sala" onPress={aoEntrarSala} />
      </View>
    </View>
  );
}

const TAMANHO_NUMERO = 32;

const estilos = StyleSheet.create({
  badge: {
    backgroundColor: cores.superficie,
    borderRadius: raio.pill,
    paddingHorizontal: espacamento.md - 4,
    paddingVertical: 6,
  },
  badgeTexto: {
    color: cores.texto,
    fontSize: tipografia.tamanhoLegenda,
    fontWeight: tipografia.pesoSemibold,
    letterSpacing: 0.3,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: espacamento.sm,
    marginTop: espacamento.lg - 4,
  },
  card: {
    backgroundColor: cores.fundo,
    borderTopLeftRadius: RAIO_CARD,
    borderTopRightRadius: RAIO_CARD,
    paddingHorizontal: espacamento.lg,
    paddingTop: RAIO_CARD,
  },
  descricao: {
    color: cores.textoSecundario,
    fontSize: tipografia.tamanhoCorpo,
    lineHeight: 22,
    marginTop: espacamento.lg,
  },
  dica: {
    flexDirection: 'row',
    gap: espacamento.sm + 2,
  },
  dicaBullet: {
    color: cores.primaria,
    fontSize: 18,
    fontWeight: tipografia.pesoBold,
    lineHeight: 22,
  },
  dicaTexto: {
    color: cores.texto,
    flex: 1,
    fontSize: tipografia.tamanhoCorpoMenor,
    lineHeight: 22,
  },
  divisor: {
    backgroundColor: cores.borda,
    height: 1,
    marginTop: espacamento.lg,
  },
  estadoVazio: {
    alignItems: 'center',
    backgroundColor: cores.fundo,
    flex: 1,
    gap: espacamento.lg,
    justifyContent: 'center',
    padding: espacamento.lg,
  },
  estadoVazioTexto: {
    color: cores.textoSecundario,
    fontSize: tipografia.tamanhoCorpo,
    textAlign: 'center',
  },
  fadeBase: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  imagem: {
    height: '100%',
    width: '100%',
  },
  imagemWrapper: {
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    width: '100%',
    zIndex: 0,
  },
  listaDicas: {
    gap: espacamento.md - 4,
    marginTop: espacamento.md - 4,
  },
  listaPassos: {
    gap: espacamento.lg - 4,
    marginTop: espacamento.md,
  },
  nome: {
    color: cores.texto,
    fontSize: 36,
    fontWeight: tipografia.pesoExtraBold,
    letterSpacing: tipografia.spacingTitulo,
  },
  numeroCirculo: {
    alignItems: 'center',
    backgroundColor: cores.primaria,
    borderRadius: TAMANHO_NUMERO / 2,
    height: TAMANHO_NUMERO,
    justifyContent: 'center',
    width: TAMANHO_NUMERO,
  },
  numeroTexto: {
    color: cores.textoSobrePrimaria,
    fontSize: 15,
    fontWeight: tipografia.pesoExtraBold,
  },
  passo: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: espacamento.md - 4,
  },
  passoTexto: {
    color: cores.texto,
    flex: 1,
    fontSize: tipografia.tamanhoCorpoMenor,
    lineHeight: 22,
    paddingTop: 6,
  },
  rodape: {
    backgroundColor: cores.fundo,
    borderTopColor: cores.borda,
    borderTopWidth: 1,
    bottom: 0,
    gap: espacamento.md - 4,
    left: 0,
    paddingHorizontal: espacamento.lg,
    paddingTop: espacamento.md,
    position: 'absolute',
    right: 0,
    zIndex: 5,
  },
  rotuloSecao: {
    color: cores.textoSecundario,
    fontSize: tipografia.tamanhoMicro,
    fontWeight: tipografia.pesoBold,
    letterSpacing: tipografia.letraSpacingLegenda,
    marginTop: espacamento.xl - 4,
  },
  scroll: {
    backgroundColor: COR_TRANSPARENTE,
    flex: 1,
    height: '100%',
    zIndex: 1,
  },
  slogan: {
    color: cores.textoSecundario,
    fontSize: 16,
    marginTop: espacamento.sm - 2,
  },
  tela: {
    backgroundColor: cores.fundo,
    flex: 1,
  },
});
