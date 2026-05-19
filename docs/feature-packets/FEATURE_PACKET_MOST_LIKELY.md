# MOST LIKELY TO — FEATURE PACKET

## Versão
0.1 — Pré-implementação

---

# 1. IDENTIDADE DO JOGO

## O que é

Most Likely To é um jogo de julgamento coletivo.

O grupo vota em quem, entre todos, melhor representa uma característica descrita em um prompt.

Não há resposta certa.
Não há eliminação.
Não há blefe.

Há apenas:
o espelho social do grupo.

## O que o jogo entrega emocionalmente

Um retrato coletivo.

O grupo descobre como se vê mutuamente — em tempo real, em público, com humor e exposição.

A experiência central:
"todo mundo já pensou isso sobre alguém aqui."

## O que o jogo NÃO é

❌ trivia app
❌ quiz com resposta certa
❌ competição individual por pontuação
❌ jogo de perguntas genéricas
❌ enquete casual

O jogo é:
✅ exposição social divertida
✅ julgamento coletivo
✅ caos leve
✅ risadas desconfortáveis
✅ percepção social do grupo

## Sensação ideal

Ao final de uma rodada, alguém diz:
"espera, TODOS votaram em mim??"

E o grupo ri junto.
E aquela pessoa ri junto.
Mas alguma coisa ficou.

---

# 2. EMOTIONAL VECTORS

Escala oficial: 1 → 10

| Vetor | Valor | Rationale |
|---|---|---|
| Exposição | 8 | O grupo está julgando você publicamente. O resultado fica visível para todos. |
| Humor | 9 | A principal moeda do jogo. Prompts bem escritos geram riso imediato. |
| Caos | 7 | Reações sobrepostas, múltiplas conversas, protestos espontâneos. |
| Tensão | 5 | A antecipação antes do reveal tem peso, mas sem ameaça real. |
| Intimidade | 6 | O grupo revela como se vê — exige algum nível de conhecimento mútuo. |
| Vulnerabilidade | 5 | Depende fortemente dos prompts. Modo Sincero eleva esse vetor. |
| Competitividade | 2 | Pontuar existe, mas não é o motor emocional principal. |
| Sedução | 4 | Prompts certos podem criar tensão romantica. Opcional por modo. |

## Melhor momento da noite

Fase 2 → Fase 4 (Aquecimento → Caos Controlado).

Funciona mal na Fase 1 (grupo ainda frio).
Funciona bem no pico social da noite.

## Diferença emocional em relação ao Mr White

Mr White: tensão interna, paranoia individual, confronto direto.

Most Likely To: tensão coletiva, exposição externa, caos compartilhado.

Mr White pergunta: "você está mentindo?"

Most Likely To afirma: "todo mundo acha isso de você."

---

# 3. FILOSOFIA DO GAMEPLAY

## O julgamento é a mecânica

Não é uma enquete.
Não é uma pesquisa.

É um tribunal sem defesa.

O grupo delibera em silêncio, cada um no seu telefone.
Depois, o veredicto é revelado para todos simultaneamente.

A pessoa mais votada não perde — ela é nomeada.
Ser nomeado é o estado emocional central do jogo.

## O prompt é o gatilho

O prompt não é uma pergunta.
É uma afirmação sobre o grupo, disfarçada de pergunta.

"quem mais provavelmente esqueceria de pagar a conta?"
→ o grupo já tem uma resposta. O prompt só dá permissão para dizê-la.

## O reveal é o coração

O momento entre "todos votaram" e "o nome aparece" é o produto.

Tudo antes do reveal é setup.
Tudo depois do reveal é reação.

O app existe para criar e sustentar esse momento.

## O telefone sai do caminho

Após o reveal, o app não deve competir pela atenção.

A reação acontece no mundo real:
risos, protestos, defesas, acusações.

O app aguarda em silêncio.
Só avança quando o grupo estiver pronto.

---

# 4. SISTEMA DE PROMPTS

## Estrutura de um prompt

Um prompt completo deve:

* ser curto (menos de 10 palavras)
* sugerir uma situação concreta
* ser universalmente interpretável
* gerar uma resposta imediata no grupo

