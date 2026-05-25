import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useState } from 'react';

import {
  CadastroJogadores,
  SecaoConfig,
  SegmentControl,
  TelaConfigLocal,
} from '@/components';
import type { CategoriaDuvido, DificuldadeDuvido } from '@/games/duvido/types';
import { criarConfiguracaoDuvido } from '@/games/duvido/types';
import { selecionarRankings, contarElegiveisParaConfig } from '@/games/duvido/rankingSelection';
import type { RootStackParamList } from '@/navigation/types';
import { salvarGrupoRecente } from '@/services/grupoRecente';
import { assegurarSessaoIniciada } from '@/session/sessionStore';
import { cores, espacamento, familias, raio, tipografia } from '@/theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'ConfiguracaoLocalDuvido'>;

// ─── Constantes ───────────────────────────────────────────────────────────────

const MIN_JOGADORES = 3;
const MAX_JOGADORES = 12;

const CATEGORIAS: { id: CategoriaDuvido; nome: string; descricao: string }[] = [
  { id: 'futebol',     nome: 'Futebol',     descricao: 'artilheiros, títulos, transferências.' },
  { id: 'musica',      nome: 'Música',      descricao: 'álbuns, streams e artistas.' },
  { id: 'cinema',      nome: 'Cinema',      descricao: 'bilheterias, franquias e Oscars.' },
  { id: 'recordes',    nome: 'Recordes',    descricao: 'animais, países, estruturas.' },
  { id: 'brasil',      nome: 'Brasil',      descricao: 'estados, cidades, exportações.' },
  { id: 'geografia',   nome: 'Geografia',   descricao: 'países, territórios e montanhas.' },
  { id: 'cultura_pop', nome: 'Cultura Pop', descricao: 'games, Netflix e tendências.' },
  { id: 'marcas',      nome: 'Marcas',      descricao: 'marcas mais valiosas do mundo.' },
];

const TODAS_CATEGORIAS = CATEGORIAS.map((c) => c.id);

const DIFICULDADES: { valor: DificuldadeDuvido; rotulo: string; descricao: string }[] = [
  { valor: 1, rotulo: 'fácil',  descricao: 'top 5 óbvios. o grupo vai bluffar mais.' },
  { valor: 2, rotulo: 'médio',  descricao: 'conhecimento real + leitura social.' },
  { valor: 3, rotulo: 'difícil', descricao: 'ninguém sabe. todo mundo bluffa.' },
];

const NUM_RANKINGS: { valor: 1 | 3 | 5; rotulo: string }[] = [
  { valor: 1, rotulo: '1' },
  { valor: 3, rotulo: '3' },
  { valor: 5, rotulo: '5' },
];

// ─── Tela ─────────────────────────────────────────────────────────────────────

