import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
} from 'react-native';

import { cores, espacamento, raio } from '@/theme/colors';

interface Props extends Omit<PressableProps, 'style' | 'children'> {
  titulo: string;
  carregando?: boolean;
}

export function BotaoSecundario({
  titulo,
  carregando = false,
  disabled,
  ...rest
}: Props) {
  const bloqueado = disabled || carregando;
  return (
    <Pressable
      {...rest}
      disabled={bloqueado}
      style={({ pressed }) => [
        estilos.base,
        pressed && !bloqueado && estilos.pressionado,
        bloqueado && estilos.desabilitado,
      ]}
    >
      {carregando ? (
        <ActivityIndicator color={cores.primaria} />
      ) : (
        <Text style={estilos.texto}>{titulo}</Text>
      )}
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  base: {
    alignItems: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
    borderColor: cores.primaria,
    borderRadius: raio.pill,
    borderWidth: 1.5,
    justifyContent: 'center',
    minHeight: 56,
    paddingHorizontal: espacamento.lg,
    paddingVertical: espacamento.md,
    width: '100%',
  },
  desabilitado: {
    opacity: 0.4,
  },
  pressionado: {
    backgroundColor: 'rgba(139, 92, 246, 0.18)',
    transform: [{ scale: 0.98 }],
  },
  texto: {
    color: cores.primaria,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
