import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CardJogoCatalogo, type JogoCatalogoItem } from '@/components';
import { PUZZLES_SHIKAKU } from '@/games/solo/shikaku';
import type { SoloStackParamList } from '@/navigation/types';
import {
  carregarProgressoCS,
  obterProgressoCacheCS,
  type MapaProgressoCS,
} from '@/services/solo/progressoCodigoSecreto';
import {
  carregarProgressoShikaku,
  obterProgressoCache,
  type MapaProgressoShikaku,
} from '@/services/solo/progressoShikaku';
import { cores, espacamento, familias, tipografia } from '@/theme/colors';

type Props = NativeStackScreenProps<SoloStackParamList, 'SoloHome'>;

const MARGEM_TELA = espacamento.md;

interface JogoSoloItem extends JogoCatalogoItem {
  id: 'shikaku' | 'codigo-secreto';
}

const JOGOS_SOLO: JogoSoloItem[] = [
  {
    id: 'shikaku',
    nome: 'Shikaku',
    slogan: 'divida a grade em retângulos perfeitos.',
    cover: require('../../../assets/games/shikaku/cover.png'),
    disponivel: true,
  },
  {
    id: 'codigo-secreto',
    nome: 'Código Secreto',
    slogan: 'decifre a sequência de cores antes de esgotar as tentativas.',
    cover: require('../../../assets/games/codigo secreto/cover.png'),
    disponivel: true,
  },
];

export function TelaSoloHome({ navigation }: Props) {
  const { width } = useWindowDimensions();
  const larguraCard = Math.floor((width - MARGEM_TELA * 2 - espacamento.md) / 2);

  const [progresso, setProgresso] = useState<MapaProgressoShikaku>(
    obterProgressoCache(),
  );
  const [progressoCS, setProgressoCS] = useState<MapaProgressoCS>(
    obterProgressoCacheCS(),
  );

  useFocusEffect(
    useCallback(() => {
      let ativo = true;
      void carregarProgressoShikaku().then((p) => {
        if (ativo) setProgresso({ ...p });
      });
      void carregarProgressoCS().then((p) => {
        if (ativo) setProgressoCS({ ...p });
      });
      return () => {
        ativo = false;
      };
    }, []),
  );

  const shikakuConcluidos = PUZZLES_SHIKAKU.filter(
    (p) => progresso[p.id]?.concluido,
  ).length;
  const shikakuTotal = PUZZLES_SHIKAKU.length;

  const vitoriasCS =
    progressoCS.facil.vitorias +
    progressoCS.medio.vitorias +
    progressoCS.dificil.vitorias;

  const jogosComMeta: JogoSoloItem[] = JOGOS_SOLO.map((jogo) => {
    if (jogo.id === 'shikaku' && shikakuConcluidos > 0) {
      return { ...jogo, meta: `${shikakuConcluidos}/${shikakuTotal} concluídos` };
    }
    if (jogo.id === 'codigo-secreto' && vitoriasCS > 0) {
      return { ...jogo, meta: `${vitoriasCS} vitória${vitoriasCS > 1 ? 's' : ''}` };
    }
    return jogo;
  });

  function aoAbrirJogo(jogo: JogoCatalogoItem) {
    if (jogo.id === 'shikaku') {
      navigation.navigate('SelecaoShikaku');
    } else if (jogo.id === 'codigo-secreto') {
      navigation.navigate('SelecaoCodigoSecreto');
    }
  }

  return (
    <SafeAreaView style={estilos.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={estilos.conteudo}
        showsVerticalScrollIndicator={false}
      >
        {/* Cabeçalho */}
        <View style={estilos.cabecalho}>
          <Text style={estilos.titulo}>solo</Text>
          <Text style={estilos.subtitulo}>treine sua mente, no seu ritmo.</Text>
        </View>

        {/* Grade de jogos */}
        <View style={estilos.gradeJogos}>
          {jogosComMeta.map((jogo) => (
            <View key={jogo.id} style={{ width: larguraCard }}>
              <CardJogoCatalogo
                jogo={jogo}
                largura={larguraCard}
                alturaImagem={larguraCard}
                onPress={aoAbrirJogo}
              />
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const estilos = StyleSheet.create({
  cabecalho: {
    gap: 4,
    marginBottom: espacamento.lg,
  },
  conteudo: {
    paddingBottom: espacamento.xl,
    paddingHorizontal: MARGEM_TELA,
    paddingTop: espacamento.lg,
  },
  gradeJogos: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: espacamento.md,
    rowGap: espacamento.xl,
  },
  safe: {
    backgroundColor: cores.fundo,
    flex: 1,
  },
  subtitulo: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpo,
  },
  titulo: {
    color: cores.texto,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoTituloGrande,
    fontWeight: '800',
    letterSpacing: -1,
  },
});
