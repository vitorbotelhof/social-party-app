import * as Haptics from 'expo-haptics';
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
import type { GameId, GameState, Player, PlayerId, RoomCode } from '@/engine/types';
import type {
  MostLikelyPrivateState,
  MostLikelyPublicState,
} from '@/games/most-likely-to/types';
import { criarAcao, despacharAcao } from '@/services/gameActions';
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
  roomCode: RoomCode;
  jogoId: GameId;
  jogadorId: PlayerId;
  jogadores: Player[];
}

export function TelaRevealMostLikely({
  estado,
  roomCode,
  jogoId,
  jogadorId,
  jogadores,
}: Props) {
  const { estadoPublico } = estado;
  const { votos, vencedorRodadaAtual, foiEmpate, promptAtual } = estadoPublico;

  const ehAnfitriao = jogadorId === estadoPublico.anfitriaoId;
  const total = estadoPublico.ordemJogadores.length;
  const ehUltimaRodada = estado.rodada >= estadoPublico.totalRodadas;

  // Contagem de votos por jogador
  const votosPorJogador = useMemo(() => {
    const m = new Map<PlayerId, number>();
    for (const alvo of Object.values(votos)) {
      m.set(alvo, (m.get(alvo) ?? 0) + 1);
    }
    return m;
  }, [votos]);

  const maxVotos = useMemo(
    () => Math.max(...votosPorJogador.values(), 0),
    [votosPorJogador],
  );

  const foiUnanime = !foiEmpate && vencedorRodadaAtual !== null && maxVotos === total;

  const nomeDe = (id: PlayerId) =>
    jogadores.find((j) => j.id === id)?.nome ?? '...';

  const nomeVencedor = vencedorRodadaAtual ? nomeDe(vencedorRodadaAtual) : null;

  async function aoAvancar() {
    if (!ehAnfitriao) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await despacharAcao(
      roomCode,
      jogoId,
      criarAcao('avancar_rodada', jogadorId, {}),
    );
  }

  return (
    <SafeAreaView style={estilos.tela} edges={['top', 'bottom']}>
      <IndicadorConexao />
      <BarraAcoesJogo />

      <ScrollView
        style={estilos.scroll}
        contentContainerStyle={estilos.scrollConteudo}
        showsVerticalScrollIndicator={false}
      >
        {/* Prompt — pequeno, muted, lembrado */}
        <View style={estilos.promptContainer}>
          <Text style={estilos.promptTexto}>{promptAtual}</Text>
        </View>

        <View style={estilos.hairline} />

        {/* Cards com votos — mesma grade portrait do voting */}
        <View style={estilos.grade}>
          {estadoPublico.ordemJogadores.map((id) => {
            const jogador = jogadores.find((j) => j.id === id);
            if (!jogador) return null;

            const qtdVotos = votosPorJogador.get(id) ?? 0;
            const ehVencedor = !foiEmpate && id === vencedorRodadaAtual;
            const ehEmpatado = foiEmpate && qtdVotos === maxVotos;
            const destacado = ehVencedor || ehEmpatado;
            // Não-destacados ficam muito apagados — o foco é no vencedor
            const opaco = !destacado;

            return (
              <CardRevealMLT
                key={id}
                jogador={jogador}
                qtdVotos={qtdVotos}
                destacado={destacado}
                opaco={opaco}
                foiEmpate={foiEmpate && ehEmpatado}
              />
            );
          })}
        </View>

        {/* Cristalização — a frase que fica */}
        <View style={estilos.cristalizacao}>
          {foiEmpate ? (
            <Text style={estilos.cristalizacaoTexto}>o grupo se dividiu.</Text>
          ) : foiUnanime && nomeVencedor ? (
            <Text style={estilos.cristalizacaoTexto}>
              todo o grupo escolheu{' '}
              <Text style={estilos.cristalizacaoNome}>{nomeVencedor}</Text>.
            </Text>
          ) : nomeVencedor ? (
            <Text style={estilos.cristalizacaoTexto}>
              <Text style={estilos.cristalizacaoNome}>{nomeVencedor}</Text> é
              quem mais provavelmente{' '}
              <Text style={estilos.cristalizacaoPromptInline}>
                {promptAtual}
              </Text>
            </Text>
          ) : null}
        </View>

        {/* Rodada */}
        <Text style={estilos.rodadaLegenda}>
          rodada {estado.rodada} de {estadoPublico.totalRodadas}
        </Text>
      </ScrollView>

      {/* Host-only — só ele avança */}
      {ehAnfitriao ? (
        <View style={estilos.rodape}>
          <Pressable
            onPress={aoAvancar}
            style={({ pressed }) => [
              estilos.botaoProxima,
              pressed && estilos.botaoProximaPressionado,
            ]}
          >
            <Text style={estilos.botaoProximaTexto}>
              {ehUltimaRodada ? 'ver retrato social →' : 'próxima →'}
            </Text>
          </Pressable>
        </View>
      ) : (
        <View style={estilos.rodape}>
          <Text style={estilos.esperandoAnfitriao}>
            aguardando o anfitrião continuar.
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

// ---------- Card do reveal ----------

interface CardRevealMLTProps {
  jogador: Player;
  qtdVotos: number;
  destacado: boolean;
  opaco: boolean;
  foiEmpate: boolean;
}

function CardRevealMLT({
  jogador,
  qtdVotos,
  destacado,
  opaco,
  foiEmpate,
}: CardRevealMLTProps) {
  const [corA, corB] = gradienteAvatarDe(jogador.id);
  const inicial = (jogador.nome.trim().charAt(0) || '?').toUpperCase();

  return (
    <View
      style={[
        estilos.card,
        destacado && (foiEmpate ? estilos.cardEmpate : estilos.cardVencedor),
        opaco && estilos.cardOpaco,
      ]}
    >
      <LinearGradient
        colors={[corA, corB]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={estilos.avatar}
      >
        <Text style={estilos.avatarTexto}>{inicial}</Text>
      </LinearGradient>

      {/* Badge de votos */}
      <View style={[estilos.badgeVotos, qtdVotos > 0 && estilos.badgeVotosAtivo]}>
        <Text style={estilos.badgeVotosTexto}>
          {qtdVotos} {qtdVotos === 1 ? 'voto' : 'votos'}
        </Text>
      </View>

      <Text
        style={[
          estilos.cardNome,
          destacado && (foiEmpate ? estilos.cardNomeEmpate : estilos.cardNomeVencedor),
        ]}
        numberOfLines={1}
      >
        {jogador.nome}
      </Text>
    </View>
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

const TAMANHO_AVATAR = 64;

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
    paddingBottom: espacamento.xl,
    paddingHorizontal: espacamento.lg,
    paddingTop: espacamento.lg,
  },

  // Prompt — contexto pequeno no topo
  promptContainer: {
    marginBottom: espacamento.md,
  },
  promptTexto: {
    color: cores.textoMudo,
    fontFamily: familias.serifItalico,
    fontSize: tipografia.tamanhoCorpoMenor,
    lineHeight: 22,
    textAlign: 'center',
  },

  hairline: {
    backgroundColor: cores.borda,
    height: 1,
    marginBottom: espacamento.lg,
  },

  // Grade de cards
  grade: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: espacamento.sm,
    marginBottom: espacamento.xl,
  },

  // Cards — portrait, mesma estrutura do voting mas com badge de votos
  card: {
    alignItems: 'center',
    backgroundColor: cores.superficie,
    borderColor: cores.borda,
    borderRadius: raio.xl,
    borderWidth: 1.5,
    gap: espacamento.xs,
    paddingHorizontal: espacamento.md,
    paddingVertical: espacamento.lg,
    width: '48.5%',
  },
  cardVencedor: {
    backgroundColor: cores.acentoEscuro,
    borderColor: cores.acento,
    borderWidth: 2,
  },
  cardEmpate: {
    backgroundColor: '#2A1F00',
    borderColor: cores.alerta,
    borderWidth: 2,
  },
  cardOpaco: {
    opacity: 0.32,
  },

  avatar: {
    alignItems: 'center',
    borderRadius: TAMANHO_AVATAR / 2,
    height: TAMANHO_AVATAR,
    justifyContent: 'center',
    width: TAMANHO_AVATAR,
  },
  avatarTexto: {
    color: cores.textoSobrePrimaria,
    fontSize: 24,
    fontWeight: tipografia.pesoExtraBold,
  },

  // Badge de votos
  badgeVotos: {
    backgroundColor: cores.borda,
    borderRadius: raio.pill,
    paddingHorizontal: espacamento.sm,
    paddingVertical: 3,
  },
  badgeVotosAtivo: {
    backgroundColor: cores.superficieElevada,
  },
  badgeVotosTexto: {
    color: cores.textoSecundario,
    fontSize: tipografia.tamanhoMicro,
    fontWeight: tipografia.pesoMedio,
    letterSpacing: 0.2,
  },

  cardNome: {
    color: cores.textoSecundario,
    fontSize: tipografia.tamanhoCorpoMenor,
    fontWeight: tipografia.pesoMedio,
    textAlign: 'center',
  },
  // Vencedor: serifDisplay + âmbar — identidade revelada
  cardNomeVencedor: {
    color: cores.acento,
    fontFamily: familias.serifDisplay,
    fontSize: tipografia.tamanhoCorpo,
  },
  // Empate: alerta (amarelo) — tensão sem vencedor
  cardNomeEmpate: {
    color: cores.alerta,
    fontFamily: familias.serifDisplay,
    fontSize: tipografia.tamanhoCorpo,
  },

  // Cristalização — a frase que define o momento
  cristalizacao: {
    marginBottom: espacamento.lg,
    paddingHorizontal: espacamento.sm,
  },
  cristalizacaoTexto: {
    color: cores.textoSecundario,
    fontFamily: familias.serifItalico,
    fontSize: tipografia.tamanhoCorpoMenor,
    lineHeight: 24,
    textAlign: 'center',
  },
  cristalizacaoNome: {
    color: cores.acento,
    fontFamily: familias.serifDisplay,
    fontSize: tipografia.tamanhoCorpoMaior,
  },
  cristalizacaoPromptInline: {
    color: cores.textoMudo,
    fontFamily: familias.serifItalico,
  },

  rodadaLegenda: {
    color: cores.textoMudo,
    fontSize: tipografia.tamanhoMicro,
    fontWeight: tipografia.pesoMedio,
    letterSpacing: tipografia.spacingLegenda,
    textAlign: 'center',
    textTransform: 'uppercase',
  },

  // Rodapé
  rodape: {
    alignItems: 'center',
    borderTopColor: cores.borda,
    borderTopWidth: 1,
    paddingBottom: espacamento.md,
    paddingHorizontal: espacamento.lg,
    paddingTop: espacamento.md,
  },

  // Host — botão textual sutil, não CTA agressivo
  botaoProxima: {
    paddingHorizontal: espacamento.lg,
    paddingVertical: espacamento.md,
  },
  botaoProximaPressionado: {
    opacity: 0.6,
  },
  botaoProximaTexto: {
    color: cores.textoMudo,
    fontFamily: familias.serifItalico,
    fontSize: tipografia.tamanhoCorpo,
    letterSpacing: 0.2,
  },

  esperandoAnfitriao: {
    color: cores.textoMudo,
    fontFamily: familias.serifItalico,
    fontSize: tipografia.tamanhoLegenda,
    textAlign: 'center',
  },
});
