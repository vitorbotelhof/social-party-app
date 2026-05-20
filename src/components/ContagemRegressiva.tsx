import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { cores, tipografia } from '@/theme/colors';

interface Props {
  /** Chamado quando a contagem termina (depois de "COMEÇA!"). */
  aoTerminar: () => void;
}

const SEQUENCIA = ['3', '2', '1', 'COMEÇA!'] as const;

export function ContagemRegressiva({ aoTerminar }: Props) {
  const [indice, setIndice] = useState(0);
  const escala = useRef(new Animated.Value(0.4)).current;
  const opacidade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (indice >= SEQUENCIA.length) {
      aoTerminar();
      return;
    }
    void Haptics.impactAsync(
      indice === SEQUENCIA.length - 1
        ? Haptics.ImpactFeedbackStyle.Heavy
        : Haptics.ImpactFeedbackStyle.Medium,
    );
    escala.setValue(0.4);
    opacidade.setValue(0);
    Animated.parallel([
      Animated.spring(escala, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 6,
      }),
      Animated.timing(opacidade, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();
    const id = setTimeout(() => setIndice((n) => n + 1), 900);
    return () => clearTimeout(id);
  }, [aoTerminar, escala, indice, opacidade]);

  const valor = SEQUENCIA[indice] ?? '';
  const ehGo = indice === SEQUENCIA.length - 1;

  return (
    // Fundo papel quente — não mais preto cinematográfico
    <View style={estilos.tela}>
      <Animated.Text
        style={[
          ehGo ? estilos.textoGo : estilos.textoNumero,
          {
            opacity: opacidade,
            transform: [{ scale: escala }],
          },
        ]}
      >
        {valor}
      </Animated.Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  // Papel quente — grande número preto é mais legível que branco no preto
  tela: {
    alignItems: 'center',
    backgroundColor: cores.fundo,
    flex: 1,
    justifyContent: 'center',
  },
  textoGo: {
    color: cores.primaria,
    fontSize: 72,
    fontWeight: tipografia.pesoBlack,
    letterSpacing: -1,
    textAlign: 'center',
  },
  textoNumero: {
    color: cores.texto,
    fontSize: 180,
    fontWeight: tipografia.pesoBlack,
    lineHeight: 200,
    textAlign: 'center',
  },
});
