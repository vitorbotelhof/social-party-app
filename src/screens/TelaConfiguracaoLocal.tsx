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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { BadgeUmCelular, BotaoPrimario } from '@/components';
import type { Player } from '@/engine/types';
import { LISTA_CATEGORIAS } from '@/games/mr-white/categorias';
import type {
  CategoriaId,
  Dificuldade,
  OpcoesMrWhite,
} from '@/games/mr-white/types';
import type { RootStackParamList } from '@/navigation/types';
import { carregarNome } from '@/services/jogadorLocal';
import {
  getJogadoresLocais,
  inicializarJogoLocal,
} from '@/services/jogoLocal';
import { cores, espacamento, raio, tipografia } from '@/theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'ConfiguracaoLocal'>;

const ROTULOS_DIFICULDADE: Record<Dificuldade, string> = {
  facil: 'Fácil',
  medio: 'Médio',
  dificil: 'Difícil',
};

const MIN_MR_WHITES = 1;
const MAX_MR_WHITES = 3;
const MIN_JOGADORES = 3;
const MAX_JOGADORES = 12;
const MIN_TAMANHO_NOME = 2;

export function TelaConfiguracaoLocal({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [categoriaId, setCategoriaId] = useState<CategoriaId>('comidas');
  const [dificuldade, setDificuldade] = useState<Dificuldade>('medio');
  const [numMrWhites, setNumMrWhites] = useState(1);
  const [nomes, setNomes] = useState<string[]>([]);
  const [novoNome, setNovoNome] = useState('');
  const [iniciando, setIniciando] = useState(false);

  useEffect(() => {
    // Se voltou de "jogar de novo", usa a lista da partida anterior.
    const anteriores = getJogadoresLocais();
    if (anteriores.length > 0) {
      setNomes(anteriores.map((j) => j.nome));
      return;
    }
    void carregarNome().then((nome) => {
      if (nome) setNomes((atual) => (atual.length === 0 ? [nome] : atual));
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
    const opcoes: OpcoesMrWhite = {
      categoriaId,
      dificuldade,
      numeroMrWhites: numMrWhites,
      duracaoTurnoSegundos: 60,
    };
    inicializarJogoLocal('mrwhite', jogadores, opcoes);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    navigation.replace('JogoLocal');
  }

  return (
    <SafeAreaView style={estilos.tela} edges={['top', 'bottom']}>
      <Pressable
        onPress={() => navigation.goBack()}
        style={({ pressed }) => [
          estilos.botaoVoltar,
          { top: insets.top + 8 },
          pressed && estilos.botaoVoltarPressionado,
        ]}
        hitSlop={12}
      >
        <Text style={estilos.botaoVoltarIcone}>←</Text>
      </Pressable>
      <BadgeUmCelular />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={estilos.flex}
      >
        <ScrollView
          style={estilos.scroll}
          contentContainerStyle={estilos.scrollConteudo}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={estilos.cabecalho}>
            <Text style={estilos.legenda}>📱 UM CELULAR</Text>
            <Text style={estilos.tituloPagina}>como vai ser?</Text>
            <Text style={estilos.subtitulo}>
              offline · passando de mão em mão
            </Text>
          </View>

          <Section titulo="Jogo">
            <View style={estilos.chipsLinha}>
              <View style={[estilos.chip, estilos.chipAtivo]}>
                <Text style={[estilos.chipTexto, estilos.chipTextoAtivo]}>
                  🕵️ Mr White
                </Text>
              </View>
            </View>
            <Text style={estilos.ajuda}>mais jogos em breve.</Text>
          </Section>

          <Section titulo="Categoria">
            <View style={estilos.chipsLinha}>
              {LISTA_CATEGORIAS.map((c) => {
                const ativo = c.id === categoriaId;
                return (
                  <Pressable
                    key={c.id}
                    onPress={() => setCategoriaId(c.id)}
                    style={[estilos.chip, ativo && estilos.chipAtivo]}
                  >
                    <Text
                      style={[
                        estilos.chipTexto,
                        ativo && estilos.chipTextoAtivo,
                      ]}
                    >
                      {c.emoji} {c.nome}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Section>

          <Section titulo="Dificuldade">
            <View style={estilos.linhaSegmentos}>
              {(Object.keys(ROTULOS_DIFICULDADE) as Dificuldade[]).map((d) => {
                const ativo = d === dificuldade;
                return (
                  <Pressable
                    key={d}
                    onPress={() => setDificuldade(d)}
                    style={[
                      estilos.segmento,
                      ativo && estilos.segmentoAtivo,
                    ]}
                  >
                    <Text
                      style={[
                        estilos.segmentoTexto,
                        ativo && estilos.segmentoTextoAtivo,
                      ]}
                    >
                      {ROTULOS_DIFICULDADE[d]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Section>

          <Section titulo="Impostores">
            <View style={estilos.controleNumero}>
              <Pressable
                onPress={() =>
                  setNumMrWhites((n) => Math.max(MIN_MR_WHITES, n - 1))
                }
                style={estilos.botaoNumero}
                disabled={numMrWhites <= MIN_MR_WHITES}
              >
                <Text style={estilos.botaoNumeroTexto}>−</Text>
              </Pressable>
              <Text style={estilos.valorNumero}>{numMrWhites}</Text>
              <Pressable
                onPress={() =>
                  setNumMrWhites((n) => Math.min(MAX_MR_WHITES, n + 1))
                }
                style={estilos.botaoNumero}
                disabled={numMrWhites >= MAX_MR_WHITES}
              >
                <Text style={estilos.botaoNumeroTexto}>+</Text>
              </Pressable>
            </View>
            <Text style={estilos.ajuda}>
              quanto mais impostores, mais difícil para os civis.
            </Text>
          </Section>

          <Section titulo={`Jogadores (${nomes.length}/${MAX_JOGADORES})`}>
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

            {nomes.length === 0 ? (
              <Text style={estilos.vazio}>
                nenhum jogador ainda. comece adicionando seu nome.
              </Text>
            ) : (
              <View style={estilos.lista}>
                {nomes.map((nome, i) => (
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
                ))}
              </View>
            )}
          </Section>
        </ScrollView>

        <View style={estilos.rodape}>
          <BotaoPrimario
            titulo="começa aí"
            disabled={!podeIniciar}
            carregando={iniciando}
            onPress={aoComecar}
          />
          {nomes.length < MIN_JOGADORES && (
            <Text style={estilos.faltam}>
              faltam {MIN_JOGADORES - nomes.length} jogador
              {MIN_JOGADORES - nomes.length === 1 ? '' : 'es'}
            </Text>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Section({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <View style={estilos.section}>
      <Text style={estilos.sectionTitulo}>{titulo}</Text>
      {children}
    </View>
  );
}

const estilos = StyleSheet.create({
  ajuda: {
    color: cores.textoMudo,
    fontSize: 13,
    marginTop: espacamento.sm,
    textAlign: 'center',
  },
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
  botaoNumero: {
    alignItems: 'center',
    backgroundColor: cores.superficieElevada,
    borderColor: cores.borda,
    borderRadius: raio.md,
    borderWidth: 1,
    height: 48,
    justifyContent: 'center',
    width: 56,
  },
  botaoNumeroTexto: {
    color: cores.texto,
    fontSize: 24,
    fontWeight: '700',
  },
  botaoVoltar: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: 18,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    left: 16,
    position: 'absolute',
    width: 36,
    zIndex: 100,
  },
  botaoVoltarIcone: {
    color: cores.texto,
    fontSize: 18,
    fontWeight: tipografia.pesoBold,
    lineHeight: 20,
  },
  botaoVoltarPressionado: {
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    transform: [{ scale: 0.94 }],
  },
  cabecalho: {
    marginBottom: espacamento.lg,
    marginTop: espacamento.xl, // espaço pro back + badge
  },
  chip: {
    backgroundColor: cores.superficie,
    borderColor: cores.borda,
    borderRadius: raio.pill,
    borderWidth: 1,
    paddingHorizontal: espacamento.md,
    paddingVertical: espacamento.sm,
  },
  chipAtivo: {
    backgroundColor: cores.primaria,
    borderColor: cores.primaria,
  },
  chipsLinha: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: espacamento.sm,
  },
  chipTexto: {
    color: cores.textoSecundario,
    fontSize: 15,
    fontWeight: '600',
  },
  chipTextoAtivo: {
    color: cores.textoSobrePrimaria,
  },
  controleNumero: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: espacamento.lg,
    justifyContent: 'center',
  },
  entradaBloco: {
    flexDirection: 'row',
    gap: espacamento.sm,
  },
  faltam: {
    color: cores.textoMudo,
    fontSize: tipografia.tamanhoLegenda,
    marginTop: espacamento.sm,
    textAlign: 'center',
  },
  flex: { flex: 1 },
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
  linhaSegmentos: {
    flexDirection: 'row',
    gap: espacamento.sm,
  },
  lista: {
    marginTop: espacamento.md,
  },
  rodape: {
    borderTopColor: cores.borda,
    borderTopWidth: 1,
    padding: espacamento.lg,
    paddingTop: espacamento.md,
  },
  scroll: {
    flex: 1,
  },
  scrollConteudo: {
    padding: espacamento.lg,
  },
  section: {
    marginBottom: espacamento.xl,
  },
  sectionTitulo: {
    color: cores.textoSecundario,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: espacamento.md,
    textTransform: 'uppercase',
  },
  segmento: {
    alignItems: 'center',
    backgroundColor: cores.superficie,
    borderColor: cores.borda,
    borderRadius: raio.md,
    borderWidth: 1,
    flex: 1,
    paddingVertical: espacamento.md,
  },
  segmentoAtivo: {
    backgroundColor: cores.acento,
    borderColor: cores.acento,
  },
  segmentoTexto: {
    color: cores.textoSecundario,
    fontSize: 15,
    fontWeight: '600',
  },
  segmentoTextoAtivo: {
    color: cores.textoSobrePrimaria,
  },
  subtitulo: {
    color: cores.textoSecundario,
    fontSize: tipografia.tamanhoCorpoMenor,
    marginTop: espacamento.xs,
  },
  tela: {
    backgroundColor: cores.fundo,
    flex: 1,
  },
  tituloPagina: {
    color: cores.texto,
    fontSize: 28,
    fontWeight: '900',
    marginTop: espacamento.sm,
  },
  valorNumero: {
    color: cores.primaria,
    fontSize: 40,
    fontWeight: '900',
    minWidth: 48,
    textAlign: 'center',
  },
  vazio: {
    color: cores.textoMudo,
    fontSize: tipografia.tamanhoLegenda,
    fontStyle: 'italic',
    marginTop: espacamento.md,
    paddingVertical: espacamento.sm,
    textAlign: 'center',
  },
});
