import { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// TODO(arch): Components não devem importar de /games. O conteúdo de regras
// do Modal deveria ser injetado via prop ou consumido de um hook genérico
// /hooks/useRegrasDoJogo() que conheça o gameId atual via context.
// eslint-disable-next-line import/no-restricted-paths
import { JOGOS } from '@/games/gameRegistry';
import { getSomAtivo, observarSomAtivo, setSomAtivo } from '@/services/audio';
import {
  cores,
  espacamento,
  raio,
  sombra,
  tamanhos,
  tipografia,
} from '@/theme/colors';

const JOGO_ID = 'mrwhite';
const COR_OVERLAY_MODAL = 'rgba(0, 0, 0, 0.5)';

export function BarraAcoesJogo() {
  const [somAtivo, setSom] = useState(getSomAtivo());
  const [regrasAbertas, setRegrasAbertas] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => observarSomAtivo(setSom), []);

  return (
    <>
      <View
        style={[estilos.barra, { top: insets.top + 8 }]}
        pointerEvents="box-none"
      >
        <Pressable
          onPress={() => {
            void setSomAtivo(!somAtivo);
          }}
          style={({ pressed }) => [
            estilos.botao,
            pressed && estilos.botaoPressionado,
          ]}
          hitSlop={8}
          accessibilityLabel={somAtivo ? 'Desativar som' : 'Ativar som'}
          accessibilityRole="button"
        >
          <Text style={estilos.botaoTexto}>{somAtivo ? '🔊' : '🔇'}</Text>
        </Pressable>
        <Pressable
          onPress={() => setRegrasAbertas(true)}
          style={({ pressed }) => [
            estilos.botao,
            pressed && estilos.botaoPressionado,
          ]}
          hitSlop={8}
          accessibilityLabel="Ver regras"
          accessibilityRole="button"
        >
          <Text style={estilos.botaoTexto}>?</Text>
        </Pressable>
      </View>

      <ModalRegras
        visivel={regrasAbertas}
        aoFechar={() => setRegrasAbertas(false)}
      />
    </>
  );
}

