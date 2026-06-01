import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  CardJogoCatalogo,
  type JogoCatalogoItem,
} from '@/components/CardJogoCatalogo';
import { cores, espacamento, familias, tipografia } from '@/theme/colors';

export interface SecaoJogosItem {
  id: string;
  titulo: string;
  subtitulo?: string;
  tipo: 'recentes' | 'categoria_principal' | 'contexto' | 'tag' | 'todos';
  categoriaPrincipalId?: string;
  contextoId?: string;
  tagId?: string;
  jogos: JogoCatalogoItem[];
}

interface Props {
  secao: SecaoJogosItem;
  onEscolherJogo: (jogo: JogoCatalogoItem) => void;
  onVerMais?: (secao: SecaoJogosItem) => void;
  compacto?: boolean;
}

export function SecaoJogosHorizontal({
  secao,
  onEscolherJogo,
  onVerMais,
  compacto = false,
}: Props) {
  if (secao.jogos.length === 0) return null;

  return (
    <View style={estilos.container}>
      <View style={estilos.cabecalho}>
        <View style={estilos.titulos}>
          <Text style={estilos.titulo}>{secao.titulo}</Text>
          {secao.subtitulo ? (
            <Text style={estilos.subtitulo} numberOfLines={1}>
              {secao.subtitulo}
            </Text>
          ) : null}
        </View>

        {onVerMais && secao.tipo !== 'recentes' ? (
          <Pressable
            onPress={() => onVerMais(secao)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={`Ver mais jogos de ${secao.titulo}`}
            style={({ pressed }) => [
              estilos.verMais,
              pressed && estilos.verMaisPressionado,
            ]}
          >
            <Text style={estilos.verMaisTexto}>ver mais</Text>
          </Pressable>
        ) : null}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={estilos.scroll}
        contentContainerStyle={estilos.scrollConteudo}
        decelerationRate="fast"
      >
        {secao.jogos.map((jogo) => (
          <CardJogoCatalogo
            key={jogo.id}
            jogo={jogo}
            compacto={compacto}
            onPress={onEscolherJogo}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const estilos = StyleSheet.create({
  cabecalho: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: espacamento.md,
    justifyContent: 'space-between',
    paddingHorizontal: espacamento.lg,
  },
  container: {
    gap: espacamento.sm + 4,
    marginBottom: espacamento.xl,
  },
  scroll: {
    marginHorizontal: 0,
  },
  scrollConteudo: {
    gap: espacamento.md - 4,
    paddingHorizontal: espacamento.lg,
    paddingVertical: 2,
  },
  subtitulo: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    lineHeight: 16,
  },
  titulo: {
    color: cores.texto,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoSubtitulo,
    fontWeight: tipografia.pesoExtraBold,
    letterSpacing: 0,
  },
  titulos: {
    flex: 1,
    gap: 2,
  },
  verMais: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: espacamento.xs,
  },
  verMaisPressionado: {
    opacity: 0.55,
  },
  verMaisTexto: {
    color: cores.primaria,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpoMenor,
    fontWeight: tipografia.pesoSemibold,
    letterSpacing: 0,
  },
});
