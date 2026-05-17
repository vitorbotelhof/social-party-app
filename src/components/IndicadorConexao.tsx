import { onValue, ref } from 'firebase/database';
import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getRealtimeDb } from '@/services/firebase';
import { espacamento, tipografia } from '@/theme/colors';

const COR_FUNDO = '#78350F';
const COR_TEXTO = '#FCD34D';

export function IndicadorConexao() {
  const [conectado, setConectado] = useState(true);
  const insets = useSafeAreaInsets();
  const opacidade = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-40)).current;

  useEffect(() => {
    let cancelarObservador: (() => void) | undefined;
    try {
      const conexaoRef = ref(getRealtimeDb(), '.info/connected');
      cancelarObservador = onValue(conexaoRef, (snap) => {
        setConectado(snap.val() === true);
      });
    } catch {
      // Firebase não inicializado (ex.: modo local) — banner fica oculto.
    }
    return () => cancelarObservador?.();
  }, []);

  useEffect(() => {
    const visivel = !conectado;
    Animated.parallel([
      Animated.timing(opacidade, {
        toValue: visivel ? 1 : 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: visivel ? 0 : -40,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [conectado, opacidade, translateY]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        estilos.banner,
        {
          opacity: opacidade,
          transform: [{ translateY }],
          paddingTop: insets.top + 4,
        },
      ]}
    >
      <Text style={estilos.texto}>📡 sem conexão...</Text>
    </Animated.View>
  );
}

const estilos = StyleSheet.create({
  banner: {
    backgroundColor: COR_FUNDO,
    left: 0,
    paddingBottom: espacamento.sm,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 100,
  },
  texto: {
    color: COR_TEXTO,
    fontSize: tipografia.tamanhoLegenda,
    fontWeight: tipografia.pesoBold,
    letterSpacing: 0.5,
    paddingHorizontal: espacamento.md,
    textAlign: 'center',
  },
});
