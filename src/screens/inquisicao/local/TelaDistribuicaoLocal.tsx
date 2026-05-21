/**
 * TelaDistribuicaoLocal — Revelação sequencial de papéis.
 *
 * Fluxo por jogador:
 *   1. "toque para ver" → host passa o celular
 *   2. Toque → 800ms em branco (composição facial — proteção anti-spoiler)
 *   3. Papel aparece com aliados (se corrompido)
 *   4. 3s auto-avanço → próximo jogador
 *
 * Keyed por `indiceAtual` no pai — remonta completamente a cada troca.
 * Isso garante reset de estado local sem lógica explícita.
 */

import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { InquisicaoLocalEngine } from '@/games/inquisicao/local/localEngine';
import type { EstadoLocalPublico, PlayerId } from '@/games/inquisicao/local/types';
import { cores, espacamento, familias, tipografia } from '@/theme/colors';

const COR_CORROMPIDO = '#FF5A5F';
const COR_GUARDIAO = '#22C55E';
const COR_INOCENTE = '#4D7CFE';

function corDoPapel(papel: string): string {
  if (papel === 'corrompido') return COR_CORROMPIDO;
  if (papel === 'guardiao') return COR_GUARDIAO;
  return COR_INOCENTE;
}

interface Props {
  engine: InquisicaoLocalEngine;
  estado: EstadoLocalPublico;
  mapaNomes: Map<PlayerId, string>;
}

export function TelaDistribuicaoLocal({ engine, estado, mapaNomes }: Props) {
  // 'aguardando' → host está passando o celular para o jogador
  // 'compondo'   → 800ms em branco antes de revelar (proteção anti-spoiler)
  // 'revelando'  → papel visível, timer de auto-avanço correndo
  const [etapa, setEtapa] = useState<'aguardando' | 'compondo' | 'revelando'>('aguardando');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const jogadorNaVez = engine.getJogadorNaVez();

  // Auto-avanço após o papel ser exibido
  useEffect(() => {
    if (etapa !== 'revelando') return;
    timerRef.current = setTimeout(
      () => engine.avancarDistribuicao(),
      estado.configuracao.duracaoDistribuicaoMs,
    );
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [etapa, engine, estado.configuracao.duracaoDistribuicaoMs]);

  const handleToque = () => {
    if (etapa !== 'aguardando') return;
    setEtapa('compondo');
    // 800ms: tempo suficiente para compor a expressão antes de ver a informação
    timerRef.current = setTimeout(() => setEtapa('revelando'), 800);
  };

  if (!jogadorNaVez) return null;

  // ── Tela de "compondo" — 800ms em branco ─────────────────────────────────
  if (etapa === 'compondo') {
    return <SafeAreaView style={estilos.container} />;
  }

  // ── Papel visível ─────────────────────────────────────────────────────────
  if (etapa === 'revelando') {
    const papel = engine.getPapelAtribuido(jogadorNaVez.id);
    if (!papel) return null;

    const descricaoPapel =
      papel.papel === 'corrompido'
        ? 'elimine os inocentes.'
        : papel.papel === 'guardiao'
          ? 'proteja um jogador por noite.'
          : 'descubra os corrompidos.';

    return (
      <SafeAreaView style={estilos.container}>
        <View style={estilos.centro}>
          <Text style={[estilos.nomePapel, { color: corDoPapel(papel.papel) }]}>
            {papel.papel}
          </Text>

          <Text style={estilos.descricao}>{descricaoPapel}</Text>

          {/* Aliados — apenas corrompidos veem */}
          {papel.aliados.length > 0 && (
            <View style={estilos.aliadosContainer}>
              <View style={estilos.separador} />
              {papel.aliados.map((id) => (
                <Text key={id} style={estilos.nomeAliado}>
                  {mapaNomes.get(id) ?? id}
                </Text>
              ))}
            </View>
          )}

          {/* Indicador de ator da noite — corrompido designado para agir neste loop */}
          {papel.papel === 'corrompido' && papel.isAtorNoite && (
            <Text style={estilos.atorNoite}>você age esta noite.</Text>
          )}
        </View>
      </SafeAreaView>
    );
  }

  // ── Aguardando — host passa o celular ────────────────────────────────────
  return (
    <SafeAreaView style={estilos.container}>
      <TouchableOpacity
        style={estilos.areaTouch}
        onPress={handleToque}
        activeOpacity={1}
      >
        <View style={estilos.centro}>
          <Text style={estilos.nomeJogador}>{jogadorNaVez.nome}</Text>
          <Text style={estilos.instrucao}>toque para ver</Text>
        </View>

        {/* Progresso discreto da distribuição */}
        <Text style={estilos.progresso}>
          {(estado.distribuicao?.indiceAtual ?? 0) + 1} de{' '}
          {estado.distribuicao?.jogadoresOrdem.length ?? 0}
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: cores.fundo,
  },
  areaTouch: {
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: espacamento.xl,
  },
  centro: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: espacamento.xl,
  },
  nomeJogador: {
    fontSize: tipografia.tamanhoDisplay,
    fontFamily: familias.serifDisplay,
    color: cores.texto,
    textAlign: 'center',
    letterSpacing: tipografia.spacingHero,
    marginBottom: espacamento.sm,
  },
  instrucao: {
    fontSize: tipografia.tamanhoCorpoMenor,
    fontFamily: familias.sans,
    color: cores.textoMudo,
    letterSpacing: 0.3,
  },
  progresso: {
    fontSize: 12,
    fontFamily: familias.sans,
    color: cores.textoMudo,
    textAlign: 'center',
    opacity: 0.5,
  },
  // ── Estado revelando ────────────────────────────────────────────────────
  nomePapel: {
    fontSize: tipografia.tamanhoDisplay,
    fontFamily: familias.serifDisplay,
    textAlign: 'center',
    letterSpacing: tipografia.spacingHero,
  },
  descricao: {
    fontSize: tipografia.tamanhoCorpoMenor,
    fontFamily: familias.sans,
    color: cores.textoMudo,
    textAlign: 'center',
    marginTop: espacamento.sm,
    letterSpacing: 0.3,
  },
  separador: {
    height: 1,
    width: 32,
    backgroundColor: cores.borda,
    marginTop: espacamento.xl,
    marginBottom: espacamento.md,
  },
  aliadosContainer: {
    alignItems: 'center',
  },
  nomeAliado: {
    fontSize: tipografia.tamanhoCorpoMaior,
    fontFamily: familias.sans,
    fontWeight: tipografia.pesoBold,
    color: COR_CORROMPIDO,
    marginBottom: espacamento.xs,
  },
  atorNoite: {
    fontSize: 12,
    fontFamily: familias.sans,
    color: cores.textoMudo,
    marginTop: espacamento.lg,
    letterSpacing: 0.3,
  },
});
