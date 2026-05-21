/**
 * TelaFinalizado — Fase finalizado.
 *
 * Exibe o vencedor, reveal completo de todos os papéis,
 * conversões ocorridas e botão de nova partida.
 */

import React from 'react';
import {
  FlatList,
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

interface ItemJogador {
  id: PlayerId;
  nome: string;
}

export function TelaFinalizado({ estadoPublico, jogadores, onVoltar }: Props) {
  const revelacao = estadoPublico.revelacaoFinal;
  const vencedor = estadoPublico.vencedor;

  const corVencedor = vencedor === 'corrompidos' ? COR_CORRUPCAO : COR_INOCENTE;
  const textoVencedor = vencedor === 'corrompidos'
    ? 'corrompidos venceram.'
    : 'inocentes venceram.';

  const items: ItemJogador[] = jogadores.map((j) => ({
    id: j.id,
    nome: j.nome,
  }));

  const renderJogador = ({ item, index }: { item: ItemJogador; index: number }) => {
    const dadosRevelacao = revelacao?.papeisPorJogador[item.id];
    const papelOriginal = dadosRevelacao?.papelOriginal;
    const convertidoNoLoop = dadosRevelacao?.convertidoNoLoop ?? null;

    return (
      <View style={estilos.linhaJogador}>
        <View style={estilos.infoJogador}>
          <Text style={estilos.nomeJogador}>{item.nome}</Text>
          {papelOriginal && (
            <Text style={[estilos.papelJogador, { color: corDoPapel(papelOriginal) }]}>
              {papelOriginal}
            </Text>
          )}
          {convertidoNoLoop !== null && (
            <Text style={estilos.conversao}>
              → corrompido no loop {convertidoNoLoop}
            </Text>
          )}
        </View>
        {index < items.length - 1 && <View style={estilos.divisor} />}
      </View>
    );
  };

  const totalLoops = revelacao?.totalLoops ?? estadoPublico.loop;

  return (
    <SafeAreaView style={estilos.container}>
      {/* Cabeçalho fixo */}
      <View style={estilos.cabecalho}>
        <Text style={[estilos.textoVencedor, { color: corVencedor }]}>
          {textoVencedor}
        </Text>
      </View>

      {/* Lista scrollable */}
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderJogador}
        style={estilos.lista}
        contentContainerStyle={estilos.listaConteudo}
      />

      {/* Rodapé fixo */}
      <View style={estilos.rodape}>
        <Text style={estilos.totalLoops}>{totalLoops} {totalLoops === 1 ? 'loop' : 'loops'}</Text>
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
    fontSize: tipografia.tamanhoTituloGrande,
    fontFamily: familias.serifDisplay,
    letterSpacing: tipografia.spacingTitulo,
  },
  lista: {
    flex: 1,
  },
  listaConteudo: {
    paddingHorizontal: espacamento.lg,
    paddingTop: espacamento.md,
  },
  linhaJogador: {
    paddingVertical: espacamento.md,
  },
  infoJogador: {
    flexDirection: 'column',
  },
  nomeJogador: {
    fontSize: 18,
    fontFamily: familias.sans,
    fontWeight: tipografia.pesoBold,
    color: cores.texto,
    marginBottom: 2,
  },
  papelJogador: {
    fontSize: tipografia.tamanhoCorpoMenor,
    fontFamily: familias.sans,
    fontWeight: tipografia.pesoBold,
    marginBottom: 2,
  },
  conversao: {
    fontSize: 13,
    fontFamily: familias.sans,
    color: cores.textoMudo,
  },
  divisor: {
    height: 1,
    backgroundColor: cores.borda,
    marginTop: espacamento.md,
  },
  rodape: {
    paddingHorizontal: espacamento.lg,
    paddingBottom: espacamento.xl,
    paddingTop: espacamento.md,
    borderTopWidth: 1,
    borderTopColor: cores.borda,
  },
  totalLoops: {
    fontSize: 13,
    fontFamily: familias.sans,
    color: cores.textoMudo,
    marginBottom: espacamento.md,
    textAlign: 'center',
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