Formato preferencial:
"quem mais provavelmente [ação/situação]?"

## Categorias por energia emocional

### Leve
Grupo novo ou início da noite.
Sem risco de desconforto real.

Exemplos:
- "quem mais provavelmente chegaria atrasado a um casamento?"
- "quem mais provavelmente passaria o final de semana inteiro assistindo série?"
- "quem mais provavelmente tentaria negociar desconto em tudo?"

### Médio
Grupo que já se conhece.
Alguma vulnerabilidade leve.

Exemplos:
- "quem mais provavelmente passaria a noite conversando com um estranho?"
- "quem mais provavelmente mentiria para não ir a uma festa?"
- "quem mais provavelmente chorava em filme de herói?"

### Intenso
Grupo de amigos próximos.
Exposição real, vulnerabilidade genuína.

Exemplos:
- "quem mais provavelmente guardaria um segredo errado?"
- "quem mais provavelmente se apaixonaria pela pessoa errada?"
- "quem mais provavelmente nunca pede ajuda mesmo precisando?"

## Modos de jogo por pack de prompts

### Clássico (MVP)
100% Leve + Médio.
Seguro para qualquer grupo.
Onboarding emocional natural.

### Sincero
60% Médio + 40% Intenso.
Para grupos com histórico e confiança.

### Sem Censura (futuro)
Prompts adultos.
Ativado explicitamente.
Não está no MVP.

## Sequência dos prompts

O primeiro prompt deve ser Leve, sempre.
O terceiro prompt pode ser Médio.
A partir do quinto, pode misturar.

O sistema deve evitar dois prompts Intensos consecutivos.
Evitar repetição de tema em sequência (dois sobre dinheiro, dois sobre relacionamento).

---

# 5. GAMEPLAY LOOP COMPLETO

## Configuração da sessão (host)

- selecionar pack de prompts
- definir número de rodadas (padrão: 10)
- iniciar

## Por rodada

### Fase 1 — Prompt (3s)

O prompt aparece na tela de todos simultaneamente.

Sem timer de leitura.
Sem narração.
Sem instrução.

Apenas a frase.

Intenção:
o silêncio de leitura coletiva já cria tensão.
Cada um está pensando a mesma coisa.

Duração: ~3 segundos de "absorção" antes da votação ficar disponível.
(Evita votos reflexivos imediatos — força uma pausa deliberada.)

### Fase 2 — Votação (timer: 30s)

Cada jogador vota em uma pessoa.

Regras:
- votação simultânea e secreta
- você não pode votar em si mesmo
- voto é travado após confirmação
- sem possibilidade de mudança

Enquanto todos não votam:
- contador: "X de N votaram" (sem nomes, sem direcionamento)
- copy: "o grupo está decidindo."

Quando todos votam:
- copy: "o grupo decidiu."
- reveal inicia automaticamente após ~1.5s de silêncio

Se o timer esgota antes de todos votarem:
- jogadores que não votaram são marcados com abstensão
- reveal inicia com os votos disponíveis
- sem penalidade, mas o grupo vê quem não votou

Timer: 30s é suficiente. A maioria decide em 5s — o timer cria urgência artificial que beneficia a autenticidade do voto.

### Fase 3 — Reveal (5-8s)

Ver seção dedicada abaixo.

### Fase 4 — Reação (indefinida)

Após o reveal completo:
o app mostra o resultado final e aguarda.

Sem countdown.
Sem pressão visual para continuar.
Sem animações loop.

O app está no silêncio.
O grupo está no caos.

O botão "próxima" aparece suavemente após ~4s.
Mas não pressiona.
O host controla o ritmo.

### Fase 5 — Transição para próxima rodada

Host pressiona "próxima →".
Nova rodada começa do Prompt.

Total por rodada: ~2-3 min com reação.
Jogo completo (10 rodadas): ~20-30 min.

---

# 6. O SISTEMA DE REVEAL

## Princípio central

O reveal não é uma lista de resultados.
É uma narrativa em três batidas.

