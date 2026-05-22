/**
 * SecaoConfig — Seção de formulário de configuração com cabeçalho conversacional.
 *
 * Título em lowercase, sem uppercase transform — linguagem humana, não burocrática.
 * O subtítulo é usado para contadores ou info complementar (ex.: "3 de 12").
 *
 * Uso:
 *   <SecaoConfig titulo="quem tá jogando?" subtitulo="3 de 12">
 *     <CadastroJogadores ... />
 *   </SecaoConfig>
 */

import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { cores, espacamento, familias, tipografia } from '@/theme/colors';

interface Props {
  titulo: string;
  subtitulo?: string;
  children: ReactNode;
}

export function SecaoConfig({ titulo, subtitulo, children }: Props) {
  return (
    <View style={estilos.secao}>
      <View style={estilos.cabecalho}>
        <Text style={estilos.titulo}>{titulo}</Text>
        {subtitulo ? <Text style={estilos.subtitulo}>{subtitulo}</Text> : null}
      </View>
      {children}
    </View>
  );
}

const estilos = StyleSheet.create({
  secao: {
    marginBottom: espacamento.xl,
  },
  cabecalho: {
    alignItems: 'baseline',
    flexDirection: 'row',
    gap: espacamento.sm,
    marginBottom: espacamento.md,
  },
  // Lowercase, linguagem humana — não rótulo de formulário
  titulo: {
    color: cores.textoSecundario,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    fontWeight: tipografia.pesoMedio,
    letterSpacing: 0.2,
  },
  subtitulo: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoMicro,
    letterSpacing: 0.3,
  },
});
