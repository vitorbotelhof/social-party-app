/**
 * TelaLocalAlianca — orquestrador local do jogo Aliança.
 *
 * Sprint 5 cobre:
 *   acabamento de playtest: haptics, pressão de rejeição, final e histórico.
 */

import * as Haptics from 'expo-haptics';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ControleEncerrarJogo } from '@/components';
import { AliancaLocalEngine } from '@/games/alianca';
import { TEXTOS_ALIANCA } from '@/games/alianca';
import {
  processarRejeicaoAlianca,
  processarResultadoAlianca,
  processarRodadaAlianca,
} from '@/session/aliancaAdapter';
import type {
  AcaoMissaoAlianca,
  ConfiguracaoAlianca,
  EstadoAliancaPublico,
  JogadorAlianca,
  PlayerId,
} from '@/games/alianca';
import { cores, espacamento, familias, raio, tipografia } from '@/theme/colors';

interface Props {
  jogadores: JogadorAlianca[];
  config: ConfiguracaoAlianca;
  onVoltar: () => void;
}

const COR_LEAL = '#4D7CFE';
const COR_TRAIDOR = '#FF5A5F';
const COR_POLITICA = 'rgba(22, 22, 22, 0.04)';
const COR_NOITE = '#0D0D0D';
const COR_BOTAO_ESCURO = '#1A1A1A';
const COR_BOTAO_ESCURO_BORDA = '#2A2A2A';
const COR_TEXTO_ESCURO_MUDO = '#777777';

export function TelaLocalAlianca({ jogadores, config, onVoltar }: Props) {
  const engineRef = useRef<AliancaLocalEngine | null>(null);
  const [estado, setEstado] = useState<EstadoAliancaPublico | null>(null);
  const mapaNomes = useMemo(
    () => new Map(jogadores.map((j) => [j.id, j.nome])),
    [jogadores],
  );

  useEffect(() => {
    const engine = new AliancaLocalEngine(jogadores, config, setEstado, {
      onRodadaResolvida: processarRodadaAlianca,
      onEquipeRejeitada: processarRejeicaoAlianca,
      onJogoFinalizado: processarResultadoAlianca,
    });
    engineRef.current = engine;
    setEstado(engine.getEstado());
    return () => engine.destroy();
  }, [config, jogadores]);

  if (!estado || !engineRef.current) return null;
  const engine = engineRef.current;

  function comEncerrar(children: ReactNode) {
    return (
      <ControleEncerrarJogo onConfirmar={onVoltar}>
        {children}
      </ControleEncerrarJogo>
    );
  }

  switch (estado.fase) {
    case 'distribuindo_papeis':
      return comEncerrar(
        <TelaDistribuicaoAlianca
          key={estado.distribuicao?.indiceAtual ?? 0}
          engine={engine}
          estado={estado}
          mapaNomes={mapaNomes}
        />,
      );
    case 'escolhendo_equipe':
      return comEncerrar(
        <TelaEscolhaEquipe
          engine={engine}
          estado={estado}
          mapaNomes={mapaNomes}
        />,
      );
    case 'debate':
      return comEncerrar(
        <TelaDebate engine={engine} estado={estado} mapaNomes={mapaNomes} />,
      );
    case 'votando_equipe':
      return comEncerrar(
        <TelaVotacaoEquipe
          engine={engine}
          estado={estado}
          mapaNomes={mapaNomes}
        />,
      );
    case 'resultado_votacao':
      return comEncerrar(
        <TelaResultadoVotacao engine={engine} estado={estado} />,
      );
    case 'missao':
      return comEncerrar(
        <TelaMissaoAlianca
          key={estado.missao?.indiceAtual ?? 0}
          engine={engine}
          estado={estado}
          mapaNomes={mapaNomes}
        />,
      );
    case 'resultado_missao':
      return comEncerrar(
        <TelaResultadoMissao
          engine={engine}
          estado={estado}
          mapaNomes={mapaNomes}
        />,
      );
    case 'finalizado':
      return (
        <TelaFinalAlianca
          estado={estado}
          mapaNomes={mapaNomes}
          onVoltar={onVoltar}
        />
      );
  }
}

