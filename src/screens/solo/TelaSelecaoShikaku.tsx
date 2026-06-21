import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useMemo, useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';

import { BotaoVoltar, SegmentControl } from '@/components';
import { puzzlesPorDificuldade } from '@/games/solo/shikaku';
import type { DificuldadeSolo } from '@/games/solo/types';
import type { SoloStackParamList } from '@/navigation/types';
import {
  carregarProgressoShikaku,
  obterProgressoCache,
  type MapaProgressoShikaku,
} from '@/services/solo/progressoShikaku';
import { cores, espacamento, familias, raio, tipografia } from '@/theme/colors';

type Props = NativeStackScreenProps<SoloStackParamList, 'SelecaoShikaku'>;

const COR_SHIKAKU = '#0EA5E9';
const FATOR_ALTURA_BANNER = 0.26;
const RAIO_CARD = 24;
const GRADIENTE_FADE: [string, string] = ['rgba(13, 13, 13, 0)', cores.fundo];

const OPCOES_DIFICULDADE: { valor: DificuldadeSolo; rotulo: string }[] = [
  { valor: 'facil', rotulo: 'Fácil' },
  { valor: 'medio', rotulo: 'Médio' },
  { valor: 'dificil', rotulo: 'Difícil' },
];

export function TelaSelecaoShikaku({ navigation }: Props) {
  const { height } = useWindowDimensions();
  const alturaBanner = height * FATOR_ALTURA_BANNER;

  const [dificuldade, setDificuldade] = useState<DificuldadeSolo>('facil');
  const [progresso, setProgresso] = useState<MapaProgressoShikaku>(
    obterProgressoCache(),
  );

  useFocusEffect(
    useCallback(() => {
      let ativo = true;
      void carregarProgressoShikaku().then((p) => {
        if (ativo) setProgresso({ ...p });
      });
      return () => {
        ativo = false;
      };
    }, []),
  );

  const puzzles = useMemo(
    () => puzzlesPorDificuldade(dificuldade),
    [dificuldade],
  );

  const concluidosNaDificuldade = puzzles.filter(
    (p) => progresso[p.id]?.concluido,
  ).length;

  function aoAbrir(puzzleId: string) {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('Shikaku', { puzzleId });
  }

  return (
    <View style={estilos.tela}>
      <View style={[estilos.bannerWrapper, { height: alturaBanner }]}>
        <Image
          source={require('../../../assets/games/shikaku/banner.png')}
          style={estilos.banner}
          resizeMode="cover"
        />
        <LinearGradient colors={GRADIENTE_FADE} style={estilos.bannerFade} />
      </View>

      <BotaoVoltar
        onPress={() => navigation.goBack()}
        topOffset={espacamento.md}
      />

      <ScrollView
        style={estilos.scroll}
        contentContainerStyle={{ paddingTop: alturaBanner - RAIO_CARD }}
        showsVerticalScrollIndicator={false}
      >
        <View style={estilos.card}>
          <Text style={estilos.titulo}>Shikaku</Text>
          <Text style={estilos.subtitulo}>escolha um desafio</Text>

          <View style={estilos.segmentWrapper}>
            <SegmentControl
              opcoes={OPCOES_DIFICULDADE}
              valor={dificuldade}
              onChange={setDificuldade}
            />
          </View>

          <Text style={estilos.contador}>
            {concluidosNaDificuldade} de {puzzles.length} concluídos
          </Text>

          <View style={estilos.grade}>
            {puzzles.map((p, i) => {
              const prog = progresso[p.id];
              const concluido = prog?.concluido ?? false;
              return (
                <TouchableOpacity
                  key={p.id}
                  style={[estilos.cardPuzzle, concluido && estilos.cardConcluido]}
                  onPress={() => aoAbrir(p.id)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      estilos.cardNumero,
                      concluido && estilos.cardNumeroConcluido,
                    ]}
                  >
                    {i + 1}
                  </Text>

                  {concluido ? (
                    <View style={estilos.cardRodape}>
                      <View style={estilos.estrelasLinha}>
                        {[1, 2, 3].map((n) => (
                          <Text
                            key={n}
                            style={[
                              estilos.estrela,
                              n <= (prog?.melhoresEstrelas ?? 0)
                                ? estilos.estrelaCheia
                                : estilos.estrelaVazia,
                            ]}
                          >
                            ★
                          </Text>
                        ))}
                      </View>
                      <Text style={estilos.cardTempo}>
                        {formatarTempo(prog?.melhorTempo ?? 0)}
                      </Text>
                    </View>
                  ) : (
                    <Text style={estilos.cardPendente}>jogar</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function formatarTempo(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

const estilos = StyleSheet.create({
  banner: {
    height: '100%',
    width: '100%',
  },
  bannerFade: {
    bottom: 0,
    height: 64,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  bannerWrapper: {
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    width: '100%',
  },
  card: {
    backgroundColor: cores.fundo,
    borderTopLeftRadius: RAIO_CARD,
    borderTopRightRadius: RAIO_CARD,
    paddingBottom: espacamento.xl,
    paddingHorizontal: espacamento.md,
    paddingTop: espacamento.lg,
  },
  cardConcluido: {
    borderColor: COR_SHIKAKU,
  },
  cardNumero: {
    color: cores.textoSecundario,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoTituloGrande,
    fontWeight: '800',
  },
  cardNumeroConcluido: {
    color: COR_SHIKAKU,
  },
  cardPendente: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    fontWeight: '600',
  },
  cardPuzzle: {
    alignItems: 'center',
    backgroundColor: cores.fundoSecundario,
    borderColor: cores.borda,
    borderRadius: raio.lg,
    borderWidth: 1,
    gap: espacamento.xs,
    justifyContent: 'center',
    paddingVertical: espacamento.md,
    width: '47%',
  },
  cardRodape: {
    alignItems: 'center',
    gap: 2,
  },
  cardTempo: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
  },
  contador: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    marginBottom: espacamento.sm,
    textAlign: 'center',
  },
  estrela: {
    fontSize: 14,
  },
  estrelaCheia: {
    color: '#FBBF24',
  },
  estrelaVazia: {
    color: cores.borda,
  },
  estrelasLinha: {
    flexDirection: 'row',
    gap: 2,
  },
  grade: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: espacamento.sm,
    justifyContent: 'space-between',
  },
  scroll: {
    flex: 1,
    zIndex: 1,
  },
  segmentWrapper: {
    marginTop: espacamento.md,
    marginBottom: espacamento.sm,
  },
  subtitulo: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpo,
    marginTop: 2,
  },
  tela: {
    backgroundColor: cores.fundo,
    flex: 1,
  },
  titulo: {
    color: cores.texto,
    fontFamily: familias.sans,
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
});
