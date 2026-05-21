/**
 * TelaResultadoLocalVMC — Resultado final com narrativa emocional.
 *
 * Não é um ranking. É uma leitura do grupo.
 *
 * Estrutura:
 *   - Headline: 1-2 frases sobre o que o jogo revelou
 *   - Lista de jogadores com acertos (como leitores)
 *   - Botão "nova partida"
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

import type {
  JogadorVMC,
  PlayerId,
  ResultadoVMCFinalizado,
} from '@/games/voce-me-conhece/local/types';
import { cores, espacamento, familias, tipografia } from '@/theme/colors';

const COR_ACERTO = '#22C55E';

interface Props {
  resultado: ResultadoVMCFinalizado;
  jogadores: JogadorVMC[];
  onVoltar: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Geração de narrativa
// ─────────────────────────────────────────────────────────────────────────────

function getNome(jogadores: JogadorVMC[], id: PlayerId): string {
  return jogadores.find((j) => j.id === id)?.nome ?? id;
}

function gerarNarrativa(
  resultado: ResultadoVMCFinalizado,
  jogadores: JogadorVMC[],
): string[] {
  const linhas: string[] = [];
  const {
    melhorLeitorId,
    menosPrevistoId,
    leiturasPerfeitasTotal,
    desconhecidosTotal,
    acertosComoRanqueador,
    totalRodadas,
    totalJogadores,
  } = resultado;

  // Leituras perfeitas em maioria = grupo muito sincronizado
  if (leiturasPerfeitasTotal >= Math.floor(totalRodadas / 2)) {
    linhas.push('esse grupo se conhece de verdade.');
  }

  // Muitos "ninguém acertou" = grupo cheio de surpresas
  if (desconhecidosTotal >= Math.floor(totalRodadas / 3)) {
    linhas.push('mais mistério aqui do que parecia.');
  }

  // Melhor leitor
  if (melhorLeitorId) {
    const nome = getNome(jogadores, melhorLeitorId);
    linhas.push(`${nome} leu o grupo melhor do que ninguém.`);
  }

  // Menos previsto: ranqueador que o grupo errou mais vezes
  if (menosPrevistoId && totalJogadores > 2) {
    const acertos = acertosComoRanqueador[menosPrevistoId] ?? 0;
    const nome = getNome(jogadores, menosPrevistoId);
    if (acertos === 0) {
      linhas.push(`o grupo ainda não decifrou o ${nome}.`);
    } else {
      linhas.push(`${nome} sempre surpreendeu.`);
    }
  }

  // Se nada foi detectado — genérico
  if (linhas.length === 0) {
    linhas.push('vocês se conhecem mais do que achavam.');
  }

  return linhas;
}

// ─────────────────────────────────────────────────────────────────────────────
// Componente
// ─────────────────────────────────────────────────────────────────────────────

export function TelaResultadoLocalVMC({ resultado, jogadores, onVoltar }: Props) {
  const opacidade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacidade, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [opacidade]);

  const narrativa = gerarNarrativa(resultado, jogadores);

  // Ordena jogadores por acertos como leitores (decrescente)
  const jogadoresOrdenados = [...jogadores].sort(
    (a, b) =>
      (resultado.acertosPorJogador[b.id] ?? 0) -
      (resultado.acertosPorJogador[a.id] ?? 0),
  );

  const maxAcertos = Math.max(
    ...jogadores.map((j) => resultado.acertosPorJogador[j.id] ?? 0),
  );

  return (
    <Animated.View style={[estilos.flex1, { opacity: opacidade }]}>
      <SafeAreaView style={estilos.container}>

        {/* Narrativa */}
        <View style={estilos.cabecalho}>
          {narrativa.map((linha, i) => (
            <Text
              key={i}
              style={[
                estilos.narrativa,
                i === 0 ? estilos.narrativaPrimaria : estilos.narrativaSecundaria,
              ]}
            >
              {linha}
            </Text>
          ))}
          <Text style={estilos.subtitulo}>
            {resultado.totalRodadas} {resultado.totalRodadas === 1 ? 'rodada' : 'rodadas'}
          </Text>
        </View>

        {/* Lista de leitores */}
        <ScrollView
          style={estilos.lista}
          contentContainerStyle={estilos.listaConteudo}
          showsVerticalScrollIndicator={false}
        >
          {jogadoresOrdenados.map((jogador, index) => {
            const acertos = resultado.acertosPorJogador[jogador.id] ?? 0;
            const isMelhor = acertos === maxAcertos && acertos > 0;

            return (
              <View key={jogador.id}>
                <View style={estilos.linhaJogador}>
                  <Text style={estilos.nomeJogador}>{jogador.nome}</Text>
                  <Text
                    style={[
                      estilos.acertosJogador,
                      isMelhor && estilos.acertosJogadorDestaque,
                    ]}
                  >
                    {acertos} {acertos === 1 ? 'leitura' : 'leituras'}
                  </Text>
                </View>
                {index < jogadoresOrdenados.length - 1 && (
                  <View style={estilos.divisor} />
                )}
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
    gap: espacamento.xs,
  },
  narrativa: {
    fontFamily: familias.serifDisplay,
    letterSpacing: tipografia.spacingHero,
  },
  narrativaPrimaria: {
    fontSize: tipografia.tamanhoDisplay,
    color: cores.texto,
  },
  narrativaSecundaria: {
    fontSize: tipografia.tamanhoTitulo,
    color: cores.textoMudo,
  },
  subtitulo: {
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nomeJogador: {
    fontSize: 18,
    fontFamily: familias.sans,
    fontWeight: tipografia.pesoBold,
    color: cores.texto,
  },
  acertosJogador: {
    fontSize: tipografia.tamanhoCorpoMenor,
    fontFamily: familias.sans,
    color: cores.textoMudo,
  },
  acertosJogadorDestaque: {
    color: COR_ACERTO,
    fontWeight: tipografia.pesoBold,
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
