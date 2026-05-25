# Duvido — Documento Inicial do Jogo

---

## Manifesto

Duvido não é um jogo de trivia.

É um jogo de coragem calibrada, leitura social e blefe objetivo.

O ranking existe. O gabarito é verificável. O app é o árbitro.

Mas quem vence não é necessariamente quem sabe mais.
É quem consegue agir com convicção quando não tem certeza absoluta —
e reconhecer nos outros o momento exato em que a convicção é falsa.

O conhecimento é o campo. A confiança é a arma. A leitura é a vitória.

---

## Perguntas Obrigatórias (GAME_CREATION_FRAMEWORK)

**1. Qual é a emoção central?**

Coragem calculada.

"Eu sei. Acho que sei. Vou arriscar. Vai que não duvida."

**2. Que frase o jogador diria no meio do jogo?**

"Mas você parece que sabe... ou está blefando?"

**3. O celular aparece para fazer o quê?**

Exibir o tema do ranking e a fonte. Registrar itens já ditos.
Resolver o "duvido" instantaneamente com o reveal. Registrar eliminações.
Mostrar a lista completa no final.

**4. Quando o celular deve desaparecer?**

No momento entre "o jogador diz um nome" e "o próximo decide duvidar ou não".
Esse intervalo — de 3 a 8 segundos — é completamente humano. O app não deve intervir.

**5. Qual é o core loop?**

Jogador A diz um nome.
Jogador B aceita ou duvida.
Se duvida: o app revela. Um dos dois sai.
Se aceita: Jogador B agora precisa dizer um nome. A pressão circulou.
Repete até sobrar um.

**6. Quanto tempo dura uma rodada?**

8 a 15 minutos por ranking.
Uma sessão de 3 rankings: 25 a 45 minutos.

**7. Como o grupo vence ou recebe release?**

O reveal é o release. Instantâneo, visual, definitivo.
O reveal final — lista completa exibida para todos — é o segundo release coletivo.
Eliminar alguém ou ser eliminado é igualmente dramático.

**8. Qual é a principal fricção?**

O momento entre dizer um nome e esperar a decisão do próximo.
Aqueles 5 segundos são o jogo inteiro condensado.

**9. O jogo funciona em grupo barulhento?**

Sim. O celular só importa em dois momentos: exibir o tema e revelar o duvido.
O resto é completamente verbal e social.

**10. O que torna o jogo replayable?**

Cada ranking é um contexto diferente.
O mesmo ranking com pessoas diferentes gera partida diferente.
O jogo revela personalidade de forma natural a cada rodada.
Rankings novos podem ser adicionados continuamente.

---

## Núcleo Emocional

**Família emocional:** Coragem Calculada *(nova família — adicionar ao EMOTIONAL_TAXONOMY.md)*

**Sensação central:**

"Será que eu sei mesmo? Será que ela sabe?"

**Sinais sociais que emergem:**

- hesitação visível antes de responder
- contato visual intenso no momento do "duvido"
- poker face forçado
- gloating após sobreviver a uma dúvida
- choque coletivo no reveal inesperado
- risada nervosa de quem acertou na sorte

**O que o jogo revela sobre as pessoas:**

Quem blefou. Quem travou. Quem leu o outro. Quem foi corajoso demais. Quem foi covarde de menos.
Essas descobertas são o pós-jogo real.

---

## Core Loop Detalhado

```
[App exibe ranking]
título + fonte + tamanho
ex: "Top 10 jogadores mais bem pagos do mundo — Forbes 2024"

          │
          ▼

Jogador A diz um nome
          │
          ▼

Jogador B tem 5 segundos sociais
          │
    ┌─────┴─────┐
  ACEITO      DUVIDO
    │            │
    ▼            ▼
Jogador B    App revela
agora        instantaneamente
responde         │
um nome    ┌─────┴──────┐
    │    CORRETO    INCORRETO
    ▼       │           │
[circula]  B sai       A sai
           │           │
       [continua]  [continua]

...até sobrar 1 jogador

[App exibe lista completa]
Todos reagem. Reveal coletivo.
```

**Regra da corrente:**
Aceitar transfere a responsabilidade. Você não assiste — você passa a jogar.
Isso impede que alguém fique passivo aceitando tudo.
Em algum momento você vai precisar responder um item que não tem certeza.

---

## Tipos e Interfaces (TypeScript — esboço conceitual)