Estrutura universal do reveal:

**batida 1: o contexto** — o prompt volta
**batida 2: a identidade** — o nome surge
**batida 3: a consequência** — os votos se revelam

## Sequência detalhada

### Beat 1: Silêncio pré-reveal (1.5s)
Todos votaram.
Copy: "o grupo decidiu."
Tela ainda não mudou.
Apenas o texto.
A antecipação é máxima aqui.

### Beat 2: O prompt retorna (fade in, 600ms)
O prompt aparece no centro da tela em serifItalico, muted.
A pergunta que todo mundo acabou de responder.
Isso reativa a memória do voto — cada um lembra em quem votou.

### Beat 3: Os cards dos jogadores surgem (stagger, 50ms entre cada)
Cards aparecem com apenas avatar + inicial.
Sem nomes visíveis ainda.
Sem votos visíveis ainda.
Anonimato deliberado — tensão antes do reveal.

Pausa: 800ms de cards anônimos. Silêncio.

### Beat 4: Os votos aparecem nos cards
Números de votos aparecem simultaneamente em todos os cards.
Sem ordem de importância ainda.
O grupo vê a distribuição completa.

### Beat 5: O card mais votado se destaca
O card da pessoa com mais votos cresce levemente (scale + border amber).
Uma pausa antes de revelar o nome.

### Beat 6: O nome aparece (serifDisplay, acento, spring)
O nome da pessoa mais votada é revelado no card expandido.
Abaixo: o número de votos.

Pausa de 1.5s. Silêncio total.
A tela está parada.
O grupo está reagindo.

### Beat 7: O prompt volta sob o nome
Uma linha em serifItalico abaixo do nome:
"[nome] é quem mais provavelmente [prompt]"

Isso cristaliza o momento: a pessoa foi nomeada por esta característica, nesta rodada, por este grupo.

### Resultado final (estado estático)
Tela mantém o resultado.
App silencioso.
Botão "próxima →" aparece suavemente após 4s.

## O que NÃO fazer no reveal

❌ Gráfico de pizza ou barra de progresso
❌ Porcentagens
❌ Reveal instantâneo (lista simples)
❌ Contador com efeito sonoro a cada voto
❌ Confetes ou celebrações visuais exageradas
❌ Countdown antes do reveal (quebra o silêncio)

## Em caso de empate

Dois nomes emergem simultaneamente no reveal.
Sem desempate automático.
Copy: "o grupo se dividiu."
Ambos os cards em destaque.
O grupo decide no mundo real quem "ganhou" aquela rodada.

---

# 7. PACING EMOCIONAL

## Arco de uma sessão completa

### Rodadas 1-3: Aquecimento

Prompts Leves.
O grupo está calibrando.
Primeiras risadas.
Primeiras surpresas ("não esperava que você votasse em mim").

Objetivo da UI: invisível. O grupo está se conhecendo de novo.

### Rodadas 4-7: Pico social

Prompts Médios entram.
O grupo já está quente.
Reações mais explosivas.
Votações mais ousadas.

Objetivo da UI: sustentar o ritmo sem interferir.

### Rodadas 8-10: Clímax e retrato

Os últimos prompts devem ser os mais memoráveis.
O grupo já tem contexto — cada reveal reativa conversas anteriores.
A sessão se torna uma narrativa coletiva.

Objetivo da UI: dar espaço máximo para reação entre rodadas.

## Curva de tensão intra-rodada

```
Prompt exibido
    ↓
Silêncio de leitura (tensão sobe)
    ↓
Votação (tensão plateau)
    ↓
"o grupo decidiu." (tensão máxima)
    ↓
Reveal (explosão)
    ↓
Reação (caos externo)
    ↓
Silêncio do app (deceleração)
    ↓
"próxima →" (reset)
```

## Timing crítico

| Momento | Duração | Rationale |
|---|---|---|
| Absorção do prompt | 3s | Força pausa deliberada antes do voto |
| Timer de votação | 30s | Cria urgência sem pressão real |
| Silêncio pré-reveal | 1.5s | Antecipação máxima após "o grupo decidiu." |
| Cards anônimos | 800ms | Tensão antes dos nomes |
| Nome em destaque | 1.5s | Deixa o momento existir antes da reação |
| Silêncio pós-reveal | 4s | O grupo reage. O app espera. |

