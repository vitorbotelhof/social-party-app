import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Logo } from '@/components/Logo';
import { cores, espacamento, tipografia } from '@/theme/colors';

interface Props {
  mensagem?: string;
}

// 600ms: vivo sem ser ansioso. Antes era 900ms (contemplativo).
const DURACAO_PULSO = 600;

/**
 * Loading state com logo pulsando.
 * Escala reduzida (0.95↔1.03) — subtil, social, não dramatizado.
 */
export function TelaCarregamento({ mensagem }: Props) {
  const escala = useRef(new Animated.Value(0.95)).current;
  const opacidade = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    const animacao = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(escala, {
            toValue: 1.03,
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
            toValue: 0.95,
            duration: DURACAO_PULSO,
            useNativeDriver: true,
          }),
          Animated.timing(opacidade, {
            toValue: 0.6,
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
          <Logo tamanho={80} />
        </Animated.View>
        {mensagem && <Text style={estilos.mensagem}>{mensagem}</Text>}
      </View>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  centro: {
    alignItems: 'center',
    flex: 1,
    gap: espacamento.md,
    justifyContent: 'center',
  },
  mensagem: {
    color: cores.textoMudo,
    fontSize: tipografia.tamanhoCaption,
    fontWeight: tipografia.pesoMedio,
    letterSpacing: 0.3,
  },
  tela: {
    backgroundColor: cores.fundo,
    flex: 1,
  },
});
