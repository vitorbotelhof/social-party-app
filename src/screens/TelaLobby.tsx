import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  BotaoPrimario,
  BotaoSecundario,
  CodigoSala,
  JogadorAnimado,
} from '@/components';
import type { Player, PlayerId } from '@/engine/types';
import type { RootStackParamList } from '@/navigation/types';
import { tocar } from '@/services/audio';
import { limparPartida } from '@/services/partidaAtiva';
import { observarSala, sairDaSala } from '@/services/roomService';
import { cores, espacamento, familias, tipografia } from '@/theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Lobby'>;

export function TelaLobby({ navigation, route }: Props) {
  const { roomCode, jogadorId } = route.params;
  const [jogadores, setJogadores] = useState<Player[]>([]);
  const [anfitriaoId, setAnfitriaoId] = useState<PlayerId | null>(null);
  const [salaRemovida, setSalaRemovida] = useState(false);
  const totalAnteriorRef = useRef(0);

  useEffect(() => {
    const cancelar = observarSala(roomCode, (sala) => {
      if (!sala) {
        setSalaRemovida(true);
        return;
      }
      const lista = Object.values(sala.jogadores ?? {});
      if (lista.length > totalAnteriorRef.current && totalAnteriorRef.current > 0) {
        void tocar('ping');
      }
      totalAnteriorRef.current = lista.length;
      setJogadores(lista);
      setAnfitriaoId(sala.anfitriaoId);
      if (sala.estado.fase !== 'lobby') {
        navigation.replace('Game', {
          roomCode,
          jogoId: sala.jogoId,
          jogadorId,
        });
      }
    });
    return cancelar;
  }, [roomCode, jogadorId, navigation]);

  const ehHost = anfitriaoId === jogadorId;

  function aoSegurarJogador(jogador: Player) {
    if (!ehHost) return;
    if (jogador.id === jogadorId) return;
    if (jogador.estaConectado !== false) return;
    Alert.alert(
      'Remover jogador?',
      `${jogador.nome} está sem sinal. Remover da sala?`,
      [
        { text: 'cancelar', style: 'cancel' },
        {
          text: 'remover',
          style: 'destructive',
          onPress: () => {
            void sairDaSala(roomCode, jogador.id);
          },
        },
      ],
    );
  }

  async function aoSair() {
    await sairDaSala(roomCode, jogadorId);
    await limparPartida();
    navigation.popToTop();
  }

  if (salaRemovida) {
    return (
      <SafeAreaView style={[estilos.tela, estilos.telaCentralizada]}>
        <Text style={estilos.titulo}>sala encerrada</Text>
        <Text style={estilos.subtitulo}>
          o anfitrião fechou a sala.
        </Text>
        <BotaoPrimario
          titulo="voltar pro início"
          onPress={() => navigation.popToTop()}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={estilos.tela} edges={['top', 'bottom']}>
      <View style={estilos.cabecalho}>
        <Text style={estilos.legenda}>sala</Text>
        <CodigoSala codigo={roomCode} tamanho="medio" />
        <Text style={estilos.fraseCabecalho}>
          alguém aqui não vai ser quem parece.
        </Text>
      </View>

      <View style={estilos.blocoLista}>
        <View style={estilos.cabecalhoLista}>
          <Text style={estilos.tituloLista}>Jogadores</Text>
          <Text style={estilos.contadorLista}>{jogadores.length}</Text>
        </View>
        <FlatList
          data={jogadores}
          keyExtractor={(j) => j.id}
          contentContainerStyle={estilos.listaConteudo}
          ItemSeparatorComponent={() => <View style={estilos.separador} />}
          renderItem={({ item }) => (
            <Pressable
              onLongPress={() => aoSegurarJogador(item)}
              delayLongPress={500}
            >
              <JogadorAnimado
                jogador={item}
                estado={item.id === jogadorId ? 'voce' : 'normal'}
              />
            </Pressable>
          )}
        />
      </View>

      <View style={estilos.rodape}>
        <Text style={estilos.aguardando}>
          aguardando o anfitrião.
        </Text>
        <BotaoSecundario titulo="sair da sala" onPress={aoSair} />
      </View>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  aguardando: {
    color: cores.textoMudo,
    fontFamily: familias.serifItalico,
    fontSize: tipografia.tamanhoCorpoMenor,
    marginBottom: espacamento.md,
    textAlign: 'center',
  },
  fraseCabecalho: {
    color: cores.textoMudo,
    fontFamily: familias.serifItalico,
    fontSize: tipografia.tamanhoCorpoMenor,
    letterSpacing: 0.2,
    marginTop: espacamento.sm,
    textAlign: 'center',
  },
  blocoLista: {
    flex: 1,
    paddingHorizontal: espacamento.lg,
  },
  cabecalho: {
    alignItems: 'center',
    gap: espacamento.sm,
    paddingHorizontal: espacamento.lg,
    paddingTop: espacamento.lg,
    paddingBottom: espacamento.xl,
  },
  cabecalhoLista: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: espacamento.md,
  },
  contadorLista: {
    color: cores.textoSecundario,
    fontSize: 14,
    fontWeight: tipografia.pesoMedio,
  },
  legenda: {
    color: cores.textoMudo,
    fontSize: tipografia.tamanhoMicro,
    fontWeight: tipografia.pesoMedio,
    letterSpacing: 0.3,
  },
  listaConteudo: {
    paddingBottom: espacamento.lg,
  },
  rodape: {
    gap: espacamento.sm,
    padding: espacamento.lg,
  },
  separador: {
    height: espacamento.sm,
  },
  subtitulo: {
    color: cores.textoSecundario,
    fontSize: 15,
    textAlign: 'center',
  },
  tela: {
    backgroundColor: cores.fundo,
    flex: 1,
  },
  telaCentralizada: {
    alignItems: 'center',
    gap: espacamento.md,
    justifyContent: 'center',
    padding: espacamento.lg,
  },
  tituloLista: {
    color: cores.texto,
    fontSize: tipografia.tamanhoSubtitulo,
    fontWeight: tipografia.pesoBold,
  },
  titulo: {
    color: cores.texto,
    fontSize: tipografia.tamanhoTitulo,
    fontWeight: tipografia.pesoExtraBold,
  },
});
