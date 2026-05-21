/**
 * TelaDistribuindoPapeis — Fase revelando_papeis.
 *
 * Papel em grande. Aliados em silêncio abaixo.
 * Botão desaparece após confirmar — o papel fica visível enquanto aguarda.
 * Sem labels óbvios. Sem texto de status. O silêncio é o pacing.
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
import * as Haptics from 'expo-haptics';

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
  mapaNomes: Map<PlayerId, string>;
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

  // Entrada: fade in + subir suave
  const opacidade = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(14)).current;

  // Pulso sutil do indicador de espera
  const pulsarOp = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacidade, { toValue: 1, duration: 260, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 260, useNativeDriver: true }),
    ]).start();
  }, [opacidade, translateY]);

  useEffect(() => {
    if (!pronto) return;
    // Pulso lento enquanto aguarda — mantém vida na tela sem adicionar ruído
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulsarOp, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(pulsarOp, { toValue: 0.3, duration: 900, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pronto, pulsarOp]);

  const papel = estadoPrivado.papelOriginal;
  const faccao = derivarFaccao(estadoPrivado);
  const isCorrompido = faccao === 'corrompidos';
  const aliados = estadoPrivado.corrompidosConhecidos.filter((id) => id !== jogadorId);

  // Subtítulo contextual por papel — onboarding implícito sem tutorial explícito
  const subtituloPapel =
    papel === 'corrompido'
      ? 'elimine os inocentes. não seja descoberto.'
      : papel === 'guardiao'
        ? 'proteja um jogador por noite. você é um inocente.'
        : 'descubra os corrompidos. vote sabiamente.';

  const handlePronto = () => {
    setPronto(true);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
        {/* Papel — o nome é a informação, sem label */}
        <Text style={[estilos.nomePapel, { color: corDoPapel(papel) }]}>
          {papel}
        </Text>

        {/* Micro-descrição contextual — onboarding implícito por papel */}
        <Text style={estilos.subtituloPapel}>{subtituloPapel}</Text>

        {/* Aliados: corrompidos veem quem está do seu lado — sem header */}
        {isCorrompido && aliados.length > 0 && (
          <View style={estilos.aliadosContainer}>
            <View style={estilos.separador} />
            {aliados.map((id) => (
              <Text key={id} style={estilos.nomeAliado}>
                {mapaNomes.get(id) ?? id}
              </Text>
            ))}
          </View>
        )}
      </Animated.View>

      {/* Rodapé: botão desaparece, tela fica em silêncio enquanto aguarda */}
      <View style={estilos.rodape}>
        {!pronto ? (
          <TouchableOpacity
            style={estilos.botaoPronto}
            onPress={handlePronto}
            activeOpacity={0.75}
          >
            <Text style={estilos.textoBotao}>pronto</Text>
          </TouchableOpacity>
        ) : (
          <Animated.View style={[estilos.indicadorEspera, { opacity: pulsarOp }]}>
            <View style={estilos.pontinho} />
          </Animated.View>
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
  nomePapel: {
    fontSize: tipografia.tamanhoDisplay,
    fontFamily: familias.serifDisplay,
    textAlign: 'center',
    letterSpacing: tipografia.spacingHero,
  },
  subtituloPapel: {
    fontSize: tipografia.tamanhoCorpoMenor,
    fontFamily: familias.sans,
    color: cores.textoMudo,
    textAlign: 'center',
    marginTop: espacamento.sm,
    letterSpacing: 0.3,
  },
  separador: {
    height: 1,
    width: 32,
    backgroundColor: cores.borda,
    marginBottom: espacamento.md,
    marginTop: espacamento.xl,
  },
  aliadosContainer: {
    alignItems: 'center',
  },
  nomeAliado: {
    fontSize: tipografia.tamanhoCorpoMaior,
    fontFamily: familias.sans,
    color: COR_CORRUPCAO,
    fontWeight: tipografia.pesoBold,
    marginBottom: espacamento.xs,
  },
  rodape: {
    paddingHorizontal: espacamento.lg,
    paddingBottom: espacamento.xl,
    alignItems: 'center',
  },
  botaoPronto: {
    backgroundColor: cores.texto,
    borderRadius: 12,
    height: 56,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textoBotao: {
    color: cores.fundo,
    fontSize: tipografia.tamanhoCorpoMaior,
    fontFamily: familias.sans,
    fontWeight: tipografia.pesoBold,
  },
  indicadorEspera: {
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pontinho: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: cores.textoMudo,
  },
});
