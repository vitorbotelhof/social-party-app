import { LinearGradient } from 'expo-linear-gradient';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
} from 'react-native';

import { cores, espacamento, gradientes, raio } from '@/theme/colors';

interface Props extends Omit<PressableProps, 'style' | 'children'> {
  titulo: string;
  carregando?: boolean;
}

export function BotaoPrimario({
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
        estilos.wrapper,
        pressed && !bloqueado && estilos.pressionado,
        bloqueado && estilos.desabilitado,
      ]}
    >
      <LinearGradient
        colors={gradientes.principal}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={estilos.gradiente}
      >
        {carregando ? (
          <ActivityIndicator color={cores.textoSobrePrimaria} />
        ) : (
          <Text style={estilos.texto}>{titulo}</Text>
        )}
      </LinearGradient>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  desabilitado: {
    opacity: 0.4,
  },
  gradiente: {
    alignItems: 'center',
    borderRadius: raio.pill,
    justifyContent: 'center',
    minHeight: 56,
    paddingHorizontal: espacamento.lg,
    paddingVertical: espacamento.md,
  },
  pressionado: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
  texto: {
    color: cores.textoSobrePrimaria,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  wrapper: {
    borderRadius: raio.pill,
    elevation: 8,
    shadowColor: cores.primaria,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    width: '100%',
  },
});