function ModalRegras({
  visivel,
  aoFechar,
}: {
  visivel: boolean;
  aoFechar: () => void;
}) {
  const insets = useSafeAreaInsets();
  const jogo = JOGOS.find((j) => j.id === JOGO_ID);
  if (!jogo) return null;

  return (
    <Modal
      visible={visivel}
      transparent
      animationType="slide"
      onRequestClose={aoFechar}
      statusBarTranslucent
    >
      {/* Overlay escurecido — universalmente correto para modais */}
      <Pressable style={estilos.modalOverlay} onPress={aoFechar} />
      <View
        style={[
          estilos.modalCard,
          { paddingBottom: insets.bottom + espacamento.lg },
        ]}
      >
        <View style={estilos.cabecalho}>
          <View style={estilos.alca} />
        </View>
        <View style={estilos.cabecalhoLinha}>
          <Text style={estilos.titulo}>como jogar</Text>
          <Pressable
            onPress={aoFechar}
            hitSlop={12}
            accessibilityLabel="Fechar regras"
            accessibilityRole="button"
          >
            <Text style={estilos.fechar}>×</Text>
          </Pressable>
        </View>

        <ScrollView
          style={estilos.scroll}
          contentContainerStyle={estilos.scrollConteudo}
          showsVerticalScrollIndicator={false}
        >
          <Text style={estilos.objetivo}>{jogo.instrucoes.objetivo}</Text>

          <Text style={estilos.rotulo}>PASSOS</Text>
          {jogo.instrucoes.passos.map((p, i) => (
            <View key={i} style={estilos.passo}>
              <Text style={estilos.passoNumero}>{i + 1}</Text>
              <Text style={estilos.passoTexto}>{p}</Text>
            </View>
          ))}

          <Text style={[estilos.rotulo, estilos.rotuloEspaco]}>DICAS</Text>
          {jogo.instrucoes.dicas.map((d, i) => (
            <View key={i} style={estilos.dica}>
              <Text style={estilos.dicaBullet}>▸</Text>
              <Text style={estilos.dicaTexto}>{d}</Text>
            </View>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

const estilos = StyleSheet.create({
  alca: {
    backgroundColor: cores.borda,
    borderRadius: 2,
    height: 4,
    width: 40,
  },
  barra: {
    flexDirection: 'row',
    gap: espacamento.sm,
    position: 'absolute',
    right: espacamento.md,
    zIndex: 50,
  },
  // Botão: superficie branca com borda quente — funciona em contexto claro e escuro
  botao: {
    alignItems: 'center',
    backgroundColor: cores.superficie,
    borderColor: cores.borda,
    borderRadius: tamanhos.botaoVoltar / 2,
    borderWidth: 1,
    height: tamanhos.botaoVoltar,
    justifyContent: 'center',
    ...sombra.baixa,
    width: tamanhos.botaoVoltar,
  },
  botaoPressionado: {
    backgroundColor: cores.fundoSecundario,
    opacity: 0.8,
    transform: [{ scale: 0.92 }],
  },
  botaoTexto: {
    color: cores.texto,
    fontSize: tipografia.tamanhoSegmento,
    fontWeight: tipografia.pesoBold,
    textAlign: 'center',
  },
  cabecalho: {
    alignItems: 'center',
    paddingTop: espacamento.sm,
  },
  cabecalhoLinha: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: espacamento.lg,
    paddingTop: espacamento.md,
  },
  dica: {
    flexDirection: 'row',
    gap: espacamento.sm,
    marginTop: espacamento.sm,
  },
  dicaBullet: {
    color: cores.primaria,
    fontSize: 16,
    fontWeight: tipografia.pesoBold,
    lineHeight: 22,
  },
  dicaTexto: {
    color: cores.texto,
    flex: 1,
    fontSize: tipografia.tamanhoCorpoMenor,
    lineHeight: 22,
  },
  fechar: {
    color: cores.textoSecundario,
    fontSize: 30,
    fontWeight: tipografia.pesoBold,
    lineHeight: 32,
  },
  // Bottom sheet: superficie branca sobre overlay escuro
  modalCard: {
    backgroundColor: cores.superficie,
    borderTopLeftRadius: raio.xl,
    borderTopRightRadius: raio.xl,
    bottom: 0,
    // Sombra para separar do overlay
    left: 0,
    maxHeight: '80%',
    position: 'absolute',
    right: 0,
    ...sombra.modal,
  },
  // Overlay: 50% preto — universalmente correto para modais sobre qualquer fundo
  modalOverlay: {
    backgroundColor: COR_OVERLAY_MODAL,
    flex: 1,
  },
  objetivo: {
    color: cores.textoSecundario,
    fontSize: tipografia.tamanhoCorpoMenor,
    lineHeight: 22,
    marginBottom: espacamento.lg,
  },
  passo: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: espacamento.md - 4,
    marginBottom: espacamento.md,
  },
  passoNumero: {
    alignItems: 'center',
    backgroundColor: cores.primaria,
    borderRadius: 14,
    color: cores.textoSobrePrimaria,
    fontSize: 13,
    fontWeight: tipografia.pesoExtraBold,
    height: 28,
    justifyContent: 'center',
    lineHeight: 28,
    overflow: 'hidden',
    textAlign: 'center',
    width: 28,
  },
  passoTexto: {
    color: cores.texto,
    flex: 1,
    fontSize: tipografia.tamanhoCorpoMenor,
    lineHeight: 22,
    paddingTop: 4,
  },
  rotulo: {
    color: cores.textoMudo,
    fontSize: tipografia.tamanhoMicro,
    fontWeight: tipografia.pesoBold,
    letterSpacing: tipografia.letraSpacingLegenda,
    marginBottom: espacamento.sm,
  },
  rotuloEspaco: {
    marginTop: espacamento.lg,
  },
  scroll: {
    flex: 1,
  },
  scrollConteudo: {
    padding: espacamento.lg,
    paddingTop: espacamento.md,
  },
  titulo: {
    color: cores.texto,
    fontSize: tipografia.tamanhoSubtituloGrande,
    fontWeight: tipografia.pesoExtraBold,
    letterSpacing: tipografia.spacingTitulo,
  },
});