---

# 8. DEAD ZONE PREVENTION

## Dead Zone 1: Waiting for all to vote

**Problema:** todos já votaram mentalmente, mas um jogador demora. Grupo estagna.

**Solução:**
- Timer de 30s cria limite natural
- Counter "X de N votaram" sem nomes preserva tensão
- Copy "o grupo está decidindo." em respiração lenta (não pulsação de loading)
- Quando todos votam: "o grupo decidiu." aparece + reveal inicia após 1.5s automático
- Não há botão para host disparar manualmente — o reveal acontece automaticamente

**Anti-padrão:** mostrar quem já votou. Isso cria pressão social e quebra o anonimato.

## Dead Zone 2: Reveal sem emoção

**Problema:** resultados aparecem como lista. Sem antecipação. Sem build.

**Solução:** sistema de reveal em 7 beats (ver seção 6).

**Anti-padrão:** mostrar resultados em grid estático imediatamente.

## Dead Zone 3: Entre rodadas — vazio de navegação

**Problema:** host precisa de múltiplos taps para avançar. Ritmo quebra.

**Solução:**
- Um único botão "próxima →"
- Aparece após 4s automaticamente (não antes)
- Aparece suavemente (sem bounce, sem call-to-action agressivo)
- Host toca → próxima rodada começa imediatamente

**Anti-padrão:** tela de configuração entre rodadas. Tela de loading. Botão "continuar" imediato (quebra reação).

## Dead Zone 4: Primeira rodada — grupo frio

**Problema:** primeiro prompt cai em grupo que ainda não entrou no clima.

**Solução:**
- Primeiro prompt sempre Leve
- Primeiro prompt deve ser universalmente reconhecível (algo que todo grupo tem)
- Exemplos: chegar atrasado, esquecer nomes, procrastinar
- O primeiro reveal é o onboarding emocional — precisa funcionar mesmo com grupo frio

## Dead Zone 5: Empate sem resolução

**Problema:** resultado empatado. Nada acontece. Momento morre.

**Solução:**
- Reveal mostra ambos os cards em destaque simultaneamente
- Copy: "o grupo se dividiu." em serifDisplay
- Sem desempate automático — a decisão fica no mundo real
- A tensão do empate é mais interessante que uma resolução técnica

---

# 9. ONBOARDING EMOCIONAL

## Princípio

O grupo nunca deve ler um tutorial.

O primeiro prompt é o tutorial.

## Sequência de onboarding

### No lobby
Copy: "todo mundo vai votar em quem melhor representa cada situação."
Uma frase. Nada mais.

### Na primeira rodada
Prompt aparece. Sem instrução.
O grupo entende imediatamente.

### Após o primeiro reveal
O grupo viu como funciona.
As próximas rodadas têm momentum natural.

## O prompt de abertura ideal

Deve ser:
- universalmente reconhecível
- levemente constrangedor
- garantido para gerar uma resposta clara no grupo

Recomendações para o primeiro prompt padrão:
- "quem mais provavelmente chegaria atrasado a um evento importante?"
- "quem mais provavelmente falaria sem parar numa viagem?"
- "quem mais provavelmente esqueceria o nome de alguém que acabou de conhecer?"

Esses prompts funcionam porque:
- todo grupo tem "aquela pessoa" para cada um
- são leves o suficiente para não intimidar
- geram reveal com resultados frequentemente unanimes (ou quase)
- o primeiro unanimous reveal é o gatilho de riso máximo

---

# 10. RETRATO SOCIAL (END GAME)

## O que é

Após as N rodadas, o app mostra um retrato social da sessão.

Não é um placar.
É um arquivo social.

## Conteúdo do retrato

### A fotografia do grupo
Cada jogador com as traits que ganhou durante a sessão.

Exemplo:
- Ana: "chegaria atrasado" · "choraria de emoção"
- Bruno: "esqueceria de pagar" · "mentiria educadamente"

