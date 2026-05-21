/**
 * TelaDistribuindoPapeis — Fase revelando_papeis.
 *
 * Mostra o papel secreto do jogador com animação de entrada.
 * Corrompidos veem seus aliados.
 * Botão "estou pronto" → aguardando os outros.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { PlayerId } from '@/engine/types';
import type { EstadoPrivadoInquisicao } from '@/games/inquisicao/types';
import { derivarFaccao } from '@/games/inquisicao/types';
import { cores, espacamento, familias, tipografia } from '@/theme/colors';

const COR_CORRUPCAO = '#FF5A5F';
const COR_INOCENTE = '#4D7CFE';
const COR_GUARDIAO = '#22C55E';

interface Props {
  estadoPrivado: EstadoPrivadoInquisicao;
  jogadorId: PlayerId;
  jogadoresAtivos: PlayerId[];
  mapaNomes: Map<PlayerId, string>;
  loop: number;
  onPronto: () => void;
}

function corDoPapel(papel: string): string {
  if (papel === 'corrompido') return COR_CORRUPCAO;
  if (papel === 'guardiao') return COR_GUARDIAO;
  return COR_INOCENTE;
}

export function TelaDistribuindoPapeis({
  estadoPrivado,
  jogadorId,
  mapaNomes,
  onPronto,
}: Props) {
  const [pronto, setPronto] = useState(false);

  // Animação de entrada: fade in + subir 16px
  const opacidade = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacidade, {
        toValue: 1,
        duration: 280,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 280,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacidade, translateY]);

  const papel = estadoPrivado.papelOriginal;
  const faccao = derivarFaccao(estadoPrivado);
  const isCorrompido = faccao === 'corrompidos';
  const aliados = estadoPrivado.corrompidosConhecidos.filter((id) => id !== jogadorId);

  const handlePronto = () => {
    setPronto(true);
    onPronto();
  };

  return (
    <SafeAreaView style={estilos.container}>
      <Animated.View
        style={[
          estilos.conteudo,
          { opacity: opacidade, transform: [{ translateY }] },
        ]}
      >
        {/* Label "seu papel" */}
        <Text style={estilos.label}>SEU PAPEL</Text>

        {/* Nome do papel em grande */}
        <Text style={[estilos.nomePapel, { color: corDoPapel(papel) }]}>
          {papel}
        </Text>

        {/* Aliados (apenas corrompidos) */}
        {isCorrompido && aliados.length > 0 && (
          <View style={estilos.aliadosContainer}>
            <Text style={estilos.aliadosLabel}>seus aliados:</Text>
            {aliados.map((id) => (
              <Text key={id} style={estilos.nomeAliado}>
                {mapaNomes.get(id) ?? id}
              </Text>
            ))}
          </View>
        )}

        {isCorrompido && aliados.length === 0 && (
          <View style={estilos.aliadosContainer}>
            <Text style={estilos.aliadosLabel}>você age sozinho.</Text>
          </View>
        )}
      </Animated.View>

      {/* Botão de confirmação */}
      <View style={estilos.rodape}>
        {!pronto ? (
          <TouchableOpacity
            style={estilos.botaoPronto}
            onPress={handlePronto}
            activeOpacity={0.8}
          >
            <Text style={estilos.textoBotao}>estou pronto →</Text>
          </TouchableOpacity>
        ) : (
          <View style={estilos.botaoDesabilitado}>
            <Text style={estilos.textoAguardando}>aguardando os outros...</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: cores.fundo,
  },
  conteudo: {
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
    marginBottom: espacamento.lg,
  },
  nomePapel: {
    fontSize: tipografia.tamanhoDisplay,
    fontFamily: familias.serifDisplay,
    textAlign: 'center',
    letterSpacing: tipografia.spacingHero,
  },
  aliadosContainer: {
    marginTop: espacamento.xl,
    alignItems: 'center',
  },
  aliadosLabel: {
    fontSize: tipografia.tamanhoCorpoMenor,
    fontFamily: familias.sans,
    color: cores.textoSecundario,
    marginBottom: espacamento.sm,
  },
  nomeAliado: {
    fontSize: tipografia.tamanhoCorpoMaior,
    fontFamily: familias.sans,
    color: cores.texto,
    fontWeight: tipografia.pesoBold,
    marginBottom: espacamento.xs,
  },
  rodape: {
    paddingHorizontal: espacamento.lg,
    paddingBottom: espacamento.xl,
  },
  botaoPronto: {
    backgroundColor: cores.texto,
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textoBotao: {
    color: cores.fundo,
    fontSize: tipografia.tamanhoCorpoMaior,
    fontFamily: familias.sans,
    fontWeight: tipografia.pesoBold,
  },
  botaoDesabilitado: {
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textoAguardando: {
    fontSize: tipografia.tamanhoCorpo,
    fontFamily: familias.sans,
    color: cores.textoMudo,
  },
});
