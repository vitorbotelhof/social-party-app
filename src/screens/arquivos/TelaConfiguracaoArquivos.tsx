import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
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

import {
  BotaoPrimario,
  BotaoVoltar,
  CodigoSala,
  JogadorAnimado,
} from '@/components';
import type { Player } from '@/engine/types';
import { CASO_DOSSIE_SUMIDO } from '@/games/arquivos/casos';
import type { RootStackParamList } from '@/navigation/types';
import { iniciarPartidaArquivosRealtime } from '@/services/arquivosRealtime';
import { observarJogadores } from '@/services/roomService';
import { cores, espacamento, familias, raio, sombra, tipografia } from '@/theme/colors';

/** Identidade cromática de Arquivos — azul investigação, igual à TelaArquivos. */
const COR_ARQUIVOS = cores.conversa;

type Props = NativeStackScreenProps<RootStackParamList, 'ConfiguracaoJogo'>;

const MIN_JOGADORES = CASO_DOSSIE_SUMIDO.config.targetPlayers;

export function TelaConfiguracaoArquivos({ navigation, route }: Props) {
  const { roomCode, jogoId, jogadorId } = route.params;
  const [jogadores, setJogadores] = useState<Player[]>([]);
  const [iniciando, setIniciando] = useState(false);
  const totalAnteriorRef = useRef(0);

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

  async function aoCompartilharCodigo() {
    await Share.share({
      message: `entre em Arquivos — código: ${roomCode}`,
    });
  }

  async function aoIniciar() {
    if (!podeIniciar || iniciando) return;
    setIniciando(true);
    try {
      await iniciarPartidaArquivosRealtime(roomCode, jogadorId);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.replace('Game', { roomCode, jogoId, jogadorId });
    } catch (erro) {
      setIniciando(false);
      const mensagem =
        erro instanceof Error
          ? erro.message
          : 'Algo deu errado, tenta de novo.';
      Alert.alert('não rolou começar', mensagem);
    }
  }

  const podeIniciar = jogadores.length === MIN_JOGADORES;
  const faltam = Math.max(0, MIN_JOGADORES - jogadores.length);

  return (
    <SafeAreaView style={estilos.tela} edges={['top', 'bottom']}>
      <BotaoVoltar onPress={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={estilos.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={estilos.blocoCodigo}>
          <Text style={estilos.legendaCodigo}>código da sala</Text>
          <CodigoSala codigo={roomCode} />
          <Pressable
            onPress={aoCompartilharCodigo}
            accessibilityRole="button"
            accessibilityLabel="compartilhar código da sala"
            style={({ pressed }) => [
              estilos.botaoCompartilhar,
              pressed && estilos.botaoCompartilharPressionado,
            ]}
          >
            <Text style={estilos.textoBotaoCompartilhar}>compartilhar</Text>
          </Pressable>
        </View>

        <View style={estilos.cardCaso}>
          <Text style={estilos.rotulo}>caso da noite</Text>
          <Text style={estilos.tituloCaso}>
            {CASO_DOSSIE_SUMIDO.intro.titulo}
          </Text>
          <Text style={estilos.descricaoCaso}>
            {CASO_DOSSIE_SUMIDO.intro.incidente}
          </Text>
        </View>

        <View style={estilos.blocoJogadores}>
          <View style={estilos.cabecalhoJogadores}>
            <Text style={estilos.tituloJogadores}>jogadores</Text>
            <Text style={estilos.contadorJogadores}>
              {jogadores.length}/{MIN_JOGADORES}
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
        </View>

        <View style={estilos.aviso}>
          <Text style={estilos.avisoTexto}>
            {podeIniciar
              ? 'grupo completo. todo mundo vai receber arquivos privados.'
              : `faltam ${faltam} para abrir o caso.`}
          </Text>
        </View>
      </ScrollView>

      <View style={estilos.rodape}>
        <BotaoPrimario
          titulo="abrir o caso"
          carregando={iniciando}
          disabled={!podeIniciar || iniciando}
          onPress={aoIniciar}
        />
      </View>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  aviso: {
    backgroundColor: cores.superficie,
    borderColor: cores.borda,
    borderRadius: raio.md,
    borderWidth: 1,
    padding: espacamento.md,
  },
  avisoTexto: {
    color: cores.textoSecundario,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpoMenor,
    lineHeight: 20,
    textAlign: 'center',
  },
  blocoCodigo: {
    alignItems: 'center',
    gap: espacamento.md,
  },
  blocoJogadores: {
    gap: espacamento.sm,
  },
  botaoCompartilhar: {
    borderColor: cores.borda,
    borderRadius: raio.pill,
    borderWidth: 1,
    paddingHorizontal: espacamento.md,
    paddingVertical: espacamento.sm,
  },
  botaoCompartilharPressionado: {
    opacity: 0.75,
  },
  cabecalhoJogadores: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: espacamento.sm,
  },
  cardCaso: {
    backgroundColor: cores.superficie,
    borderColor: COR_ARQUIVOS,
    borderRadius: raio.lg,
    borderWidth: 1,
    gap: espacamento.sm,
    padding: espacamento.lg,
    ...sombra.sutil,
  },
  contadorJogadores: {
    color: cores.textoSecundario,
    fontSize: tipografia.tamanhoCorpoMenor,
    fontWeight: tipografia.pesoSemibold,
  },
  descricaoCaso: {
    color: cores.textoSecundario,
    fontSize: tipografia.tamanhoCorpo,
    lineHeight: 22,
  },
  legendaCodigo: {
    color: cores.textoMudo,
    fontSize: tipografia.tamanhoMicro,
    fontWeight: tipografia.pesoMedio,
    letterSpacing: tipografia.spacingLeve,
  },
  rodape: {
    padding: espacamento.lg,
  },
  rotulo: {
    color: cores.textoMudo,
    fontSize: tipografia.tamanhoMicro,
    fontWeight: tipografia.pesoMedio,
    letterSpacing: tipografia.spacingLeve,
  },
  scroll: {
    gap: espacamento.xl,
    padding: espacamento.lg,
    paddingTop: espacamento.xxl,
  },
  separadorJogador: {
    height: espacamento.sm,
  },
  tela: {
    backgroundColor: cores.fundo,
    flex: 1,
  },
  textoBotaoCompartilhar: {
    color: cores.texto,
    fontSize: tipografia.tamanhoCorpoMenor,
    fontWeight: tipografia.pesoSemibold,
  },
  tituloCaso: {
    color: cores.texto,
    fontSize: tipografia.tamanhoTitulo,
    fontWeight: tipografia.pesoExtraBold,
    lineHeight: 34,
  },
  tituloJogadores: {
    color: cores.texto,
    fontSize: tipografia.tamanhoSubtitulo,
    fontWeight: tipografia.pesoBold,
  },
});
