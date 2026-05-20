import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
} from 'react-native';

import { cores, espacamento, raio, tipografia } from '@/theme/colors';

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
        <ActivityIndicator color={cores.textoSecundario} size="small" />
      ) : (
        <Text style={estilos.texto}>{titulo}</Text>
      )}
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  base: {
    alignItems: 'center',
    backgroundColor: cores.superficie,
    borderColor: cores.borda,
    borderRadius: raio.pill,
    borderWidth: 1.5,
    elevation: 1,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: espacamento.lg,
    paddingVertical: espacamento.md,
    shadowColor: '#161616',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    width: '100%',
  },
  desabilitado: {
    opacity: 0.38,
  },
  // Warm pressed state — uses current primary, not old sienna
  pressionado: {
    backgroundColor: 'rgba(255, 90, 95, 0.06)',
    borderColor: cores.primaria,
    transform: [{ scale: 0.98 }],
  },
  texto: {
    color: cores.texto,
    fontSize: tipografia.tamanhoCorpo,
    fontWeight: tipografia.pesoSemibold,
    letterSpacing: 0.2,
  },
});
