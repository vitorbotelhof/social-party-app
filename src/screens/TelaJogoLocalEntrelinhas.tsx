import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  criarRodada,
  iniciarInvestigacao,
  revelarSolucao,
  type RodadaEntrelinhas,
} from '@/games/entrelinhas';
import type { RootStackParamList } from '@/navigation/types';
import {
  cores,
  espacamento,
  familias,
  raio,
  sombra,
  tipografia,
} from '@/theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'JogoLocalEntrelinhas'>;

// ─── Identidade visual ────────────────────────────────────────────────────────
const COR_ENTRELINHAS = '#8B5CF6';
const COR_ENTRELINHAS_SUAVE = 'rgba(139, 92, 246, 0.10)';
const COR_ENTRELINHAS_BORDA = 'rgba(139, 92, 246, 0.28)';
const COR_RESOLVIDA = '#22C55E';
const COR_DESISTIU = '#9E9E9E';
const COR_DIFICIL = '#EF4444';
const COR_MEDIA = '#FFBE0B';
const COR_FACIL = '#22C55E';

function corDif(d: string) {
  if (d === 'dificil') return COR_DIFICIL;
  if (d === 'media') return COR_MEDIA;
  return COR_FACIL;
}
function labelDif(d: string) {
  if (d === 'dificil') return 'difícil';
  if (d === 'media') return 'média';
  return 'fácil';
}

// ─── Sub-tela: Narrando ───────────────────────────────────────────────────────
function SubTelaNarrando({
  rodada,
  onComecar,
  onVoltar,
}: {
  rodada: RodadaEntrelinhas;
  onComecar: () => void;
  onVoltar: () => void;
}) {
  const [solucaoVisivel, setSolucaoVisivel] = useState(false);
  const { historia } = rodada;
  const cor = corDif(historia.dificuldade);

  return (
    <View style={estilos.subtela}>
      <View style={estilos.cabecalho}>
        <View
          style={[
            estilos.badge,
            { backgroundColor: `${cor}18`, borderColor: `${cor}40` },
          ]}
        >
          <Text style={[estilos.badgeTexto, { color: cor }]}>
            {labelDif(historia.dificuldade)}
          </Text>
        </View>
        <Text style={estilos.titulo}>{historia.titulo}</Text>
        <Text style={estilos.instrucao}>leia em voz alta para o grupo</Text>
      </View>

      {/* Contexto */}
      <View style={estilos.cardContexto}>
        <Text style={estilos.contextoTexto}>{historia.contexto}</Text>
      </View>

      {/* Spoiler para narrador */}
      <Pressable
        onPress={() => {
          void Haptics.selectionAsync();
          setSolucaoVisivel((v) => !v);
        }}
        accessibilityRole="button"
        accessibilityLabel={solucaoVisivel ? 'Ocultar solução' : 'Ver solução'}
        style={({ pressed }) => [
          estilos.toggleSolucao,
          pressed && estilos.pressionado,
        ]}
      >
        <Text style={estilos.toggleTexto}>
          {solucaoVisivel ? 'ocultar solução ▲' : 'narrador: ver solução ▼'}
        </Text>
      </Pressable>

      {solucaoVisivel && (
        <View style={estilos.cardSpoiler}>
          <Text style={estilos.spoilerLabel}>solução — só você vê</Text>
          <Text style={estilos.spoilerTexto}>{historia.solucao}</Text>
        </View>
      )}

      <View style={estilos.rodape}>
        <Pressable
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onComecar();
          }}
          accessibilityRole="button"
          style={({ pressed }) => [
            estilos.botaoPrimario,
            pressed && estilos.botaoPrimarioPressionado,
          ]}
        >
          <Text style={estilos.botaoPrimarioTexto}>
            grupo está pronto — começar investigação
          </Text>
        </Pressable>

        <Pressable
          onPress={onVoltar}
          accessibilityRole="button"
          style={({ pressed }) => [
            estilos.botaoGhost,
            pressed && estilos.pressionado,
          ]}
        >
          <Text style={estilos.botaoGhostTexto}>escolher outra história</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ─── Sub-tela: Investigando ───────────────────────────────────────────────────