export function TelaConfiguracaoLocalDuvido({ navigation }: Props) {
  const [nomes, setNomes] = useState<string[]>([]);
  const [categoriasSelecionadas, setCategoriasSelecionadas] = useState<CategoriaDuvido[]>(
    TODAS_CATEGORIAS,
  );
  const [dificuldadeMaxima, setDificuldadeMaxima] = useState<DificuldadeDuvido>(2);
  const [numeroDeRankings, setNumeroDeRankings] = useState<1 | 3 | 5>(3);

  // Contagem de rankings elegíveis para feedback em tempo real
  const { total: totalElegiveis } = contarElegiveisParaConfig(
    categoriasSelecionadas,
    dificuldadeMaxima,
  );

  const categoriaValida = categoriasSelecionadas.length >= 1;
  const rankingsSuficientes = totalElegiveis >= numeroDeRankings;
  const podeIniciar =
    nomes.length >= MIN_JOGADORES && categoriaValida && rankingsSuficientes;

  const avisoRodape = (() => {
    if (nomes.length < MIN_JOGADORES)
      return `faltam ${MIN_JOGADORES - nomes.length} jogador${
        MIN_JOGADORES - nomes.length === 1 ? '' : 'es'
      }`;
    if (!categoriaValida) return 'escolha pelo menos uma categoria';
    if (!rankingsSuficientes)
      return `só ${totalElegiveis} ranking${totalElegiveis === 1 ? '' : 's'} disponíve${
        totalElegiveis === 1 ? 'l' : 'is'
      } — reduza o número ou mude as categorias`;
    return undefined;
  })();

  function alternarCategoria(id: CategoriaDuvido) {
    void Haptics.selectionAsync();
    const jaAtiva = categoriasSelecionadas.includes(id);
    if (jaAtiva && categoriasSelecionadas.length === 1) return; // mínimo 1
    setCategoriasSelecionadas(
      jaAtiva
        ? categoriasSelecionadas.filter((c) => c !== id)
        : [...categoriasSelecionadas, id],
    );
  }

  function selecionarTodas() {
    void Haptics.selectionAsync();
    setCategoriasSelecionadas(TODAS_CATEGORIAS);
  }

  function aoComecar() {
    if (!podeIniciar) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    void salvarGrupoRecente(nomes);

    const jogadores = nomes.map((nome, i) => ({ id: `local-${i}`, nome }));
    assegurarSessaoIniciada(jogadores, 'duvido');

    const configuracao = criarConfiguracaoDuvido(
      nomes,
      categoriasSelecionadas,
      { dificuldadeMaxima, numeroDeRankings },
    );

    const rankingsSelecionados = selecionarRankings(configuracao);

    navigation.replace('JogoLocalDuvido', { configuracao, rankingsSelecionados });
  }

  const todasSelecionadas = categoriasSelecionadas.length === TODAS_CATEGORIAS.length;

  return (
    <TelaConfigLocal
      titulo="duvido"
      subtitulo="bluff, coragem e leitura de grupo."
      onVoltar={() => navigation.goBack()}
      rodape={{
        titulo: 'começar',
        disabled: !podeIniciar,
        aviso: avisoRodape,
        onPress: aoComecar,
      }}
    >
      {/* Jogadores */}
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

      {/* Categorias */}
      <SecaoConfig
        titulo="que assuntos?"
        subtitulo={
          todasSelecionadas
            ? 'todas as categorias'
            : `${categoriasSelecionadas.length} selecionada${
                categoriasSelecionadas.length === 1 ? '' : 's'
              }`
        }
      >
        <View style={estilos.headerCategorias}>
          <Pressable
            onPress={selecionarTodas}
            accessibilityRole="button"
            accessibilityLabel="Selecionar todas as categorias"
            style={({ pressed }) => [
              estilos.botaoTodas,
              todasSelecionadas && estilos.botaoTodasAtivo,
              pressed && estilos.pressionado,
            ]}
          >
            <Text
              style={[
                estilos.botaoTodasTexto,
                todasSelecionadas && estilos.botaoTodasTextoAtivo,
              ]}
            >
              misturar tudo
            </Text>
          </Pressable>
          {totalElegiveis > 0 && (
            <Text style={estilos.totalRankings}>
              {totalElegiveis} ranking{totalElegiveis === 1 ? '' : 's'}
            </Text>
          )}
        </View>

        <View style={estilos.gradeCategorias}>
          {CATEGORIAS.map((cat) => {
            const ativa = categoriasSelecionadas.includes(cat.id);
            return (
              <Pressable
                key={cat.id}
                onPress={() => alternarCategoria(cat.id)}
                accessibilityRole="button"
                accessibilityLabel={`Categoria ${cat.nome}`}
                style={({ pressed }) => [
                  estilos.categoriaCard,
                  ativa && estilos.categoriaCardAtiva,
                  pressed && estilos.pressionado,
                ]}
              >
                <Text
                  style={[estilos.categoriaNome, ativa && estilos.categoriaNomeAtiva]}
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

      {/* Dificuldade */}
      <SecaoConfig titulo="nível de dificuldade?">
        <SegmentControl
          opcoes={DIFICULDADES}
          valor={dificuldadeMaxima}
          onChange={setDificuldadeMaxima}
        />
        <Text style={estilos.ajuda}>
          {DIFICULDADES.find((d) => d.valor === dificuldadeMaxima)?.descricao}
        </Text>
      </SecaoConfig>

      {/* Número de rankings */}
      <SecaoConfig titulo="quantos rankings?">
        <SegmentControl
          opcoes={NUM_RANKINGS}
          valor={numeroDeRankings}
          onChange={setNumeroDeRankings}
        />
        <Text style={estilos.ajuda}>
          {numeroDeRankings === 1
            ? 'uma rodada rápida. ótimo pra testar.'
            : numeroDeRankings === 3
              ? 'sessão padrão. equilibrada.'
              : 'sessão longa. o grupo vai suar.'}
        </Text>
      </SecaoConfig>
    </TelaConfigLocal>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const COR_ATIVA_FUNDO = 'rgba(255, 90, 95, 0.08)';
const COR_ATIVA_BORDA = 'rgba(255, 90, 95, 0.45)';

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
    minHeight: 88,
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
  gradeCategorias: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: espacamento.sm,
  },
  headerCategorias: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: espacamento.sm,
  },
  pressionado: {
    opacity: 0.72,
    transform: [{ scale: 0.98 }],
  },
  totalRankings: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
  },
});
