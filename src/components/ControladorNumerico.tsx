/**
 * ControladorNumerico — Stepper −/+ com valor central em destaque.
 *
 * Uso:
 *   <ControladorNumerico
 *     valor={numRodadas}
 *     minimo={3}
 *     maximo={20}
 *     onChange={setNumRodadas}
 *     sublabel="rodadas"
 *   />
 *
 * O `sublabel` aparece abaixo do número — útil para unidade ou
 * informações dinâmicas (ex.: "× 5 = 15 turnos").
 */

import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  cores,
  espacamento,
  familias,
  raio,
  tamanhos,
  tipografia,
} from '@/theme/colors';

interface Props {
  valor: number;
  minimo: number;
  maximo: number;
  onChange: (valor: number) => void;
  /** Texto abaixo do número (unidade ou info dinâmica). Opcional. */
  sublabel?: string;
  /** Cor do número central. Default: cores.primaria. */
  corValor?: string;
}

export function ControladorNumerico({
  valor,
  minimo,
  maximo,
  onChange,
  sublabel,
  corValor = cores.primaria,
}: Props) {
  function decrementar() {
    if (valor <= minimo) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChange(valor - 1);
  }

  function incrementar() {
    if (valor >= maximo) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChange(valor + 1);
  }

  const noMinimo = valor <= minimo;
  const noMaximo = valor >= maximo;

  return (
    <View style={estilos.linha}>
      <Pressable
        onPress={decrementar}
        disabled={noMinimo}
        style={[estilos.botao, noMinimo && estilos.botaoDesabilitado]}
        accessibilityLabel="Diminuir"
        hitSlop={8}
      >
        <Text style={estilos.botaoTexto}>−</Text>
      </Pressable>

      <View style={estilos.valorBloco}>
        <Text style={[estilos.numero, { color: corValor }]}>{valor}</Text>
        {sublabel ? <Text style={estilos.sublabel}>{sublabel}</Text> : null}
      </View>

      <Pressable
        onPress={incrementar}
        disabled={noMaximo}
        style={[estilos.botao, noMaximo && estilos.botaoDesabilitado]}
        accessibilityLabel="Aumentar"
        hitSlop={8}
      >
        <Text style={estilos.botaoTexto}>+</Text>
      </Pressable>
    </View>
  );
}

const estilos = StyleSheet.create({
  linha: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: espacamento.lg,
    justifyContent: 'center',
  },
  botao: {
    alignItems: 'center',
    backgroundColor: cores.superficieElevada,
    borderColor: cores.borda,
    borderRadius: raio.md,
    borderWidth: 1,
    height: tamanhos.stepperAltura,
    justifyContent: 'center',
    width: tamanhos.stepperLargura,
  },
  botaoDesabilitado: {
    opacity: 0.35,
  },
  botaoTexto: {
    color: cores.texto,
    fontFamily: familias.sans,
    fontSize: 26,
    fontWeight: tipografia.pesoBold,
  },
  valorBloco: {
    alignItems: 'center',
    minWidth: tamanhos.stepperValorMinimo,
  },
  numero: {
    fontFamily: familias.sans,
    fontWeight: tipografia.pesoExtraBold,
    fontSize: tipografia.tamanhoStepper,
    lineHeight: 50,
    textAlign: 'center',
  },
  sublabel: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    letterSpacing: 0.2,
    textAlign: 'center',
  },
});