```typescript
// Mecânica principal nova
type MecanicaPrincipal = ... | 'ranking';

// Estado do jogo
type FaseDuvido =
  | 'exibindo_ranking'    // app mostra tema + fonte
  | 'aguardando_resposta' // jogador ativo pensa
  | 'aguardando_decisao'  // próximo decide aceitar/duvidar
  | 'revelando'           // app verifica e mostra
  | 'eliminando'          // animação de saída
  | 'reveal_final'        // lista completa exibida
  | 'finalizado';

interface JogadorDuvido {
  id: string;
  nome: string;
  ativo: boolean;       // ainda no jogo
  posicao: number;      // ordem na roda
  eliminadoNaRodada?: number;
}

interface RankingDuvido {
  id: string;
  titulo: string;          // "Top 10 jogadores mais bem pagos do mundo"
  fonte: string;           // "Forbes, 2024"
  tamanho: 5 | 10;
  categoria: CategoriaDuvido;
  dificuldade: 1 | 2 | 3;
  itens: string[];         // lista real, ordenada internamente
  variantes: Record<string, string[]>; // {"Cristiano Ronaldo": ["CR7", "Cristiano"]}
  expiresAt?: string;      // rankings temporais precisam de validade
}

interface EstadoDuvido {
  fase: FaseDuvido;
  ranking: RankingDuvido;
  jogadores: JogadorDuvido[];
  jogadorAtivoId: string;
  proximoJogadorId: string;
  itensDitos: string[];         // itens já usados neste ranking (público)
  itensDitosIds: Set<string>;   // para lookup rápido
  ultimoItemDito?: string;
  rodada: number;
  vencedorId?: string;
}

type EventoDuvido =
  | { tipo: 'item_dito'; jogadorId: string; item: string }
  | { tipo: 'aceito'; jogadorId: string }
  | { tipo: 'duvidado'; jogadorId: string }
  | { tipo: 'reveal'; itemValido: boolean; eliminadoId: string }
  | { tipo: 'ranking_finalizado'; vencedorId: string };

interface ConfiguracaoDuvido {
  jogadores: string[];
  categorias: CategoriaDuvido[];
  dificuldade: 1 | 2 | 3;
  numeroDeRankings: 1 | 3 | 5;
}

type CategoriaDuvido =
  | 'futebol'
  | 'musica'
  | 'cinema'
  | 'internet'
  | 'geografia'
  | 'marcas'
  | 'recordes'
  | 'cultura_pop'
  | 'esportes'
  | 'brasil';
```

---

## Categorias e Conteúdo

### Categorias recomendadas para lançamento:

**futebol**
Artilheiros históricos, transferências mais caras, maiores salários, bolas de ouro, recordes de gol.
Alta familiaridade no Brasil. Rankings claros e emocionalmente carregados.

**musica**
Spotify BR mais tocados por ano, YouTube BR, álbuns mais vendidos mundialmente.
Alta cobertura etária. Atualização necessária anualmente.

**cinema**
Maiores bilheterias da história, Oscar de melhor filme, franquias mais lucrativas.
Estável no tempo. Verificável. Surpreendente na ordem real.

**internet**
Canais mais seguidos no YouTube BR, contas mais seguidas no Instagram, streamers com mais views.
Alta relevância para o público 20-35. Dados ficam velhos — precisam de validade.

**geografia**
Países mais populosos, maiores PIBs, maiores territórios, mais turistas.
Acessível. Pouco emocional, mas surpreendente nas posições.

**marcas**
Marcas mais valiosas do mundo, mais reconhecidas, mais vendidas.
Funciona bem com público mais culto. Forbes, Brand Finance.

**recordes**
Guinness de animais, alturas, velocidades, longevidade, absurdos verificáveis.
Conteúdo atemporal. Alta reação coletiva. Melhor no tamanho Top 5.

**cultura_pop**
Séries mais assistidas na Netflix, videogames mais vendidos, personagens mais reconhecidos.
Alta variação por geração — calibrar dificuldade por público.

**brasil**
Maiores cidades do Brasil, estados mais populosos, times com mais títulos do Brasileirão.
Funciona muito bem com público brasileiro. Alta familiaridade.

---

### Critérios de aprovação de um ranking:

