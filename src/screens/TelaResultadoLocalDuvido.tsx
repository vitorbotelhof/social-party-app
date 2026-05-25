/**
 * TelaResultadoLocalDuvido — Resultado da sessão de Duvido.
 *
 * Exibe:
 *   - Narrativa emocional baseada na temperatura da sessão
 *   - Campeão (mais rankings vencidos)
 *   - Placar por jogador
 *   - Histórico de rankings (título + vencedor)
 *   - Botões: jogar de novo / início
 */

import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useRef } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { RootStackParamList } from '@/navigation/types';
import { cores, espacamento, familias, raio, tipografia } from '@/theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'ResultadoLocalDuvido'>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getNome(
  jogadores: { id: string; nome: string }[],
  id: string,
): string {
  return jogadores.find((j) => j.id === id)?.nome ?? id;
}

type HistoricoItem = {
  rankingId: string;
  rankingTitulo: string;
  vencedorId: string;
  totalEliminacoes: number;
  itensDitos: string[];
};

function calcularRankingsVencidos(
  historico: HistoricoItem[],
  jogadorId: string,
): number {
  return historico.filter((h) => h.vencedorId === jogadorId).length;
}

function calcularCampeao(
  historico: HistoricoItem[],
  jogadores: { id: string; nome: string }[],
): { id: string; nome: string; vitorias: number } | null {
  if (historico.length === 0 || jogadores.length === 0) return null;

  let melhorId = jogadores[0].id;
  let melhorVitorias = 0;

  for (const j of jogadores) {
    const vitorias = calcularRankingsVencidos(historico, j.id);
    if (vitorias > melhorVitorias) {
      melhorVitorias = vitorias;
      melhorId = j.id;
    }
  }

  return {
    id: melhorId,
    nome: getNome(jogadores, melhorId),
    vitorias: melhorVitorias,
  };
}

// ─── Narrativa por temperatura ────────────────────────────────────────────────

const NARRATIVAS: Record<
  'competitivo' | 'caótico' | 'equilibrado',
  { titulo: string; subtitulo: string }
> = {
  competitivo: {
    titulo: 'alguém dominou a mesa.',
    subtitulo: 'conhecimento real. sem bluff, sem desculpa.',
  },
  caótico: {
    titulo: 'ninguém estava seguro.',
    subtitulo: 'dúvidas voando, bluffs explodindo. exatamente como devia ser.',
  },
  equilibrado: {
    titulo: 'jogo equilibrado.',
    subtitulo: 'leitura social e conhecimento andando juntos.',
  },
};

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function CartaoCampeao({
  nome,
  vitorias,
  totalRankings,
}: {
  nome: string;
  vitorias: number;
  totalRankings: number;
}) {
  return (
    <View style={estilos.cartaoCampeao}>
      <Text style={estilos.medalha}>🏆</Text>
      <Text style={estilos.nomeCampeao}>{nome}</Text>
      <Text style={estilos.vitoriasTexto}>
        {vitorias} de {totalRankings} ranking{totalRankings === 1 ? '' : 's'}
      </Text>
    </View>
  );
}

function LinhaJogador({
  nome,
  vitorias,
  ehCampeao,
  divisor,
}: {
  nome: string;
  vitorias: number;
  ehCampeao: boolean;
  divisor: boolean;
}) {
  return (
    <View>
      <View style={estilos.linhaJogador}>
        <Text
          style={[estilos.nomeJogador, ehCampeao && estilos.nomeJogadorDestaque]}
        >
          {nome}
        </Text>
        <Text
          style={[
            estilos.vitoriasJogador,
            ehCampeao && estilos.vitoriasJogadorDestaque,
          ]}
        >
          {vitorias} {vitorias === 1 ? 'vitória' : 'vitórias'}
        </Text>
      </View>
      {divisor && <View style={estilos.divisor} />}
    </View>
  );
}

function CartaoRanking({
  titulo,
  nomeVencedor,
  totalEliminacoes,
  itensDitos,
}: {
  titulo: string;
  nomeVencedor: string;
  totalEliminacoes: number;
  itensDitos: string[];
}) {
  return (
    <View style={estilos.cartaoRanking}>
      <View style={estilos.rankingTopo}>
        <Text style={estilos.rankingTitulo} numberOfLines={2}>
          {titulo}
        </Text>
        <Text style={estilos.rankingVencedor}>{nomeVencedor}</Text>
      </View>
      <View style={estilos.rankingRodape}>
        <Text style={estilos.rankingStat}>
          {totalEliminacoes}{' '}
          {totalEliminacoes === 1 ? 'eliminação' : 'eliminações'}
        </Text>
        {itensDitos.length > 0 && (
          <Text style={estilos.rankingStat} numberOfLines={1}>
            {itensDitos.slice(0, 3).join(' · ')}
            {itensDitos.length > 3 ? ' ...' : ''}
          </Text>
        )}
      </View>
    </View>
  );
}

