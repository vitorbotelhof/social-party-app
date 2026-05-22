import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useState } from 'react';

import {
  CadastroJogadores,
  ControladorNumerico,
  SecaoConfig,
  SegmentControl,
  TelaConfigLocal,
} from '@/components';
import { CATEGORIAS_FAZ_AI, getCategoriaFazAi } from '@/games/faz-ai/cards';
import type { CategoriaFazAiId, IntensidadeSocial } from '@/games/faz-ai/types';
import type { RootStackParamList } from '@/navigation/types';
import { salvarGrupoRecente } from '@/services/grupoRecente';
import { assegurarSessaoIniciada } from '@/session/sessionStore';
import { cores, espacamento, familias, raio, tipografia } from '@/theme/colors';

type Props = NativeStackScreenProps<
  RootStackParamList,
  'ConfiguracaoLocalFazAi'
>;

const MIN_JOGADORES = 3;
const MAX_JOGADORES = 12;
const MIN_RODADAS = 1;
const MAX_RODADAS = 5;

const DURACOES: {
  valor: 20 | 30 | 45;
  rotulo: string;
  descricao: string;
}[] = [
  { valor: 20, rotulo: '20s', descricao: 'sem pensar. só faz.' },
  { valor: 30, rotulo: '30s', descricao: 'ritmo ideal pra vergonha.' },
  { valor: 45, rotulo: '45s', descricao: 'mais espaço pra improvisar.' },
];

const INTENSIDADES: {
  valor: IntensidadeSocial | 'todas';
  rotulo: string;
}[] = [
  { valor: 'todas', rotulo: 'mistura' },
  { valor: 'social', rotulo: 'social' },
  { valor: 'caotica', rotulo: 'caótica' },
  { valor: 'absurda', rotulo: 'absurda' },
];

const CATEGORIAS_INICIAIS: CategoriaFazAiId[] = [
  'vida_adulta_brasileira',
  'internet_brasileira',
  'corporate_chaos',
  'casal_moderno',
  'vergonhas_universais',
  'brainrot_brasileiro',
  'festa_e_role',
  'problemas_de_rico',
  'exposed_cancelamento',
  'situacoes_muito_especificas',
];

