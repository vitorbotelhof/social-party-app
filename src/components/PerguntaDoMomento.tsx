import { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { cores, espacamento, familias } from '@/theme/colors';

// Each phrase is a whisper directed at the group — not a description of the app.
// Lowercase, ambiguous, intimate. Rotates hourly so it feels alive across sessions.
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
  const posicaoY = useRef(new Animated.Value(10)).current;

  // Computed once on mount — stable within the session even if an hour boundary passes
  const pergunta = useMemo(() => perguntaDaHora(), []);

  useEffect(() => {
    // Enters after the Hero has had time to land — deliberate delay creates weight
    Animated.sequence([
      Animated.delay(220),
      Animated.parallel([
        Animated.timing(opacidade, {
          toValue: 1,
          duration: 640,
          useNativeDriver: true,
        }),
        Animated.timing(posicaoY, {
          toValue: 0,
          duration: 640,
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
  // Thin hairline anchors the element without adding visual noise
  linha: {
    backgroundColor: cores.borda,
    height: 1,
    opacity: 0.6,
    width: 32,
  },
  pergunta: {
    color: cores.textoSecundario,
    fontFamily: familias.serifItalico,
    fontSize: 20,
    letterSpacing: 0.2,
    lineHeight: 28,
    opacity: 0.9,
  },
});