### Destaques emocionais

**O mais nomeado da noite:**
A pessoa com mais rodadas ganhas.
Copy: "[nome] foi o mais nomeado da noite."
Serifitalico. Âmbar. Sem celebração exagerada.

**O voto mais unânime:**
A rodada com maior concentração de votos em um único jogador.
Copy: "o grupo foi unânime uma vez."

**A rodada mais dividida:**
A rodada com mais empate ou distribuição equilibrada.
Copy: "esse o grupo não conseguiu decidir."

## Tone do retrato

O retrato NÃO deve parecer um score ou ranking.
Deve parecer uma memória social coletiva.

Copy em serifItalico, muted, contemplativo.
Nenhuma cor primária.
Espaçamento generoso.

## Navegação do retrato

Após o retrato: opções para host:
- "jogar de novo" (mesmo pack, novas rodadas)
- "mudar de jogo"
- "encerrar"

---

# 11. MULTIPLAYER FLOW

## Estrutura de sincronização

```
HOST                          JOGADORES
 │                               │
 ├─ configura sessão             │
 ├─ inicia jogo                 │
 │                               │
 │◄──── todos recebem prompt ───►│
 │                               │
 │◄──── votação simultânea ─────►│
 │                               │
 │      (todos votaram)          │
 │                               │
 │◄──── reveal simultâneo ──────►│
 │                               │
 │      (reação no mundo real)   │
 │                               │
 ├─ host avança →               │
 │                               │
 │◄──── próximo prompt ─────────►│
```

## Garantias do sistema

- Todos jogadores veem o mesmo prompt simultaneamente
- Nenhum jogador vê o reveal antes dos outros
- Reveal dispara automaticamente quando todos votaram (ou timer esgota)
- O host não tem informação privilegiada durante a votação
- Desconexão durante votação: votos já feitos são preservados

## Estado público vs. privado

Estado público (visível para todos):
- prompt atual
- número de votos recebidos por rodada (após reveal)
- placar acumulado
- fase atual

Estado privado (apenas para o jogador):
- em quem ele votou (durante votação)

## Tratamento de disconnects

Jogador desconecta durante votação:
- slot marcado como "ausente"
- voto não conta
- reveal prossegue normalmente após timer

Host desconecta:
- co-host assume (jogador mais antigo na sala)
- sessão continua

---

# 12. ENGINES CONSUMIDAS

## Reutilizadas do Mr White

✅ RoomEngine — criação de sala, lobby, join, host management
✅ PresenceEngine — conexão, presença, reconexão
✅ VotingEngine — votação simultânea, anonimato, tally

## Novas (a implementar inline, sem abstração prematura)

### PromptEngine (inline no MVP)
Responsabilidades:
- seleção de prompts por pack e modo
- sequenciamento (evitar repetição de tema)
- progressão de energia (Leve → Médio)
- tracking de prompts já usados na sessão

Não abstrair como engine até Most Likely To validar o padrão.
Em Eu Nunca ou Most Likely To 2.0, extrair PromptEngine.

### RevealEngine (inline no MVP)
Responsabilidades:
- orquestração dos 7 beats do reveal
- timing dos estados
- cálculo do mais votado / empate

Não abstrair como engine até o padrão se repetir em outro jogo.

## Por que não abstrair agora

A regra do GAME_ENGINE.md é clara:
"only abstract after repeated validated usage across multiple games."

Mr White usou VotingEngine — ele está validado.
PromptEngine e RevealEngine ainda não existem em outro jogo.
Construir as engines antes da validação é overengineering.

---

# 13. DIFERENCIADORES DO ENTRE NÓS

## O que versões genéricas fazem

A maioria dos apps de Most Likely To:
- mostram um contador de votos em lista
- têm UI colorida e casual
- não têm sistema de pacing
- o reveal é instantâneo
- não há arc narrativo na sessão

## O que o Entre Nós entrega diferente

