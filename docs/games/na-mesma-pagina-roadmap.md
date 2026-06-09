# NA MESMA PÁGINA — ROADMAP DE DESENVOLVIMENTO

## Status

MVP completo. Sprints 0–7 executadas.

---

## Sprints

| Sprint | Nome | Status |
|--------|------|--------|
| 0 | Alinhamento e Escopo | ✅ concluída |
| 1 | Modelo de Domínio e Tipos | ✅ concluída |
| 2 | Engine Local + Banco de Palavras MVP | ✅ concluída |
| 3 | Tela de Configuração | ✅ concluída |
| 4 | Tela de Jogo — Núcleo | ✅ concluída |
| 5 | Modos de Jogo e Variações | ✅ concluída |
| 6 | Decks Temáticos Expandidos | ✅ concluída |
| 7 | SessionStore, Polimento e Release | ✅ concluída |

---

## Sprint 0 — Alinhamento e Escopo

**Objetivo:** documentação fundacional antes de qualquer código.

**Entregáveis:**
- `docs/games/na-mesma-pagina.md` — definição canônica ✅
- `docs/games/na-mesma-pagina-roadmap.md` — este arquivo ✅
- Decisões arquiteturais registradas (local, sem Firebase, single-device)
- Grade, distribuição de palavras e condições de vitória definidas

**Decisões:**
- Jogo local: 1 celular, sem Firebase.
- Single-device: todos veem a mesma tela, Mestre usa fluxo "ver mapa privado".
- Grade clássica: 5×5 com 9/8/7/1 (A/B/neutras/perigosa).
- Cor: `#6366F1` (indigo).
- Categoria: `blefe_deducao`.

---

## Sprint 1 — Modelo de Domínio e Tipos

**Objetivo:** contratos TypeScript completos. Nenhuma tela ainda.

**Arquivo:** `src/games/na-mesma-pagina/types.ts`

**Tipos principais:**

```typescript
type ModoNMP = 'classico' | 'rapido' | 'festa' | 'dificil';
type TipoPalavra = 'time_a' | 'time_b' | 'neutra' | 'perigosa';
type FaseNMP = 'aguardando_pista' | 'aguardando_pista_mapa' | 'adivinhando' | 'resultado_turno' | 'encerrado';
type VencedorNMP = 'time_a' | 'time_b' | null;

interface ConfiguracaoNMP {
  modo: ModoNMP;
  jogadoresTimeA: string[];    // inclui mestre
  jogadoresTimeB: string[];    // inclui mestre
  mestreTimeA: string;
  mestreTimeB: string;
  deck: string;                // 'cotidiano' | 'brasil' | ...
}

interface CelulaNMP {
  palavra: string;
  tipo: TipoPalavra;
  revelada: boolean;
}

interface PistaNMP {
  texto: string;
  numero: number;              // 0 = ilimitado (chute livre)
  tentativasFeitas: number;
  tentativasCorretas: number;
}

interface EstadoNMP {
  config: ConfiguracaoNMP;
  grade: CelulaNMP[];          // sempre 25 (5×5) ou 16 (4×4)
  colunas: number;             // 5 ou 4
  timeAtivo: 'time_a' | 'time_b';
  fase: FaseNMP;
  pistaAtual: PistaNMP | null;
  restantesTimeA: number;
  restantesTimeB: number;
  vencedor: VencedorNMP;
  historicoPistas: PistaNMP[];
  momentos: string[];          // ex: 'pista_perfeita', 'chute_fatal'
}
```

**Engine:** `src/games/na-mesma-pagina/engine.ts`

Funções a declarar (sem implementação nesta sprint):
- `criarEstadoInicial(config): EstadoNMP`
- `registrarPista(estado, texto, numero): EstadoNMP`
- `revelarPalavra(estado, indice): EstadoNMP`
- `passarTurno(estado): EstadoNMP`
- `podeContinuar(estado): boolean`

---

## Sprint 2 — Engine Local + Banco de Palavras MVP

**Objetivo:** lógica de jogo completa e testável. Sem UI.

### Banco de palavras

**Arquivo:** `src/games/na-mesma-pagina/palavras.ts`

```typescript
export const DECK_COTIDIANO: string[] = [/* ~250 palavras */];
export function sortearGrade(deck: string[], quantidade: number): string[]
```

