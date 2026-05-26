import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import {
  CadastroJogadores,
  CombinadoDeConforto,
  SecaoConfig,
  SegmentControl,
  TelaConfigLocal,
} from '@/components';
import {
  CATEGORIAS_QNS,
  type CategoriaQNSId,
  type IntensidadeQNS,
} from '@/games/quem-na-sala';
import type { RootStackParamList } from '@/navigation/types';
import { assegurarSessaoIniciada } from '@/session/sessionStore';
import { salvarGrupoRecente } from '@/services/grupoRecente';
import { cores, espacamento, familias, raio, tipografia } from '@/theme/colors';

type Props = NativeStackScreenProps<
  RootStackParamList,
  'ConfiguracaoLocalQuemNaSala'
>;

// ─── Identidade visual do jogo ────────────────────────────────────────────────
const COR_QNS = '#F59E0B'; // âmbar — holofote, revelação
const COR_ATIVA_FUNDO = 'rgba(245, 158, 11, 0.08)';
const COR_ATIVA_BORDA = 'rgba(245, 158, 11, 0.40)';
const COR_BADGE_FUNDO = 'rgba(245, 158, 11, 0.12)';

const MIN_JOGADORES = 4;
const MAX_JOGADORES = 8;

const INTENSIDADES: { valor: IntensidadeQNS | 'todas'; rotulo: string }[] = [
  { valor: 'todas', rotulo: 'progressivo' },
  { valor: 'leve', rotulo: 'leve' },
  { valor: 'social', rotulo: 'social' },
  { valor: 'pesado', rotulo: 'pesado' },
  { valor: 'caotico', rotulo: 'caótico' },
];
const DURACOES: { valor: 5 | 8 | 12; rotulo: string }[] = [
  { valor: 5, rotulo: 'rápida' },
  { valor: 8, rotulo: 'normal' },
  { valor: 12, rotulo: 'longa' },
];

const TODAS_IDS: CategoriaQNSId[] = CATEGORIAS_QNS.map((c) => c.id);