| Dimensão | Apps genéricos | Entre Nós |
|---|---|---|
| Reveal | lista instantânea | 7 beats cinematográficos |
| Waiting state | spinner ou contador | "o grupo está decidindo." |
| Pacing | nenhum | timer deliberado + silêncio pós-reveal |
| End game | placar | retrato social |
| Tom visual | colorido, casual | quente, intimista, cinematográfico |
| Prompt sequencing | aleatório | progressão emocional calibrada |

---

# 14. O QUE NÃO CONSTRUIR

## Anti-padrões de produto

❌ Sistema de "pontuação" como foco central
→ Pontos existem, mas o retrato social importa mais que o placar.

❌ Reveal com gráfico de pizza ou barra de progresso
→ Visualizações de dados quebram a atmosfera emocional.

❌ Botão "ver quem votou em quem" individualmente
→ Anonimato de quem votou em quem deve ser preservado.
→ Revelar isso cria constrangimento desnecessário e quebra o jogo.

❌ Chat ou reações digitais durante o jogo
→ A reação acontece no mundo real. O app não deve competir.

❌ "Modo solo" — um jogador passando o telefone
→ Most Likely To perde quase todo valor emocional sem múltiplos dispositivos.
→ Não é o design target. Não implementar.

❌ Timer visível durante votação como barra de progresso
→ Gera ansiedade técnica, não tensão social.
→ Counter simples "X de N votaram" é suficiente.

## Anti-padrões de UI

❌ Confetes no reveal
→ Destrói a atmosfera. Quem recebe muitos votos não está "ganhando" de forma festiva.

❌ Cores saturadas nos cards de jogadores
→ O reveal é âmbar + serifDisplay. Não competir com o sistema visual do Mr White.

❌ Animações de celebração exageradas
→ A reação do grupo supera qualquer animação. O app apenas anuncia — o grupo celebra.

❌ Prompt com mais de uma linha em destaque
→ O prompt deve ser uma frase. Curta. Sem explicação.

---

# 15. PROMPTS DE REFERÊNCIA — MVP

Uma seleção inicial de prompts para o pack Clássico, calibrados por energia:

## Leve (primeiras rodadas)

1. "quem mais provavelmente chegaria atrasado a um casamento?"
2. "quem mais provavelmente tentaria negociar o preço de tudo?"
3. "quem mais provavelmente assistiria uma série inteira num fim de semana?"
4. "quem mais provavelmente esqueceria o nome de alguém que acabou de apresentar?"
5. "quem mais provavelmente mandaria mensagem no horário errado para a pessoa errada?"
6. "quem mais provavelmente compraria algo que nunca vai usar?"
7. "quem mais provavelmente se perderia mesmo com GPS?"

## Médio (a partir da 3ª rodada)

8. "quem mais provavelmente mentiria para não comparecer a um compromisso?"
9. "quem mais provavelmente passaria a noite conversando com um desconhecido?"
10. "quem mais provavelmente choraria num filme de ação?"
11. "quem mais provavelmente diria 'estou bem' quando não está?"
12. "quem mais provavelmente nunca admite que errou primeiro?"
13. "quem mais provavelmente seria o primeiro a ir embora de uma festa?"
14. "quem mais provavelmente seria o último a ir embora de uma festa?"
15. "quem mais provavelmente guardaria um segredo por anos?"

## Intenso (a partir da 6ª rodada, modo Sincero)

16. "quem mais provavelmente nunca pede ajuda mesmo precisando?"
17. "quem mais provavelmente se apaixonaria pela pessoa mais complicada possível?"
18. "quem mais provavelmente faria uma grande mudança sem contar para ninguém?"
19. "quem mais provavelmente revelaria um segredo do grupo sem querer?"
20. "quem mais provavelmente estaria pensando em algo completamente diferente agora?"

---

# 16. PRINCÍPIO FINAL

Most Likely To não mede nada.

Não existe resposta certa.
Não existe vencedor real.
Não existe ranking que importa.

O que existe:
um momento em que o grupo se vê coletivamente
e ri — ou fica desconfortável —
com o que vê.

O app não organiza o julgamento.
O app cria a condição para que o julgamento aconteça.

E então sai do caminho.
