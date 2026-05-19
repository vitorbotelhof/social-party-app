import { LinearGradient } from 'expo-linear-gradient';
import { useMemo } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BarraAcoesJogo, IndicadorConexao } from '@/components';
import type { GameState, Player, PlayerId } from '@/engine/types';
import type {
  MostLikelyPrivateState,
  MostLikelyPublicState,
  ResultadoRodada,
} from '@/games/most-likely-to/types';
import {
  PALETA_AVATARES,
  cores,
  espacamento,
  familias,
  raio,
  tipografia,
} from '@/theme/colors';

type EstadoMLT = GameState<MostLikelyPublicState, MostLikelyPrivateState>;

interface Props {
  estado: EstadoMLT;
  jogadores: Player[];
  jogadorId: PlayerId;
  onJogarDeNovo?: () => void;
  onVoltar?: () => void;
}

export function TelaResultadoMostLikely({
  estado,
  jogadores,
  jogadorId: _jogadorId,
  onJogarDeNovo,
  onVoltar,
}: Props) {
  const { estadoPublico } = estado;
  const { resultados, ordemJogadores } = estadoPublico;

  // Traits acumuladas por jogador (prompts que cada um "ganhou")
  const traitsPorJogador = useMemo(() => {
    const m = new Map<PlayerId, string[]>();
    for (const r of resultados) {
      const traits = m.get(r.vencedorId) ?? [];
      traits.push(r.prompt);
      m.set(r.vencedorId, traits);
    }
    return m;
  }, [resultados]);

  // Jogadores que apareceram no retrato (tiveram pelo menos 1 rodada ganha)
  const jogadoresComTraits = useMemo(
    () => ordemJogadores.filter((id) => (traitsPorJogador.get(id)?.length ?? 0) > 0),
    [ordemJogadores, traitsPorJogador],
  );

  // Mais nomeado da noite
  const maisNomeado = estado.vencedorIds[0] ?? null;

  // Rodada com maior concentração de votos (mais unânime)
  const rodadaMaisUnanime = useMemo<ResultadoRodada | null>(() => {
    let max = 0;
    let rodada: ResultadoRodada | null = null;
    for (const r of resultados) {
      if (!r.foiEmpate && r.totalVotosVencedor > max) {
        max = r.totalVotosVencedor;
        rodada = r;
      }
    }
    return rodada;
  }, [resultados]);

  // Rodada mais dividida (empate ou menor concentração)
  const rodadaMaisDividida = useMemo<ResultadoRodada | null>(() => {
    // Prefere empates
    const empate = resultados.find((r) => r.foiEmpate) ?? null;
    if (empate) return empate;
    // Senão, menor totalVotosVencedor
    let min = Infinity;
    let rodada: ResultadoRodada | null = null;
    for (const r of resultados) {
      if (r.totalVotosVencedor < min) {
        min = r.totalVotosVencedor;
        rodada = r;
      }
    }
    return rodada;
  }, [resultados]);

  const nomeDe = (id: PlayerId) =>
    jogadores.find((j) => j.id === id)?.nome ?? '...';

  return (
    <SafeAreaView style={estilos.tela} edges={['top', 'bottom']}>
      <IndicadorConexao />
      <BarraAcoesJogo />

      <ScrollView
        style={estilos.scroll}
        contentContainerStyle={estilos.scrollConteudo}
        showsVerticalScrollIndicator={false}
      >
        {/* Abertura contemplativa — não "placar", não "resultado" */}
        <View style={estilos.abertura}>
          <Text style={estilos.aberturaTexto}>foi uma noite assim.</Text>
        </View>

        {/* Destaque: o mais nomeado */}
        {maisNomeado && (
          <View style={estilos.destaqueBloco}>
            <Text style={estilos.destaqueLegenda}>o mais nomeado da noite</Text>
            <Text style={estilos.destaqueNome}>{nomeDe(maisNomeado)}</Text>
          </View>
        )}

        <View style={estilos.hairline} />

        {/* Retratos individuais — quem ganhou o quê */}
        {jogadoresComTraits.length > 0 && (
          <View style={estilos.retratos}>
            {jogadoresComTraits.map((id) => {
              const traits = traitsPorJogador.get(id) ?? [];
              const jogador = jogadores.find((j) => j.id === id);
              if (!jogador) return null;
              const [corA, corB] = gradienteAvatarDe(id);
              const inicial = (jogador.nome.trim().charAt(0) || '?').toUpperCase();
              return (
                <View key={id} style={estilos.retratoItem}>
                  <LinearGradient
                    colors={[corA, corB]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={estilos.retratoAvatar}
                  >
                    <Text style={estilos.retratoAvatarTexto}>{inicial}</Text>
                  </LinearGradient>
                  <View style={estilos.retratoConteudo}>
                    <Text style={estilos.retratoNome}>{jogador.nome}</Text>
                    {traits.map((t, i) => (
                      <Text key={i} style={estilos.retratoTrait} numberOfLines={2}>
                        {t}
                      </Text>
                    ))}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Destaques da sessão */}
        {(rodadaMaisUnanime ?? rodadaMaisDividida) && (
          <View style={estilos.destaques}>
            {rodadaMaisUnanime && (
              <Text style={estilos.destaqueStat}>
                o grupo foi mais unânime em{' '}
                <Text style={estilos.destaqueStatPrompt}>
                  "{rodadaMaisUnanime.prompt}"
                </Text>
                .
              </Text>
            )}
            {rodadaMaisDividida && (
              <Text style={[estilos.destaqueStat, estilos.destaqueStatSegundo]}>
                {rodadaMaisDividida.foiEmpate
                  ? `o grupo não conseguiu decidir em `
                  : `o mais difícil foi `}
                <Text style={estilos.destaqueStatPrompt}>
                  "{rodadaMaisDividida.prompt}"
                </Text>
                .
              </Text>
            )}
          </View>
        )}
      </ScrollView>

      {/* Ações pós-jogo */}
      {(onJogarDeNovo ?? onVoltar) && (
        <View style={estilos.rodape}>
          {onJogarDeNovo && (
            <Pressable
              onPress={onJogarDeNovo}
              style={({ pressed }) => [
                estilos.botaoPrimario,
                pressed && estilos.botaoPressionado,
              ]}
            >
              <Text style={estilos.botaoPrimarioTexto}>jogar de novo</Text>
            </Pressable>
          )}
          {onVoltar && (
            <Pressable onPress={onVoltar} style={estilos.botaoSecundario}>
              <Text style={estilos.botaoSecundarioTexto}>mudar de jogo</Text>
            </Pressable>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

// ---------- Helpers ----------

function gradienteAvatarDe(id: string): [string, string] {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  }
  const idx = Math.abs(hash) % PALETA_AVATARES.length;
  const idx2 =
    (idx + Math.floor(PALETA_AVATARES.length / 2)) % PALETA_AVATARES.length;
  return [PALETA_AVATARES[idx]!, PALETA_AVATARES[idx2]!];
}

// ---------- Estilos ----------

const TAMANHO_RETRATO_AVATAR = 44;

const estilos = StyleSheet.create({
  tela: {
    backgroundColor: cores.fundo,
    flex: 1,
  },
  scroll: {
    flex: 1,
    minHeight: 0,
  },
  scrollConteudo: {
    paddingBottom: espacamento.xxl,
    paddingHorizontal: espacamento.lg,
    paddingTop: espacamento.xl,
  },

  // Abertura — contemplativa, não celebratória
  abertura: {
    marginBottom: espacamento.xl,
  },
  aberturaTexto: {
    color: cores.textoMudo,
    fontFamily: familias.serifItalico,
    fontSize: tipografia.tamanhoSubtituloGrande,
    lineHeight: 32,
    textAlign: 'center',
  },

  // Destaque: mais nomeado
  destaqueBloco: {
    alignItems: 'center',
    marginBottom: espacamento.xl,
  },
  destaqueLegenda: {
    color: cores.textoMudo,
    fontSize: tipografia.tamanhoMicro,
    fontWeight: tipografia.pesoMedio,
    letterSpacing: tipografia.spacingLegenda,
    marginBottom: espacamento.sm,
    textTransform: 'uppercase',
  },
  // Nome do mais nomeado — serifDisplay, âmbar, impacto
  destaqueNome: {
    color: cores.acento,
    fontFamily: familias.serifDisplay,
    fontSize: tipografia.tamanhoTituloGrande,
    letterSpacing: 0,
    lineHeight: 44,
    textAlign: 'center',
  },

  hairline: {
    backgroundColor: cores.borda,
    height: 1,
    marginBottom: espacamento.xl,
  },

  // Retratos individuais
  retratos: {
    gap: espacamento.lg,
    marginBottom: espacamento.xl,
  },
  retratoItem: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: espacamento.md,
  },
  retratoAvatar: {
    alignItems: 'center',
    borderRadius: TAMANHO_RETRATO_AVATAR / 2,
    height: TAMANHO_RETRATO_AVATAR,
    justifyContent: 'center',
    width: TAMANHO_RETRATO_AVATAR,
  },
  retratoAvatarTexto: {
    color: cores.textoSobrePrimaria,
    fontSize: 17,
    fontWeight: tipografia.pesoExtraBold,
  },
  retratoConteudo: {
    flex: 1,
    gap: 4,
    paddingTop: 2,
  },
  retratoNome: {
    color: cores.texto,
    fontSize: tipografia.tamanhoCorpoMenor,
    fontWeight: tipografia.pesoBold,
  },
  // Trait — italico, muted — como memória, não conquista
  retratoTrait: {
    color: cores.textoMudo,
    fontFamily: familias.serifItalico,
    fontSize: tipografia.tamanhoLegenda,
    lineHeight: 20,
  },

  // Destaques de sessão
  destaques: {
    borderColor: cores.borda,
    borderRadius: raio.md,
    borderWidth: 1,
    gap: espacamento.md,
    marginBottom: espacamento.lg,
    padding: espacamento.lg,
  },
  destaqueStat: {
    color: cores.textoMudo,
    fontFamily: familias.serifItalico,
    fontSize: tipografia.tamanhoLegenda,
    lineHeight: 20,
  },
  destaqueStatSegundo: {
    marginTop: 0,
  },
  destaqueStatPrompt: {
    color: cores.textoSecundario,
    fontFamily: familias.serifItalico,
  },

  // Ações
  rodape: {
    borderTopColor: cores.borda,
    borderTopWidth: 1,
    gap: espacamento.sm,
    paddingBottom: espacamento.md,
    paddingHorizontal: espacamento.lg,
    paddingTop: espacamento.md,
  },
  botaoPrimario: {
    alignItems: 'center',
    backgroundColor: cores.acento,
    borderRadius: raio.pill,
    elevation: 6,
    justifyContent: 'center',
    minHeight: 56,
    shadowColor: cores.acento,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
  },
  botaoPressionado: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  botaoPrimarioTexto: {
    color: cores.textoSobrePrimaria,
    fontFamily: familias.serifDisplay,
    fontSize: tipografia.tamanhoCorpo,
  },
  botaoSecundario: {
    alignItems: 'center',
    paddingVertical: espacamento.sm,
  },
  botaoSecundarioTexto: {
    color: cores.textoMudo,
    fontFamily: familias.serifItalico,
    fontSize: tipografia.tamanhoCorpoMenor,
  },
});
