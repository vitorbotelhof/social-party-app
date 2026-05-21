/**
 * TelaResultadoLocal — Tela de resultado final do modo local.
 *
 * Estrutura:
 *   - Vencedor em destaque (grande, na cor da facção)
 *   - N loops jogados (contexto mínimo)
 *   - Lista de todos os jogadores com papel final
 *   - Conversão marcada para jogadores contaminados
 *   - Botão "nova partida" — retorna imediatamente
 */

import React, { useEffect, useRef } from 'react';
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { EstadoLocalPublico, JogadorLocal } from '@/games/inquisicao/local/types';
import { cores, espacamento, familias, tipografia } from '@/theme/colors';

const COR_CORROMPIDO = '#FF5A5F';
const COR_INOCENTE = '#4D7CFE';
const COR_GUARDIAO = '#22C55E';

function corDoPapel(papel: string): string {
  if (papel === 'corrompido') return COR_CORROMPIDO;
  if (papel === 'guardiao') return COR_GUARDIAO;
  return COR_INOCENTE;
}

interface Props {
  estado: EstadoLocalPublico;
  jogadores: JogadorLocal[];
  onVoltar: () => void;
  /** Apenas em __DEV__ — abre o relatório de playtest. */
  onVerRelatorio?: () => void;
}

export function TelaResultadoLocal({ estado, jogadores, onVoltar, onVerRelatorio }: Props) {
  const revelacao = estado.revelacaoFinal;
  const vencedor = estado.vencedor;
  const totalLoops = revelacao?.totalLoops ?? estado.loop;

  const corVencedor = vencedor === 'corrompidos' ? COR_CORROMPIDO : COR_INOCENTE;
  const textoVencedor = vencedor === 'corrompidos' ? 'corrompidos.' : 'inocentes.';

  const opacidade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacidade, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [opacidade]);

  return (
    <Animated.View style={[estilos.flex1, { opacity: opacidade }]}>
      <SafeAreaView style={estilos.container}>

        {/* Vencedor */}
        <View style={estilos.cabecalho}>
          <Text style={[estilos.textoVencedor, { color: corVencedor }]}>
            {textoVencedor}
          </Text>
          <Text style={estilos.subtituloLoops}>
            {totalLoops} {totalLoops === 1 ? 'loop' : 'loops'}
          </Text>
        </View>

        {/* Lista de jogadores */}
        <ScrollView
          style={estilos.lista}
          contentContainerStyle={estilos.listaConteudo}
          showsVerticalScrollIndicator={false}
        >
          {jogadores.map((jogador, index) => {
            const dados = revelacao?.papeisPorJogador[jogador.id];
            const papelFinal = dados?.papelFinal;
            const papelOriginal = dados?.papelOriginal;
            const convertidoNoLoop = dados?.convertidoNoLoop ?? null;

            // Mostrar "(convertido)" se virou corrompido por contaminação
            const foiContaminado =
              convertidoNoLoop !== null && papelOriginal !== 'corrompido';

            return (
              <View key={jogador.id}>
                <View style={estilos.linhaJogador}>
                  <Text style={estilos.nomeJogador}>{jogador.nome}</Text>

                  {papelFinal && (
                    <Text style={[estilos.papelJogador, { color: corDoPapel(papelFinal) }]}>
                      {papelFinal}
                    </Text>
                  )}

                  {foiContaminado && convertidoNoLoop !== null && (
                    <Text style={estilos.conversao}>
                      virou corrompido no loop {convertidoNoLoop}
                    </Text>
                  )}
                </View>
                {index < jogadores.length - 1 && <View style={estilos.divisor} />}
              </View>
            );
          })}
        </ScrollView>

        {/* Rodapé */}
        <View style={estilos.rodape}>
          <TouchableOpacity
            style={estilos.botaoNova}
            onPress={onVoltar}
            activeOpacity={0.8}
          >
            <Text style={estilos.textoBotao}>nova partida</Text>
          </TouchableOpacity>

          {/* Botão de playtest — apenas em __DEV__ */}
          {onVerRelatorio && (
            <TouchableOpacity
              style={estilos.botaoPlaytest}
              onPress={onVerRelatorio}
              activeOpacity={0.7}
            >
              <Text style={estilos.textoBotaoPlaytest}>ver relatório de playtest</Text>
            </TouchableOpacity>
          )}
        </View>

      </SafeAreaView>
    </Animated.View>
  );
}

const estilos = StyleSheet.create({
  flex1: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: cores.fundo,
  },
  cabecalho: {
    paddingHorizontal: espacamento.lg,
    paddingTop: espacamento.lg,
    paddingBottom: espacamento.lg,
    borderBottomWidth: 1,
    borderBottomColor: cores.borda,
  },
  textoVencedor: {
    fontSize: tipografia.tamanhoDisplay,
    fontFamily: familias.serifDisplay,
    letterSpacing: tipografia.spacingHero,
  },
  subtituloLoops: {
    fontSize: tipografia.tamanhoCorpoMenor,
    fontFamily: familias.sans,
    color: cores.textoMudo,
    marginTop: espacamento.xs,
  },
  lista: { flex: 1 },
  listaConteudo: {
    paddingHorizontal: espacamento.lg,
    paddingTop: espacamento.md,
    paddingBottom: espacamento.lg,
  },
  linhaJogador: {
    paddingVertical: espacamento.md,
    gap: 2,
  },
  nomeJogador: {
    fontSize: 18,
    fontFamily: familias.sans,
    fontWeight: tipografia.pesoBold,
    color: cores.texto,
  },
  papelJogador: {
    fontSize: tipografia.tamanhoCorpoMenor,
    fontFamily: familias.sans,
    fontWeight: tipografia.pesoBold,
  },
  conversao: {
    fontSize: 13,
    fontFamily: familias.sans,
    color: cores.textoMudo,
  },
  divisor: {
    height: 1,
    backgroundColor: cores.borda,
  },
  rodape: {
    paddingHorizontal: espacamento.lg,
    paddingBottom: espacamento.xl,
    paddingTop: espacamento.md,
    borderTopWidth: 1,
    borderTopColor: cores.borda,
    gap: espacamento.sm,
  },
  botaoNova: {
    backgroundColor: cores.texto,
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textoBotao: {
    fontSize: tipografia.tamanhoCorpoMaior,
    fontFamily: familias.sans,
    fontWeight: tipografia.pesoBold,
    color: cores.fundo,
  },
  // Dev-only — não aparece em produção
  botaoPlaytest: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textoBotaoPlaytest: {
    fontSize: 11,
    fontFamily: familias.sans,
    color: cores.textoMudo,
    letterSpacing: 0.5,
  },
});
