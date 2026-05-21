/**
 * TelaResultadoVotacao — Fase apurando.
 *
 * Exibe resultado da votação por ~5 segundos.
 * Empate: "ninguém." / Eliminação: nome + papel revelado.
 */

import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { PlayerId } from '@/engine/types';
import type {
  EstadoFirebaseInquisicao,
  PapelInquisicao,
  VotacaoResolvida,
} from '@/games/inquisicao/types';
import { cores, espacamento, familias, tipografia } from '@/theme/colors';

const COR_CORRUPCAO = '#FF5A5F';
const COR_INOCENTE = '#4D7CFE';
const COR_GUARDIAO = '#22C55E';

interface Props {
  estadoPublico: EstadoFirebaseInquisicao;
  mapaNomes: Map<PlayerId, string>;
}

function corDoPapel(papel: PapelInquisicao): string {
  if (papel === 'corrompido') return COR_CORRUPCAO;
  if (papel === 'guardiao') return COR_GUARDIAO;
  return COR_INOCENTE;
}

export function TelaResultadoVotacao({ estadoPublico, mapaNomes }: Props) {
  const opacidade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacidade, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [opacidade]);

  const votacao = estadoPublico.votacaoAtual as VotacaoResolvida | null;

  if (!votacao || votacao.tipo !== 'resolvida') {
    return (
      <SafeAreaView style={estilos.container}>
        <View style={estilos.centro}>
          <Text style={estilos.textoGrande}>apurando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const { foiEmpate, eliminadoId, papelRevelado } = votacao;

  return (
    <SafeAreaView style={estilos.container}>
      <Animated.View style={[estilos.centro, { opacity: opacidade }]}>
        {foiEmpate || !eliminadoId ? (
          <>
            <Text style={estilos.textoGrande}>ninguém.</Text>
            <Text style={estilos.textoMudo}>o impasse persiste.</Text>
          </>
        ) : (
          <>
            <Text style={estilos.label}>ELIMINADO</Text>
            <Text style={estilos.nomeEliminado}>
              {mapaNomes.get(eliminadoId) ?? eliminadoId}
            </Text>
            {papelRevelado && (
              <Text style={[estilos.papelRevelado, { color: corDoPapel(papelRevelado) }]}>
                {papelRevelado}
              </Text>
            )}
          </>
        )}
      </Animated.View>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: cores.fundo,
  },
  centro: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: espacamento.xl,
  },
  label: {
    fontSize: 13,
    fontFamily: familias.sans,
    color: cores.textoMudo,
    letterSpacing: 2.0,
    marginBottom: espacamento.md,
  },
  textoGrande: {
    fontSize: tipografia.tamanhoHero,
    fontFamily: familias.serifDisplay,
    color: cores.texto,
    textAlign: 'center',
    letterSpacing: tipografia.spacingHero,
    marginBottom: espacamento.md,
  },
  nomeEliminado: {
    fontSize: tipografia.tamanhoTituloGrande,
    fontFamily: familias.serifDisplay,
    color: cores.texto,
    textAlign: 'center',
    letterSpacing: tipografia.spacingTitulo,
    marginBottom: espacamento.md,
  },
  papelRevelado: {
    fontSize: tipografia.tamanhoCorpoMaior,
    fontFamily: familias.sans,
    fontWeight: tipografia.pesoBold,
  },
  textoMudo: {
    fontSize: tipografia.tamanhoCorpoMaior,
    fontFamily: familias.sans,
    color: cores.textoMudo,
    textAlign: 'center',
    marginTop: espacamento.sm,
  },
});
