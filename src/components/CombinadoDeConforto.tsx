import { StyleSheet, Text, View } from 'react-native';

import { cores, espacamento, familias, raio, tipografia } from '@/theme/colors';

interface Props {
  texto: string;
  compacto?: boolean;
}

export function CombinadoDeConforto({ texto, compacto = false }: Props) {
  return (
    <View style={[estilos.container, compacto && estilos.containerCompacto]}>
      <Text style={estilos.label}>combinado</Text>
      <Text style={estilos.texto}>{texto}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  container: {
    backgroundColor: cores.superficieElevada,
    borderColor: cores.borda,
    borderRadius: raio.lg,
    borderWidth: 1,
    gap: espacamento.xs,
    padding: espacamento.md,
  },
  containerCompacto: {
    paddingHorizontal: espacamento.md,
    paddingVertical: espacamento.sm,
  },
  label: {
    color: cores.primaria,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLabelSecao,
    fontWeight: tipografia.pesoExtraBold,
    letterSpacing: tipografia.spacingLabel,
    textTransform: 'uppercase',
  },
  texto: {
    color: cores.textoSecundario,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpoMenor,
    lineHeight: 20,
  },
});
