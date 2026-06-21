import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LABEL_DIFICULDADE } from '@/games/solo/types';
import {
  adicionarRetangulo,
  aplicarDica,
  buscarPuzzle,
  contemCelula,
  criarEstadoInicial,
  normalizarRetangulo,
  obterDica,
  pistasDoPuzzle,
  progresso,
  puzzlesPorDificuldade,
  reiniciarEstado,
  removerRetanguloEm,
  retanguloValido,
} from '@/games/solo/shikaku';
import type { EstadoShikaku, RetanguloShikaku } from '@/games/solo/shikaku';
import type { SoloStackParamList } from '@/navigation/types';
import {
  calcularEstrelas,
  registrarConclusao,
} from '@/services/solo/progressoShikaku';
import { cores, espacamento, familias, raio, tipografia } from '@/theme/colors';

type Props = NativeStackScreenProps<SoloStackParamList, 'Shikaku'>;

const COR_SHIKAKU = '#0EA5E9';
const COR_RETANGULO_VALIDO = '#7FBFA0';
const COR_RETANGULO_INVALIDO = '#D98E8E';
const COR_NUMERO_SOBRE_RETANGULO = '#1A2233';
const MAX_DICAS = 3;
const CELULA_MAX = 68;

export function TelaShikaku({ route, navigation }: Props) {
  const puzzle = useMemo(
    () => buscarPuzzle(route.params.puzzleId),
    [route.params.puzzleId],
  );

  if (!puzzle) {
    return (
      <SafeAreaView style={estilos.safe} edges={['top', 'bottom']}>
        <View style={estilos.vazio}>
          <Text style={estilos.vazioTexto}>Puzzle não encontrado.</Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={estilos.vazioVoltar}>voltar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return <JogoShikaku puzzle={puzzle} navigation={navigation} />;
}

// ─── Jogo (puzzle garantidamente válido) ──────────────────────────────────────

interface JogoProps {
  puzzle: NonNullable<ReturnType<typeof buscarPuzzle>>;
  navigation: Props['navigation'];
}

function JogoShikaku({ puzzle, navigation }: JogoProps) {
  const [estado, setEstado] = useState<EstadoShikaku>(() =>
    criarEstadoInicial(puzzle),
  );
  const [preview, setPreview] = useState<RetanguloShikaku | null>(null);
  const [larguraBoard, setLarguraBoard] = useState(0);
  const [segundos, setSegundos] = useState(0);
  const [dicasUsadas, setDicasUsadas] = useState(0);

  const pistas = useMemo(() => pistasDoPuzzle(puzzle), [puzzle]);

  const celula =
    larguraBoard > 0
      ? Math.min(Math.floor(larguraBoard / puzzle.colunas), CELULA_MAX)
      : 0;
  const tamanhoBoard = celula * puzzle.colunas;
  const gap = Math.max(3, Math.round(celula * 0.12));

  // Refs para o PanResponder (evita closures obsoletas).
  const celulaRef = useRef(celula);
  const estadoRef = useRef(estado);
  const dragInicioRef = useRef<{ linha: number; coluna: number } | null>(null);
  useEffect(() => {
    celulaRef.current = celula;
  }, [celula]);
  useEffect(() => {
    estadoRef.current = estado;
  }, [estado]);

  // Timer — para ao concluir.
  useEffect(() => {
    if (estado.concluido) return;
    const id = setInterval(() => setSegundos((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [estado.concluido]);

  // Vitória: haptic + persistência do progresso.
  useEffect(() => {
    if (!estado.concluido) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const estrelas = calcularEstrelas(
      puzzle.dificuldade,
      segundos,
      dicasUsadas,
    );
    void registrarConclusao(puzzle.id, segundos, estrelas);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estado.concluido]);

  // Próximo puzzle da mesma dificuldade (se houver).
  const proximoId = useMemo(() => {
    const lista = puzzlesPorDificuldade(puzzle.dificuldade);
    const idx = lista.findIndex((p) => p.id === puzzle.id);
    return idx >= 0 && idx < lista.length - 1 ? lista[idx + 1].id : null;
  }, [puzzle]);

  function celulaDoToque(
    x: number,
    y: number,
  ): { linha: number; coluna: number } {
    const c = celulaRef.current || 1;
    const coluna = Math.max(0, Math.min(puzzle.colunas - 1, Math.floor(x / c)));
    const linha = Math.max(0, Math.min(puzzle.linhas - 1, Math.floor(y / c)));
    return { linha, coluna };
  }

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !estadoRef.current.concluido,
      onMoveShouldSetPanResponder: () => !estadoRef.current.concluido,
      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        const cel = celulaDoToque(locationX, locationY);
        dragInicioRef.current = cel;
        setPreview(
          normalizarRetangulo(cel.linha, cel.coluna, cel.linha, cel.coluna),
        );
      },
      onPanResponderMove: (evt) => {
        const inicio = dragInicioRef.current;
        if (!inicio) return;
        const { locationX, locationY } = evt.nativeEvent;
        const cel = celulaDoToque(locationX, locationY);
        setPreview(
          normalizarRetangulo(
            inicio.linha,
            inicio.coluna,
            cel.linha,
            cel.coluna,
          ),
        );
      },
      onPanResponderRelease: (evt) => {
        const inicio = dragInicioRef.current;
        dragInicioRef.current = null;
        setPreview(null);
        if (!inicio) return;
        const { locationX, locationY } = evt.nativeEvent;
        const fim = celulaDoToque(locationX, locationY);
        const ehToque =
          inicio.linha === fim.linha && inicio.coluna === fim.coluna;
        const atual = estadoRef.current;

        if (ehToque) {
          const cobre = atual.retangulos.some((r) =>
            contemCelula(r, inicio.linha, inicio.coluna),
          );
          if (cobre) {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setEstado(removerRetanguloEm(atual, inicio.linha, inicio.coluna));
            return;
          }
        }

        const rect = normalizarRetangulo(
          inicio.linha,
          inicio.coluna,
          fim.linha,
          fim.coluna,
        );
        const novo = adicionarRetangulo(atual, rect);
        if (novo.concluido) {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } else {
          void Haptics.selectionAsync();
        }
        setEstado(novo);
      },
      onPanResponderTerminate: () => {
        dragInicioRef.current = null;
        setPreview(null);
      },
    }),
  ).current;

  function aoUsarDica() {
    if (dicasUsadas >= MAX_DICAS) return;
    if (!obterDica(estado)) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setDicasUsadas((n) => n + 1);
    setEstado(aplicarDica(estado));
  }

  function aoReiniciar() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEstado(reiniciarEstado(estado));
  }

  const { validos, total } = progresso(estado);
  const dicasRestantes = MAX_DICAS - dicasUsadas;
  const estrelas = estado.concluido
    ? calcularEstrelas(puzzle.dificuldade, segundos, dicasUsadas)
    : 0;

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
          <Text style={estilos.cabecalhoTitulo}>Shikaku</Text>
          <Text style={estilos.cabecalhoSub}>
            {LABEL_DIFICULDADE[puzzle.dificuldade]} · {validos}/{total}
          </Text>
        </View>
        <View style={estilos.timerChip}>
          <Text style={estilos.timerTexto}>{formatarTempo(segundos)}</Text>
        </View>
      </View>

      {/* Board */}
      <View style={estilos.boardArea}>
        <View
          style={estilos.boardWrapper}
          onLayout={(e) => setLarguraBoard(e.nativeEvent.layout.width)}
        >
          {celula > 0 && (
            <View
              style={[
                estilos.board,
                { width: tamanhoBoard, height: tamanhoBoard },
              ]}
              {...panResponder.panHandlers}
            >
              {/* Camada: tiles da grade */}
              <View style={estilos.camada} pointerEvents="none">
                {Array.from({ length: puzzle.linhas }).map((_, l) =>
                  Array.from({ length: puzzle.colunas }).map((__, c) => (
                    <View
                      key={`${l}-${c}`}
                      style={[
                        estilos.tile,
                        {
                          left: c * celula + gap / 2,
                          top: l * celula + gap / 2,
                          width: celula - gap,
                          height: celula - gap,
                          borderRadius: raioTile(celula),
                        },
                      ]}
                    />
                  )),
                )}
              </View>

              {/* Camada: retângulos confirmados */}
              <View style={estilos.camada} pointerEvents="none">
                {estado.retangulos.map((r, i) => (
                  <RetanguloView
                    key={i}
                    r={r}
                    celula={celula}
                    gap={gap}
                    valido={retanguloValido(puzzle, r)}
                  />
                ))}
              </View>

              {/* Camada: preview do arraste */}
              {preview && (
                <View style={estilos.camada} pointerEvents="none">
                  <View
                    style={[
                      estilos.preview,
                      retanguloEstilo(preview, celula, gap),
                    ]}
                  />
                </View>
              )}

              {/* Camada: números (sempre no topo) */}
              <View style={estilos.camada} pointerEvents="none">
                {pistas.map((p, i) => {
                  const coberta = estado.retangulos.some((r) =>
                    contemCelula(r, p.linha, p.coluna),
                  );
                  return (
                    <View
                      key={i}
                      style={[
                        estilos.numeroSlot,
                        {
                          left: p.coluna * celula,
                          top: p.linha * celula,
                          width: celula,
                          height: celula,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          estilos.numero,
                          {
                            fontSize: celula * 0.42,
                            color: coberta
                              ? COR_NUMERO_SOBRE_RETANGULO
                              : cores.texto,
                          },
                        ]}
                      >
                        {p.valor}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}
        </View>
      </View>

      {/* Rodapé com ações */}
      <View style={estilos.rodape}>
        <TouchableOpacity
          style={estilos.botaoAcao}
          onPress={aoReiniciar}
          activeOpacity={0.8}
        >
          <Text style={estilos.botaoAcaoTexto}>reiniciar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            estilos.botaoAcao,
            dicasRestantes === 0 && estilos.botaoAcaoDesabilitado,
          ]}
          onPress={aoUsarDica}
          disabled={dicasRestantes === 0}
          activeOpacity={0.8}
        >
          <Text
            style={[
              estilos.botaoAcaoTexto,
              dicasRestantes === 0 && estilos.botaoAcaoTextoDesabilitado,
            ]}
          >
            dica ({dicasRestantes})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Overlay de vitória */}
      {estado.concluido && (
        <TelaVitoria
          segundos={segundos}
          dicasUsadas={dicasUsadas}
          estrelas={estrelas}
          temProximo={proximoId !== null}
          onProximo={() => {
            if (proximoId) {
              navigation.replace('Shikaku', { puzzleId: proximoId });
            }
          }}
          onVoltar={() => navigation.goBack()}
          onDeNovo={() => {
            setSegundos(0);
            setDicasUsadas(0);
            setEstado(reiniciarEstado(estado));
          }}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Retângulo confirmado ─────────────────────────────────────────────────────

function RetanguloView({
  r,
  celula,
  gap,
  valido,
}: {
  r: RetanguloShikaku;
  celula: number;
  gap: number;
  valido: boolean;
}) {
  return (
    <View
      style={[
        estilos.retangulo,
        retanguloEstilo(r, celula, gap),
        valido ? estilos.retanguloValido : estilos.retanguloInvalido,
      ]}
    />
  );
}

/** Raio de canto de um tile/retângulo, proporcional ao tamanho da célula. */
function raioTile(celula: number): number {
  return Math.max(6, Math.round(celula * 0.18));
}

function retanguloEstilo(r: RetanguloShikaku, celula: number, gap: number) {
  return {
    left: r.colunaInicio * celula + gap / 2,
    top: r.linhaInicio * celula + gap / 2,
    width: (r.colunaFim - r.colunaInicio + 1) * celula - gap,
    height: (r.linhaFim - r.linhaInicio + 1) * celula - gap,
    borderRadius: raioTile(celula),
  };
}

// ─── Overlay de vitória ───────────────────────────────────────────────────────

function TelaVitoria({
  segundos,
  dicasUsadas,
  estrelas,
  temProximo,
  onProximo,
  onVoltar,
  onDeNovo,
}: {
  segundos: number;
  dicasUsadas: number;
  estrelas: number;
  temProximo: boolean;
  onProximo: () => void;
  onVoltar: () => void;
  onDeNovo: () => void;
}) {
  return (
    <View style={estilos.vitoriaOverlay}>
      <View style={estilos.vitoriaCard}>
        <Text style={estilos.vitoriaTitulo}>resolvido!</Text>

        {/* Estrelas */}
        <View style={estilos.estrelasLinha}>
          {[1, 2, 3].map((n) => (
            <Text
              key={n}
              style={[
                estilos.estrela,
                n <= estrelas ? estilos.estrelaCheia : estilos.estrelaVazia,
              ]}
            >
              ★
            </Text>
          ))}
        </View>

        <View style={estilos.vitoriaStats}>
          <View style={estilos.vitoriaStat}>
            <Text style={estilos.vitoriaStatValor}>
              {formatarTempo(segundos)}
            </Text>
            <Text style={estilos.vitoriaStatLabel}>tempo</Text>
          </View>
          <View style={estilos.vitoriaStat}>
            <Text style={estilos.vitoriaStatValor}>{dicasUsadas}</Text>
            <Text style={estilos.vitoriaStatLabel}>dicas</Text>
          </View>
        </View>

        {temProximo ? (
          <>
            <TouchableOpacity
              style={estilos.vitoriaBotaoPrincipal}
              onPress={onProximo}
              activeOpacity={0.85}
            >
              <Text style={estilos.vitoriaBotaoPrincipalTexto}>
                próximo puzzle
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onVoltar} activeOpacity={0.7}>
              <Text style={estilos.vitoriaBotaoSecundario}>
                voltar aos níveis
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity
              style={estilos.vitoriaBotaoPrincipal}
              onPress={onVoltar}
              activeOpacity={0.85}
            >
              <Text style={estilos.vitoriaBotaoPrincipalTexto}>
                voltar aos níveis
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onDeNovo} activeOpacity={0.7}>
              <Text style={estilos.vitoriaBotaoSecundario}>jogar de novo</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatarTempo(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const estilos = StyleSheet.create({
  board: {
    position: 'relative',
  },
  boardArea: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  boardWrapper: {
    alignItems: 'center',
    paddingHorizontal: espacamento.md,
    width: '100%',
  },
  botaoAcao: {
    alignItems: 'center',
    backgroundColor: cores.fundoSecundario,
    borderColor: cores.borda,
    borderRadius: raio.md,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 14,
  },
  botaoAcaoDesabilitado: {
    opacity: 0.45,
  },
  botaoAcaoTexto: {
    color: cores.texto,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpo,
    fontWeight: '700',
  },
  botaoAcaoTextoDesabilitado: {
    color: cores.textoMudo,
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
  camada: {
    ...StyleSheet.absoluteFillObject,
  },
  estrela: {
    fontSize: 36,
  },
  estrelaCheia: {
    color: '#FBBF24',
  },
  estrelaVazia: {
    color: cores.borda,
  },
  estrelasLinha: {
    flexDirection: 'row',
    gap: espacamento.xs,
    marginTop: espacamento.xs,
  },
  numero: {
    color: cores.texto,
    fontFamily: familias.sans,
    fontWeight: '800',
  },
  numeroSlot: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
  },
  preview: {
    backgroundColor: COR_SHIKAKU + '24',
    borderColor: COR_SHIKAKU,
    borderStyle: 'dashed',
    borderWidth: 2,
    position: 'absolute',
  },
  retangulo: {
    position: 'absolute',
  },
  retanguloInvalido: {
    backgroundColor: COR_RETANGULO_INVALIDO,
  },
  retanguloValido: {
    backgroundColor: COR_RETANGULO_VALIDO,
  },
  tile: {
    backgroundColor: cores.fundoSecundario,
    borderColor: cores.borda,
    borderWidth: 1,
    position: 'absolute',
  },
  rodape: {
    flexDirection: 'row',
    gap: espacamento.sm,
    paddingBottom: espacamento.sm,
    paddingHorizontal: espacamento.md,
    paddingTop: espacamento.sm,
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
  timerChip: {
    backgroundColor: cores.fundoSecundario,
    borderColor: cores.borda,
    borderRadius: raio.sm,
    borderWidth: 1,
    paddingHorizontal: espacamento.sm,
    paddingVertical: 4,
  },
  timerTexto: {
    color: cores.texto,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpoMenor,
    fontWeight: '700',
  },
  vazio: {
    alignItems: 'center',
    flex: 1,
    gap: espacamento.md,
    justifyContent: 'center',
  },
  vazioTexto: {
    color: cores.texto,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpo,
  },
  vazioVoltar: {
    color: cores.primaria,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpo,
    fontWeight: '700',
  },
  vitoriaBotaoPrincipal: {
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: COR_SHIKAKU,
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
  vitoriaCard: {
    alignItems: 'center',
    backgroundColor: cores.fundoSecundario,
    borderRadius: raio.xl,
    gap: espacamento.xs,
    padding: espacamento.xl,
    width: '82%',
  },
  vitoriaOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    backgroundColor: 'rgba(22,22,22,0.55)',
    justifyContent: 'center',
  },
  vitoriaStat: {
    alignItems: 'center',
  },
  vitoriaStatLabel: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    marginTop: 2,
  },
  vitoriaStatValor: {
    color: cores.texto,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoTitulo,
    fontWeight: '800',
  },
  vitoriaStats: {
    flexDirection: 'row',
    gap: espacamento.xl,
    marginVertical: espacamento.md,
  },
  vitoriaTitulo: {
    color: cores.texto,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoTituloGrande,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
});
