import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CadastroJogadores, SecaoConfig, SegmentControl } from '@/components';
import type { ConfiguracaoOR, ModoOR } from '@/games/operacao-resgate/types';
import { TOTAL_RODADAS_POR_MODO } from '@/games/operacao-resgate/papeis';
import type { RootStackParamList } from '@/navigation/types';
import { salvarGrupoRecente } from '@/services/grupoRecente';
import { assegurarSessaoIniciada } from '@/session/sessionStore';
import { cores, espacamento, familias, raio, tipografia } from '@/theme/colors';

type Props = NativeStackScreenProps<
  RootStackParamList,
  'ConfiguracaoLocalOperacaoResgate'
>;

const COR_OR = '#F97316';

const MIN_JOGADORES = 4;
const MAX_JOGADORES = 12;

const MODOS: {
  valor: ModoOR;
  rotulo: string;
  rodadas: number;
  duracao: string;
  descricao: string;
}[] = [
  {
    valor: 'rapido',
    rotulo: 'Rápido',
    rodadas: TOTAL_RODADAS_POR_MODO.rapido,
    duracao: '~15 min',
    descricao: 'ideal para grupos novos ou aquecimento.',
  },
  {
    valor: 'padrao',
    rotulo: 'Padrão',
    rodadas: TOTAL_RODADAS_POR_MODO.padrao,
    duracao: '~25 min',
    descricao: 'equilíbrio entre tensão e estratégia.',
  },
  {
    valor: 'avancado',
    rotulo: 'Avançado',
    rodadas: TOTAL_RODADAS_POR_MODO.avancado,
    duracao: '~35 min',
    descricao: 'duplo agente e eventos especiais.',
  },
];

const OPCOES_DURACAO: { valor: 90 | 120 | 180 | 240; rotulo: string }[] = [
  { valor: 90,  rotulo: '1:30' },
  { valor: 120, rotulo: '2 min' },
  { valor: 180, rotulo: '3 min' },
  { valor: 240, rotulo: '4 min' },
];

