# OPERAÇÃO RESGATE — ROADMAP DE DESENVOLVIMENTO

## Status

✅ Concluído. Todas as sprints entregues.

---

## Sprints

| Sprint | Nome | Status |
|--------|------|--------|
| 0 | Alinhamento e Escopo | ✅ concluída |
| 1 | Modelo de Domínio e Tipos | ✅ concluída |
| 2 | Engine Local | ✅ concluída |
| 3 | Geração de Papéis e Informações | ✅ concluída |
| 4 | Tela de Configuração | ✅ concluída |
| 5 | Tela de Distribuição (carta privada) | ✅ concluída |
| 6 | Tela de Jogo (zonas, rodadas, trocas) | ✅ concluída |
| 7 | Tela Final + Navigation + Registry | ✅ concluída |

---

## Sprint 0 — Alinhamento e Escopo

**Objetivo:** documentação fundacional antes de qualquer código.

**Entregáveis:**
- `docs/games/operacao-resgate.md` — definição canônica ✅
- `docs/games/operacao-resgate-roadmap.md` — este arquivo ✅

**Decisões fundamentais:**
- Jogo local, 1 celular, sem Firebase (v1).
- Zonas são simbólicas — o app é o árbitro, não isolamento físico.
- Liderança rotativa: app sorteia líder por zona a cada rodada.
- Papéis v1: Alvo, Ameaça, Agente, Informante, Operador.
- Condição de vitória única: Ameaça e Alvo na mesma zona = Sabotagem vence.
- Cor: `#F97316` (laranja).
- Trocas: 1 por zona por rodada (modo Padrão).

---

## Sprint 1 — Modelo de Domínio e Tipos

**Objetivo:** contratos TypeScript completos. Sem implementação.

**Arquivo:** `src/games/operacao-resgate/types.ts`

```typescript
// ─── Enumerações ──────────────────────────────────────────────────────────────

export type PapelOR =
  | 'alvo'
  | 'ameaca'
  | 'agente'
  | 'informante'
  | 'operador'
  | 'duplo_agente'; // modo avançado

export type FaccaoOR = 'resgate' | 'sabotagem';
export type ZonaOR = 'zona_a' | 'zona_b';
export type ModoOR = 'rapido' | 'padrao' | 'avancado';

export type FaseOR =
  | 'distribuindo'       // revelação privada de cartas, uma por vez
  | 'zonas_iniciais'     // mostrando separação inicial
  | 'discussao'          // rodada em andamento, discussão livre
  | 'decisao_zona_a'     // líder da Zona A escolhe quem enviar
  | 'decisao_zona_b'     // líder da Zona B escolhe quem enviar
  | 'resultado_rodada'   // mostrando novas composições
  | 'evento'             // evento especial entre rodadas (avançado)
  | 'verificacao_final'  // última rodada terminou, calculando resultado
  | 'debrief';           // revelação completa pós-jogo

// ─── Jogadores ────────────────────────────────────────────────────────────────

export interface JogadorOR {
  id: string;
  nome: string;
  papel: PapelOR;
  faccao: FaccaoOR;
  zona: ZonaOR;
  /** Fragmento de informação exclusivo para Informante. */
  informacao: string | null;
  /** Objetivo secundário (modo Avançado). */
  objetivoSecundario: string | null;
  /** Indica se o jogador já leu sua carta privada. */
  cartaLida: boolean;
}

// ─── Configuração ─────────────────────────────────────────────────────────────

export interface ConfiguracaoOR {
  modo: ModoOR;
  jogadores: { id: string; nome: string }[];
  /** Timer opcional na fase de discussão. */
  timerDiscussao: boolean;
  duracaoDiscussaoSegundos: 90 | 120 | 180 | 240;
  comEventos: boolean; // só ativo no modo Avançado
}

// ─── Histórico de rodadas ──────────────────────────────────────────────────────

export interface RodadaOR {
  numero: number;
  liderZonaA: string;         // jogador id
  liderZonaB: string;
  enviadoDaA: string | null;  // id do jogador enviado da Zona A para B
  enviadoDaB: string | null;  // id do jogador enviado da Zona B para A
  eventoId: string | null;    // id do evento especial (se houver)
}

// ─── Eventos especiais ────────────────────────────────────────────────────────

export interface EventoEspecialOR {
  id: string;
  titulo: string;
  descricao: string;
  /** Quantas trocas adicionais por zona gera (além das padrão). */
  trocasExtras: number;
  /** Timer reduzido para discussão (-1 = usa timer padrão). */
  timerOverride: number;
}

// ─── Estado do jogo ───────────────────────────────────────────────────────────

export interface EstadoOR {
  config: ConfiguracaoOR;
  jogadores: JogadorOR[];
  fase: FaseOR;

  /** Índice do jogador que está lendo sua carta (fase distribuindo). */
  distribuicaoIndex: number;

  /** Rodada atual (1-based). */
  rodadaAtual: number;
  totalRodadas: number;

  /** Histórico completo de todas as rodadas. */
  historico: RodadaOR[];

  /** Rodada em construção (fases decisao_zona_a e decisao_zona_b). */
  rodadaEmCurso: Partial<RodadaOR> | null;

  /** Evento da rodada atual (sorteado no início de cada rodada). */
  eventoAtual: EventoEspecialOR | null;

  /** Time vencedor após verificação final. */
  vencedor: FaccaoOR | null;

  /** Decisão mais crítica para o debrief. */
  decisaoChave: string | null;
}

// ─── Distribuição de papéis ───────────────────────────────────────────────────

export interface TOTAL_POR_MODO {
  ameacas: number;
  agentes: number;
  informantes: number;
  operadores: number;
}
```

