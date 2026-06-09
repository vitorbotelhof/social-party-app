import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { useState, useCallback } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { EstadoNMP, CelulaNMP, MomentoNMP } from '@/games/na-mesma-pagina/types';
import {
  criarEstadoInicial,
  iniciarVisualizacaoMapa,
  fecharMapa,
  darPistaSemVer,
  registrarPista,
  revelarPalavra,
  passarTurno,
  avancarParaProximoTurno,
  mestredoTimeAtivo,
  nomeTimeAtivo,
  podeContinuarAdivinhando,
} from '@/games/na-mesma-pagina/engine';
import type { RootStackParamList } from '@/navigation/types';
import { cores, espacamento, familias, raio, tipografia } from '@/theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'JogoLocalNaMesmaPagina'>;

const COR_TIME_A = '#3B82F6';
const COR_TIME_B = '#EF4444';
const COR_NMP    = '#6366F1';

export function TelaJogoLocalNaMesmaPagina({ route, navigation }: Props) {
  const config = route.params;

  const [estado, setEstado] = useState<EstadoNMP>(() =>
    criarEstadoInicial(config),
  );

  const atualizar = useCallback((novoEstado: EstadoNMP) => {
    setEstado(novoEstado);
  }, []);

  // ── Roteamento de fases ───────────────────────────────────────────────────

  if (estado.fase === 'encerrado') {
    return (
      <SubTelaEncerrado
        estado={estado}
        aoJogarDeNovo={() => atualizar(criarEstadoInicial(config))}
        aoSair={() => navigation.replace('Inicio')}
      />
    );
  }

  if (estado.fase === 'resultado_turno') {
    return (
      <SubTelaResultadoTurno
        estado={estado}
        aoProximo={() => atualizar(avancarParaProximoTurno(estado))}
      />
    );
  }

  if (estado.fase === 'adivinhando') {
    return (
      <SubTelaAdivinhando
        estado={estado}
        aoRevelar={(i) => atualizar(revelarPalavra(estado, i))}
        aoPassarTurno={() => atualizar(passarTurno(estado))}
      />
    );
  }

  if (estado.fase === 'dando_pista') {
    return (
      <SubTelaDarPista
        estado={estado}
        aoConfirmar={(texto, numero) =>
          atualizar(registrarPista(estado, texto, numero))
        }
      />
    );
  }

  if (estado.fase === 'vendo_mapa') {
    return (
      <SubTelaVerMapa
        estado={estado}
        aoFechar={() => atualizar(fecharMapa(estado))}
      />
    );
  }

  // fase: aguardando_pista
  return (
    <SubTelaAguardandoPista
      estado={estado}
      aoVerMapa={() => atualizar(iniciarVisualizacaoMapa(estado))}
      aoDarSemVer={() => atualizar(darPistaSemVer(estado))}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SubTela: Aguardando Pista
// ─────────────────────────────────────────────────────────────────────────────

interface AguardandoPistaProps {
  estado: EstadoNMP;
  aoVerMapa: () => void;
  aoDarSemVer: () => void;
}

function SubTelaAguardandoPista({ estado, aoVerMapa, aoDarSemVer }: AguardandoPistaProps) {
  const nomeTime = nomeTimeAtivo(estado);
  const nomeMestre = mestredoTimeAtivo(estado);
  const corTime = estado.timeAtivo === 'time_a' ? COR_TIME_A : COR_TIME_B;

  return (
    <SafeAreaView style={[estilos.safe, { backgroundColor: cores.fundo }]} edges={['top', 'bottom']}>
      {/* Placar compacto no topo */}
      <PlacardeTopo estado={estado} />

      <View style={estilos.centrado}>
        <View style={[estilos.badgeTime, { backgroundColor: corTime + '20', borderColor: corTime }]}>
          <Text style={[estilos.badgeTimeTexto, { color: corTime }]}>{nomeTime}</Text>
        </View>

        <Text style={estilos.tituloPrincipal}>
          vez de dar pista
        </Text>

        <View style={estilos.mestreDestaque}>
          <Text style={estilos.mestreLabel}>mestre</Text>
          <Text style={[estilos.mestreNome, { color: corTime }]}>{nomeMestre}</Text>
        </View>

        <Text style={estilos.instrucaoMapa}>
          veja o mapa em segredo e dê uma pista para o seu time
        </Text>
      </View>

      <View style={estilos.botoesAcao}>
        <TouchableOpacity
          style={[estilos.botaoPrimario, { backgroundColor: COR_NMP }]}
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            aoVerMapa();
          }}
          activeOpacity={0.85}
        >
          <Text style={estilos.botaoPrimarioTexto}>🗺  ver mapa</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={estilos.botaoSecundario}
          onPress={() => {
            void Haptics.selectionAsync();
            aoDarSemVer();
          }}
          activeOpacity={0.75}
        >
          <Text style={estilos.botaoSecundarioTexto}>dar pista sem ver o mapa</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SubTela: Ver Mapa
// ─────────────────────────────────────────────────────────────────────────────

interface VerMapaProps {
  estado: EstadoNMP;
  aoFechar: () => void;
}

function SubTelaVerMapa({ estado, aoFechar }: VerMapaProps) {
  const nomeMestre = mestredoTimeAtivo(estado);

  return (
    <SafeAreaView style={[estilos.safe, { backgroundColor: '#0F0F14' }]} edges={['top', 'bottom']}>
      <View style={estilos.mapaHeader}>
        <Text style={estilos.mapaInstrucao}>
          apenas <Text style={{ fontWeight: '800', color: '#fff' }}>{nomeMestre}</Text> deve ver esta tela
        </Text>
      </View>

      {/* Grade secreta com todos os tipos revelados */}
      <GradeSecreta estado={estado} />

      <View style={estilos.mapaLegenda}>
        <LegendaItem cor={COR_TIME_A} label="Time A" />
        <LegendaItem cor={COR_TIME_B} label="Time B" />
        <LegendaItem cor={cores.textoMudo} label="Neutra" />
        <LegendaItem cor="#111' borderColor='#fff" label="⚠ Perigosa" />
      </View>

      <View style={estilos.botoesAcao}>
        <TouchableOpacity
          style={[estilos.botaoPrimario, { backgroundColor: COR_NMP }]}
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            aoFechar();
          }}
          activeOpacity={0.85}
        >
          <Text style={estilos.botaoPrimarioTexto}>pronto, vou dar a pista</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SubTela: Dar Pista
// ─────────────────────────────────────────────────────────────────────────────

interface DarPistaProps {
  estado: EstadoNMP;
  aoConfirmar: (texto: string, numero: number) => void;
}

function SubTelaDarPista({ estado, aoConfirmar }: DarPistaProps) {
  const [textoPista, setTextoPista] = useState('');
  const [numeroPista, setNumeroPista] = useState<number>(1);

  const podeConfirmar = textoPista.trim().length >= 1;
  const nomeMestre = mestredoTimeAtivo(estado);
  const corTime = estado.timeAtivo === 'time_a' ? COR_TIME_A : COR_TIME_B;

  const NUMEROS = [1, 2, 3, 4, 0]; // 0 = ilimitado

  function confirmar() {
    if (!podeConfirmar) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    aoConfirmar(textoPista.trim(), numeroPista);
  }

  return (
    <SafeAreaView style={[estilos.safe, { backgroundColor: cores.fundo }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <PlacardeTopo estado={estado} />

        <View style={estilos.formPista}>
          <View style={[estilos.badgeTime, { backgroundColor: corTime + '20', borderColor: corTime }]}>
            <Text style={[estilos.badgeTimeTexto, { color: corTime }]}>{nomeMestre}</Text>
          </View>

          <Text style={estilos.tituloPrincipal}>qual é a sua pista?</Text>

          <TextInput
            style={estilos.inputPista}
            value={textoPista}
            onChangeText={setTextoPista}
            placeholder="uma única palavra..."
            placeholderTextColor={cores.textoMudo}
            autoFocus
            autoCapitalize="words"
            returnKeyType="done"
            onSubmitEditing={confirmar}
            maxLength={32}
          />

          <Text style={estilos.labelNumero}>quantas palavras cobre?</Text>
          <View style={estilos.numerosContainer}>
            {NUMEROS.map((n) => (
              <TouchableOpacity
                key={n}
                style={[
                  estilos.numeroChip,
                  numeroPista === n && { backgroundColor: COR_NMP, borderColor: COR_NMP },
                ]}
                onPress={() => {
                  void Haptics.selectionAsync();
                  setNumeroPista(n);
                }}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    estilos.numeroChipTexto,
                    numeroPista === n && { color: '#fff', fontWeight: '700' },
                  ]}
                >
                  {n === 0 ? '∞' : String(n)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {numeroPista >= 3 && (
            <Text style={estilos.ousadiaAviso}>
              ousado! pista grande tem risco maior.
            </Text>
          )}
        </View>

        <View style={estilos.botoesAcao}>
          <TouchableOpacity
            style={[
              estilos.botaoPrimario,
              { backgroundColor: podeConfirmar ? COR_NMP : cores.borda },
            ]}
            onPress={confirmar}
            disabled={!podeConfirmar}
            activeOpacity={0.85}
          >
            <Text
              style={[
                estilos.botaoPrimarioTexto,
                { color: podeConfirmar ? '#fff' : cores.textoMudo },
              ]}
            >
              dar pista
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SubTela: Adivinhando
// ─────────────────────────────────────────────────────────────────────────────

interface AdivinhandoProps {
  estado: EstadoNMP;
  aoRevelar: (indice: number) => void;
  aoPassarTurno: () => void;
}

function SubTelaAdivinhando({ estado, aoRevelar, aoPassarTurno }: AdivinhandoProps) {
  const pista = estado.pistaAtual!;
  const nomeTime = nomeTimeAtivo(estado);
  const corTime = estado.timeAtivo === 'time_a' ? COR_TIME_A : COR_TIME_B;
  const podeContinuar = podeContinuarAdivinhando(estado);

  const tentativas = pista.tentativasFeitas;
  const limite = pista.numero === 0 ? null : pista.numero + 1; // +1 chute livre

  return (
    <SafeAreaView style={[estilos.safe, { backgroundColor: cores.fundo }]} edges={['top', 'bottom']}>
      {/* Placar no topo */}
      <PlacardeTopo estado={estado} />

      {/* Pista em destaque */}
      <View style={[estilos.pistaDestaque, { borderColor: corTime }]}>
        <Text style={[estilos.pistaTexto, { color: corTime }]}>{pista.texto}</Text>
        <View style={estilos.pistaNumeroContainer}>
          <Text style={estilos.pistaNumero}>
            {pista.numero === 0 ? '∞' : String(pista.numero)}
          </Text>
        </View>
      </View>

      {/* Progresso de tentativas */}
      <View style={estilos.progressoContainer}>
        <Text style={estilos.progressoTexto}>
          {tentativas} de {limite === null ? '∞' : String(limite)}
          {tentativas > 0 && pista.tentativasCorretas === tentativas
            ? '  ✓'
            : ''}
        </Text>
        <Text style={[estilos.progressoTime, { color: corTime }]}>{nomeTime}</Text>
      </View>

      {/* Grade de palavras */}
      <GradeJogo
        estado={estado}
        onTocar={aoRevelar}
        podeTacar={podeContinuar}
      />

      {/* Botão passar */}
      <View style={estilos.botoesAcaoCompacto}>
        <TouchableOpacity
          style={estilos.botaoPassar}
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            aoPassarTurno();
          }}
          activeOpacity={0.75}
        >
          <Text style={estilos.botaoPassarTexto}>passar turno</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SubTela: Resultado de Turno
// ─────────────────────────────────────────────────────────────────────────────

interface ResultadoTurnoProps {
  estado: EstadoNMP;
  aoProximo: () => void;
}

function SubTelaResultadoTurno({ estado, aoProximo }: ResultadoTurnoProps) {
  const ultimo = estado.historicoTurnos[estado.historicoTurnos.length - 1];
  const corTime = ultimo?.timeQueJogou === 'time_a' ? COR_TIME_A : COR_TIME_B;
  const nomeTime = ultimo?.timeQueJogou === 'time_a' ? 'Time A' : 'Time B';
  const proximoTime = estado.timeAtivo === 'time_a' ? 'Time A' : 'Time B';
  const corProximo = estado.timeAtivo === 'time_a' ? COR_TIME_A : COR_TIME_B;

  const motivoTexto: Record<string, string> = {
    passou:      'passou o turno',
    neutro:      'tocou numa palavra neutra',
    adversario:  'tocou em palavra do adversário!',
    perigosa:    '💀 tocou na palavra perigosa!',
    limite:      'atingiu o limite da pista',
    vitoria:     '🏆 acertou tudo!',
  };

  return (
    <SafeAreaView style={[estilos.safe, { backgroundColor: cores.fundo }]} edges={['top', 'bottom']}>
      <PlacardeTopo estado={estado} />

      <View style={estilos.centrado}>
        <View style={[estilos.badgeTime, { backgroundColor: corTime + '20', borderColor: corTime }]}>
          <Text style={[estilos.badgeTimeTexto, { color: corTime }]}>{nomeTime}</Text>
        </View>

        <Text style={estilos.tituloPrincipal}>
          {motivoTexto[ultimo?.motivo ?? 'passou'] ?? 'turno encerrado'}
        </Text>

        {ultimo && (
          <View style={estilos.resumoTurno}>
            <Text style={estilos.resumoPista}>
              pista: <Text style={{ color: corTime, fontWeight: '700' }}>{ultimo.pistaDada.texto}</Text>
              {'  '}{ultimo.pistaDada.numero === 0 ? '∞' : String(ultimo.pistaDada.numero)}
            </Text>
            <Text style={estilos.resumoAcertos}>
              {ultimo.acertos} acerto{ultimo.acertos !== 1 ? 's' : ''}
            </Text>
          </View>
        )}

        <View style={estilos.placarResumo}>
          <PlacarChip label="Time A" restantes={estado.restantesTimeA} cor={COR_TIME_A} />
          <PlacarChip label="Time B" restantes={estado.restantesTimeB} cor={COR_TIME_B} />
        </View>
      </View>

      <View style={estilos.botoesAcao}>
        <TouchableOpacity
          style={[estilos.botaoPrimario, { backgroundColor: corProximo }]}
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            aoProximo();
          }}
          activeOpacity={0.85}
        >
          <Text style={estilos.botaoPrimarioTexto}>vez do {proximoTime}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SubTela: Encerrado
// ─────────────────────────────────────────────────────────────────────────────

interface EncerradoProps {
  estado: EstadoNMP;
  aoJogarDeNovo: () => void;
  aoSair: () => void;
}

function SubTelaEncerrado({ estado, aoJogarDeNovo, aoSair }: EncerradoProps) {
  const vencedor = estado.vencedor;
  const perdedor = vencedor === 'time_a' ? 'time_b' : 'time_a';
  const corVencedor = vencedor === 'time_a' ? COR_TIME_A : COR_TIME_B;
  const nomeVencedor = vencedor === 'time_a' ? 'Time A' : 'Time B';
  const perdeuPorPerigosa = estado.historicoTurnos.at(-1)?.motivo === 'perigosa';

  const momentosUnicos = [...new Set(estado.momentos)];

  const labelMomento: Record<MomentoNMP, string> = {
    pista_perfeita:         '🎯 pista perfeita',
    mestre_ousado:          '🦁 mestre ousado',
    chute_fatal:            '💀 palavra perigosa',
    chute_livre_correto:    '🎰 chute livre certeiro',
    ajudou_adversario:      '🤦 ajudou o adversário',
    vitoria_por_sincronia:  '🤝 vitória por sincronia',
    time_perdido:           '😵 time perdido',
  };

  return (
    <SafeAreaView
      style={[estilos.safe, { backgroundColor: perdeuPorPerigosa ? '#1a0a0a' : cores.fundo }]}
      edges={['top', 'bottom']}
    >
      <View style={estilos.encerradoConteudo}>
        {perdeuPorPerigosa ? (
          <>
            <Text style={estilos.encerradoEmoji}>💀</Text>
            <Text style={[estilos.encerradoTitulo, { color: '#fff' }]}>
              palavra perigosa!
            </Text>
            <Text style={estilos.encerradoSubtitulo}>
              o {estado.historicoTurnos.at(-1)?.timeQueJogou === 'time_a' ? 'Time A' : 'Time B'} tocou na perigosa.
            </Text>
          </>
        ) : (
          <>
            <Text style={estilos.encerradoEmoji}>🏆</Text>
            <Text style={[estilos.encerradoTitulo, { color: corVencedor }]}>
              {nomeVencedor} venceu!
            </Text>
          </>
        )}

        {/* Placar final */}
        <View style={estilos.placarFinal}>
          <PlacarFinalChip
            label="Time A"
            restantes={estado.restantesTimeA}
            cor={COR_TIME_A}
            venceu={vencedor === 'time_a'}
            perdeu={perdedor === 'time_a' && perdeuPorPerigosa}
          />
          <PlacarFinalChip
            label="Time B"
            restantes={estado.restantesTimeB}
            cor={COR_TIME_B}
            venceu={vencedor === 'time_b'}
            perdeu={perdedor === 'time_b' && perdeuPorPerigosa}
          />
        </View>

        {/* Momentos */}
        {momentosUnicos.length > 0 && (
          <View style={estilos.momentosContainer}>
            <Text style={estilos.momentosTitulo}>momentos da partida</Text>
            {momentosUnicos.map((m) => (
              <Text key={m} style={estilos.momentoItem}>
                {labelMomento[m]}
              </Text>
            ))}
          </View>
        )}
      </View>

      <View style={estilos.botoesAcao}>
        <TouchableOpacity
          style={[estilos.botaoPrimario, { backgroundColor: COR_NMP }]}
          onPress={() => {
            void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            aoJogarDeNovo();
          }}
          activeOpacity={0.85}
        >
          <Text style={estilos.botaoPrimarioTexto}>jogar de novo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={estilos.botaoSecundario} onPress={aoSair} activeOpacity={0.75}>
          <Text style={estilos.botaoSecundarioTexto}>sair</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Componente: Grade de Jogo
// ─────────────────────────────────────────────────────────────────────────────

interface GradeJogoProps {
  estado: EstadoNMP;
  onTocar: (indice: number) => void;
  podeTacar: boolean;
}

function GradeJogo({ estado, onTocar, podeTacar }: GradeJogoProps) {
  const { grade, colunas } = estado;

  return (
    <View style={[estilos.grade, { gap: colunas === 5 ? 5 : 7 }]}>
      {Array.from({ length: Math.ceil(grade.length / colunas) }, (_, row) => (
        <View key={row} style={estilos.gradeRow}>
          {grade.slice(row * colunas, (row + 1) * colunas).map((celula, col) => {
            const indice = row * colunas + col;
            return (
              <CelulaJogo
                key={indice}
                celula={celula}
                onTocar={() => {
                  if (!podeTacar || celula.revelada) return;
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onTocar(indice);
                }}
                podeTacar={podeTacar && !celula.revelada}
                colunas={colunas}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
}

interface CelulaJogoProps {
  celula: CelulaNMP;
  onTocar: () => void;
  podeTacar: boolean;
  colunas: number;
}

function CelulaJogo({ celula, onTocar, podeTacar, colunas }: CelulaJogoProps) {
  const estiloCelula = celula.revelada ? estiloRevelada(celula.tipo) : null;
  const tamanhoFonte = colunas === 5 ? 11 : 13;

  return (
    <TouchableOpacity
      style={[
        estilos.celula,
        celula.revelada && estiloCelula?.container,
        !podeTacar && !celula.revelada && estilos.celulaDesabilitada,
        colunas === 4 && estilos.celulaLarga,
      ]}
      onPress={onTocar}
      activeOpacity={podeTacar ? 0.7 : 1}
      disabled={celula.revelada}
    >
      <Text
        style={[
          estilos.celulaPalavra,
          { fontSize: tamanhoFonte },
          celula.revelada && estiloCelula?.texto,
        ]}
        numberOfLines={2}
        adjustsFontSizeToFit
      >
        {celula.palavra}
      </Text>
    </TouchableOpacity>
  );
}

function estiloRevelada(tipo: CelulaNMP['tipo']): {
  container: object;
  texto: object;
} {
  switch (tipo) {
    case 'time_a':
      return {
        container: { backgroundColor: COR_TIME_A, borderColor: COR_TIME_A },
        texto: { color: '#fff', fontWeight: '700' },
      };
    case 'time_b':
      return {
        container: { backgroundColor: COR_TIME_B, borderColor: COR_TIME_B },
        texto: { color: '#fff', fontWeight: '700' },
      };
    case 'neutra':
      return {
        container: { backgroundColor: cores.borda, borderColor: cores.borda },
        texto: { color: cores.textoSecundario },
      };
    case 'perigosa':
      return {
        container: { backgroundColor: '#111', borderColor: '#333' },
        texto: { color: '#fff', fontWeight: '700' },
      };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Componente: Grade Secreta (Ver Mapa)
// ─────────────────────────────────────────────────────────────────────────────

function GradeSecreta({ estado }: { estado: EstadoNMP }) {
  const { grade, colunas } = estado;

  const corFundo = (tipo: CelulaNMP['tipo']): string => {
    switch (tipo) {
      case 'time_a':   return COR_TIME_A;
      case 'time_b':   return COR_TIME_B;
      case 'neutra':   return '#444';
      case 'perigosa': return '#111';
    }
  };

  const inicial = (tipo: CelulaNMP['tipo']): string => {
    switch (tipo) {
      case 'time_a':   return 'A';
      case 'time_b':   return 'B';
      case 'neutra':   return 'N';
      case 'perigosa': return '☠';
    }
  };

  return (
    <View style={[estilos.grade, estilos.gradeSecreta, { gap: 4 }]}>
      {Array.from({ length: Math.ceil(grade.length / colunas) }, (_, row) => (
        <View key={row} style={estilos.gradeRow}>
          {grade.slice(row * colunas, (row + 1) * colunas).map((celula, col) => {
            const indice = row * colunas + col;
            const bg = corFundo(celula.tipo);
            return (
              <View
                key={indice}
                style={[
                  estilos.celulaSecreta,
                  { backgroundColor: bg },
                  celula.revelada && estilos.celulaSecretaRevelada,
                ]}
              >
                <Text style={estilos.celulaSecretaInicial}>{inicial(celula.tipo)}</Text>
                <Text style={estilos.celulaSecretaPalavra} numberOfLines={1} adjustsFontSizeToFit>
                  {celula.palavra}
                </Text>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Componentes auxiliares
// ─────────────────────────────────────────────────────────────────────────────

function PlacardeTopo({ estado }: { estado: EstadoNMP }) {
  const usaPontos = estado.pontosTimeA !== null;
  return (
    <View style={estilos.placarTopo}>
      <View style={[estilos.placarTopoTime, { borderColor: COR_TIME_A }]}>
        <Text style={[estilos.placarTopoLabel, { color: COR_TIME_A }]}>A</Text>
        <Text style={estilos.placarTopoNum}>
          {usaPontos ? String(estado.pontosTimeA ?? 0) : String(estado.restantesTimeA)}
        </Text>
        {!usaPontos && <Text style={estilos.placarTopoSufixo}>restam</Text>}
        {usaPontos && <Text style={estilos.placarTopoSufixo}>pts</Text>}
      </View>

      <View style={estilos.placarTurnoAtivo}>
        <View
          style={[
            estilos.placarTurnoPonto,
            { backgroundColor: estado.timeAtivo === 'time_a' ? COR_TIME_A : COR_TIME_B },
          ]}
        />
      </View>

      <View style={[estilos.placarTopoTime, { borderColor: COR_TIME_B }]}>
        <Text style={[estilos.placarTopoLabel, { color: COR_TIME_B }]}>B</Text>
        <Text style={estilos.placarTopoNum}>
          {usaPontos ? String(estado.pontosTimeB ?? 0) : String(estado.restantesTimeB)}
        </Text>
        {!usaPontos && <Text style={estilos.placarTopoSufixo}>restam</Text>}
        {usaPontos && <Text style={estilos.placarTopoSufixo}>pts</Text>}
      </View>
    </View>
  );
}

function LegendaItem({ cor, label }: { cor: string; label: string }) {
  return (
    <View style={estilos.legendaItem}>
      <View style={[estilos.legendaDot, { backgroundColor: cor }]} />
      <Text style={estilos.legendaLabel}>{label}</Text>
    </View>
  );
}

function PlacarChip({ label, restantes, cor }: { label: string; restantes: number; cor: string }) {
  return (
    <View style={[estilos.placarChip, { borderColor: cor }]}>
      <Text style={[estilos.placarChipLabel, { color: cor }]}>{label}</Text>
      <Text style={estilos.placarChipNum}>{restantes}</Text>
      <Text style={estilos.placarChipSufixo}>restam</Text>
    </View>
  );
}

function PlacarFinalChip({
  label, restantes, cor, venceu, perdeu,
}: {
  label: string;
  restantes: number;
  cor: string;
  venceu: boolean;
  perdeu: boolean;
}) {
  return (
    <View
      style={[
        estilos.placarFinalChip,
        venceu && { borderColor: cor, borderWidth: 2, backgroundColor: cor + '15' },
        perdeu && { opacity: 0.5 },
      ]}
    >
      <Text style={[estilos.placarChipLabel, { color: cor }]}>
        {label} {venceu ? '🏆' : ''}
      </Text>
      <Text style={estilos.placarFinalNum}>{restantes}</Text>
      <Text style={estilos.placarChipSufixo}>palavras restantes</Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Estilos
// ─────────────────────────────────────────────────────────────────────────────

const estilos = StyleSheet.create({
  safe: {
    flex: 1,
  },

  // ── Layout base ────────────────────────────────────────────────────────────

  centrado: {
    alignItems: 'center',
    flex: 1,
    gap: espacamento.sm,
    justifyContent: 'center',
    paddingHorizontal: espacamento.lg,
  },

  botoesAcao: {
    gap: espacamento.xs,
    paddingBottom: espacamento.sm,
    paddingHorizontal: espacamento.md,
    paddingTop: espacamento.sm,
  },

  botoesAcaoCompacto: {
    paddingBottom: espacamento.sm,
    paddingHorizontal: espacamento.md,
    paddingTop: 4,
  },

  // ── Botões ─────────────────────────────────────────────────────────────────

  botaoPrimario: {
    alignItems: 'center',
    borderRadius: raio.md,
    paddingVertical: 16,
  },
  botaoPrimarioTexto: {
    color: '#fff',
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpo,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  botaoSecundario: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  botaoSecundarioTexto: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpoMenor,
  },
  botaoPassar: {
    alignItems: 'center',
    backgroundColor: cores.fundoSecundario,
    borderColor: cores.borda,
    borderRadius: raio.md,
    borderWidth: 1,
    paddingVertical: 12,
  },
  botaoPassarTexto: {
    color: cores.textoSecundario,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpoMenor,
    fontWeight: '600',
  },

  // ── Aguardando pista ───────────────────────────────────────────────────────

  badgeTime: {
    borderRadius: 20,
    borderWidth: 1.5,
    paddingHorizontal: espacamento.sm,
    paddingVertical: 4,
  },
  badgeTimeTexto: {
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  tituloPrincipal: {
    color: cores.texto,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoTitulo,
    fontWeight: '800',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  mestreDestaque: {
    alignItems: 'center',
    gap: 2,
  },
  mestreLabel: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  mestreNome: {
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoSubtitulo,
    fontWeight: '700',
  },
  instrucaoMapa: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpoMenor,
    lineHeight: 20,
    textAlign: 'center',
    paddingHorizontal: espacamento.md,
  },

  // ── Ver mapa ───────────────────────────────────────────────────────────────

  mapaHeader: {
    alignItems: 'center',
    paddingHorizontal: espacamento.md,
    paddingTop: espacamento.md,
    paddingBottom: espacamento.sm,
  },
  mapaInstrucao: {
    color: '#aaa',
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpoMenor,
    textAlign: 'center',
  },
  mapaLegenda: {
    flexDirection: 'row',
    gap: espacamento.md,
    justifyContent: 'center',
    paddingVertical: espacamento.sm,
  },
  legendaItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  legendaDot: {
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  legendaLabel: {
    color: '#aaa',
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
  },

  // ── Dar pista ──────────────────────────────────────────────────────────────

  formPista: {
    alignItems: 'center',
    flex: 1,
    gap: espacamento.sm,
    justifyContent: 'center',
    paddingHorizontal: espacamento.lg,
  },
  inputPista: {
    backgroundColor: cores.fundoSecundario,
    borderColor: COR_NMP,
    borderRadius: raio.sm,
    borderWidth: 1.5,
    color: cores.texto,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoSubtitulo,
    fontWeight: '700',
    paddingHorizontal: espacamento.md,
    paddingVertical: 14,
    textAlign: 'center',
    width: '100%',
  },
  labelNumero: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    letterSpacing: 0.5,
    marginTop: espacamento.xs,
    textTransform: 'uppercase',
  },
  numerosContainer: {
    flexDirection: 'row',
    gap: espacamento.xs,
  },
  numeroChip: {
    alignItems: 'center',
    backgroundColor: cores.fundoSecundario,
    borderColor: cores.borda,
    borderRadius: raio.sm,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 52,
  },
  numeroChipTexto: {
    color: cores.texto,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpo,
  },
  ousadiaAviso: {
    color: '#F59E0B',
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    textAlign: 'center',
  },

  // ── Adivinhando ────────────────────────────────────────────────────────────

  pistaDestaque: {
    alignItems: 'center',
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: espacamento.sm,
    justifyContent: 'center',
    marginHorizontal: espacamento.md,
    paddingBottom: espacamento.sm,
    paddingTop: espacamento.xs,
  },
  pistaTexto: {
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoTituloGrande,
    fontWeight: '900',
    letterSpacing: -0.5,
    textTransform: 'uppercase',
  },
  pistaNumeroContainer: {
    backgroundColor: cores.fundoSecundario,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  pistaNumero: {
    color: cores.texto,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoSubtitulo,
    fontWeight: '700',
  },
  progressoContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: espacamento.md,
    paddingVertical: 6,
  },
  progressoTexto: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
  },
  progressoTime: {
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    fontWeight: '700',
  },

  // ── Grade ──────────────────────────────────────────────────────────────────

  grade: {
    flex: 1,
    paddingHorizontal: espacamento.sm,
    paddingVertical: 4,
  },
  gradeRow: {
    flex: 1,
    flexDirection: 'row',
    gap: 5,
  },
  gradeSecreta: {
    paddingHorizontal: espacamento.md,
  },
  celula: {
    alignItems: 'center',
    backgroundColor: cores.fundoSecundario,
    borderColor: cores.borda,
    borderRadius: raio.sm,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 48,
    padding: 4,
  },
  celulaLarga: {
    minHeight: 56,
  },
  celulaDesabilitada: {
    opacity: 0.5,
  },
  celulaPalavra: {
    color: cores.texto,
    fontFamily: familias.sans,
    fontWeight: '600',
    textAlign: 'center',
  },
  celulaSecreta: {
    alignItems: 'center',
    borderRadius: raio.sm,
    flex: 1,
    justifyContent: 'center',
    minHeight: 44,
    padding: 3,
  },
  celulaSecretaRevelada: {
    opacity: 0.4,
  },
  celulaSecretaInicial: {
    color: '#fff',
    fontFamily: familias.sans,
    fontSize: 10,
    fontWeight: '800',
    opacity: 0.6,
  },
  celulaSecretaPalavra: {
    color: '#fff',
    fontFamily: familias.sans,
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },

  // ── Placar topo ────────────────────────────────────────────────────────────

  placarTopo: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: espacamento.md,
    paddingVertical: espacamento.xs,
  },
  placarTopoTime: {
    alignItems: 'center',
    borderRadius: raio.sm,
    borderWidth: 1,
    gap: 1,
    paddingHorizontal: espacamento.sm,
    paddingVertical: 4,
  },
  placarTopoLabel: {
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    fontWeight: '800',
    letterSpacing: 1,
  },
  placarTopoNum: {
    color: cores.texto,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoTitulo,
    fontWeight: '900',
  },
  placarTopoSufixo: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: 9,
  },
  placarTurnoAtivo: {
    alignItems: 'center',
    flex: 1,
  },
  placarTurnoPonto: {
    borderRadius: 4,
    height: 8,
    width: 8,
  },

  // ── Resultado turno ────────────────────────────────────────────────────────

  resumoTurno: {
    alignItems: 'center',
    backgroundColor: cores.fundoSecundario,
    borderRadius: raio.md,
    gap: 4,
    padding: espacamento.md,
    width: '100%',
  },
  resumoPista: {
    color: cores.texto,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpo,
  },
  resumoAcertos: {
    color: cores.textoSecundario,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    fontWeight: '600',
  },
  placarResumo: {
    flexDirection: 'row',
    gap: espacamento.sm,
    marginTop: espacamento.xs,
  },
  placarChip: {
    alignItems: 'center',
    borderRadius: raio.sm,
    borderWidth: 1,
    flex: 1,
    gap: 2,
    padding: espacamento.sm,
  },
  placarChipLabel: {
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  placarChipNum: {
    color: cores.texto,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoTitulo,
    fontWeight: '900',
  },
  placarChipSufixo: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: 9,
  },

  // ── Encerrado ──────────────────────────────────────────────────────────────

  encerradoConteudo: {
    alignItems: 'center',
    flex: 1,
    gap: espacamento.md,
    justifyContent: 'center',
    paddingHorizontal: espacamento.lg,
  },
  encerradoEmoji: {
    fontSize: 64,
    lineHeight: 72,
  },
  encerradoTitulo: {
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoTituloGrande,
    fontWeight: '900',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  encerradoSubtitulo: {
    color: '#aaa',
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpoMenor,
    textAlign: 'center',
  },
  placarFinal: {
    flexDirection: 'row',
    gap: espacamento.sm,
    width: '100%',
  },
  placarFinalChip: {
    alignItems: 'center',
    borderColor: cores.borda,
    borderRadius: raio.md,
    borderWidth: 1,
    flex: 1,
    gap: 2,
    padding: espacamento.md,
  },
  placarFinalNum: {
    color: cores.texto,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoHero,
    fontWeight: '900',
  },
  momentosContainer: {
    alignItems: 'flex-start',
    backgroundColor: cores.fundoSecundario,
    borderRadius: raio.md,
    gap: 4,
    padding: espacamento.md,
    width: '100%',
  },
  momentosTitulo: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    letterSpacing: 0.5,
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  momentoItem: {
    color: cores.texto,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpoMenor,
    lineHeight: 22,
  },
});
