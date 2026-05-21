/**
 * TelaConfiguracaoInquisicao — Setup da partida.
 *
 * Tela única que combina:
 *   - Código da sala para compartilhar
 *   - Lista ao vivo de jogadores entrando
 *   - Banner de grupo recente ("vocês de novo?")
 *   - Seleção de intensidade (leve / padrão / paranoia)
 *   - Botão de começar
 *
 * Princípio: zero burocracia. Automático no que pode ser automático.
 * Três configurações emocionais, não sistêmicas.
 */

import * as Haptics from 'expo-haptics';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BotaoPrimario, CodigoSala, JogadorAnimado } from '@/components';
import type { Player } from '@/engine/types';
import { MIN_JOGADORES_INQUISICAO } from '@/games/inquisicao/roleDistribution';
import type { IntensidadeInquisicao } from '@/games/inquisicao/types';
import type { RootStackParamList } from '@/navigation/types';
import { carregarGrupoRecente, salvarGrupoRecente } from '@/services/grupoRecente';
import { iniciarJogo, observarJogadores } from '@/services/roomService';
import { RoomServiceError } from '@/types/room';
import { cores, espacamento, familias, raio, tipografia } from '@/theme/colors';

// ─── Intensidades ─────────────────────────────────────────────────────────────

interface OpcaoIntensidade {
  valor: IntensidadeInquisicao;
  titulo: string;
  descricao: string;
}

const INTENSIDADES: OpcaoIntensidade[] = [
  {
    valor: 'leve',
    titulo: 'leve',
    descricao: 'relaxado. a tensão que não machuca ninguém.',
  },
  {
    valor: 'padrao',
    titulo: 'padrão',
    descricao: 'o pacing certo. suspeita real, sem exagero.',
  },
  {
    valor: 'paranoia',
    titulo: 'paranoia',
    descricao: 'ninguém sai igual. joga quem aguenta.',
  },
];

// ─── Componente ───────────────────────────────────────────────────────────────

type Props = NativeStackScreenProps<RootStackParamList, 'ConfiguracaoJogo'>;

