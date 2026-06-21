import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { useEffect, useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  CONFIG_DIFICULDADE_CS,
  PALETA_CORES_CS,
  criarEstadoInicial,
  registrarTentativa,
  reiniciarEstado,
  tentativasRestantes,
} from '@/games/solo/codigo-secreto';
import type { CorCS, EstadoCS, TentativaCS } from '@/games/solo/codigo-secreto';
import { LABEL_DIFICULDADE } from '@/games/solo/types';
import type { SoloStackParamList } from '@/navigation/types';
import { registrarResultadoCS } from '@/services/solo/progressoCodigoSecreto';
import { cores, espacamento, familias, raio, tipografia } from '@/theme/colors';

type Props = NativeStackScreenProps<SoloStackParamList, 'CodigoSecreto'>;

const COR_CS = '#8B5CF6';

export function TelaCodigoSecreto({ route, navigation }: Props) {
  const { dificuldade } = route.params;
  const config = CONFIG_DIFICULDADE_CS[dificuldade];
  const paleta = useMemo(
    () => PALETA_CORES_CS.slice(0, config.numCores),
    [config.numCores],
  );

  const [estado, setEstado] = useState<EstadoCS>(() =>
    criarEstadoInicial(dificuldade),
  );
  const [palpiteAtual, setPalpiteAtual] = useState<CorCS[]>([]);

  // Persistência ao concluir.
  useEffect(() => {
    if (!estado.concluido) return;
    void Haptics.notificationAsync(
      estado.venceu
        ? Haptics.NotificationFeedbackType.Success
        : Haptics.NotificationFeedbackType.Error,
    );
    void registrarResultadoCS(dificuldade, estado.venceu, estado.tentativas.length);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estado.concluido]);

  const restantes = tentativasRestantes(estado);
  const cheio = palpiteAtual.length === config.numPosicoes;

  function aoSelecionarCor(cor: CorCS) {
    if (estado.concluido || cheio) return;
    void Haptics.selectionAsync();
    setPalpiteAtual((p) => [...p, cor]);
  }

  function aoApagarUltimo() {
    if (palpiteAtual.length === 0) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPalpiteAtual((p) => p.slice(0, -1));
  }

  function aoLimpar() {
    if (palpiteAtual.length === 0) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPalpiteAtual([]);
  }

  function aoEnviar() {
    if (!cheio || estado.concluido) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setEstado((e) => registrarTentativa(e, palpiteAtual));
    setPalpiteAtual([]);
  }

  function aoJogarDeNovo() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEstado(reiniciarEstado(estado));
    setPalpiteAtual([]);
  }

  return (
    <SafeAreaView style={estilos.safe} edges={['top', 'bottom']}>
      {/* Cabeçalho */}
      <View style={estilos.cabecalho}>
        <TouchableOpacity
          style={estilos.botaoVoltar}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={estilos.setaVoltar}>←</Text>
        </TouchableOpacity>
        <View style={estilos.cabecalhoCentro}>
          <Text style={estilos.cabecalhoTitulo}>Código Secreto</Text>
          <Text style={estilos.cabecalhoSub}>
            {LABEL_DIFICULDADE[dificuldade]}
          </Text>
        </View>
        <View
          style={[
            estilos.tentativasChip,
            restantes <= 2 && !estado.concluido && estilos.tentativasChipAlerta,
          ]}
        >
          <Text style={estilos.tentativasTexto}>{restantes}</Text>
        </View>
      </View>

      {/* Histórico de tentativas */}
      <ScrollView
        style={estilos.historico}
        contentContainerStyle={estilos.historicoConteudo}
        showsVerticalScrollIndicator={false}
      >
        {estado.tentativas.length === 0 && (
          <Text style={estilos.dicaInicial}>
            escolha {config.numPosicoes} cores e toque em "enviar palpite" para
            começar a decifrar.
          </Text>
        )}
        {estado.tentativas.map((t, i) => (
          <LinhaTentativa key={i} numero={i + 1} tentativa={t} paleta={paleta} />
        ))}
      </ScrollView>

      {/* Linha atual + paleta */}
      {!estado.concluido && (
        <View style={estilos.area}>
          <View style={estilos.slotsLinha}>
            {Array.from({ length: config.numPosicoes }).map((_, i) => {
              const corIdx = palpiteAtual[i];
              return (
                <View
                  key={i}
                  style={[
                    estilos.slot,
                    corIdx !== undefined && {
                      backgroundColor: paleta[corIdx],
                      borderWidth: 0,
                    },
                  ]}
                />
              );
            })}
          </View>

          <View style={estilos.paletaLinha}>
            {paleta.map((cor, i) => (
              <TouchableOpacity
                key={i}
                style={[estilos.botaoCor, { backgroundColor: cor }]}
                onPress={() => aoSelecionarCor(i)}
                activeOpacity={0.8}
                disabled={cheio}
              />
            ))}
          </View>

          <View style={estilos.acoesLinha}>
            <TouchableOpacity
              style={estilos.botaoSecundario}
              onPress={aoLimpar}
              activeOpacity={0.8}
            >
              <Text style={estilos.botaoSecundarioTexto}>limpar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={estilos.botaoSecundario}
              onPress={aoApagarUltimo}
              activeOpacity={0.8}
            >
              <Text style={estilos.botaoSecundarioTexto}>apagar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                estilos.botaoEnviar,
                { backgroundColor: cheio ? COR_CS : cores.borda },
              ]}
              onPress={aoEnviar}
              disabled={!cheio}
              activeOpacity={0.85}
            >
              <Text
                style={[
                  estilos.botaoEnviarTexto,
                  { color: cheio ? '#fff' : cores.textoMudo },
                ]}
              >
                enviar palpite
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Overlay de fim de jogo */}
      {estado.concluido && (
        <TelaFim
          estado={estado}
          paleta={paleta}
          onJogarDeNovo={aoJogarDeNovo}
          onVoltar={() => navigation.goBack()}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Linha do histórico ───────────────────────────────────────────────────────

function LinhaTentativa({
  numero,
  tentativa,
  paleta,
}: {
  numero: number;
  tentativa: TentativaCS;
  paleta: string[];
}) {
  return (
    <View style={estilos.linhaHistorico}>
      <Text style={estilos.linhaNumero}>{numero}</Text>
      <View style={estilos.linhaPinos}>
        {tentativa.palpite.map((corIdx, i) => (
          <View
            key={i}
            style={[estilos.pinoHistorico, { backgroundColor: paleta[corIdx] }]}
          />
        ))}
      </View>
      <View style={estilos.feedbackContainer}>
        {Array.from({ length: tentativa.corretasPosicao }).map((_, i) => (
          <View key={`p${i}`} style={estilos.feedbackPinoCheio} />
        ))}
        {Array.from({ length: tentativa.corretasCor }).map((_, i) => (
          <View key={`c${i}`} style={estilos.feedbackPinoVazio} />
        ))}
      </View>
    </View>
  );
}

// ─── Overlay de fim de jogo ───────────────────────────────────────────────────

function TelaFim({
  estado,
  paleta,
  onJogarDeNovo,
  onVoltar,
}: {
  estado: EstadoCS;
  paleta: string[];
  onJogarDeNovo: () => void;
  onVoltar: () => void;
}) {
  return (
    <View style={estilos.fimOverlay}>
      <View style={estilos.fimCard}>
        <Text style={estilos.fimTitulo}>
          {estado.venceu ? 'decifrado!' : 'fim das tentativas'}
        </Text>
        <Text style={estilos.fimSubtitulo}>
          {estado.venceu
            ? `você acertou em ${estado.tentativas.length} tentativa${estado.tentativas.length > 1 ? 's' : ''}`
            : 'a senha secreta era:'}
        </Text>

        <View style={estilos.fimSenha}>
          {estado.senha.map((corIdx, i) => (
            <View
              key={i}
              style={[estilos.pinoHistorico, { backgroundColor: paleta[corIdx] }]}
            />
          ))}
        </View>

        <TouchableOpacity
          style={[estilos.vitoriaBotaoPrincipal, { backgroundColor: COR_CS }]}
          onPress={onJogarDeNovo}
          activeOpacity={0.85}
        >
          <Text style={estilos.vitoriaBotaoPrincipalTexto}>jogar de novo</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onVoltar} activeOpacity={0.7}>
          <Text style={estilos.vitoriaBotaoSecundario}>voltar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const estilos = StyleSheet.create({
  acoesLinha: {
    flexDirection: 'row',
    gap: espacamento.xs,
  },
  area: {
    borderTopColor: cores.borda,
    borderTopWidth: 1,
    gap: espacamento.sm,
    paddingHorizontal: espacamento.md,
    paddingTop: espacamento.sm,
  },
  botaoCor: {
    borderRadius: 22,
    height: 44,
    width: 44,
  },
  botaoEnviar: {
    alignItems: 'center',
    borderRadius: raio.md,
    flex: 2,
    justifyContent: 'center',
    paddingVertical: 12,
  },
  botaoEnviarTexto: {
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpoMenor,
    fontWeight: '700',
  },
  botaoSecundario: {
    alignItems: 'center',
    backgroundColor: cores.fundoSecundario,
    borderColor: cores.borda,
    borderRadius: raio.md,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 12,
  },
  botaoSecundarioTexto: {
    color: cores.texto,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpoMenor,
    fontWeight: '600',
  },
  botaoVoltar: {
    paddingHorizontal: espacamento.xs,
    paddingVertical: espacamento.xs,
  },
  cabecalho: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: espacamento.md,
    paddingVertical: espacamento.sm,
  },
  cabecalhoCentro: {
    alignItems: 'center',
    flex: 1,
  },
  cabecalhoSub: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    marginTop: 2,
  },
  cabecalhoTitulo: {
    color: cores.texto,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoSubtitulo,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  dicaInicial: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpoMenor,
    lineHeight: 21,
    paddingVertical: espacamento.lg,
    textAlign: 'center',
  },
  feedbackContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 3,
    width: 36,
  },
  feedbackPinoCheio: {
    backgroundColor: cores.texto,
    borderRadius: 5,
    height: 10,
    width: 10,
  },
  feedbackPinoVazio: {
    backgroundColor: 'transparent',
    borderColor: cores.textoMudo,
    borderRadius: 5,
    borderWidth: 1.5,
    height: 10,
    width: 10,
  },
  fimCard: {
    alignItems: 'center',
    backgroundColor: cores.fundoSecundario,
    borderRadius: raio.xl,
    gap: espacamento.xs,
    padding: espacamento.xl,
    width: '82%',
  },
  fimOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    backgroundColor: 'rgba(22,22,22,0.55)',
    justifyContent: 'center',
  },
  fimSenha: {
    flexDirection: 'row',
    gap: 6,
    marginVertical: espacamento.md,
  },
  fimSubtitulo: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpoMenor,
    textAlign: 'center',
  },
  fimTitulo: {
    color: cores.texto,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoTituloGrande,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  historico: {
    flex: 1,
  },
  historicoConteudo: {
    gap: espacamento.xs,
    paddingHorizontal: espacamento.md,
    paddingVertical: espacamento.sm,
  },
  linhaHistorico: {
    alignItems: 'center',
    backgroundColor: cores.fundoSecundario,
    borderRadius: raio.md,
    flexDirection: 'row',
    gap: espacamento.sm,
    paddingHorizontal: espacamento.sm,
    paddingVertical: espacamento.xs,
  },
  linhaNumero: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    fontWeight: '700',
    width: 18,
  },
  linhaPinos: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  paletaLinha: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: espacamento.sm,
    justifyContent: 'center',
  },
  pinoHistorico: {
    borderRadius: 14,
    height: 28,
    width: 28,
  },
  safe: {
    backgroundColor: cores.fundo,
    flex: 1,
  },
  setaVoltar: {
    color: cores.primaria,
    fontSize: 22,
    fontWeight: '600',
  },
  slot: {
    borderColor: cores.borda,
    borderRadius: 18,
    borderWidth: 2,
    height: 36,
    width: 36,
  },
  slotsLinha: {
    flexDirection: 'row',
    gap: espacamento.sm,
    justifyContent: 'center',
  },
  tentativasChip: {
    alignItems: 'center',
    backgroundColor: cores.fundoSecundario,
    borderColor: cores.borda,
    borderRadius: raio.sm,
    borderWidth: 1,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  tentativasChipAlerta: {
    backgroundColor: cores.erro + '22',
    borderColor: cores.erro,
  },
  tentativasTexto: {
    color: cores.texto,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpoMenor,
    fontWeight: '800',
  },
  vitoriaBotaoPrincipal: {
    alignItems: 'center',
    alignSelf: 'stretch',
    borderRadius: raio.md,
    marginTop: espacamento.sm,
    paddingVertical: 14,
  },
  vitoriaBotaoPrincipalTexto: {
    color: '#fff',
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpo,
    fontWeight: '700',
  },
  vitoriaBotaoSecundario: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpoMenor,
    fontWeight: '600',
    marginTop: espacamento.sm,
    textAlign: 'center',
  },
});