export function TelaConfiguracaoLocalQuemNaSala({ navigation }: Props) {
  const [nomes, setNomes] = useState<string[]>([]);
  const [intensidade, setIntensidade] = useState<IntensidadeQNS | 'todas'>(
    'todas',
  );
  const [categoriasSelecionadas, setCategoriasSelecionadas] = useState<
    CategoriaQNSId[] | 'todas'
  >('todas');
  const [incluirMais18, setIncluirMais18] = useState(false);
  const [totalPerguntas, setTotalPerguntas] = useState<5 | 8 | 12>(8);

  const categoriasAtivas =
    categoriasSelecionadas === 'todas' ? TODAS_IDS : categoriasSelecionadas;

  const podeIniciar =
    nomes.length >= MIN_JOGADORES && categoriasAtivas.length >= 1;

  const avisoRodape =
    nomes.length < MIN_JOGADORES
      ? `mínimo ${MIN_JOGADORES} jogadores (faltam ${MIN_JOGADORES - nomes.length})`
      : categoriasAtivas.length === 0
        ? 'escolha pelo menos uma categoria'
        : undefined;

  function alternarCategoria(id: CategoriaQNSId) {
    void Haptics.selectionAsync();
    if (categoriasSelecionadas === 'todas') {
      setCategoriasSelecionadas(TODAS_IDS.filter((c) => c !== id));
      return;
    }
    const jaSel = categoriasSelecionadas.includes(id);
    const proximas = jaSel
      ? categoriasSelecionadas.filter((c) => c !== id)
      : [...categoriasSelecionadas, id];
    setCategoriasSelecionadas(
      proximas.length === TODAS_IDS.length ? 'todas' : proximas,
    );
  }

  function selecionarTodas() {
    void Haptics.selectionAsync();
    setCategoriasSelecionadas('todas');
  }

  function limpar() {
    void Haptics.selectionAsync();
    setCategoriasSelecionadas([]);
  }

  async function iniciar() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const jogadores = nomes.map((nome, i) => ({ id: `j-${i}`, nome }));
    await salvarGrupoRecente(nomes);
    assegurarSessaoIniciada(jogadores, 'quem-na-sala');
    navigation.navigate('JogoLocalQuemNaSala', {
      jogadores,
      intensidade,
      categorias: categoriasSelecionadas,
      incluirMais18,
      totalPerguntas,
    });
  }

  return (
    <TelaConfigLocal
      titulo="Quem na Sala?"
      subtitulo="votação anônima — todos escolhem, ninguém sabe quem votou"
      onVoltar={() => navigation.goBack()}
      tituloMultilinha
      rodape={{
        titulo: 'começar',
        disabled: !podeIniciar,
        aviso: avisoRodape,
        onPress: iniciar,
      }}
    >
      {/* Jogadores */}
      <SecaoConfig titulo="quem vai jogar?">
        <CadastroJogadores
          nomes={nomes}
          onNomesChange={setNomes}
          minJogadores={MIN_JOGADORES}
          maxJogadores={MAX_JOGADORES}
        />
      </SecaoConfig>

      {/* Intensidade */}
      <SecaoConfig titulo="qual é o clima?">
        <SegmentControl
          opcoes={INTENSIDADES}
          valor={intensidade}
          onChange={setIntensidade}
        />
        <Text style={estilos.ajuda}>
          {intensidade === 'caotico'
            ? 'perguntas imprevisíveis para grupos que gostam de rir de si.'
            : intensidade === 'pesado'
              ? 'leituras pessoais. melhor para grupos que se conhecem bem.'
              : intensidade === 'social'
                ? 'exposição controlada. qualquer grupo aguenta.'
                : intensidade === 'leve'
                  ? 'elogios e observações. perfeito pra começar.'
                  : 'começa com elogios e vai subindo a tensão. o app controla.'}
        </Text>
      </SecaoConfig>

      <SecaoConfig titulo="quantas perguntas?">
        <SegmentControl
          opcoes={DURACOES}
          valor={totalPerguntas}
          onChange={setTotalPerguntas}
        />
        <Text style={estilos.ajuda}>
          {totalPerguntas} votações · no modo de um celular, funciona melhor com
          até 8 pessoas.
        </Text>
      </SecaoConfig>

      {/* Categorias */}
      <SecaoConfig
        titulo="que tipo de pergunta?"
        subtitulo={
          categoriasSelecionadas === 'todas'
            ? 'todas'
            : `${categoriasAtivas.length} de ${TODAS_IDS.length}`
        }
      >
        <View style={estilos.cabecalhoCats}>
          <Pressable
            onPress={selecionarTodas}
            accessibilityRole="button"
            accessibilityLabel="Selecionar todas as categorias"
            accessibilityState={{
              selected: categoriasSelecionadas === 'todas',
            }}
            style={({ pressed }) => [
              estilos.chipFiltro,
              categoriasSelecionadas === 'todas' && estilos.chipFiltroAtivo,
              pressed && estilos.pressionado,
            ]}
          >
            <Text
              style={[
                estilos.chipFiltroTexto,
                categoriasSelecionadas === 'todas' &&
                  estilos.chipFiltroTextoAtivo,
              ]}
            >
              misturar tudo
            </Text>
          </Pressable>
          <Pressable
            onPress={limpar}
            accessibilityRole="button"
            accessibilityLabel="Deselecionar todas as categorias"
            accessibilityState={{
              selected:
                categoriasSelecionadas !== 'todas' &&
                categoriasAtivas.length === 0,
            }}
            style={({ pressed }) => [
              estilos.chipFiltro,
              categoriasSelecionadas !== 'todas' &&
                categoriasAtivas.length === 0 &&
                estilos.chipFiltroAtivo,
              pressed && estilos.pressionado,
            ]}
          >
            <Text
              style={[
                estilos.chipFiltroTexto,
                categoriasSelecionadas !== 'todas' &&
                  categoriasAtivas.length === 0 &&
                  estilos.chipFiltroTextoAtivo,
              ]}
            >
              limpar
            </Text>
          </Pressable>
        </View>

        <View style={estilos.gradeCategorias}>
          {CATEGORIAS_QNS.map((cat) => {
            const ativa = categoriasAtivas.includes(cat.id);
            return (
              <Pressable
                key={cat.id}
                onPress={() => alternarCategoria(cat.id)}
                accessibilityRole="button"
                accessibilityLabel={`Categoria ${cat.nome}`}
                accessibilityState={{ selected: ativa }}
                style={({ pressed }) => [
                  estilos.categoriaCard,
                  ativa && estilos.categoriaCardAtiva,
                  pressed && estilos.pressionado,
                ]}
              >
                <Text style={estilos.categoriaEmoji}>{cat.emoji}</Text>
                <Text
                  style={[
                    estilos.categoriaNome,
                    ativa && estilos.categoriaNomeAtiva,
                  ]}
                >
                  {cat.nome}
                </Text>
                <Text style={estilos.categoriaDescricao} numberOfLines={2}>
                  {cat.descricao}
                </Text>
                {cat.temMais18 && <Text style={estilos.badge18}>+18</Text>}
              </Pressable>
            );
          })}
        </View>
      </SecaoConfig>

      {/* +18 */}
      <SecaoConfig titulo="conteúdo adulto">
        <View style={estilos.linhaSwitch}>
          <View style={estilos.switchTextos}>
            <Text style={estilos.switchLabel}>incluir perguntas +18</Text>
            <Text style={estilos.switchDescricao}>
              algumas categorias têm conteúdo mais pesado.{'\n'}
              ative só se o grupo for maior de 18.
            </Text>
          </View>
          <Switch
            value={incluirMais18}
            onValueChange={(v) => {
              void Haptics.selectionAsync();
              setIncluirMais18(v);
            }}
            trackColor={{ false: cores.borda, true: COR_QNS }}
            thumbColor={cores.superficie}
            accessibilityLabel="Incluir perguntas +18"
          />
        </View>
      </SecaoConfig>

      <SecaoConfig titulo="antes de começar">
        <CombinadoDeConforto texto="Qualquer pergunta pode ser pulada antes da votação. O voto é secreto; o respeito é do grupo todo." />
      </SecaoConfig>
    </TelaConfigLocal>
  );
}

