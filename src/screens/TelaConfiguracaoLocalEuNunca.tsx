import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import {
  CombinadoDeConforto,
  SecaoConfig,
  SegmentControl,
  TelaConfigLocal,
} from '@/components';
import {
  CATEGORIAS_EU_NUNCA,
  type CategoriaEuNuncaId,
  type IntensidadeEuNunca,
} from '@/games/eu-nunca';
import type { RootStackParamList } from '@/navigation/types';
import { assegurarSessaoIniciada } from '@/session/sessionStore';
import { cores, espacamento, familias, raio, tipografia } from '@/theme/colors';
import { useState } from 'react';

type Props = NativeStackScreenProps<
  RootStackParamList,
  'ConfiguracaoLocalEuNunca'
>;

// ─── Cor de identidade do jogo ────────────────────────────────────────────────
const COR_EU_NUNCA = '#E8407A';
const COR_ATIVA_FUNDO = 'rgba(232, 64, 122, 0.08)';
const COR_ATIVA_BORDA = 'rgba(232, 64, 122, 0.45)';

const INTENSIDADES: {
  valor: IntensidadeEuNunca | 'todas';
  rotulo: string;
}[] = [
  { valor: 'todas', rotulo: 'progressivo' },
  { valor: 'leve', rotulo: 'leve' },
  { valor: 'social', rotulo: 'social' },
  { valor: 'pessoal', rotulo: 'pessoal' },
  { valor: 'caotico', rotulo: 'caótico' },
];

const DURACOES: { valor: 10 | 20 | null; rotulo: string }[] = [
  { valor: 10, rotulo: 'rápida' },
  { valor: 20, rotulo: 'completa' },
  { valor: null, rotulo: 'livre' },
];

const TODAS_CATEGORIAS: CategoriaEuNuncaId[] = CATEGORIAS_EU_NUNCA.map(
  (c) => c.id,
);