Critérios das palavras do deck `cotidiano`:
- Substantivos concretos e abstratos misturados
- Alta polissemia (uma palavra, muitas associações)
- Sem palavras obscuras, técnicas ou nichadas
- Conhecidas pelo público geral brasileiro 18–35 anos
- Exemplos: `praia`, `banco`, `coroa`, `espelho`, `cobra`, `carta`, `torre`, `fogo`, `vento`, `ponte`

Entregar pelo menos **250 palavras** nesta sprint.

### Engine

**Arquivo:** `src/games/na-mesma-pagina/engine.ts`

`criarEstadoInicial(config)`:
- Sorteia `quantidade` palavras do deck sem repetição
- Distribui tipos: Time A = 9, Time B = 8, Neutras = 7, Perigosa = 1 (modo Clássico)
- Para modo Rápido (4×4 = 16): Time A = 5, Time B = 4, Neutras = 6, Perigosa = 1
- Embaralha posições (Fisher-Yates)
- Define `timeAtivo = 'time_a'`, `fase = 'aguardando_pista'`

`registrarPista(estado, texto, numero)`:
- Valida: texto não vazio, número ≥ 0
- Retorna novo estado com `pistaAtual` preenchida e `fase = 'adivinhando'`

`revelarPalavra(estado, indice)`:
- Marca célula como revelada
- Se `tipo === 'perigosa'`: `vencedor = time oposto`, `fase = 'encerrado'`, registra momento `chute_fatal`
- Se `tipo === time adversário`: encerra turno, registra `ajudou_adversario`
- Se `tipo === 'neutra'`: encerra turno
- Se `tipo === time ativo`: acerto, incrementa `tentativasCorretas`
  - Se `tentativasFeitas >= pistaAtual.numero && numero !== 0`: encerra turno
  - Verifica vitória: `restantesTimeAtivo === 0` → `vencedor`, `fase = 'encerrado'`
- Registra momentos: `pista_perfeita`, `mestre_ousado` (numero ≥ 3), `chute_livre_correto`

`passarTurno(estado)`:
- Alterna `timeAtivo`
- Reseta `pistaAtual = null`
- `fase = 'aguardando_pista'`

`podeContinuar(estado)`: retorna `true` se `tentativasFeitas < pistaAtual.numero || pistaAtual.numero === 0`

---

## Sprint 3 — Tela de Configuração

**Objetivo:** UI completa para configurar e iniciar uma partida.

**Arquivo:** `src/screens/TelaConfiguracaoLocalNaMesmaPagina.tsx`

**Constante:** `COR_NMP = '#6366F1'`

**Seções:**

1. **Jogadores e Times**
   - `CadastroJogadores` com MIN=4, MAX=12
   - Exige número par de jogadores
   - Divisão automática: primeiros N/2 no Time A, restantes no Time B
   - Permite arrastar jogador entre times (ou alternativa: botão de trocar lado)
   - Exibe chips de preview dos times

2. **Mestres**
   - Após definir times, cada time seleciona seu Mestre via SegmentControl (lista dos jogadores do time)
   - Padrão: primeiro jogador de cada time

3. **Modo de Jogo**
   - `SegmentControl` com opções: Clássico | Rápido | Festa | Difícil
   - Descrição de cada modo embaixo do controle

4. **Deck de Palavras**
   - Para MVP: apenas `Cotidiano` disponível, outros bloqueados com cadeado

**Navegação:** `navigation.replace('JogoLocalNaMesmaPagina', config)`

**Registro de sessão:** `assegurarSessaoIniciada()` + `salvarGrupoRecente(jogadores)`

---

## Sprint 4 — Tela de Jogo — Núcleo

**Objetivo:** fluxo de jogo completo do início ao fim.

**Arquivo:** `src/screens/TelaJogoLocalNaMesmaPagina.tsx`

### Sub-telas (componentes internos)

**`SubTelaAguardandoPista`** — fase: `aguardando_pista`
- Exibe: "Vez do Time X" + nome do Mestre
- Botão prominente: `"Ver Mapa"` → entra na fase `aguardando_pista_mapa`
- Botão secundário: `"Dar Pista Sem Ver"` (Mestre já memorizou)

**`SubTelaVerMapa`** — fase: `aguardando_pista_mapa`
- Tela privada: fundo escuro, instrução "Mostrar apenas para [Mestre]"
- Grade 5×5 com células coloridas por tipo:
  - Time A: fundo azul + inicial "A"
  - Time B: fundo vermelho + inicial "B"
  - Neutra: fundo cinza + "N"
  - Perigosa: fundo preto + ícone caveira
