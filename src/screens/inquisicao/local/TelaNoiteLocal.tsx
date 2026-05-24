/**
 * TelaNoiteLocal — Fase noturna completa.
 *
 * Estados cobertos:
 *   noite_corrompidos → passagem escura + ação do corrompido
 *   noite_guardioes   → passagem escura + guardião ou tela neutra
 *   encerrando_noite  → mensagem ambígua + botão continuar
 *
 * Design anti-vazamento:
 *   - Fundo #0D0D0D em todos os estados — luminosidade uniforme
 *   - Todos passam por uma tela de protocolo antes de agir
 *   - Tela neutra idêntica visualmente às telas de ação
 *   - Sem haptic, sem som, sem animação de transição
 *   - Após ação: jogador confirma e baixa o celular
 */

import React, { useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { InquisicaoLocalEngine } from '@/games/inquisicao/local/localEngine';
import type {
  EstadoLocalPublico,
  FaseLocal,
  PlayerId,
  TipoAcaoLocal,
} from '@/games/inquisicao/local/types';
import { espacamento, familias, tipografia } from '@/theme/colors';

// Paleta da noite — uniforme em todos os estados
const N = {
  fundo: '#0D0D0D',
  texto: '#E8E2D9',
  mudo: '#454545',
  linha: '#1E1E1E',
  destaque: '#FF5A5F',
  bg_botao: '#1A1A1A',
  borda_botao: '#2A2A2A',
  diaFundo: '#F6F3EE',
  diaTexto: '#1A1A1A',
} as const;

interface Props {
  engine: InquisicaoLocalEngine;
  estado: EstadoLocalPublico;
  mapaNomes: Map<PlayerId, string>;
}

export function TelaNoiteLocal({ engine, estado, mapaNomes }: Props) {
  const fase = estado.fase as FaseLocal;

  if (fase === 'encerrando_noite') {
    return (
      <TelaEncerrandoNoite engine={engine} mensagem={estado.mensagemNoite} />
    );
  }

  if (fase === 'noite_corrompidos') {
    return (
      <TelaAcaoCorrompido
        engine={engine}
        estado={estado}
        mapaNomes={mapaNomes}
      />
    );
  }

  if (fase === 'noite_guardioes') {
    const ator = engine.getAtorFaseAtual();
    if (!ator) return <TelaNeutra engine={engine} />;
    return (
      <TelaAcaoGuardiao engine={engine} estado={estado} mapaNomes={mapaNomes} />
    );
  }

  return null;
}

// ── Tela neutra — aparece quando não há ator na fase (modo Leve sem guardião) ──
// Visual idêntico às telas de ação para não revelar ausência de papéis.

type EtapaNeutra = 'passagem' | 'confirmado';

function TelaNeutra({ engine }: { engine: InquisicaoLocalEngine }) {
  const [etapa, setEtapa] = useState<EtapaNeutra>('passagem');

  if (etapa === 'confirmado') {
    return <TelaConfirmado onContinuar={() => engine.confirmarFaseNoite()} />;
  }

  return (
    <TelaPassagemNoite
      titulo="a noite continua."
      subtitulo="toque para seguir"
      onPress={() => setEtapa('confirmado')}
    />
  );
}

// ── Ação do corrompido ────────────────────────────────────────────────────────
// Protocolo: passagem escura → tipo de ação → alvo → confirmação manual.

type EtapaCorrompido =
  | 'passagem'
  | 'escolhendo_tipo'
  | 'escolhendo_alvo'
  | 'confirmado';

function TelaAcaoCorrompido({
  engine,
  mapaNomes,
}: {
  engine: InquisicaoLocalEngine;
  estado?: EstadoLocalPublico;
  mapaNomes: Map<PlayerId, string>;
}) {
  const [etapa, setEtapa] = useState<EtapaCorrompido>('passagem');
  const [tipoEscolhido, setTipoEscolhido] = useState<TipoAcaoLocal | null>(
    null,
  );
  const ator = engine.getAtorFaseAtual();
  const nomeAtor = ator ? (mapaNomes.get(ator) ?? ator) : 'alguém';

  const handleEscolherTipo = (tipo: TipoAcaoLocal) => {
    setTipoEscolhido(tipo);
    setEtapa('escolhendo_alvo');
  };

  const handleEscolherAlvo = (alvo: PlayerId) => {
    if (!tipoEscolhido || etapa !== 'escolhendo_alvo') return;
    engine.registrarAcaoNoturna(tipoEscolhido, alvo);
    setEtapa('confirmado');
  };

  const alvos =
    tipoEscolhido && etapa === 'escolhendo_alvo'
      ? engine.getAlvosDisponiveis(
          engine.getAtorFaseAtual() ?? '',
          tipoEscolhido,
        )
      : [];
  const acoes: TipoAcaoLocal[] = ator
    ? engine.getAcoesCorrompidoDisponiveis(ator)
    : ['eliminar'];

  if (etapa === 'passagem') {
    return (
      <TelaPassagemNoite
        titulo={nomeAtor}
        subtitulo="toque para agir"
        onPress={() => setEtapa('escolhendo_tipo')}
      />
    );
  }

  // ── Confirmado — jogador avança quando baixar o celular ─────────────────
  if (etapa === 'confirmado') {
    return <TelaConfirmado onContinuar={() => engine.confirmarFaseNoite()} />;
  }

  // ── Escolhendo alvo ──────────────────────────────────────────────────────
  if (etapa === 'escolhendo_alvo') {
    return (
      <SafeAreaView style={estilos.container}>
        <FlatList
          data={alvos}
          keyExtractor={(id) => id}
          contentContainerStyle={estilos.listaConteudo}
          style={estilos.lista}
          renderItem={({ item: id }) => (
            <TouchableOpacity
              style={estilos.linhaAlvo}
              onPress={() => handleEscolherAlvo(id)}
              activeOpacity={0.7}
            >
              <Text style={estilos.nomeAlvo}>{mapaNomes.get(id) ?? id}</Text>
            </TouchableOpacity>
          )}
        />
        {/* Volta para escolha de tipo — mesmo toque de navegação normalizadora */}
        <TouchableOpacity
          style={estilos.voltarContainer}
          onPress={() => {
            setTipoEscolhido(null);
            setEtapa('escolhendo_tipo');
          }}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={estilos.labelVoltar}>← voltar</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ── Escolhendo tipo de ação ──────────────────────────────────────────────
  return (
    <SafeAreaView style={estilos.container}>
      <View style={estilos.acoesContainer}>
        {acoes.map((acao) => (
          <TouchableOpacity
            key={acao}
            style={estilos.botaoAcao}
            onPress={() => handleEscolherTipo(acao)}
            activeOpacity={0.8}
          >
            <Text style={estilos.textoBotaoAcao}>{acao}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

// ── Ação do guardião ──────────────────────────────────────────────────────────
// Protocolo: passagem escura → intenção → alvo → confirmação manual.

type EtapaGuardiao =
  | 'passagem'
  | 'confirmar_intencao'
  | 'escolhendo_alvo'
  | 'confirmado';

function TelaAcaoGuardiao({
  engine,
  mapaNomes,
}: {
  engine: InquisicaoLocalEngine;
  estado?: EstadoLocalPublico;
  mapaNomes: Map<PlayerId, string>;
}) {
  const [etapa, setEtapa] = useState<EtapaGuardiao>('passagem');

  const guardiao = engine.getAtorFaseAtual();
  const nomeGuardiao = guardiao
    ? (mapaNomes.get(guardiao) ?? guardiao)
    : 'alguém';
  const alvos = guardiao
    ? engine.getAlvosDisponiveis(guardiao, 'proteger')
    : [];

  const handleEscolherAlvo = (alvo: PlayerId) => {
    if (etapa !== 'escolhendo_alvo' || !guardiao) return;
    engine.registrarAcaoNoturna('proteger', alvo);
    setEtapa('confirmado');
  };

  if (etapa === 'passagem') {
    return (
      <TelaPassagemNoite
        titulo={nomeGuardiao}
        subtitulo="toque para agir"
        onPress={() => setEtapa('confirmar_intencao')}
      />
    );
  }

  if (etapa === 'confirmado') {
    return <TelaConfirmado onContinuar={() => engine.confirmarFaseNoite()} />;
  }

  if (etapa === 'escolhendo_alvo') {
    return (
      <SafeAreaView style={estilos.container}>
        <FlatList
          data={alvos}
          keyExtractor={(id) => id}
          contentContainerStyle={estilos.listaConteudo}
          style={estilos.lista}
          renderItem={({ item: id }) => (
            <TouchableOpacity
              style={estilos.linhaAlvo}
              onPress={() => handleEscolherAlvo(id)}
              activeOpacity={0.7}
            >
              <Text style={estilos.nomeAlvo}>{mapaNomes.get(id) ?? id}</Text>
            </TouchableOpacity>
          )}
        />
      </SafeAreaView>
    );
  }

  // Toque 1 — normalizador (espelha "eliminar"/"contaminar" do corrompido)
  return (
    <SafeAreaView style={estilos.container}>
      <View style={estilos.acoesContainer}>
        <TouchableOpacity
          style={estilos.botaoAcao}
          onPress={() => setEtapa('escolhendo_alvo')}
          activeOpacity={0.8}
        >
          <Text style={estilos.textoBotaoAcao}>proteger</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function TelaPassagemNoite({
  titulo,
  subtitulo,
  onPress,
}: {
  titulo: string;
  subtitulo: string;
  onPress: () => void;
}) {
  return (
    <SafeAreaView style={estilos.container}>
      <TouchableOpacity
        style={estilos.areaTouch}
        onPress={onPress}
        activeOpacity={0.9}
      >
        <View style={estilos.centroPassagem}>
          <Text style={estilos.tituloPassagem}>{titulo}</Text>
          <Text style={estilos.subtituloPassagem}>{subtitulo}</Text>
        </View>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

function TelaConfirmado({ onContinuar }: { onContinuar: () => void }) {
  return (
    <SafeAreaView style={estilos.container}>
      <TouchableOpacity
        style={estilos.areaTouch}
        onPress={onContinuar}
        activeOpacity={0.9}
      >
        <View style={estilos.centroCinfirmado}>
          <View style={estilos.confirmadoDot} />
          <Text style={estilos.textoConfirmado}>feito</Text>
        </View>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// ── Encerrando noite — mensagem ambígua ───────────────────────────────────────
// Fundo claro: sinal visual de que a noite terminou.
// Host lê a mensagem em voz alta antes de tocar continuar.

function TelaEncerrandoNoite({
  engine,
  mensagem,
}: {
  engine: InquisicaoLocalEngine;
  mensagem: string | null;
}) {
  return (
    <SafeAreaView style={estilos.containerDia}>
      <View style={estilos.centroMensagem}>
        <Text style={estilos.mensagemNoite}>{mensagem ?? '…'}</Text>
      </View>
      <View style={estilos.rodapeEncerramento}>
        <TouchableOpacity
          style={estilos.botaoContinuar}
          onPress={() => engine.confirmarNoite()}
          activeOpacity={0.8}
        >
          <Text style={estilos.textoContinuar}>continuar</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  // ── Noite (fundo escuro) ────────────────────────────────────────────────
  container: {
    flex: 1,
    backgroundColor: N.fundo,
  },
  areaTouch: {
    flex: 1,
  },
  centroPassagem: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: espacamento.xl,
  },
  tituloPassagem: {
    fontSize: 34,
    fontFamily: familias.serifDisplay,
    fontWeight: tipografia.pesoBold,
    color: N.texto,
    textAlign: 'center',
  },
  subtituloPassagem: {
    marginTop: espacamento.xs,
    fontSize: tipografia.tamanhoCorpo,
    fontFamily: familias.sans,
    color: N.mudo,
    textAlign: 'center',
  },
  acoesContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: espacamento.lg,
    gap: espacamento.md,
  },
  botaoAcao: {
    backgroundColor: N.bg_botao,
    borderRadius: 12,
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: N.borda_botao,
  },
  textoBotaoAcao: {
    fontSize: tipografia.tamanhoSubtituloGrande,
    fontFamily: familias.sans,
    fontWeight: tipografia.pesoBold,
    color: N.texto,
    letterSpacing: 0.5,
  },
  lista: {
    flex: 1,
  },
  listaConteudo: {
    paddingHorizontal: espacamento.lg,
    paddingTop: espacamento.lg,
  },
  linhaAlvo: {
    height: 64,
    justifyContent: 'center',
    paddingHorizontal: espacamento.md,
    borderBottomWidth: 1,
    borderBottomColor: N.linha,
  },
  nomeAlvo: {
    fontSize: tipografia.tamanhoSubtitulo,
    fontFamily: familias.sans,
    fontWeight: '500',
    color: N.texto,
  },
  voltarContainer: {
    paddingHorizontal: espacamento.lg,
    paddingBottom: espacamento.xl,
    paddingTop: espacamento.md,
  },
  labelVoltar: {
    fontSize: 12,
    fontFamily: familias.sans,
    color: N.mudo,
    letterSpacing: 0.3,
  },
  centroCinfirmado: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmadoDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: N.mudo,
  },
  textoConfirmado: {
    marginTop: espacamento.md,
    fontSize: tipografia.tamanhoCorpo,
    fontFamily: familias.sans,
    color: N.mudo,
  },
  // ── Encerrando noite (fundo claro — amanheceu) ─────────────────────────
  containerDia: {
    flex: 1,
    backgroundColor: N.diaFundo,
  },
  centroMensagem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: espacamento.xl,
  },
  mensagemNoite: {
    fontSize: tipografia.tamanhoSubtituloGrande,
    fontFamily: familias.serifDisplay,
    color: N.diaTexto,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  rodapeEncerramento: {
    paddingHorizontal: espacamento.lg,
    paddingBottom: espacamento.xl,
  },
  botaoContinuar: {
    backgroundColor: N.diaTexto,
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textoContinuar: {
    fontSize: tipografia.tamanhoCorpoMaior,
    fontFamily: familias.sans,
    fontWeight: tipografia.pesoBold,
    color: N.diaFundo,
  },
});
