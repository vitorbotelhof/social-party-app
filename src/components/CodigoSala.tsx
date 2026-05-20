import { StyleSheet, Text, View } from 'react-native';

import { cores, familias, tipografia } from '@/theme/colors';

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
      {/* Hairline: âncora o código visualmente */}
      <View style={[estilos.linhaBase, eGrande ? estilos.linhaBaseGrande : estilos.linhaBaseMedio]} />
    </View>
  );
}

const estilos = StyleSheet.create({
  codigo: {
    color: cores.primaria,
    fontFamily: familias.sans,
    fontWeight: '800' as const,
    letterSpacing: 4,
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
  // Linha: usa primaria com baixa opacidade — sem hardcode amber
  linhaBase: {
    backgroundColor: 'rgba(255, 90, 95, 0.15)',
    borderRadius: 1,
    marginTop: 10,
  },
  linhaBaseGrande: {
    height: 1,
    width: 200,
  },
  linhaBaseMedio: {
    height: 1,
    width: 140,
  },
  ponto: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontWeight: tipografia.pesoMedio,
  },
  pontoGrande: {
    fontSize: 28,
  },
  pontoMedio: {
    fontSize: 18,
  },
});
