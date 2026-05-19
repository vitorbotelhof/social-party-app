import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BotaoPrimario, ContagemRegressiva } from '@/components';
import { LISTA_CATEGORIAS } from '@/games/mr-white/categorias';
import type {
  CategoriaId,
  Dificuldade,
  DificuldadeParPalavras,
  OpcoesMrWhite,
} from '@/games/mr-white/types';
import type { RootStackParamList } from '@/navigation/types';
import { iniciarJogo } from '@/services/roomService';
import { RoomServiceError } from '@/types/room';
import { cores, espacamento, raio } from '@/theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'ConfiguracaoJogo'>;

const ROTULOS_DIFICULDADE: Record<Dificuldade, string> = {
  facil: 'Fácil',
  medio: 'Médio',
  dificil: 'Difícil',
};

const ROTULOS_DIFICULDADE_PAR: Record<DificuldadeParPalavras, { rotulo: string; descricao: string }> = {
  leve: { rotulo: 'Fácil', descricao: 'palavras bem diferentes' },
  media: { rotulo: 'Médio', descricao: 'alguma semelhança' },
  hard: { rotulo: 'Difícil', descricao: 'muito próximas' },
  insana: { rotulo: 'Insano', descricao: 'quase a mesma coisa' },
};

const MIN_MR_WHITES = 1;
const MAX_MR_WHITES = 3;

const OPCOES_TEMPO: { valor: number; rotulo: string }[] = [
  { valor: 30, rotulo: '30s' },
  { valor: 60, rotulo: '60s' },
  { valor: 90, rotulo: '90s' },
  { valor: 0, rotulo: 'sem limite' },
];

export function TelaConfiguracaoJogo({ navigation, route }: Props) {
  const { roomCode, jogoId, jogadorId } = route.params;

  const [categoriaId, setCategoriaId] = useState<CategoriaId>('comidas');
  const [dificuldade, setDificuldade] = useState<Dificuldade>('medio');
  const [numMrWhites, setNumMrWhites] = useState(1);
  const [duracaoTurno, setDuracaoTurno] = useState(60);
  const [modoDualWord, setModoDualWord] = useState(false);
  const [dificuldadePar, setDificuldadePar] = useState<DificuldadeParPalavras>('media');
  const [iniciando, setIniciando] = useState(false);
  const [mostrarContagem, setMostrarContagem] = useState(false);

  function sortearCategoria() {
    const atual = categoriaId;
    const disponiveis = LISTA_CATEGORIAS.filter((c) => c.id !== atual);
    const sorteada = disponiveis[Math.floor(Math.random() * disponiveis.length)];
    if (sorteada) setCategoriaId(sorteada.id);
  }

  async function aoIniciar() {
    const opcoes: OpcoesMrWhite = {
      categoriaId,
      dificuldade,
      numeroMrWhites: numMrWhites,
      duracaoTurnoSegundos: duracaoTurno,
      modoDualWord,
      dificuldadePar,
    };
    setIniciando(true);
    try {
      await iniciarJogo(roomCode, jogadorId, opcoes);
      setMostrarContagem(true);
    } catch (erro) {
      setIniciando(false);
      const mensagem =
        erro instanceof RoomServiceError
          ? erro.message
          : 'Algo deu errado, tenta de novo.';
      Alert.alert('Não rolou começar a partida', mensagem);
    }
  }

  if (mostrarContagem) {
    return (
      <ContagemRegressiva
        aoTerminar={() =>
          navigation.replace('Game', { roomCode, jogoId, jogadorId })
        }
      />
    );
  }

  return (
    <SafeAreaView style={estilos.tela} edges={['bottom']}>
      <ScrollView contentContainerStyle={estilos.conteudo}>
        <Text style={estilos.tituloPagina}>como vai ser?</Text>

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
                    {c.nome}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Pressable onPress={sortearCategoria} style={estilos.botaoAleatorio}>
            <Text style={estilos.botaoAleatorioTexto}>sortear categoria</Text>
          </Pressable>
        </Section>

        <Section titulo="Modo de Jogo">
          <View style={estilos.linhaSegmentos}>
            <Pressable
              onPress={() => setModoDualWord(false)}
              style={[estilos.segmento, !modoDualWord && estilos.segmentoAtivo]}
            >
              <Text style={[estilos.segmentoTexto, !modoDualWord && estilos.segmentoTextoAtivo]}>
                Clássico
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setModoDualWord(true)}
              style={[estilos.segmento, modoDualWord && estilos.segmentoAtivo]}
            >
              <Text style={[estilos.segmentoTexto, modoDualWord && estilos.segmentoTextoAtivo]}>
                Dual Word
              </Text>
            </Pressable>
          </View>
          <Text style={estilos.ajuda}>
            {modoDualWord
              ? 'mr white recebe palavra parecida — mais difícil de desmascarar.'
              : 'mr white não recebe palavra — deve blefar do zero.'}
          </Text>
        </Section>

        {modoDualWord && (
          <Section titulo="Proximidade das Palavras">
            <View style={estilos.linhaSegmentos}>
              {(Object.keys(ROTULOS_DIFICULDADE_PAR) as DificuldadeParPalavras[]).map((d) => {
                const ativo = d === dificuldadePar;
                return (
                  <Pressable
                    key={d}
                    onPress={() => setDificuldadePar(d)}
                    style={[estilos.segmento, ativo && estilos.segmentoAtivo]}
                  >
                    <Text style={[estilos.segmentoTexto, ativo && estilos.segmentoTextoAtivo]}>
                      {ROTULOS_DIFICULDADE_PAR[d].rotulo}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={estilos.ajuda}>
              {ROTULOS_DIFICULDADE_PAR[dificuldadePar].descricao}
            </Text>
          </Section>
        )}

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

        <Section titulo="Tempo por Turno">
          <View style={estilos.linhaSegmentos}>
            {OPCOES_TEMPO.map((opcao) => {
              const ativo = opcao.valor === duracaoTurno;
              return (
                <Pressable
                  key={opcao.valor}
                  onPress={() => setDuracaoTurno(opcao.valor)}
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
                    {opcao.rotulo}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={estilos.ajuda}>
            tempo que cada jogador tem para dar a dica.
          </Text>
        </Section>
      </ScrollView>

      <View style={estilos.rodape}>
        <BotaoPrimario
          titulo="é hora de jogar"
          carregando={iniciando}
          disabled={iniciando}
          onPress={aoIniciar}
        />
      </View>
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
  chipTexto: {
    color: cores.textoSecundario,
    fontSize: 15,
    fontWeight: '600',
  },
  chipTextoAtivo: {
    color: cores.textoSobrePrimaria,
  },
  botaoAleatorio: {
    alignItems: 'center',
    marginTop: espacamento.md,
    paddingVertical: espacamento.sm,
  },
  botaoAleatorioTexto: {
    color: cores.acento,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
    textDecorationLine: 'underline',
  },
  chipsLinha: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: espacamento.sm,
  },
  conteudo: {
    padding: espacamento.lg,
  },
  controleNumero: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: espacamento.lg,
    justifyContent: 'center',
  },
  linhaSegmentos: {
    flexDirection: 'row',
    gap: espacamento.sm,
  },
  rodape: {
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
  tela: {
    backgroundColor: cores.fundo,
    flex: 1,
  },
  tituloPagina: {
    color: cores.texto,
    fontSize: 28,
    fontWeight: '900',
    marginBottom: espacamento.xl,
  },
  valorNumero: {
    color: cores.primaria,
    fontSize: 40,
    fontWeight: '900',
    minWidth: 48,
    textAlign: 'center',
  },
});
