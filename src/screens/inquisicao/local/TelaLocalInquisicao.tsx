/**
 * TelaLocalInquisicao — Orquestrador do modo local (1 celular).
 *
 * Gerencia o ciclo de vida do engine e roteia para a tela correta
 * com base na fase atual. Telas simples estão inline aqui;
 * telas com estado local próprio são componentes separados.
 *
 * Telas inline (sem estado local, pura renderização):
 *   - TelaDiaInline         (fase: dia)
 *   - TelaRegistrarVoto     (fase: chamando_votacao)
 *   - TelaResultadoVotacaoInline (fase: resultado_votacao)
 *   - TelaAguardandoNoite   (fase: aguardando_noite)
 *
 * Telas com estado próprio (componentes):
 *   - TelaDistribuicaoLocal (fase: distribuindo_papeis)
 *   - TelaNoiteLocal        (fases: noite_corrompidos, noite_guardioes, encerrando_noite)
 *   - TelaResultadoLocal    (fase: finalizado)
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// eslint-disable-next-line no-undef -- __DEV__ é global do React Native
declare const __DEV__: boolean;

import { ControleEncerrarJogo } from '@/components';
import { InquisicaoLocalEngine } from '@/games/inquisicao/local/localEngine';
import {
  processarLoopLocalInquisicao,
  processarResultadoLocalInquisicao,
} from '@/games/inquisicao/local/inquisicaoLocalAdapter';
import { PlaytestTracker } from '@/games/inquisicao/local/playtestTracker';
import type { PlaytestReport } from '@/games/inquisicao/local/playtestTracker';
import type {
  ConfiguracaoLocal,
  EstadoLocalPublico,
  JogadorLocal,
  PlayerId,
} from '@/games/inquisicao/local/types';
import { assegurarSessaoIniciada } from '@/session/sessionStore';

import { TelaPlaytestLocal } from './TelaPlaytestLocal';
import { cores, espacamento, familias, tipografia } from '@/theme/colors';

import { TelaDistribuicaoLocal } from './TelaDistribuicaoLocal';
import { TelaNoiteLocal } from './TelaNoiteLocal';
import { TelaResultadoLocal } from './TelaResultadoLocal';

const CORES_NOITE_LOCAL = {
  fundo: '#0D0D0D',
  texto: '#E8E2D9',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  jogadores: JogadorLocal[];
  config: ConfiguracaoLocal;
  onVoltar: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Orquestrador
// ─────────────────────────────────────────────────────────────────────────────

export function TelaLocalInquisicao({ jogadores, config, onVoltar }: Props) {
  const engineRef = useRef<InquisicaoLocalEngine | null>(null);
  const trackerRef = useRef<PlaytestTracker | null>(null);
  const [estado, setEstado] = useState<EstadoLocalPublico | null>(null);
  const [relatorio, setRelatorio] = useState<PlaytestReport | null>(null);
  const [verRelatorio, setVerRelatorio] = useState(false);

  const mapaNomes = useRef(
    new Map(jogadores.map((j) => [j.id, j.nome])),
  ).current;

  useEffect(() => {
    // Tracker de playtest — apenas em __DEV__, invisível durante o jogo
    const tracker = __DEV__
      ? new PlaytestTracker(jogadores.length, config.modo)
      : null;
    trackerRef.current = tracker;

    // Garantir sessão ativa e registrar início do jogo
    assegurarSessaoIniciada(jogadores, 'inquisicao');

    const engine = new InquisicaoLocalEngine(
      jogadores,
      config,
      (novoEstado) => {
        setEstado(novoEstado);
        tracker?.onEstadoMudou(novoEstado);
      },
      {
        onLoopResolvido: (loop) => {
          processarLoopLocalInquisicao(loop);
          tracker?.onLoopResolvido(loop);
        },
        onJogoFinalizado: (resultado) => {
          processarResultadoLocalInquisicao(resultado, config.modo);
          tracker?.onJogoFinalizado(resultado);
          if (__DEV__) {
            setRelatorio(tracker?.getReport() ?? null);
          }
        },
      },
    );

    engineRef.current = engine;
    setEstado(engine.getEstado());
    return () => engine.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!estado || !engineRef.current) return null;

  const engine = engineRef.current;

  function comEncerrar(children: React.ReactNode) {
    return (
      <ControleEncerrarJogo onConfirmar={onVoltar}>
        {children}
      </ControleEncerrarJogo>
    );
  }

  // ── Routing ──────────────────────────────────────────────────────────────

  switch (estado.fase) {
    case 'distribuindo_papeis':
      return comEncerrar(
        <TelaDistribuicaoLocal
          // key garante remount completo a cada troca de jogador
          key={estado.distribuicao?.indiceAtual ?? 0}
          engine={engine}
          estado={estado}
          mapaNomes={mapaNomes}
        />,
      );

    case 'dia':
      return comEncerrar(
        <TelaDiaInline engine={engine} estado={estado} mapaNomes={mapaNomes} />,
      );

    case 'chamando_votacao':
      return comEncerrar(
        <TelaRegistrarVoto
          engine={engine}
          estado={estado}
          mapaNomes={mapaNomes}
        />,
      );

    case 'resultado_votacao':
      return comEncerrar(
        <TelaResultadoVotacaoInline
          engine={engine}
          estado={estado}
          mapaNomes={mapaNomes}
        />,
      );

    case 'aguardando_noite':
      return comEncerrar(<TelaAguardandoNoite engine={engine} />);

    case 'noite_corrompidos':
    case 'noite_guardioes':
    case 'encerrando_noite':
      return comEncerrar(
        <TelaNoiteLocal
          engine={engine}
          estado={estado}
          mapaNomes={mapaNomes}
        />,
      );

    case 'finalizado':
      if (__DEV__ && verRelatorio && relatorio) {
        return (
          <TelaPlaytestLocal
            relatorio={relatorio}
            onVoltar={() => setVerRelatorio(false)}
          />
        );
      }
      return (
        <TelaResultadoLocal
          estado={estado}
          jogadores={jogadores}
          onVoltar={onVoltar}
          onVerRelatorio={
            __DEV__ && relatorio ? () => setVerRelatorio(true) : undefined
          }
        />
      );

    default:
      return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// TelaDiaInline — Discussão livre. O celular está quase fora de cena.
//
// Mostra: loop atual, lista de jogadores vivos (referência para o host),
// mensagem da noite anterior (já lida em voz alta, como eco sutil),
// botão único: "chamar votação".
// ─────────────────────────────────────────────────────────────────────────────

function TelaDiaInline({
  engine,
  estado,
  mapaNomes,
}: {
  engine: InquisicaoLocalEngine;
  estado: EstadoLocalPublico;
  mapaNomes: Map<PlayerId, string>;
}) {
  return (
    <SafeAreaView style={estilosDia.container}>
      {/* Cabeçalho mínimo — loop number only */}
      <View style={estilosDia.cabecalho}>
        <Text style={estilosDia.labelLoop}>loop {estado.loop}</Text>
      </View>

      {/* Lista de jogadores vivos — referência visual para o apontamento físico */}
      <FlatList
        data={estado.jogadoresAtivos}
        keyExtractor={(id) => id}
        style={estilosDia.lista}
        contentContainerStyle={estilosDia.listaConteudo}
        renderItem={({ item: id }) => (
          <View style={estilosDia.linhaJogador}>
            <Text style={estilosDia.nomeJogador}>
              {mapaNomes.get(id) ?? id}
            </Text>
          </View>
        )}
      />

      {/* CTA único — host aciona quando o apontamento simultâneo terminou */}
      <View style={estilosDia.rodape}>
        <TouchableOpacity
          style={estilosDia.botaoVotacao}
          onPress={() => engine.chamarVotacao()}
          activeOpacity={0.8}
        >
          <Text style={estilosDia.textoBotaoVotacao}>apontar</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TelaRegistrarVoto — Host registra o resultado do apontamento físico.
