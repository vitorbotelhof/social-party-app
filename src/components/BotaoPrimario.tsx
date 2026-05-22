import { LinearGradient } from 'expo-linear-gradient';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
} from 'react-native';

import {
  cores,
  dimensoes,
  espacamento,
  gradientes,
  raio,
  sombra,
  tipografia,
} from '@/theme/colors';

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
          <ActivityIndicator color={cores.textoSobrePrimaria} size="small" />
        ) : (
          <Text style={estilos.texto}>{titulo}</Text>
        )}
      </LinearGradient>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  desabilitado: {
    opacity: 0.38,
  },
  gradiente: {
    alignItems: 'center',
    borderRadius: raio.pill,
    justifyContent: 'center',
    minHeight: dimensoes.tocavelPrimario,
    paddingHorizontal: espacamento.lg,
    paddingVertical: espacamento.md,
  },
  // Warm tactile shadow — depth without drama
  pressionado: {
    opacity: 0.88,
    transform: [{ scale: 0.97 }],
  },
  texto: {
    color: cores.textoSobrePrimaria,
    fontSize: tipografia.tamanhoCorpoMaior,
    fontWeight: tipografia.pesoBold,
    letterSpacing: 0.4,
  },
  wrapper: {
    borderRadius: raio.pill,
    ...sombra.forte,
    width: '100%',
  },
});
