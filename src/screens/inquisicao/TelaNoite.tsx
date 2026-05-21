/**
 * TelaNoite — Fase noite.
 *
 * Fundo quasi-black. Fluxo diferenciado por papel:
 *  - Inocente: aguarde.
 *  - Corrompido: escolher ação (eliminar/contaminar) → escolher alvo → confirmar.
 *  - Guardião: escolher alvo para proteger → confirmar.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: LARGURA_TELA } = Dimensions.get('window');

import type { PlayerId } from '@/engine/types';
import type {
  EstadoFirebaseInquisicao,
  EstadoPrivadoInquisicao,
  TipoAcaoNoturna,
} from '@/games/inquisicao/types';
import { derivarAcoesNoturnas, derivarFaccao } from '@/games/inquisicao/types';
import type { InquisicaoRealtimeService } from '@/services/inquisicaoRealtime';
import { espacamento, familias, tipografia } from '@/theme/colors';

// ── Paleta da noite ──────────────────────────────────────────────────────────
const COR_NOITE = '#0D0D0D';
const COR_NOITE_TEXTO = '#E8E2D9';
const COR_NOITE_MUDO = '#454545';
const COR_NOITE_LINHA = '#1E1E1E';
const COR_CORRUPCAO = '#FF5A5F';

interface Props {
  estadoPublico: EstadoFirebaseInquisicao;
  estadoPrivado: EstadoPrivadoInquisicao | null;
  jogadorId: PlayerId;
  mapaNomes: Map<PlayerId, string>;
  realtime: InquisicaoRealtimeService;
}

export function TelaNoite({ estadoPublico, estadoPrivado, jogadorId, mapaNomes, realtime }: Props) {
  const [acaoEscolhida, setAcaoEscolhida] = useState<TipoAcaoNoturna | null>(null);
  const [alvoEscolhido, setAlvoEscolhido] = useState<PlayerId | null>(null);
  const [submetido, setSubmetido] = useState(false);
  const [enviando, setEnviando] = useState(false);

  // Timer visual para inocentes e jogadores aguardando
  const barraLargura = useState(() => new Animated.Value(LARGURA_TELA))[0];

  useEffect(() => {
    if (!estadoPublico.prazoFaseEm) return;
    const restante = Math.max(0, estadoPublico.prazoFaseEm - Date.now());

    Animated.timing(barraLargura, {
      toValue: 0,
      duration: restante,
      useNativeDriver: false,
    }).start();

    return () => barraLargura.stopAnimation();
  }, [estadoPublico.prazoFaseEm, barraLargura]);

  // Determinar papel e ações disponíveis
  const acoesDisponiveis = estadoPrivado ? derivarAcoesNoturnas(estadoPrivado) : [];
  const faccao = estadoPrivado ? derivarFaccao(estadoPrivado) : 'inocentes';
  const isCorrompido = faccao === 'corrompidos';
  const isGuardiao = estadoPrivado?.papelOriginal === 'guardiao' && faccao === 'inocentes';
  const semAcao = acoesDisponiveis.length === 0;

  // Candidatos a alvo
  const eliminadosIds = new Set(estadoPublico.eliminados.map((e) => e.jogadorId));
  const candidatos = estadoPublico.jogadoresAtivos.filter((id) => {
    if (eliminadosIds.has(id)) return false;
    // Corrompido não pode escolher a si mesmo
    if (isCorrompido && id === jogadorId) return false;
    return true;
  });

  const handleSubmeter = useCallback(async () => {
    if (!alvoEscolhido || !acaoEscolhida || enviando) return;
    setEnviando(true);
    const resultado = await realtime.submeterAcaoNoturna(
      jogadorId,
      acaoEscolhida,
      alvoEscolhido,
      estadoPublico.loop,
    );
    if (resultado === 'ok' || resultado === 'fase_errada') {
      setSubmetido(true);
    }
    setEnviando(false);
  }, [alvoEscolhido, acaoEscolhida, enviando, realtime, jogadorId, estadoPublico.loop]);

  // ── Inocente sem ação ────────────────────────────────────────────────────────
  if (semAcao) {
    return (
      <SafeAreaView style={estilos.container}>
        <View style={estilos.centro}>
          <Text style={estilos.textoAguarde}>aguarde.</Text>
        </View>
        {/* Barra de progresso da noite — ancora o inocente no tempo */}
        <Animated.View style={[estilos.barraNoite, { width: barraLargura }]} />
      </SafeAreaView>
    );
  }

  // ── Aguardando após submeter — mesmo silêncio do inocente ───────────────────
  if (submetido) {
    return (
      <SafeAreaView style={estilos.container}>
        <View style={estilos.centro}>
          <Text style={estilos.textoAguarde}>aguarde.</Text>
        </View>
        <Animated.View style={[estilos.barraNoite, { width: barraLargura }]} />
      </SafeAreaView>
    );
  }

  // ── Corrompido: step 1 escolher ação ─────────────────────────────────────────
  if (isCorrompido && !acaoEscolhida) {
    return (
      <SafeAreaView style={estilos.container}>
        <View style={estilos.flex1}>
          <View style={estilos.acoes}>
            <TouchableOpacity
              style={estilos.botaoAcao}
              onPress={() => setAcaoEscolhida('eliminar')}
              activeOpacity={0.8}
            >
              <Text style={estilos.textoBotaoAcao}>eliminar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={estilos.botaoAcao}
              onPress={() => setAcaoEscolhida('contaminar')}
              activeOpacity={0.8}
            >
              <Text style={estilos.textoBotaoAcao}>contaminar</Text>
            </TouchableOpacity>
          </View>
        </View>
        <Animated.View style={[estilos.barraNoite, { width: barraLargura }]} />
      </SafeAreaView>
    );
  }

  // ── Guardião ou corrompido após escolher ação: escolher alvo ─────────────────
  const labelTopo = isGuardiao
    ? 'quem você protege?'
    : acaoEscolhida === 'eliminar'
      ? 'quem você elimina?'
      : 'quem você contamina?';

  const renderAlvo = ({ item: id }: { item: PlayerId }) => {
    const selecionado = alvoEscolhido === id;
    return (
      <TouchableOpacity
        style={[estilos.linhaAlvo, selecionado && estilos.linhaAlvoSelecionada]}
        onPress={() => setAlvoEscolhido(id)}
        activeOpacity={0.75}
      >
        <Text style={[estilos.nomeAlvo, selecionado && estilos.nomeAlvoSelecionado]}>
          {mapaNomes.get(id) ?? id}
        </Text>
      </TouchableOpacity>
    );
  };

  // Guardião pode se incluir
  const listaCandidatos = isGuardiao
    ? estadoPublico.jogadoresAtivos.filter((id) => !eliminadosIds.has(id))
    : candidatos;

  return (
    <SafeAreaView style={estilos.container}>
      <View style={estilos.cabecalho}>
        {/* Corrompido pode voltar e escolher outro tipo de ação */}
        {isCorrompido && (
          <TouchableOpacity
            onPress={() => { setAcaoEscolhida(null); setAlvoEscolhido(null); }}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={estilos.labelVoltar}>← voltar</Text>
          </TouchableOpacity>
        )}
        <Text style={estilos.labelCabecalho}>{labelTopo}</Text>
      </View>

      <FlatList
        data={listaCandidatos}
        keyExtractor={(id) => id}
        renderItem={renderAlvo}
        style={estilos.lista}
        contentContainerStyle={estilos.listaConteudo}
      />

      <View style={estilos.rodape}>
        <TouchableOpacity
          style={[estilos.botaoConfirmar, !alvoEscolhido && estilos.botaoInativo]}
          onPress={handleSubmeter}
          disabled={!alvoEscolhido || enviando}
          activeOpacity={0.8}
        >
          <Text style={[estilos.textoConfirmar, !alvoEscolhido && estilos.textoInativo]}>
            confirmar
          </Text>
        </TouchableOpacity>
      </View>

      <Animated.View style={[estilos.barraNoite, { width: barraLargura }]} />
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COR_NOITE,
  },
  centro: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: espacamento.xl,
  },
  textoAguarde: {
    fontSize: tipografia.tamanhoHero,
    fontFamily: familias.serifDisplay,
    color: COR_NOITE_TEXTO,
    textAlign: 'center',
    letterSpacing: tipografia.spacingHero,
  },
  barraNoite: {
    height: 2,
    backgroundColor: COR_NOITE_LINHA,
    position: 'absolute',
    bottom: 0,
    left: 0,
  },
  cabecalho: {
    paddingHorizontal: espacamento.lg,
    paddingTop: espacamento.lg,
    paddingBottom: espacamento.md,
    gap: espacamento.xs,
  },
  labelCabecalho: {
    fontSize: 14,
    fontFamily: familias.sans,
    color: COR_NOITE_MUDO,
    letterSpacing: 0.5,
  },
  labelVoltar: {
    fontSize: 12,
    fontFamily: familias.sans,
    color: COR_NOITE_MUDO,
    letterSpacing: 0.3,
  },
  flex1: {
    flex: 1,
  },
  acoes: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: espacamento.lg,
    gap: espacamento.md,
  },
  botaoAcao: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  textoBotaoAcao: {
    fontSize: tipografia.tamanhoSubtituloGrande,
    fontFamily: familias.sans,
    fontWeight: tipografia.pesoBold,
    color: COR_NOITE_TEXTO,
    letterSpacing: 0.5,
  },
  lista: {
    flex: 1,
  },
  listaConteudo: {
    paddingHorizontal: espacamento.lg,
  },
  linhaAlvo: {
    height: 64,
    justifyContent: 'center',
    paddingHorizontal: espacamento.md,
    borderBottomWidth: 1,
    borderBottomColor: COR_NOITE_LINHA,
  },
  linhaAlvoSelecionada: {
    borderWidth: 1,
    borderColor: COR_CORRUPCAO,
    borderRadius: 8,
    borderBottomColor: COR_CORRUPCAO,
    marginBottom: 1,
  },
  nomeAlvo: {
    fontSize: tipografia.tamanhoSubtitulo,
    fontFamily: familias.sans,
    fontWeight: '500',
    color: COR_NOITE_TEXTO,
  },
  nomeAlvoSelecionado: {
    color: COR_CORRUPCAO,
  },
  rodape: {
    paddingHorizontal: espacamento.lg,
    paddingBottom: espacamento.xl,
    paddingTop: espacamento.md,
  },
  botaoConfirmar: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COR_NOITE_TEXTO,
  },
  botaoInativo: {
    borderColor: COR_NOITE_LINHA,
  },
  textoConfirmar: {
    fontSize: tipografia.tamanhoCorpoMaior,
    fontFamily: familias.sans,
    fontWeight: tipografia.pesoBold,
    color: COR_NOITE_TEXTO,
  },
  textoInativo: {
    color: COR_NOITE_MUDO,
  },
});