- Fonte pública e reconhecida (Spotify, Forbes, FIFA, IBGE, Guinness, Box Office Mojo)
- Data ou período explícito ("2024", "todos os tempos")
- Mínimo 70% dos itens da lista devem ser reconhecíveis pelo público-alvo
- Nenhum item na borda que possa gerar debate ("estava em 11°?")
- Sem critério subjetivo de inclusão
- Variantes populares mapeadas para os itens principais

### Volume mínimo para lançamento:

- 30 rankings no total (10 por nível de dificuldade)
- Distribuição recomendada: 40% fácil, 40% médio, 20% difícil
- Ideal para replayability real: 80 a 120 rankings
- Rankings temporais: expiração trimestral obrigatória

---

## Sistema de Dificuldade

**Fácil (1)**
Os 7-8 primeiros itens são muito conhecidos. Apenas 2-3 na borda exigem mais.
Ideal para início de sessão, grupos novos ou grupos com diferentes níveis.
Exemplo: "Top 10 países mais populosos do mundo"

**Médio (2)**
Metade dos itens é conhecida. A outra metade exige repertório ou raciocínio.
O sweet spot da experiência. Cria bluff natural sem frustração.
Exemplo: "Top 10 músicas mais tocadas no Spotify Brasil em 2024"

**Difícil (3)**
Apenas 3-4 itens são amplamente conhecidos. Os outros exigem especialização ou sorte.
Ideal para grupos com repertório específico ou como desafio entre especialistas.
Exemplo: "Top 10 transferências mais caras do futebol europeu"

---

## Pacing

### Tempos por fase:

| Fase | Duração ideal | Máximo aceitável |
|---|---|---|
| Exibição do ranking | 3-5 segundos | 10 segundos |
| Jogador pensa e responde | 5-20 segundos | 30 segundos (grupo pressiona naturalmente) |
| Próximo decide | 3-8 segundos | 15 segundos |
| Reveal pelo app | 2-3 segundos | 4 segundos |
| Reação coletiva | 5-15 segundos | livre |
| Reveal final (lista completa) | 10-20 segundos | livre |

### Duração de uma partida:

- 1 ranking com 5 jogadores: 8-12 minutos
- 1 ranking com 8 jogadores: 12-18 minutos
- Sessão de 3 rankings: 25-45 minutos

### O app deve sumir quando:

- O jogador ativo está pensando no item
- O próximo jogador está decidindo
- A reação coletiva ao reveal está acontecendo

### O app deve aparecer para:

- Exibir o ranking (tema + fonte)
- Mostrar lista de itens já ditos (display público permanente)
- Resolver o "duvido" com reveal instantâneo
- Mostrar quem foi eliminado
- Exibir a lista completa ao final

---

## Arquitetura

### Modo suportado na v1: Local (1 celular)

O celular circula como árbitro. Não como entretenimento.

Um jogador (ou ninguém especificamente) segura o celular.
O display de itens já ditos fica visível para o grupo inteiro.
O reveal acontece no celular e é mostrado para todos.

### Estrutura de arquivos sugerida:

```
src/games/duvido/
  types.ts              — FaseDuvido, JogadorDuvido, RankingDuvido, EstadoDuvido
  engine.ts             — lógica pura: verificar item, processar aceitar/duvidar
  rankings/
    futebol.ts
    musica.ts
    cinema.ts
    internet.ts
    geografia.ts
    marcas.ts
    recordes.ts
    cultura_pop.ts
    brasil.ts
  rankingSelection.ts   — seleção por categoria, dificuldade, exclusão de já jogados
  local/
    localEngine.ts      — adaptador local do engine puro
    types.ts            — tipos específicos do modo local
    duviidoLocalAdapter.ts — SessionStore adapter

src/screens/duvido/local/
  TelaConfiguracaoLocalDuvido.tsx
  TelaJogoLocalDuvido.tsx
  TelaResultadoLocalDuvido.tsx
```

### Separação de responsabilidades:

**engine.ts** — puro, sem estado React, sem Firebase:
- `verificarItem(item, ranking)` → boolean
- `normalizarItem(item)` → string (lowercase, sem acento, trim)
- `resolverDuvido(item, ranking)` → `{ valido: boolean; itemNormalizado: string }`
- `proximoJogadorAtivo(estado)` → JogadorDuvido
- `jogoFinalizado(estado)` → boolean

**localEngine.ts** — estado React via useReducer:
- Recebe eventos: `ItemDito`, `Aceito`, `Duvidado`
- Atualiza estado
- Chama callbacks para SessionStore

