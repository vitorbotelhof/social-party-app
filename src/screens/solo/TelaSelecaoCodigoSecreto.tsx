import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';

import { BotaoVoltar } from '@/components';
import {
  CONFIG_DIFICULDADE_CS,
  PALETA_CORES_CS,
} from '@/games/solo/codigo-secreto';
import { LABEL_DIFICULDADE } from '@/games/solo/types';
import type { DificuldadeSolo } from '@/games/solo/types';
import type { SoloStackParamList } from '@/navigation/types';
import {
  carregarProgressoCS,
  obterProgressoCacheCS,
  type MapaProgressoCS,
} from '@/services/solo/progressoCodigoSecreto';
import {
  cores,
  espacamento,
  familias,
  raio,
  sombra,
  tipografia,
} from '@/theme/colors';

type Props = NativeStackScreenProps<SoloStackParamList, 'SelecaoCodigoSecreto'>;

const COR_CS = '#8B5CF6';
const FATOR_ALTURA_BANNER = 0.26;
const RAIO_CARD = 24;
const GRADIENTE_FADE: [string, string] = ['rgba(13, 13, 13, 0)', cores.fundo];

const DIFICULDADES: DificuldadeSolo[] = ['facil', 'medio', 'dificil'];

export function TelaSelecaoCodigoSecreto({ navigation }: Props) {
  const { height } = useWindowDimensions();
  const alturaBanner = height * FATOR_ALTURA_BANNER;

  const [progresso, setProgresso] = useState<MapaProgressoCS>(
    obterProgressoCacheCS(),
  );

  useFocusEffect(
    useCallback(() => {
      let ativo = true;
      void carregarProgressoCS().then((p) => {
        if (ativo) setProgresso({ ...p });
      });
      return () => {
        ativo = false;
      };
    }, []),
  );

  function aoEscolher(dificuldade: DificuldadeSolo) {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('CodigoSecreto', { dificuldade });
  }

  return (
    <View style={estilos.tela}>
      <View style={[estilos.bannerWrapper, { height: alturaBanner }]}>
        <Image
          source={require('../../../assets/games/codigo secreto/banner.png')}
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
          <Text style={estilos.titulo}>Código Secreto</Text>
          <Text style={estilos.subtitulo}>escolha a dificuldade</Text>

          <View style={estilos.lista}>
            {DIFICULDADES.map((d) => {
              const config = CONFIG_DIFICULDADE_CS[d];
              const prog = progresso[d];
              const cores4 = PALETA_CORES_CS.slice(0, config.numCores);

              return (
                <TouchableOpacity
                  key={d}
                  style={estilos.cardDificuldade}
                  onPress={() => aoEscolher(d)}
                  activeOpacity={0.85}
                >
                  <View style={estilos.cardTopo}>
                    <Text style={estilos.cardTitulo}>
                      {LABEL_DIFICULDADE[d]}
                    </Text>
                    <View style={estilos.amostraCores}>
                      {cores4.map((cor, i) => (
                        <View
                          key={i}
                          style={[estilos.bolinhaCor, { backgroundColor: cor }]}
                        />
                      ))}
                    </View>
                  </View>

                  <Text style={estilos.cardDetalhes}>
                    {config.numCores} cores · {config.numPosicoes} posições ·{' '}
                    {config.maxTentativas} tentativas
                  </Text>

                  {prog && prog.vitorias + prog.derrotas > 0 && (
                    <Text style={[estilos.cardStats, { color: COR_CS }]}>
                      {prog.vitorias}V {prog.derrotas}D
                      {prog.melhorTentativas !== null &&
                        ` · melhor: ${prog.melhorTentativas} tentativas`}
                    </Text>
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

const estilos = StyleSheet.create({
  amostraCores: {
    flexDirection: 'row',
    gap: 4,
  },
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
  bolinhaCor: {
    borderRadius: 7,
    height: 14,
    width: 14,
  },
  card: {
    backgroundColor: cores.fundo,
    borderTopLeftRadius: RAIO_CARD,
    borderTopRightRadius: RAIO_CARD,
    paddingBottom: espacamento.xl,
    paddingHorizontal: espacamento.md,
    paddingTop: espacamento.lg,
  },
  cardDetalhes: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
  },
  cardDificuldade: {
    backgroundColor: cores.fundoSecundario,
    borderColor: cores.borda,
    borderRadius: raio.lg,
    borderWidth: 1,
    gap: 6,
    padding: espacamento.md,
    ...sombra.sutil,
  },
  cardStats: {
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    fontWeight: '700',
  },
  cardTitulo: {
    color: cores.texto,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoSubtitulo,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  cardTopo: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  lista: {
    gap: espacamento.sm,
    marginTop: espacamento.md,
  },
  scroll: {
    flex: 1,
    zIndex: 1,
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
