import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  CadastroJogadores,
  ControladorNumerico,
  SecaoConfig,
  SegmentControl,
  TelaConfigLocal,
} from '@/components';
import type { Player } from '@/engine/types';
import { LISTA_CATEGORIAS } from '@/games/mr-white/categorias';
import type {
  CategoriaId,
  Dificuldade,
  DificuldadeParPalavras,
  OpcoesMrWhite,
} from '@/games/mr-white/types';
import type { RootStackParamList } from '@/navigation/types';
import { salvarGrupoRecente } from '@/services/grupoRecente';
import { inicializarJogoLocal } from '@/services/jogoLocal';
import { assegurarSessaoIniciada } from '@/session/sessionStore';
import { cores, espacamento, familias, raio, tipografia } from '@/theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'ConfiguracaoLocal'>;

const MIN_MR_WHITES = 1;
const MAX_MR_WHITES = 3;
const MIN_JOGADORES = 3;
const MAX_JOGADORES = 12;

const COR_CATEGORIA_ATIVA_FUNDO = 'rgba(201, 137, 58, 0.10)';
const COR_SORTEAR_PRESSIONADO = 'rgba(201, 137, 58, 0.12)';

const OPCOES_MODO = [
  { valor: 'classico' as const, rotulo: 'clássico' },
  { valor: 'dual' as const, rotulo: 'dual word' },
];

const OPCOES_PROXIMIDADE = [
  { valor: 'leve' as const, rotulo: 'leve' },
  { valor: 'media' as const, rotulo: 'médio' },
  { valor: 'hard' as const, rotulo: 'difícil' },
  { valor: 'insana' as const, rotulo: 'insano' },
];

const OPCOES_DIFICULDADE = [
  { valor: 'facil' as const, rotulo: 'fácil' },
  { valor: 'medio' as const, rotulo: 'médio' },
  { valor: 'dificil' as const, rotulo: 'difícil' },
];

function emPares<T>(arr: T[]): [T, T | null][] {
  const resultado: [T, T | null][] = [];
  for (let i = 0; i < arr.length; i += 2) {
    resultado.push([arr[i]!, arr[i + 1] ?? null]);
  }
  return resultado;
}