**duviidoLocalAdapter.ts** — traduz eventos em sinais para SessionStore:
- `onItemDito` → momento neutro
- `onDuvidaAcertada` → momento memorável: "leitura perfeita"
- `onDuvidaErrada` → momento memorável: "apostou errado"
- `onBluffSobreviveu` → momento memorável: "bleff sobreviveu"
- `onRankingFinalizado` → stats de jogador
- `onJogoFinalizado` → temperatura emocional: competitivo

---

## SessionStore Signals

### Momentos memoráveis emitidos:

| Sinal | Quando | Label |
|---|---|---|
| `leitura_perfeita` | Jogador duvidou e estava certo | "leitura perfeita" |
| `bluff_sobreviveu` | Jogador disse item incerto, não foi duvidado, era válido | "bleff sobreviveu" |
| `aposta_errada` | Jogador duvidou de item correto | "apostou errado" |
| `ultimo_em_pe` | Jogador venceu o ranking | "último em pé" |
| `invicto` | Jogador nunca foi eliminado na sessão | "nunca duvidaram" |
| `eliminado_cedo` | Primeiro eliminado do ranking | "foi logo" |

### Stats por jogador:

- `itens_corretos`: quantos itens válidos disse
- `bluffs_tentados`: quantos itens incertos disse
- `bluffs_sobrevividos`: quantos bluffs não foram duvidados
- `duvidas_certas`: quantas vezes duvidou e estava certo
- `duvidas_erradas`: quantas vezes duvidou e estava errado
- `rankings_vencidos`: quantos rankings sobreviveu até o fim

### Temperatura emocional:

Competitivo — nível alto.
Revelador (de personalidade) — nível médio.
Caótico — quando houver muitas duvidas erradas seguidas.

---

## Modos Suportados

### v1 — Local (1 celular)
O celular é o árbitro. Circula quando necessário para o reveal.
Prioridade de implementação.

### v2 — Cada jogador no seu celular
Cada jogador digita o item no próprio celular.
O "duvido" é um botão visível apenas para o próximo jogador.
Permite modo silencioso (sem falar em voz alta — variante interessante).
Requer Firebase Realtime.

### v3 — Apostas de espectador (add-on)
Jogadores eliminados fazem previsões silenciosas no celular.
Ao final: quem previu mais duvidas corretamente vira o "oráculo da sessão".
Não altera o jogo principal.

---

## Riscos de Gameplay

### Risco 1 — Debate sobre gabarito (CRÍTICO)
**Cenário:** alguém é eliminado e contesta o resultado.
**Impacto:** sessão social colapsa.
**Mitigação:**
- Fonte exibida permanentemente durante o ranking
- Tom editorial do jogo estabelece autoridade do app antes da primeira resposta
- Curadoria rigorosa: evitar itens na borda da lista
- Animação de reveal sem margem visual de dúvida

### Risco 2 — Rankings desatualizados
**Cenário:** alguém aponta que o ranking está errado para o ano atual.
**Impacto:** perde credibilidade editorial.
**Mitigação:**
- Campo `expiresAt` em cada ranking temporal
- Pipeline editorial trimestral obrigatório
- Rankings atemporais (Guinness, história, geografia estável) como base segura

### Risco 3 — Vira trivia pura
**Cenário:** o grupo trata como quiz. Ninguém bluffa. Só quem sabe mais vence.
**Impacto:** perde o diferencial social.
**Mitigação:**
- Onboarding framing: "não é sobre saber mais. é sobre agir como se soubesse."
- Rankings calibrados para sempre ter 2-3 itens na zona de incerteza
- Dificuldade "médio" como padrão — nunca deixar o jogo fácil demais

### Risco 4 — Snowball de conhecimento
**Cenário:** um especialista nunca bluffa, nunca perde, vence sempre.
**Impacto:** jogo se desequilibra. Outros desmotivam.
**Mitigação:**
- A corrente de pressão obriga todos a responder — não dá para só aceitar
- Jogadores atentos começam a duvidar de quem responde rápido demais
- Rankings de dificuldade crescente equalizam o campo

### Risco 5 — Eliminados entediados
**Cenário:** eliminado cedo fica assistindo por 10 minutos.
**Impacto:** perda de engajamento social.
**Mitigação:**
- Duração curta por design (8-15 min por ranking)
- Reveal final é coletivo — eliminados participam da reação
- v2: apostas de espectador mantém engajamento mental