---

## Sprint 2 — Engine Local

**Objetivo:** lógica pura do jogo, testável sem UI.

**Arquivo:** `src/games/operacao-resgate/engine.ts`

### `criarEstadoInicial(config: ConfiguracaoOR): EstadoOR`

- Define `totalRodadas` por modo (Rápido=3, Padrão=4, Avançado=5).
- Distribui papéis chamando `distribuirPapeis(jogadores, modo)`.
- Divide jogadores em zonas iniciais (metade em A, metade em B — embaralhado).
- Define `fase = 'distribuindo'`, `distribuicaoIndex = 0`.

### `avancarDistribuicao(estado: EstadoOR): EstadoOR`

- Marca `jogadores[distribuicaoIndex].cartaLida = true`.
- Incrementa `distribuicaoIndex`.
- Se todos leram: `fase = 'zonas_iniciais'`.

### `iniciarPrimeiraRodada(estado: EstadoOR): EstadoOR`

- `fase = 'discussao'`, `rodadaAtual = 1`.
- Sorteia líderes para ambas as zonas.
- Cria `rodadaEmCurso` com líderes.

### `avancarParaDecisao(estado: EstadoOR): EstadoOR`

- `fase = 'decisao_zona_a'`.

### `registrarDecisaoZonaA(estado: EstadoOR, jogadorId: string): EstadoOR`

- Valida que jogador pertence à Zona A.
- Salva `rodadaEmCurso.enviadoDaA = jogadorId`.
- `fase = 'decisao_zona_b'`.

### `registrarDecisaoZonaB(estado: EstadoOR, jogadorId: string): EstadoOR`

- Valida que jogador pertence à Zona B.
- Salva `rodadaEmCurso.enviadoDaB = jogadorId`.
- Executa as trocas:
  - `enviadoDaA.zona = 'zona_b'`
  - `enviadoDaB.zona = 'zona_a'`
- Finaliza rodada: adiciona `rodadaEmCurso` ao `historico`.
- `fase = 'resultado_rodada'`.

### `avancarRodada(estado: EstadoOR): EstadoOR`

- Se `rodadaAtual >= totalRodadas`: chama `verificarCondicaoFinal`.
- Senão: incrementa rodada, sorteia novos líderes, `fase = 'discussao'`.
- Se modo Avançado e `comEventos`: pode sortear evento.

### `verificarCondicaoFinal(estado: EstadoOR): EstadoOR`

