import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { useState, useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CadastroJogadores, SecaoConfig, SegmentControl } from '@/components';
import type { ConfiguracaoNMP, ModoNMP, NomeDeck, Jogador } from '@/games/na-mesma-pagina/types';
import type { RootStackParamList } from '@/navigation/types';
import { salvarGrupoRecente } from '@/services/grupoRecente';
import { assegurarSessaoIniciada } from '@/session/sessionStore';
import { cores, espacamento, familias, raio, tipografia } from '@/theme/colors';

type Props = NativeStackScreenProps<
  RootStackParamList,
  'ConfiguracaoLocalNaMesmaPagina'
>;

const COR_NMP = '#6366F1';

const MIN_JOGADORES = 4;
const MAX_JOGADORES = 12;

const MODOS: { valor: ModoNMP; rotulo: string; descricao: string }[] = [
  { valor: 'classico', rotulo: 'Clássico', descricao: 'grade 5×5, perigosa encerra o jogo.' },
  { valor: 'rapido',   rotulo: 'Rápido',   descricao: 'grade 4×4, partida em 5–8 min.' },
  { valor: 'festa',    rotulo: 'Festa',    descricao: 'pontuação, perigosa é penalidade.' },
  { valor: 'dificil',  rotulo: 'Difícil',  descricao: 'palavras abstratas, mais neutras.' },
];

const DECKS: { valor: NomeDeck; rotulo: string; descricao: string; disponivel: boolean }[] = [
  { valor: 'cotidiano',   rotulo: 'Cotidiano',    descricao: 'palavras comuns, muitas associações.',  disponivel: true },
  { valor: 'brasil',      rotulo: 'Brasil',        descricao: 'cultura, cidades e expressões BR.',    disponivel: true },
  { valor: 'cultura_pop', rotulo: 'Cultura Pop',   descricao: 'filmes, séries, músicas e memes.',     disponivel: true },
  { valor: 'internet',    rotulo: 'Internet',      descricao: 'gírias, apps e dinâmicas online.',     disponivel: true },
  { valor: 'futebol',     rotulo: 'Futebol',       descricao: 'times, jogadores e expressões.',       disponivel: true },
  { valor: 'sentimentos', rotulo: 'Sentimentos',   descricao: 'emoções e estados de espírito.',       disponivel: true },
  { valor: 'surpresa',    rotulo: 'Surpresa',      descricao: 'mix de todos os decks.',               disponivel: true },
];

