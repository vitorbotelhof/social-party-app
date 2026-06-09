import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { EstadoOR, JogadorOR } from '@/games/operacao-resgate/types';
import {
  avancarDistribuicao,
  avancarParaDecisao,
  avancarRodada,
  confirmarEvento,
  criarEstadoInicial,
  encontrarPorId,
  encontrarPorPapel,
  iniciarPrimeiraRodada,
  jogadoresDaZona,
  liderDaZona,
  registrarDecisaoZonaA,
  registrarDecisaoZonaB,
} from '@/games/operacao-resgate/engine';
import {
  COR_ZONA,
  LABEL_PAPEL,
  LABEL_ZONA,
  gerarTextoCarta,
} from '@/games/operacao-resgate/papeis';
import type { RootStackParamList } from '@/navigation/types';
import { cores, espacamento, familias, raio, tipografia } from '@/theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'JogoLocalOperacaoResgate'>;

const COR_OR = '#F97316';
const FUNDO_CARTA = '#0F0F14';

// ─── Tela principal ───────────────────────────────────────────────────────────

export function TelaJogoLocalOperacaoResgate({ route, navigation }: Props) {
  const [estado, setEstado] = useState<EstadoOR>(() =>
    criarEstadoInicial(route.params),
  );

  function atualizar(novoEstado: EstadoOR) {
    setEstado(novoEstado);
  }

  // Roteamento de sub-telas
  switch (estado.fase) {
    case 'distribuindo':
      return (
        <SubTelaDistribuindo
          estado={estado}
          onAvancar={() => atualizar(avancarDistribuicao(estado))}
        />
      );

    case 'zonas_iniciais':
      return (
        <SubTelaZonasIniciais
          estado={estado}
          onComecar={() => atualizar(iniciarPrimeiraRodada(estado))}
        />
      );

    case 'discussao':
      return (
        <SubTelaDiscussao
          estado={estado}
          onEncerrar={() => atualizar(avancarParaDecisao(estado))}
        />
      );

    case 'evento':
      return (
        <SubTelaEvento
          estado={estado}
          onConfirmar={() => atualizar(confirmarEvento(estado))}
        />
      );

    case 'decisao_zona_a':
      return (
        <SubTelaDecisao
          estado={estado}
          zona="zona_a"
          onEscolher={(id) => atualizar(registrarDecisaoZonaA(estado, id))}
        />
      );

    case 'decisao_zona_b':
      return (
        <SubTelaDecisao
          estado={estado}
          zona="zona_b"
          onEscolher={(id) => atualizar(registrarDecisaoZonaB(estado, id))}
        />
      );

    case 'resultado_rodada':
      return (
        <SubTelaResultadoRodada
          estado={estado}
          onContinuar={() => atualizar(avancarRodada(estado))}
        />
      );

    case 'verificacao_final':
    case 'debrief':
      return (
        <SubTelaDebrief
          estado={estado}
          onReiniciar={() => navigation.replace('ConfiguracaoLocalOperacaoResgate')}
        />
      );

    default:
      return null;
  }
}

// ─── SubTela: Distribuindo cartas ─────────────────────────────────────────────

interface SubTelaDistribuindoProps {
  estado: EstadoOR;
  onAvancar: () => void;
}

