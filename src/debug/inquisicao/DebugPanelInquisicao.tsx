/**
 * DebugPanelInquisicao — Painel flutuante de playtesting.
 *
 * Renderizado apenas em __DEV__. Posicionado absolutamente sobre o jogo.
 * Botão toggle no canto inferior direito — não interfere com o jogo.
 *
 * 4 abas:
 *   AÇÕES  — forçar estados, timer multiplier, mock players
 *   LOGS   — histórico de sub-fases e temperatura emocional
 *   MÉTRICAS — pacing metrics computadas em tempo real
 *   REPLAY — snapshot detalhado por loop
 *
 * Props:
 *   estadoPublico — estado atual do jogo (para context do jogador atual)
 *   anfitriaoId   — para forceActions (Firebase keyed por host)
 *   roomCode      — para forceActions
 *   jogadores     — lista de jogadores ativos (para pickers)
 *   isHost        — controla visibilidade de ações destrutivas
 */

import React, { useCallback, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { Player, PlayerId } from '@/engine/types';
import type { EstadoFirebaseInquisicao } from '@/games/inquisicao/types';

import {
  getDebugState,
  limparFaseLogs,
  resetDebugSession,
  setAba,
  setLoopSelecionado,
  setTimerMultiplier,
  setVerboseLogging,
  togglePainel,
  useDebugStore,
} from './debugStore';
import {
  avancarFaseImediatamente,
  forçarEventoPublico,
  forçarPapelJogador,
  limparVotacaoAtual,
  pularRevelacaoPapeis,
  simularVotacaoUnânime,
} from './forceActions';
import { exportarReplay } from './loopReplay';
import {
  adicionarMocksNaSala,
  mocksPapelVisto,
  removerMocksDaSala,
} from './mockPlayers';

// ── Paleta debug — intencionalmente diferente do jogo ────────────────────────

const D = {
  bg: 'rgba(10,10,10,0.96)',
  surface: '#111111',
  border: '#2A2A2A',
  text: '#E8E2D9',
  muted: '#555555',
  accent: '#FF5A5F',
  success: '#22C55E',
  warning: '#F59E0B',
  tab: '#1A1A1A',
  tabAtivo: '#FF5A5F',
  input: '#1E1E1E',
} as const;

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  estadoPublico: EstadoFirebaseInquisicao | null;
  anfitriaoId: PlayerId | null;
  roomCode: string;
  jogadores: Player[];
  isHost: boolean;
}

// ── Componente principal ──────────────────────────────────────────────────────

