/**
 * TelaResultadoVotacao — Fase apurando.
 *
 * Impacto imediato, sem texto de sistema.
 * Empate: "empate." — direto.
 * Eliminação: nome grande + papel em cor. Sem label "ELIMINADO".
 * Sem fallback textual — enquanto vota, o silêncio é o estado.
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
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [opacidade]);

  const votacao = estadoPublico.votacaoAtual as VotacaoResolvida | null;

  // Aguardando resolução — tela vazia. Não exibir texto de sistema.
  if (!votacao || votacao.tipo !== 'resolvida') {
    return <View style={estilos.container} />;
  }

  const { foiEmpate, eliminadoId, papelRevelado } = votacao;

  return (
    <SafeAreaView style={estilos.container}>
      <Animated.View style={[estilos.centro, { opacity: opacidade }]}>
        {foiEmpate || !eliminadoId ? (
          // Empate — uma palavra. O grupo decide sem eliminar.
          <Text style={estilos.textoGrande}>empate.</Text>
        ) : (
          // Eliminação — nome em destaque, papel em cor abaixo. Sem label.
          <>
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
    gap: espacamento.md,
  },
  textoGrande: {
    fontSize: tipografia.tamanhoHero,
    fontFamily: familias.serifDisplay,
    color: cores.texto,
    textAlign: 'center',
    letterSpacing: tipografia.spacingHero,
  },
  nomeEliminado: {
    fontSize: tipografia.tamanhoTituloGrande,
    fontFamily: familias.serifDisplay,
    color: cores.texto,
    textAlign: 'center',
    letterSpacing: tipografia.spacingTitulo,
  },
  papelRevelado: {
    fontSize: tipografia.tamanhoCorpoMaior,
    fontFamily: familias.sans,
    fontWeight: tipografia.pesoBold,
    letterSpacing: 0.5,
  },
});
