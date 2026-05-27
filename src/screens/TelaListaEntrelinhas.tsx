import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { useCallback, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BotaoVoltar } from '@/components';
import {
  HISTORIAS,
  type DificuldadeFiltro,
  type Historia,
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

type Props = NativeStackScreenProps<RootStackParamList, 'ListaEntrelinhas'>;

// ─── Identidade visual ────────────────────────────────────────────────────────
const COR_ENTRELINHAS = '#8B5CF6';
const COR_FACIL = '#22C55E';
const COR_MEDIA = '#FFBE0B';
const COR_DIFICIL = '#EF4444';

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

// ─── Chip de filtro ───────────────────────────────────────────────────────────
interface ChipProps {
  label: string;
  ativo: boolean;
  onPress: () => void;
}
function Chip({ label, ativo, onPress }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: ativo }}
      style={({ pressed }) => [
        estilos.chip,
        ativo && estilos.chipAtivo,
        pressed && estilos.pressionado,
      ]}
    >
      <Text style={[estilos.chipTexto, ativo && estilos.chipTextoAtivo]}>
        {label}
      </Text>
    </Pressable>
  );
}

// ─── Item da lista ────────────────────────────────────────────────────────────
interface ItemProps {
  historia: Historia;
  aberta: boolean;
  onToggle: () => void;
  onJogar: () => void;
}
function ItemHistoria({ historia, aberta, onToggle, onJogar }: ItemProps) {
  const alturaAnim = useRef(new Animated.Value(aberta ? 1 : 0)).current;

  const toggle = useCallback(() => {
    void Haptics.selectionAsync();
    Animated.spring(alturaAnim, {
      toValue: aberta ? 0 : 1,
      useNativeDriver: false,
      bounciness: 0,
      speed: 20,
    }).start();
    onToggle();
  }, [aberta, alturaAnim, onToggle]);

  const cor = corDif(historia.dificuldade);

  return (
    <View style={estilos.item}>
      {/* Linha clicável do título */}
      <Pressable
        onPress={toggle}
        accessibilityRole="button"
        accessibilityLabel={`${historia.titulo}, ${labelDif(historia.dificuldade)}`}
        accessibilityState={{ expanded: aberta }}
        style={({ pressed }) => [estilos.itemTopo, pressed && estilos.pressionado]}
      >
        <Text style={estilos.itemSeta}>{aberta ? '▾' : '▸'}</Text>
        <Text style={estilos.itemTitulo} numberOfLines={aberta ? undefined : 1}>
          {historia.titulo}
        </Text>
        <View
          style={[
            estilos.itemBadge,
            { backgroundColor: `${cor}18`, borderColor: `${cor}40` },
          ]}
        >
          <Text style={[estilos.itemBadgeTexto, { color: cor }]}>
            {labelDif(historia.dificuldade)}
          </Text>
        </View>
      </Pressable>

      {/* Accordion */}
      {aberta && (
        <View style={estilos.accordion}>
          <Text style={estilos.accordionLabel}>contexto</Text>
          <Text style={estilos.accordionContexto}>{historia.contexto}</Text>

          <Pressable
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onJogar();
            }}
            accessibilityRole="button"
            accessibilityLabel={`Jogar ${historia.titulo}`}
            style={({ pressed }) => [
              estilos.botaoJogar,
              pressed && estilos.botaoJogarPressionado,
            ]}
          >
            <Text style={estilos.botaoJogarTexto}>jogar essa história</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

// ─── Tela principal ───────────────────────────────────────────────────────────
const FILTROS: { valor: DificuldadeFiltro; label: string }[] = [
  { valor: 'todas', label: 'todas' },
  { valor: 'facil', label: 'fácil' },
  { valor: 'media', label: 'média' },
  { valor: 'dificil', label: 'difícil' },
];

export function TelaListaEntrelinhas({ navigation }: Props) {
  const [filtro, setFiltro] = useState<DificuldadeFiltro>('todas');
  const [abertaId, setAbertaId] = useState<string | null>(null);

  const historiasFiltradas =
    filtro === 'todas'
      ? HISTORIAS
      : HISTORIAS.filter((h) => h.dificuldade === filtro);

  const total = historiasFiltradas.length;

  function toggleItem(id: string) {
    setAbertaId((prev) => (prev === id ? null : id));
  }

  function jogar(historiaId: string) {
    navigation.navigate('JogoLocalEntrelinhas', { historiaId });
  }

  function mudarFiltro(valor: DificuldadeFiltro) {
    void Haptics.selectionAsync();
    setFiltro(valor);
    setAbertaId(null);
  }

  return (
    <SafeAreaView style={estilos.tela} edges={['top', 'bottom']}>
      <BotaoVoltar onPress={() => navigation.goBack()} />

      <ScrollView
        style={estilos.scroll}
        contentContainerStyle={estilos.scrollConteudo}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Cabeçalho */}
        <View style={estilos.cabecalho}>
          <Text style={estilos.titulo}>Entrelinhas</Text>
          <Text style={estilos.subtitulo}>
            o contexto é real. a conclusão está errada.
          </Text>
        </View>

        {/* Filtros */}
        <View style={estilos.filtros}>
          {FILTROS.map((f) => (
            <Chip
              key={f.valor}
              label={f.label}
              ativo={filtro === f.valor}
              onPress={() => mudarFiltro(f.valor)}
            />
          ))}
        </View>

        {/* Contador */}
        <Text style={estilos.contador}>
          {total} {total === 1 ? 'história' : 'histórias'}
        </Text>

        {/* Lista */}
        <View style={estilos.lista}>
          {historiasFiltradas.map((historia) => (
            <ItemHistoria
              key={historia.id}
              historia={historia}
              aberta={abertaId === historia.id}
              onToggle={() => toggleItem(historia.id)}
              onJogar={() => jogar(historia.id)}
            />
          ))}
        </View>

        {/* Instrução de rodapé */}
        <Text style={estilos.rodape}>
          toque no título para ver o contexto antes de jogar.{'\n'}o narrador lê
          em voz alta — o grupo investiga com perguntas sim/não.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const estilos = StyleSheet.create({
  tela: {
    backgroundColor: cores.fundo,
    flex: 1,
  },
  scroll: { flex: 1 },
  scrollConteudo: {
    paddingBottom: espacamento.xxxl,
    paddingHorizontal: espacamento.lg,
  },

  // Cabeçalho
  cabecalho: {
    marginBottom: espacamento.lg,
    marginTop: espacamento.xl + espacamento.lg, // espaço para o BotaoVoltar
  },
  titulo: {
    color: cores.texto,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoTituloGrande,
    fontWeight: tipografia.pesoExtraBold,
    letterSpacing: tipografia.spacingTitulo,
  },
  subtitulo: {
    color: cores.textoSecundario,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpoMenor,
    marginTop: espacamento.xs,
  },

  // Filtros
  filtros: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: espacamento.sm,
    marginBottom: espacamento.md,
  },
  chip: {
    alignItems: 'center',
    backgroundColor: cores.superficie,
    borderColor: cores.borda,
    borderRadius: raio.pill,
    borderWidth: 1,
    minHeight: 36,
    justifyContent: 'center',
    paddingHorizontal: espacamento.md,
    paddingVertical: espacamento.xs,
  },
  chipAtivo: {
    backgroundColor: COR_ENTRELINHAS,
    borderColor: COR_ENTRELINHAS,
  },
  chipTexto: {
    color: cores.textoSecundario,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    fontWeight: tipografia.pesoBold,
  },
  chipTextoAtivo: {
    color: '#FFFFFF',
  },

  // Contador
  contador: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    marginBottom: espacamento.md,
  },

  // Lista
  lista: {
    gap: espacamento.sm - 2,
  },

  // Item
  item: {
    backgroundColor: cores.superficie,
    borderColor: cores.borda,
    borderRadius: raio.lg,
    borderWidth: 1,
    overflow: 'hidden',
    ...sombra.sutil,
  },
  itemTopo: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: espacamento.sm,
    minHeight: 52,
    paddingHorizontal: espacamento.md,
    paddingVertical: espacamento.md,
  },
  itemSeta: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpoMenor,
    width: 14,
  },
  itemTitulo: {
    color: cores.texto,
    flex: 1,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpo,
    fontWeight: tipografia.pesoSemibold,
  },
  itemBadge: {
    borderRadius: raio.pill,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  itemBadgeTexto: {
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    fontWeight: tipografia.pesoBold,
  },

  // Accordion
  accordion: {
    borderTopColor: cores.borda,
    borderTopWidth: 1,
    gap: espacamento.md,
    padding: espacamento.md,
    paddingTop: espacamento.md,
  },
  accordionLabel: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    fontWeight: tipografia.pesoSemibold,
    letterSpacing: tipografia.spacingLegenda,
    textTransform: 'uppercase',
  },
  accordionContexto: {
    color: cores.texto,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpoMaior,
    lineHeight: 26,
  },
  botaoJogar: {
    alignItems: 'center',
    backgroundColor: COR_ENTRELINHAS,
    borderRadius: raio.md,
    minHeight: 52,
    justifyContent: 'center',
    marginTop: espacamento.xs,
    paddingHorizontal: espacamento.lg,
    paddingVertical: espacamento.md,
    ...sombra.forte,
  },
  botaoJogarPressionado: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  botaoJogarTexto: {
    color: '#FFFFFF',
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpo,
    fontWeight: tipografia.pesoBold,
  },

  // Rodapé
  rodape: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    lineHeight: 18,
    marginTop: espacamento.xl,
    textAlign: 'center',
  },

  // Utils
  pressionado: {
    opacity: 0.72,
    transform: [{ scale: 0.98 }],
  },
});
