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
  CATEGORIAS_VD,
  type CategoriaVDId,
  type IntensidadeVD,
} from '@/games/verdade-desafio';
import type { RootStackParamList } from '@/navigation/types';
import { assegurarSessaoIniciada } from '@/session/sessionStore';
import { salvarGrupoRecente } from '@/services/grupoRecente';
import { cores, espacamento, familias, raio, tipografia } from '@/theme/colors';

type Props = NativeStackScreenProps<
  RootStackParamList,
  'ConfiguracaoLocalVerdadeDesafio'
>;

// ─── Identidade visual do jogo ────────────────────────────────────────────────
const COR_VD = '#6366F1'; // índigo — neutro entre verdade e desafio
const COR_ATIVA_FUNDO = 'rgba(99, 102, 241, 0.08)';
const COR_ATIVA_BORDA = 'rgba(99, 102, 241, 0.40)';
const COR_BADGE_FUNDO = 'rgba(99, 102, 241, 0.10)';

const MIN_JOGADORES = 2;
const MAX_JOGADORES = 10;

const INTENSIDADES: { valor: IntensidadeVD | 'todas'; rotulo: string }[] = [
  { valor: 'todas', rotulo: 'progressivo' },
  { valor: 'leve', rotulo: 'leve' },
  { valor: 'social', rotulo: 'social' },
  { valor: 'pesado', rotulo: 'pesado' },
  { valor: 'caotico', rotulo: 'caótico' },
];
const VOLTAS: { valor: 1 | 2 | 3; rotulo: string }[] = [
  { valor: 1, rotulo: '1 volta' },
  { valor: 2, rotulo: '2 voltas' },
  { valor: 3, rotulo: '3 voltas' },
];

// Categorias de verdade e desafio separadas para o toggle visual
const CATS_VERDADE = CATEGORIAS_VD.filter(
  (c) => c.tipo === 'verdade' || c.tipo === 'ambos',
);
const CATS_DESAFIO = CATEGORIAS_VD.filter(
  (c) => c.tipo === 'desafio' || c.tipo === 'ambos',
);
const TODAS_IDS: CategoriaVDId[] = CATEGORIAS_VD.map((c) => c.id);