function TelaDistribuicaoAlianca({
  engine,
  estado,
  mapaNomes,
}: {
  engine: AliancaLocalEngine;
  estado: EstadoAliancaPublico;
  mapaNomes: Map<PlayerId, string>;
}) {
  const [etapa, setEtapa] = useState<'aguardando' | 'compondo' | 'revelando'>(
    'aguardando',
  );
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const jogador = engine.getJogadorNaVezDistribuicao();

  useEffect(() => {
    if (etapa !== 'revelando') return;
    timerRef.current = setTimeout(
      () => engine.avancarDistribuicao(),
      estado.configuracao.duracaoDistribuicaoMs,
    );
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [engine, estado.configuracao.duracaoDistribuicaoMs, etapa]);

  if (!jogador) return null;

  if (etapa === 'compondo') {
    return <SafeAreaView style={estilos.tela} />;
  }

  if (etapa === 'revelando') {
    const papel = engine.getPapelAtribuido(jogador.id);
    if (!papel) return null;
    const traidor = papel.papel === 'traidor';
    return (
      <SafeAreaView style={estilos.tela}>
        <View style={estilos.centro}>
          <Text
            style={[
              estilos.papel,
              traidor ? estilos.papelTraidor : estilos.papelLeal,
            ]}
          >
            {papel.papel}
          </Text>
          <Text style={estilos.subtexto}>
            {traidor ? 'sabote sem parecer ansioso.' : 'complete as missões.'}
          </Text>

          {papel.aliadosTraidores.length > 0 && (
            <View style={estilos.aliados}>
              <View style={estilos.separador} />
              <Text style={estilos.labelAliados}>
                {TEXTOS_ALIANCA.distribuir.aliados}
              </Text>
              {papel.aliadosTraidores.map((id) => (
                <Text key={id} style={estilos.nomeAliado}>
                  {mapaNomes.get(id) ?? id}
                </Text>
              ))}
            </View>
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={estilos.tela}>
      <TouchableOpacity
        style={estilos.areaTouch}
        activeOpacity={1}
        onPress={() => {
          setEtapa('compondo');
          timerRef.current = setTimeout(() => setEtapa('revelando'), 700);
        }}
      >
        <View style={estilos.centro}>
          <Text style={estilos.nomeGrande}>{jogador.nome}</Text>
          <Text style={estilos.subtexto}>toque para ver</Text>
        </View>
        <Text style={estilos.progresso}>
          {(estado.distribuicao?.indiceAtual ?? 0) + 1} de{' '}
          {estado.distribuicao?.jogadoresOrdem.length ?? 0}
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

function TelaEscolhaEquipe({
  engine,
  estado,
  mapaNomes,
}: {
  engine: AliancaLocalEngine;
  estado: EstadoAliancaPublico;
  mapaNomes: Map<PlayerId, string>;
}) {
  const tamanhoEquipe = engine.getTamanhoEquipeAtual();
  const [selecionados, setSelecionados] = useState<PlayerId[]>([]);
  const liderNome = mapaNomes.get(estado.liderId) ?? 'alguém';
  const podePropor = selecionados.length === tamanhoEquipe;

  function alternar(id: PlayerId) {
    void Haptics.selectionAsync();
    setSelecionados((atuais) => {
      if (atuais.includes(id)) return atuais.filter((item) => item !== id);
      if (atuais.length >= tamanhoEquipe) return atuais;
      return [...atuais, id];
    });
  }

  return (
    <SafeAreaView style={estilos.tela}>
      <HeaderJogo
        rotulo={`rodada ${estado.rodada}`}
        titulo={liderNome}
        subtitulo={`escolha ${tamanhoEquipe} para a missão`}
      />

      <FlatList
        data={estado.jogadoresOrdem}
        keyExtractor={(id) => id}
        contentContainerStyle={estilos.listaConteudo}
        renderItem={({ item: id }) => {
          const ativo = selecionados.includes(id);
          return (
            <Pressable
              onPress={() => alternar(id)}
              style={[estilos.linhaSelecao, ativo && estilos.linhaSelecaoAtiva]}
            >
              <Text
                style={[estilos.nomeLista, ativo && estilos.nomeListaAtivo]}
              >
                {mapaNomes.get(id) ?? id}
              </Text>
              <Text style={estilos.marcador}>{ativo ? 'na equipe' : ''}</Text>
            </Pressable>
          );
        }}
      />

      <RodapeAcao
        titulo="propor equipe"
        disabled={!podePropor}
        detalhe={`${selecionados.length} de ${tamanhoEquipe}`}
        onPress={() => engine.proporEquipe(selecionados)}
      />
    </SafeAreaView>
  );
}

function TelaDebate({
  engine,
  estado,
  mapaNomes,
}: {
  engine: AliancaLocalEngine;
  estado: EstadoAliancaPublico;
  mapaNomes: Map<PlayerId, string>;
}) {
  return (
    <SafeAreaView style={estilos.tela}>
      <HeaderJogo
        rotulo="equipe proposta"
        titulo={TEXTOS_ALIANCA.debate.titulo}
        subtitulo={TEXTOS_ALIANCA.debate.subtitulo}
      />

      <View style={estilos.equipeBox}>
        {estado.equipeProposta.map((id) => (
          <Text key={id} style={estilos.equipeNome}>
            {mapaNomes.get(id) ?? id}
          </Text>
        ))}
      </View>

      <RodapeAcao titulo="votar" onPress={() => engine.iniciarVotacao()} />
    </SafeAreaView>
  );
}

function TelaVotacaoEquipe({
  engine,
  mapaNomes,
}: {
  engine: AliancaLocalEngine;
  estado: EstadoAliancaPublico;
  mapaNomes: Map<PlayerId, string>;
}) {
  const jogador = engine.getJogadorVotando();
  if (!jogador) return null;

  function votar(voto: 'aprovar' | 'rejeitar') {
    if (!jogador) return;
    void Haptics.selectionAsync();
    engine.registrarVotoEquipe(jogador.id, voto);
  }

  return (
    <SafeAreaView style={estilos.telaEscura}>
      <View style={estilos.centro}>
        <Text style={estilos.nomeVotante}>
          {mapaNomes.get(jogador.id) ?? jogador.nome}
        </Text>
        <Text style={estilos.subtextoEscuro}>aprovar essa equipe?</Text>
      </View>

      <View style={estilos.rodapeDuplo}>
        <TouchableOpacity
          style={estilos.botaoEscuro}
          onPress={() => votar('rejeitar')}
        >
          <Text style={estilos.textoBotaoEscuro}>rejeitar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={estilos.botaoClaro}
          onPress={() => votar('aprovar')}
        >
          <Text style={estilos.textoBotaoClaro}>aprovar</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function TelaResultadoVotacao({
  engine,
  estado,
}: {
  engine: AliancaLocalEngine;
  estado: EstadoAliancaPublico;
}) {
  const resultado = estado.resultadoVotacao;
  const aprovado = resultado?.aprovado ?? false;
  const rejeicaoFinal =
    resultado !== null &&
    !aprovado &&
    estado.rejeicoesSeguidas >= estado.configuracao.maxRejeicoesSeguidas;

  useEffect(() => {
    if (!resultado) return;
    if (aprovado) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return;
    }
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }, [aprovado, resultado]);

  if (!resultado) return null;

  return (
    <SafeAreaView style={estilos.tela}>
      <View style={estilos.centro}>
        <Text style={estilos.nomeGrande}>
          {aprovado
            ? TEXTOS_ALIANCA.resultado.aprovada
            : TEXTOS_ALIANCA.resultado.rejeitada}
        </Text>
        <Text style={estilos.subtexto}>
          {resultado.aprovacoes} aprovaram · {resultado.rejeicoes} rejeitaram
        </Text>
        {!aprovado && (
          <Text style={estilos.alertaRejeicao}>
            {rejeicaoFinal
              ? 'os traidores vencem se vocês confirmarem.'
              : `${estado.rejeicoesSeguidas} de ${estado.configuracao.maxRejeicoesSeguidas}`}
          </Text>
        )}
      </View>

      <RodapeAcao
        titulo={
          aprovado
            ? 'ir para missão'
            : rejeicaoFinal
              ? 'ver resultado'
              : 'próximo líder'
        }
        onPress={() => engine.confirmarResultadoVotacao()}
      />
    </SafeAreaView>
  );
}

function TelaMissaoAlianca({
  engine,
  estado,
  mapaNomes,
}: {
  engine: AliancaLocalEngine;
  estado: EstadoAliancaPublico;
  mapaNomes: Map<PlayerId, string>;
}) {
  const [etapa, setEtapa] = useState<'passagem' | 'acao'>('passagem');
  const [registrando, setRegistrando] = useState(false);
  const participante = engine.getParticipanteMissaoNaVez();
  if (!participante || !estado.missao) return null;
  const acoes = engine.getAcoesMissaoDisponiveis(participante.id);
  const podeSabotar = acoes.includes('sabotar');

  function registrarAcao(acao: AcaoMissaoAlianca) {
    if (registrando) return;
    if (!participante) return;
    setRegistrando(true);
    void Haptics.selectionAsync();
    engine.registrarAcaoMissao(participante.id, acao);
  }

  if (etapa === 'passagem') {
    return (
      <SafeAreaView style={estilos.telaEscura}>
        <TouchableOpacity
          style={estilos.areaTouch}
          activeOpacity={1}
          onPress={() => setEtapa('acao')}
        >
          <View style={estilos.centro}>
            <Text style={estilos.nomeVotante}>
              {mapaNomes.get(participante.id) ?? participante.nome}
            </Text>
            <Text style={estilos.subtextoEscuro}>toque para agir</Text>
          </View>
          <Text style={estilos.progressoEscuro}>
            {estado.missao.indiceAtual + 1} de{' '}
            {estado.missao.participantesOrdem.length}
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={estilos.telaEscura}>
      <View style={estilos.centro}>
        <Text
          style={[
            estilos.papelMissao,
            podeSabotar ? estilos.papelTraidor : estilos.papelLeal,
          ]}
        >
          {podeSabotar
            ? TEXTOS_ALIANCA.missao.traidor
            : TEXTOS_ALIANCA.missao.leal}
        </Text>
        <Text style={estilos.subtextoEscuro}>sua escolha fica escondida.</Text>
      </View>

      {podeSabotar ? (
        <View style={estilos.rodapeDuplo}>
          <TouchableOpacity
            style={[estilos.botaoEscuro, registrando && estilos.botaoDisabled]}
            onPress={() => registrarAcao('ajudar')}
            disabled={registrando}
          >
            <Text style={estilos.textoBotaoEscuro}>
              {TEXTOS_ALIANCA.missao.ajudar}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[estilos.botaoPerigo, registrando && estilos.botaoDisabled]}
            onPress={() => registrarAcao('sabotar')}
            disabled={registrando}
          >
            <Text style={estilos.textoBotaoPerigo}>
              {TEXTOS_ALIANCA.missao.sabotar}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={estilos.rodape}>
          <TouchableOpacity
            style={[
              estilos.botaoClaro,
              estilos.botaoCheio,
              registrando && estilos.botaoDisabled,
            ]}
            onPress={() => registrarAcao('ajudar')}
            disabled={registrando}
          >
            <Text style={estilos.textoBotaoClaro}>
              {TEXTOS_ALIANCA.missao.ajudar}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

function TelaResultadoMissao({
  engine,
  estado,
  mapaNomes,
}: {
  engine: AliancaLocalEngine;
  estado: EstadoAliancaPublico;
  mapaNomes: Map<PlayerId, string>;
}) {
  const resultado = estado.resultadoMissao;
  const sabotada = resultado ? !resultado.sucesso : false;

  useEffect(() => {
    if (!resultado) return;
    void Haptics.notificationAsync(
      sabotada
        ? Haptics.NotificationFeedbackType.Warning
        : Haptics.NotificationFeedbackType.Success,
    );
  }, [resultado, sabotada]);

  if (!resultado) return null;

  return (
    <SafeAreaView style={estilos.tela}>
      <View style={estilos.centro}>
        <Text
          style={[
            estilos.nomeGrande,
            sabotada ? estilos.resultadoTraidor : estilos.resultadoLeal,
          ]}
        >
          {sabotada
            ? TEXTOS_ALIANCA.resultado.sabotagem
            : TEXTOS_ALIANCA.resultado.sucesso}
        </Text>
        <Text style={estilos.subtexto}>
          {sabotada
            ? `${resultado.sabotagens} sabotagem${
                resultado.sabotagens === 1 ? '' : 's'
              }. ninguém sabe de quem.`
            : 'ninguém sabotou.'}
        </Text>

        <PlacarAlianca estado={estado} />

        <View style={estilos.equipeResumo}>
          {resultado.equipe.map((id) => (
            <Text key={id} style={estilos.nomeEquipeResumo}>
              {mapaNomes.get(id) ?? id}
            </Text>
          ))}
        </View>
      </View>

      <RodapeAcao
        titulo="próxima liderança"
        onPress={() => engine.confirmarResultadoMissao()}
      />
    </SafeAreaView>
  );
}

function TelaFinalAlianca({
  estado,
  mapaNomes,
  onVoltar,
}: {
  estado: EstadoAliancaPublico;
  mapaNomes: Map<PlayerId, string>;
  onVoltar: () => void;
}) {
  const traidoresVenceram = estado.vencedor === 'traidores';
  const papeis = estado.revelacaoFinal?.papeisPorJogador ?? {};
  const venceuPorRejeicao =
    traidoresVenceram &&
    estado.rejeicoesSeguidas >= estado.configuracao.maxRejeicoesSeguidas;
  const historico = estado.revelacaoFinal?.historicoMissoes ?? [];

  useEffect(() => {
    void Haptics.notificationAsync(
      traidoresVenceram
        ? Haptics.NotificationFeedbackType.Warning
        : Haptics.NotificationFeedbackType.Success,
    );
  }, [traidoresVenceram]);

  return (
    <SafeAreaView style={estilos.tela}>
      <View style={estilos.finalHeader}>
        <Text
          style={[
            estilos.nomeGrande,
            traidoresVenceram
              ? estilos.resultadoTraidor
              : estilos.resultadoLeal,
          ]}
        >
          {traidoresVenceram ? 'traidores.' : 'leais.'}
        </Text>
        <Text style={estilos.subtexto}>
          {venceuPorRejeicao
            ? 'vocês recusaram até entregar o jogo.'
            : traidoresVenceram
              ? 'a mesa foi manipulada.'
              : 'a confiança sobreviveu.'}
        </Text>
        <PlacarAlianca estado={estado} />
      </View>

      {historico.length > 0 && (
        <View style={estilos.historico}>
          <Text style={estilos.rotulo}>missões</Text>
          <View style={estilos.historicoLinha}>
            {historico.map((missao) => (
              <View
                key={`${missao.rodada}-${missao.liderId}`}
                style={[
                  estilos.historicoPonto,
                  missao.sucesso
                    ? estilos.historicoPontoLeal
                    : estilos.historicoPontoTraidor,
                ]}
              >
                <Text style={estilos.historicoTexto}>{missao.rodada}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <FlatList
        data={estado.jogadoresOrdem}
        keyExtractor={(id) => id}
        contentContainerStyle={estilos.listaFinal}
        renderItem={({ item: id }) => {
          const papel = papeis[id];
          const traidor = papel === 'traidor';
          return (
            <View style={estilos.linhaFinal}>
              <Text style={estilos.nomeFinal}>{mapaNomes.get(id) ?? id}</Text>
              <Text
                style={[
                  estilos.papelFinal,
                  traidor ? estilos.papelTraidor : estilos.papelLeal,
                ]}
              >
                {papel ?? 'leal'}
              </Text>
            </View>
          );
        }}
      />

      <RodapeAcao titulo="voltar ao início" onPress={onVoltar} />
    </SafeAreaView>
  );
}

function PlacarAlianca({ estado }: { estado: EstadoAliancaPublico }) {
  return (
    <View style={estilos.placar}>
      <View style={estilos.placarItem}>
        <Text style={[estilos.placarValor, estilos.resultadoLeal]}>
          {estado.sucessosLeais}
        </Text>
        <Text style={estilos.placarLabel}>leais</Text>
      </View>
      <View style={estilos.placarDivisor} />
      <View style={estilos.placarItem}>
        <Text style={[estilos.placarValor, estilos.resultadoTraidor]}>
          {estado.sabotagensTraidores}
        </Text>
        <Text style={estilos.placarLabel}>traidores</Text>
      </View>
    </View>
  );
}

function HeaderJogo({
  rotulo,
  titulo,
  subtitulo,
}: {
  rotulo: string;
  titulo: string;
  subtitulo: string;
}) {
  return (
    <View style={estilos.header}>
      <Text style={estilos.rotulo}>{rotulo}</Text>
      <Text style={estilos.titulo}>{titulo}</Text>
      <Text style={estilos.subtexto}>{subtitulo}</Text>
    </View>
  );
}

function RodapeAcao({
  titulo,
  detalhe,
  disabled,
  onPress,
}: {
  titulo: string;
  detalhe?: string;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <View style={estilos.rodape}>
      {detalhe ? <Text style={estilos.detalheRodape}>{detalhe}</Text> : null}
      <TouchableOpacity
        style={[estilos.botaoPrimario, disabled && estilos.botaoDisabled]}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.82}
      >
        <Text style={estilos.textoBotaoPrimario}>{titulo}</Text>
      </TouchableOpacity>
    </View>
  );
}

const estilos = StyleSheet.create({
  aliados: {
    alignItems: 'center',
  },
  alertaRejeicao: {
    color: cores.primaria,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpoMenor,
    fontWeight: tipografia.pesoBold,
    marginTop: espacamento.lg,
  },
  areaTouch: {
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: espacamento.xl,
  },
  botaoClaro: {
    alignItems: 'center',
    backgroundColor: cores.textoSobreEscuro,
    borderRadius: raio.md,
    flex: 1,
    height: 56,
    justifyContent: 'center',
  },
  botaoCheio: {
    flex: 0,
  },
  botaoDisabled: {
    opacity: 0.35,
  },
  botaoEscuro: {
    alignItems: 'center',
    backgroundColor: COR_BOTAO_ESCURO,
    borderColor: COR_BOTAO_ESCURO_BORDA,
    borderRadius: raio.md,
    borderWidth: 1,
    flex: 1,
    height: 56,
    justifyContent: 'center',
  },
  botaoPrimario: {
    alignItems: 'center',
    backgroundColor: cores.texto,
    borderRadius: raio.md,
    height: 56,
    justifyContent: 'center',
  },
  botaoPerigo: {
    alignItems: 'center',
    backgroundColor: COR_TRAIDOR,
    borderRadius: raio.md,
    flex: 1,
    height: 56,
    justifyContent: 'center',
  },
  centro: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: espacamento.xl,
  },
  detalheRodape: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: 12,
    marginBottom: espacamento.sm,
    textAlign: 'center',
  },
  equipeBox: {
    gap: espacamento.sm,
    paddingHorizontal: espacamento.lg,
  },
  equipeNome: {
    backgroundColor: cores.superficie,
    borderColor: cores.borda,
    borderRadius: raio.md,
    borderWidth: 1,
    color: cores.texto,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoSubtitulo,
    fontWeight: tipografia.pesoBold,
    padding: espacamento.md,
  },
  equipeResumo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: espacamento.sm,
    justifyContent: 'center',
    marginTop: espacamento.xl,
    paddingHorizontal: espacamento.md,
  },
  finalHeader: {
    alignItems: 'center',
    paddingHorizontal: espacamento.xl,
    paddingTop: espacamento.xxl,
  },
  header: {
    paddingHorizontal: espacamento.lg,
    paddingTop: espacamento.xxl,
    paddingBottom: espacamento.lg,
  },
  historico: {
    paddingHorizontal: espacamento.lg,
    paddingTop: espacamento.lg,
  },
  historicoLinha: {
    flexDirection: 'row',
    gap: espacamento.sm,
    marginTop: espacamento.sm,
  },
  historicoPonto: {
    alignItems: 'center',
    borderRadius: 16,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  historicoPontoLeal: {
    backgroundColor: COR_LEAL,
  },
  historicoPontoTraidor: {
    backgroundColor: COR_TRAIDOR,
  },
  historicoTexto: {
    color: cores.textoSobreEscuro,
    fontFamily: familias.sans,
    fontSize: 12,
    fontWeight: tipografia.pesoBold,
  },
  labelAliados: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: 12,
    marginBottom: espacamento.sm,
  },
  linhaSelecao: {
    alignItems: 'center',
    borderBottomColor: cores.borda,
    borderBottomWidth: 1,
    flexDirection: 'row',
    height: 58,
    justifyContent: 'space-between',
    paddingHorizontal: espacamento.lg,
  },
  linhaSelecaoAtiva: {
    backgroundColor: COR_POLITICA,
  },
  listaConteudo: {
    paddingBottom: espacamento.lg,
  },
  listaFinal: {
    gap: espacamento.sm,
    paddingBottom: espacamento.lg,
    paddingHorizontal: espacamento.lg,
    paddingTop: espacamento.lg,
  },
  linhaFinal: {
    alignItems: 'center',
    backgroundColor: cores.superficie,
    borderColor: cores.borda,
    borderRadius: raio.md,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 54,
    paddingHorizontal: espacamento.md,
  },
  marcador: {
    color: cores.primaria,
    fontFamily: familias.sans,
    fontSize: 12,
    fontWeight: tipografia.pesoBold,
  },
  nomeAliado: {
    color: COR_TRAIDOR,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpoMaior,
    fontWeight: tipografia.pesoBold,
    marginBottom: espacamento.xs,
  },
  nomeEquipeResumo: {
    backgroundColor: COR_POLITICA,
    borderRadius: raio.pill,
    color: cores.texto,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpoMenor,
    fontWeight: tipografia.pesoBold,
    paddingHorizontal: espacamento.md,
    paddingVertical: espacamento.xs,
  },
  nomeFinal: {
    color: cores.texto,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpoMaior,
    fontWeight: tipografia.pesoBold,
  },
  nomeGrande: {
    color: cores.texto,
    fontFamily: familias.serifDisplay,
    fontSize: tipografia.tamanhoDisplay,
    letterSpacing: tipografia.spacingHero,
    textAlign: 'center',
  },
  nomeLista: {
    color: cores.texto,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpoMaior,
    fontWeight: '500',
  },
  nomeListaAtivo: {
    fontWeight: tipografia.pesoBold,
  },
  nomeVotante: {
    color: cores.textoSobreEscuro,
    fontFamily: familias.serifDisplay,
    fontSize: tipografia.tamanhoDisplay,
    letterSpacing: tipografia.spacingHero,
    textAlign: 'center',
  },
  papel: {
    fontFamily: familias.serifDisplay,
    fontSize: tipografia.tamanhoDisplay,
    letterSpacing: tipografia.spacingHero,
  },
  papelFinal: {
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpoMenor,
    fontWeight: tipografia.pesoBold,
  },
  papelLeal: {
    color: COR_LEAL,
  },
  papelMissao: {
    fontFamily: familias.serifDisplay,
    fontSize: tipografia.tamanhoTituloGrande,
    letterSpacing: tipografia.spacingTitulo,
    textAlign: 'center',
  },
  papelTraidor: {
    color: COR_TRAIDOR,
  },
  placar: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: espacamento.md,
    justifyContent: 'center',
    marginTop: espacamento.xl,
  },
  placarDivisor: {
    backgroundColor: cores.borda,
    height: 28,
    width: 1,
  },
  placarItem: {
    alignItems: 'center',
    minWidth: 72,
  },
  placarLabel: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: 12,
    marginTop: espacamento.xs,
  },
  placarValor: {
    fontFamily: familias.serifDisplay,
    fontSize: tipografia.tamanhoTituloGrande,
    letterSpacing: tipografia.spacingTitulo,
  },
  progresso: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: 12,
    opacity: 0.6,
    textAlign: 'center',
  },
  progressoEscuro: {
    color: cores.textoSobreEscuro,
    fontFamily: familias.sans,
    fontSize: 12,
    opacity: 0.45,
    textAlign: 'center',
  },
  resultadoLeal: {
    color: COR_LEAL,
  },
  resultadoTraidor: {
    color: COR_TRAIDOR,
  },
  rodape: {
    paddingHorizontal: espacamento.lg,
    paddingBottom: espacamento.xl,
    paddingTop: espacamento.md,
  },
  rodapeDuplo: {
    flexDirection: 'row',
    gap: espacamento.sm,
    paddingBottom: espacamento.xl,
    paddingHorizontal: espacamento.lg,
  },
  rotulo: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: 12,
    marginBottom: espacamento.sm,
  },
  separador: {
    backgroundColor: cores.borda,
    height: 1,
    marginBottom: espacamento.md,
    marginTop: espacamento.xl,
    width: 32,
  },
  subtexto: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpoMenor,
    lineHeight: 20,
    marginTop: espacamento.sm,
    textAlign: 'center',
  },
  subtextoEscuro: {
    color: COR_TEXTO_ESCURO_MUDO,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpoMenor,
    marginTop: espacamento.sm,
  },
  tela: {
    backgroundColor: cores.fundo,
    flex: 1,
  },
  telaEscura: {
    backgroundColor: COR_NOITE,
    flex: 1,
  },
  textoBotaoClaro: {
    color: COR_NOITE,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpoMaior,
    fontWeight: tipografia.pesoBold,
  },
  textoBotaoEscuro: {
    color: cores.textoSobreEscuro,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpoMaior,
    fontWeight: tipografia.pesoBold,
  },
  textoBotaoPerigo: {
    color: cores.textoSobreEscuro,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpoMaior,
    fontWeight: tipografia.pesoBold,
  },
  textoBotaoPrimario: {
    color: cores.fundo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpoMaior,
    fontWeight: tipografia.pesoBold,
  },
  titulo: {
    color: cores.texto,
    fontFamily: familias.serifDisplay,
    fontSize: tipografia.tamanhoTituloGrande,
    letterSpacing: tipografia.spacingTitulo,
  },
});
