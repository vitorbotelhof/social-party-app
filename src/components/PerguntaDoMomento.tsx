import { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { cores, espacamento, tipografia } from '@/theme/colors';

// Frases diretas e sociais — curtas, provocativas, sem atmosphera pesada
const PERGUNTAS = [
  'cuidado com o que você começa.',
  'a noite ainda está começando?',
  'alguém aqui está escondendo algo?',
  'já passou do ponto hoje?',
  'quem vai se expor primeiro?',
  'o grupo já sabe o que quer?',
  'alguém aqui vai se surpreender.',
  'quanto vocês realmente se conhecem?',
  'todo mundo está pronto pra isso?',
  'tem alguém aqui que não devia estar.',
] as const;

function perguntaDaHora(): string {
  const horaAtual = Math.floor(Date.now() / (1000 * 60 * 60));
  return PERGUNTAS[horaAtual % PERGUNTAS.length]!;
}

export function PerguntaDoMomento() {
  const opacidade = useRef(new Animated.Value(0)).current;
  const posicaoY = useRef(new Animated.Value(8)).current;

  // Computed once on mount — stable within the session even if an hour boundary passes
  const pergunta = useMemo(() => perguntaDaHora(), []);

  useEffect(() => {
    // Delay curto: deixa o Hero pousar antes, não prolonga contemplação
    Animated.sequence([
      Animated.delay(120),
      Animated.parallel([
        Animated.timing(opacidade, {
          toValue: 1,
          duration: 240,
          useNativeDriver: true,
        }),
        Animated.timing(posicaoY, {
          toValue: 0,
          duration: 240,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [opacidade, posicaoY]);

  return (
    <Animated.View
      style={[
        estilos.container,
        { opacity: opacidade, transform: [{ translateY: posicaoY }] },
      ]}
    >
      <View style={estilos.linha} />
      <Animated.Text style={estilos.pergunta}>{pergunta}</Animated.Text>
    </Animated.View>
  );
}

const estilos = StyleSheet.create({
  container: {
    gap: espacamento.md,
    paddingBottom: espacamento.xxl,
    paddingTop: espacamento.md,
  },
  // Hairline: âncora visual discreta
  linha: {
    backgroundColor: cores.borda,
    borderRadius: 1,
    height: 1,
    width: 28,
  },
  pergunta: {
    color: cores.textoSecundario,
    fontFamily: undefined, // herda System
    fontSize: tipografia.tamanhoSubtitulo,
    fontWeight: tipografia.pesoMedio,
    letterSpacing: -0.2,
    lineHeight: 28,
  },
});
