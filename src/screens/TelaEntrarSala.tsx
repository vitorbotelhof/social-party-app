import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BotaoPrimario } from '@/components';
import type { RootStackParamList } from '@/navigation/types';
import {
  obterOuCriarJogador,
  salvarNome,
} from '@/services/jogadorLocal';
import { entrarNaSala } from '@/services/roomService';
import { RoomServiceError } from '@/types/room';
import { cores, espacamento, raio } from '@/theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'EntrarSala'>;

const TAMANHO_CODIGO = 4;

export function TelaEntrarSala({ navigation }: Props) {
  const [codigo, setCodigo] = useState('');
  const [nome, setNome] = useState('');
  const [jogadorId, setJogadorId] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [erroCodigo, setErroCodigo] = useState<string | null>(null);
  const shake = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    obterOuCriarJogador().then((j) => {
      setJogadorId(j.id);
      if (j.nome) setNome(j.nome);
    });
  }, []);

  // Reset do erro quando o usuário digita um novo código.
  useEffect(() => {
    if (erroCodigo) setErroCodigo(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codigo]);

  function fazerShake() {
    shake.setValue(0);
    Animated.sequence([
      Animated.timing(shake, { toValue: 1, duration: 50, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -1, duration: 50, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 1, duration: 50, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -1, duration: 50, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  }

  const codigoValido = codigo.length === TAMANHO_CODIGO;
  const nomeValido = nome.trim().replace(/\s+/g, ' ').length >= 2;
  const habilitado = codigoValido && nomeValido && !enviando && !!jogadorId;

  async function aoEntrar() {
    if (!habilitado || !jogadorId) return;
    setEnviando(true);
    setErroCodigo(null);
    const nomeLimpo = nome.trim();
    try {
      const sala = await entrarNaSala({
        codigo,
        jogador: { id: jogadorId, nome: nomeLimpo },
      });
      await salvarNome(nomeLimpo);
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      navigation.replace('Lobby', {
        roomCode: sala.codigo,
        jogoId: sala.jogoId,
        jogadorId,
      });
    } catch (erro) {
      setEnviando(false);
      if (erro instanceof RoomServiceError && erro.code === 'sala_nao_encontrada') {
        setErroCodigo('sala não encontrada. confere o código!');
        fazerShake();
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }
      const mensagem =
        erro instanceof RoomServiceError ? erro.message : 'Algo deu errado, tenta de novo.';
      Alert.alert('Não rolou entrar na sala', mensagem);
    }
  }

  const translateX = shake.interpolate({
    inputRange: [-1, 1],
    outputRange: [-8, 8],
  });

  return (
    <SafeAreaView style={estilos.tela} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={estilos.flex}
      >
        <View style={estilos.conteudo}>
          <Text style={estilos.titulo}>entrar na partida</Text>
          <Text style={estilos.subtitulo}>
            pede o código da sala pra quem criou.
          </Text>

          <View style={estilos.campoBloco}>
            <Text style={estilos.rotulo}>código da sala</Text>
            <Animated.View style={{ transform: [{ translateX }] }}>
              <TextInput
                value={codigo}
                onChangeText={(t) =>
                  setCodigo(t.toUpperCase().replace(/[^A-Z]/g, '').slice(0, TAMANHO_CODIGO))
                }
                placeholder="FEST"
                placeholderTextColor={cores.textoMudo}
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={TAMANHO_CODIGO}
                style={[
                  estilos.input,
                  estilos.inputCodigo,
                  erroCodigo && estilos.inputErro,
                ]}
              />
            </Animated.View>
            {erroCodigo && (
              <Text style={estilos.mensagemErro}>{erroCodigo}</Text>
            )}
          </View>

          <View style={estilos.campoBloco}>
            <Text style={estilos.rotulo}>seu nome</Text>
            <TextInput
              value={nome}
              onChangeText={setNome}
              placeholder="como te chamam?"
              placeholderTextColor={cores.textoMudo}
              maxLength={20}
              style={estilos.input}
            />
          </View>
        </View>

        <View style={estilos.rodape}>
          <BotaoPrimario
            titulo="entrar"
            carregando={enviando}
            disabled={!habilitado}
            onPress={aoEntrar}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  campoBloco: {
    gap: espacamento.sm,
    marginTop: espacamento.lg,
  },
  conteudo: {
    flex: 1,
    padding: espacamento.lg,
  },
  flex: {
    flex: 1,
  },
  input: {
    backgroundColor: cores.superficie,
    borderColor: cores.borda,
    borderRadius: raio.md,
    borderWidth: 1,
    color: cores.texto,
    fontSize: 17,
    paddingHorizontal: espacamento.md,
    paddingVertical: espacamento.md,
  },
  inputCodigo: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 8,
    textAlign: 'center',
  },
  inputErro: {
    borderColor: cores.erro,
    borderWidth: 1.5,
  },
  mensagemErro: {
    color: cores.erro,
    fontSize: 14,
    fontWeight: '600',
    marginTop: espacamento.xs,
  },
  rodape: {
    padding: espacamento.lg,
  },
  rotulo: {
    color: cores.textoSecundario,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  subtitulo: {
    color: cores.textoSecundario,
    fontSize: 15,
    marginTop: espacamento.sm,
  },
  tela: {
    backgroundColor: cores.fundo,
    flex: 1,
  },
  titulo: {
    color: cores.texto,
    fontSize: 32,
    fontWeight: '900',
  },
});