export function TelaConfiguracaoLocalNaMesmaPagina({ navigation }: Props) {
  const [nomes, setNomes] = useState<string[]>([]);
  const [modo, setModo] = useState<ModoNMP>('classico');
  const [deck, setDeck] = useState<NomeDeck>('cotidiano');
  const [mestreAIdx, setMestreAIdx] = useState(0);
  const [mestreBIdx, setMestreBIdx] = useState(0);

  const numJogadores = nomes.length;
  const parImpar = numJogadores % 2 === 0;
  const podeIniciar = numJogadores >= MIN_JOGADORES && parImpar;

  // Divide os jogadores em dois times: primeiros N/2 no A, restantes no B
  const { timeA, timeB } = useMemo(() => {
    const metade = Math.floor(numJogadores / 2);
    return {
      timeA: nomes.slice(0, metade).map((nome, i) => ({ id: `local-${i}`, nome })),
      timeB: nomes.slice(metade).map((nome, i) => ({
        id: `local-${Math.floor(numJogadores / 2) + i}`,
        nome,
      })),
    };
  }, [nomes, numJogadores]);

  // Garante que os índices de mestre sejam válidos
  const mestreAValido = Math.min(mestreAIdx, Math.max(0, timeA.length - 1));
  const mestreBValido = Math.min(mestreBIdx, Math.max(0, timeB.length - 1));

  const avisoRodape =
    numJogadores < MIN_JOGADORES
      ? `mínimo ${MIN_JOGADORES} jogadores`
      : !parImpar
        ? 'número par de jogadores para dividir os times'
        : undefined;

  function trocarTimeJogador(nomeJogador: string) {
    // Move um jogador da metade A para B ou vice-versa
    void Haptics.selectionAsync();
    const idx = nomes.indexOf(nomeJogador);
    if (idx < 0) return;
    const metade = Math.floor(numJogadores / 2);
    // Troca com o espelho no outro time
    const parceiro = idx < metade ? idx + metade : idx - metade;
    const novosNomes = [...nomes];
    [novosNomes[idx], novosNomes[parceiro]] = [novosNomes[parceiro], novosNomes[idx]];
    setNomes(novosNomes);
  }

  function aoComecar() {
    if (!podeIniciar) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    void salvarGrupoRecente(nomes);

    const todosJogadores: Jogador[] = nomes.map((nome, i) => ({
      id: `local-${i}`,
      nome,
    }));
    assegurarSessaoIniciada(todosJogadores, 'na-mesma-pagina');

    const mestreA = timeA[mestreAValido];
    const mestreB = timeB[mestreBValido];

    const config: ConfiguracaoNMP = {
      modo,
      jogadoresTimeA: timeA,
      jogadoresTimeB: timeB,
      mestreTimeA: mestreA?.id ?? timeA[0]?.id ?? '',
      mestreTimeB: mestreB?.id ?? timeB[0]?.id ?? '',
      deck,
    };

    navigation.replace('JogoLocalNaMesmaPagina', config);
  }

  const opcoesMestreA = timeA.map((j, i) => ({ valor: i, rotulo: j.nome }));
  const opcoesMestreB = timeB.map((j, i) => ({ valor: i, rotulo: j.nome }));

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
          <Text style={estilos.titulo}>na mesma página</Text>
          <Text style={estilos.subtitulo}>uma pista. duas mentes. uma vitória.</Text>
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
          subtitulo={
            podeIniciar
              ? `${timeA.length} vs ${timeB.length}`
              : `${numJogadores} de ${MAX_JOGADORES}`
          }
        >
          <CadastroJogadores
            nomes={nomes}
            onNomesChange={setNomes}
            minJogadores={MIN_JOGADORES}
            maxJogadores={MAX_JOGADORES}
          />
          {numJogadores >= 4 && !parImpar && (
            <Text style={estilos.aviso}>
              adicione mais um para fechar os times.
            </Text>
          )}

          {/* Preview dos times */}
          {podeIniciar && (
            <View style={estilos.timesContainer}>
              <TimePreview
                letra="A"
                jogadores={timeA}
                mestreIdx={mestreAValido}
                cor={COR_NMP}
                onTrocar={trocarTimeJogador}
              />
              <View style={estilos.vsContainer}>
                <Text style={estilos.vs}>vs</Text>
              </View>
              <TimePreview
                letra="B"
                jogadores={timeB}
                mestreIdx={mestreBValido}
                cor={cores.erro}
                onTrocar={trocarTimeJogador}
              />
            </View>
          )}
        </SecaoConfig>

        {/* Seção: Mestres */}
        {podeIniciar && (
          <>
            {timeA.length > 1 && (
              <SecaoConfig
                titulo="mestre do time a"
                subtitulo="vê o mapa e dá as pistas"
              >
                <SegmentControl
                  opcoes={opcoesMestreA}
                  valor={mestreAValido}
                  onChange={setMestreAIdx}
                />
              </SecaoConfig>
            )}

            {timeB.length > 1 && (
              <SecaoConfig
                titulo="mestre do time b"
                subtitulo="vê o mapa e dá as pistas"
              >
                <SegmentControl
                  opcoes={opcoesMestreB}
                  valor={mestreBValido}
                  onChange={setMestreBIdx}
                />
              </SecaoConfig>
            )}
          </>
        )}

        {/* Seção: Modo de jogo */}
        <SecaoConfig titulo="modo de jogo">
          <View style={estilos.modoGrid}>
            {MODOS.map((m) => (
              <TouchableOpacity
                key={m.valor}
                style={[
                  estilos.modoCard,
                  modo === m.valor && estilos.modoCardAtivo,
                ]}
                onPress={() => {
                  void Haptics.selectionAsync();
                  setModo(m.valor);
                }}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    estilos.modoNome,
                    modo === m.valor && estilos.modoNomeAtivo,
                  ]}
                >
                  {m.rotulo}
                </Text>
                <Text style={estilos.modoDescricao}>{m.descricao}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </SecaoConfig>

        {/* Seção: Deck */}
        <SecaoConfig titulo="deck de palavras">
          <View style={estilos.deckLista}>
            {DECKS.map((d) => (
              <TouchableOpacity
                key={d.valor}
                style={[
                  estilos.deckItem,
                  deck === d.valor && d.disponivel && estilos.deckItemAtivo,
                  !d.disponivel && estilos.deckItemBloqueado,
                ]}
                onPress={() => {
                  if (!d.disponivel) return;
                  void Haptics.selectionAsync();
                  setDeck(d.valor);
                }}
                activeOpacity={d.disponivel ? 0.75 : 1}
              >
                <View style={estilos.deckTextos}>
                  <Text
                    style={[
                      estilos.deckNome,
                      !d.disponivel && estilos.deckNomeBloqueado,
                    ]}
                  >
                    {d.rotulo}
                  </Text>
                  <Text style={estilos.deckDescricao}>{d.descricao}</Text>
                </View>
                {!d.disponivel && (
                  <Text style={estilos.cadeado}>🔒</Text>
                )}
                {d.disponivel && deck === d.valor && (
                  <View style={[estilos.checkmark, { backgroundColor: COR_NMP }]}>
                    <Text style={estilos.checkmarkTexto}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </SecaoConfig>

        <View style={estilos.espacoFinal} />
      </ScrollView>

      {/* Rodapé com botão começar */}
      <View style={estilos.rodape}>
        {avisoRodape && (
          <Text style={estilos.rodapeAviso}>{avisoRodape}</Text>
        )}
        <TouchableOpacity
          style={[
            estilos.botaoComecar,
            { backgroundColor: podeIniciar ? COR_NMP : cores.borda },
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
            começar
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── Subcomponente: Preview de time ──────────────────────────────────────────

interface TimePreviewProps {
  letra: 'A' | 'B';
  jogadores: Jogador[];
  mestreIdx: number;
  cor: string;
  onTrocar: (nome: string) => void;
}

function TimePreview({ letra, jogadores, mestreIdx, cor, onTrocar }: TimePreviewProps) {
  return (
    <View style={estilos.timePreview}>
      <View style={[estilos.timeTitulo, { borderColor: cor }]}>
        <Text style={[estilos.timeLabelLetra, { color: cor }]}>Time {letra}</Text>
      </View>
      <View style={estilos.timeJogadores}>
        {jogadores.map((j, i) => (
          <TouchableOpacity
            key={j.id}
            style={estilos.jogadorChipWrapper}
            onPress={() => onTrocar(j.nome)}
            activeOpacity={0.75}
          >
            <View
              style={[
                estilos.jogadorChip,
                i === mestreIdx && { backgroundColor: cor + '22', borderColor: cor },
              ]}
            >
              <Text
                style={[
                  estilos.jogadorChipTexto,
                  i === mestreIdx && { color: cor, fontWeight: '700' },
                ]}
                numberOfLines={1}
              >
                {j.nome}
              </Text>
              {i === mestreIdx && (
                <Text style={[estilos.mestreBadge, { color: cor }]}>★</Text>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const estilos = StyleSheet.create({
  aviso: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    lineHeight: 18,
    marginTop: espacamento.xs,
  },
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
    paddingHorizontal: espacamento.md,
    paddingTop: espacamento.sm,
    paddingBottom: espacamento.sm,
  },
  cabecalhoTextos: {
    flex: 1,
  },
  cadeado: {
    fontSize: 16,
    opacity: 0.4,
  },
  checkmark: {
    alignItems: 'center',
    borderRadius: 10,
    height: 20,
    justifyContent: 'center',
    width: 20,
  },
  checkmarkTexto: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  conteudo: {
    gap: espacamento.md,
    paddingHorizontal: espacamento.md,
  },
  deckDescricao: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    lineHeight: 17,
    marginTop: 2,
  },
  deckItem: {
    alignItems: 'center',
    backgroundColor: cores.fundoSecundario,
    borderColor: cores.borda,
    borderRadius: raio.sm,
    borderWidth: 1,
    flexDirection: 'row',
    gap: espacamento.sm,
    justifyContent: 'space-between',
    paddingHorizontal: espacamento.sm,
    paddingVertical: espacamento.sm,
  },
  deckItemAtivo: {
    borderColor: COR_NMP,
    borderWidth: 2,
  },
  deckItemBloqueado: {
    opacity: 0.5,
  },
  deckLista: {
    gap: espacamento.xs,
  },
  deckNome: {
    color: cores.texto,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpo,
    fontWeight: '600',
  },
  deckNomeBloqueado: {
    color: cores.textoMudo,
  },
  deckTextos: {
    flex: 1,
  },
  espacoFinal: {
    height: espacamento.lg,
  },
  jogadorChip: {
    alignItems: 'center',
    backgroundColor: cores.fundoSecundario,
    borderColor: cores.borda,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: espacamento.sm,
    paddingVertical: 5,
  },
  jogadorChipTexto: {
    color: cores.textoSecundario,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    fontWeight: '500',
    maxWidth: 80,
  },
  jogadorChipWrapper: {},
  mestreBadge: {
    fontSize: 10,
  },
  modoCard: {
    backgroundColor: cores.fundoSecundario,
    borderColor: cores.borda,
    borderRadius: raio.sm,
    borderWidth: 1,
    flex: 1,
    minWidth: '45%',
    padding: espacamento.sm,
  },
  modoCardAtivo: {
    borderColor: COR_NMP,
    borderWidth: 2,
  },
  modoDescricao: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    lineHeight: 17,
    marginTop: 4,
  },
  modoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: espacamento.xs,
  },
  modoNome: {
    color: cores.texto,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpo,
    fontWeight: '600',
  },
  modoNomeAtivo: {
    color: COR_NMP,
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
  timeLabelLetra: {
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  timeTitulo: {
    borderBottomWidth: 1,
    paddingBottom: 4,
  },
  timeJogadores: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingTop: 6,
  },
  timePreview: {
    flex: 1,
    gap: 4,
  },
  timesContainer: {
    flexDirection: 'row',
    gap: espacamento.xs,
    marginTop: espacamento.sm,
  },
  titulo: {
    color: cores.texto,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoTitulo,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  vsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    paddingTop: 20,
  },
  vs: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    fontWeight: '600',
  },
});
