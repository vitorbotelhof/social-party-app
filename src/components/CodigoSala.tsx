import { StyleSheet, Text, View } from 'react-native';

import { cores, familias } from '@/theme/colors';

type Tamanho = 'medio' | 'grande';

interface Props {
  codigo: string;
  tamanho?: Tamanho;
}

export function CodigoSala({ codigo, tamanho = 'grande' }: Props) {
  const eGrande = tamanho === 'grande';

  // Split into two halves with a center separator — reads like a ticket stub
  const meio = Math.ceil(codigo.length / 2);
  const parte1 = codigo.slice(0, meio);
  const parte2 = codigo.slice(meio);

  return (
    <View style={estilos.container}>
      <Text style={[estilos.codigo, eGrande ? estilos.codigoGrande : estilos.codigoMedio]}>
        {parte1}
        <Text style={[estilos.ponto, eGrande ? estilos.pontoGrande : estilos.pontoMedio]}>
          {' ·  '}
        </Text>
        {parte2}
      </Text>
      <View style={[estilos.linhaBase, eGrande ? estilos.linhaBaseGrande : estilos.linhaBaseMedio]} />
    </View>
  );
}

const estilos = StyleSheet.create({
  codigo: {
    color: cores.acento,
    fontFamily: familias.serifDisplay,
    letterSpacing: 6,
    textAlign: 'center',
  },
  codigoGrande: {
    fontSize: 42,
    lineHeight: 52,
  },
  codigoMedio: {
    fontSize: 28,
    lineHeight: 36,
  },
  container: {
    alignItems: 'center',
  },
  linhaBase: {
    backgroundColor: 'rgba(201,137,58,0.2)',
    borderRadius: 1,
    marginTop: 10,
  },
  linhaBaseGrande: {
    height: 1,
    width: 220,
  },
  linhaBaseMedio: {
    height: 1,
    width: 150,
  },
  ponto: {
    color: 'rgba(201,137,58,0.4)',
    fontFamily: familias.serifDisplay,
  },
  pontoGrande: {
    fontSize: 28,
  },
  pontoMedio: {
    fontSize: 18,
  },
});
