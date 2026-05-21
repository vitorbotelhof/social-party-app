/**
 * TelaVotacaoInquisicao — Fase votando.
 *
 * Votação silenciosa simultânea. Cada jogador seleciona um alvo e confirma.
 * Após votar: aguarda contagem final.
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { PlayerId } from '@/engine/types';
import type { EstadoFirebaseInquisicao, VotacaoEmAndamento } from '@/games/inquisicao/types';
import type { InquisicaoRealtimeService } from '@/services/inquisicaoRealtime';
import { cores, espacamento, familias, tipografia } from '@/theme/colors';

interface Props {
  estadoPublico: EstadoFirebaseInquisicao;
  jogadorId: PlayerId;
  mapaNomes: Map<PlayerId, string>;
  realtime: InquisicaoRealtimeService;
}

export function TelaVotacaoInquisicao({ estadoPublico, jogadorId, mapaNomes, realtime }: Props) {
  const [alvoSelecionado, setAlvoSelecionado] = useState<PlayerId | null>(null);
  const [votando, setVotando] = useState(false);
  const [jaVotou, setJaVotou] = useState(false);

  const votacao = estadoPublico.votacaoAtual as VotacaoEmAndamento | null;
  const eliminadosIds = useMemo(
    () => new Set(estadoPublico.eliminados.map((e) => e.jogadorId)),
    [estadoPublico.eliminados],
  );

  // Verificar se já votou
  const jaConfirmou = votacao?.tipo === 'em_andamento' && !!votacao.votantesConfirmados[jogadorId];

  // Candidatos: ativos, excluindo self e eliminados
  const candidatos = useMemo(
    () =>
      estadoPublico.jogadoresAtivos.filter(
        (id) => id !== jogadorId && !eliminadosIds.has(id),
      ),
    [estadoPublico.jogadoresAtivos, jogadorId, eliminadosIds],
  );

  const totalVotaram = votacao?.tipo === 'em_andamento'
    ? Object.keys(votacao.votantesConfirmados).length
    : 0;
  const totalEsperado = votacao?.tipo === 'em_andamento' ? votacao.totalEsperado : 0;

  const handleConfirmar = useCallback(async () => {
    if (!alvoSelecionado || votando) return;
    setVotando(true);
    const resultado = await realtime.submeterVoto(
      jogadorId,
      alvoSelecionado,
      estadoPublico.loop,
    );
    if (resultado === 'ok' || resultado === 'ja_votou') {
      setJaVotou(true);
    }
    setVotando(false);
  }, [alvoSelecionado, votando, realtime, jogadorId, estadoPublico.loop]);

  const renderCandidato = useCallback(
    ({ item: id }: { item: PlayerId }) => {
      const selecionado = alvoSelecionado === id;
      const desabilitado = jaVotou || jaConfirmou;

      return (
        <TouchableOpacity
          style={[
            estilos.linhaJogador,
            selecionado && estilos.linhaJogadorSelecionada,
          ]}
          onPress={() => !desabilitado && setAlvoSelecionado(id)}
          disabled={desabilitado}
          activeOpacity={0.75}
        >
          <Text
            style={[
              estilos.nomeJogador,
              selecionado && estilos.nomeJogadorSelecionado,
            ]}
          >
            {mapaNomes.get(id) ?? id}
          </Text>
        </TouchableOpacity>
      );
    },
    [alvoSelecionado, jaVotou, jaConfirmou, mapaNomes],
  );

  const mostrarAguardando = jaVotou || jaConfirmou;

  return (
    <SafeAreaView style={estilos.container}>
      {/* Contador de votos */}
      <View style={estilos.cabecalho}>
        <Text style={estilos.contador}>
          {totalVotaram} de {totalEsperado} votaram
        </Text>
      </View>

      {/* Título */}
      <Text style={estilos.titulo}>quem vai embora?</Text>

      {/* Lista de candidatos */}
      <FlatList
        data={candidatos}
        keyExtractor={(id) => id}
        renderItem={renderCandidato}
        style={estilos.lista}
        contentContainerStyle={estilos.listaConteudo}
      />

      {/* Botão de confirmação */}
      <View style={estilos.rodape}>
        {mostrarAguardando ? (
          // Voto registrado — tela fica quieta enquanto os outros votam
          <View style={estilos.botaoDesabilitado} />
        ) : (
          <TouchableOpacity
            style={[
              estilos.botaoConfirmar,
              !alvoSelecionado && estilos.botaoInativo,
            ]}
            onPress={handleConfirmar}
            disabled={!alvoSelecionado || votando}
            activeOpacity={0.8}
          >
            <Text style={[
              estilos.textoBotao,
              !alvoSelecionado && estilos.textoBotaoInativo,
            ]}>
              confirmar
            </Text>
          </TouchableOpacity>
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
  cabecalho: {
    paddingHorizontal: espacamento.lg,
    paddingTop: espacamento.md,
    paddingBottom: espacamento.sm,
  },
  contador: {
    fontSize: 14,
    fontFamily: familias.sans,
    color: cores.textoMudo,
  },
  titulo: {
    fontSize: tipografia.tamanhoTitulo,
    fontFamily: familias.sans,
    fontWeight: tipografia.pesoBold,
    color: cores.texto,
    paddingHorizontal: espacamento.lg,
    paddingBottom: espacamento.lg,
    letterSpacing: tipografia.spacingApertado,
  },
  lista: {
    flex: 1,
  },
  listaConteudo: {
    paddingHorizontal: espacamento.lg,
  },
  linhaJogador: {
    height: 64,
    justifyContent: 'center',
    paddingHorizontal: espacamento.md,
    borderBottomWidth: 1,
    borderBottomColor: cores.borda,
    borderRadius: 8,
    marginBottom: espacamento.xs,
  },
  linhaJogadorSelecionada: {
    backgroundColor: cores.texto,
    borderBottomColor: cores.texto,
  },
  nomeJogador: {
    fontSize: tipografia.tamanhoSubtitulo,
    fontFamily: familias.sans,
    fontWeight: '500',
    color: cores.texto,
  },
  nomeJogadorSelecionado: {
    // Selecionado tem backgroundColor: cores.texto (claro) — texto deve ser escuro
    color: cores.fundo,
  },
  rodape: {
    paddingHorizontal: espacamento.lg,
    paddingBottom: espacamento.xl,
    paddingTop: espacamento.md,
  },
  botaoConfirmar: {
    backgroundColor: cores.texto,
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  botaoInativo: {
    backgroundColor: cores.borda,
  },
  textoBotao: {
    fontSize: tipografia.tamanhoCorpoMaior,
    fontFamily: familias.sans,
    fontWeight: tipografia.pesoBold,
    color: '#FFFFFF',
  },
  textoBotaoInativo: {
    color: cores.textoMudo,
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