- Botão `"Pronto, Dar Pista"` → avança para formulário de pista
- Haptic `ImpactFeedbackStyle.Medium` ao entrar no mapa

**`SubTelaDarPista`** — fase `aguardando_pista` após ver mapa
- Campo de texto: "Sua pista"
- SegmentControl para número: 1 | 2 | 3 | 4 | ilimitado
- Botão `"Confirmar Pista"` → `registrarPista(estado, texto, numero)` → `fase = 'adivinhando'`

**`SubTelaAdivinhando`** — fase: `adivinhando`
- Cabeçalho: pista destacada em grande + número (ex: "MAR • 3")
- Progresso: tentativas feitas / número
- Grade de palavras (botões tocáveis):
  - Não revelada: fundo neutro, texto branco
  - Revelada Time A: azul
  - Revelada Time B: vermelho
  - Revelada Neutra: cinza
  - Revelada Perigosa: preto
- Botão `"Passar Turno"` sempre visível (o time pode parar quando quiser)
- Ao tocar: `revelarPalavra(estado, indice)` → animação de reveal + haptic
  - Acerto: `NotificationFeedbackType.Success`
  - Neutro/Adversário: `NotificationFeedbackType.Warning`
  - Perigosa: `NotificationFeedbackType.Error`

**`SubTelaResultadoTurno`** — encerramento de turno sem fim de jogo
- Resumo da rodada: acertos, tipo de encerramento (passed / errou / limite)
- Estado atual: X palavras restantes no Time A, Y no Time B
- Botão `"Próximo Time"` → `passarTurno(estado)`

**`SubTelaEncerrado`** — fase: `encerrado`
- Banner de vitória ou derrota (perigosa)
- Nome do time vencedor em destaque
- Lista dos momentos registrados
- Placar final (palavras restantes por time)
- Botões: `"Jogar de Novo"` (mesma config) | `"Sair"`

### Fluxo de mapa privado

Ao entrar em `SubTelaVerMapa`:
1. Haptic leve
2. Instrução: "Vire o celular para o Mestre"
3. Grade exibida com tipos revelados
4. Quando Mestre toca "Pronto": `fase` avança para o formulário de pista
5. A grade principal da `SubTelaAdivinhando` **não** mostra os tipos das não-reveladas

### Estado inicial de navegação

```typescript
const [estado, setEstado] = useState<EstadoNMP>(() =>
  criarEstadoInicial(config)
);
```

---

## Sprint 5 — Modos de Jogo e Variações

**Objetivo:** implementar os 4 modos com diferenças reais na engine e na UI.

**Modo Rápido (4×4)**
- Grade menor: 16 palavras
- Distribuição: 5/4/6/1
- `colunas = 4`
- UI adapta grid para 4 colunas

**Modo Festa**
- Grade 5×5 igual ao Clássico
- Perigosa não encerra o jogo imediatamente: o time perde 2 pontos e o turno passa
- Sistema de pontos: acerto +1, perigosa -2
- Placar exibido na tela durante o jogo
- Menos pressão, mais risos

**Modo Difícil**
- Grade 5×5
- Deck `cotidiano` (a dificuldade vem da distribuição: mais neutras)
- Distribuição: A=8, B=7, Neutras=9, Perigosa=1 — implementado em DISTRIBUICAO_POR_MODO
- Botão "Dar Pista Sem Ver" mantido (simplificação pós-MVP: remover se houver feedback)
- **Iteração do plano:** deck separado `dificil` removido — distribuição com mais neutras já cria dificuldade suficiente

**Atualizar engine:**
- `criarEstadoInicial` recebe `modo` e aplica distribuição correta
- `revelarPalavra` usa `config.modo` para tratar perigosa no modo Festa

**Atualizar configuração:**
- SegmentControl de modo já existe desde Sprint 3, agora tem efeito real

---

## Sprint 6 — Decks Temáticos Expandidos

**Objetivo:** 5 novos decks além de cotidiano.

**Arquivos:**
```
src/games/na-mesma-pagina/palavras.ts   — já existe, adicionar exports
```

Cada deck: **100–150 palavras** com curadoria temática.

