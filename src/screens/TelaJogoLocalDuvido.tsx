import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Keyboard,
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

import { BotaoEncerrarJogo, BotaoPrimario } from '@/components';
import type { EstadoDuvido } from '@/games/duvido/types';
import { useDuviidoLocal } from '@/games/duvido/local/localEngine';
import { criarCallbacksDuvido } from '@/games/duvido/local/duviidoLocalAdapter';
import type { RootStackParamList } from '@/navigation/types';
import { cores, espacamento, familias, raio, tipografia } from '@/theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'JogoLocalDuvido'>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function nomePorId(
  jogadores: { id: string; nome: string }[],
  id: string | null,
): string {
  if (!id) return '—';
  return jogadores.find((j) => j.id === id)?.nome ?? '—';
}

function rotuloDificuldade(d: 1 | 2 | 3): string {
  if (d === 1) return 'fácil';
  if (d === 2) return 'médio';
  return 'difícil';
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function TelaJogoLocalDuvido({ navigation, route }: Props) {
  const { configuracao, rankingsSelecionados } = route.params;

  const callbacks = useMemo(() => criarCallbacksDuvido(), []);

  const { estado, rankingAtualCompleto, despachar, iniciarProximoRanking, jogoEncerrado } =
    useDuviidoLocal({ configuracao, rankingsSelecionados, callbacks });

  const jogadores = useMemo(
    () => configuracao.jogadores.map((nome, i) => ({ id: `jogador-${i}`, nome })),
    [configuracao.jogadores],
  );

  // Navegação quando sessão encerrar
  useEffect(() => {
    if (!jogoEncerrado) return;

    const historicoPorRanking = estado.historicoPorRanking.map((h) => {
      const titulo =
        rankingsSelecionados.find((r) => r.id === h.rankingId)?.titulo ?? h.rankingId;
      return { ...h, rankingTitulo: titulo };
    });

    navigation.replace('ResultadoLocalDuvido', {
      jogadores,
      historicoPorRanking,
      totalRankings: estado.totalRankings,
      temperatura: 'equilibrado', // será calculado pelo adapter — usamos fallback aqui
    });
  }, [jogoEncerrado]); // eslint-disable-line react-hooks/exhaustive-deps

  function sair() {
    navigation.navigate('Inicio');
  }

  const { fase } = estado;

  return (
    <SafeAreaView style={estilos.tela} edges={['top', 'bottom']}>
      {fase !== 'finalizado' && fase !== 'reveal_final' && (
        <BotaoEncerrarJogo onConfirmar={sair} />
      )}

      {fase === 'exibindo_ranking' && (
        <FaseExibindoRanking estado={estado} onComecar={() => despachar({ tipo: 'IniciarRanking' })} />
      )}

      {fase === 'aguardando_resposta' && (
        <FaseAguardandoResposta
          estado={estado}
          jogadores={jogadores}
          onConfirmar={(item) => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            despachar({ tipo: 'ItemDito', item });
          }}
        />
      )}

      {fase === 'aguardando_decisao' && (
        <FaseAguardandoDecisao
          estado={estado}
          jogadores={jogadores}
          onAceitar={() => {
            void Haptics.selectionAsync();
            despachar({ tipo: 'Aceito' });
          }}
          onDuvidar={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            despachar({ tipo: 'Duvidado' });
          }}
        />
      )}

      {fase === 'revelando' && (
        <FaseRevelando
          estado={estado}
          jogadores={jogadores}
          onContinuar={() => {
            void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            despachar({ tipo: 'ConfirmarEliminacao' });
          }}
        />
      )}

      {fase === 'reveal_final' && (
        <FaseRevealFinal
          estado={estado}
          ranking={rankingAtualCompleto}
          jogadores={jogadores}
          onContinuar={() => {
            void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            despachar({ tipo: 'ConfirmarRevealFinal' });
          }}
        />
      )}

      {fase === 'finalizado' && (
        <FaseFinalizado
          estado={estado}
          jogadores={jogadores}
          temProximo={estado.rankingAtual + 1 < estado.totalRankings}
          onProximoRanking={() => {
            void Haptics.selectionAsync();
            iniciarProximoRanking();
          }}
          onEncerrar={() => {
            iniciarProximoRanking(); // dispara onJogoFinalizado e seta jogoEncerrado
          }}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Fases ────────────────────────────────────────────────────────────────────

function FaseExibindoRanking({
  estado,
  onComecar,
}: {
  estado: EstadoDuvido;
  onComecar: () => void;
}) {
  const { rankingPublico, rankingAtual, totalRankings } = estado;
  return (
    <View style={estilos.topo}>
      <View style={estilos.conteudo}>
        <Text style={estilos.eyebrow}>
          ranking {rankingAtual + 1} de {totalRankings}
        </Text>
        <Text style={estilos.tituloGrande}>{rankingPublico.titulo}</Text>
        <View style={estilos.metaLinha}>
          <View style={estilos.chip}>
            <Text style={estilos.chipTexto}>fonte: {rankingPublico.fonte}</Text>
          </View>
          <View style={estilos.chip}>
            <Text style={estilos.chipTexto}>
              {rankingPublico.tamanho} itens · {rotuloDificuldade(rankingPublico.dificuldade)}
            </Text>
          </View>
        </View>
        <Text style={estilos.instrucaoSutil}>
          cada um diz um item em voz alta.{'\n'}
          o próximo pode aceitar ou duvidar.
        </Text>
      </View>
      <BotaoPrimario titulo="começar" onPress={onComecar} />
    </View>
  );
}

function FaseAguardandoResposta({
  estado,
  jogadores,
  onConfirmar,
}: {
  estado: EstadoDuvido;
  jogadores: { id: string; nome: string }[];
  onConfirmar: (item: string) => void;
}) {
  const [item, setItem] = useState('');
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    const timeout = setTimeout(() => inputRef.current?.focus(), 200);
    return () => clearTimeout(timeout);
  }, [estado.jogadorAtivoId]);

  const ativo = nomePorId(jogadores, estado.jogadorAtivoId);
  const proximo = nomePorId(jogadores, estado.proximoJogadorId);
  const podeConfirmar = item.trim().length >= 2;

  function confirmar() {
    if (!podeConfirmar) return;
    Keyboard.dismiss();
    onConfirmar(item.trim());
    setItem('');
  }

  return (
    <KeyboardAvoidingView
      style={estilos.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={estilos.jogo}>
        {/* Cabeçalho */}
        <View>
          <Text style={estilos.eyebrow}>
            {estado.rankingAtual + 1}/{estado.totalRankings} · {estado.rankingPublico.titulo}
          </Text>
        </View>

        {/* Itens já ditos */}
        {estado.itensDitos.length > 0 && (
          <View style={estilos.itensDitosArea}>
            <Text style={estilos.labelMudo}>já ditos</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={estilos.itensDitosScroll}
            >
              {estado.itensDitos.map((it, i) => (
                <View key={i} style={estilos.itemDitoChip}>
                  <Text style={estilos.itemDitoTexto}>{it}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Vez de */}
        <View style={estilos.vezDeArea}>
          <Text style={estilos.labelMudo}>vez de</Text>
          <Text style={estilos.nomeJogadorGrande}>{ativo}</Text>
          <Text style={estilos.proximoTexto}>
            {proximo} vai decidir aceitar ou duvidar
          </Text>
        </View>

        {/* Input */}
        <View style={estilos.inputArea}>
          <TextInput
            ref={inputRef}
            value={item}
            onChangeText={setItem}
            placeholder="diga um nome em voz alta e confirme aqui..."
            placeholderTextColor={cores.textoMudo}
            style={estilos.input}
            returnKeyType="done"
            onSubmitEditing={confirmar}
            autoCorrect={false}
            autoCapitalize="words"
            accessibilityLabel="Campo para digitar o item dito"
          />
        </View>

        {/* Ação */}
        <BotaoPrimario
          titulo="confirmar"
          disabled={!podeConfirmar}
          onPress={confirmar}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

function FaseAguardandoDecisao({
  estado,
  jogadores,
  onAceitar,
  onDuvidar,
}: {
  estado: EstadoDuvido;
  jogadores: { id: string; nome: string }[];
  onAceitar: () => void;
  onDuvidar: () => void;
}) {
  const quemDisse = nomePorId(jogadores, estado.jogadorAtivoId);
  const quemDecide = nomePorId(jogadores, estado.proximoJogadorId);

  return (
    <View style={estilos.topo}>
      <View style={estilos.conteudo}>
        <Text style={estilos.eyebrow}>
          {estado.rankingAtual + 1}/{estado.totalRankings} · {estado.rankingPublico.titulo}
        </Text>

        <View style={estilos.itemEmDisputa}>
          <Text style={estilos.labelMudo}>{quemDisse} disse</Text>
          <Text style={estilos.itemGrande}>"{estado.ultimoItemDito}"</Text>
        </View>

        <Text style={estilos.quemDecideTexto}>
          <Text style={estilos.quemDecideNome}>{quemDecide}</Text>
          {', você duvida?'}
        </Text>
      </View>

      <View style={estilos.acoesDecisao}>
        <Pressable
          onPress={onAceitar}
          accessibilityRole="button"
          accessibilityLabel="Aceitar o item"
          style={({ pressed }) => [
            estilos.botaoDecisao,
            estilos.botaoAceitar,
            pressed && estilos.pressionado,
          ]}
        >
          <Text style={estilos.botaoAceitarTexto}>aceitar</Text>
        </Pressable>
        <Pressable
          onPress={onDuvidar}
          accessibilityRole="button"
          accessibilityLabel="Duvidar do item"
          style={({ pressed }) => [
            estilos.botaoDecisao,
            estilos.botaoDuvidar,
            pressed && estilos.pressionado,
          ]}
        >
          <Text style={estilos.botaoDuvidarTexto}>duvidar</Text>
        </Pressable>
      </View>
    </View>
  );
}

function FaseRevelando({
  estado,
  jogadores,
  onContinuar,
}: {
  estado: EstadoDuvido;
  jogadores: { id: string; nome: string }[];
  onContinuar: () => void;
}) {
  const resultado = estado.resultadoDuvida;
  if (!resultado) return null;

  const eliminadoNome = nomePorId(jogadores, resultado.eliminadoId);
  const respondeuNome = nomePorId(jogadores, estado.jogadorAtivoId);
  const duvidouNome = nomePorId(jogadores, estado.proximoJogadorId);

  const corResultado = resultado.valido ? COR_VALIDO : COR_INVALIDO;
  const textoValidade = resultado.valido ? 'está na lista' : 'não está na lista';
  const textoExplicacao = resultado.valido
    ? `${duvidouNome} duvidou de item válido — foi eliminado.`
    : `${respondeuNome} não estava na lista — foi eliminado.`;

  return (
    <View style={estilos.topo}>
      <View style={estilos.conteudo}>
        <Text style={estilos.eyebrow}>{estado.rankingPublico.titulo}</Text>

        {/* Item e resultado */}
        <View style={[estilos.resultadoCard, { borderColor: corResultado }]}>
          <Text style={[estilos.resultadoValidade, { color: corResultado }]}>
            {textoValidade}
          </Text>
          <Text style={estilos.resultadoItem}>"{resultado.itemDito}"</Text>
        </View>

        {/* Eliminado */}
        <View style={estilos.eliminadoArea}>
          <Text style={estilos.eliminadoLabel}>eliminado</Text>
          <Text style={estilos.eliminadoNome}>{eliminadoNome}</Text>
          <Text style={estilos.eliminadoExplicacao}>{textoExplicacao}</Text>
        </View>

        {/* Ativos restantes */}
        {estado.jogadoresAtivos.length > 0 && (
          <Text style={estilos.ativosRestantes}>
            {estado.jogadoresAtivos.length} ainda{' '}
            {estado.jogadoresAtivos.length === 1 ? 'ativo' : 'ativos'}
          </Text>
        )}
      </View>

      <BotaoPrimario titulo="continuar" onPress={onContinuar} />
    </View>
  );
}

function FaseRevealFinal({
  estado,
  ranking,
  jogadores,
  onContinuar,
}: {
  estado: EstadoDuvido;
  ranking: { itens: string[] };
  jogadores: { id: string; nome: string }[];
  onContinuar: () => void;
}) {
  const vencedorNome = nomePorId(jogadores, estado.vencedorId);
  const itensDitosSet = new Set(
    estado.itensDitos.map((it) => it.toLowerCase().trim()),
  );

  return (
    <ScrollView
      style={estilos.scrollTela}
      contentContainerStyle={estilos.scrollConteudo}
      showsVerticalScrollIndicator={false}
    >
      {/* Vencedor */}
      <View style={estilos.vencedorArea}>
        <Text style={estilos.eyebrow}>sobrevivente</Text>
        <Text style={estilos.vencedorNome}>{vencedorNome}</Text>
        <Text style={estilos.vencedorSubtitulo}>
          {estado.rankingAtual + 1} de {estado.totalRankings} ranking
          {estado.totalRankings > 1 ? 's' : ''}
        </Text>
      </View>

      {/* Lista completa */}
      <View style={estilos.listaReveal}>
        <Text style={estilos.listaRevealTitulo}>{estado.rankingPublico.titulo}</Text>
        {ranking.itens.map((item, i) => {
          const foiDito = itensDitosSet.has(item.toLowerCase().trim());
          return (
            <View key={i} style={estilos.itemReveal}>
              <Text style={estilos.itemRevealNumero}>{i + 1}.</Text>
              <Text
                style={[
                  estilos.itemRevealTexto,
                  !foiDito && estilos.itemRevealNaoDito,
                ]}
              >
                {item}
              </Text>
              {foiDito && (
                <Text style={estilos.itemRevealCheck}>✓</Text>
              )}
            </View>
          );
        })}
      </View>

      {/* Ação */}
      <BotaoPrimario
        titulo={
          estado.rankingAtual + 1 < estado.totalRankings
            ? 'próximo ranking'
            : 'ver resultado final'
        }
        onPress={onContinuar}
      />
    </ScrollView>
  );
}

function FaseFinalizado({
  estado,
  jogadores,
  temProximo,
  onProximoRanking,
  onEncerrar,
}: {
  estado: EstadoDuvido;
  jogadores: { id: string; nome: string }[];
  temProximo: boolean;
  onProximoRanking: () => void;
  onEncerrar: () => void;
}) {
  const vencedorNome = nomePorId(jogadores, estado.vencedorId);
  const totalEliminacoes = estado.jogadores.filter((j) => !j.ativo).length;

  return (
    <View style={estilos.topo}>
      <View style={estilos.conteudo}>
        <Text style={estilos.eyebrow}>
          ranking {estado.rankingAtual + 1} de {estado.totalRankings} encerrado
        </Text>
        <Text style={estilos.tituloGrande}>{vencedorNome} venceu.</Text>
        <Text style={estilos.subtitulo}>
          {totalEliminacoes} jogador{totalEliminacoes === 1 ? '' : 'es'} eliminado
          {totalEliminacoes === 1 ? '' : 's'} ·{' '}
          {estado.itensDitos.length} item{estado.itensDitos.length === 1 ? '' : 'ns'} dito
          {estado.itensDitos.length === 1 ? '' : 's'}
        </Text>
      </View>

      <View style={estilos.acoesFinais}>
        {temProximo ? (
          <BotaoPrimario titulo="próximo ranking" onPress={onProximoRanking} />
        ) : (
          <BotaoPrimario titulo="ver resultado da sessão" onPress={onEncerrar} />
        )}
      </View>
    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const COR_VALIDO = '#22C55E';
const COR_INVALIDO = '#EF4444';
const COR_DUVIDAR_FUNDO = '#161616';

const estilos = StyleSheet.create({
  acoesDecisao: {
    flexDirection: 'row',
    gap: espacamento.sm,
    paddingHorizontal: espacamento.lg,
    paddingBottom: espacamento.lg,
  },
  acoesFinais: {
    padding: espacamento.lg,
  },
  ativosRestantes: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    textAlign: 'center',
  },
  botaoAceitar: {
    backgroundColor: cores.superficie,
    borderColor: cores.borda,
    borderWidth: 1,
  },
  botaoAceitarTexto: {
    color: cores.texto,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpo,
    fontWeight: tipografia.pesoExtraBold,
  },
  botaoDecisao: {
    alignItems: 'center',
    borderRadius: raio.lg,
    flex: 1,
    justifyContent: 'center',
    minHeight: 72,
  },
  botaoDuvidar: {
    backgroundColor: COR_DUVIDAR_FUNDO,
  },
  botaoDuvidarTexto: {
    color: cores.fundo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpo,
    fontWeight: tipografia.pesoBlack,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  chip: {
    backgroundColor: cores.superficie,
    borderColor: cores.borda,
    borderRadius: raio.pill,
    borderWidth: 1,
    paddingHorizontal: espacamento.sm,
    paddingVertical: 6,
  },
  chipTexto: {
    color: cores.textoSecundario,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    fontWeight: tipografia.pesoBold,
  },
  conteudo: {
    flex: 1,
    gap: espacamento.lg,
    padding: espacamento.lg,
    paddingTop: espacamento.xl,
  },
  eliminadoArea: {
    alignItems: 'center',
    backgroundColor: cores.superficie,
    borderColor: cores.borda,
    borderRadius: raio.xl,
    borderWidth: 1,
    gap: espacamento.xs,
    padding: espacamento.lg,
  },
  eliminadoExplicacao: {
    color: cores.textoSecundario,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpoMenor,
    lineHeight: 20,
    textAlign: 'center',
  },
  eliminadoLabel: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    fontWeight: tipografia.pesoBold,
    textTransform: 'uppercase',
  },
  eliminadoNome: {
    color: cores.texto,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoTituloGrande,
    fontWeight: tipografia.pesoBlack,
    letterSpacing: 0,
  },
  eyebrow: {
    color: cores.primaria,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    fontWeight: tipografia.pesoExtraBold,
    letterSpacing: 0,
  },
  flex: {
    flex: 1,
  },
  input: {
    backgroundColor: cores.superficie,
    borderColor: cores.borda,
    borderRadius: raio.lg,
    borderWidth: 1,
    color: cores.texto,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpoMaior,
    minHeight: 56,
    paddingHorizontal: espacamento.md,
    paddingVertical: espacamento.md,
  },
  inputArea: {
    gap: espacamento.sm,
  },
  instrucaoSutil: {
    color: cores.textoSecundario,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpoMenor,
    lineHeight: 22,
  },
  itemDitoChip: {
    backgroundColor: cores.superficie,
    borderColor: cores.borda,
    borderRadius: raio.pill,
    borderWidth: 1,
    paddingHorizontal: espacamento.sm,
    paddingVertical: 6,
  },
  itemDitoTexto: {
    color: cores.textoSecundario,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    fontWeight: tipografia.pesoBold,
  },
  itemEmDisputa: {
    alignItems: 'center',
    backgroundColor: cores.superficie,
    borderColor: cores.borda,
    borderRadius: raio.xl,
    borderWidth: 1,
    gap: espacamento.xs,
    padding: espacamento.xl,
  },
  itemGrande: {
    color: cores.texto,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoTituloGrande,
    fontWeight: tipografia.pesoBlack,
    letterSpacing: 0,
    textAlign: 'center',
  },
  itemReveal: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: espacamento.sm,
    paddingVertical: espacamento.sm,
  },
  itemRevealCheck: {
    color: COR_VALIDO,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpoMenor,
    fontWeight: tipografia.pesoExtraBold,
    marginLeft: 'auto',
  },
  itemRevealNaoDito: {
    color: cores.textoMudo,
  },
  itemRevealNumero: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpoMenor,
    width: 24,
  },
  itemRevealTexto: {
    color: cores.texto,
    flex: 1,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpoMenor,
    fontWeight: tipografia.pesoBold,
  },
  itensDitosArea: {
    gap: espacamento.xs,
  },
  itensDitosScroll: {
    gap: espacamento.xs,
    paddingBottom: 2,
  },
  jogo: {
    flex: 1,
    gap: espacamento.lg,
    padding: espacamento.lg,
    paddingTop: espacamento.xl + espacamento.md,
  },
  labelMudo: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    fontWeight: tipografia.pesoBold,
  },
  listaReveal: {
    backgroundColor: cores.superficie,
    borderColor: cores.borda,
    borderRadius: raio.xl,
    borderWidth: 1,
    gap: 2,
    padding: espacamento.lg,
  },
  listaRevealTitulo: {
    color: cores.texto,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpoMenor,
    fontWeight: tipografia.pesoExtraBold,
    lineHeight: 20,
    marginBottom: espacamento.sm,
  },
  metaLinha: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: espacamento.xs,
  },
  nomeJogadorGrande: {
    color: cores.texto,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoTituloGrande,
    fontWeight: tipografia.pesoBlack,
    letterSpacing: 0,
    lineHeight: 38,
  },
  pressionado: {
    opacity: 0.82,
    transform: [{ scale: 0.98 }],
  },
  proximoTexto: {
    color: cores.textoSecundario,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpoMenor,
    lineHeight: 20,
  },
  quemDecideNome: {
    color: cores.texto,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpo,
    fontWeight: tipografia.pesoExtraBold,
  },
  quemDecideTexto: {
    color: cores.textoSecundario,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpo,
    lineHeight: 26,
  },
  resultadoCard: {
    alignItems: 'center',
    borderRadius: raio.xl,
    borderWidth: 2,
    gap: espacamento.sm,
    padding: espacamento.xl,
  },
  resultadoItem: {
    color: cores.texto,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoTituloGrande,
    fontWeight: tipografia.pesoBlack,
    letterSpacing: 0,
    textAlign: 'center',
  },
  resultadoValidade: {
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    fontWeight: tipografia.pesoExtraBold,
    textTransform: 'uppercase',
  },
  scrollConteudo: {
    gap: espacamento.xl,
    padding: espacamento.lg,
    paddingTop: espacamento.xl,
  },
  scrollTela: {
    flex: 1,
  },
  subtitulo: {
    color: cores.textoSecundario,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpoMenor,
    lineHeight: 22,
  },
  tela: {
    backgroundColor: cores.fundo,
    flex: 1,
  },
  tituloGrande: {
    color: cores.texto,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoTituloGrande,
    fontWeight: tipografia.pesoBlack,
    letterSpacing: 0,
    lineHeight: 38,
  },
  topo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  vencedorArea: {
    gap: espacamento.sm,
  },
  vencedorNome: {
    color: cores.texto,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoTituloGrande,
    fontWeight: tipografia.pesoBlack,
    letterSpacing: 0,
    lineHeight: 38,
  },
  vencedorSubtitulo: {
    color: cores.textoSecundario,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpoMenor,
    lineHeight: 20,
  },
  vezDeArea: {
    gap: espacamento.xs,
  },
});