export function TelaConfiguracaoLocalFazAi({ navigation }: Props) {
  const [nomes, setNomes] = useState<string[]>([]);
  const [duracao, setDuracao] = useState<20 | 30 | 45>(30);
  const [rodadasPorJogador, setRodadasPorJogador] = useState(2);
  const [intensidade, setIntensidade] = useState<IntensidadeSocial | 'todas'>(
    'todas',
  );
  const [categoriasSelecionadas, setCategoriasSelecionadas] = useState<
    CategoriaFazAiId[] | 'todas'
  >('todas');

  const categoriasAtivas =
    categoriasSelecionadas === 'todas'
      ? CATEGORIAS_INICIAIS
      : categoriasSelecionadas;
  const categoriaValida = categoriasAtivas.length >= 3;
  const podeIniciar = nomes.length >= MIN_JOGADORES && categoriaValida;
  const avisoRodape =
    nomes.length < MIN_JOGADORES
      ? `faltam ${MIN_JOGADORES - nomes.length} jogador${
          MIN_JOGADORES - nomes.length === 1 ? '' : 'es'
        }`
      : !categoriaValida
        ? 'escolha pelo menos 3 categorias'
        : undefined;
  const sublabelRodadas =
    nomes.length > 0
      ? `× ${nomes.length} = ${nomes.length * rodadasPorJogador} turnos`
      : 'vezes cada';

  function alternarCategoria(id: CategoriaFazAiId) {
    void Haptics.selectionAsync();
    if (categoriasSelecionadas === 'todas') {
      setCategoriasSelecionadas(CATEGORIAS_INICIAIS.filter((c) => c !== id));
      return;
    }

    const jaSelecionada = categoriasSelecionadas.includes(id);
    const proximas = jaSelecionada
      ? categoriasSelecionadas.filter((c) => c !== id)
      : [...categoriasSelecionadas, id];

    setCategoriasSelecionadas(
      proximas.length === CATEGORIAS_INICIAIS.length ? 'todas' : proximas,
    );
  }

  function selecionarTodasCategorias() {
    void Haptics.selectionAsync();
    setCategoriasSelecionadas('todas');
  }

  function aoComecar() {
    if (!podeIniciar) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    void salvarGrupoRecente(nomes);
    const jogadores = nomes.map((nome, i) => ({ id: `local-${i}`, nome }));
    assegurarSessaoIniciada(jogadores, 'faz-ai');
    navigation.replace('JogoLocalFazAi', {
      jogadores,
      duracaoSegundos: duracao,
      rodadasPorJogador,
      categorias: categoriasSelecionadas,
      intensidade,
    });
  }

  return (
    <TelaConfigLocal
      titulo="faz aí"
      subtitulo="atua rápido. deixa o grupo gritar."
      onVoltar={() => navigation.goBack()}
      rodape={{
        titulo: 'começar',
        disabled: !podeIniciar,
        aviso: avisoRodape,
        onPress: aoComecar,
      }}
    >
      <SecaoConfig
        titulo="quem tá jogando?"
        subtitulo={`${nomes.length} de ${MAX_JOGADORES}`}
      >
        <CadastroJogadores
          nomes={nomes}
          onNomesChange={setNomes}
          minJogadores={MIN_JOGADORES}
          maxJogadores={MAX_JOGADORES}
        />
      </SecaoConfig>

      <SecaoConfig titulo="quanto tempo?">
        <SegmentControl
          opcoes={DURACOES}
          valor={duracao}
          onChange={setDuracao}
        />
        <Text style={estilos.ajuda}>
          {DURACOES.find((d) => d.valor === duracao)?.descricao}
        </Text>
      </SecaoConfig>

      <SecaoConfig titulo="quantas vezes cada um atua?">
        <ControladorNumerico
          valor={rodadasPorJogador}
          minimo={MIN_RODADAS}
          maximo={MAX_RODADAS}
          onChange={setRodadasPorJogador}
          sublabel={sublabelRodadas}
        />
      </SecaoConfig>

      <SecaoConfig titulo="nível de vergonha?">
        <SegmentControl
          opcoes={INTENSIDADES}
          valor={intensidade}
          onChange={setIntensidade}
        />
        <Text style={estilos.ajuda}>
          {intensidade === 'absurda'
            ? 'situações específicas demais. perigoso.'
            : intensidade === 'caotica'
              ? 'mais corpo, mais exposição, mais gritaria.'
              : intensidade === 'social'
                ? 'reconhecível sem destruir ninguém.'
                : 'o app esquenta o grupo aos poucos.'}
        </Text>
      </SecaoConfig>

      <SecaoConfig
        titulo="que tipo de cena?"
        subtitulo={
          categoriasSelecionadas === 'todas'
            ? 'todas as categorias'
            : `${categoriasSelecionadas.length} selecionadas`
        }
      >
        <View style={estilos.categoriasHeader}>
          <Pressable
            onPress={selecionarTodasCategorias}
            accessibilityRole="button"
            accessibilityLabel="Selecionar todas as categorias"
            style={({ pressed }) => [
              estilos.botaoTodas,
              categoriasSelecionadas === 'todas' && estilos.botaoTodasAtivo,
              pressed && estilos.pressionado,
            ]}
          >
            <Text
              style={[
                estilos.botaoTodasTexto,
                categoriasSelecionadas === 'todas' &&
                  estilos.botaoTodasTextoAtivo,
              ]}
            >
              misturar tudo
            </Text>
          </Pressable>
        </View>

        <View style={estilos.gradeCategorias}>
          {CATEGORIAS_FAZ_AI.map((categoria) => {
            const ativa = categoriasAtivas.includes(categoria.id);
            return (
              <Pressable
                key={categoria.id}
                onPress={() => alternarCategoria(categoria.id)}
                accessibilityRole="button"
                accessibilityLabel={`Categoria ${categoria.nome}`}
                style={({ pressed }) => [
                  estilos.categoriaCard,
                  ativa && estilos.categoriaCardAtiva,
                  pressed && estilos.pressionado,
                ]}
              >
                <Text
                  style={[
                    estilos.categoriaNome,
                    ativa && estilos.categoriaNomeAtiva,
                  ]}
                >
                  {categoria.nome}
                </Text>
                <Text style={estilos.categoriaDescricao} numberOfLines={2}>
                  {getCategoriaFazAi(categoria.id).descricao}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </SecaoConfig>
    </TelaConfigLocal>
  );
}

const COR_CATEGORIA_ATIVA_FUNDO = 'rgba(255, 90, 95, 0.08)';
const COR_CATEGORIA_ATIVA_BORDA = 'rgba(255, 90, 95, 0.45)';

const estilos = StyleSheet.create({
  ajuda: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    lineHeight: 18,
    marginTop: espacamento.sm,
  },
  botaoTodas: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: cores.superficie,
    borderColor: cores.borda,
    borderRadius: raio.pill,
    borderWidth: 1,
    minHeight: 44,
    paddingHorizontal: espacamento.md,
    paddingVertical: espacamento.sm,
  },
  botaoTodasAtivo: {
    backgroundColor: cores.texto,
    borderColor: cores.texto,
  },
  botaoTodasTexto: {
    color: cores.textoSecundario,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    fontWeight: tipografia.pesoBold,
  },
  botaoTodasTextoAtivo: {
    color: cores.fundo,
  },
  categoriaCard: {
    backgroundColor: cores.superficie,
    borderColor: cores.borda,
    borderRadius: raio.lg,
    borderWidth: 1,
    flexBasis: '48%',
    flexGrow: 1,
    gap: 4,
    minHeight: 98,
    padding: espacamento.md,
  },
  categoriaCardAtiva: {
    backgroundColor: COR_CATEGORIA_ATIVA_FUNDO,
    borderColor: COR_CATEGORIA_ATIVA_BORDA,
  },
  categoriaDescricao: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoMicro,
    lineHeight: 15,
  },
  categoriaNome: {
    color: cores.texto,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    fontWeight: tipografia.pesoExtraBold,
    lineHeight: 17,
  },
  categoriaNomeAtiva: {
    color: cores.primaria,
  },
  categoriasHeader: {
    marginBottom: espacamento.sm,
  },
  gradeCategorias: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: espacamento.sm,
  },
  pressionado: {
    opacity: 0.72,
    transform: [{ scale: 0.98 }],
  },
});
