import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
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
  BotaoVoltar,
  BotaoPrimario,
  CodigoSala,
  JogadorAnimado,
  TelaCarregamento,
} from '@/components';
import type { Player, PlayerId, RoomCode } from '@/engine/types';
import type { RootStackParamList } from '@/navigation/types';
import { tocar } from '@/services/audio';
import { obterOuCriarJogador } from '@/services/jogadorLocal';
import { configurarPresenca } from '@/services/presenca';
import {
  criarSala,
  observarJogadores,
  sairDaSala,
} from '@/services/roomService';
import { RoomServiceError, type Unsubscribe } from '@/types/room';
import { cores, espacamento, tipografia } from '@/theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'CriarSala'>;

const MIN_JOGADORES = 3;

export function TelaCriarSala({ navigation, route }: Props) {
  const { jogoId } = route.params;
  const [codigoSala, setCodigoSala] = useState<RoomCode | null>(null);
  const [meuId, setMeuId] = useState<PlayerId | null>(null);
  const [jogadores, setJogadores] = useState<Player[]>([]);
  const meuIdRef = useRef<PlayerId | null>(null);
  const codigoRef = useRef<RoomCode | null>(null);
  const totalAnteriorRef = useRef(0);

  useEffect(() => {
    let cancelado = false;
    let cancelarObservador: Unsubscribe | undefined;

    async function criar() {
      const jogadorLocal = await obterOuCriarJogador();
      if (cancelado) return;

      const nomeLimpo = jogadorLocal.nome?.trim() ?? '';
      if (nomeLimpo.length < 2) {
        // Volta pra TelaInicio — lá o modal de nome aparece automaticamente.
        navigation.popToTop();
        return;
      }

      const idHost = jogadorLocal.id;
      meuIdRef.current = idHost;
      try {
        const sala = await criarSala({
          jogoId,
          anfitriao: { id: idHost, nome: nomeLimpo },
        });
        if (cancelado) {
          await sairDaSala(sala.codigo, idHost);
          return;
        }
        codigoRef.current = sala.codigo;
        setCodigoSala(sala.codigo);
        setMeuId(idHost);
        setJogadores(Object.values(sala.jogadores ?? {}));
        cancelarObservador = observarJogadores(sala.codigo, (lista) => {
          if (
            lista.length > totalAnteriorRef.current &&
            totalAnteriorRef.current > 0
          ) {
            void tocar('ping');
          }
          totalAnteriorRef.current = lista.length;
          setJogadores(lista);
        });
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (erro) {
        if (cancelado) return;
        const mensagem =
          erro instanceof RoomServiceError ? erro.message : 'Erro inesperado.';
        Alert.alert('Não foi possível criar a sala', mensagem, [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    }

    criar();

    return () => {
      cancelado = true;
      cancelarObservador?.();
      const codigo = codigoRef.current;
      const id = meuIdRef.current;
      if (codigo && id) {
        // Sai da sala ao desmontar a tela (cancelamento da criação).
        void sairDaSala(codigo, id);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jogoId]);

  // Configura presença com onDisconnect assim que a sala e o id existirem.
  useEffect(() => {
    if (!codigoSala || !meuId) return undefined;
    return configurarPresenca(codigoSala, meuId);
  }, [codigoSala, meuId]);

  function aoConfigurar() {
    if (!codigoSala || !meuId) return;
    // Evita que o cleanup do useEffect chame sairDaSala ao sair da tela.
    codigoRef.current = null;
    meuIdRef.current = null;
    navigation.navigate('ConfiguracaoJogo', {
      roomCode: codigoSala,
      jogoId,
      jogadorId: meuId,
    });
  }

  function aoSegurarJogador(jogador: Player) {
    if (!codigoSala) return;
    if (jogador.id === meuId) return; // host é sempre o local aqui
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
            void sairDaSala(codigoSala, jogador.id);
          },
        },
      ],
    );
  }

  if (!codigoSala) {
    return <TelaCarregamento mensagem="Criando sala..." />;
  }

  const podeIniciar = jogadores.length >= MIN_JOGADORES;

  return (
    <SafeAreaView style={estilos.tela} edges={['top', 'bottom']}>
      <BotaoVoltar
        variante="fechar"
        posicao="direita"
        onPress={() => navigation.goBack()}
      />

      <View style={estilos.blocoCodigo}>
        <Text style={estilos.legenda}>código da sala</Text>
        <CodigoSala codigo={codigoSala} />
        <Text style={estilos.subtitulo}>
          manda pro grupo e espera todo mundo entrar
        </Text>
      </View>

      <View style={estilos.blocoJogadores}>
        <View style={estilos.cabecalhoLista}>
          <Text style={estilos.tituloLista}>jogadores</Text>
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
                estado={item.id === meuId ? 'voce' : 'normal'}
              />
            </Pressable>
          )}
        />
      </View>

      <View style={estilos.rodape}>
        {podeIniciar ? (
          <BotaoPrimario titulo="configurar e começar" onPress={aoConfigurar} />
        ) : (
          <Text style={estilos.aguardando}>
            a galera ainda está entrando... mínimo {MIN_JOGADORES}
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  aguardando: {
    color: cores.textoSecundario,
    fontSize: 15,
    textAlign: 'center',
  },
  blocoCodigo: {
    alignItems: 'center',
    gap: espacamento.md,
    paddingHorizontal: espacamento.lg,
    paddingTop: espacamento.xl,
  },
  blocoJogadores: {
    flex: 1,
    marginTop: espacamento.xl,
    paddingHorizontal: espacamento.lg,
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
  tituloLista: {
    color: cores.texto,
    fontSize: tipografia.tamanhoSubtitulo,
    fontWeight: tipografia.pesoBold,
  },
});
