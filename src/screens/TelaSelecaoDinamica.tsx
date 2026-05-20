import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { useEffect, useRef } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { JOGOS } from '@/games/gameRegistry';
import type { RootStackParamList } from '@/navigation/types';
import { tutorialFoiVisto } from '@/services/tutorial';
import { cores, espacamento, familias, raio, tipografia } from '@/theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'SelecaoDinamica'>;

// Opção sem ícone — a escolha é social, não técnica.
// O usuário pensa "como quero viver esse momento?" não "qual protocolo usar?".
interface OpcaoDinamica {
  id: 'local' | 'realtime' | 'entrar';
  titulo: string;
  descricao: string;
  primaria: boolean;
}

const MAX_OPCOES = 3;

export function TelaSelecaoDinamica({ navigation, route }: Props) {
  const { jogoId } = route.params;
  const insets = useSafeAreaInsets();
  const jogo = JOGOS.find((j) => j.id === jogoId);

  // Cada opção descreve o RITUAL SOCIAL — não o modo técnico.
  const opcoes: OpcaoDinamica[] = [];
  if (jogo?.supportsLocal) {
    opcoes.push({
      id: 'local',
      titulo: 'passando de mão em mão',
      descricao: 'um celular, o grupo todo. cada um pega quando for sua vez.',
      primaria: true,
    });
  }
  if (jogo?.supportsRealtime) {
    opcoes.push({
      id: 'realtime',
      titulo: 'cada um com o seu',
      descricao: 'todo mundo com celular. papéis separados, segredos na tela de cada um.',
      primaria: true,
    });
  }
  opcoes.push({
    id: 'entrar',
    titulo: 'entrar numa sala',
    descricao: 'alguém já começou. só entrar.',
    primaria: false,
  });

  const headerOp = useRef(new Animated.Value(0)).current;
  const headerY = useRef(new Animated.Value(10)).current;
  const cardsAnim = useRef(
    Array.from({ length: MAX_OPCOES }, () => ({
      op: new Animated.Value(0),
      y: new Animated.Value(16),
    })),
  ).current;

  useEffect(() => {
    // Header: social momentum — entra rápido
    Animated.parallel([
      Animated.timing(headerOp, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.timing(headerY, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start();

    // Cards: stagger curto — presença sem cerimônia
    Animated.sequence([
      Animated.delay(80),
      Animated.stagger(
        60,
        cardsAnim.slice(0, opcoes.length).map((anim) =>
          Animated.parallel([
            Animated.timing(anim.op, { toValue: 1, duration: 220, useNativeDriver: true }),
            Animated.timing(anim.y, { toValue: 0, duration: 220, useNativeDriver: true }),
          ]),
        ),
      ),
    ]).start();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function aoEscolher(id: OpcaoDinamica['id']) {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (id === 'local') {
      if (jogoId === 'most-likely-to') {
        navigation.navigate('ConfiguracaoLocalMostLikely');
      } else if (jogoId === 'na-ponta-da-lingua') {
        navigation.navigate('ConfiguracaoLocalNaPontaDaLingua');
      } else {
        navigation.navigate('ConfiguracaoLocal');
      }
    } else if (id === 'realtime') {
      if (jogoId === 'mrwhite' && !(await tutorialFoiVisto('mrwhite'))) {
        navigation.navigate('Tutorial', { jogoId });
        return;
      }
      navigation.navigate('CriarSala', { jogoId });
    } else {
      navigation.navigate('EntrarSala');
    }
  }

  if (!jogo) return null;

  return (
    <View style={[estilos.tela, { paddingTop: insets.top }]}>
      <Pressable
        onPress={() => navigation.goBack()}
        hitSlop={12}
        style={({ pressed }) => [
          estilos.botaoVoltar,
          { top: insets.top + espacamento.md },
          pressed && estilos.botaoVoltarPressionado,
        ]}
        accessibilityLabel="Voltar"
        accessibilityRole="button"
      >
        <Text style={estilos.botaoVoltarIcone}>←</Text>
      </Pressable>

      <ScrollView
        style={estilos.scroll}
        contentContainerStyle={[
          estilos.scrollConteudo,
          { paddingBottom: Math.max(insets.bottom, espacamento.md) + espacamento.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Cabeçalho: jogo identificado + convite — sem verbose */}
        <Animated.View
          style={[
            estilos.cabecalho,
            { opacity: headerOp, transform: [{ translateY: headerY }] },
          ]}
        >
          <Text style={estilos.nomeJogo}>{jogo.nome}</Text>
          <Text style={estilos.pergunta}>como vocês{'\n'}querem jogar?</Text>
        </Animated.View>

        {/* Opções: rituais sociais, não modos técnicos */}
        <View style={estilos.listaOpcoes}>
          {opcoes.map((opcao, i) => (
            <Animated.View
              key={opcao.id}
              style={{
                opacity: cardsAnim[i]!.op,
                transform: [{ translateY: cardsAnim[i]!.y }],
              }}
            >
              <CardOpcao opcao={opcao} onPress={() => aoEscolher(opcao.id)} />
            </Animated.View>
          ))}
        </View>

        {/* Link de regras — discreto, para quem quer saber mais */}
        <Animated.View style={{ opacity: headerOp }}>
          <Pressable
            onPress={() => navigation.navigate('DetalhesJogo', { jogoId })}
            style={({ pressed }) => [
              estilos.linkRegras,
              pressed && estilos.linkRegrasPressionado,
            ]}
          >
            <Text style={estilos.linkRegrasTexto}>entender o jogo →</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

// ─── CardOpcao ────────────────────────────────────────────────────────────────
// Sem ícone emoji — a diferença é na linguagem, não no ícone.
// Primárias: borda sutil de ativação. Secundária: mais discreta.

interface CardOpcaoProps {
  opcao: OpcaoDinamica;
  onPress: () => void;
}

function CardOpcao({ opcao, onPress }: CardOpcaoProps) {
  const escala = useRef(new Animated.Value(1)).current;

  return (
    <Animated.View style={{ transform: [{ scale: escala }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={() => {
          Animated.spring(escala, {
            toValue: 0.97,
            useNativeDriver: true,
            speed: 40,
            bounciness: 0,
          }).start();
        }}
        onPressOut={() => {
          Animated.spring(escala, {
            toValue: 1,
            useNativeDriver: true,
            speed: 30,
            bounciness: 6,
          }).start();
        }}
        style={[estilos.card, opcao.primaria && estilos.cardPrimaria]}
        accessibilityRole="button"
        accessibilityLabel={opcao.titulo}
      >
        {/* Indicador visual: ponto colorido para opções primárias */}
        {opcao.primaria && <View style={estilos.pontoIndicador} />}

        <View style={estilos.cardTextos}>
          <Text style={[estilos.cardTitulo, !opcao.primaria && estilos.cardTituloSecundario]}>
            {opcao.titulo}
          </Text>
          <Text style={estilos.cardDescricao}>{opcao.descricao}</Text>
        </View>

        <Text style={[estilos.seta, !opcao.primaria && estilos.setaSecundaria]}>→</Text>
      </Pressable>
    </Animated.View>
  );
}

const estilos = StyleSheet.create({
  tela: {
    backgroundColor: cores.fundo,
    flex: 1,
  },

  // ── Voltar ──
  botaoVoltar: {
    alignItems: 'center',
    backgroundColor: cores.superficie,
    borderRadius: raio.pill,
    height: 40,
    justifyContent: 'center',
    left: espacamento.lg,
    position: 'absolute',
    width: 40,
    zIndex: 10,
  },
  botaoVoltarIcone: {
    color: cores.texto,
    fontSize: 20,
    fontWeight: tipografia.pesoBold,
    lineHeight: 22,
  },
  botaoVoltarPressionado: {
    opacity: 0.6,
  },

  // ── ScrollView ──
  scroll: {
    flex: 1,
  },
  scrollConteudo: {
    paddingHorizontal: espacamento.lg,
  },

  // ── Cabeçalho ──
  cabecalho: {
    paddingBottom: espacamento.xl,
    paddingTop: 72,
  },
  // Jogo identificado como contexto — não como título de formulário
  nomeJogo: {
    color: cores.primaria,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoMicro,
    fontWeight: tipografia.pesoExtraBold,
    letterSpacing: tipografia.letraSpacingLegenda,
    marginBottom: espacamento.sm,
  },
  // Pergunta direta — convite social, não seleção de modo
  pergunta: {
    color: cores.texto,
    fontFamily: familias.sans,
    fontWeight: '800' as const,
    fontSize: 32,
    letterSpacing: -0.2,
    lineHeight: 40,
  },

  // ── Lista de opções ──
  listaOpcoes: {
    gap: espacamento.sm,
  },

  // ── Card de opção — sem ícone, centrado no texto ──
  card: {
    alignItems: 'center',
    backgroundColor: cores.superficie,
    borderColor: cores.borda,
    borderRadius: raio.xl,
    borderWidth: 1,
    flexDirection: 'row',
    gap: espacamento.md,
    paddingHorizontal: espacamento.lg,
    paddingVertical: espacamento.md + 4,
  },
  // Opção primária: borda sutil de presença — não urgência
  cardPrimaria: {
    borderColor: 'rgba(255, 90, 95, 0.30)',
  },
  cardTextos: {
    flex: 1,
  },
  cardTitulo: {
    color: cores.texto,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpoMaior,
    fontWeight: tipografia.pesoBold,
    letterSpacing: -0.1,
    lineHeight: 24,
  },
  cardTituloSecundario: {
    color: cores.textoSecundario,
    fontWeight: tipografia.pesoSemibold,
  },
  cardDescricao: {
    color: cores.textoSecundario,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpoMenor,
    lineHeight: 20,
    marginTop: 3,
  },
  // Ponto colorido sutil — diferencia visual sem emoji
  pontoIndicador: {
    backgroundColor: cores.primaria,
    borderRadius: 4,
    height: 8,
    opacity: 0.7,
    width: 8,
  },
  seta: {
    color: cores.primaria,
    fontFamily: familias.sans,
    fontSize: 20,
    fontWeight: tipografia.pesoBold,
  },
  setaSecundaria: {
    color: cores.textoMudo,
    fontWeight: tipografia.pesoRegular,
  },

  // ── Link de regras — discreto ──
  linkRegras: {
    alignItems: 'center',
    marginTop: espacamento.xl,
    paddingVertical: espacamento.sm,
  },
  linkRegrasPressionado: {
    opacity: 0.5,
  },
  linkRegrasTexto: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    letterSpacing: 0.2,
  },
});
