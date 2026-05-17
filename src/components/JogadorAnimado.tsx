import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

import { CartaoJogador } from '@/components/CartaoJogador';
import type { Player } from '@/engine/types';

interface Props {
  jogador: Player;
  estado?: 'normal' | 'voce' | 'votado';
}

/**
 * Wrapper de CartaoJogador que faz fade-in + slide-up quando o card monta.
 * Animação só roda uma vez (na entrada do jogador no lobby).
 */
export function JogadorAnimado({ jogador, estado = 'normal' }: Props) {
  const opacidade = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 9,
      }),
      Animated.timing(opacidade, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacidade, translateY]);

  return (
    <Animated.View
      style={{ opacity: opacidade, transform: [{ translateY }] }}
    >
      <CartaoJogador jogador={jogador} estado={estado} />
    </Animated.View>
  );
}
