import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  BotaoEncerrarJogo,
  BotaoPrimario,
  CombinadoDeConforto,
  FeedbackSessao,
} from '@/components';
import {
  calcularResultado,
  getCategoria,
  selecionarCartaQNS,
  type CartaQNS,
  type CategoriaQNSId,
  type IntensidadeQNS,
  type JogadorQNS,
  type ResultadoRodada,
  type VotosRodada,
} from '@/games/quem-na-sala';
import type { RootStackParamList } from '@/navigation/types';
import {
  processarResultadoQuemNaSala,
  processarRodadaQuemNaSala,
} from '@/session/quemNaSalaLocalAdapter';
import { cores, espacamento, familias, raio, tipografia } from '@/theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'JogoLocalQuemNaSala'>;

// ─── Identidade visual ────────────────────────────────────────────────────────
const COR_QNS = '#F59E0B';
const COR_QNS_FUNDO = 'rgba(245, 158, 11, 0.10)';
const COR_QNS_BORDA = 'rgba(245, 158, 11, 0.35)';

type SubFase = 'pergunta' | 'passando_para' | 'votando' | 'revelacao';

// ─── Sub-tela: Pergunta ───────────────────────────────────────────────────────
function TelaPergunta({
  carta,
  totalRodadas,
  onIniciarVotacao,
  onPular,
}: {
  carta: CartaQNS;
  totalRodadas: number;
  onIniciarVotacao: () => void;
  onPular: () => void;
}) {
  const categoria = getCategoria(carta.categoria);

  return (
    <View style={estilos.subTela}>
      {/* Header */}
      <View style={estilos.header}>
        <View style={estilos.headerEspaco} />
        <Text style={estilos.headerTexto}>
          {totalRodadas > 0 ? `rodada ${totalRodadas + 1}` : 'prontos?'}
        </Text>
        <View style={estilos.headerEspaco} />
      </View>

      {/* Corpo */}
      <View style={estilos.corpoPergunta}>
        {/* Label fixo */}
        <View style={estilos.labelContainer}>
          <Text style={estilos.labelFixo}>QUEM NA SALA</Text>
          <View style={[estilos.labelLinha, { backgroundColor: COR_QNS + '30' }]} />
        </View>

        {/* Complemento */}
        <View style={estilos.cardPergunta}>
          <Text
            style={estilos.complemento}
            adjustsFontSizeToFit
            minimumFontScale={0.55}
          >
            {carta.complemento}
          </Text>

          <View style={estilos.metadados}>
            <View style={estilos.chipCategoria}>
              <Text style={estilos.chipEmoji}>{categoria.emoji}</Text>
              <Text style={estilos.chipNome}>{categoria.nome}</Text>
            </View>
            {carta.mais18 && (
              <View style={estilos.chip18}>
                <Text style={estilos.chip18Texto}>+18</Text>
              </View>
            )}
          </View>
        </View>

        {/* Instrução */}
        <Text style={estilos.instrucaoPergunta}>
          cada um vota em segredo — ninguém sabe quem escolheu quem
        </Text>
        <CombinadoDeConforto
          compacto
          texto="se pesar para o grupo, pule antes da votação."
        />
      </View>

      {/* CTA */}
      <View style={estilos.rodape}>
        <Pressable
          onPress={onPular}
          style={({ pressed }) => [
            estilos.botaoPular,
            pressed && estilos.pressionado,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Pular pergunta"
        >
          <Text style={estilos.botaoPularTexto}>pular pergunta</Text>
        </Pressable>
        <Pressable
          onPress={onIniciarVotacao}
          style={({ pressed }) => [
            estilos.botaoPrimario,
            pressed && estilos.botaoPrimarioPressionado,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Iniciar votação"
        >
          <Text style={estilos.botaoPrimarioTexto}>iniciar votação →</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ─── Sub-tela: Passando para ──────────────────────────────────────────────────
function TelaPassandoPara({
  jogador,
  indice,
  total,
  onPronto,
}: {
  jogador: JogadorQNS;
  indice: number;
  total: number;
  onPronto: () => void;
}) {
  return (
    <View style={estilos.subTela}>
      <View style={estilos.corpoPassando}>
        <Text style={estilos.passandoLabel}>passe o celular para</Text>
        <Text style={estilos.passandoNome} numberOfLines={2} adjustsFontSizeToFit>
          {jogador.nome}
        </Text>
        <Text style={estilos.passandoContador}>
          {indice + 1} de {total}
        </Text>

        <View style={estilos.passandoDivider} />

        <Text style={estilos.passandoInstrucao}>
          {jogador.nome}, quando o celular estiver com você,{'\n'}
          toque em "estou pronto" para votar.
        </Text>
      </View>

      <View style={estilos.rodape}>
        <Pressable
          onPress={onPronto}
          style={({ pressed }) => [
            estilos.botaoPrimario,
            pressed && estilos.botaoPrimarioPressionado,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Estou pronto para votar"
        >
          <Text style={estilos.botaoPrimarioTexto}>estou pronto →</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ─── Sub-tela: Votando ────────────────────────────────────────────────────────
function TelaVotando({
  votante,
  candidatos,
  onVotar,
}: {
  votante: JogadorQNS;
  candidatos: JogadorQNS[];
  onVotar: (votadoId: string) => void;
}) {
  return (
    <View style={[estilos.subTela, { backgroundColor: '#161616' }]}>
      <View style={estilos.headerVotando}>
        <Text style={estilos.votandoLabel}>seu voto, {votante.nome}</Text>
        <Text style={estilos.votandoSubtitulo}>toque em um nome para confirmar · seu voto é secreto</Text>
      </View>

      <ScrollView
        style={estilos.listaVotos}
        contentContainerStyle={estilos.listaVotosConteudo}
        showsVerticalScrollIndicator={false}
      >
        {candidatos.map((candidato) => {
          return (
            <Pressable
              key={candidato.id}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onVotar(candidato.id);
              }}
              style={({ pressed }) => [
                estilos.itemVoto,
                pressed && estilos.pressionado,
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Votar em ${candidato.nome}`}
            >
              <Text style={estilos.itemVotoNome}>
                {candidato.nome}
              </Text>
              <Text style={estilos.itemVotoSeta}>→</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

// ─── Sub-tela: Revelação ──────────────────────────────────────────────────────
function TelaRevelacao({
  resultado,
  jogadores,
  onProxima,
  ultimaPergunta,
}: {
  resultado: ResultadoRodada;
  jogadores: JogadorQNS[];
  onProxima: () => void;
  ultimaPergunta: boolean;
}) {
  const vencedor = jogadores.find((j) => j.id === resultado.vencedorId);

  return (
    <View style={estilos.subTela}>
      <View style={estilos.header}>
        <View style={{ width: 36 }} />
        <Text style={estilos.headerTexto}>resultado</Text>
        <View style={estilos.headerEspaco} />
      </View>

      <View style={estilos.corpoRevelacao}>
        {/* Pergunta resumida */}
        <View style={estilos.perguntaResumo}>
          <Text style={estilos.perguntaResumoLabel}>quem na sala</Text>
          <Text style={estilos.perguntaResumoTexto} numberOfLines={3}>
            {resultado.complemento}
          </Text>
        </View>

        {/* Vencedor / Empate */}
        {resultado.empate ? (
          <View style={estilos.empateContainer}>
            <Text style={estilos.empateEmoji}>🤝</Text>
            <Text style={estilos.empateTexto}>empate!</Text>
            <Text style={estilos.empateSubtexto}>
              {resultado.votosContagem
                .filter((v) => v.votos === resultado.votosContagem[0]?.votos)
                .map((v) => v.nome)
                .join(' e ')}
            </Text>
          </View>
        ) : (
          <View style={estilos.vencedorContainer}>
            <Text style={estilos.vencedorCoroa}>🏆</Text>
            <Text style={estilos.vencedorNome}>{vencedor?.nome ?? ''}</Text>
            <Text style={estilos.vencedorVotos}>
              {resultado.votosContagem.find((v) => v.jogadorId === resultado.vencedorId)
                ?.votos ?? 0}{' '}
              {resultado.votosContagem.find((v) => v.jogadorId === resultado.vencedorId)
                ?.votos === 1
                ? 'voto'
                : 'votos'}
            </Text>
          </View>
        )}

        {/* Ranking completo */}
        <View style={estilos.rankingContainer}>
          {resultado.votosContagem
            .filter((v) => v.votos > 0)
            .map((v, idx) => (
              <View key={v.jogadorId} style={estilos.rankingItem}>
                <Text style={estilos.rankingPos}>{idx + 1}º</Text>
                <Text style={estilos.rankingNome} numberOfLines={1}>
                  {v.nome}
                </Text>
                <View style={estilos.rankingBarraContainer}>
                  <View
                    style={[
                      estilos.rankingBarra,
                      {
                        width: `${(v.votos / (resultado.votosContagem[0]?.votos || 1)) * 100}%`,
                        backgroundColor:
                          idx === 0 && !resultado.empate ? COR_QNS : cores.borda,
                      },
                    ]}
                  />
                </View>
                <Text style={estilos.rankingVotos}>{v.votos}</Text>
              </View>
            ))}
          {resultado.votosContagem.filter((v) => v.votos === 0).length > 0 && (
            <Text style={estilos.rankingNenhumVoto}>
              {resultado.votosContagem
                .filter((v) => v.votos === 0)
                .map((v) => v.nome)
                .join(', ')}{' '}
              — nenhum voto
            </Text>
          )}
        </View>
      </View>

      <View style={estilos.rodape}>
        <Pressable
          onPress={onProxima}
          style={({ pressed }) => [
            estilos.botaoPrimario,
            pressed && estilos.botaoPrimarioPressionado,
          ]}
          accessibilityRole="button"
          accessibilityLabel={ultimaPergunta ? 'Encerrar votação' : 'Próxima pergunta'}
        >
          <Text style={estilos.botaoPrimarioTexto}>
            {ultimaPergunta ? 'encerrar votação' : 'próxima pergunta →'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export function TelaJogoLocalQuemNaSala({ navigation, route }: Props) {
  const {
    jogadores,
    intensidade,
    categorias,
    incluirMais18,
    totalPerguntas,
  } = route.params;

  const [subFase, setSubFase] = useState<SubFase>('pergunta');
  const [cartaAtual, setCartaAtual] = useState<CartaQNS | null>(() =>
    selecionarCartaQNS(
      [],
      categorias as CategoriaQNSId[] | 'todas',
      intensidade as IntensidadeQNS | 'todas',
      incluirMais18,
      0,
    ),
  );
  const [cartasUsadas, setCartasUsadas] = useState<string[]>(
    cartaAtual ? [cartaAtual.id] : [],
  );
  const [totalRodadas, setTotalRodadas] = useState(0);
  const [resultados, setResultados] = useState<ResultadoRodada[]>([]);
  const [perguntasPuladas, setPerguntasPuladas] = useState(0);
  const [finalizado, setFinalizado] = useState(false);
  const resultadoProcessado = useRef(false);
  const iniciouEm = useRef(Date.now());
  const votoEmTransicao = useRef(false);
  const [indiceVotante, setIndiceVotante] = useState(0);
  const [votosRodada, setVotosRodada] = useState<VotosRodada>({});
  const [resultado, setResultado] = useState<ResultadoRodada | null>(null);

  const votanteAtual = jogadores[indiceVotante];

  // Candidatos = todos exceto o próprio votante
  const candidatos = jogadores.filter((j) => j.id !== votanteAtual?.id);

  function finalizarPartida() {
    if (resultadoProcessado.current) {
      setFinalizado(true);
      return;
    }
    resultadoProcessado.current = true;
    const contagem = new Map<string, number>();
    for (const rodada of resultados) {
      for (const item of rodada.votosContagem) {
        contagem.set(item.jogadorId, (contagem.get(item.jogadorId) ?? 0) + item.votos);
      }
    }
    const ranking = [...contagem.entries()].sort((a, b) => b[1] - a[1]);
    const maisVotado =
      ranking.length > 0 && ranking[0]![1] > (ranking[1]?.[1] ?? -1)
        ? ranking[0]![0]
        : null;
    processarResultadoQuemNaSala({
      totalRodadas: resultados.length,
      jogadorMaisVotadoId: maisVotado,
      totalEmpates: resultados.filter((rodada) => rodada.empate).length,
      perguntasPuladas,
      categorias: categorias === 'todas' ? ['todas'] : categorias,
      duracaoMs: Date.now() - iniciouEm.current,
      duracaoMediaRodadaMs:
        resultados.length > 0
          ? Math.round((Date.now() - iniciouEm.current) / resultados.length)
          : 0,
    });
    setFinalizado(true);
  }

  function iniciarVotacao() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIndiceVotante(totalRodadas % jogadores.length);
    setVotosRodada({});
    setSubFase('passando_para');
  }

  function pularPergunta() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const novaCarta = selecionarCartaQNS(
      cartasUsadas,
      categorias as CategoriaQNSId[] | 'todas',
      intensidade as IntensidadeQNS | 'todas',
      incluirMais18,
      totalRodadas,
    );
    setPerguntasPuladas((quantidade) => quantidade + 1);
    setCartaAtual(novaCarta);
    if (novaCarta) setCartasUsadas((u) => [...u, novaCarta.id]);
  }

  function prontoParaVotar() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    votoEmTransicao.current = false;
    setSubFase('votando');
  }

  function registrarVoto(votadoId: string) {
    if (votoEmTransicao.current) return;
    const votante = votanteAtual;
    if (!votante) return;
    votoEmTransicao.current = true;

    const novosVotos = { ...votosRodada, [votante.id]: votadoId };
    const votosRecebidos = Object.keys(novosVotos).length;
    const proximoIndice = (indiceVotante + 1) % jogadores.length;

    if (votosRecebidos >= jogadores.length) {
      // Todos votaram — calcular resultado
      if (!cartaAtual) return;
      const res = calcularResultado(cartaAtual, novosVotos, jogadores);
      setVotosRodada(novosVotos);
      setResultado(res);
      setResultados((atuais) => [...atuais, res]);
      processarRodadaQuemNaSala({
        numero: resultados.length + 1,
        vencedorId: res.vencedorId,
        empate: res.empate,
        totalVotos: votosRecebidos,
        maiorQuantidadeVotos: res.votosContagem[0]?.votos ?? 0,
      });
      setSubFase('revelacao');
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      setVotosRodada(novosVotos);
      setIndiceVotante(proximoIndice);
      setSubFase('passando_para');
    }
  }

  function proximaPergunta() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const novoTotal = totalRodadas + 1;
    const novaCarta = selecionarCartaQNS(
      cartasUsadas,
      categorias as CategoriaQNSId[] | 'todas',
      intensidade as IntensidadeQNS | 'todas',
      incluirMais18,
      novoTotal,
    );

    setTotalRodadas(novoTotal);
    setCartaAtual(novaCarta);
    if (novaCarta) setCartasUsadas((u) => [...u, novaCarta.id]);
    setResultado(null);
    setSubFase('pergunta');
  }

  if (!cartaAtual && !finalizado) {
    return (
      <SafeAreaView style={estilos.tela} edges={['top', 'bottom']}>
        <View style={[estilos.subTela, { justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={estilos.semCartasTexto}>perguntas esgotadas 🎉</Text>
          <Text style={estilos.semCartasSubtexto}>
            vocês viram tudo que tinha pra essa configuração.
          </Text>
          <Pressable
            onPress={finalizarPartida}
            style={estilos.botaoPrimario}
            accessibilityRole="button"
            accessibilityLabel="Ver encerramento"
          >
            <Text style={estilos.botaoPrimarioTexto}>ver encerramento</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (finalizado) {
    const ultimo = resultados.at(-1);
    const destaque = ultimo?.vencedorId
      ? jogadores.find((jogador) => jogador.id === ultimo.vencedorId)?.nome
      : null;
    return (
      <SafeAreaView style={estilos.tela} edges={['top', 'bottom']}>
        <View style={estilos.final}>
          <Text style={estilos.finalLabel}>fim de votação</Text>
          <Text style={estilos.finalTitulo}>ninguém entrega o voto.</Text>
          <Text style={estilos.finalResumo}>
            {resultados.length} {resultados.length === 1 ? 'pergunta jogada' : 'perguntas jogadas'}
            {destaque ? ` · último destaque: ${destaque}` : ''}
          </Text>
          <FeedbackSessao jogoId="quem-na-sala" />
          <BotaoPrimario titulo="escolher outro jogo" onPress={() => navigation.navigate('Inicio')} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={estilos.tela} edges={['top', 'bottom']}>
      <BotaoEncerrarJogo onConfirmar={finalizarPartida} />
      {subFase === 'pergunta' && cartaAtual && (
        <TelaPergunta
          carta={cartaAtual}
          totalRodadas={totalRodadas}
          onIniciarVotacao={iniciarVotacao}
          onPular={pularPergunta}
        />
      )}

      {subFase === 'passando_para' && votanteAtual && (
        <TelaPassandoPara
          jogador={votanteAtual}
          indice={Object.keys(votosRodada).length}
          total={jogadores.length}
          onPronto={prontoParaVotar}
        />
      )}

      {subFase === 'votando' && votanteAtual && (
        <TelaVotando
          votante={votanteAtual}
          candidatos={candidatos}
          onVotar={registrarVoto}
        />
      )}

      {subFase === 'revelacao' && resultado && (
        <TelaRevelacao
          resultado={resultado}
          jogadores={jogadores}
          onProxima={resultados.length >= totalPerguntas ? finalizarPartida : proximaPergunta}
          ultimaPergunta={resultados.length >= totalPerguntas}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const estilos = StyleSheet.create({
  botaoEncerrar: {
    alignItems: 'center',
    borderColor: cores.borda,
    borderRadius: raio.pill,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  botaoEncerrarTexto: {
    color: cores.textoSecundario,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    fontWeight: tipografia.pesoBold,
  },
  botaoPrimario: {
    alignItems: 'center',
    backgroundColor: COR_QNS,
    borderRadius: raio.lg,
    height: 56,
    justifyContent: 'center',
    shadowColor: COR_QNS,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30,
    shadowRadius: 12,
    elevation: 5,
  },
  botaoPrimarioDesabilitado: {
    backgroundColor: cores.borda,
    elevation: 0,
    shadowOpacity: 0,
  },
  botaoPrimarioPressionado: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  botaoPrimarioTexto: {
    color: '#FFFFFF',
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpo,
    fontWeight: tipografia.pesoExtraBold,
    letterSpacing: 0.3,
  },
  botaoPular: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
  },
  botaoPularTexto: {
    color: cores.textoSecundario,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    fontWeight: tipografia.pesoBold,
  },
  cardPergunta: {
    backgroundColor: cores.superficie,
    borderColor: cores.borda,
    borderRadius: 22,
    borderWidth: 1,
    flex: 1,
    gap: espacamento.lg,
    justifyContent: 'space-between',
    padding: espacamento.xl,
    shadowColor: '#161616',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 2,
  },
  chip18: {
    alignItems: 'center',
    backgroundColor: COR_QNS_FUNDO,
    borderRadius: raio.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  chip18Texto: {
    color: COR_QNS,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoMicro,
    fontWeight: tipografia.pesoBold,
  },
  chipCategoria: {
    alignItems: 'center',
    backgroundColor: cores.superficieElevada,
    borderColor: cores.borda,
    borderRadius: raio.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  chipEmoji: { fontSize: 13 },
  chipNome: {
    color: cores.textoSecundario,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoMicro,
    fontWeight: tipografia.pesoBold,
  },
  complemento: {
    color: cores.texto,
    flex: 1,
    fontFamily: familias.sans,
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.5,
    lineHeight: 34,
  },
  corpoPassando: {
    alignItems: 'center',
    flex: 1,
    gap: espacamento.md,
    justifyContent: 'center',
    paddingHorizontal: espacamento.xl,
  },
  corpoPergunta: {
    flex: 1,
    gap: espacamento.md,
    paddingHorizontal: espacamento.lg,
    paddingVertical: espacamento.sm,
  },
  corpoRevelacao: {
    flex: 1,
    gap: espacamento.lg,
    paddingHorizontal: espacamento.lg,
  },
  final: {
    flex: 1,
    gap: espacamento.lg,
    justifyContent: 'center',
    padding: espacamento.xl,
  },
  finalLabel: {
    color: COR_QNS,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLabelSecao,
    fontWeight: tipografia.pesoExtraBold,
    textTransform: 'uppercase',
  },
  finalResumo: {
    color: cores.textoSecundario,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpo,
    lineHeight: 24,
  },
  finalTitulo: {
    color: cores.texto,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoTituloGrande,
    fontWeight: tipografia.pesoExtraBold,
  },
  empateContainer: {
    alignItems: 'center',
    backgroundColor: cores.superficie,
    borderColor: cores.borda,
    borderRadius: 20,
    borderWidth: 1,
    gap: 4,
    padding: espacamento.xl,
  },
  empateEmoji: { fontSize: 40 },
  empateSubtexto: {
    color: cores.textoSecundario,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpo,
    textAlign: 'center',
  },
  empateTexto: {
    color: cores.texto,
    fontFamily: familias.sans,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: espacamento.lg,
    paddingVertical: espacamento.md,
  },
  headerTexto: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    fontWeight: tipografia.pesoBold,
  },
  headerEspaco: {
    height: 36,
    width: 36,
  },
  headerVotando: {
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: espacamento.lg,
    paddingTop: espacamento.xl,
    paddingBottom: espacamento.md,
  },
  instrucaoPergunta: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    lineHeight: 20,
    textAlign: 'center',
  },
  itemVoto: {
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderColor: '#333333',
    borderRadius: raio.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: espacamento.md,
    minHeight: 60,
    paddingHorizontal: espacamento.lg,
    paddingVertical: espacamento.md,
  },
  itemVotoNome: {
    color: '#E0E0E0',
    flex: 1,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpo,
    fontWeight: tipografia.pesoBold,
  },
  itemVotoSeta: {
    color: COR_QNS,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpo,
    fontWeight: tipografia.pesoExtraBold,
  },
  itemVotoNomeSelecionado: {
    color: COR_QNS,
  },
  itemVotoSelecionado: {
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderColor: COR_QNS,
  },
  labelContainer: {
    alignItems: 'center',
    gap: 8,
  },
  labelFixo: {
    color: COR_QNS,
    fontFamily: familias.sans,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 4,
  },
  labelLinha: {
    borderRadius: 2,
    height: 2,
    width: '100%',
  },
  listaVotos: {
    flex: 1,
  },
  listaVotosConteudo: {
    gap: espacamento.sm,
    padding: espacamento.lg,
    paddingBottom: espacamento.xl,
  },
  metadados: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  passandoContador: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    marginTop: 4,
  },
  passandoDivider: {
    backgroundColor: cores.borda,
    height: 1,
    marginVertical: espacamento.md,
    width: '60%',
  },
  passandoInstrucao: {
    color: cores.textoSecundario,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpoMenor,
    lineHeight: 22,
    textAlign: 'center',
  },
  passandoLabel: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  passandoNome: {
    color: cores.texto,
    fontFamily: familias.sans,
    fontSize: 38,
    fontWeight: '800',
    letterSpacing: -1,
    textAlign: 'center',
  },
  perguntaResumo: {
    backgroundColor: cores.superficie,
    borderColor: cores.borda,
    borderRadius: raio.lg,
    borderWidth: 1,
    gap: 4,
    padding: espacamento.md,
  },
  perguntaResumoLabel: {
    color: COR_QNS,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoMicro,
    fontWeight: '900',
    letterSpacing: 2.5,
    textTransform: 'uppercase',
  },
  perguntaResumoTexto: {
    color: cores.texto,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpoMenor,
    fontWeight: tipografia.pesoBold,
    lineHeight: 21,
  },
  pressionado: {
    opacity: 0.72,
    transform: [{ scale: 0.98 }],
  },
  radioPonto: {
    backgroundColor: COR_QNS,
    borderRadius: 5,
    height: 10,
    width: 10,
  },
  radioCirculo: {
    alignItems: 'center',
    borderColor: '#444444',
    borderRadius: 12,
    borderWidth: 2,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  radioCirculoSelecionado: {
    borderColor: COR_QNS,
  },
  rankingBarra: {
    borderRadius: 3,
    flex: 1,
    height: 8,
  },
  rankingBarraContainer: {
    backgroundColor: cores.borda,
    borderRadius: 3,
    flex: 1,
    height: 8,
    overflow: 'hidden',
  },
  rankingContainer: {
    backgroundColor: cores.superficie,
    borderColor: cores.borda,
    borderRadius: raio.lg,
    borderWidth: 1,
    gap: espacamento.sm,
    padding: espacamento.md,
  },
  rankingItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: espacamento.sm,
  },
  rankingNome: {
    color: cores.texto,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    fontWeight: tipografia.pesoBold,
    width: 90,
  },
  rankingNenhumVoto: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoMicro,
    marginTop: 4,
  },
  rankingPos: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    width: 24,
  },
  rankingVotos: {
    color: cores.textoSecundario,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    fontWeight: tipografia.pesoBold,
    textAlign: 'right',
    width: 20,
  },
  rodape: {
    paddingBottom: espacamento.lg,
    paddingHorizontal: espacamento.lg,
    paddingTop: espacamento.sm,
  },
  rodapeEscuro: {
    backgroundColor: '#161616',
    paddingBottom: espacamento.lg,
    paddingHorizontal: espacamento.lg,
    paddingTop: espacamento.sm,
  },
  semCartasSubtexto: {
    color: cores.textoSecundario,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpoMenor,
    marginBottom: espacamento.xl,
    textAlign: 'center',
  },
  semCartasTexto: {
    color: cores.texto,
    fontFamily: familias.sans,
    fontSize: 24,
    fontWeight: '800',
    marginBottom: espacamento.sm,
    textAlign: 'center',
  },
  subTela: {
    backgroundColor: cores.fundo,
    flex: 1,
  },
  tela: {
    backgroundColor: cores.fundo,
    flex: 1,
  },
  vencedorContainer: {
    alignItems: 'center',
    backgroundColor: COR_QNS_FUNDO,
    borderColor: COR_QNS_BORDA,
    borderRadius: 20,
    borderWidth: 1,
    gap: 4,
    padding: espacamento.xl,
  },
  vencedorCoroa: { fontSize: 44 },
  vencedorNome: {
    color: cores.texto,
    fontFamily: familias.sans,
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.8,
    textAlign: 'center',
  },
  vencedorVotos: {
    color: COR_QNS,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpoMenor,
    fontWeight: tipografia.pesoBold,
    marginTop: 2,
  },
  votandoLabel: {
    color: '#FFFFFF',
    fontFamily: familias.sans,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  votandoSubtitulo: {
    color: '#888888',
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    textAlign: 'center',
  },
});
