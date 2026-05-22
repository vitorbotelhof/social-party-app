/**
 * SegmentControl — Seletor de opção entre 2 a 5 alternativas.
 *
 * Genérico em T: aceita string, number, ou qualquer primitivo comparável.
 * O TypeScript infere T automaticamente a partir do array `opcoes`.
 *
 * Uso:
 *   const MODOS = [
 *     { valor: 'classico' as const, rotulo: 'clássico' },
 *     { valor: 'sincero'  as const, rotulo: 'sincero' },
 *   ];
 *   <SegmentControl opcoes={MODOS} valor={modo} onChange={setModo} />
 */

import { Pressable, StyleSheet, Text, View } from 'react-native';

import { cores, espacamento, familias, raio, tipografia } from '@/theme/colors';

interface OpcaoSegmento<T> {
  valor: T;
  rotulo: string;
}

interface Props<T> {
  opcoes: OpcaoSegmento<T>[];
  valor: T;
  onChange: (valor: T) => void;
}

export function SegmentControl<T>({ opcoes, valor, onChange }: Props<T>) {
  return (
    <View style={estilos.linha}>
      {opcoes.map((op, i) => {
        const ativo = op.valor === valor;
        return (
          <Pressable
            key={i}
            onPress={() => onChange(op.valor)}
            style={[estilos.segmento, ativo && estilos.segmentoAtivo]}
            accessibilityRole="radio"
            accessibilityState={{ checked: ativo }}
          >
            <Text
              style={[estilos.texto, ativo && estilos.textoAtivo]}
              numberOfLines={1}
            >
              {op.rotulo}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const estilos = StyleSheet.create({
  linha: {
    flexDirection: 'row',
    gap: espacamento.sm,
  },
  segmento: {
    alignItems: 'center',
    backgroundColor: cores.superficie,
    borderColor: cores.borda,
    borderRadius: raio.md,
    borderWidth: 1,
    flex: 1,
    paddingVertical: espacamento.md,
  },
  segmentoAtivo: {
    backgroundColor: cores.acento,
    borderColor: cores.acento,
  },
  texto: {
    color: cores.textoSecundario,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoSegmento,
    fontWeight: tipografia.pesoSemibold,
  },
  textoAtivo: {
    color: cores.textoSobrePrimaria,
    fontWeight: tipografia.pesoBold,
  },
});
