import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BotaoPrimario } from '@/components';
import type { Player } from '@/engine/types';
import type { OpcoesMrWhite } from '@/games/mr-white/types';
import type { RootStackParamList } from '@/navigation/types';
import { carregarNome } from '@/services/jogadorLocal';
import { inicializarJogoLocal } from '@/services/jogoLocal';
import { cores, espacamento, raio, tipografia } from '@/theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'CadastroJogadores'>;

const MIN_JOGADORES = 3;
const MAX_JOGADORES = 12;
const MIN_TAMANHO_NOME = 2;

export function TelaCadastroJogadores({ navigation, route }: Props) {
  const opcoes = route.params.opcoes as OpcoesMrWhite;
  const [nomes, setNomes] = useState<string[]>([]);
  const [novoNome, setNovoNome] = useState('');
  const [iniciando, setIniciando] = useState(false);

  useEffect(() => {
    void carregarNome().then((nome) => {
      if (nome) setNomes([nome]);
    });
  }, []);

  const nomeLimpo = novoNome.trim();
  const podeAdicionar =
    nomeLimpo.length >= MIN_TAMANHO_NOME &&
    nomes.length < MAX_JOGADORES &&
    !nomes.some((n) => n.toLowerCase() === nomeLimpo.toLowerCase());
  const podeIniciar = nomes.length >= MIN_JOGADORES && !iniciando;

  function aoAdicionar() {
    if (!podeAdicionar) return;
    setNomes((atual) => [...atual, nomeLimpo]);
    setNovoNome('');
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  function aoRemover(indice: number) {
    setNomes((atual) => atual.filter((_, i) => i !== indice));
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  function aoComecar() {
    if (!podeIniciar) return;
    setIniciando(true);
    const agora = Date.now();
    const jogadores: Player[] = nomes.map((nome, i) => ({
      id: `local-${i}`,
      nome,
      papelSecreto: null,
      ehAnfitriao: i === 0,
      estaConectado: true,
      entrouEm: agora + i,
    }));
    inicializarJogoLocal(jogadores, opcoes);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    navigation.replace('JogoLocal');
  }

  return (
    <SafeAreaView style={estilos.tela} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={estilos.flex}
      >
        <View style={estilos.cabecalho}>
          <Text style={estilos.legenda}>UM CELULAR</Text>
          <Text style={estilos.titulo}>quem vai jogar?</Text>
          <Text style={estilos.subtitulo}>
            adicione o nome de cada jogador. mínimo {MIN_JOGADORES}, máximo{' '}
            {MAX_JOGADORES}.
          </Text>
        </View>

        <View style={estilos.entradaBloco}>
          <TextInput
            value={novoNome}
            onChangeText={setNovoNome}
            placeholder="nome do jogador..."
            placeholderTextColor={cores.textoMudo}
            maxLength={20}
            returnKeyType="done"
            onSubmitEditing={aoAdicionar}
            style={estilos.input}
          />
          <Pressable
            onPress={aoAdicionar}
            disabled={!podeAdicionar}
            style={({ pressed }) => [
              estilos.botaoAdicionar,
              !podeAdicionar && estilos.botaoAdicionarDesabilitado,
              pressed && podeAdicionar && estilos.botaoAdicionarPressionado,
            ]}
          >
            <Text style={estilos.botaoAdicionarTexto}>+</Text>
          </Pressable>
        </View>

        <View style={estilos.contadorLinha}>
          <Text style={estilos.contadorTexto}>
            {nomes.length} de {MAX_JOGADORES}
          </Text>
        </View>

        <ScrollView
          style={estilos.lista}
          contentContainerStyle={estilos.listaConteudo}
          showsVerticalScrollIndicator={false}
        >
          {nomes.length === 0 ? (
            <Text style={estilos.vazio}>
              nenhum jogador ainda. comece adicionando seu nome.
            </Text>
          ) : (
            nomes.map((nome, i) => (
              <View key={`${nome}-${i}`} style={estilos.item}>
                <View style={estilos.itemBolinha}>
                  <Text style={estilos.itemNumero}>{i + 1}</Text>
                </View>
                <Text style={estilos.itemNome} numberOfLines={1}>
                  {nome}
                  {i === 0 ? ' (você)' : ''}
                </Text>
                <Pressable
                  onPress={() => aoRemover(i)}
                  hitSlop={12}
                  style={({ pressed }) => [
                    estilos.itemRemover,
                    pressed && estilos.itemRemoverPressionado,
                  ]}
                >
                  <Text style={estilos.itemRemoverTexto}>×</Text>
                </Pressable>
              </View>
            ))
          )}
        </ScrollView>

        <View style={estilos.rodape}>
          <BotaoPrimario
            titulo="pronto, começar"
            disabled={!podeIniciar}
            carregando={iniciando}
            onPress={aoComecar}
          />
          {nomes.length < MIN_JOGADORES && (
            <Text style={estilos.faltam}>
              faltam {MIN_JOGADORES - nomes.length} jogador(es)
            </Text>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  botaoAdicionar: {
    alignItems: 'center',
    backgroundColor: cores.primaria,
    borderRadius: raio.md,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  botaoAdicionarDesabilitado: {
    backgroundColor: cores.borda,
  },
  botaoAdicionarPressionado: {
    backgroundColor: cores.primariaPressionada,
    transform: [{ scale: 0.95 }],
  },
  botaoAdicionarTexto: {
    color: cores.textoSobrePrimaria,
    fontSize: 28,
    fontWeight: tipografia.pesoBold,
    lineHeight: 30,
  },
  cabecalho: {
    paddingHorizontal: espacamento.lg,
    paddingTop: espacamento.lg,
  },
  contadorLinha: {
    paddingHorizontal: espacamento.lg,
    paddingVertical: espacamento.sm,
  },
  contadorTexto: {
    color: cores.textoSecundario,
    fontSize: tipografia.tamanhoLegenda,
    fontWeight: tipografia.pesoBold,
  },
  entradaBloco: {
    flexDirection: 'row',
    gap: espacamento.sm,
    paddingHorizontal: espacamento.lg,
    paddingTop: espacamento.lg,
  },
  faltam: {
    color: cores.textoMudo,
    fontSize: tipografia.tamanhoLegenda,
    marginTop: espacamento.sm,
    textAlign: 'center',
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
    flex: 1,
    fontSize: 17,
    paddingHorizontal: espacamento.md,
    paddingVertical: espacamento.md,
  },
  item: {
    alignItems: 'center',
    backgroundColor: cores.superficie,
    borderColor: cores.borda,
    borderRadius: raio.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: espacamento.md,
    marginBottom: espacamento.sm,
    paddingHorizontal: espacamento.md,
    paddingVertical: espacamento.md,
  },
  itemBolinha: {
    alignItems: 'center',
    backgroundColor: cores.fundoSecundario,
    borderRadius: 16,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  itemNome: {
    color: cores.texto,
    flex: 1,
    fontSize: tipografia.tamanhoCorpoMaior,
    fontWeight: tipografia.pesoSemibold,
  },
  itemNumero: {
    color: cores.textoSecundario,
    fontSize: tipografia.tamanhoLegenda,
    fontWeight: tipografia.pesoExtraBold,
  },
  itemRemover: {
    alignItems: 'center',
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  itemRemoverPressionado: {
    opacity: 0.5,
  },
  itemRemoverTexto: {
    color: cores.textoSecundario,
    fontSize: 24,
    fontWeight: tipografia.pesoBold,
    lineHeight: 26,
  },
  legenda: {
    color: cores.primaria,
    fontSize: tipografia.tamanhoMicro,
    fontWeight: tipografia.pesoExtraBold,
    letterSpacing: tipografia.letraSpacingLegenda,
  },
  lista: {
    flex: 1,
  },
  listaConteudo: {
    paddingHorizontal: espacamento.lg,
    paddingVertical: espacamento.sm,
  },
  rodape: {
    paddingBottom: espacamento.md,
    paddingHorizontal: espacamento.lg,
    paddingTop: espacamento.md,
  },
  subtitulo: {
    color: cores.textoSecundario,
    fontSize: tipografia.tamanhoCorpoMenor,
    marginTop: espacamento.sm,
  },
  tela: {
    backgroundColor: cores.fundo,
    flex: 1,
  },
  titulo: {
    color: cores.texto,
    fontSize: tipografia.tamanhoTitulo,
    fontWeight: tipografia.pesoExtraBold,
    letterSpacing: tipografia.spacingTitulo,
    marginTop: espacamento.sm,
  },
  vazio: {
    color: cores.textoMudo,
    fontSize: tipografia.tamanhoCorpoMenor,
    fontStyle: 'italic',
    paddingVertical: espacamento.lg,
    textAlign: 'center',
  },
});
