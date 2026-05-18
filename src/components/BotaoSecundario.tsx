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
        <ActivityIndicator color={cores.textoSecundario} />
      ) : (
        <Text style={estilos.texto}>{titulo}</Text>
      )}
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  base: {
    alignItems: 'center',
    borderColor: cores.borda,
    borderRadius: raio.pill,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: espacamento.lg,
    paddingVertical: espacamento.md,
    width: '100%',
  },
  desabilitado: {
    opacity: 0.38,
  },
  pressionado: {
    backgroundColor: 'rgba(160,82,45,0.08)',
    transform: [{ scale: 0.98 }],
  },
  texto: {
    color: cores.textoSecundario,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