export function TelaConfiguracaoLocalEuNunca({ navigation }: Props) {
  const [intensidade, setIntensidade] = useState<IntensidadeEuNunca | 'todas'>(
    'todas',
  );
  const [categoriasSelecionadas, setCategoriasSelecionadas] = useState<
    CategoriaEuNuncaId[] | 'todas'
  >('todas');
  const [incluirMais18, setIncluirMais18] = useState(false);
  const [totalCartas, setTotalCartas] = useState<10 | 20 | null>(20);

  const categoriasAtivas =
    categoriasSelecionadas === 'todas'
      ? TODAS_CATEGORIAS
      : categoriasSelecionadas;

  const categoriaValida = categoriasAtivas.length >= 1;
  const podeIniciar = categoriaValida;
  const avisoRodape = !categoriaValida
    ? 'escolha pelo menos uma categoria'
    : undefined;

  function alternarCategoria(id: CategoriaEuNuncaId) {
    void Haptics.selectionAsync();
    if (categoriasSelecionadas === 'todas') {
      setCategoriasSelecionadas(TODAS_CATEGORIAS.filter((c) => c !== id));
      return;
    }
    const jaSelecionada = categoriasSelecionadas.includes(id);
    const proximas = jaSelecionada
      ? categoriasSelecionadas.filter((c) => c !== id)
      : [...categoriasSelecionadas, id];

    setCategoriasSelecionadas(
      proximas.length === TODAS_CATEGORIAS.length ? 'todas' : proximas,
    );
  }

  function selecionarTodas() {
    void Haptics.selectionAsync();
    setCategoriasSelecionadas('todas');
  }

  function deselecionar() {
    void Haptics.selectionAsync();
    setCategoriasSelecionadas([]);
  }

  function iniciar() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    assegurarSessaoIniciada([], 'eu-nunca');
    navigation.navigate('JogoLocalEuNunca', {
      categorias: categoriasSelecionadas,
      intensidade,
      incluirMais18,
      totalCartas,
    });
  }

  return (
    <TelaConfigLocal
      titulo="Eu Nunca"
      subtitulo="configure a sessão de confissões"
      onVoltar={() => navigation.goBack()}
      rodape={{
        titulo: 'começar',
        disabled: !podeIniciar,
        aviso: avisoRodape,
        onPress: iniciar,
      }}
    >
      {/* Intensidade */}
      <SecaoConfig titulo="qual é o clima?">
        <SegmentControl
          opcoes={INTENSIDADES}
          valor={intensidade}
          onChange={setIntensidade}
        />
        <Text style={estilos.ajuda}>
          {intensidade === 'caotico'
            ? 'confissões que podem mudar tudo.'
            : intensidade === 'pessoal'
              ? 'vulnerabilidade real. só pra quem se conhece bem.'
              : intensidade === 'social'
                ? 'exposição controlada. reconhecível por qualquer grupo.'
                : intensidade === 'leve'
                  ? 'sem julgamento. perfeito pra esquentar.'
                  : 'começa leve e vai subindo. o app controla o ritmo.'}
        </Text>
      </SecaoConfig>

      <SecaoConfig titulo="quanto tempo?">
        <SegmentControl
          opcoes={DURACOES}
          valor={totalCartas}
          onChange={setTotalCartas}
        />
        <Text style={estilos.ajuda}>
          {totalCartas === 10
            ? '10 cartas. bom para aquecer e trocar de jogo.'
            : totalCartas === 20
              ? '20 cartas. a conversa tem espaço para crescer.'
              : 'sem limite. vocês encerram quando quiserem.'}
        </Text>
      </SecaoConfig>

      {/* Categorias */}
      <SecaoConfig
        titulo="o que explorar?"
        subtitulo={
          categoriasSelecionadas === 'todas'
            ? 'todas as categorias'
            : `${categoriasAtivas.length} de ${TODAS_CATEGORIAS.length}`
        }
      >
        <View style={estilos.cabecalhoCategorias}>
          <Pressable
            onPress={selecionarTodas}
            accessibilityRole="button"
            accessibilityLabel="Selecionar todas as categorias"
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
            onPress={deselecionar}
            accessibilityRole="button"
            accessibilityLabel="Deselecionar todas"
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
          {CATEGORIAS_EU_NUNCA.map((categoria) => {
            const ativa = categoriasAtivas.includes(categoria.id);
            return (
              <Pressable
                key={categoria.id}
                onPress={() => alternarCategoria(categoria.id)}
                accessibilityRole="button"
                accessibilityLabel={`Categoria ${categoria.nome}`}
                accessibilityState={{ selected: ativa }}
                style={({ pressed }) => [
                  estilos.categoriaCard,
                  ativa && estilos.categoriaCardAtiva,
                  pressed && estilos.pressionado,
                ]}
              >
                <Text style={estilos.categoriaEmoji}>{categoria.emoji}</Text>
                <Text
                  style={[
                    estilos.categoriaNome,
                    ativa && estilos.categoriaNomeAtiva,
                  ]}
                >
                  {categoria.nome}
                </Text>
                <Text style={estilos.categoriaDescricao} numberOfLines={2}>
                  {categoria.descricao}
                </Text>
                {categoria.temMais18 && (
                  <Text style={estilos.badge18}>+18</Text>
                )}
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
              algumas categorias têm conteúdo mais pesado.{'\n'}
              ative só se o grupo for maior de 18.
            </Text>
          </View>
          <Switch
            value={incluirMais18}
            onValueChange={(valor) => {
              void Haptics.selectionAsync();
              setIncluirMais18(valor);
            }}
            trackColor={{
              false: cores.borda,
              true: COR_EU_NUNCA,
            }}
            thumbColor={cores.superficie}
            accessibilityLabel="Incluir cartas +18"
          />
        </View>
      </SecaoConfig>

      <SecaoConfig titulo="antes de começar">
        <CombinadoDeConforto texto="Vale passar qualquer carta sem explicar. Perguntar pode; pressionar, não." />
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
    backgroundColor: 'rgba(232, 64, 122, 0.12)',
    borderRadius: raio.sm,
    color: COR_EU_NUNCA,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoMicro,
    fontWeight: tipografia.pesoBold,
    marginTop: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  cabecalhoCategorias: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
    color: COR_EU_NUNCA,
  },
  chipFiltro: {
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
