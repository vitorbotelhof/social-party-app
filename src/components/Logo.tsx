import { StyleSheet, View } from 'react-native';

import { cores } from '@/theme/colors';

interface Props {
  tamanho?: number;
  /** Aumenta a sobreposição entre os círculos (0–1). */
  sobreposicao?: number;
}

/**
 * Logo do app: dois círculos se sobrepondo (roxo + rosa-vinho).
 * Construído apenas com View — sem asset externo.
 * O círculo da frente tem opacidade <1 para o overlap ficar com cara de mistura.
 */
export function Logo({ tamanho = 120, sobreposicao = 0.42 }: Props) {
  const diametro = tamanho * 0.78;
  const deslocamento = diametro * (1 - sobreposicao);
  const larguraTotal = diametro + deslocamento;

  return (
    <View
      style={[estilos.container, { width: larguraTotal, height: diametro }]}
    >
      <View
        style={[
          estilos.circulo,
          estilos.circuloRoxo,
          {
            borderRadius: diametro / 2,
            height: diametro,
            left: 0,
            width: diametro,
          },
        ]}
      />
      <View
        style={[
          estilos.circulo,
          estilos.circuloRosa,
          {
            borderRadius: diametro / 2,
            height: diametro,
            left: deslocamento,
            width: diametro,
          },
        ]}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  circulo: {
    position: 'absolute',
    top: 0,
  },
  circuloRosa: {
    backgroundColor: cores.acentoQuente,
    opacity: 0.78,
  },
  circuloRoxo: {
    backgroundColor: cores.primaria,
  },
  container: {
    position: 'relative',
  },
});
