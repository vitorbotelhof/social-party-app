import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useRef, useState } from 'react';
import {
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BotaoPrimario } from '@/components';
import type { RootStackParamList } from '@/navigation/types';
import { marcarTutorialComoVisto } from '@/services/tutorial';
import { cores, espacamento, tipografia } from '@/theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Tutorial'>;

interface Slide {
  emoji: string;
  titulo: string;
  texto: string;
}

const SLIDES: ReadonlyArray<Slide> = [
  {
    emoji: '🕵️',
    titulo: 'um de vocês é o impostor',
    texto:
      'Quase todos recebem a mesma palavra secreta. O Mr White não recebe nada — e precisa fingir que sabe.',
  },
  {
    emoji: '💬',
    titulo: 'dê uma dica por vez',
    texto:
      'Cada jogador fala uma palavra ou frase relacionada à palavra secreta. Seja vago o suficiente para o Mr White não descobrir, mas claro o suficiente para provar que você sabe.',
  },
  {
    emoji: '🗳️',
    titulo: 'vote no suspeito',
    texto:
      'Depois das dicas, todos votam em quem acham que é o Mr White. O mais votado é eliminado.',
  },
  {
    emoji: '🎯',
    titulo: 'mas o jogo não acabou',
    texto:
      'Se o Mr White for descoberto, ele ainda tem uma chance: adivinhar a palavra secreta. Se acertar, vence mesmo assim!',
  },
];

export function TelaTutorial({ navigation, route }: Props) {
  const { jogoId } = route.params;
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const [paginaAtual, setPaginaAtual] = useState(0);

  const ultimoSlide = paginaAtual === SLIDES.length - 1;

  function aoFimDoScroll(evento: NativeSyntheticEvent<NativeScrollEvent>) {
    const offset = evento.nativeEvent.contentOffset.x;
    const pagina = Math.round(offset / width);
    if (pagina !== paginaAtual) setPaginaAtual(pagina);
  }

  async function finalizar() {
    await marcarTutorialComoVisto(`mrwhite`);
    navigation.replace('CriarSala', { jogoId });
  }

  function aoTocarPrincipal() {
    if (ultimoSlide) {
      void finalizar();
      return;
    }
    scrollRef.current?.scrollTo({
      x: width * (paginaAtual + 1),
      animated: true,
    });
  }

  return (
    <SafeAreaView style={estilos.tela} edges={['top', 'bottom']}>
      <View style={estilos.cabecalho}>
        <Pressable
          onPress={finalizar}
          hitSlop={12}
          style={({ pressed }) => [
            estilos.botaoPular,
            pressed && estilos.botaoPularPressionado,
          ]}
        >
          <Text style={estilos.botaoPularTexto}>pular</Text>
        </Pressable>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={aoFimDoScroll}
        style={estilos.slides}
      >
        {SLIDES.map((slide, indice) => (
          <View key={indice} style={[estilos.slide, { width }]}>
            <Text style={estilos.emoji}>{slide.emoji}</Text>
            <Text style={estilos.titulo}>{slide.titulo}</Text>
            <Text style={estilos.texto}>{slide.texto}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={estilos.rodape}>
        <View style={estilos.indicador}>
          {SLIDES.map((_, indice) => (
            <View
              key={indice}
              style={[
                estilos.bolinha,
                indice === paginaAtual && estilos.bolinhaAtiva,
              ]}
            />
          ))}
        </View>

        <BotaoPrimario
          titulo={ultimoSlide ? 'entendi, vamos jogar!' : 'próximo'}
          onPress={aoTocarPrincipal}
        />
      </View>
    </SafeAreaView>
  );
}

const TAMANHO_BOLINHA = 8;

const estilos = StyleSheet.create({
  bolinha: {
    backgroundColor: cores.borda,
    borderRadius: TAMANHO_BOLINHA / 2,
    height: TAMANHO_BOLINHA,
    width: TAMANHO_BOLINHA,
  },
  bolinhaAtiva: {
    backgroundColor: cores.primaria,
    width: TAMANHO_BOLINHA * 3,
  },
  botaoPular: {
    paddingHorizontal: espacamento.md,
    paddingVertical: espacamento.sm,
  },
  botaoPularPressionado: {
    opacity: 0.6,
  },
  botaoPularTexto: {
    color: cores.textoSecundario,
    fontSize: tipografia.tamanhoCorpoMenor,
    fontWeight: tipografia.pesoSemibold,
    letterSpacing: 0.3,
  },
  cabecalho: {
    alignItems: 'flex-end',
    paddingHorizontal: espacamento.md,
    paddingTop: espacamento.sm,
  },
  emoji: {
    fontSize: 80,
    marginBottom: espacamento.xl,
    textAlign: 'center',
  },
  indicador: {
    alignItems: 'center',
    alignSelf: 'center',
    flexDirection: 'row',
    gap: espacamento.sm,
    marginBottom: espacamento.lg,
  },
  rodape: {
    paddingBottom: espacamento.md,
    paddingHorizontal: espacamento.lg,
    paddingTop: espacamento.md,
  },
  slide: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: espacamento.xl,
  },
  slides: {
    flex: 1,
  },
  tela: {
    backgroundColor: cores.fundo,
    flex: 1,
  },
  texto: {
    color: cores.textoSecundario,
    fontSize: 16,
    lineHeight: 24,
    paddingHorizontal: espacamento.md,
    textAlign: 'center',
  },
  titulo: {
    color: cores.texto,
    fontSize: 28,
    fontWeight: tipografia.pesoBold,
    letterSpacing: tipografia.spacingTitulo,
    marginBottom: espacamento.md,
    textAlign: 'center',
  },
});