export function TelaConfiguracaoLocalVerdadeDesafio({ navigation }: Props) {
  const [nomes, setNomes] = useState<string[]>([]);
  const [intensidade, setIntensidade] = useState<IntensidadeVD | 'todas'>(
    'todas',
  );
  const [categoriasSelecionadas, setCategoriasSelecionadas] = useState<
    CategoriaVDId[] | 'todas'
  >('todas');
  const [incluirMais18, setIncluirMais18] = useState(false);
  const [voltas, setVoltas] = useState<1 | 2 | 3>(2);

  const categoriasAtivas =
    categoriasSelecionadas === 'todas' ? TODAS_IDS : categoriasSelecionadas;
  const temVerdadeAtiva = CATS_VERDADE.some((c) =>
    categoriasAtivas.includes(c.id),
  );
  const temDesafioAtivo = CATS_DESAFIO.some((c) =>
    categoriasAtivas.includes(c.id),
  );

  const podeIniciar =
    nomes.length >= MIN_JOGADORES && temVerdadeAtiva && temDesafioAtivo;

  const avisoRodape =
    nomes.length < MIN_JOGADORES
      ? `faltam ${MIN_JOGADORES - nomes.length} jogador${MIN_JOGADORES - nomes.length === 1 ? '' : 'es'}`
      : !temVerdadeAtiva
        ? 'selecione pelo menos uma categoria de verdade'
        : !temDesafioAtivo
          ? 'selecione pelo menos um tipo de desafio'
          : undefined;

  function alternarCategoria(id: CategoriaVDId) {
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
    const jogadores = nomes.map((nome, i) => ({ id: `jogador-${i}`, nome }));
    await salvarGrupoRecente(nomes);
    assegurarSessaoIniciada(jogadores, 'verdade-desafio');
    navigation.navigate('JogoLocalVerdadeDesafio', {
      jogadores,
      intensidade,
      categorias: categoriasSelecionadas,
      incluirMais18,
      voltas,
    });
  }

  return (
    <TelaConfigLocal
      titulo="Verdade ou Desafio"
      subtitulo="configure a rodada"
      onVoltar={() => navigation.goBack()}
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
            ? 'improviso sem filtro e histórias para grupos bem à vontade.'
            : intensidade === 'pesado'
              ? 'histórias mais pessoais. melhor entre pessoas próximas.'
              : intensidade === 'social'
                ? 'exposição moderada. todo grupo aguenta.'
                : intensidade === 'leve'
                  ? 'sem julgamento. ótimo pra esquentar.'
                  : 'começa leve e vai subindo. o app controla o ritmo.'}
        </Text>
      </SecaoConfig>

      <SecaoConfig titulo="quantas voltas?">
        <SegmentControl opcoes={VOLTAS} valor={voltas} onChange={setVoltas} />
        <Text style={estilos.ajuda}>
          {voltas === 1
            ? 'todo mundo joga uma vez. rápido e leve.'
            : `${voltas} turnos para cada pessoa, seguindo a ordem da roda.`}
        </Text>
      </SecaoConfig>

      {/* Categorias de Verdade */}
      <SecaoConfig
        titulo="perguntas de verdade"
        subtitulo={
          categoriasSelecionadas === 'todas'
            ? 'todas'
            : `${CATS_VERDADE.filter((c) => categoriasAtivas.includes(c.id)).length} de ${CATS_VERDADE.length}`
        }
      >
        <View style={estilos.gradeCategorias}>
          {CATS_VERDADE.map((cat) => {
            const ativa = categoriasAtivas.includes(cat.id);
            return (
              <Pressable
                key={cat.id}
                onPress={() => alternarCategoria(cat.id)}
                accessibilityRole="button"
                accessibilityLabel={`Categoria de verdade ${cat.nome}`}
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

      {/* Categorias de Desafio */}
      <SecaoConfig
        titulo="tipos de desafio"
        subtitulo={
          categoriasSelecionadas === 'todas'
            ? 'todos'
            : `${CATS_DESAFIO.filter((c) => categoriasAtivas.includes(c.id)).length} de ${CATS_DESAFIO.length}`
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
          {CATS_DESAFIO.map((cat) => {
            const ativa = categoriasAtivas.includes(cat.id);
            return (
              <Pressable
                key={cat.id}
                onPress={() => alternarCategoria(cat.id)}
                accessibilityRole="button"
                accessibilityLabel={`Tipo de desafio ${cat.nome}`}
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
              </Pressable>
            );
          })}
        </View>
      </SecaoConfig>

      {/* +18 toggle */}
      <SecaoConfig titulo="conteúdo adulto">
        <View style={estilos.linhaSwitch}>
          <View style={estilos.switchTextos}>
            <Text style={estilos.switchLabel}>incluir cartas +18</Text>
            <Text style={estilos.switchDescricao}>
              algumas verdades ficam mais pesadas.{'\n'}
              ative só se o grupo for maior de 18.
            </Text>
          </View>
          <Switch
            value={incluirMais18}
            onValueChange={(v) => {
              void Haptics.selectionAsync();
              setIncluirMais18(v);
            }}
            trackColor={{ false: cores.borda, true: COR_VD }}
            thumbColor={cores.superficie}
            accessibilityLabel="Incluir cartas +18"
          />
        </View>
      </SecaoConfig>

      <SecaoConfig titulo="antes de começar">
        <CombinadoDeConforto texto="Passar é sempre permitido e sem penalidade. Nada de expor celular, tocar alguém ou envolver terceiros sem consentimento." />
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
    color: COR_VD,
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
    color: COR_VD,
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
