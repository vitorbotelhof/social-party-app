import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BotaoSecundario } from '@/components';
import { JOGOS, type DefinicaoJogo } from '@/games/gameRegistry';
import type { RootStackParamList } from '@/navigation/types';
import { cores, espacamento, raio, tipografia } from '@/theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'SelecaoJogo'>;

const ALTURA_CARD = 160;
const STAGGER_MS = 40;
const GRADIENTE_OVERLAY: [string, string, string] = [
  'rgba(0,0,0,0)',
  'rgba(0,0,0,0.45)',
  'rgba(0,0,0,0.9)',
];

export function TelaSelecaoJogo({ navigation }: Props) {
  const headerOp = useRef(new Animated.Value(0)).current;
  const headerY = useRef(new Animated.Value(12)).current;
  const rodapeOp = useRef(new Animated.Value(0)).current;
  const cardsAnim = useMemo(
    () =>
      JOGOS.map(() => ({
        op: new Animated.Value(0),
        y: new Animated.Value(20),
      })),
    [],
  );

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerOp, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(headerY, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.stagger(
      STAGGER_MS,
      cardsAnim.map((anim) =>
        Animated.parallel([
          Animated.timing(anim.op, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(anim.y, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]),
      ),
    ).start();

    Animated.timing(rodapeOp, {
      toValue: 1,
      delay: STAGGER_MS * JOGOS.length + 80,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [cardsAnim, headerOp, headerY, rodapeOp]);

  function aoEscolherJogo(jogo: DefinicaoJogo) {
    if (!jogo.disponivel) return;
    navigation.navigate('DetalhesJogo', { jogoId: jogo.id });
  }

  return (
    <SafeAreaView style={estilos.tela} edges={['top', 'bottom']}>
      <Animated.View
        style={[
          estilos.header,
          { opacity: headerOp, transform: [{ translateY: headerY }] },
        ]}
      >
        <Text style={estilos.subtitulo}>qual o clima hoje?</Text>
      </Animated.View>

      <ScrollView
        style={estilos.scroll}
        contentContainerStyle={estilos.scrollConteudo}
        showsVerticalScrollIndicator={false}
      >
        {JOGOS.map((jogo, indice) => (
          <Animated.View
            key={jogo.id}
            style={{
              opacity: cardsAnim[indice].op,
              transform: [{ translateY: cardsAnim[indice].y }],
            }}
          >
            <CardJogo jogo={jogo} onPress={() => aoEscolherJogo(jogo)} />
          </Animated.View>
        ))}
      </ScrollView>

      <Animated.View style={[estilos.rodape, { opacity: rodapeOp }]}>
        <BotaoSecundario
          titulo="entrar em partida"
          onPress={() => navigation.navigate('EntrarSala')}
        />
      </Animated.View>
    </SafeAreaView>
  );
}

interface CardJogoProps {
  jogo: DefinicaoJogo;
  onPress: () => void;
}

function CardJogo({ jogo, onPress }: CardJogoProps) {
  const escala = useRef(new Animated.Value(1)).current;

  function aoPressionar() {
    if (!jogo.disponivel) return;
    Animated.spring(escala, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 40,
      bounciness: 0,
    }).start();
  }

  function aoSoltar() {
    if (!jogo.disponivel) return;
    Animated.spring(escala, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 8,
    }).start();
  }

  const intensidadeTexto = '·'.repeat(jogo.intensidade);

  return (
    <Animated.View
      style={[
        estilos.cardWrapper,
        jogo.disponivel && estilos.cardWrapperAtivo,
        { transform: [{ scale: escala }] },
      ]}
    >
      <Pressable
        onPress={onPress}
        onPressIn={aoPressionar}
        onPressOut={aoSoltar}
        disabled={!jogo.disponivel}
        style={estilos.cardPressavel}
      >
        <ImageBackground
          source={jogo.cover}
          style={estilos.cardImagem}
          imageStyle={estilos.cardImagemRaio}
        >
          <LinearGradient
            colors={GRADIENTE_OVERLAY}
            locations={[0, 0.5, 1]}
            style={estilos.overlayGradiente}
          />

          <View style={estilos.barraTopo}>
            <View style={estilos.badge}>
              <Text style={estilos.badgeTexto}>
                {jogo.minJogadores}–{jogo.maxJogadores} jogadores
              </Text>
            </View>
            <View style={estilos.badge}>
              <Text style={estilos.badgeTexto}>{intensidadeTexto}</Text>
            </View>
          </View>

          <View style={estilos.blocoTexto}>
            <Text style={estilos.cardNome} numberOfLines={1}>
              {jogo.nome}
            </Text>
            <Text style={estilos.cardSlogan} numberOfLines={2}>
              {jogo.slogan}
            </Text>
          </View>

          {!jogo.disponivel && (
            <View style={estilos.overlayEmBreve}>
              <View style={estilos.selo}>
                <Text style={estilos.seloTexto}>EM BREVE</Text>
              </View>
            </View>
          )}
        </ImageBackground>
      </Pressable>
    </Animated.View>
  );
}

const estilos = StyleSheet.create({
  badge: {
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    borderRadius: raio.pill,
    paddingHorizontal: espacamento.sm + 2,
    paddingVertical: 4,
  },
  badgeTexto: {
    color: cores.texto,
    fontSize: tipografia.tamanhoLegenda,
    fontWeight: tipografia.pesoBold,
    letterSpacing: 0.3,
  },
  barraTopo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: espacamento.md,
  },
  blocoTexto: {
    padding: espacamento.md,
  },
  cardImagem: {
    flex: 1,
    height: ALTURA_CARD,
    justifyContent: 'space-between',
  },
  cardImagemRaio: {
    borderRadius: raio.lg,
  },
  cardNome: {
    color: cores.textoSobrePrimaria,
    fontSize: tipografia.tamanhoSubtitulo,
    fontWeight: tipografia.pesoExtraBold,
    letterSpacing: tipografia.letraSpacingTitulo,
  },
  cardPressavel: {
    borderRadius: raio.lg,
    overflow: 'hidden',
  },
  cardSlogan: {
    color: cores.textoSecundario,
    fontSize: tipografia.tamanhoCorpoMenor,
    marginTop: 2,
  },
  cardWrapper: {
    borderRadius: raio.lg,
    marginBottom: espacamento.md - 4,
  },
  cardWrapperAtivo: {
    borderColor: 'rgba(139, 92, 246, 0.5)',
    borderWidth: 1.5,
  },
  header: {
    paddingBottom: espacamento.lg,
    paddingHorizontal: espacamento.lg,
    paddingTop: espacamento.lg,
  },
  legenda: {
    color: cores.textoSecundario,
    fontSize: tipografia.tamanhoMicro,
    fontWeight: tipografia.pesoBold,
    letterSpacing: tipografia.letraSpacingLegenda,
  },
  overlayEmBreve: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  overlayGradiente: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  rodape: {
    paddingBottom: espacamento.md,
    paddingHorizontal: espacamento.lg,
    paddingTop: espacamento.md,
  },
  scroll: {
    flex: 1,
  },
  scrollConteudo: {
    paddingBottom: espacamento.lg,
    paddingHorizontal: espacamento.lg,
  },
  selo: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderColor: cores.texto,
    borderRadius: raio.sm,
    borderWidth: 1,
    paddingHorizontal: espacamento.md,
    paddingVertical: espacamento.sm - 2,
  },
  seloTexto: {
    color: cores.texto,
    fontSize: tipografia.tamanhoLegenda,
    fontWeight: tipografia.pesoExtraBold,
    letterSpacing: tipografia.spacingLabel,
  },
  subtitulo: {
    color: cores.textoSecundario,
    fontSize: tipografia.tamanhoSubtitulo,
    fontWeight: tipografia.pesoLeve,
    marginTop: espacamento.xs,
  },
  tela: {
    backgroundColor: cores.fundo,
    flex: 1,
  },
});