const estilos = StyleSheet.create({
  ajuda: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    lineHeight: 18,
    marginTop: espacamento.sm,
  },
  badge18: {
    alignSelf: 'flex-start',
    backgroundColor: COR_BADGE_FUNDO,
    borderRadius: raio.sm,
    color: COR_QNS,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoMicro,
    fontWeight: tipografia.pesoBold,
    marginTop: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  cabecalhoCats: {
    flexDirection: 'row',
    gap: espacamento.sm,
    marginBottom: espacamento.sm,
  },
  categoriaCard: {
    backgroundColor: cores.superficie,
    borderColor: cores.borda,
    borderRadius: raio.lg,
    borderWidth: 1,
    flexBasis: '48%',
    flexGrow: 1,
    gap: 3,
    minHeight: 100,
    padding: espacamento.md,
  },
  categoriaCardAtiva: {
    backgroundColor: COR_ATIVA_FUNDO,
    borderColor: COR_ATIVA_BORDA,
  },
  categoriaDescricao: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoMicro,
    lineHeight: 15,
  },
  categoriaEmoji: {
    fontSize: 20,
    marginBottom: 2,
  },
  categoriaNome: {
    color: cores.texto,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    fontWeight: tipografia.pesoExtraBold,
    lineHeight: 17,
  },
  categoriaNomeAtiva: {
    color: COR_QNS,
  },
  chipFiltro: {
    alignItems: 'center',
    backgroundColor: cores.superficie,
    borderColor: cores.borda,
    borderRadius: raio.pill,
    borderWidth: 1,
    minHeight: 44,
    paddingHorizontal: espacamento.md,
    paddingVertical: espacamento.sm,
  },
  chipFiltroAtivo: {
    backgroundColor: cores.texto,
    borderColor: cores.texto,
  },
  chipFiltroTexto: {
    color: cores.textoSecundario,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    fontWeight: tipografia.pesoBold,
  },
  chipFiltroTextoAtivo: {
    color: cores.fundo,
  },
  gradeCategorias: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: espacamento.sm,
  },
  linhaSwitch: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: espacamento.md,
  },
  pressionado: {
    opacity: 0.72,
    transform: [{ scale: 0.98 }],
  },
  switchDescricao: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoMicro,
    lineHeight: 15,
    marginTop: 2,
  },
  switchLabel: {
    color: cores.texto,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpo,
    fontWeight: tipografia.pesoBold,
  },
  switchTextos: {
    flex: 1,
  },
});
