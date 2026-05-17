import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BotaoPrimario, BotaoSecundario, Logo } from '@/components';
import type { RootStackParamList } from '@/navigation/types';
import {
  obterOuCriarJogador,
  salvarNome,
} from '@/services/jogadorLocal';
import { cores, espacamento, raio, tipografia } from '@/theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Inicio'>;

const ANO_ATUAL = new Date().getFullYear();
const MIN_TAMANHO_NOME = 2;

export function TelaInicio({ navigation }: Props) {
  const logoOp = useRef(new Animated.Value(0)).current;
  const logoY = useRef(new Animated.Value(18)).current;
  const ctaOp = useRef(new Animated.Value(0)).current;
  const ctaY = useRef(new Animated.Value(18)).current;
  const rodapeOp = useRef(new Animated.Value(0)).current;

  const [jogador, setJogador] = useState<{
    id: string;
    nome: string | null;
  } | null>(null);
  const [mostrarModalNome, setMostrarModalNome] = useState(false);
  const [nomeDigitado, setNomeDigitado] = useState('');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    obterOuCriarJogador().then((j) => {
      setJogador(j);
      if (!j.nome) setMostrarModalNome(true);
    });
  }, []);

  useEffect(() => {
    Animated.stagger(140, [
      Animated.parallel([
        Animated.timing(logoOp, {
          toValue: 1,
          duration: 520,
          useNativeDriver: true,
        }),
        Animated.timing(logoY, {
          toValue: 0,
          duration: 520,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(ctaOp, {
          toValue: 1,
          duration: 520,
          useNativeDriver: true,
        }),
        Animated.timing(ctaY, {
          toValue: 0,
          duration: 520,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(rodapeOp, {
        toValue: 1,
        duration: 520,
        useNativeDriver: true,
      }),
    ]).start();
  }, [ctaOp, ctaY, logoOp, logoY, rodapeOp]);

  const nomeValido = nomeDigitado.trim().length >= MIN_TAMANHO_NOME;

  async function confirmarNome() {
    if (!nomeValido || salvando) return;
    setSalvando(true);
    const nomeLimpo = nomeDigitado.trim();
    try {
      await salvarNome(nomeLimpo);
      setJogador((j) => (j ? { ...j, nome: nomeLimpo } : j));
      setMostrarModalNome(false);
      setNomeDigitado('');
    } finally {
      setSalvando(false);
    }
  }

  function aoCriarPartida() {
    if (!jogador?.nome) {
      setMostrarModalNome(true);
      return;
    }
    navigation.navigate('SelecaoJogo');
  }

  function aoEntrarPartida() {
    if (!jogador?.nome) {
      setMostrarModalNome(true);
      return;
    }
    navigation.navigate('EntrarSala');
  }

  function aoJogarUmCelular() {
    navigation.navigate('ConfiguracaoLocal');
  }

  return (
    <SafeAreaView style={estilos.tela} edges={['top', 'bottom']}>
      <View style={estilos.miolo}>
        <Animated.View
          style={[
            estilos.blocoMarca,
            { opacity: logoOp, transform: [{ translateY: logoY }] },
          ]}
        >
          <View style={estilos.containerLogo}>
            <View style={estilos.glow} pointerEvents="none" />
            <Logo tamanho={180} />
          </View>

          <Text style={estilos.marca}>entre nós</Text>
          <Text style={estilos.slogan}>
            jogos sociais para momentos reais.
          </Text>
        </Animated.View>

        <View style={estilos.divisor} />

        <Animated.View
          style={[
            estilos.acoes,
            { opacity: ctaOp, transform: [{ translateY: ctaY }] },
          ]}
        >
          <View style={estilos.blocoBotao}>
            <BotaoPrimario titulo="criar partida" onPress={aoCriarPartida} />
            <Text style={estilos.legendaBotao}>cada um no próprio celular</Text>
          </View>
          <View style={estilos.blocoBotao}>
            <BotaoSecundario
              titulo="entrar em partida"
              onPress={aoEntrarPartida}
            />
            <Text style={estilos.legendaBotao}>com código de outra sala</Text>
          </View>
          <View style={estilos.blocoBotao}>
            <Pressable
              onPress={aoJogarUmCelular}
              style={({ pressed }) => [
                estilos.botaoUmCelular,
                pressed && estilos.botaoUmCelularPressionado,
              ]}
            >
              <Text style={estilos.botaoUmCelularTexto}>
                📱 jogar agora • 1 celular
              </Text>
            </Pressable>
            <Text style={estilos.legendaBotao}>passando o celular entre si</Text>
          </View>
        </Animated.View>
      </View>

      <Animated.View style={[estilos.rodape, { opacity: rodapeOp }]}>
        <Text style={estilos.rodapeTexto}>entre nós © {ANO_ATUAL}</Text>
      </Animated.View>

      <Modal
        visible={mostrarModalNome}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => {
          if (jogador?.nome) setMostrarModalNome(false);
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={estilos.modalOverlay}
        >
          <Pressable
            style={estilos.modalToque}
            onPress={() => {
              if (jogador?.nome) setMostrarModalNome(false);
            }}
          />
          <View style={estilos.modalCard}>
            <Text style={estilos.modalTitulo}>como te chamam?</Text>
            <Text style={estilos.modalSubtitulo}>
              seu nome aparece para os outros jogadores
            </Text>

            <TextInput
              value={nomeDigitado}
              onChangeText={setNomeDigitado}
              placeholder="seu nome..."
              placeholderTextColor={cores.textoMudo}
              maxLength={20}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={confirmarNome}
              style={estilos.modalInput}
            />

            <BotaoPrimario
              titulo="entrar"
              carregando={salvando}
              disabled={!nomeValido}
              onPress={confirmarNome}
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const TAMANHO_GLOW = 280;

const estilos = StyleSheet.create({
  acoes: {
    gap: espacamento.md,
    paddingHorizontal: espacamento.lg,
  },
  blocoBotao: {
    gap: 4,
  },
  blocoMarca: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: espacamento.lg,
  },
  botaoUmCelular: {
    alignItems: 'center',
    backgroundColor: cores.superficieElevada,
    borderColor: cores.borda,
    borderRadius: raio.pill,
    borderWidth: 1,
    justifyContent: 'center',
    paddingHorizontal: espacamento.md,
    paddingVertical: 14,
  },
  botaoUmCelularPressionado: {
    backgroundColor: cores.superficie,
    transform: [{ scale: 0.98 }],
  },
  botaoUmCelularTexto: {
    color: cores.texto,
    fontSize: tipografia.tamanhoCorpoMenor,
    fontWeight: tipografia.pesoSemibold,
    letterSpacing: 0.3,
  },
  legendaBotao: {
    color: cores.textoMudo,
    fontSize: tipografia.tamanhoMicro,
    textAlign: 'center',
  },
  containerLogo: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: espacamento.xl,
    position: 'relative',
  },
  divisor: {
    alignSelf: 'center',
    backgroundColor: cores.borda,
    height: 1,
    marginVertical: espacamento.lg,
    width: '40%',
  },
  glow: {
    backgroundColor: cores.primaria,
    borderRadius: TAMANHO_GLOW / 2,
    elevation: 24,
    height: TAMANHO_GLOW,
    opacity: 0.22,
    position: 'absolute',
    shadowColor: cores.primaria,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 60,
    width: TAMANHO_GLOW,
  },
  marca: {
    color: cores.texto,
    fontSize: 36,
    fontWeight: tipografia.pesoLeve,
    letterSpacing: 1.5,
  },
  miolo: {
    flex: 1,
  },
  modalCard: {
    backgroundColor: cores.superficie,
    borderRadius: raio.xl,
    gap: espacamento.md,
    padding: espacamento.lg + 4,
    width: '100%',
  },
  modalInput: {
    backgroundColor: cores.superficieElevada,
    borderRadius: raio.md,
    color: cores.texto,
    fontSize: 18,
    fontWeight: tipografia.pesoMedio,
    padding: espacamento.md,
  },
  modalOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: espacamento.lg,
  },
  modalSubtitulo: {
    color: cores.textoSecundario,
    fontSize: tipografia.tamanhoCorpoMenor,
    marginBottom: espacamento.sm,
  },
  modalTitulo: {
    color: cores.texto,
    fontSize: 24,
    fontWeight: tipografia.pesoBold,
  },
  modalToque: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  rodape: {
    alignItems: 'center',
    paddingBottom: espacamento.md,
  },
  rodapeTexto: {
    color: cores.textoMudo,
    fontSize: tipografia.tamanhoMicro,
    letterSpacing: tipografia.spacingLabel,
  },
  slogan: {
    color: cores.textoSecundario,
    fontSize: tipografia.tamanhoCorpoMenor,
    marginTop: espacamento.sm,
    textAlign: 'center',
  },
  tela: {
    backgroundColor: cores.fundo,
    flex: 1,
  },
});