// ─── Tela ─────────────────────────────────────────────────────────────────────

export function TelaResultadoLocalDuvido({ route, navigation }: Props) {
  const { jogadores, historicoPorRanking, totalRankings, temperatura } =
    route.params;

  const opacidade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacidade, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true,
    }).start();
  }, [opacidade]);

  const narrativa = NARRATIVAS[temperatura];
  const campeao = calcularCampeao(historicoPorRanking, jogadores);

  // Ordenar jogadores por vitórias (decrescente)
  const jogadoresOrdenados = [...jogadores].sort(
    (a, b) =>
      calcularRankingsVencidos(historicoPorRanking, b.id) -
      calcularRankingsVencidos(historicoPorRanking, a.id),
  );

  return (
    <Animated.View style={[estilos.flex1, { opacity: opacidade }]}>
      <SafeAreaView style={estilos.container} edges={['top', 'bottom']}>

        <ScrollView
          style={estilos.scroll}
          contentContainerStyle={estilos.scrollConteudo}
          showsVerticalScrollIndicator={false}
        >
          {/* Narrativa */}
          <View style={estilos.cabecalho}>
            <Text style={estilos.tagJogo}>duvido</Text>
            <Text style={estilos.tituloPrincipal}>{narrativa.titulo}</Text>
            <Text style={estilos.subtituloNarrativa}>{narrativa.subtitulo}</Text>
            <Text style={estilos.totalRankingsTexto}>
              {totalRankings} ranking{totalRankings === 1 ? '' : 's'} jogado
              {totalRankings === 1 ? '' : 's'}
            </Text>
          </View>

          {/* Campeão */}
          {campeao && campeao.vitorias > 0 && (
            <View style={estilos.secao}>
              <CartaoCampeao
                nome={campeao.nome}
                vitorias={campeao.vitorias}
                totalRankings={totalRankings}
              />
            </View>
          )}

          {/* Placar */}
          <View style={estilos.secao}>
            <Text style={estilos.secaoTitulo}>placar</Text>
            <View style={estilos.cardLista}>
              {jogadoresOrdenados.map((j, i) => {
                const vitorias = calcularRankingsVencidos(historicoPorRanking, j.id);
                const ehCampeao = campeao?.id === j.id && campeao.vitorias > 0;
                return (
                  <LinhaJogador
                    key={j.id}
                    nome={j.nome}
                    vitorias={vitorias}
                    ehCampeao={ehCampeao}
                    divisor={i < jogadoresOrdenados.length - 1}
                  />
                );
              })}
            </View>
          </View>

          {/* Histórico de rankings */}
          {historicoPorRanking.length > 0 && (
            <View style={estilos.secao}>
              <Text style={estilos.secaoTitulo}>rankings</Text>
              <View style={estilos.listaRankings}>
                {historicoPorRanking.map((h, i) => (
                  <CartaoRanking
                    key={`${h.rankingId}-${i}`}
                    titulo={h.rankingTitulo}
                    nomeVencedor={getNome(jogadores, h.vencedorId)}
                    totalEliminacoes={h.totalEliminacoes}
                    itensDitos={h.itensDitos}
                  />
                ))}
              </View>
            </View>
          )}
        </ScrollView>

        {/* Rodapé com ações */}
        <View style={estilos.rodape}>
          <Pressable
            style={({ pressed }) => [
              estilos.botaoJogarDeNovo,
              pressed && estilos.pressionado,
            ]}
            onPress={() => navigation.replace('ConfiguracaoLocalDuvido')}
            accessibilityRole="button"
            accessibilityLabel="Jogar de novo"
          >
            <Text style={estilos.botaoJogarDeNovoTexto}>jogar de novo</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              estilos.botaoInicio,
              pressed && estilos.pressionado,
            ]}
            onPress={() => navigation.navigate('Inicio')}
            accessibilityRole="button"
            accessibilityLabel="Ir para o início"
          >
            <Text style={estilos.botaoInicioTexto}>início</Text>
          </Pressable>
        </View>

      </SafeAreaView>
    </Animated.View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const estilos = StyleSheet.create({
  flex1: { flex: 1 },

  container: {
    flex: 1,
    backgroundColor: cores.fundo,
  },

  scroll: { flex: 1 },

  scrollConteudo: {
    paddingBottom: espacamento.xl,
  },

  // Cabeçalho narrativo
  cabecalho: {
    paddingHorizontal: espacamento.lg,
    paddingTop: espacamento.xl,
    paddingBottom: espacamento.lg,
    borderBottomWidth: 1,
    borderBottomColor: cores.borda,
    gap: espacamento.xs,
  },
  tagJogo: {
    color: cores.primaria,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    fontWeight: tipografia.pesoSemibold,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: espacamento.xs,
  },
  tituloPrincipal: {
    color: cores.texto,
    fontFamily: familias.serifDisplay,
    fontSize: tipografia.tamanhoDisplay,
    lineHeight: 54,
  },
  subtituloNarrativa: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpoMenor,
    lineHeight: 20,
    marginTop: espacamento.xs,
  },
  totalRankingsTexto: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    marginTop: espacamento.sm,
  },

  // Seções
  secao: {
    paddingHorizontal: espacamento.lg,
    marginTop: espacamento.xl,
    gap: espacamento.sm,
  },
  secaoTitulo: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    fontWeight: tipografia.pesoSemibold,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  // Cartão do campeão
  cartaoCampeao: {
    alignItems: 'center',
    backgroundColor: cores.superficie,
    borderColor: cores.borda,
    borderRadius: raio.lg,
    borderWidth: 1,
    gap: espacamento.xs,
    paddingVertical: espacamento.xl,
    paddingHorizontal: espacamento.lg,
  },
  medalha: {
    fontSize: 40,
    marginBottom: espacamento.xs,
  },
  nomeCampeao: {
    color: cores.texto,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoTitulo,
    fontWeight: tipografia.pesoBlack,
    textAlign: 'center',
  },
  vitoriasTexto: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpoMenor,
  },

  // Lista de jogadores
  cardLista: {
    backgroundColor: cores.superficie,
    borderColor: cores.borda,
    borderRadius: raio.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  linhaJogador: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: espacamento.md,
    paddingVertical: espacamento.md,
  },
  nomeJogador: {
    color: cores.texto,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpoMaior,
    fontWeight: tipografia.pesoBold,
  },
  nomeJogadorDestaque: {
    color: cores.primaria,
  },
  vitoriasJogador: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpoMenor,
  },
  vitoriasJogadorDestaque: {
    color: cores.primaria,
    fontWeight: tipografia.pesoBold,
  },
  divisor: {
    backgroundColor: cores.borda,
    height: 1,
    marginHorizontal: espacamento.md,
  },

  // Histórico de rankings
  listaRankings: {
    gap: espacamento.sm,
  },
  cartaoRanking: {
    backgroundColor: cores.superficie,
    borderColor: cores.borda,
    borderRadius: raio.md,
    borderWidth: 1,
    gap: espacamento.xs,
    paddingHorizontal: espacamento.md,
    paddingVertical: espacamento.md,
  },
  rankingTopo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: espacamento.sm,
  },
  rankingTitulo: {
    color: cores.texto,
    flex: 1,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpoMenor,
    fontWeight: tipografia.pesoBold,
    lineHeight: 18,
  },
  rankingVencedor: {
    color: cores.primaria,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpoMenor,
    fontWeight: tipografia.pesoSemibold,
    flexShrink: 0,
  },
  rankingRodape: {
    flexDirection: 'row',
    gap: espacamento.md,
  },
  rankingStat: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    flex: 1,
  },

  // Rodapé
  rodape: {
    borderTopColor: cores.borda,
    borderTopWidth: 1,
    gap: espacamento.sm,
    paddingBottom: espacamento.lg,
    paddingHorizontal: espacamento.lg,
    paddingTop: espacamento.md,
  },
  botaoJogarDeNovo: {
    alignItems: 'center',
    backgroundColor: cores.texto,
    borderRadius: raio.md,
    height: 56,
    justifyContent: 'center',
  },
  botaoJogarDeNovoTexto: {
    color: cores.fundo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpoMaior,
    fontWeight: tipografia.pesoBold,
  },
  botaoInicio: {
    alignItems: 'center',
    backgroundColor: cores.superficie,
    borderColor: cores.borda,
    borderRadius: raio.md,
    borderWidth: 1,
    height: 52,
    justifyContent: 'center',
  },
  botaoInicioTexto: {
    color: cores.textoSecundario,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpo,
    fontWeight: tipografia.pesoBold,
  },

  pressionado: {
    opacity: 0.72,
    transform: [{ scale: 0.98 }],
  },
});