- Encontra Alvo e Ameaça.
- Se na mesma zona: `vencedor = 'sabotagem'`.
- Senão: `vencedor = 'resgate'`.
- Identifica `decisaoChave` (rodada em que a configuração decisiva foi criada).
- `fase = 'debrief'`.

### Funções auxiliares

```typescript
function sortearLider(jogadores: JogadorOR[], zona: ZonaOR): string
function embaralhar<T>(arr: T[]): T[]
function jogadoresDaZona(estado: EstadoOR, zona: ZonaOR): JogadorOR[]
function encontrarPorPapel(estado: EstadoOR, papel: PapelOR): JogadorOR | null
```

---

## Sprint 3 — Geração de Papéis e Informações

**Objetivo:** lógica de distribuição de papéis e banco de informações dos Informantes.

**Arquivo:** `src/games/operacao-resgate/papeis.ts`

### Tabela de distribuição por modo e número de jogadores

```typescript
// Quantos de cada papel para N jogadores em cada modo
// Sempre: 1 Alvo, 1 Ameaça
// Informantes: 1-2 dependendo do N
// Agentes: 1-2
// Operadores: resto

type DistribuicaoOR = Record<ModoOR, Record<number, {
  agentes: number;
  informantes: number;
  operadores: number;
}>>;
```

Exemplo para modo Padrão:

| Jogadores | Agentes | Informantes | Operadores |
|-----------|---------|-------------|------------|
| 4 | 0 | 1 | 1 |
| 5 | 1 | 1 | 1 |
| 6 | 1 | 1 | 2 |
| 7 | 1 | 2 | 2 |
| 8 | 2 | 2 | 2 |
| 9–10 | 2 | 2 | 3-4 |
| 11–12 | 2 | 2 | 5-6 |

Modo Avançado: adiciona até 1 `duplo_agente` entre os Operadores.

### `distribuirPapeis(jogadores, modo): JogadorOR[]`

1. Determina quantos de cada papel pelo mapa acima.
2. Embaralha array de papéis.
3. Atribui papéis aleatoriamente.
4. Para Informantes: chama `gerarInformacao(jogadores, informante)`.
5. Define facção: Alvo/Agente/Informante/Operador = `'resgate'`; Ameaça/DuploAgente = `'sabotagem'`.

### `gerarInformacao(jogadores, informante): string`

Sorteia 1 fragmento de informação verdadeira e relevante.

**Banco de templates:**

```typescript
// Sobre a Ameaça
"A Ameaça começou na Zona A."
"A Ameaça começou na Zona B."
"[nome] não é a Ameaça."
"[nome] não é a Ameaça, mas tampouco é do lado do Resgate."

// Sobre o Alvo
"O Alvo não é [nome1] nem [nome2]."
"O Alvo começou na Zona A."
"O Alvo começou na Zona B."

// Sobre zonas
"Há pelo menos 1 membro da Sabotagem na Zona A no começo."
"Há pelo menos 1 membro da Sabotagem na Zona B no começo."
"A Ameaça e o Alvo começaram na mesma zona."
"A Ameaça e o Alvo começaram em zonas diferentes."
```

O template é preenchido com nomes reais dos jogadores antes de exibir.

### `gerarTextoCartaPrivada(jogador: JogadorOR): { titulo: string; corpo: string; objetivo: string }`

Retorna o texto da carta privada de cada papel:

- **Alvo**: "Você é o Alvo. Pessoas da sua operação tentarão proteger você. Mas há uma ameaça entre os operadores. Seu objetivo: terminar longe da Ameaça."
- **Ameaça**: "Você é a Ameaça. Seu objetivo: terminar na mesma zona que o Alvo ao final da última rodada. Você pode mentir sobre seu papel."
- **Agente**: "Você é um Agente do Resgate. Há uma Ameaça entre os operadores. Proteja o grupo — mas você não sabe quem é o Alvo."
- **Informante**: "[texto do papel de Agente] + Você possui uma informação: [fragmento]"
- **Operador**: "Você é um Operador. Sem informação especial. Observe quem tenta controlar as trocas."

---

