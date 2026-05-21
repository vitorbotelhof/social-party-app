/**
 * TelaPlaytestLocal — Relatório pós-jogo para facilitadores de playtest.
 *
 * Visível apenas em __DEV__. Nunca aparece em produção.
 *
 * Layout:
 *   — Cabeçalho: modo, jogadores, vencedor, duração total
 *   — Hipóteses: 6 cards com status validada/alerta/refutada
 *   — Timeline: duração de cada fase por loop
 *   — Noites: ação registrada, bloqueio, contaminação por loop
 *   — Anomalias: lista de sinais que precisam de atenção
 */

import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type {
  PlaytestReport,
  HipoteseResult,
  LoopRelatorio,
  StatusHipotese,
} from '@/games/inquisicao/local/playtestTracker';

interface Props {
  relatorio: PlaytestReport;
  onVoltar: () => void;
}

// ─── Paleta — dev tool: deve parecer terminal, não produto ───────────────────

const D = {
  fundo: '#0A0A0A',
  superfície: '#111111',
  borda: '#1F1F1F',
  texto: '#D4D4D4',
  mudo: '#5A5A5A',
  ok: '#22C55E',
  alerta: '#F59E0B',
  erro: '#EF4444',
  info: '#60A5FA',
  branco: '#F5F5F5',
} as const;

// ─── Componente principal ─────────────────────────────────────────────────────