| Deck | Palavras-chave | Público |
|------|---------------|---------|
| `brasil` | estados, cidades, comidas, expressões, celebridades, futebol | geral |
| `cultura_pop` | filmes, séries, músicas, personagens, memes 2020–2024 | 18–30 anos |
| `internet` | gírias, apps, dinâmicas online, memes do Twitter/TikTok | digital natives |
| `futebol` | times, jogadores, posições, gírias do campo | fãs de futebol |
| `sentimentos` | emoções, estados mentais, sensações físicas, relações | todos |

**UI na tela de configuração:**
- Substituir "Cotidiano (único disponível)" pelo seletor de deck
- Cada deck com ícone, nome e pequena descrição
- Sem cadeados — todos disponíveis

**Deck misto:**
- Opção "Surpresa" que combina aleatoriamente 50 palavras de decks diferentes
- `montarDeckMisto(decks: string[], quantidade: number): string[]`

---

## Sprint 7 — SessionStore, Polimento e Release

**Objetivo:** integrar com infraestrutura do app, polir, registrar no catálogo.

### SessionStore

- `assegurarSessaoIniciada()` no início do jogo
- `salvarGrupoRecente(jogadores)` ao confirmar configuração
- Estatísticas a salvar pós-partida:
  ```typescript
  {
    vencedor: 'time_a' | 'time_b',
    modo: ModoNMP,
    totalPistas: number,
    momentos: string[],
    duracaoEstimadaMs: number,
  }
  ```

### Navigation

**`src/navigation/types.ts`:**
```typescript
ConfiguracaoLocalNaMesmaPagina: undefined;
JogoLocalNaMesmaPagina: ConfiguracaoNMP;
```

**`src/navigation/RootNavigator.tsx`:**
```typescript
import { TelaConfiguracaoLocalNaMesmaPagina } from '@/screens/TelaConfiguracaoLocalNaMesmaPagina';
import { TelaJogoLocalNaMesmaPagina } from '@/screens/TelaJogoLocalNaMesmaPagina';
// Stack.Screen para ambas
```

**`src/screens/TelaInicio.tsx`:**
```typescript
} else if (jogoId === 'na-mesma-pagina') {
  navigation.navigate('ConfiguracaoLocalNaMesmaPagina');
}
```

### gameRegistry

```typescript
{
  id: 'na-mesma-pagina',
  disponivel: true,
  supportsRealtime: false,
  supportsLocal: true,
  minJogadores: 4,
  maxJogadores: 12,
  categoriasPrincipais: ['blefe_deducao', 'rapidos_para_esquentar'],
  // cover: assets/games/na-mesma-pagina/cover.png
  // banner: assets/games/na-mesma-pagina/banner.png
}
```

### Polimento visual

- Animação de reveal da célula: `Animated.spring` scale 1→1.08→1 + crossfade de cor
- Animação de entrada da grade: `stagger` de 30ms por célula
- Gradiente de fundo sutil na SubTelaVerMapa (fundo muito escuro)
- Feedback haptic refinado (ver Sprint 4)
- Testar acessibilidade: tamanho mínimo de célula 44×44pt em grade 5×5

### QA antes de release

- [ ] Jogo completo do início ao fim nos 4 modos
- [ ] Perigosa encerra imediatamente (Clássico, Difícil) ou penaliza (Festa)
- [ ] Mestre vê mapa privado sem que outros vejam
- [ ] Botão "Passar Turno" funciona em todos os estados
- [ ] "Jogar de Novo" reinicia com mesma config
- [ ] Sair no meio do jogo não deixa estado corrompido
- [ ] Grade 4×4 e 5×5 renderizam corretamente em iPhone SE (tela pequena)
- [ ] TypeScript estrito sem erros

---

## Arquitetura resultante

```
src/games/na-mesma-pagina/
  types.ts          — contratos TypeScript
  engine.ts         — lógica pura, sem UI
  palavras.ts       — todos os decks

src/screens/
  TelaConfiguracaoLocalNaMesmaPagina.tsx
  TelaJogoLocalNaMesmaPagina.tsx

assets/games/na-mesma-pagina/
  cover.png
  banner.png

docs/games/
  na-mesma-pagina.md          — definição canônica
  na-mesma-pagina-roadmap.md  — este arquivo
```

---

## Backlog Pós-Release

- Modo Cooperativo (ambos os times vs. o app)
- Timer configurável para discussão do time
- Histórico de pistas na tela (scroll)
- Voto secreto individual por jogador antes de revelar
- Estatísticas históricas por grupo
- Editor de decks (palavras customizadas)
- Casos sazonais / temáticos
