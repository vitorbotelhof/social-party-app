import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  CadastroJogadores,
  ControladorNumerico,
  SecaoConfig,
  SegmentControl,
  TelaConfigLocal,
} from '@/components';
import type { CategoriaIdNPL } from '@/games/na-ponta-da-lingua/types';
import type { RootStackParamList } from '@/navigation/types';
import { salvarGrupoRecente } from '@/services/grupoRecente';
import { assegurarSessaoIniciada } from '@/session/sessionStore';
import { cores, espacamento, familias, raio, tipografia } from '@/theme/colors';

type Props = NativeStackScreenProps<
  RootStackParamList,
  'ConfiguracaoLocalNaPontaDaLingua'
>;

const MIN_JOGADORES = 2;
const MAX_JOGADORES = 10;
const MIN_RODADAS = 1;
const MAX_RODADAS = 8;

const COR_ALERTA_SUAVE = 'rgba(232,106,90,0.8)';
const COR_TIME_A_FUNDO = 'rgba(201,137,58,0.08)';
const COR_TIME_A_BORDA = 'rgba(201,137,58,0.3)';
const COR_TIME_B_FUNDO = 'rgba(160,82,45,0.08)';
const COR_TIME_B_BORDA = 'rgba(160,82,45,0.3)';

const DURACOES: { valor: 45 | 60 | 90; rotulo: string; descricao: string }[] = [
  { valor: 45, rotulo: '45s', descricao: 'rápido e cruel.' },
  { valor: 60, rotulo: '60s', descricao: 'ritmo ideal.' },
  { valor: 90, rotulo: '90s', descricao: 'mais fôlego.' },
];

const DIFICULDADES: {
  valor: 'facil' | 'medio' | 'dificil' | 'colapso' | 'todas';
  rotulo: string;
}[] = [
  { valor: 'todas', rotulo: 'todas' },
  { valor: 'facil', rotulo: 'fácil' },
  { valor: 'medio', rotulo: 'médio' },
  { valor: 'dificil', rotulo: 'difícil' },
  { valor: 'colapso', rotulo: 'colapso' },
];

const CATEGORIAS: { valor: CategoriaIdNPL; rotulo: string }[] = [
  { valor: 'internet_br', rotulo: 'Internet BR' },
  { valor: 'cotidiano', rotulo: 'Cotidiano' },
  { valor: 'comida', rotulo: 'Comida' },
  { valor: 'cultura_pop', rotulo: 'Cultura Pop' },
  { valor: 'objetos', rotulo: 'Objetos' },
  { valor: 'profissoes', rotulo: 'Profissões' },
  { valor: 'festas', rotulo: 'Festas' },
  { valor: 'relacionamentos', rotulo: 'Relacionamentos' },
  { valor: 'lugares', rotulo: 'Lugares' },
  { valor: 'brasil', rotulo: 'Brasil' },
  { valor: 'traumas_millennials', rotulo: 'Traumas Millennials' },
  { valor: 'memes_br', rotulo: 'Memes BR' },
  { valor: 'vida_adulta', rotulo: 'Vida Adulta' },
  { valor: 'date_ruim', rotulo: 'Date Ruim' },
  { valor: 'escritorio', rotulo: 'Escritório' },
  { valor: 'universidade', rotulo: 'Universidade' },
  { valor: 'carnaval', rotulo: 'Carnaval' },
  { valor: 'reality_shows', rotulo: 'Reality Shows' },
  { valor: 'celebridades_br', rotulo: 'Celebridades BR' },
  { valor: 'colapso_br', rotulo: 'Colapso BR' },
  { valor: 'vergonha_social', rotulo: 'Vergonha Social' },
];

const MODOS: {
  valor: 'todos_juntos' | 'individual' | 'time_vs_time';
  rotulo: string;
  descricao: string;
}[] = [
  {
    valor: 'todos_juntos',
    rotulo: 'todos juntos',
    descricao: 'grupo todo adivinha. máximo de caos.',
  },
  {
    valor: 'time_vs_time',
    rotulo: 'time vs time',
    descricao: 'dois times. roubo. gritaria.',
  },
  {
    valor: 'individual',
    rotulo: 'solo',
    descricao: '1 explica, 1 responde. mais focado.',
  },
];