export function TelaPlaytestLocal({ relatorio, onVoltar }: Props) {
  const [secaoAberta, setSecaoAberta] = useState<
    'hipoteses' | 'timeline' | 'noites' | 'anomalias'
  >('hipoteses');

  const { metricas, vencedor, modo, numJogadores } = relatorio;
  const duracaoMin = (metricas.duracaoTotalMs / 60_000).toFixed(1);

  return (
    <SafeAreaView style={e.container}>

      {/* Cabeçalho — identidade da partida */}
      <View style={e.cabecalho}>
        <View style={e.cabecalhoTopo}>
          <Text style={e.titulo}>playtest</Text>
          <TouchableOpacity onPress={onVoltar} hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}>
            <Text style={e.fechar}>fechar</Text>
          </TouchableOpacity>
        </View>
        <View style={e.cabecalhoInfo}>
          <Chip label={`modo ${modo}`} />
          <Chip label={`${numJogadores} jogadores`} />
          <Chip
            label={vencedor ? `${vencedor} venceram` : '—'}
            cor={vencedor === 'corrompidos' ? D.erro : vencedor === 'inocentes' ? D.ok : D.mudo}
          />
          <Chip label={`${duracaoMin}min`} />
          <Chip label={`${metricas.totalLoops} loops`} />
        </View>
        {relatorio.anomalias.length > 0 && (
          <View style={e.badgeAnomalias}>
            <Text style={e.badgeAnomaliastexto}>
              {relatorio.anomalias.length} anomalia{relatorio.anomalias.length > 1 ? 's' : ''}
            </Text>
          </View>
        )}
      </View>

      {/* Tabs */}
      <View style={e.tabs}>
        {(['hipoteses', 'timeline', 'noites', 'anomalias'] as const).map((secao) => (
          <TouchableOpacity
            key={secao}
            style={[e.tab, secaoAberta === secao && e.tabAtiva]}
            onPress={() => setSecaoAberta(secao)}
          >
            <Text style={[e.tabLabel, secaoAberta === secao && e.tabLabelAtiva]}>
              {secao === 'hipoteses' ? 'hipóteses' : secao}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Conteúdo */}
      <ScrollView
        style={e.scroll}
        contentContainerStyle={e.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {secaoAberta === 'hipoteses' && (
          <SecaoHipoteses hipoteses={relatorio.hipoteses} />
        )}
        {secaoAberta === 'timeline' && (
          <SecaoTimeline loops={relatorio.loops} />
        )}
        {secaoAberta === 'noites' && (
          <SecaoNoites loops={relatorio.loops} />
        )}
        {secaoAberta === 'anomalias' && (
          <SecaoAnomalias anomalias={relatorio.anomalias} />
        )}
      </ScrollView>

    </SafeAreaView>
  );
}

// ─── Seções ───────────────────────────────────────────────────────────────────

function SecaoHipoteses({ hipoteses }: { hipoteses: HipoteseResult[] }) {
  return (
    <View style={e.secao}>
      {hipoteses.map((h) => (
        <CardHipotese key={h.id} h={h} />
      ))}
    </View>
  );
}

function CardHipotese({ h }: { h: HipoteseResult }) {
  const cor = corStatus(h.status);
  const label = labelStatus(h.status);

  return (
    <View style={e.cardHipotese}>
      <View style={e.cardHipoteseTopo}>
        <Text style={[e.statusBadge, { color: cor }]}>{label}</Text>
        <Text style={e.hipoteseId}>{h.id}</Text>
      </View>
      <Text style={e.hipoteseTitulo}>{h.titulo}</Text>
      <Text style={e.hipoteseDescricao}>{h.descricao}</Text>
      <View style={e.hipoteseMetrica}>
        <MetricaRow label="medido" valor={h.valorMedido} corValor={cor} />
        <MetricaRow label="esperado" valor={h.esperado} corValor={D.mudo} />
      </View>
    </View>
  );
}

function SecaoTimeline({ loops }: { loops: LoopRelatorio[] }) {
  if (loops.length === 0) {
    return <TextVazio>nenhum loop registrado.</TextVazio>;
  }

  const s = (ms: number | null) =>
    ms === null ? '—' : ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;

  return (
    <View style={e.secao}>
      <View style={e.tabelaCabecalho}>
        <Text style={[e.tabelaCell, e.tabelaLoop]}>loop</Text>
        <Text style={[e.tabelaCell, e.tabelaFase]}>dia</Text>
        <Text style={[e.tabelaCell, e.tabelaFase]}>voto</Text>
        <Text style={[e.tabelaCell, e.tabelaFase]}>noite</Text>
        <Text style={[e.tabelaCell, e.tabelaFase]}>msg</Text>
        <Text style={[e.tabelaCell, e.tabelaTotal]}>total</Text>
      </View>

      {loops.map((loop) => (
        <View key={loop.numero} style={e.tabelaLinha}>
          <Text style={[e.tabelaCell, e.tabelaLoop, e.tabelaValor]}>
            {loop.numero}
          </Text>
          <Text style={[e.tabelaCell, e.tabelaFase, e.tabelaValor,
            (loop.duracaoDiaMs ?? 0) > 300_000 && { color: D.alerta },
          ]}>
            {s(loop.duracaoDiaMs)}
          </Text>
          <Text style={[e.tabelaCell, e.tabelaFase, e.tabelaValor,
            (loop.duracaoVotacaoMs ?? 0) > 30_000 && { color: D.alerta },
          ]}>
            {s(loop.duracaoVotacaoMs)}
          </Text>
          <Text style={[e.tabelaCell, e.tabelaFase, e.tabelaValor,
            loop.duracaoNoiteMs !== null &&
            Math.abs((loop.duracaoNoiteMs) - 8000) > 3000 && { color: D.alerta },
          ]}>
            {s(loop.duracaoNoiteMs)}
          </Text>
          <Text style={[e.tabelaCell, e.tabelaFase, e.tabelaValor,
            (loop.duracaoMensagemMs ?? 0) > 20_000 && { color: D.alerta },
          ]}>
            {s(loop.duracaoMensagemMs)}
          </Text>
          <Text style={[e.tabelaCell, e.tabelaTotal, e.tabelaValor]}>
            {loop.duracaoTotalMs !== null
              ? `${(loop.duracaoTotalMs / 60_000).toFixed(1)}m`
              : '—'}
          </Text>
        </View>
      ))}

      <View style={e.legenda}>
        <Text style={e.legendaTexto}>
          amarelo = valor fora do esperado
        </Text>
      </View>
    </View>
  );
}

function SecaoNoites({ loops }: { loops: LoopRelatorio[] }) {
  const loopsComNoite = loops.filter((l) => l.duracaoNoiteMs !== null);

  if (loopsComNoite.length === 0) {
    return <TextVazio>nenhuma noite registrada.</TextVazio>;
  }

  return (
    <View style={e.secao}>
      <View style={e.tabelaCabecalho}>
        <Text style={[e.tabelaCell, e.tabelaLoop]}>loop</Text>
        <Text style={[e.tabelaCell, e.noiteCol]}>agiu</Text>
        <Text style={[e.tabelaCell, e.noiteCol]}>blq</Text>
        <Text style={[e.tabelaCell, e.noiteCol]}>cont</Text>
        <Text style={[e.tabelaCell, e.noiteEliminado]}>eliminado (papel)</Text>
      </View>

      {loopsComNoite.map((loop) => {
        const papel = loop.eliminadoEraPapel;
        const corPapel = papel === 'corrompido' ? D.erro : papel != null ? D.ok : D.mudo;

        return (
          <View key={loop.numero} style={e.tabelaLinha}>
            <Text style={[e.tabelaCell, e.tabelaLoop, e.tabelaValor]}>
              {loop.numero}
            </Text>
            <Text style={[e.tabelaCell, e.noiteCol, e.tabelaValor,
              { color: loop.corrompidoAgiu ? D.ok : loop.corrompidoAgiu === false ? D.erro : D.mudo },
            ]}>
              {loop.corrompidoAgiu === null ? '—' : loop.corrompidoAgiu ? 'sim' : 'não'}
            </Text>
            <Text style={[e.tabelaCell, e.noiteCol, e.tabelaValor,
              { color: loop.bloqueioGuardiao ? D.info : D.mudo },
            ]}>
              {loop.bloqueioGuardiao === null ? '—' : loop.bloqueioGuardiao ? 'sim' : 'não'}
            </Text>
            <Text style={[e.tabelaCell, e.noiteCol, e.tabelaValor,
              { color: loop.contaminacao ? D.alerta : D.mudo },
            ]}>
              {loop.contaminacao === null ? '—' : loop.contaminacao ? 'sim' : 'não'}
            </Text>
            <Text style={[e.tabelaCell, e.noiteEliminado, { color: corPapel, fontSize: 11 }]}>
              {loop.eliminadoId
                ? `${loop.eliminadoId.slice(0, 8)} (${loop.eliminadoEraPapel ?? '?'})`
                : '—'}
            </Text>
          </View>
        );
      })}

      <View style={e.legenda}>
        <LegendaItem cor={D.ok} label="correto / ação registrada" />
        <LegendaItem cor={D.erro} label="falso positivo / sem ação" />
        <LegendaItem cor={D.info} label="guardião bloqueou" />
        <LegendaItem cor={D.alerta} label="contaminação" />
      </View>
    </View>
  );
}

function SecaoAnomalias({ anomalias }: { anomalias: string[] }) {
  if (anomalias.length === 0) {
    return (
      <View style={e.secao}>
        <View style={e.cardOk}>
          <Text style={e.cardOkTexto}>nenhuma anomalia detectada.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={e.secao}>
      {anomalias.map((a, i) => (
        <View key={i} style={e.cardAnomalia}>
          <Text style={e.anomaliaLabel}>⚠</Text>
          <Text style={e.anomaliaTexto}>{a}</Text>
        </View>
      ))}
    </View>
  );
}

// ─── Componentes menores ──────────────────────────────────────────────────────

function Chip({ label, cor = D.mudo }: { label: string; cor?: string }) {
  return (
    <View style={e.chip}>
      <Text style={[e.chipTexto, { color: cor }]}>{label}</Text>
    </View>
  );
}

function MetricaRow({
  label,
  valor,
  corValor,
}: {
  label: string;
  valor: string;
  corValor: string;
}) {
  return (
    <View style={e.metricaRow}>
      <Text style={e.metricaLabel}>{label}</Text>
      <Text style={[e.metricaValor, { color: corValor }]}>{valor}</Text>
    </View>
  );
}

function LegendaItem({ cor, label }: { cor: string; label: string }) {
  return (
    <View style={e.legendaItem}>
      <View style={[e.legendaDot, { backgroundColor: cor }]} />
      <Text style={e.legendaTexto}>{label}</Text>
    </View>
  );
}

function TextVazio({ children }: { children: string }) {
  return (
    <View style={e.secao}>
      <Text style={e.vazioTexto}>{children}</Text>
    </View>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function corStatus(status: StatusHipotese): string {
  switch (status) {
    case 'validada': return D.ok;
    case 'alerta': return D.alerta;
    case 'refutada': return D.erro;
    case 'inconclusiva': return D.mudo;
  }
}

function labelStatus(status: StatusHipotese): string {
  switch (status) {
    case 'validada': return '✓ validada';
    case 'alerta': return '△ alerta';
    case 'refutada': return '✕ refutada';
    case 'inconclusiva': return '◌ inconclusiva';
  }
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const e = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: D.fundo,
  },
  // ── Cabeçalho ──
  cabecalho: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: D.borda,
  },
  cabecalhoTopo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  titulo: {
    fontSize: 13,
    fontFamily: 'monospace',
    color: D.mudo,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  fechar: {
    fontSize: 13,
    fontFamily: 'monospace',
    color: D.mudo,
  },
  cabecalhoInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    backgroundColor: D.superfície,
    borderWidth: 1,
    borderColor: D.borda,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  chipTexto: {
    fontSize: 11,
    fontFamily: 'monospace',
  },
  badgeAnomalias: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: '#3F1A1A',
    borderWidth: 1,
    borderColor: D.erro,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeAnomaliastexto: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: D.erro,
  },
  // ── Tabs ──
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: D.borda,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  tabAtiva: {
    borderBottomWidth: 1,
    borderBottomColor: D.info,
  },
  tabLabel: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: D.mudo,
  },
  tabLabelAtiva: {
    color: D.info,
  },
  // ── Scroll ──
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  secao: {
    padding: 16,
    gap: 10,
  },
  // ── Cards de hipótese ──
  cardHipotese: {
    backgroundColor: D.superfície,
    borderWidth: 1,
    borderColor: D.borda,
    borderRadius: 6,
    padding: 14,
    gap: 6,
  },
  cardHipoteseTopo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    fontSize: 11,
    fontFamily: 'monospace',
    letterSpacing: 0.5,
  },
  hipoteseId: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: D.mudo,
  },
  hipoteseTitulo: {
    fontSize: 14,
    fontFamily: 'monospace',
    color: D.branco,
  },
  hipoteseDescricao: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: D.mudo,
    lineHeight: 18,
  },
  hipoteseMetrica: {
    marginTop: 4,
    gap: 2,
  },
  metricaRow: {
    flexDirection: 'row',
    gap: 8,
  },
  metricaLabel: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: D.mudo,
    width: 60,
  },
  metricaValor: {
    fontSize: 11,
    fontFamily: 'monospace',
    flex: 1,
  },
  // ── Tabela ──
  tabelaCabecalho: {
    flexDirection: 'row',
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: D.borda,
    marginBottom: 2,
  },
  tabelaLinha: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: D.superfície,
  },
  tabelaCell: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: D.mudo,
  },
  tabelaValor: {
    color: D.texto,
  },
  tabelaLoop: {
    width: 36,
  },
  tabelaFase: {
    flex: 1,
    textAlign: 'right',
  },
  tabelaTotal: {
    width: 44,
    textAlign: 'right',
  },
  noiteCol: {
    flex: 1,
    textAlign: 'center',
  },
  noiteEliminado: {
    flex: 2,
    textAlign: 'right',
  },
  // ── Legenda ──
  legenda: {
    marginTop: 8,
    gap: 4,
  },
  legendaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendaDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendaTexto: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: D.mudo,
  },
  // ── Anomalias ──
  cardAnomalia: {
    flexDirection: 'row',
    backgroundColor: '#1A1200',
    borderWidth: 1,
    borderColor: '#3D2800',
    borderRadius: 6,
    padding: 12,
    gap: 10,
    alignItems: 'flex-start',
  },
  anomaliaLabel: {
    fontSize: 14,
    color: D.alerta,
    lineHeight: 20,
  },
  anomaliaTexto: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'monospace',
    color: D.alerta,
    lineHeight: 18,
  },
  // ── Estado ok ──
  cardOk: {
    backgroundColor: '#0A1F0A',
    borderWidth: 1,
    borderColor: '#1A4D1A',
    borderRadius: 6,
    padding: 14,
  },
  cardOkTexto: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: D.ok,
  },
  // ── Vazio ──
  vazioTexto: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: D.mudo,
    textAlign: 'center',
    paddingVertical: 40,
  },
});