function SubTelaDistribuindo({ estado, onAvancar }: SubTelaDistribuindoProps) {
  const [cartaVisivel, setCartaVisivel] = useState(false);
  const jogador = estado.jogadores[estado.distribuicaoIndex];

  if (!jogador) return null;

  const carta = gerarTextoCarta(jogador);
  const total = estado.jogadores.length;
  const atual = estado.distribuicaoIndex + 1;

  function aoVerCarta() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCartaVisivel(true);
  }

  function aoLiMinhaCarta() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCartaVisivel(false);
    onAvancar();
  }

  return (
    <SafeAreaView style={[estilos.safe, { backgroundColor: FUNDO_CARTA }]} edges={['top', 'bottom']}>
      {/* Indicador de progresso */}
      <View style={estilos.distribuicaoTopo}>
        <Text style={estilos.distribuicaoProgresso}>
          {atual} de {total}
        </Text>
        <View style={estilos.progressoBarraContainer}>
          {estado.jogadores.map((_, i) => (
            <View
              key={i}
              style={[
                estilos.progressoBarra,
                i < atual && { backgroundColor: COR_OR },
              ]}
            />
          ))}
        </View>
      </View>

      <View style={estilos.distribuicaoCentro}>
        {!cartaVisivel ? (
          /* Estado: aguardando o jogador certo pegar o celular */
          <View style={estilos.aguardandoContainer}>
            <Text style={estilos.aguardandoNome}>{jogador.nome}</Text>
            <Text style={estilos.aguardandoInstrucao}>
              pegue o celular e toque para ver sua carta
            </Text>
            <Text style={estilos.aguardandoAviso}>
              não mostre para ninguém
            </Text>
            <TouchableOpacity
              style={estilos.botaoVerCarta}
              onPress={aoVerCarta}
              activeOpacity={0.8}
            >
              <Text style={estilos.botaoVerCartaTexto}>ver minha carta</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* Estado: carta visível */
          <View style={estilos.cartaContainer}>
            <View style={estilos.cartaTituloBadge}>
              <Text style={estilos.cartaTitulo}>{carta.titulo}</Text>
            </View>

            <Text style={estilos.cartaCorpo}>{carta.corpo}</Text>

            <View style={estilos.cartaDivisor} />

            <View style={estilos.cartaObjetivoContainer}>
              <Text style={estilos.cartaObjetivoLabel}>seu objetivo</Text>
              <Text style={estilos.cartaObjetivo}>{carta.objetivo}</Text>
            </View>

            {carta.informacao && (
              <View style={estilos.cartaInfoContainer}>
                <Text style={estilos.cartaInfoLabel}>sua informação</Text>
                <Text style={estilos.cartaInfo}>"{carta.informacao}"</Text>
              </View>
            )}

            <TouchableOpacity
              style={estilos.botaoLiCarta}
              onPress={aoLiMinhaCarta}
              activeOpacity={0.85}
            >
              <Text style={estilos.botaoLiCartaTexto}>
                {atual < total ? 'li minha carta — próximo' : 'li minha carta — começar'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

// ─── SubTela: Zonas iniciais ──────────────────────────────────────────────────

interface SubTelaZonasIniciaisProps {
  estado: EstadoOR;
  onComecar: () => void;
}

function SubTelaZonasIniciais({ estado, onComecar }: SubTelaZonasIniciaisProps) {
  const zonaA = jogadoresDaZona(estado, 'zona_a');
  const zonaB = jogadoresDaZona(estado, 'zona_b');

  function aoComecar() {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onComecar();
  }

  return (
    <SafeAreaView style={estilos.safe} edges={['top', 'bottom']}>
      <View style={estilos.zonasHeader}>
        <Text style={estilos.zonasTitle}>divisão inicial</Text>
        <Text style={estilos.zonasSubtitle}>
          cada grupo começa em uma zona separada
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={estilos.zonasConteudo}
        showsVerticalScrollIndicator={false}
      >
        <ZonaCard zona="zona_a" jogadores={zonaA} />
        <ZonaCard zona="zona_b" jogadores={zonaB} />

        <View style={estilos.zonasRegras}>
          <Text style={estilos.zonasRegrasTexto}>
            a cada rodada, os líderes negociam e trocam 1 membro com a outra zona.
          </Text>
          <Text style={estilos.zonasRegrasTexto}>
            ao final, se o <Text style={{ color: COR_OR, fontWeight: '700' }}>Alvo</Text> e a <Text style={{ color: '#EF4444', fontWeight: '700' }}>Ameaça</Text> estiverem na mesma zona, a Sabotagem vence.
          </Text>
        </View>
      </ScrollView>

      <View style={estilos.rodape}>
        <TouchableOpacity
          style={[estilos.botaoComecar, { backgroundColor: COR_OR }]}
          onPress={aoComecar}
          activeOpacity={0.85}
        >
          <Text style={estilos.botaoComecarTexto}>iniciar rodada 1</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── SubTela: Discussão ───────────────────────────────────────────────────────

interface SubTelaDiscussaoProps {
  estado: EstadoOR;
  onEncerrar: () => void;
}

function SubTelaDiscussao({ estado, onEncerrar }: SubTelaDiscussaoProps) {
  const zonaA = jogadoresDaZona(estado, 'zona_a');
  const zonaB = jogadoresDaZona(estado, 'zona_b');
  const liderA = liderDaZona(estado, 'zona_a');
  const liderB = liderDaZona(estado, 'zona_b');

  const [segundosRestantes, setSegundosRestantes] = useState<number | null>(
    estado.config.timerDiscussao ? estado.config.duracaoDiscussaoSegundos : null,
  );
  const intervalo = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (segundosRestantes === null) return;
    if (segundosRestantes <= 0) return;

    intervalo.current = setInterval(() => {
      setSegundosRestantes((s) => {
        if (s === null) return null;
        if (s <= 1) {
          if (intervalo.current) clearInterval(intervalo.current);
          return 0;
        }
        return s - 1;
      });
    }, 1000);

    return () => {
      if (intervalo.current) clearInterval(intervalo.current);
    };
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  function formatarTempo(s: number): string {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  }

  function aoEncerrarDiscussao() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (intervalo.current) clearInterval(intervalo.current);
    onEncerrar();
  }

  const timerEsgotado = segundosRestantes !== null && segundosRestantes <= 0;

  return (
    <SafeAreaView style={estilos.safe} edges={['top', 'bottom']}>
      <View style={estilos.discussaoCabecalho}>
        <Text style={estilos.discussaoRodada}>
          rodada {estado.rodadaAtual} / {estado.totalRodadas}
        </Text>
        {segundosRestantes !== null && (
          <View
            style={[
              estilos.timerContainer,
              timerEsgotado && { backgroundColor: '#EF444422' },
            ]}
          >
            <Text
              style={[
                estilos.timerTexto,
                timerEsgotado && { color: '#EF4444' },
              ]}
            >
              {timerEsgotado ? 'tempo!' : formatarTempo(segundosRestantes)}
            </Text>
          </View>
        )}
      </View>

      <ScrollView
        contentContainerStyle={estilos.discussaoConteudo}
        showsVerticalScrollIndicator={false}
      >
        <Text style={estilos.discussaoInstrucao}>
          discutam livremente. cada zona decide quem enviar para a outra.
        </Text>

        <ZonaCard zona="zona_a" jogadores={zonaA} lider={liderA ?? undefined} />
        <ZonaCard zona="zona_b" jogadores={zonaB} lider={liderB ?? undefined} />
      </ScrollView>

      <View style={estilos.rodape}>
        <TouchableOpacity
          style={[
            estilos.botaoComecar,
            { backgroundColor: timerEsgotado ? '#EF4444' : COR_OR },
          ]}
          onPress={aoEncerrarDiscussao}
          activeOpacity={0.85}
        >
          <Text style={estilos.botaoComecarTexto}>encerrar discussão</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── SubTela: Evento especial ─────────────────────────────────────────────────

interface SubTelaEventoProps {
  estado: EstadoOR;
  onConfirmar: () => void;
}

function SubTelaEvento({ estado, onConfirmar }: SubTelaEventoProps) {
  const evento = estado.eventoAtual;

  function aoConfirmar() {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    onConfirmar();
  }

  if (!evento) return null;

  return (
    <SafeAreaView style={estilos.safe} edges={['top', 'bottom']}>
      <View style={estilos.eventoCentro}>
        <View style={estilos.eventoBadge}>
          <Text style={estilos.eventoBadgeTexto}>evento especial</Text>
        </View>
        <Text style={estilos.eventoTitulo}>{evento.titulo}</Text>
        <Text style={estilos.eventoDescricao}>{evento.descricao}</Text>

        {evento.trocasExtras > 0 && (
          <View style={estilos.eventoRegra}>
            <Text style={estilos.eventoRegraTexto}>
              cada zona envia {1 + evento.trocasExtras} operador{evento.trocasExtras > 1 ? 'es' : ''} nesta rodada
            </Text>
          </View>
        )}
      </View>

      <View style={estilos.rodape}>
        <TouchableOpacity
          style={[estilos.botaoComecar, { backgroundColor: '#8B5CF6' }]}
          onPress={aoConfirmar}
          activeOpacity={0.85}
        >
          <Text style={estilos.botaoComecarTexto}>entendido — continuar</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── SubTela: Decisão de zona ─────────────────────────────────────────────────

interface SubTelaDecisaoProps {
  estado: EstadoOR;
  zona: 'zona_a' | 'zona_b';
  onEscolher: (jogadorId: string) => void;
}

function SubTelaDecisao({ estado, zona, onEscolher }: SubTelaDecisaoProps) {
  const [selecionado, setSelecionado] = useState<string | null>(null);
  const jogadores = jogadoresDaZona(estado, zona);
  const lider = liderDaZona(estado, zona);
  const cor = COR_ZONA[zona];
  const outraZona = zona === 'zona_a' ? 'zona_b' : 'zona_a';

  function aoConfirmar() {
    if (!selecionado) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onEscolher(selecionado);
  }

  return (
    <SafeAreaView style={estilos.safe} edges={['top', 'bottom']}>
      <View style={estilos.decisaoCabecalho}>
        <View style={[estilos.zonaBadge, { backgroundColor: cor + '22', borderColor: cor }]}>
          <Text style={[estilos.zonaBadgeTexto, { color: cor }]}>
            {LABEL_ZONA[zona]}
          </Text>
        </View>
        <Text style={estilos.decisaoTitulo}>quem vai para a {LABEL_ZONA[outraZona]}?</Text>
        {lider && (
          <Text style={estilos.decisaoLider}>
            líder: <Text style={{ color: cor, fontWeight: '700' }}>{lider.nome}</Text> decide
          </Text>
        )}
      </View>

      <ScrollView
        contentContainerStyle={estilos.decisaoLista}
        showsVerticalScrollIndicator={false}
      >
        {jogadores.map((j) => (
          <TouchableOpacity
            key={j.id}
            style={[
              estilos.decisaoJogadorCard,
              selecionado === j.id && {
                borderColor: cor,
                borderWidth: 2,
                backgroundColor: cor + '11',
              },
            ]}
            onPress={() => {
              void Haptics.selectionAsync();
              setSelecionado(j.id);
            }}
            activeOpacity={0.75}
          >
            <Text
              style={[
                estilos.decisaoJogadorNome,
                selecionado === j.id && { color: cor, fontWeight: '700' },
              ]}
            >
              {j.nome}
            </Text>
            {selecionado === j.id && (
              <View style={[estilos.decisaoCheck, { backgroundColor: cor }]}>
                <Text style={estilos.decisaoCheckTexto}>✓</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={estilos.rodape}>
        <TouchableOpacity
          style={[
            estilos.botaoComecar,
            { backgroundColor: selecionado ? cor : cores.borda },
          ]}
          onPress={aoConfirmar}
          disabled={!selecionado}
          activeOpacity={0.85}
        >
          <Text
            style={[
              estilos.botaoComecarTexto,
              { color: selecionado ? '#fff' : cores.textoMudo },
            ]}
          >
            confirmar envio
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── SubTela: Resultado da rodada ─────────────────────────────────────────────

interface SubTelaResultadoRodadaProps {
  estado: EstadoOR;
  onContinuar: () => void;
}

function SubTelaResultadoRodada({ estado, onContinuar }: SubTelaResultadoRodadaProps) {
  const zonaA = jogadoresDaZona(estado, 'zona_a');
  const zonaB = jogadoresDaZona(estado, 'zona_b');
  const rodada = estado.historico[estado.historico.length - 1];
  const enviadoDeA = rodada?.enviadoDaA
    ? encontrarPorId(estado, rodada.enviadoDaA)
    : null;
  const enviadoDeB = rodada?.enviadoDaB
    ? encontrarPorId(estado, rodada.enviadoDaB)
    : null;
  const ultimaRodada = estado.rodadaAtual >= estado.totalRodadas;

  function aoContinuar() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onContinuar();
  }

  return (
    <SafeAreaView style={estilos.safe} edges={['top', 'bottom']}>
      <View style={estilos.resultadoCabecalho}>
        <Text style={estilos.resultadoRodadaLabel}>
          rodada {estado.rodadaAtual} — resultado
        </Text>
        {(enviadoDeA || enviadoDeB) && (
          <View style={estilos.trocasContainer}>
            {enviadoDeA && (
              <Text style={estilos.trocaTexto}>
                <Text style={{ color: COR_ZONA.zona_a, fontWeight: '700' }}>{enviadoDeA.nome}</Text>
                {' '}foi para a Zona B
              </Text>
            )}
            {enviadoDeB && (
              <Text style={estilos.trocaTexto}>
                <Text style={{ color: COR_ZONA.zona_b, fontWeight: '700' }}>{enviadoDeB.nome}</Text>
                {' '}foi para a Zona A
              </Text>
            )}
          </View>
        )}
      </View>

      <ScrollView
        contentContainerStyle={estilos.resultadoConteudo}
        showsVerticalScrollIndicator={false}
      >
        <ZonaCard zona="zona_a" jogadores={zonaA} />
        <ZonaCard zona="zona_b" jogadores={zonaB} />
      </ScrollView>

      <View style={estilos.rodape}>
        <TouchableOpacity
          style={[estilos.botaoComecar, { backgroundColor: COR_OR }]}
          onPress={aoContinuar}
          activeOpacity={0.85}
        >
          <Text style={estilos.botaoComecarTexto}>
            {ultimaRodada ? 'revelar resultado final' : `iniciar rodada ${estado.rodadaAtual + 1}`}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── SubTela: Debrief ─────────────────────────────────────────────────────────

interface SubTelaDebriefProps {
  estado: EstadoOR;
  onReiniciar: () => void;
}

function SubTelaDebrief({ estado, onReiniciar }: SubTelaDebriefProps) {
  const alvo = encontrarPorPapel(estado, 'alvo');
  const ameaca = encontrarPorPapel(estado, 'ameaca');
  const sabotagem = estado.vencedor === 'sabotagem';

  const corVencedor = sabotagem ? '#EF4444' : COR_OR;
  const emojiVencedor = sabotagem ? '🕵️' : '🛡️';
  const textoVencedor = sabotagem ? 'Sabotagem venceu' : 'Resgate venceu';

  function aoReiniciar() {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onReiniciar();
  }

  return (
    <SafeAreaView style={estilos.safe} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={estilos.debriefConteudo}
        showsVerticalScrollIndicator={false}
      >
        {/* Resultado principal */}
        <View style={[estilos.debriefResultado, { borderColor: corVencedor }]}>
          <Text style={estilos.debriefEmoji}>{emojiVencedor}</Text>
          <Text style={[estilos.debriefVencedor, { color: corVencedor }]}>
            {textoVencedor}
          </Text>
          {estado.decisaoChave && (
            <Text style={estilos.debriefDecisao}>{estado.decisaoChave}</Text>
          )}
        </View>

        {/* Revelação: Alvo e Ameaça */}
        <View style={estilos.debriefSecao}>
          <Text style={estilos.debriefSecaoTitulo}>identidades reveladas</Text>

          {alvo && <CartaResumo jogador={alvo} corDestaque={COR_OR} />}
          {ameaca && <CartaResumo jogador={ameaca} corDestaque="#EF4444" />}
        </View>

        {/* Composição final das zonas */}
        <View style={estilos.debriefSecao}>
          <Text style={estilos.debriefSecaoTitulo}>composição final</Text>
          <ZonaCard zona="zona_a" jogadores={jogadoresDaZona(estado, 'zona_a')} revelarPapeis />
          <ZonaCard zona="zona_b" jogadores={jogadoresDaZona(estado, 'zona_b')} revelarPapeis />
        </View>
      </ScrollView>

      <View style={estilos.rodape}>
        <TouchableOpacity
          style={[estilos.botaoComecar, { backgroundColor: COR_OR }]}
          onPress={aoReiniciar}
          activeOpacity={0.85}
        >
          <Text style={estilos.botaoComecarTexto}>jogar novamente</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── Subcomponentes ───────────────────────────────────────────────────────────

interface ZonaCardProps {
  zona: 'zona_a' | 'zona_b';
  jogadores: JogadorOR[];
  lider?: JogadorOR;
  revelarPapeis?: boolean;
}

function ZonaCard({ zona, jogadores, lider, revelarPapeis }: ZonaCardProps) {
  const cor = COR_ZONA[zona];
  const label = LABEL_ZONA[zona];

  return (
    <View style={[estilos.zonaCard, { borderColor: cor + '44' }]}>
      <View style={[estilos.zonaCardHeader, { backgroundColor: cor + '22' }]}>
        <Text style={[estilos.zonaCardTitulo, { color: cor }]}>{label}</Text>
        <Text style={estilos.zonaCardContagem}>{jogadores.length} operadores</Text>
      </View>
      <View style={estilos.zonaCardJogadores}>
        {jogadores.map((j) => {
          const isLider = lider?.id === j.id;
          return (
            <View
              key={j.id}
              style={[
                estilos.zonaJogadorChip,
                isLider && { borderColor: cor, backgroundColor: cor + '11' },
              ]}
            >
              <Text
                style={[
                  estilos.zonaJogadorNome,
                  isLider && { color: cor, fontWeight: '700' },
                ]}
              >
                {j.nome}
              </Text>
              {isLider && (
                <Text style={[estilos.zonaLiderBadge, { color: cor }]}>★</Text>
              )}
              {revelarPapeis && (
                <Text style={estilos.zonaJogadorPapel}>
                  {LABEL_PAPEL[j.papel]}
                </Text>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

interface CartaResumoProps {
  jogador: JogadorOR;
  corDestaque: string;
}

function CartaResumo({ jogador, corDestaque }: CartaResumoProps) {
  return (
    <View style={[estilos.cartaResumo, { borderColor: corDestaque + '44' }]}>
      <View style={[estilos.cartaResumoBadge, { backgroundColor: corDestaque + '22' }]}>
        <Text style={[estilos.cartaResumoPapel, { color: corDestaque }]}>
          {LABEL_PAPEL[jogador.papel]}
        </Text>
      </View>
      <Text style={estilos.cartaResumoNome}>{jogador.nome}</Text>
      <Text style={estilos.cartaResumoZona}>
        terminou na {LABEL_ZONA[jogador.zona]}
      </Text>
    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const estilos = StyleSheet.create({
  // ── Geral
  safe: {
    backgroundColor: cores.fundo,
    flex: 1,
  },
  rodape: {
    paddingBottom: espacamento.sm,
    paddingHorizontal: espacamento.md,
    paddingTop: espacamento.sm,
  },
  botaoComecar: {
    alignItems: 'center',
    borderRadius: raio.md,
    paddingVertical: 16,
  },
  botaoComecarTexto: {
    color: '#fff',
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpo,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // ── Distribuição de cartas
  distribuicaoTopo: {
    gap: espacamento.xs,
    paddingHorizontal: espacamento.md,
    paddingTop: espacamento.md,
  },
  distribuicaoProgresso: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    textAlign: 'center',
  },
  progressoBarraContainer: {
    flexDirection: 'row',
    gap: 4,
    height: 3,
  },
  progressoBarra: {
    backgroundColor: cores.borda,
    borderRadius: 2,
    flex: 1,
  },
  distribuicaoCentro: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: espacamento.md,
  },
  aguardandoContainer: {
    alignItems: 'center',
    gap: espacamento.sm,
    paddingVertical: espacamento.xl,
  },
  aguardandoNome: {
    color: '#fff',
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoTituloGrande,
    fontWeight: '800',
    textAlign: 'center',
  },
  aguardandoInstrucao: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpo,
    textAlign: 'center',
  },
  aguardandoAviso: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    fontStyle: 'italic',
    opacity: 0.6,
    textAlign: 'center',
  },
  botaoVerCarta: {
    backgroundColor: COR_OR,
    borderRadius: raio.md,
    marginTop: espacamento.md,
    paddingHorizontal: espacamento.xl,
    paddingVertical: 14,
  },
  botaoVerCartaTexto: {
    color: '#fff',
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpo,
    fontWeight: '700',
  },
  cartaContainer: {
    backgroundColor: '#1A1A24',
    borderColor: cores.borda,
    borderRadius: raio.lg,
    borderWidth: 1,
    gap: espacamento.sm,
    padding: espacamento.md,
  },
  cartaTituloBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COR_OR + '22',
    borderRadius: raio.sm,
    paddingHorizontal: espacamento.sm,
    paddingVertical: 4,
  },
  cartaTitulo: {
    color: COR_OR,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpo,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  cartaCorpo: {
    color: '#E5E5F0',
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpoMenor,
    lineHeight: 22,
  },
  cartaDivisor: {
    backgroundColor: cores.borda,
    height: 1,
    marginVertical: 4,
  },
  cartaObjetivoContainer: {
    gap: 4,
  },
  cartaObjetivoLabel: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  cartaObjetivo: {
    color: '#E5E5F0',
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpoMenor,
    lineHeight: 22,
  },
  cartaInfoContainer: {
    backgroundColor: '#0F2A1E',
    borderColor: '#10B98133',
    borderRadius: raio.sm,
    borderWidth: 1,
    gap: 4,
    padding: espacamento.sm,
  },
  cartaInfoLabel: {
    color: '#10B981',
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  cartaInfo: {
    color: '#A7F3D0',
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpoMenor,
    fontStyle: 'italic',
    lineHeight: 22,
  },
  botaoLiCarta: {
    alignItems: 'center',
    backgroundColor: COR_OR,
    borderRadius: raio.md,
    marginTop: espacamento.xs,
    paddingVertical: 14,
  },
  botaoLiCartaTexto: {
    color: '#fff',
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpo,
    fontWeight: '700',
  },

  // ── Zonas iniciais
  zonasHeader: {
    gap: 4,
    paddingHorizontal: espacamento.md,
    paddingTop: espacamento.md,
    paddingBottom: espacamento.sm,
  },
  zonasTitle: {
    color: cores.texto,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoTitulo,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  zonasSubtitle: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
  },
  zonasConteudo: {
    gap: espacamento.md,
    paddingHorizontal: espacamento.md,
    paddingBottom: espacamento.md,
  },
  zonasRegras: {
    gap: espacamento.sm,
  },
  zonasRegrasTexto: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpoMenor,
    lineHeight: 22,
  },

  // ── ZonaCard
  zonaCard: {
    backgroundColor: cores.fundoSecundario,
    borderRadius: raio.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  zonaCardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: espacamento.sm,
    paddingVertical: espacamento.xs,
  },
  zonaCardTitulo: {
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpo,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  zonaCardContagem: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
  },
  zonaCardJogadores: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    padding: espacamento.sm,
  },
  zonaJogadorChip: {
    alignItems: 'center',
    backgroundColor: cores.fundo,
    borderColor: cores.borda,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: espacamento.sm,
    paddingVertical: 5,
  },
  zonaJogadorNome: {
    color: cores.textoSecundario,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    fontWeight: '500',
  },
  zonaLiderBadge: {
    fontSize: 10,
  },
  zonaJogadorPapel: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: 10,
    fontStyle: 'italic',
  },

  // ── Discussão
  discussaoCabecalho: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: espacamento.md,
    paddingTop: espacamento.md,
    paddingBottom: espacamento.sm,
  },
  discussaoRodada: {
    color: cores.texto,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoTitulo,
    fontWeight: '800',
  },
  timerContainer: {
    backgroundColor: cores.fundoSecundario,
    borderRadius: raio.sm,
    paddingHorizontal: espacamento.sm,
    paddingVertical: 6,
  },
  timerTexto: {
    color: COR_OR,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoSubtitulo,
    fontWeight: '700',
    letterSpacing: 1,
  },
  discussaoConteudo: {
    gap: espacamento.md,
    paddingHorizontal: espacamento.md,
    paddingBottom: espacamento.md,
  },
  discussaoInstrucao: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpoMenor,
    lineHeight: 22,
    textAlign: 'center',
  },

  // ── Evento
  eventoCentro: {
    alignItems: 'center',
    flex: 1,
    gap: espacamento.md,
    justifyContent: 'center',
    paddingHorizontal: espacamento.lg,
  },
  eventoBadge: {
    backgroundColor: '#8B5CF622',
    borderRadius: raio.sm,
    paddingHorizontal: espacamento.sm,
    paddingVertical: 4,
  },
  eventoBadgeTexto: {
    color: '#8B5CF6',
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  eventoTitulo: {
    color: cores.texto,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoTitulo,
    fontWeight: '800',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  eventoDescricao: {
    color: cores.textoSecundario,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpo,
    lineHeight: 26,
    textAlign: 'center',
  },
  eventoRegra: {
    backgroundColor: '#8B5CF611',
    borderColor: '#8B5CF644',
    borderRadius: raio.sm,
    borderWidth: 1,
    marginTop: espacamento.sm,
    paddingHorizontal: espacamento.md,
    paddingVertical: espacamento.sm,
  },
  eventoRegraTexto: {
    color: '#A78BFA',
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpoMenor,
    textAlign: 'center',
  },

  // ── Decisão
  decisaoCabecalho: {
    gap: 6,
    paddingHorizontal: espacamento.md,
    paddingTop: espacamento.md,
    paddingBottom: espacamento.sm,
  },
  zonaBadge: {
    alignSelf: 'flex-start',
    borderRadius: raio.sm,
    borderWidth: 1,
    paddingHorizontal: espacamento.sm,
    paddingVertical: 3,
  },
  zonaBadgeTexto: {
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  decisaoTitulo: {
    color: cores.texto,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoTitulo,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  decisaoLider: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpoMenor,
  },
  decisaoLista: {
    gap: espacamento.xs,
    paddingHorizontal: espacamento.md,
    paddingBottom: espacamento.md,
  },
  decisaoJogadorCard: {
    alignItems: 'center',
    backgroundColor: cores.fundoSecundario,
    borderColor: cores.borda,
    borderRadius: raio.md,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: espacamento.md,
    paddingVertical: espacamento.sm,
  },
  decisaoJogadorNome: {
    color: cores.texto,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpo,
    fontWeight: '500',
  },
  decisaoCheck: {
    alignItems: 'center',
    borderRadius: 11,
    height: 22,
    justifyContent: 'center',
    width: 22,
  },
  decisaoCheckTexto: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },

  // ── Resultado da rodada
  resultadoCabecalho: {
    gap: 8,
    paddingHorizontal: espacamento.md,
    paddingTop: espacamento.md,
    paddingBottom: espacamento.sm,
  },
  resultadoRodadaLabel: {
    color: cores.texto,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoTitulo,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  trocasContainer: {
    gap: 4,
  },
  trocaTexto: {
    color: cores.textoSecundario,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpoMenor,
  },
  resultadoConteudo: {
    gap: espacamento.md,
    paddingHorizontal: espacamento.md,
    paddingBottom: espacamento.md,
  },

  // ── Debrief
  debriefConteudo: {
    gap: espacamento.lg,
    paddingHorizontal: espacamento.md,
    paddingTop: espacamento.md,
    paddingBottom: espacamento.md,
  },
  debriefResultado: {
    alignItems: 'center',
    borderRadius: raio.lg,
    borderWidth: 1,
    gap: espacamento.sm,
    padding: espacamento.lg,
  },
  debriefEmoji: {
    fontSize: 56,
  },
  debriefVencedor: {
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoTituloGrande,
    fontWeight: '800',
    letterSpacing: -1,
    textAlign: 'center',
  },
  debriefDecisao: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpoMenor,
    lineHeight: 22,
    textAlign: 'center',
  },
  debriefSecao: {
    gap: espacamento.sm,
  },
  debriefSecaoTitulo: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  cartaResumo: {
    backgroundColor: cores.fundoSecundario,
    borderRadius: raio.md,
    borderWidth: 1,
    gap: 4,
    padding: espacamento.sm,
  },
  cartaResumoBadge: {
    alignSelf: 'flex-start',
    borderRadius: raio.sm,
    paddingHorizontal: espacamento.xs,
    paddingVertical: 2,
  },
  cartaResumoPapel: {
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  cartaResumoNome: {
    color: cores.texto,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpo,
    fontWeight: '700',
  },
  cartaResumoZona: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
  },
});
