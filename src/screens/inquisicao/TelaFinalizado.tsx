/**
 * TelaFinalizado — Fase finalizado.
 *
 * Resultado em duas partes: quem ganhou (grande) + reveal de papéis (lista).
 * Sem label "RESULTADO" nem narrativa. O vencedor fala por si.
 * "nova partida" volta para SelecaoJogo — imediato, sem confirmação.
 */

import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { Player, PlayerId } from '@/engine/types';
import type { EstadoFirebaseInquisicao, PapelInquisicao } from '@/games/inquisicao/types';
import { cores, espacamento, familias, tipografia } from '@/theme/colors';

const COR_CORRUPCAO = '#FF5A5F';
const COR_INOCENTE = '#4D7CFE';
const COR_GUARDIAO = '#22C55E';

interface Props {
  estadoPublico: EstadoFirebaseInquisicao;
  jogadores: Player[];
  jogadorId: PlayerId;
  onVoltar: () => void;
}

function corDoPapel(papel: PapelInquisicao): string {
  if (papel === 'corrompido') return COR_CORRUPCAO;
  if (papel === 'guardiao') return COR_GUARDIAO;
  return COR_INOCENTE;
}

export function TelaFinalizado({ estadoPublico, jogadores, jogadorId, onVoltar }: Props) {
  const revelacao = estadoPublico.revelacaoFinal;
  const vencedor = estadoPublico.vencedor;
  const totalLoops = revelacao?.totalLoops ?? estadoPublico.loop;

  const corVencedor = vencedor === 'corrompidos' ? COR_CORRUPCAO : COR_INOCENTE;
  const textoVencedor = vencedor === 'corrompidos'
    ? 'corrompidos.'
    : 'inocentes.';

  return (
    <SafeAreaView style={estilos.container}>

      {/* Cabeçalho fixo: vencedor em destaque + loops como contexto */}
      <View style={estilos.cabecalho}>
        <Text style={[estilos.textoVencedor, { color: corVencedor }]}>
          {textoVencedor}
        </Text>
        <Text style={estilos.subtituloLoops}>
          {totalLoops} {totalLoops === 1 ? 'loop' : 'loops'}
        </Text>
      </View>

      {/* Lista scrollable de reveals — sem FlatList (máx 10 jogadores) */}
      <ScrollView
        style={estilos.lista}
        contentContainerStyle={estilos.listaConteudo}
        showsVerticalScrollIndicator={false}
      >
        {jogadores.map((jogador, index) => {
          const dadosRevelacao = revelacao?.papeisPorJogador[jogador.id];
          const papelOriginal = dadosRevelacao?.papelOriginal;
          const convertidoNoLoop = dadosRevelacao?.convertidoNoLoop ?? null;
          const euMesmo = jogador.id === jogadorId;

          return (
            <View key={jogador.id}>
              <View style={estilos.linhaJogador}>
                <View style={estilos.infoJogador}>
                  <Text style={[estilos.nomeJogador, euMesmo && estilos.nomeJogadorEu]}>
                    {jogador.nome}
                    {euMesmo && <Text style={estilos.euTag}> (você)</Text>}
                  </Text>
                  {papelOriginal && (
                    <Text style={[estilos.papelJogador, { color: corDoPapel(papelOriginal) }]}>
                      {papelOriginal}
                    </Text>
                  )}
                  {convertidoNoLoop !== null && (
                    <Text style={estilos.conversao}>
                      convertido no loop {convertidoNoLoop}
                    </Text>
                  )}
                </View>
              </View>
              {index < jogadores.length - 1 && <View style={estilos.divisor} />}
            </View>
          );
        })}
      </ScrollView>

      {/* Rodapé fixo: replay imediato, sem confirmação */}
      <View style={estilos.rodape}>
        <TouchableOpacity
          style={estilos.botaoNova}
          onPress={onVoltar}
          activeOpacity={0.8}
        >
          <Text style={estilos.textoBotao}>nova partida</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
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
  lista: {
    flex: 1,
  },
  listaConteudo: {
    paddingHorizontal: espacamento.lg,
    paddingTop: espacamento.md,
    paddingBottom: espacamento.lg,
  },
  linhaJogador: {
    paddingVertical: espacamento.md,
  },
  infoJogador: {
    flexDirection: 'column',
    gap: 2,
  },
  nomeJogador: {
    fontSize: 18,
    fontFamily: familias.sans,
    fontWeight: tipografia.pesoBold,
    color: cores.texto,
  },
  nomeJogadorEu: {
    color: cores.texto,
  },
  euTag: {
    fontSize: tipografia.tamanhoCorpoMenor,
    fontWeight: tipografia.pesoRegular,
    color: cores.textoMudo,
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
});