export function TelaConfiguracaoInquisicao({ navigation, route }: Props) {
  const { roomCode, jogoId, jogadorId } = route.params;

  const [jogadores, setJogadores] = useState<Player[]>([]);
  const [intensidade, setIntensidade] = useState<IntensidadeInquisicao>('padrao');
  const [grupoRecente, setGrupoRecente] = useState<string[] | null>(null);
  const [iniciando, setIniciando] = useState(false);

  const totalAnteriorRef = useRef(0);

  // ── Carregar grupo recente ────────────────────────────────────────────────────
  useEffect(() => {
    carregarGrupoRecente().then(setGrupoRecente);
  }, []);

  // ── Observar jogadores entrando ──────────────────────────────────────────────
  useEffect(() => {
    return observarJogadores(roomCode, (lista) => {
      if (
        lista.length > totalAnteriorRef.current &&
        totalAnteriorRef.current > 0
      ) {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      totalAnteriorRef.current = lista.length;
      setJogadores(lista);
    });
  }, [roomCode]);

  // ── Compartilhar código ──────────────────────────────────────────────────────
  async function aoCompartilharCodigo() {
    await Share.share({
      message: `entre no inquisição — código: ${roomCode}`,
    });
  }

  // ── Começar partida ──────────────────────────────────────────────────────────
  async function aoIniciar() {
    if (!podeIniciar || iniciando) return;
    setIniciando(true);

    try {
      // Salvar grupo antes de iniciar — memória do próximo setup
      await salvarGrupoRecente(jogadores.map((j) => j.nome));

      await iniciarJogo(roomCode, jogadorId, { intensidade });

      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      navigation.replace('Game', { roomCode, jogoId, jogadorId });
    } catch (erro) {
      setIniciando(false);
      const mensagem =
        erro instanceof RoomServiceError
          ? erro.message
          : 'Algo deu errado, tenta de novo.';
      Alert.alert('não rolou começar', mensagem);
    }
  }

  const podeIniciar = jogadores.length >= MIN_JOGADORES_INQUISICAO;

  // Grupo recente: mostrar se há histórico e a partida atual tem menos jogadores
  // (indica que o grupo ainda não chegou todo — momento de reconhecimento)
  const mostrarGrupoRecente =
    grupoRecente !== null &&
    grupoRecente.length >= 2 &&
    jogadores.length < grupoRecente.length;

  const nomesGrupoRecente = grupoRecente
    ? grupoRecente.slice(0, 5).join(', ')
    : '';

  return (
    <SafeAreaView style={estilos.tela} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={estilos.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* ── Código da sala ──────────────────────────────────────────────── */}
        <View style={estilos.blocoCodigo}>
          <Text style={estilos.legendaCodigo}>código da sala</Text>
          <CodigoSala codigo={roomCode} />
          <Pressable
            onPress={aoCompartilharCodigo}
            style={({ pressed }) => [
              estilos.botaoCompartilhar,
              pressed && estilos.botaoCompartilharPressionado,
            ]}
            hitSlop={8}
          >
            <Text style={estilos.textoBotaoCompartilhar}>compartilhar →</Text>
          </Pressable>
        </View>

        {/* ── Banner: grupo recente ─────────────────────────────────────── */}
        {mostrarGrupoRecente && (
          <View style={estilos.bannerRecente}>
            <Text style={estilos.bannerTitulo}>vocês de novo?</Text>
            <Text style={estilos.bannerNomes} numberOfLines={1}>
              {nomesGrupoRecente}
            </Text>
          </View>
        )}

        {/* ── Jogadores ────────────────────────────────────────────────────── */}
        <View style={estilos.blocoJogadores}>
          <View style={estilos.cabecalhoJogadores}>
            <Text style={estilos.tituloJogadores}>jogadores</Text>
            <Text style={estilos.contadorJogadores}>
              {jogadores.length}
              {!podeIniciar && (
                <Text style={estilos.minimoLabel}>
                  {' '}/ mín. {MIN_JOGADORES_INQUISICAO}
                </Text>
              )}
            </Text>
          </View>

          {jogadores.map((j, index) => (
            <View key={j.id}>
              <JogadorAnimado
                jogador={j}
                estado={j.id === jogadorId ? 'voce' : 'normal'}
              />
              {index < jogadores.length - 1 && (
                <View style={estilos.separadorJogador} />
              )}
            </View>
          ))}

          {jogadores.length === 0 && (
            <Text style={estilos.textoVazio}>aguardando jogadores...</Text>
          )}
        </View>

        {/* ── Intensidade ──────────────────────────────────────────────────── */}
        <View style={estilos.blocoIntensidade}>
          <Text style={estilos.tituloIntensidade}>como vai ser?</Text>

          {INTENSIDADES.map((opcao) => {
            const ativa = intensidade === opcao.valor;
            return (
              <Pressable
                key={opcao.valor}
                onPress={() => {
                  setIntensidade(opcao.valor);
                  void Haptics.selectionAsync();
                }}
                style={({ pressed }) => [
                  estilos.cardIntensidade,
                  ativa && estilos.cardIntensidadeAtivo,
                  pressed && !ativa && estilos.cardIntensidadePressionado,
                ]}
              >
                <View style={estilos.cardIntensidadeConteudo}>
                  <Text
                    style={[
                      estilos.cardIntensidadeTitulo,
                      ativa && estilos.cardIntensidadeTituloAtivo,
                    ]}
                  >
                    {opcao.titulo}
                  </Text>
                  <Text
                    style={[
                      estilos.cardIntensidadeDescricao,
                      ativa && estilos.cardIntensidadeDescricaoAtivo,
                    ]}
                  >
                    {opcao.descricao}
                  </Text>
                </View>

                {/* Indicador de seleção */}
                <View
                  style={[
                    estilos.indicador,
                    ativa && estilos.indicadorAtivo,
                  ]}
                />
              </Pressable>
            );
          })}
        </View>

        {/* Espaço extra para o rodapé não cobrir o conteúdo */}
        <View style={estilos.espacoRodape} />
      </ScrollView>

      {/* ── Rodapé fixo ────────────────────────────────────────────────────── */}
      <View style={estilos.rodape}>
        {!podeIniciar && (
          <Text style={estilos.textoAguardando}>
            falta {MIN_JOGADORES_INQUISICAO - jogadores.length}{' '}
            {MIN_JOGADORES_INQUISICAO - jogadores.length === 1
              ? 'pessoa entrar'
              : 'pessoas entrarem'}
          </Text>
        )}
        <BotaoPrimario
          titulo="começar"
          carregando={iniciando}
          disabled={!podeIniciar || iniciando}
          onPress={aoIniciar}
        />
      </View>
    </SafeAreaView>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const estilos = StyleSheet.create({
  tela: {
    flex: 1,
    backgroundColor: cores.fundo,
  },
  scroll: {
    paddingHorizontal: espacamento.lg,
    paddingTop: espacamento.lg,
  },

  // ── Código ───────────────────────────────────────────────────────────────────
  blocoCodigo: {
    alignItems: 'center',
    gap: espacamento.sm,
    marginBottom: espacamento.xl,
  },
  legendaCodigo: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoMicro,
    fontWeight: tipografia.pesoMedio,
    letterSpacing: tipografia.spacingLabel,
    textTransform: 'uppercase',
  },
  botaoCompartilhar: {
    paddingVertical: espacamento.xs,
    paddingHorizontal: espacamento.sm,
  },
  botaoCompartilharPressionado: {
    opacity: 0.55,
  },
  textoBotaoCompartilhar: {
    color: cores.primaria,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpoMenor,
    fontWeight: tipografia.pesoSemibold,
  },

  // ── Banner recente ────────────────────────────────────────────────────────────
  bannerRecente: {
    backgroundColor: cores.superficie,
    borderColor: cores.borda,
    borderRadius: raio.md,
    borderWidth: 1,
    marginBottom: espacamento.xl,
    paddingHorizontal: espacamento.md,
    paddingVertical: espacamento.md,
  },
  bannerTitulo: {
    color: cores.texto,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpo,
    fontWeight: tipografia.pesoBold,
    marginBottom: 2,
  },
  bannerNomes: {
    color: cores.textoSecundario,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpoMenor,
  },

  // ── Jogadores ─────────────────────────────────────────────────────────────────
  blocoJogadores: {
    marginBottom: espacamento.xl,
  },
  cabecalhoJogadores: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: espacamento.md,
  },
  tituloJogadores: {
    color: cores.texto,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoSubtitulo,
    fontWeight: tipografia.pesoBold,
  },
  contadorJogadores: {
    color: cores.textoSecundario,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpoMenor,
    fontWeight: tipografia.pesoMedio,
  },
  minimoLabel: {
    color: cores.textoMudo,
    fontWeight: tipografia.pesoRegular,
  },
  separadorJogador: {
    height: espacamento.sm,
  },
  textoVazio: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpoMenor,
    paddingVertical: espacamento.md,
    textAlign: 'center',
  },

  // ── Intensidade ───────────────────────────────────────────────────────────────
  blocoIntensidade: {
    gap: espacamento.sm,
    marginBottom: espacamento.md,
  },
  tituloIntensidade: {
    color: cores.textoSecundario,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCaption,
    fontWeight: tipografia.pesoSemibold,
    letterSpacing: tipografia.spacingLeve,
    marginBottom: espacamento.xs,
    textTransform: 'uppercase',
  },
  cardIntensidade: {
    alignItems: 'center',
    backgroundColor: cores.superficie,
    borderColor: cores.borda,
    borderRadius: raio.lg,
    borderWidth: 1.5,
    flexDirection: 'row',
    minHeight: 72,
    paddingHorizontal: espacamento.md,
    paddingVertical: espacamento.md,
  },
  cardIntensidadeAtivo: {
    backgroundColor: cores.texto,
    borderColor: cores.texto,
  },
  cardIntensidadePressionado: {
    opacity: 0.75,
  },
  cardIntensidadeConteudo: {
    flex: 1,
    gap: 3,
  },
  cardIntensidadeTitulo: {
    color: cores.texto,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpoMaior,
    fontWeight: tipografia.pesoBold,
  },
  cardIntensidadeTituloAtivo: {
    color: cores.fundo,
  },
  cardIntensidadeDescricao: {
    color: cores.textoSecundario,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpoMenor,
    lineHeight: 18,
  },
  cardIntensidadeDescricaoAtivo: {
    color: '#C8C4BD', // off-white muted on dark background
  },
  indicador: {
    borderColor: cores.borda,
    borderRadius: 8,
    borderWidth: 1.5,
    height: 16,
    width: 16,
  },
  indicadorAtivo: {
    backgroundColor: cores.primaria,
    borderColor: cores.primaria,
  },

  // ── Rodapé ────────────────────────────────────────────────────────────────────
  espacoRodape: {
    height: espacamento.xxl,
  },
  rodape: {
    borderTopColor: cores.borda,
    borderTopWidth: 1,
    gap: espacamento.sm,
    paddingHorizontal: espacamento.lg,
    paddingVertical: espacamento.lg,
  },
  textoAguardando: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpoMenor,
    textAlign: 'center',
  },
});