## Sprint 4 — Tela de Configuração

**Objetivo:** UI completa para configurar e iniciar uma partida.

**Arquivo:** `src/screens/TelaConfiguracaoLocalOperacaoResgate.tsx`

**Constante:** `COR_OR = '#F97316'`

**Seções:**

1. **Jogadores**
   - `CadastroJogadores` com MIN=4, MAX=12
   - Preview: mostra quantos jogadores e estimativa de papéis
   - Hint: "ideal para 6–8 jogadores"

2. **Modo de jogo**
   - SegmentControl: Rápido | Padrão | Avançado
   - Padrão vem selecionado por padrão
   - Cada modo mostra: rodadas + duração estimada + observação

3. **Timer de discussão**
   - Switch: ativar/desativar
   - Quando ativo: SegmentControl 90s | 2min | 3min | 4min
   - Default: desativado

4. **Eventos especiais** *(só aparece no modo Avançado)*
   - Switch: incluir eventos entre rodadas
   - Texto: "acontecimentos imprevistos entre rodadas"

**Navegação:** `navigation.replace('JogoLocalOperacaoResgate', config)`

**SessionStore:** `assegurarSessaoIniciada()` + `salvarGrupoRecente(jogadores)`

---

## Sprint 5 — Tela de Distribuição (Carta Privada)

**Objetivo:** fluxo de revelação privada de cartas, uma por jogador.

**Contexto:** esta é a tela mais sensível em termos de UX de segredo.

**Integrada em:** `src/screens/TelaJogoLocalOperacaoResgate.tsx` como `SubTelaDistribuicao`

### Sub-tela: Aguardando passagem

Exibe: "Passe o celular para **[Nome]**"

Fundo: `cores.fundo` (neutro, sem cor temática)

Botão grande: "Sou [Nome], tô pronto" (confirma que a pessoa certa está segurando)

### Sub-tela: Carta privada

Layout:
- Topo: "🔒 apenas você deve ver esta tela"
- Bloco central: carta com papel + objetivo
- Se Informante: linha extra com informação
- Rodapé: botão "Entendi — ocultar"

**Regras de UX:**
- Fundo sempre `#1a1a1a` (escuro e neutro para todos)
- Sem cor por facção
- Fonte branca, sem ícone revelador
- Texto em 2–4 linhas máximo
- Botão de ocultar exige scroll até o fim ou 3s de espera antes de aparecer

### Sub-tela: Carta ocultada

Aparece quando jogador toca "Entendi":
- Fundo: `cores.fundo` neutro
- Texto: "Carta ocultada. Passe para o próximo."
- Botão: "Próximo: [Nome do Próximo]" → `avancarDistribuicao(estado)`
- Se foi o último: "Todos prontos" → `iniciarPrimeiraRodada(estado)`

---

## Sprint 6 — Tela de Jogo (Zonas, Rodadas, Trocas)

**Objetivo:** fluxo de jogo completo do início ao fim.

**Arquivo:** `src/screens/TelaJogoLocalOperacaoResgate.tsx`

### Sub-tela: Zonas Iniciais

Exibe a separação inicial antes da primeira rodada:
- Zona A: lista de nomes dos jogadores
- Zona B: lista de nomes
- Instrução: "fiquem dos lados corretos da mesa"
- Botão: "missão iniciada"

### Sub-tela: Discussão

Exibe por rodada:
- Rodada X de Y
- Zona A: lista de jogadores (chips)
- Zona B: lista de jogadores (chips)
- Líderes destacados com ícone de estrela
- Timer (se ativado): barra animada na tela
- Botão: "encerrar discussão"
- Evento ativo (se houver): banner no topo

### Sub-tela: Decisão Zona A

Exibe:
- "Rodada X — Zona A"
- "**[Líder]**, escolha quem enviar para a Zona B:"
- Lista tocável dos jogadores da Zona A (exceto o líder? — decisão: líder pode se enviar)
- Ao tocar: confirmação — "Enviar [Nome]?"
- Confirmar → `registrarDecisaoZonaA`

### Sub-tela: Decisão Zona B

