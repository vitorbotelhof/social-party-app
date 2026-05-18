import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { useEffect, useRef } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { JOGOS } from '@/games/gameRegistry';
import type { RootStackParamList } from '@/navigation/types';
import { tutorialFoiVisto } from '@/services/tutorial';
import { cores, espacamento, raio, tipografia } from '@/theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'SelecaoDinamica'>;

interface OpcaoDinamica {
  id: 'local' | 'realtime' | 'entrar';
  icone: string;
  titulo: string;
  descricao: string;
  destaque: boolean;
}

const MAX_OPCOES = 3;

export function TelaSelecaoDinamica({ navigation, route }: Props) {
  const { jogoId } = route.params;
  const insets = useSafeAreaInsets();
  const jogo = JOGOS.find((j) => j.id === jogoId);

  const opcoes: OpcaoDinamica[] = [];
  if (jogo?.supportsLocal) {
    opcoes.push({
      id: 'local',
      icone: '📱',
      titulo: 'um celular',
      descricao: 'passem de mão em mão. cada um na sua vez.',
      destaque: true,
    });
  }
  if (jogo?.supportsRealtime) {
    opcoes.push({
      id: 'realtime',
      icone: '👥',
      titulo: 'cada um no seu',
      descricao: 'todo mundo com o celular. cada um vê algo diferente.',
      destaque: true,
    });
  }
  opcoes.push({
    id: 'entrar',
    icone: '🔑',
    titulo: 'já tenho código',
    descricao: 'alguém já montou a sala. só entrar.',
    destaque: false,
  });

  const headerOp = useRef(new Animated.Value(0)).current;
  const headerY = useRef(new Animated.Value(10)).current;
  const cardsAnim = useRef(
    Array.from({ length: MAX_OPCOES }, () => ({
      op: new Animated.Value(0),
      y: new Animated.Value(20),
    })),
  ).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerOp, { toValue: 1, duration: 380, useNativeDriver: true }),
      Animated.timing(headerY, { toValue: 0, duration: 380, useNativeDriver: true }),
    ]).start();

    Animated.stagger(
      80,
      cardsAnim.slice(0, opcoes.length).map((anim) =>
        Animated.parallel([
          Animated.timing(anim.op, { toValue: 1, duration: 360, useNativeDriver: true }),
          Animated.timing(anim.y, { toValue: 0, duration: 360, useNativeDriver: true }),
        ]),
      ),
    ).start();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function aoEscolher(id: OpcaoDinamica['id']) {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (id === 'local') {
      navigation.navigate('ConfiguracaoLocal');
    } else if (id === 'realtime') {
      if (jogoId === 'mrwhite' && !(await tutorialFoiVisto('mrwhite'))) {
        navigation.navigate('Tutorial', { jogoId });
        return;
      }
      navigation.navigate('CriarSala', { jogoId });
    } else {
      navigation.navigate('EntrarSala');
    }
  }

  if (!jogo) return null;

  return (
    <View style={[estilos.tela, { paddingTop: insets.top }]}>
      <Pressable
        onPress={() => navigation.goBack()}
        hitSlop={12}
        style={({ pressed }) => [
          estilos.botaoVoltar,
          pressed && estilos.botaoVoltarPressionado,
        ]}
      >
        <Text style={estilos.botaoVoltarIcone}>←</Text>
      </Pressable>

      <ScrollView
        style={estilos.scroll}
        contentContainerStyle={[
          estilos.scrollConteudo,
          { paddingBottom: Math.max(insets.bottom, espacamento.md) + espacamento.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            estilos.cabecalho,
            { opacity: headerOp, transform: [{ translateY: headerY }] },
          ]}
        >
          <Text style={estilos.nomeJogo}>{jogo.nome}</Text>
          <Text style={estilos.pergunta}>como vocês{'\n'}querem jogar?</Text>
        </Animated.View>

        <View style={estilos.listaOpcoes}>
          {opcoes.map((opcao, i) => (
            <Animated.View
              key={opcao.id}
              style={{
                opacity: cardsAnim[i]!.op,
                transform: [{ translateY: cardsAnim[i]!.y }],
              }}
            >
              <CardOpcao opcao={opcao} onPress={() => aoEscolher(opcao.id)} />
            </Animated.View>
          ))}
        </View>

        <Animated.View style={{ opacity: headerOp }}>
          <Pressable
            onPress={() => navigation.navigate('DetalhesJogo', { jogoId })}
            style={({ pressed }) => [
              estilos.linkRegras,
              pressed && estilos.linkRegrasPressionado,
            ]}
          >
            <Text style={estilos.linkRegrasTexto}>entender o jogo →</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

interface CardOpcaoProps {
  opcao: OpcaoDinamica;
  onPress: () => void;
}

function CardOpcao({ opcao, onPress }: CardOpcaoProps) {
  const escala = useRef(new Animated.Value(1)).current;

  return (
    <Animated.View style={{ transform: [{ scale: escala }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={() => {
          Animated.spring(escala, {
            toValue: 0.97,
            useNativeDriver: true,
            speed: 40,
            bounciness: 0,
          }).start();
        }}
        onPressOut={() => {
          Animated.spring(escala, {
            toValue: 1,
            useNativeDriver: true,
            speed: 30,
            bounciness: 6,
          }).start();
        }}
        style={[estilos.card, opcao.destaque && estilos.cardDestaque]}
      >
        <View style={[estilos.iconeContainer, opcao.destaque && estilos.iconeContainerDestaque]}>
          <Text style={estilos.icone}>{opcao.icone}</Text>
        </View>
        <View style={estilos.cardTextos}>
          <Text style={[estilos.cardTitulo, !opcao.destaque && estilos.cardTituloSecundario]}>
            {opcao.titulo}
          </Text>
          <Text style={estilos.cardDescricao}>{opcao.descricao}</Text>
        </View>
        <Text style={[estilos.seta, !opcao.destaque && estilos.setaSecundaria]}>→</Text>
      </Pressable>
    </Animated.View>
  );
}

const estilos = StyleSheet.create({
  botaoVoltar: {
    alignItems: 'center',
    backgroundColor: cores.superficie,
    borderRadius: raio.pill,
    height: 40,
    justifyContent: 'center',
    left: espacamento.lg,
    marginTop: espacamento.md,
    position: 'absolute',
    width: 40,
    zIndex: 10,
  },
  botaoVoltarIcone: {
    color: cores.texto,
    fontSize: 20,
    fontWeight: tipografia.pesoBold,
    lineHeight: 22,
  },
  botaoVoltarPressionado: {
    opacity: 0.6,
  },
  cabecalho: {
    paddingBottom: espacamento.xl,
    paddingTop: 72,
  },
  card: {
    alignItems: 'center',
    backgroundColor: cores.superficie,
    borderColor: cores.borda,
    borderRadius: raio.xl,
    borderWidth: 1,
    flexDirection: 'row',
    gap: espacamento.md,
    paddingHorizontal: espacamento.lg,
    paddingVertical: espacamento.md + 4,
  },
  cardDescricao: {
    color: cores.textoSecundario,
    fontSize: tipografia.tamanhoCorpoMenor,
    lineHeight: 20,
    marginTop: 2,
  },
  cardDestaque: {
    borderColor: 'rgba(139, 92, 246, 0.35)',
  },
  cardTextos: {
    flex: 1,
  },
  cardTitulo: {
    color: cores.texto,
    fontSize: tipografia.tamanhoCorpoMaior,
    fontWeight: tipografia.pesoBold,
  },
  cardTituloSecundario: {
    color: cores.textoSecundario,
    fontWeight: tipografia.pesoSemibold,
  },
  icone: {
    fontSize: 22,
  },
  iconeContainer: {
    alignItems: 'center',
    backgroundColor: cores.superficieElevada,
    borderRadius: raio.md,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  iconeContainerDestaque: {
    backgroundColor: 'rgba(139, 92, 246, 0.18)',
  },
  linkRegras: {
    alignItems: 'center',
    marginTop: espacamento.xl,
    paddingVertical: espacamento.sm,
  },
  linkRegrasPressionado: {
    opacity: 0.5,
  },
  linkRegrasTexto: {
    color: cores.textoMudo,
    fontSize: tipografia.tamanhoLegenda,
    letterSpacing: 0.3,
  },
  listaOpcoes: {
    gap: espacamento.md - 4,
  },
  nomeJogo: {
    color: cores.primaria,
    fontSize: tipografia.tamanhoMicro,
    fontWeight: tipografia.pesoExtraBold,
    letterSpacing: tipografia.letraSpacingLegenda,
    marginBottom: espacamento.sm,
  },
  pergunta: {
    color: cores.texto,
    fontSize: tipografia.tamanhoTitulo,
    fontWeight: tipografia.pesoExtraBold,
    letterSpacing: tipografia.spacingTitulo,
    lineHeight: 36,
  },
  scroll: {
    flex: 1,
  },
  scrollConteudo: {
    paddingHorizontal: espacamento.lg,
  },
  seta: {
    color: cores.primaria,
    fontSize: 20,
    fontWeight: tipografia.pesoBold,
  },
  setaSecundaria: {
    color: cores.textoMudo,
  },
  tela: {
    backgroundColor: cores.fundo,
    flex: 1,
  },
});
