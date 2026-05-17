import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Logo } from '@/components/Logo';
import { cores, espacamento, tipografia } from '@/theme/colors';

interface Props {
  mensagem?: string;
}

const DURACAO_PULSO = 900;

/**
 * Tela de loading com a logo "entre nós" pulsando suavemente.
 */
export function TelaCarregamento({ mensagem }: Props) {
  const escala = useRef(new Animated.Value(0.9)).current;
  const opacidade = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    const animacao = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(escala, {
            toValue: 1.06,
            duration: DURACAO_PULSO,
            useNativeDriver: true,
          }),
          Animated.timing(opacidade, {
            toValue: 1,
            duration: DURACAO_PULSO,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(escala, {
            toValue: 0.9,
            duration: DURACAO_PULSO,
            useNativeDriver: true,
          }),
          Animated.timing(opacidade, {
            toValue: 0.7,
            duration: DURACAO_PULSO,
            useNativeDriver: true,
          }),
        ]),
      ]),
    );
    animacao.start();
    return () => animacao.stop();
  }, [escala, opacidade]);

  return (
    <SafeAreaView style={estilos.tela}>
      <View style={estilos.centro}>
        <Animated.View
          style={{ opacity: opacidade, transform: [{ scale: escala }] }}
        >
          <Logo tamanho={96} />
        </Animated.View>
        <Text style={estilos.marca}>entre nós</Text>
        {mensagem && <Text style={estilos.mensagem}>{mensagem}</Text>}
      </View>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  centro: {
    alignItems: 'center',
    flex: 1,
    gap: espacamento.lg,
    justifyContent: 'center',
  },
  marca: {
    color: cores.texto,
    fontSize: 22,
    fontWeight: tipografia.pesoLeve,
    letterSpacing: 1,
  },
  mensagem: {
    color: cores.textoSecundario,
    fontSize: tipografia.tamanhoCorpoMenor,
  },
  tela: {
    backgroundColor: cores.fundo,
    flex: 1,
  },
});