// Eliminação, empate ou ninguém caiu. Sem contagem individual no celular.
// ─────────────────────────────────────────────────────────────────────────────

function TelaRegistrarVoto({
  engine,
  estado,
  mapaNomes,
}: {
  engine: InquisicaoLocalEngine;
  estado: EstadoLocalPublico;
  mapaNomes: Map<PlayerId, string>;
}) {
  return (
    <SafeAreaView style={estilosVoto.container}>
      <View style={estilosVoto.cabecalho}>
        <Text style={estilosVoto.titulo}>quem caiu?</Text>
      </View>

      <FlatList
        data={estado.jogadoresAtivos}
        keyExtractor={(id) => id}
        style={estilosVoto.lista}
        contentContainerStyle={estilosVoto.listaConteudo}
        renderItem={({ item: id }) => (
          <TouchableOpacity
            style={estilosVoto.linhaJogador}
            onPress={() => engine.registrarEliminado(id)}
            activeOpacity={0.7}
          >
            <Text style={estilosVoto.nomeJogador}>
              {mapaNomes.get(id) ?? id}
            </Text>
          </TouchableOpacity>
          )}
      />

      <View style={estilosVoto.rodape}>
        <TouchableOpacity
          style={estilosVoto.botaoSecundario}
          onPress={() => engine.registrarEmpate()}
          activeOpacity={0.8}
        >
          <Text style={estilosVoto.textoBotaoSecundario}>empate</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={estilosVoto.botaoSecundario}
          onPress={() => engine.registrarSemEliminacao()}
          activeOpacity={0.8}
        >
          <Text style={estilosVoto.textoBotaoSecundario}>ninguém caiu</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TelaResultadoVotacaoInline — Resultado mínimo da votação física.
// Botão "continuar" é sempre visível — o host controla o tempo.
// ─────────────────────────────────────────────────────────────────────────────

const COR_CORROMPIDO = '#FF5A5F';
const COR_GUARDIAO = '#22C55E';
const COR_INOCENTE = '#4D7CFE';

function corDoPapelLocal(papel: string): string {
  if (papel === 'corrompido') return COR_CORROMPIDO;
  if (papel === 'guardiao') return COR_GUARDIAO;
  return COR_INOCENTE;
}

function TelaResultadoVotacaoInline({
  engine,
  estado,
  mapaNomes,
}: {
  engine: InquisicaoLocalEngine;
  estado: EstadoLocalPublico;
  mapaNomes: Map<PlayerId, string>;
}) {
  const resultado = estado.resultadoVotacao;
  const eliminado = resultado?.tipo === 'eliminacao' ? resultado.eliminado : null;
  const [revelarPapelPadrao, setRevelarPapelPadrao] = useState(
    estado.configuracao.modo === 'leve',
  );

  useEffect(() => {
    if (estado.configuracao.modo !== 'padrao') return;
    const timer = setTimeout(() => setRevelarPapelPadrao(true), 1100);
    return () => clearTimeout(timer);
  }, [estado.configuracao.modo]);

  if (!resultado) return null;

  const nome = eliminado
    ? (mapaNomes.get(eliminado.jogadorId) ?? eliminado.jogadorId)
    : resultado.tipo === 'empate'
      ? 'empate.'
      : 'ninguém caiu.';
  const deveRevelarPapel =
    eliminado !== null &&
    (estado.configuracao.modo === 'leve' ||
    (estado.configuracao.modo === 'padrao' && revelarPapelPadrao);
  const textoRevelacao =
    eliminado === null
      ? resultado.tipo === 'empate'
        ? 'o grupo rachou.'
        : 'a dúvida venceu.'
      : deveRevelarPapel
    ? `${eliminado.papel}.`
    : estado.configuracao.modo === 'paranoia'
      ? 'saiu.'
      : 'ninguém sabe ainda.';

  return (
    <SafeAreaView style={estilosRevelacao.container}>
      <View style={estilosRevelacao.centro}>
        <Text style={estilosRevelacao.nomeEliminado}>{nome}</Text>
        <Text
          style={[
            estilosRevelacao.papelEliminado,
            {
              color: deveRevelarPapel
                ? corDoPapelLocal(eliminado?.papel ?? 'inocente')
                : cores.textoMudo,
            },
          ]}
        >
          {textoRevelacao}
        </Text>
      </View>

      <View style={estilosRevelacao.rodape}>
        <TouchableOpacity
          style={estilosRevelacao.botaoContinuar}
          onPress={() => engine.confirmarEliminacao()}
          activeOpacity={0.8}
        >
          <Text style={estilosRevelacao.textoContinuar}>continuar</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TelaAguardandoNoite — Instrução para fechar olhos. Host inicia a noite.
// ─────────────────────────────────────────────────────────────────────────────

function TelaAguardandoNoite({ engine }: { engine: InquisicaoLocalEngine }) {
  return (
    <SafeAreaView style={estilosAguardando.container}>
      <View style={estilosAguardando.centro}>
        <Text style={estilosAguardando.instrucao}>fechem os olhos.</Text>
      </View>

      <View style={estilosAguardando.rodape}>
        <TouchableOpacity
          style={estilosAguardando.botaoNoite}
          onPress={() => engine.iniciarNoite()}
          activeOpacity={0.8}
        >
          <Text style={estilosAguardando.textoBotao}>iniciar noite</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Estilos
// ─────────────────────────────────────────────────────────────────────────────

// Dia
const estilosDia = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: cores.fundo,
  },
  cabecalho: {
    paddingHorizontal: espacamento.lg,
    paddingTop: espacamento.md,
    paddingBottom: espacamento.sm,
  },
  labelLoop: {
    fontSize: 13,
    fontFamily: familias.sans,
    color: cores.textoMudo,
  },
  lista: {
    flex: 1,
  },
  listaConteudo: {
    paddingHorizontal: espacamento.lg,
  },
  linhaJogador: {
    height: 52,
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: cores.borda,
  },
  nomeJogador: {
    fontSize: tipografia.tamanhoSubtitulo,
    fontFamily: familias.sans,
    fontWeight: '500',
    color: cores.texto,
  },
  rodape: {
    paddingHorizontal: espacamento.lg,
    paddingBottom: espacamento.xl,
    paddingTop: espacamento.md,
  },
  botaoVotacao: {
    backgroundColor: cores.texto,
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textoBotaoVotacao: {
    fontSize: tipografia.tamanhoCorpoMaior,
    fontFamily: familias.sans,
    fontWeight: tipografia.pesoBold,
    color: cores.fundo,
  },
});

// Votação — flat list sem título, sem cards
const estilosVoto = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: cores.fundo,
  },
  lista: {
    flex: 1,
  },
  listaConteudo: {
    paddingHorizontal: espacamento.lg,
    paddingTop: espacamento.xl,
  },
  linhaJogador: {
    height: 64,
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: cores.borda,
  },
  nomeJogador: {
    fontSize: tipografia.tamanhoSubtitulo,
    fontFamily: familias.sans,
    fontWeight: '500',
    color: cores.texto,
  },
});

// Revelação
const estilosRevelacao = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: cores.fundo,
  },
  centro: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: espacamento.xl,
    gap: espacamento.sm,
  },
  nomeEliminado: {
    fontSize: tipografia.tamanhoDisplay,
    fontFamily: familias.serifDisplay,
    color: cores.texto,
    textAlign: 'center',
    letterSpacing: tipografia.spacingHero,
  },
  papelEliminado: {
    fontSize: tipografia.tamanhoTitulo,
    fontFamily: familias.serifDisplay,
    textAlign: 'center',
    letterSpacing: tipografia.spacingTitulo,
  },
  rodape: {
    paddingHorizontal: espacamento.lg,
    paddingBottom: espacamento.xl,
    paddingTop: espacamento.md,
  },
  botaoContinuar: {
    backgroundColor: cores.texto,
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textoContinuar: {
    fontSize: tipografia.tamanhoCorpoMaior,
    fontFamily: familias.sans,
    fontWeight: tipografia.pesoBold,
    color: cores.fundo,
  },
});

// Aguardando noite
const estilosAguardando = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: cores.fundo,
  },
  centro: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: espacamento.xl,
  },
  instrucao: {
    fontSize: tipografia.tamanhoHero,
    fontFamily: familias.serifDisplay,
    color: cores.texto,
    textAlign: 'center',
    letterSpacing: tipografia.spacingHero,
  },
  rodape: {
    paddingHorizontal: espacamento.lg,
    paddingBottom: espacamento.xl,
    paddingTop: espacamento.md,
  },
  botaoNoite: {
    backgroundColor: CORES_NOITE_LOCAL.fundo,
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textoBotao: {
    fontSize: tipografia.tamanhoCorpoMaior,
    fontFamily: familias.sans,
    fontWeight: tipografia.pesoBold,
    color: CORES_NOITE_LOCAL.texto,
  },
});