function SubTelaInvestigando({
  rodada,
  onResolvida,
  onDesistiu,
}: {
  rodada: RodadaEntrelinhas;
  onResolvida: () => void;
  onDesistiu: () => void;
}) {
  const [solucaoVisivel, setSolucaoVisivel] = useState(false);
  const [contextoVisivel, setContextoVisivel] = useState(false);
  const { historia } = rodada;

  return (
    <View style={estilos.subtela}>
      <View style={estilos.cabecalho}>
        <Text style={estilos.titulo}>{historia.titulo}</Text>
        <View style={estilos.badgeInvestigando}>
          <Text style={estilos.badgeInvestigandoTexto}>● investigando</Text>
        </View>
      </View>

      {/* Regra de resposta */}
      <View style={estilos.cardInstrucao}>
        <Text style={estilos.instrucaoTexto}>
          {'o grupo faz perguntas.\nvocê responde só '}
          <Text style={estilos.instrucaoDestaque}>sim</Text>
          {', '}
          <Text style={estilos.instrucaoDestaque}>não</Text>
          {' ou '}
          <Text style={estilos.instrucaoDestaque}>irrelevante.</Text>
        </Text>
      </View>

      {/* Rever contexto */}
      <Pressable
        onPress={() => {
          void Haptics.selectionAsync();
          setContextoVisivel((v) => !v);
        }}
        accessibilityRole="button"
        style={({ pressed }) => [
          estilos.toggleSolucao,
          pressed && estilos.pressionado,
        ]}
      >
        <Text style={estilos.toggleTexto}>
          {contextoVisivel ? 'ocultar contexto ▲' : 'rever contexto ▼'}
        </Text>
      </Pressable>

      {contextoVisivel && (
        <View style={estilos.cardContextoMini}>
          <Text style={estilos.contextoMiniTexto}>{historia.contexto}</Text>
        </View>
      )}

      {/* Consultar solução */}
      <Pressable
        onPress={() => {
          void Haptics.selectionAsync();
          setSolucaoVisivel((v) => !v);
        }}
        accessibilityRole="button"
        style={({ pressed }) => [
          estilos.toggleSolucao,
          pressed && estilos.pressionado,
        ]}
      >
        <Text style={estilos.toggleTexto}>
          {solucaoVisivel
            ? 'ocultar solução ▲'
            : 'narrador: consultar solução ▼'}
        </Text>
      </Pressable>

      {solucaoVisivel && (
        <View style={estilos.cardSpoiler}>
          <Text style={estilos.spoilerLabel}>solução — só você vê</Text>
          <Text style={estilos.spoilerTexto}>{historia.solucao}</Text>
        </View>
      )}

      <View style={estilos.rodape}>
        <Pressable
          onPress={() => {
            void Haptics.notificationAsync(
              Haptics.NotificationFeedbackType.Success,
            );
            onResolvida();
          }}
          accessibilityRole="button"
          style={({ pressed }) => [
            estilos.botaoPrimario,
            pressed && estilos.botaoPrimarioPressionado,
          ]}
        >
          <Text style={estilos.botaoPrimarioTexto}>
            alguém acertou — revelar
          </Text>
        </Pressable>

        <Pressable
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onDesistiu();
          }}
          accessibilityRole="button"
          style={({ pressed }) => [
            estilos.botaoSecundario,
            pressed && estilos.pressionado,
          ]}
        >
          <Text style={estilos.botaoSecundarioTexto}>
            grupo desistiu — revelar
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