export function TelaConfiguracaoLocalNaPontaDaLingua({ navigation }: Props) {
  const [nomes, setNomes] = useState<string[]>([]);
  const [duracao, setDuracao] = useState<45 | 60 | 90>(60);
  const [rodadasPorJogador, setRodadasPorJogador] = useState(3);
  const [dificuldade, setDificuldade] = useState<
    'facil' | 'medio' | 'dificil' | 'colapso' | 'todas'
  >('todas');
  const [categoriasSelecionadas, setCategoriasSelecionadas] = useState<
    CategoriaIdNPL[] | 'todas'
  >('todas');
  const [modoJogo, setModoJogo] = useState<
    'todos_juntos' | 'individual' | 'time_vs_time'
  >('todos_juntos');
  const [timesA, setTimesA] = useState<number[]>([]);
  const [timesB, setTimesB] = useState<number[]>([]);
  const [expandirCategorias, setExpandirCategorias] = useState(false);

  useEffect(() => {
    if (modoJogo !== 'time_vs_time') return;
    const a: number[] = [];
    const b: number[] = [];
    nomes.forEach((_, i) => {
      if (i % 2 === 0) a.push(i);
      else b.push(i);
    });
    setTimesA(a);
    setTimesB(b);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nomes.length, modoJogo]);

  const podeIniciarTvT =
    modoJogo === 'time_vs_time'
      ? timesA.length >= 2 && timesB.length >= 2
      : true;
  const categoriaValida =
    categoriasSelecionadas === 'todas' || categoriasSelecionadas.length >= 3;
  const podeIniciar =
    nomes.length >= MIN_JOGADORES && podeIniciarTvT && categoriaValida;
  const avisoRodape =
    nomes.length < MIN_JOGADORES
      ? `faltam ${MIN_JOGADORES - nomes.length} jogador${
          MIN_JOGADORES - nomes.length === 1 ? '' : 'es'
        }`
      : undefined;

  const labelCategorias =
    categoriasSelecionadas === 'todas'
      ? 'todas as categorias'
      : `${categoriasSelecionadas.length} categoria${categoriasSelecionadas.length === 1 ? '' : 's'}`;

  const sublabelRodadas =
    nomes.length > 0
      ? `× ${nomes.length} = ${nomes.length * rodadasPorJogador} turnos`
      : 'vezes cada';

  function moverJogador(idx: number) {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (timesA.includes(idx)) {
      setTimesA((a) => a.filter((i) => i !== idx));
      setTimesB((b) => [...b, idx].sort((x, y) => x - y));
    } else {
      setTimesB((b) => b.filter((i) => i !== idx));
      setTimesA((a) => [...a, idx].sort((x, y) => x - y));
    }
  }

  function aoComecar() {
    if (!podeIniciar) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    void salvarGrupoRecente(nomes);
    const jogadores = nomes.map((nome, i) => ({ id: `local-${i}`, nome }));
    assegurarSessaoIniciada(jogadores, 'na-ponta-da-lingua');
    const times =
      modoJogo === 'time_vs_time'
        ? {
            nomeA: 'Time A',
            idsA: timesA.map((i) => `local-${i}`),
            nomeB: 'Time B',
            idsB: timesB.map((i) => `local-${i}`),
          }
        : undefined;
    navigation.replace('JogoLocalNaPontaDaLingua', {
      jogadores,
      duracaoSegundos: duracao,
      rodadasPorJogador,
      dificuldade,
      categorias: categoriasSelecionadas,
      modoJogo,
      times,
    });
  }

  return (
    <TelaConfigLocal
      titulo={'na ponta\nda língua'}
      subtitulo="improvise. as proibidas não perdoam."
      tituloMultilinha
      onVoltar={() => navigation.goBack()}
      rodape={{
        titulo: 'começa aí',
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

      {/* ── 2. Duração por rodada ── */}
      <SecaoConfig titulo="quanto tempo por rodada?">
        <SegmentControl
          opcoes={DURACOES}
          valor={duracao}
          onChange={setDuracao}
        />
        <Text style={estilos.ajuda}>
          {DURACOES.find((d) => d.valor === duracao)?.descricao}
        </Text>
      </SecaoConfig>

      {/* ── 3. Rodadas por jogador ── */}
      <SecaoConfig titulo="quantas vezes cada um joga?">
        <ControladorNumerico
          valor={rodadasPorJogador}
          minimo={MIN_RODADAS}
          maximo={MAX_RODADAS}
          onChange={setRodadasPorJogador}
          sublabel={sublabelRodadas}
        />
      </SecaoConfig>

      {/* ── 4. Dificuldade ── */}
      <SecaoConfig titulo="que intensidade?">
        <SegmentControl
          opcoes={DIFICULDADES}
          valor={dificuldade}
          onChange={setDificuldade}
        />
        <Text style={estilos.ajuda}>
          {dificuldade === 'dificil'
            ? 'palavras que exigem muita criatividade.'
            : dificuldade === 'facil'
              ? 'para esquentar o grupo.'
              : dificuldade === 'medio'
                ? 'desconfortável de um jeito bom.'
                : dificuldade === 'colapso'
                  ? 'o cérebro para de funcionar.'
                  : 'mistura de tudo. o app decide.'}
        </Text>
      </SecaoConfig>

      {/* ── 5. Modo de jogo ── */}
      <SecaoConfig titulo="como o grupo joga?">
        <SegmentControl
          opcoes={MODOS}
          valor={modoJogo}
          onChange={setModoJogo}
        />
        <Text style={estilos.ajuda}>
          {MODOS.find((m) => m.valor === modoJogo)?.descricao}
        </Text>
      </SecaoConfig>

      {/* ── 6. Divisão dos times (TvT) ── */}
      {modoJogo === 'time_vs_time' && nomes.length >= 2 && (
        <SecaoConfig titulo="quem vai em cada time?">
          <View style={estilos.timesGrid}>
            <View style={estilos.timeColunaContainer}>
              <Text style={estilos.timeLabel}>Time A</Text>
              {timesA.length === 0 ? (
                <Text style={estilos.timeVazio}>vazio</Text>
              ) : (
                timesA.map((i) => (
                  <Pressable
                    key={i}
                    onPress={() => moverJogador(i)}
                    style={({ pressed }) => [
                      estilos.timeJogadorItem,
                      estilos.timeJogadorA,
                      pressed && { opacity: 0.6 },
                    ]}
                  >
                    <Text style={estilos.timeJogadorNome} numberOfLines={1}>
                      {nomes[i]}
                    </Text>
                    <Text style={estilos.timeMoverTexto}>→ B</Text>
                  </Pressable>
                ))
              )}
            </View>
            <View style={estilos.timeDivisorVertical} />
            <View style={estilos.timeColunaContainer}>
              <Text style={estilos.timeLabel}>Time B</Text>
              {timesB.length === 0 ? (
                <Text style={estilos.timeVazio}>vazio</Text>
              ) : (
                timesB.map((i) => (
                  <Pressable
                    key={i}
                    onPress={() => moverJogador(i)}
                    style={({ pressed }) => [
                      estilos.timeJogadorItem,
                      estilos.timeJogadorB,
                      pressed && { opacity: 0.6 },
                    ]}
                  >
                    <Text style={estilos.timeMoverTexto}>A ←</Text>
                    <Text style={estilos.timeJogadorNome} numberOfLines={1}>
                      {nomes[i]}
                    </Text>
                  </Pressable>
                ))
              )}
            </View>
          </View>
          <Text style={estilos.ajuda}>
            toque num jogador para trocar de time.
          </Text>
          {(timesA.length < 2 || timesB.length < 2) && (
            <Text style={[estilos.ajuda, estilos.ajudaAlertaTimes]}>
              mínimo 2 por time.
            </Text>
          )}
        </SecaoConfig>
      )}

      {/* ── 7. Categorias ── */}
      <SecaoConfig titulo="categorias de palavras" subtitulo={labelCategorias}>
        <Pressable
          onPress={() => {
            setExpandirCategorias((v) => !v);
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
          style={({ pressed }) => [
            estilos.expandirBtn,
            pressed && { opacity: 0.6 },
          ]}
        >
          <Text style={estilos.expandirTexto}>
            {expandirCategorias
              ? 'ocultar categorias ↑'
              : 'personalizar categorias ↓'}
          </Text>
        </Pressable>

        {expandirCategorias && (
          <>
            <View
              style={[estilos.categoriasGrid, estilos.categoriasGridExpandida]}
            >
              {CATEGORIAS.map(({ valor, rotulo }) => {
                const ativa =
                  categoriasSelecionadas === 'todas' ||
                  categoriasSelecionadas.includes(valor);
                return (
                  <Pressable
                    key={valor}
                    onPress={() => {
                      void Haptics.impactAsync(
                        Haptics.ImpactFeedbackStyle.Light,
                      );
                      if (categoriasSelecionadas === 'todas') {
                        setCategoriasSelecionadas(
                          CATEGORIAS.map((c) => c.valor).filter(
                            (v) => v !== valor,
                          ),
                        );
                      } else {
                        const nova = ativa
                          ? categoriasSelecionadas.filter((v) => v !== valor)
                          : [...categoriasSelecionadas, valor];
                        setCategoriasSelecionadas(
                          nova.length === CATEGORIAS.length
                            ? 'todas'
                            : nova.length === 0
                              ? 'todas'
                              : nova,
                        );
                      }
                    }}
                    style={[
                      estilos.categoriaChip,
                      ativa && estilos.categoriaChipAtivo,
                    ]}
                  >
                    <Text
                      style={[
                        estilos.categoriaChipTexto,
                        ativa && estilos.categoriaChipTextoAtivo,
                      ]}
                    >
                      {rotulo}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {categoriasSelecionadas !== 'todas' &&
              categoriasSelecionadas.length < 3 && (
                <Text style={[estilos.ajuda, estilos.ajudaAlertaCategorias]}>
                  selecione pelo menos 3 categorias.
                </Text>
              )}
            {categoriasSelecionadas !== 'todas' && (
              <Pressable
                onPress={() => {
                  setCategoriasSelecionadas('todas');
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                hitSlop={8}
                style={estilos.usarTodasBtn}
              >
                <Text style={estilos.ajuda}>usar todas as categorias</Text>
              </Pressable>
            )}
          </>
        )}
      </SecaoConfig>
    </TelaConfigLocal>
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
  ajudaAlertaTimes: {
    color: COR_ALERTA_SUAVE,
    marginTop: 4,
  },
  ajudaAlertaCategorias: {
    color: COR_ALERTA_SUAVE,
    marginTop: 8,
  },

  // ── Times ──
  timesGrid: { flexDirection: 'row' },
  timeColunaContainer: { flex: 1, gap: espacamento.sm },
  timeLabel: {
    color: cores.textoMudo,
    fontSize: tipografia.tamanhoLabelSecao,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 2,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  timeDivisorVertical: {
    backgroundColor: cores.borda,
    marginHorizontal: espacamento.sm,
    width: 1,
  },
  timeJogadorItem: {
    alignItems: 'center',
    borderRadius: raio.sm,
    borderWidth: 1,
    flexDirection: 'row',
    gap: espacamento.xs,
    paddingHorizontal: espacamento.sm,
    paddingVertical: espacamento.sm,
  },
  timeJogadorA: {
    backgroundColor: COR_TIME_A_FUNDO,
    borderColor: COR_TIME_A_BORDA,
  },
  timeJogadorB: {
    backgroundColor: COR_TIME_B_FUNDO,
    borderColor: COR_TIME_B_BORDA,
  },
  timeJogadorNome: {
    color: cores.texto,
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
  timeMoverTexto: {
    color: cores.textoMudo,
    fontSize: tipografia.tamanhoLabelSecao,
  },
  timeVazio: {
    color: cores.textoMudo,
    fontSize: 12,
    fontStyle: 'italic',
    paddingVertical: espacamento.sm,
    textAlign: 'center',
  },

  // ── Categorias ──
  expandirBtn: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderColor: cores.borda,
    borderRadius: raio.pill,
    borderWidth: 1,
    paddingHorizontal: espacamento.md,
    paddingVertical: 8,
  },
  expandirTexto: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    fontWeight: tipografia.pesoMedio,
    letterSpacing: 0.2,
  },
  categoriasGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: espacamento.sm,
  },
  categoriasGridExpandida: {
    marginTop: espacamento.md,
  },
  usarTodasBtn: {
    alignSelf: 'center',
    marginTop: espacamento.sm,
  },
  categoriaChip: {
    backgroundColor: cores.superficie,
    borderColor: cores.borda,
    borderRadius: raio.xl,
    borderWidth: 1,
    paddingHorizontal: espacamento.md,
    paddingVertical: 7,
  },
  categoriaChipAtivo: {
    backgroundColor: cores.acento,
    borderColor: cores.acento,
  },
  categoriaChipTexto: {
    color: cores.textoSecundario,
    fontFamily: familias.sans,
    fontSize: 13,
    fontWeight: tipografia.pesoSemibold,
  },
  categoriaChipTextoAtivo: { color: cores.textoSobrePrimaria },
});