export function DebugPanelInquisicao({
  estadoPublico,
  anfitriaoId,
  roomCode,
  jogadores,
  isHost,
}: Props) {
  if (!__DEV__) return null;

  const debug = useDebugStore();

  return (
    <>
      {/* Botão toggle — sempre visível, canto inferior direito */}
      <View style={estilos.toggleContainer} pointerEvents="box-none">
        <TouchableOpacity
          style={estilos.toggleButton}
          onPress={togglePainel}
          activeOpacity={0.8}
        >
          <Text style={estilos.toggleLabel}>⚙</Text>
        </TouchableOpacity>
      </View>

      {/* Painel modal */}
      <Modal
        visible={debug.painelAberto}
        animationType="slide"
        transparent
        onRequestClose={togglePainel}
      >
        <View style={estilos.overlay}>
          <SafeAreaView style={estilos.painel} edges={['bottom']}>
            {/* Header */}
            <View style={estilos.header}>
              <Text style={estilos.headerTitulo}>debug / inquisição</Text>
              <TouchableOpacity onPress={togglePainel} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                <Text style={estilos.fechar}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Sub-fase atual */}
            {estadoPublico && (
              <View style={estilos.statusBar}>
                <Text style={estilos.statusTexto}>
                  subfase: <Text style={{ color: D.accent }}>{estadoPublico.subFase}</Text>
                  {'  '}loop: <Text style={{ color: D.accent }}>{estadoPublico.loop}</Text>
                  {'  '}host: <Text style={{ color: isHost ? D.success : D.muted }}>{isHost ? 'sim' : 'não'}</Text>
                </Text>
              </View>
            )}

            {/* Tabs */}
            <View style={estilos.tabs}>
              {(['acoes', 'logs', 'metricas', 'replay'] as const).map((aba) => (
                <TouchableOpacity
                  key={aba}
                  style={[estilos.tab, debug.abaAtiva === aba && estilos.tabAtiva]}
                  onPress={() => setAba(aba)}
                >
                  <Text style={[estilos.tabTexto, debug.abaAtiva === aba && estilos.tabTextoAtivo]}>
                    {aba}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Conteúdo */}
            <ScrollView style={estilos.conteudo} contentContainerStyle={estilos.conteudoInner}>
              {debug.abaAtiva === 'acoes' && (
                <AbaAcoes
                  anfitriaoId={anfitriaoId}
                  roomCode={roomCode}
                  jogadores={jogadores}
                  isHost={isHost}
                  timerMultiplier={debug.config.timerMultiplier}
                  verbose={debug.config.verboseLogging}
                />
              )}
              {debug.abaAtiva === 'logs' && (
                <AbaLogs
                  faseLogs={debug.faseLogs}
                  emocionalLogs={debug.emocionalLogs}
                />
              )}
              {debug.abaAtiva === 'metricas' && (
                <AbaMetricas metrics={debug.metrics} />
              )}
              {debug.abaAtiva === 'replay' && (
                <AbaReplay
                  loopSnapshots={debug.loopSnapshots}
                  loopSelecionado={debug.loopSelecionadoReplay}
                  jogadores={jogadores}
                />
              )}
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>
    </>
  );
}

// ── Aba AÇÕES ─────────────────────────────────────────────────────────────────

function AbaAcoes({
  anfitriaoId,
  roomCode,
  jogadores,
  isHost,
  timerMultiplier,
  verbose,
}: {
  anfitriaoId: PlayerId | null;
  roomCode: string;
  jogadores: Player[];
  isHost: boolean;
  timerMultiplier: number;
  verbose: boolean;
}) {
  const [eventoTexto, setEventoTexto] = useState('');
  const [mockQtd, setMockQtd] = useState(4);
  const [jogadorAlvo, setJogadorAlvo] = useState<PlayerId | null>(null);
  const [carregando, setCarregando] = useState<string | null>(null);

  const params = anfitriaoId ? { roomCode, anfitriaoId } : null;

  const executar = useCallback(async (chave: string, fn: () => Promise<void>) => {
    if (!params) {
      Alert.alert('Sem host', 'anfitriaoId não disponível');
      return;
    }
    setCarregando(chave);
    try { await fn(); } catch (e) { console.error('[Debug]', e); }
    setCarregando(null);
  }, [params]);

  return (
    <View style={estilos.secaoContainer}>

      {/* Timer */}
      <SecaoTitulo>timer</SecaoTitulo>
      <View style={estilos.row}>
        {[1, 2, 5, 10].map((mult) => (
          <TouchableOpacity
            key={mult}
            style={[estilos.chipBotao, timerMultiplier === mult && estilos.chipBotaoAtivo]}
            onPress={() => setTimerMultiplier(mult)}
          >
            <Text style={[estilos.chipTexto, timerMultiplier === mult && estilos.chipTextoAtivo]}>
              {mult}×
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <BotaoAcao
        label={carregando === 'avançar' ? '...' : 'avançar fase agora'}
        disabled={!isHost || carregando !== null}
        cor={D.accent}
        onPress={() => executar('avançar', () => avancarFaseImediatamente(params!))}
      />
      {!isHost && <AvisoSoHost />}

      {/* Revelar */}
      <SecaoTitulo>revelação</SecaoTitulo>
      <BotaoAcao
        label={carregando === 'pular' ? '...' : 'pular revelação (todos viram)'}
        disabled={!isHost || carregando !== null}
        onPress={() => executar('pular', () =>
          pularRevelacaoPapeis(params!, jogadores.map((j) => j.id)),
        )}
      />

      {/* Evento público */}
      <SecaoTitulo>evento público</SecaoTitulo>
      <TextInput
        style={estilos.input}
        value={eventoTexto}
        onChangeText={setEventoTexto}
        placeholder="texto do evento..."
        placeholderTextColor={D.muted}
        maxLength={80}
      />
      <View style={estilos.row}>
        <BotaoAcao
          label={carregando === 'evento' ? '...' : 'injetar'}
          disabled={!isHost || !eventoTexto.trim() || carregando !== null}
          flex
          onPress={() => executar('evento', () =>
            forçarEventoPublico(params!, eventoTexto.trim()),
          )}
        />
        <View style={{ width: 8 }} />
        <BotaoAcao
          label="limpar"
          disabled={!isHost || carregando !== null}
          flex
          onPress={() => executar('limpar_ev', () =>
            import('./forceActions').then(({ limparEventoPublico }) =>
              limparEventoPublico(params!),
            ),
          )}
        />
      </View>

      {/* Corrupção */}
      <SecaoTitulo>forçar papel</SecaoTitulo>
      <Text style={estilos.labelPequeno}>jogador alvo:</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
        <View style={estilos.row}>
          {jogadores.map((j) => (
            <TouchableOpacity
              key={j.id}
              style={[estilos.chipBotao, jogadorAlvo === j.id && estilos.chipBotaoAtivo]}
              onPress={() => setJogadorAlvo(j.id)}
            >
              <Text style={[estilos.chipTexto, jogadorAlvo === j.id && estilos.chipTextoAtivo]}>
                {j.nome}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
      <View style={estilos.row}>
        {(['inocente', 'corrompido', 'guardiao'] as const).map((papel) => (
          <BotaoAcao
            key={papel}
            label={carregando === `papel_${papel}` ? '...' : papel}
            disabled={!isHost || !jogadorAlvo || carregando !== null}
            flex
            onPress={() => executar(`papel_${papel}`, () =>
              forçarPapelJogador(params!, jogadorAlvo!, papel),
            )}
          />
        ))}
      </View>

      {/* Votação */}
      <SecaoTitulo>votação</SecaoTitulo>
      {jogadorAlvo && (
        <BotaoAcao
          label={carregando === 'voto_unanime' ? '...' : `votar unânime em ${jogadores.find(j => j.id === jogadorAlvo)?.nome}`}
          disabled={!isHost || carregando !== null}
          cor={D.warning}
          onPress={() => executar('voto_unanime', () =>
            simularVotacaoUnânime(
              params!,
              jogadores.map((j) => j.id),
              jogadorAlvo!,
            ),
          )}
        />
      )}
      <BotaoAcao
        label={carregando === 'limpar_voto' ? '...' : 'limpar votos atuais'}
        disabled={!isHost || carregando !== null}
        onPress={() => executar('limpar_voto', () => limparVotacaoAtual(params!))}
      />

      {/* Mock players */}
      <SecaoTitulo>mock players</SecaoTitulo>
      <View style={estilos.row}>
        {[4, 6, 8].map((n) => (
          <TouchableOpacity
            key={n}
            style={[estilos.chipBotao, mockQtd === n && estilos.chipBotaoAtivo]}
            onPress={() => setMockQtd(n)}
          >
            <Text style={[estilos.chipTexto, mockQtd === n && estilos.chipTextoAtivo]}>
              {n}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={estilos.row}>
        <BotaoAcao
          label={carregando === 'add_mock' ? '...' : `adicionar ${mockQtd} mocks`}
          disabled={carregando !== null}
          flex
          onPress={() => executar('add_mock', async () => {
            const ids = await adicionarMocksNaSala(roomCode, mockQtd);
            await mocksPapelVisto(roomCode, ids.length);
          })}
        />
        <View style={{ width: 8 }} />
        <BotaoAcao
          label={carregando === 'rm_mock' ? '...' : 'remover'}
          disabled={carregando !== null}
          flex
          onPress={() => executar('rm_mock', () => removerMocksDaSala(roomCode))}
        />
      </View>

      {/* Config */}
      <SecaoTitulo>config</SecaoTitulo>
      <TouchableOpacity
        style={[estilos.chipBotao, verbose && estilos.chipBotaoAtivo, { alignSelf: 'flex-start' }]}
        onPress={() => setVerboseLogging(!verbose)}
      >
        <Text style={[estilos.chipTexto, verbose && estilos.chipTextoAtivo]}>
          verbose logging
        </Text>
      </TouchableOpacity>
      <BotaoAcao
        label="resetar sessão debug"
        cor={D.accent}
        onPress={() => {
          resetDebugSession();
          import('./phaseLogger').then(({ resetPhaseLogger }) => resetPhaseLogger());
          import('./pacingTracker').then(({ resetPacingTracker }) => resetPacingTracker());
          import('./loopReplay').then(({ resetLoopReplay }) => resetLoopReplay());
        }}
      />
    </View>
  );
}

// ── Aba LOGS ──────────────────────────────────────────────────────────────────

function AbaLogs({
  faseLogs,
  emocionalLogs,
}: {
  faseLogs: ReturnType<typeof getDebugState>['faseLogs'];
  emocionalLogs: ReturnType<typeof getDebugState>['emocionalLogs'];
}) {
  const formatMs = (ms: number | null) =>
    ms === null ? '—' : ms >= 60_000
      ? `${(ms / 60_000).toFixed(1)}m`
      : `${(ms / 1000).toFixed(1)}s`;

  const corTemperatura = (temp: string) => {
    if (temp === 'colapso') return D.accent;
    if (temp === 'quente') return D.warning;
    if (temp === 'morno') return '#60A5FA';
    return D.muted;
  };

  return (
    <View style={estilos.secaoContainer}>

      {/* Logs de fase */}
      <View style={estilos.logHeader}>
        <SecaoTitulo>fases ({faseLogs.length})</SecaoTitulo>
        <TouchableOpacity onPress={limparFaseLogs}>
          <Text style={[estilos.labelPequeno, { color: D.accent }]}>limpar</Text>
        </TouchableOpacity>
      </View>

      {faseLogs.length === 0 ? (
        <Text style={estilos.vazio}>nenhum log ainda</Text>
      ) : (
        faseLogs.map((log) => (
          <View key={log.id} style={estilos.logLinha}>
            <View style={estilos.logEsquerda}>
              <Text style={estilos.logSubFase}>{log.subFase}</Text>
              <Text style={estilos.logLoop}>loop {log.loop}</Text>
            </View>
            <Text style={estilos.logDuracao}>
              {formatMs(log.duracaoAnteriorMs)}
            </Text>
          </View>
        ))
      )}

      {/* Logs emocionais */}
      <SecaoTitulo>temperatura ({emocionalLogs.length})</SecaoTitulo>
      {emocionalLogs.length === 0 ? (
        <Text style={estilos.vazio}>nenhuma mudança de temperatura</Text>
      ) : (
        emocionalLogs.map((log, i) => (
          <View key={i} style={estilos.logLinha}>
            <View style={estilos.logEsquerda}>
              <Text style={[estilos.logSubFase, { color: corTemperatura(log.temperatura) }]}>
                {log.temperatura}
              </Text>
              {log.momento && (
                <Text style={estilos.logLoop}>{log.momento}</Text>
              )}
            </View>
            <Text style={estilos.logDuracao}>
              {new Date(log.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </Text>
          </View>
        ))
      )}
    </View>
  );
}

// ── Aba MÉTRICAS ──────────────────────────────────────────────────────────────

function AbaMetricas({ metrics }: { metrics: ReturnType<typeof getDebugState>['metrics'] }) {
  const formatMs = (ms: number | null) => {
    if (ms === null) return '—';
    if (ms >= 60_000) return `${(ms / 60_000).toFixed(1)}m`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const itens: Array<{ label: string; valor: string; cor?: string }> = [
    { label: 'loops totais', valor: String(metrics.totalLoops) },
    { label: 'média discussão', valor: formatMs(metrics.tempoMedioDiscussaoMs) },
    { label: 'média votação', valor: formatMs(metrics.tempoMedioVotacaoMs) },
    {
      label: 'loops até paranoia',
      valor: metrics.loopsAteTemperaturaQuente !== null
        ? `loop ${metrics.loopsAteTemperaturaQuente}`
        : '—',
      cor: metrics.loopsAteTemperaturaQuente !== null ? D.warning : undefined,
    },
    {
      label: 'eventos privados lidos',
      valor: metrics.pctEventosPrivadosLidos !== null
        ? `${metrics.pctEventosPrivadosLidos}%`
        : '—',
    },
    {
      label: 'loop mais caótico',
      valor: metrics.loopMaisCaoticoVotacao !== null
        ? `loop ${metrics.loopMaisCaoticoVotacao}`
        : '—',
    },
    {
      label: 'replay imediato',
      valor: metrics.replayImediato === null ? '—' : metrics.replayImediato ? 'sim' : 'não',
      cor: metrics.replayImediato === true ? D.success : metrics.replayImediato === false ? D.accent : undefined,
    },
  ];

  return (
    <View style={estilos.secaoContainer}>
      <SecaoTitulo>pacing metrics</SecaoTitulo>

      {itens.map((item) => (
        <View key={item.label} style={estilos.metricaLinha}>
          <Text style={estilos.metricaLabel}>{item.label}</Text>
          <Text style={[estilos.metricaValor, item.cor ? { color: item.cor } : null]}>
            {item.valor}
          </Text>
        </View>
      ))}

      <View style={{ height: 16 }} />
      <BotaoAcao
        label="exportar JSON (console)"
        onPress={() => {
          const json = exportarReplay();
          console.log('[Inquisição Debug] EXPORT:\n', json);
          Alert.alert('Exportado', 'JSON completo no console do Metro.');
        }}
      />
    </View>
  );
}

// ── Aba REPLAY ────────────────────────────────────────────────────────────────

function AbaReplay({
  loopSnapshots,
  loopSelecionado,
  jogadores,
}: {
  loopSnapshots: ReturnType<typeof getDebugState>['loopSnapshots'];
  loopSelecionado: number | null;
  jogadores: Player[];
}) {
  const mapa = new Map(jogadores.map((j) => [j.id, j.nome]));
  const nome = (id: string) => mapa.get(id as PlayerId) ?? id;
  const formatMs = (ms: number | null) => ms === null ? '—' : `${(ms / 1000).toFixed(1)}s`;

  const snap = loopSnapshots.find((s) => s.loop === loopSelecionado) ?? null;

  return (
    <View style={estilos.secaoContainer}>
      <SecaoTitulo>replay por loop</SecaoTitulo>

      {loopSnapshots.length === 0 ? (
        <Text style={estilos.vazio}>nenhum loop registrado</Text>
      ) : (
        <>
          {/* Seletor de loop */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
            <View style={estilos.row}>
              {loopSnapshots.map((s) => (
                <TouchableOpacity
                  key={s.loop}
                  style={[estilos.chipBotao, loopSelecionado === s.loop && estilos.chipBotaoAtivo]}
                  onPress={() => setLoopSelecionado(s.loop === loopSelecionado ? null : s.loop)}
                >
                  <Text style={[estilos.chipTexto, loopSelecionado === s.loop && estilos.chipTextoAtivo]}>
                    L{s.loop}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Detalhe do loop selecionado */}
          {snap ? (
            <View style={estilos.replayCard}>
              <ReplayRow label="loop" valor={String(snap.loop)} />
              <ReplayRow label="discussão" valor={formatMs(snap.duracaoDiscussaoMs)} />
              <ReplayRow label="votação" valor={formatMs(snap.duracaoVotacaoMs)} />
              <ReplayRow
                label="eliminado"
                valor={snap.eliminadoId ? nome(snap.eliminadoId) : 'ninguém'}
                cor={snap.eliminadoId ? D.accent : D.muted}
              />
              {snap.eliminadoPapel && (
                <ReplayRow label="papel" valor={snap.eliminadoPapel} />
              )}
              <ReplayRow
                label="eventos públicos"
                valor={String(snap.eventosPublicosExibidos)}
              />
              <ReplayRow
                label="eventos privados lidos"
                valor={`${snap.eventosPrivadosLidos}/${snap.eventosPrivadosTotais}`}
              />

              {/* Distribuição de votos */}
              {Object.keys(snap.distribuicaoVotos).length > 0 && (
                <>
                  <Text style={[estilos.labelPequeno, { marginTop: 12, marginBottom: 4 }]}>
                    votos:
                  </Text>
                  {Object.entries(snap.distribuicaoVotos)
                    .sort(([, a], [, b]) => b - a)
                    .map(([alvoId, count]) => (
                      <View key={alvoId} style={estilos.votoLinha}>
                        <Text style={estilos.votoNome}>{nome(alvoId)}</Text>
                        <View style={estilos.votoBarra}>
                          <View
                            style={[
                              estilos.votoBarraPreench,
                              { flex: count },
                            ]}
                          />
                          <View style={{ flex: Math.max(0, 5 - count) }} />
                        </View>
                        <Text style={estilos.votoCount}>{count}</Text>
                      </View>
                    ))}
                </>
              )}

              {/* Ação noturna */}
              {snap.acaoNoturna && (
                <>
                  <Text style={[estilos.labelPequeno, { marginTop: 12, marginBottom: 4 }]}>
                    ação noturna:
                  </Text>
                  <Text style={estilos.logSubFase}>
                    {nome(snap.acaoNoturna.jogadorId)} → {snap.acaoNoturna.acao} → {nome(snap.acaoNoturna.alvo)}
                  </Text>
                </>
              )}
            </View>
          ) : (
            <Text style={estilos.vazio}>selecione um loop</Text>
          )}
        </>
      )}
    </View>
  );
}

// ── Sub-componentes reutilizáveis ─────────────────────────────────────────────

function SecaoTitulo({ children }: { children: React.ReactNode }) {
  return <Text style={estilos.secaoTitulo}>{children}</Text>;
}

function AvisoSoHost() {
  return (
    <Text style={estilos.aviso}>⚠ apenas o host pode executar ações de estado</Text>
  );
}

function BotaoAcao({
  label,
  onPress,
  disabled,
  cor,
  flex,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  cor?: string;
  flex?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[
        estilos.botaoAcao,
        disabled && estilos.botaoAcaoDisabled,
        cor ? { borderColor: cor } : null,
        flex ? { flex: 1 } : null,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Text style={[estilos.botaoAcaoTexto, cor ? { color: cor } : null, disabled && { color: D.muted }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function ReplayRow({ label, valor, cor }: { label: string; valor: string; cor?: string }) {
  return (
    <View style={estilos.replayRow}>
      <Text style={estilos.replayLabel}>{label}</Text>
      <Text style={[estilos.replayValor, cor ? { color: cor } : null]}>{valor}</Text>
    </View>
  );
}

// ── Estilos ───────────────────────────────────────────────────────────────────

const estilos = StyleSheet.create({
  // Toggle button
  toggleContainer: {
    position: 'absolute',
    bottom: 100,
    right: 16,
    zIndex: 9999,
  },
  toggleButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,90,95,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleLabel: {
    fontSize: 20,
    color: '#FFFFFF',
  },

  // Overlay
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  painel: {
    height: '75%',
    backgroundColor: D.bg,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: D.border,
  },
  headerTitulo: {
    fontSize: 13,
    fontFamily: 'System',
    color: D.muted,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  fechar: {
    fontSize: 18,
    color: D.muted,
  },

  // Status bar
  statusBar: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: D.surface,
    borderBottomWidth: 1,
    borderBottomColor: D.border,
  },
  statusTexto: {
    fontSize: 12,
    fontFamily: 'System',
    color: D.muted,
  },

  // Tabs
  tabs: {
    flexDirection: 'row',
    backgroundColor: D.surface,
    borderBottomWidth: 1,
    borderBottomColor: D.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  tabAtiva: {
    borderBottomWidth: 2,
    borderBottomColor: D.tabAtivo,
  },
  tabTexto: {
    fontSize: 11,
    fontFamily: 'System',
    color: D.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tabTextoAtivo: {
    color: D.tabAtivo,
  },

  // Conteúdo
  conteudo: {
    flex: 1,
  },
  conteudoInner: {
    padding: 16,
    paddingBottom: 32,
  },

  // Seções
  secaoContainer: {
    gap: 8,
  },
  secaoTitulo: {
    fontSize: 11,
    fontFamily: 'System',
    color: D.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 16,
    marginBottom: 4,
  },

  // Controles
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chipBotao: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: D.border,
    backgroundColor: D.surface,
  },
  chipBotaoAtivo: {
    backgroundColor: D.accent,
    borderColor: D.accent,
  },
  chipTexto: {
    fontSize: 12,
    fontFamily: 'System',
    color: D.muted,
  },
  chipTextoAtivo: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  botaoAcao: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: D.border,
    alignItems: 'center',
  },
  botaoAcaoDisabled: {
    opacity: 0.4,
  },
  botaoAcaoTexto: {
    fontSize: 13,
    fontFamily: 'System',
    color: D.text,
  },
  input: {
    backgroundColor: D.input,
    borderWidth: 1,
    borderColor: D.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: D.text,
    fontFamily: 'System',
  },
  labelPequeno: {
    fontSize: 11,
    fontFamily: 'System',
    color: D.muted,
  },
  aviso: {
    fontSize: 11,
    fontFamily: 'System',
    color: D.warning,
  },

  // Logs
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logLinha: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: D.border,
  },
  logEsquerda: {
    flex: 1,
    gap: 2,
  },
  logSubFase: {
    fontSize: 13,
    fontFamily: 'System',
    color: D.text,
  },
  logLoop: {
    fontSize: 11,
    fontFamily: 'System',
    color: D.muted,
  },
  logDuracao: {
    fontSize: 12,
    fontFamily: 'System',
    color: D.accent,
    minWidth: 50,
    textAlign: 'right',
  },
  vazio: {
    fontSize: 13,
    fontFamily: 'System',
    color: D.muted,
    fontStyle: 'italic',
    paddingVertical: 8,
  },

  // Métricas
  metricaLinha: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: D.border,
  },
  metricaLabel: {
    fontSize: 13,
    fontFamily: 'System',
    color: D.muted,
  },
  metricaValor: {
    fontSize: 14,
    fontFamily: 'System',
    color: D.text,
    fontWeight: '600',
  },

  // Replay
  replayCard: {
    backgroundColor: D.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: D.border,
    padding: 12,
    gap: 4,
  },
  replayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  replayLabel: {
    fontSize: 12,
    fontFamily: 'System',
    color: D.muted,
  },
  replayValor: {
    fontSize: 13,
    fontFamily: 'System',
    color: D.text,
    fontWeight: '500',
  },
  votoLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 3,
  },
  votoNome: {
    fontSize: 12,
    fontFamily: 'System',
    color: D.text,
    width: 80,
  },
  votoBarra: {
    flex: 1,
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: D.border,
  },
  votoBarraPreench: {
    backgroundColor: D.accent,
    borderRadius: 4,
  },
  votoCount: {
    fontSize: 12,
    fontFamily: 'System',
    color: D.accent,
    width: 20,
    textAlign: 'right',
  },
});