// ─── Sub-tela: Reveal ─────────────────────────────────────────────────────────
function SubTelaReveal({
  rodada,
  onJogarDeNovo,
  onEscolherOutra,
}: {
  rodada: RodadaEntrelinhas;
  onJogarDeNovo: () => void;
  onEscolherOutra: () => void;
}) {
  const [contextoVisivel, setContextoVisivel] = useState(false);
  const { historia, resultado } = rodada;
  const resolvida = resultado === 'resolvida';

  return (
    <View style={estilos.subtela}>
      <View style={estilos.cabecalho}>
        <Text style={estilos.titulo}>{historia.titulo}</Text>
        <View
          style={[
            estilos.badgeResultado,
            {
              backgroundColor: resolvida
                ? `${COR_RESOLVIDA}18`
                : `${COR_DESISTIU}18`,
            },
          ]}
        >
          <Text
            style={[
              estilos.badgeResultadoTexto,
              { color: resolvida ? COR_RESOLVIDA : COR_DESISTIU },
            ]}
          >
            {resolvida ? '✓ resolvida' : '✗ não resolvida'}
          </Text>
        </View>
      </View>

      {/* Solução */}
      <View
        style={[
          estilos.cardSolucaoReveal,
          {
            borderColor: resolvida
              ? `${COR_RESOLVIDA}50`
              : `${COR_DESISTIU}30`,
          },
        ]}
      >
        <Text style={estilos.solucaoLabel}>solução</Text>
        <Text style={estilos.solucaoTexto}>{historia.solucao}</Text>
      </View>

      {/* Rever contexto */}
      <Pressable
        onPress={() => {
          void Haptics.selectionAsync();
          setContextoVisivel((v) => !v);
        }}
        accessibilityRole="button"
        style={({ pressed }) => [
          estilos.toggleSolucao,
          pressed && estilos.pressionado,
        ]}
      >
        <Text style={estilos.toggleTexto}>
          {contextoVisivel ? 'ocultar contexto ▲' : 'rever contexto ▼'}
        </Text>
      </Pressable>

      {contextoVisivel && (
        <View style={estilos.cardContextoMini}>
          <Text style={estilos.contextoMiniTexto}>{historia.contexto}</Text>
        </View>
      )}

      <View style={estilos.rodape}>
        <Pressable
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onEscolherOutra();
          }}
          accessibilityRole="button"
          style={({ pressed }) => [
            estilos.botaoPrimario,
            pressed && estilos.botaoPrimarioPressionado,
          ]}
        >
          <Text style={estilos.botaoPrimarioTexto}>escolher outra história</Text>
        </Pressable>

        <Pressable
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onJogarDeNovo();
          }}
          accessibilityRole="button"
          style={({ pressed }) => [
            estilos.botaoSecundario,
            pressed && estilos.pressionado,
          ]}
        >
          <Text style={estilos.botaoSecundarioTexto}>
            jogar essa história de novo
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export function TelaJogoLocalEntrelinhas({ route, navigation }: Props) {
  const { historiaId } = route.params;

  const [rodada, setRodada] = useState<RodadaEntrelinhas | null>(() =>
    criarRodada(historiaId),
  );

  const fadeAnim = useRef(new Animated.Value(1)).current;

  function transicionar(proximo: RodadaEntrelinhas | null) {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 160,
        useNativeDriver: true,
      }),
    ]).start();
    setRodada(proximo);
  }

  if (!rodada) {
    // história não encontrada — volta para a lista
    navigation.goBack();
    return null;
  }

  function handleComecar() {
    if (!rodada) return;
    transicionar(iniciarInvestigacao(rodada));
  }

  function handleResolvida() {
    if (!rodada) return;
    transicionar(revelarSolucao(rodada, 'resolvida'));
  }

  function handleDesistiu() {
    if (!rodada) return;
    transicionar(revelarSolucao(rodada, 'desistiu'));
  }

  function handleJogarDeNovo() {
    transicionar(criarRodada(historiaId));
  }

  function handleEscolherOutra() {
    navigation.goBack();
  }

  return (
    <SafeAreaView style={estilos.tela} edges={['top', 'bottom']}>
      <Animated.View style={[estilos.conteudo, { opacity: fadeAnim }]}>
        <ScrollView
          style={estilos.scroll}
          contentContainerStyle={estilos.scrollConteudo}
          showsVerticalScrollIndicator={false}
        >
          {rodada.subFase === 'narrando' && (
            <SubTelaNarrando
              rodada={rodada}
              onComecar={handleComecar}
              onVoltar={handleEscolherOutra}
            />
          )}
          {rodada.subFase === 'investigando' && (
            <SubTelaInvestigando
              rodada={rodada}
              onResolvida={handleResolvida}
              onDesistiu={handleDesistiu}
            />
          )}
          {rodada.subFase === 'reveal' && (
            <SubTelaReveal
              rodada={rodada}
              onJogarDeNovo={handleJogarDeNovo}
              onEscolherOutra={handleEscolherOutra}
            />
          )}
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const estilos = StyleSheet.create({
  tela: { backgroundColor: cores.fundo, flex: 1 },
  conteudo: { flex: 1 },
  scroll: { flex: 1 },
  scrollConteudo: {
    flexGrow: 1,
    padding: espacamento.lg,
    paddingBottom: espacamento.xxxl,
  },
  subtela: {
    flex: 1,
    gap: espacamento.md,
  },

  // Cabeçalho
  cabecalho: {
    gap: espacamento.sm,
    marginBottom: espacamento.sm,
    marginTop: espacamento.sm,
  },
  titulo: {
    color: cores.texto,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoTituloGrande,
    fontWeight: tipografia.pesoExtraBold,
    letterSpacing: tipografia.spacingTitulo,
    lineHeight: 38,
  },
  instrucao: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpoMenor,
  },

  // Badges
  badge: {
    alignSelf: 'flex-start',
    borderRadius: raio.pill,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  badgeTexto: {
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    fontWeight: tipografia.pesoBold,
  },
  badgeInvestigando: {
    alignSelf: 'flex-start',
    backgroundColor: COR_ENTRELINHAS_SUAVE,
    borderColor: COR_ENTRELINHAS_BORDA,
    borderRadius: raio.pill,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  badgeInvestigandoTexto: {
    color: COR_ENTRELINHAS,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    fontWeight: tipografia.pesoBold,
  },
  badgeResultado: {
    alignSelf: 'flex-start',
    borderRadius: raio.pill,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  badgeResultadoTexto: {
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    fontWeight: tipografia.pesoBold,
  },

  // Cards
  cardContexto: {
    backgroundColor: cores.superficie,
    borderColor: cores.borda,
    borderRadius: raio.lg,
    borderWidth: 1,
    padding: espacamento.lg,
    ...sombra.sutil,
  },
  contextoTexto: {
    color: cores.texto,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpoMaior,
    lineHeight: 26,
  },
  cardContextoMini: {
    backgroundColor: cores.superficieElevada,
    borderColor: cores.borda,
    borderRadius: raio.md,
    borderWidth: 1,
    padding: espacamento.md,
  },
  contextoMiniTexto: {
    color: cores.textoSecundario,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpoMenor,
    lineHeight: 20,
  },
  cardInstrucao: {
    backgroundColor: COR_ENTRELINHAS_SUAVE,
    borderColor: COR_ENTRELINHAS_BORDA,
    borderRadius: raio.md,
    borderWidth: 1,
    padding: espacamento.md,
  },
  instrucaoTexto: {
    color: cores.texto,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpo,
    lineHeight: 24,
  },
  instrucaoDestaque: {
    color: COR_ENTRELINHAS,
    fontWeight: tipografia.pesoBold,
  },

  // Spoiler / toggle
  toggleSolucao: {
    alignSelf: 'flex-start',
    justifyContent: 'center',
    minHeight: 44,
    paddingVertical: espacamento.sm,
  },
  toggleTexto: {
    color: COR_ENTRELINHAS,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpoMenor,
    fontWeight: tipografia.pesoBold,
  },
  cardSpoiler: {
    backgroundColor: 'rgba(139,92,246,0.06)',
    borderColor: COR_ENTRELINHAS_BORDA,
    borderRadius: raio.md,
    borderWidth: 1,
    gap: espacamento.sm,
    padding: espacamento.md,
  },
  spoilerLabel: {
    color: COR_ENTRELINHAS,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    fontWeight: tipografia.pesoSemibold,
    letterSpacing: tipografia.spacingLegenda,
    textTransform: 'uppercase',
  },
  spoilerTexto: {
    color: cores.texto,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpo,
    lineHeight: 23,
  },

  // Reveal — solução pública
  cardSolucaoReveal: {
    backgroundColor: cores.superficie,
    borderRadius: raio.lg,
    borderWidth: 1.5,
    gap: espacamento.sm,
    padding: espacamento.lg,
    ...sombra.sutil,
  },
  solucaoLabel: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    fontWeight: tipografia.pesoSemibold,
    letterSpacing: tipografia.spacingLegenda,
    textTransform: 'uppercase',
  },
  solucaoTexto: {
    color: cores.texto,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpoMaior,
    lineHeight: 26,
  },

  // Botões
  rodape: {
    gap: espacamento.sm,
    marginTop: 'auto',
    paddingTop: espacamento.xl,
  },
  botaoPrimario: {
    alignItems: 'center',
    backgroundColor: COR_ENTRELINHAS,
    borderRadius: raio.md,
    justifyContent: 'center',
    minHeight: 56,
    paddingHorizontal: espacamento.lg,
    paddingVertical: espacamento.md,
    ...sombra.forte,
  },
  botaoPrimarioPressionado: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  botaoPrimarioTexto: {
    color: '#FFFFFF',
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpo,
    fontWeight: tipografia.pesoBold,
    textAlign: 'center',
  },
  botaoSecundario: {
    alignItems: 'center',
    backgroundColor: cores.superficie,
    borderColor: cores.borda,
    borderRadius: raio.md,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: espacamento.lg,
    paddingVertical: espacamento.md,
  },
  botaoSecundarioTexto: {
    color: cores.textoSecundario,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpo,
    fontWeight: tipografia.pesoSemibold,
    textAlign: 'center',
  },
  botaoGhost: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    paddingVertical: espacamento.sm,
  },
  botaoGhostTexto: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpoMenor,
  },

  // Utils
  pressionado: {
    opacity: 0.72,
    transform: [{ scale: 0.98 }],
  },
});