export function TelaConfiguracaoLocal({ navigation }: Props) {
  const [nomes, setNomes] = useState<string[]>([]);
  const [categoriaId, setCategoriaId] = useState<CategoriaId>('comidas');
  const [dificuldade, setDificuldade] = useState<Dificuldade>('medio');
  const [modo, setModo] = useState<'classico' | 'dual'>('classico');
  const [dificuldadePar, setDificuldadePar] =
    useState<DificuldadeParPalavras>('media');
  const [numMrWhites, setNumMrWhites] = useState(1);
  const [iniciando, setIniciando] = useState(false);

  const podeIniciar = nomes.length >= MIN_JOGADORES && !iniciando;

  function sortearCategoria() {
    const disponiveis = LISTA_CATEGORIAS.filter((c) => c.id !== categoriaId);
    const sorteada =
      disponiveis[Math.floor(Math.random() * disponiveis.length)];
    if (sorteada) {
      setCategoriaId(sorteada.id);
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }

  function aoComecar() {
    if (!podeIniciar) return;
    setIniciando(true);
    void salvarGrupoRecente(nomes);
    const agora = Date.now();
    const jogadores: Player[] = nomes.map((nome, i) => ({
      id: `local-${i}`,
      nome,
      papelSecreto: null,
      ehAnfitriao: i === 0,
      estaConectado: true,
      entrouEm: agora + i,
    }));
    assegurarSessaoIniciada(jogadores, 'mrwhite');
    const opcoes: OpcoesMrWhite = {
      categoriaId,
      dificuldade,
      numeroMrWhites: numMrWhites,
      duracaoTurnoSegundos: 60,
      modoDualWord: modo === 'dual',
      dificuldadePar,
    };
    inicializarJogoLocal('mrwhite', jogadores, opcoes);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    navigation.replace('JogoLocal');
  }

  const categoriaAtiva = LISTA_CATEGORIAS.find((c) => c.id === categoriaId);
  const modoDualWord = modo === 'dual';
  const avisoRodape =
    nomes.length < MIN_JOGADORES
      ? `faltam ${MIN_JOGADORES - nomes.length} jogador${
          MIN_JOGADORES - nomes.length === 1 ? '' : 'es'
        }`
      : undefined;

  return (
    <TelaConfigLocal
      titulo="mr white"
      subtitulo="montem o grupo, escolham o tema."
      onVoltar={() => navigation.goBack()}
      rodape={{
        titulo: 'começa aí',
        carregando: iniciando,
        disabled: !podeIniciar,
        aviso: avisoRodape,
        onPress: aoComecar,
      }}
    >
      {/* ── 1. Jogadores ── */}
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

      {/* ── 2. Categoria ── */}
      <SecaoConfig titulo="sobre o quê?">
        {categoriaAtiva && (
          <View style={estilos.categoriaAtivaBadge}>
            <Text style={estilos.categoriaAtivaEmoji}>
              {categoriaAtiva.emoji}
            </Text>
            <Text style={estilos.categoriaAtivaTexto}>
              {categoriaAtiva.nome}
            </Text>
          </View>
        )}

        <View style={estilos.categoriaGrid}>
          {emPares(LISTA_CATEGORIAS).map(([a, b], i) => (
            <View key={i} style={estilos.categoriaLinha}>
              <CategoriaCard
                categoria={a}
                ativo={a.id === categoriaId}
                onPress={() => setCategoriaId(a.id)}
              />
              {b ? (
                <CategoriaCard
                  categoria={b}
                  ativo={b.id === categoriaId}
                  onPress={() => setCategoriaId(b.id)}
                />
              ) : (
                <View style={estilos.categoriaCardVazio} />
              )}
            </View>
          ))}
        </View>

        <Pressable
          onPress={sortearCategoria}
          style={({ pressed }) => [
            estilos.botaoSortear,
            pressed && estilos.botaoSortearPressionado,
          ]}
        >
          <Text style={estilos.botaoSortearTexto}>sortear categoria</Text>
        </Pressable>
      </SecaoConfig>

      {/* ── 3. Modo ── */}
      <SecaoConfig titulo="como funciona?">
        <SegmentControl opcoes={OPCOES_MODO} valor={modo} onChange={setModo} />
        <Text style={estilos.ajuda}>
          {modoDualWord
            ? 'mr white recebe palavra parecida — mais difícil de desmascarar.'
            : 'mr white não recebe palavra — deve blefar do zero.'}
        </Text>
      </SecaoConfig>

      {/* ── 4. Proximidade (Dual Word) ── */}
      {modoDualWord && (
        <SecaoConfig titulo="quão parecidas as palavras?">
          <SegmentControl
            opcoes={OPCOES_PROXIMIDADE}
            valor={dificuldadePar}
            onChange={setDificuldadePar}
          />
          <Text style={estilos.ajuda}>
            {dificuldadePar === 'leve' &&
              'palavras bem diferentes — fácil de perceber'}
            {dificuldadePar === 'media' &&
              'alguma semelhança — ambiguidade moderada'}
            {dificuldadePar === 'hard' &&
              'muito próximas — leitura social necessária'}
            {dificuldadePar === 'insana' &&
              'quase a mesma coisa — paranoia total'}
          </Text>
        </SecaoConfig>
      )}

      {/* ── 5. Dificuldade (Clássico) ── */}
      {!modoDualWord && (
        <SecaoConfig titulo="que nível?">
          <SegmentControl
            opcoes={OPCOES_DIFICULDADE}
            valor={dificuldade}
            onChange={setDificuldade}
          />
          <Text style={estilos.ajuda}>
            quão parecidas são as pistas do impostor com as dos civis.
          </Text>
        </SecaoConfig>
      )}

      {/* ── 6. Impostores ── */}
      <SecaoConfig titulo="quantos impostores?">
        <ControladorNumerico
          valor={numMrWhites}
          minimo={MIN_MR_WHITES}
          maximo={MAX_MR_WHITES}
          onChange={setNumMrWhites}
        />
        <Text style={estilos.ajuda}>
          quanto mais impostores, mais difícil para os civis.
        </Text>
      </SecaoConfig>
    </TelaConfigLocal>
  );
}

// ─── Sub-componente local: grade de categorias ────────────────────────────────

interface CategoriaCardProps {
  categoria: { id: CategoriaId; emoji: string; nome: string };
  ativo: boolean;
  onPress: () => void;
}

function CategoriaCard({ categoria, ativo, onPress }: CategoriaCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        estilos.categoriaCard,
        ativo && estilos.categoriaCardAtivo,
        pressed && !ativo && estilos.categoriaCardPressionado,
      ]}
      accessibilityRole="radio"
      accessibilityState={{ checked: ativo }}
    >
      <Text style={estilos.categoriaCardEmoji}>{categoria.emoji}</Text>
      <Text
        style={[
          estilos.categoriaCardNome,
          ativo && estilos.categoriaCardNomeAtivo,
        ]}
        numberOfLines={1}
      >
        {categoria.nome}
      </Text>
    </Pressable>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const estilos = StyleSheet.create({
  ajuda: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCaption,
    marginTop: espacamento.sm,
    textAlign: 'center',
  },

  // ── Categoria ──
  categoriaAtivaBadge: {
    alignItems: 'center',
    backgroundColor: cores.superficieElevada,
    borderColor: cores.acento,
    borderRadius: raio.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: espacamento.sm,
    marginBottom: espacamento.md,
    paddingHorizontal: espacamento.md,
    paddingVertical: espacamento.sm + 2,
  },
  categoriaAtivaEmoji: { fontSize: 22 },
  categoriaAtivaTexto: {
    color: cores.acento,
    fontFamily: familias.sans,
    fontWeight: '800' as const,
    fontSize: tipografia.tamanhoSubtitulo,
  },
  categoriaGrid: { gap: espacamento.sm },
  categoriaLinha: { flexDirection: 'row', gap: espacamento.sm },
  categoriaCard: {
    alignItems: 'center',
    backgroundColor: cores.superficie,
    borderColor: cores.borda,
    borderRadius: raio.md,
    borderWidth: 1,
    flex: 1,
    gap: espacamento.xs,
    paddingHorizontal: espacamento.sm,
    paddingVertical: espacamento.md,
  },
  categoriaCardAtivo: {
    backgroundColor: COR_CATEGORIA_ATIVA_FUNDO,
    borderColor: cores.acento,
  },
  categoriaCardEmoji: { fontSize: 24 },
  categoriaCardNome: {
    color: cores.textoSecundario,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    fontWeight: tipografia.pesoSemibold,
    textAlign: 'center',
  },
  categoriaCardNomeAtivo: { color: cores.acento },
  categoriaCardPressionado: { opacity: 0.7 },
  categoriaCardVazio: { flex: 1 },
  botaoSortear: {
    alignItems: 'center',
    alignSelf: 'center',
    borderColor: cores.acento,
    borderRadius: raio.pill,
    borderWidth: 1,
    marginTop: espacamento.md,
    paddingHorizontal: espacamento.lg,
    paddingVertical: espacamento.sm + 2,
  },
  botaoSortearPressionado: {
    backgroundColor: COR_SORTEAR_PRESSIONADO,
    transform: [{ scale: 0.97 }],
  },
  botaoSortearTexto: {
    color: cores.acento,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpoMenor,
    fontWeight: tipografia.pesoSemibold,
    letterSpacing: 0.3,
  },
});