### Risco 6 — Temas polarizadores ou controversos
**Cenário:** ranking gera discussão política, pessoal ou ofensiva.
**Impacto:** sessão social vai para lugar errado.
**Mitigação:**
- Curadoria de categorias: sem política, sem arte subjetiva, sem personalidades negativas
- Revisão editorial de cada ranking antes de publicar

---

## Onboarding

**Princípio:** ensinado jogando. Não com tutorial.

**Texto de apresentação do jogo (tela de descrição):**

> "Um ranking real. Uma resposta por vez. O próximo pode duvidar. O app revela quem errou. Último em pé vence."

**3 telas de regra antes do início (máximo):**

1. "O app mostra um ranking. Diga um nome que está nele."
2. "O próximo jogador pode aceitar ou duvidar. Se duvidar, o app revela quem está certo."
3. "Quem errou sai. Se você aceitar, agora é sua vez de responder."

**Primeiro ranking sugerido como tutorial implícito:**
"Top 5 planetas do sistema solar por tamanho"
Ultra-óbvio. Serve para o grupo entender o fluxo sem stakes reais.

---

## Critério de Aprovação do Jogo

O jogo está pronto para escalar quando:

- 3 rankings completos são jogáveis sem explicação externa
- o grupo entende o "ciclo da corrente" na primeira rodada
- há pelo menos um reveal dramático por ranking em média
- nenhuma discussão sobre gabarito durou mais de 10 segundos
- o grupo pediu "mais uma" ou perguntou "qual é o próximo ranking"
- eliminados não saíram da roda durante a partida

---

## Taxonomia no Catálogo

```typescript
{
  id: 'duvido',
  nome: 'Duvido',
  slogan: 'um ranking real. coragem de dizer. coragem de duvidar.',
  categoriasPrincipais: ['blefe_deducao', 'rapidos_para_esquentar'],
  tagsSociais: ['blefe', 'competitivo', 'gritaria', 'rapido', 'baixo_texto'],
  contextos: ['pra_comecar', 'pra_subir_energia', 'noite_quente', 'grupo_sem_vergonha'],
  descoberta: {
    mecanicaPrincipal: 'ranking',   // nova — adicionar ao taxonomia.ts
    intencaoSocial: 'competir',
    ritmo: 4,
    exposicao: 2,
    energiaFisica: 1,
    conversaPosRodada: 3,
    complexidade: 2,
    intimidade: 1,
    toleranciaVergonha: 2,
  },
  minJogadores: 3,
  maxJogadores: 10,
  tempoMedio: '25-40 min',
  intensidade: 2,
}
```

**Posição editorial:**
Único jogo do catálogo com competição direta, resolução objetiva e sem papéis ocultos.
Funciona com amigos novos e antigos igualmente.
Ideal depois de jogos de alta carga emocional como reset competitivo.

---

## Ordem de Implementação

1. Manifesto e gameplay thesis *(este documento)*
2. `types.ts` — FaseDuvido, JogadorDuvido, RankingDuvido, EstadoDuvido, EventoDuvido
3. `engine.ts` — verificarItem, normalizarItem, resolverDuvido, proximoJogadorAtivo
4. Conteúdo mínimo — 15 rankings em 3 categorias (futebol, música, recordes)
5. `rankingSelection.ts` — seleção por categoria, dificuldade, controle de repetição
6. `TelaConfiguracaoLocalDuvido.tsx` — jogadores + categorias + dificuldade
7. `TelaJogoLocalDuvido.tsx` — loop principal + reveal
8. `TelaResultadoLocalDuvido.tsx` — reveal final + lista completa
9. `duviidoLocalAdapter.ts` — SessionStore signals
10. Playtest e calibração de conteúdo
11. Expansão de rankings (mínimo 80 para lançamento público)
12. Realtime (v2), se necessário

---

## Próximos Documentos Necessários

Antes de implementar:

- `DUVIDO_CONTENT_GUIDE.md` — critérios editoriais para criar e revisar rankings
- `DUVIDO_RANKINGS_v1.md` — os primeiros 30 rankings aprovados para o MVP

Durante implementação:

- `types.ts` com comentários inline de design decisions
- `engine.ts` com testes unitários de normalização e verificação