Idêntica à Zona A, mas para o Líder da Zona B.

### Sub-tela: Resultado da Rodada

Exibe:
- Troca realizada: "[Nome A] ↔ [Nome B]"
- Zonas atualizadas com novas composições
- Se for última rodada: botão "encerrar missão" → `verificarCondicaoFinal`
- Senão: botão "próxima rodada"

### Sub-tela: Verificação Final

Tela de transição antes do debrief:
- "verificando resultado..."
- Animação de loading de 1–2 segundos
- Vai direto para Sub-tela Debrief

### Sub-tela: Debrief

Resultado:
- Banner grande: "RESGATE BEM-SUCEDIDO" ou "OPERAÇÃO COMPROMETIDA"
- Zona final do Alvo vs Ameaça
- Revelação de todos os papéis (lista com nome → papel → facção)
- Informação dos Informantes
- Decisão mais crítica: "Rodada X — o envio de [Nome] foi decisivo"
- Botões: "jogar de novo" | "sair"

---

## Sprint 7 — Navigation, Registry e Polimento

**Objetivo:** integrar com infraestrutura do app, registrar, testar e polir.

### Navigation

**`src/navigation/types.ts`:**
```typescript
ConfiguracaoLocalOperacaoResgate: undefined;
JogoLocalOperacaoResgate: ConfiguracaoOR;
```

**`src/navigation/RootNavigator.tsx`:**
```typescript
import { TelaConfiguracaoLocalOperacaoResgate } from '@/screens/TelaConfiguracaoLocalOperacaoResgate';
import { TelaJogoLocalOperacaoResgate } from '@/screens/TelaJogoLocalOperacaoResgate';
// Stack.Screen para ambas
```

**`src/screens/TelaInicio.tsx`:**
```typescript
} else if (jogoId === 'operacao-resgate') {
  navigation.navigate('ConfiguracaoLocalOperacaoResgate');
}
```

### GameRegistry

```typescript
{
  id: 'operacao-resgate',
  disponivel: true,
  supportsRealtime: false,
  supportsLocal: true,
  minJogadores: 4,
  maxJogadores: 12,
  categoriasPrincipais: ['blefe_deducao', 'conhecimento_grupo'],
  // assets: assets/games/operacao resgate/cover.png e banner.png
}
```

### QA antes de release

- [ ] Carta privada não vaza informação entre jogadores
- [ ] Distribuição gera papéis corretos para todos os tamanhos de grupo (4–12)
- [ ] Trocas funcionam corretamente nas 3 rodadas/zonas
- [ ] Condição de vitória verificada corretamente
- [ ] Debrief mostra todos os papéis corretamente
- [ ] Timer funciona e não bloqueia interação
- [ ] Modo Rápido (3 rodadas) e Avançado (5 rodadas) funcionam
- [ ] Modo Avançado com eventos mostra e aplica evento
- [ ] TypeScript estrito sem erros
- [ ] Funciona em iPhone SE (tela pequena com até 12 chips de jogadores)

---

## Arquitetura resultante

```
src/games/operacao-resgate/
  types.ts        — contratos TypeScript
  engine.ts       — lógica pura, sem UI
  papeis.ts       — distribuição de papéis, banco de informações, texto das cartas

src/screens/
  TelaConfiguracaoLocalOperacaoResgate.tsx
  TelaJogoLocalOperacaoResgate.tsx        — contém todas as sub-telas

assets/games/operacao resgate/
  cover.png   ✅ (já existe)
  banner.png  ✅ (já existe)

docs/games/
  operacao-resgate.md           — definição canônica
  operacao-resgate-roadmap.md   — este arquivo
```

---

## Backlog Pós-Release

- Multiplayer real (Firebase) — a lógica de zonas se traduz bem para salas online
- Modo com comunicação separada (dois grupos em quartos diferentes)
- Casos narrativos temáticos (operação com contexto de história)
- Modo Duplo Agente (v2)
- Objetivos secundários individuais (v2)
- Estatísticas: taxa de vitória Resgate vs Sabotagem por modo
- Balanceamento baseado em dados de playtest