export function TelaConfiguracaoLocalOperacaoResgate({ navigation }: Props) {
  const [nomes, setNomes] = useState<string[]>([]);
  const [modo, setModo] = useState<ModoOR>('padrao');
  const [timerAtivo, setTimerAtivo] = useState(false);
  const [duracao, setDuracao] = useState<90 | 120 | 180 | 240>(120);
  const [comEventos, setComEventos] = useState(false);

  const numJogadores = nomes.length;
  const podeIniciar = numJogadores >= MIN_JOGADORES;

  const avisoRodape =
    numJogadores < MIN_JOGADORES
      ? `mínimo ${MIN_JOGADORES} jogadores`
      : undefined;

  function aoAlterarModo(novoModo: ModoOR) {
    void Haptics.selectionAsync();
    setModo(novoModo);
    // Reset eventos se sair do modo avançado
    if (novoModo !== 'avancado') {
      setComEventos(false);
    }
  }

  function aoAlterarTimer(valor: boolean) {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTimerAtivo(valor);
  }

  function aoAlterarEventos(valor: boolean) {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setComEventos(valor);
  }

  function aoComecar() {
    if (!podeIniciar) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    void salvarGrupoRecente(nomes);

    const jogadores = nomes.map((nome, i) => ({ id: `local-${i}`, nome }));
    assegurarSessaoIniciada(jogadores, 'operacao-resgate');

    const config: ConfiguracaoOR = {
      modo,
      jogadores,
      timerDiscussao: timerAtivo,
      duracaoDiscussaoSegundos: duracao,
      comEventos: modo === 'avancado' ? comEventos : false,
    };

    navigation.replace('JogoLocalOperacaoResgate', config);
  }

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
        <View style={estilos.cabecalhoTextos}>
          <Text style={estilos.titulo}>operação resgate</Text>
          <Text style={estilos.subtitulo}>negociação, blefe e identidades ocultas.</Text>
        </View>
      </View>

      <ScrollView
        style={estilos.scroll}
        contentContainerStyle={estilos.conteudo}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Seção: Jogadores */}
        <SecaoConfig
          titulo="quem tá jogando?"
          subtitulo={`${numJogadores} de ${MAX_JOGADORES}`}
        >
          <CadastroJogadores
            nomes={nomes}
            onNomesChange={setNomes}
            minJogadores={MIN_JOGADORES}
            maxJogadores={MAX_JOGADORES}
          />
        </SecaoConfig>

        {/* Seção: Modo de jogo */}
        <SecaoConfig titulo="modo de jogo">
          <View style={estilos.modoLista}>
            {MODOS.map((m) => (
              <TouchableOpacity
                key={m.valor}
                style={[
                  estilos.modoCard,
                  modo === m.valor && estilos.modoCardAtivo,
                ]}
                onPress={() => aoAlterarModo(m.valor)}
                activeOpacity={0.75}
              >
                <View style={estilos.modoCabecalho}>
                  <Text
                    style={[
                      estilos.modoNome,
                      modo === m.valor && estilos.modoNomeAtivo,
                    ]}
                  >
                    {m.rotulo}
                  </Text>
                  <View style={estilos.modoBadgesRow}>
                    <View style={estilos.modoBadge}>
                      <Text style={estilos.modoBadgeTexto}>{m.rodadas} rodadas</Text>
                    </View>
                    <View style={estilos.modoBadge}>
                      <Text style={estilos.modoBadgeTexto}>{m.duracao}</Text>
                    </View>
                  </View>
                </View>
                <Text style={estilos.modoDescricao}>{m.descricao}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </SecaoConfig>

        {/* Seção: Timer de discussão */}
        <SecaoConfig
          titulo="timer de discussão"
          subtitulo="cronômetro visível durante cada rodada"
        >
          <View style={estilos.toggleRow}>
            <Text style={estilos.toggleLabel}>
              {timerAtivo ? 'ativado' : 'desativado'}
            </Text>
            <Switch
              value={timerAtivo}
              onValueChange={aoAlterarTimer}
              trackColor={{ false: cores.borda, true: COR_OR + '66' }}
              thumbColor={timerAtivo ? COR_OR : cores.textoMudo}
            />
          </View>

          {timerAtivo && (
            <View style={estilos.duracaoContainer}>
              <Text style={estilos.duracaoLabel}>duração por rodada</Text>
              <SegmentControl
                opcoes={OPCOES_DURACAO}
                valor={duracao}
                onChange={setDuracao}
              />
            </View>
          )}
        </SecaoConfig>

        {/* Seção: Eventos especiais (somente modo avançado) */}
        {modo === 'avancado' && (
          <SecaoConfig
            titulo="eventos especiais"
            subtitulo="surpresas entre rodadas que mudam as regras"
          >
            <View style={estilos.toggleRow}>
              <Text style={estilos.toggleLabel}>
                {comEventos ? 'ativado' : 'desativado'}
              </Text>
              <Switch
                value={comEventos}
                onValueChange={aoAlterarEventos}
                trackColor={{ false: cores.borda, true: COR_OR + '66' }}
                thumbColor={comEventos ? COR_OR : cores.textoMudo}
              />
            </View>
          </SecaoConfig>
        )}

        <View style={estilos.espacoFinal} />
      </ScrollView>

      {/* Rodapé */}
      <View style={estilos.rodape}>
        {avisoRodape && (
          <Text style={estilos.rodapeAviso}>{avisoRodape}</Text>
        )}
        <TouchableOpacity
          style={[
            estilos.botaoComecar,
            { backgroundColor: podeIniciar ? COR_OR : cores.borda },
          ]}
          onPress={aoComecar}
          disabled={!podeIniciar}
          activeOpacity={0.85}
        >
          <Text
            style={[
              estilos.botaoComecarTexto,
              { color: podeIniciar ? '#fff' : cores.textoMudo },
            ]}
          >
            começar operação
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const estilos = StyleSheet.create({
  botaoComecar: {
    alignItems: 'center',
    borderRadius: raio.md,
    paddingVertical: 16,
  },
  botaoComecarTexto: {
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpo,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  botaoVoltar: {
    paddingHorizontal: espacamento.xs,
    paddingVertical: espacamento.xs,
  },
  cabecalho: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: espacamento.sm,
    paddingBottom: espacamento.sm,
    paddingHorizontal: espacamento.md,
    paddingTop: espacamento.sm,
  },
  cabecalhoTextos: {
    flex: 1,
  },
  conteudo: {
    gap: espacamento.md,
    paddingHorizontal: espacamento.md,
  },
  duracaoContainer: {
    gap: espacamento.xs,
    marginTop: espacamento.sm,
  },
  duracaoLabel: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
  },
  espacoFinal: {
    height: espacamento.lg,
  },
  modoBadge: {
    backgroundColor: cores.fundoSecundario,
    borderColor: cores.borda,
    borderRadius: 4,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  modoBadgeTexto: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: 10,
    fontWeight: '500',
  },
  modoBadgesRow: {
    flexDirection: 'row',
    gap: 4,
  },
  modoCabecalho: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  modoCard: {
    backgroundColor: cores.fundoSecundario,
    borderColor: cores.borda,
    borderRadius: raio.sm,
    borderWidth: 1,
    padding: espacamento.sm,
  },
  modoCardAtivo: {
    borderColor: COR_OR,
    borderWidth: 2,
  },
  modoDescricao: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    lineHeight: 17,
  },
  modoLista: {
    gap: espacamento.xs,
  },
  modoNome: {
    color: cores.texto,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpo,
    fontWeight: '700',
  },
  modoNomeAtivo: {
    color: COR_OR,
  },
  rodape: {
    gap: espacamento.xs,
    paddingBottom: espacamento.sm,
    paddingHorizontal: espacamento.md,
    paddingTop: espacamento.sm,
  },
  rodapeAviso: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    textAlign: 'center',
  },
  safe: {
    backgroundColor: cores.fundo,
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  setaVoltar: {
    color: cores.primaria,
    fontSize: 22,
    fontWeight: '600',
  },
  subtitulo: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    marginTop: 2,
  },
  titulo: {
    color: cores.texto,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoTitulo,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  toggleLabel: {
    color: cores.textoSecundario,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpo,
  },
  toggleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
