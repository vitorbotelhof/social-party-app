import { Alert, StyleSheet, View } from 'react-native';
import type { ReactNode } from 'react';

import { BotaoVoltar } from '@/components/BotaoVoltar';

interface BotaoEncerrarJogoProps {
  onConfirmar: () => void | Promise<void>;
  topOffset?: number;
}

interface ControleEncerrarJogoProps extends BotaoEncerrarJogoProps {
  children: ReactNode;
  mostrar?: boolean;
}

export function BotaoEncerrarJogo({
  onConfirmar,
  topOffset = 8,
}: BotaoEncerrarJogoProps) {
  function pedirConfirmacao() {
    Alert.alert(
      'encerrar jogo?',
      'A partida atual vai parar e vocês voltam para escolher outro jogo.',
      [
        { text: 'continuar jogando', style: 'cancel' },
        {
          text: 'encerrar',
          style: 'destructive',
          onPress: () => {
            void onConfirmar();
          },
        },
      ],
    );
  }

  return (
    <BotaoVoltar
      variante="fechar"
      posicao="direita"
      topOffset={topOffset}
      onPress={pedirConfirmacao}
    />
  );
}

export function ControleEncerrarJogo({
  children,
  onConfirmar,
  mostrar = true,
  topOffset,
}: ControleEncerrarJogoProps) {
  return (
    <View style={estilos.container}>
      {children}
      {mostrar ? (
        <BotaoEncerrarJogo onConfirmar={onConfirmar} topOffset={topOffset} />
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  container: {
    flex: 1,
  },
});
