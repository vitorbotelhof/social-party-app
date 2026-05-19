# MOST LIKELY TO — ONBOARDING EMOCIONAL BLUEPRINT

## Versão
0.1 — Pré-implementação

---

# 1. FILOSOFIA CENTRAL

## O problema que estamos resolvendo

A maioria dos apps de Most Likely To mata o jogo antes do primeiro prompt.

Como? Com onboarding.

Regras explicadas em bullet points.
"Toque em um jogador para votar."
"O voto é secreto."
"O resultado aparece quando todos votarem."

O jogador lê isso e pensa:
"entendi. vou responder perguntas."

Morreu.

---

## A alternativa

O grupo não precisa aprender o jogo.
O grupo precisa sentir o que vai acontecer.

A diferença:

| Onboarding padrão | Entre Nós |
|---|---|
| explica mecânica | cria estado emocional |
| briefing antes do jogo | atmosfera que antecede o momento |
| o jogador entende | o jogador antecipa |
| "vou responder perguntas" | "o grupo vai revelar o que pensa sobre mim" |

---

## Princípio operacional

**O primeiro prompt é o tutorial.**

Tudo antes do primeiro prompt é preparação emocional — não instrução.

"quem mais provavelmente chegaria atrasado a um evento importante?"

Essa frase ensina:
- o formato do jogo (formato de quem)
- o que o jogador deve fazer (escolher uma pessoa)
- o que está sendo avaliado (um comportamento)
- que não existe resposta certa (é julgamento)

Nenhum bullet point faz o que esse prompt faz em 0.8 segundos.

---

# 2. O QUE PODE SER ENSINADO vs. O QUE NÃO PODE

## Pode ser ensinado pelo contexto

✅ Como votar — a UI de cards com avatares é autoexplicativa
✅ Que o voto é secreto — o ato de votar no próprio celular implica isso
✅ Que o reveal acontece depois — o waiting state "o grupo está decidindo." comunica isso
✅ Que não se pode votar em si mesmo — o card do jogador atual simplesmente não responde ao toque
✅ Que o host controla o ritmo — o botão "próxima →" aparece apenas para o anfitrião

## Não pode — e não deve — ser ensinado

❌ O tom emocional do jogo — precisa ser sentido, não descrito
❌ Que o reveal vai ser tenso — explicar tensão destrói tensão
❌ Que "ser nomeado é divertido" — isso só funciona depois de ser nomeado
❌ Que o grupo vai rir — prometer humor antes garantia que não acontece

A regra:
**qualquer coisa que possa ser aprendida pela experiência não deve ser dita antes dela.**

---

# 3. LIMITE DE TEXTO POR MOMENTO

| Momento | Máximo aceitável | O que nunca aparece |
|---|---|---|
| Hero card | 1 frase (≤ 8 palavras) | descrição de mecânica, regras, "como funciona" |
| Lobby (antes de iniciar) | 1 frase ou 0 | bullet points, instruções numeradas, regras |
| Transição para primeiro prompt | 0 palavras | qualquer texto que não seja o prompt |
| Tela de votação | contador + copy mínima | tutorial de como votar, lembretes de regra |
| Waiting state | 1 frase | progresso de quem votou, countdown numérico |
| Reveal | copy cinematic (seção 6) | "parabéns", percentagens, "você acertou" |

**Regra geral:**
Se a frase explica como jogar, cortar.
Se a frase cria antecipação emocional, manter.

---

# 4. OS 6 MOMENTOS DO ONBOARDING

## Momento 1 — O Cartão Antes de Entrar

**Onde:** tela de seleção de jogo / hero card

**Objetivo emocional:**
Fazer o jogador sentir que vai ser julgado pelo grupo.
Não que vai "jogar um jogo de votação".

**Copy recomendada (escolher uma):**

```
"o grupo sabe mais do que você imagina."
```

```
"todo mundo já pensou isso."
```

```
"o grupo vai decidir quem é quem."
```

**Rationale:**
Cada uma dessas frases direciona o pensamento para o grupo — não para o jogo.
"o grupo sabe mais do que você imagina" cria imediatamente a sensação de exposição.
O jogador pensa nas pessoas que estarão na sala, não nas regras.

**O que nunca aparece aqui:**
- "jogo de votação"
- "vote em quem mais..."
- "descubra o que o grupo acha"
- qualquer explicação de mecânica

**Timing:** passivo — o usuário lê enquanto decide se quer jogar.

---

## Momento 2 — O Lobby (grupo se formando)

**Onde:** sala de espera enquanto todos entram

**Objetivo emocional:**
A presença física dos colegas na tela já cria o clima.
Cada avatar que aparece é um potencial juiz — e um potencial alvo.

**Copy recomendada:**

```
"o grupo vai revelar o que pensa."
```

Ou, sem copy — apenas os avatares aparecendo.

**Rationale:**
O lobby não precisa de texto porque o conteúdo emocional já está lá: os rostos das pessoas que vão te julgar.
Ver "Ana entrou." "Bruno entrou." é mais poderoso que qualquer copy.

Se precisar de copy, que seja uma frase — e que fale do grupo, não das regras.

**O que nunca aparece aqui:**
- "Aguarde todos os jogadores entrarem para iniciar"
- "O host vai iniciar o jogo"
- "Quando todos estiverem prontos..."
- instruções de qualquer tipo

**Timing:** indeterminado — aguarda o grupo completar.

---

## Momento 3 — O Host Inicia / Transição

**Onde:** entre o lobby e o primeiro prompt

**Objetivo emocional:**
Silêncio antes da tempestade.
O equivalente visual de luzes do cinema apagando.

**Design:**
Fade para preto.
Zero texto.
Duração: ~800ms.

**Rationale:**
O silêncio visual diz: "isso está prestes a começar."
Qualquer texto aqui seria explicação chegando tarde.
O grupo já sabe que algo vai acontecer. A transição confirma.

**O que nunca aparece aqui:**
- "Rodada 1 de 10"
- "Prepare-se!"
- "O jogo vai começar..."
- loading spinner com texto

**Timing:** ~800ms — não pode ser skipped, não pode ser longo.

---

## Momento 4 — O Primeiro Prompt (o tutorial real)

**Onde:** primeiro prompt da sessão

**Objetivo emocional:**
O momento em que o jogador entende tudo.
Não porque leu um manual — porque pensou em uma pessoa específica.

**O prompt ideal de abertura:**

```
"quem mais provavelmente chegaria atrasado a um evento importante?"
```

ou

```
"quem mais provavelmente falaria sem parar numa viagem longa?"
```

ou

```
"quem mais provavelmente esqueceria o nome de alguém que acabou de conhecer?"
```

**Por que esses prompts funcionam como tutorial:**

1. Todo grupo tem "aquela pessoa" para cada uma dessas situações
2. A resposta vem em menos de 1 segundo — sem esforço cognitivo
3. O formato "quem mais provavelmente [X]?" comunica: escolha uma pessoa
4. A leveza garante que ninguém se sinta ameaçado na primeira rodada

**O que aparece na tela além do prompt:**

```
[prompt em destaque — serifItalico, grande]

[cards de jogadores abaixo — apenas avatares, sem instrução]
```

Nenhum texto explica o que fazer. Os cards existem para ser tocados. O jogador toca.

**Timing de absorção (3s antes de ativar votação):**
Essa pausa é o tutorial invisível.
O jogador lê. Pensa em alguém. Olha para essa pessoa na vida real.
Esse momento — o olhar furtivo — é o onboarding emocional acontecendo.

---

## Momento 5 — Primeiro Voto

**Onde:** tela de votação, após o jogador escolher

**Objetivo emocional:**
Confirmação silenciosa. O jogador votou. Agora aguarda.

**Copy:**
```
"você votou."
```

Nada mais.

**Rationale:**
Não existe "você votou com sucesso" ou checkmark animado com confete.
A confirmação é discreta — porque o momento real ainda está por vir.
O jogador está guardando o segredo. A UI respeita isso.

**O que nunca aparece:**
- "Aguardando os outros jogadores" (mecânico)
- "Seu voto foi registrado com sucesso" (corporativo)
- Visualização de quem já votou (quebra anonimato)
- Countdown numérico visível (cria ansiedade técnica, não social)

---

## Momento 6 — Primeiro Reveal (cristalização)

**Onde:** reveal da primeira rodada

**Objetivo emocional:**
Esse é o momento em que tudo faz sentido — não intelectualmente, mas emocionalmente.
O primeiro reveal ensina o jogo definitivamente.

**O que o reveal ensina sem dizer:**
- Como o resultado aparece (progressivamente, não de uma vez)
- Que o nome do mais votado é o último a aparecer
- Que esse momento é tenso — e divertido
- Que a reação acontece no mundo real, não no app

**A sensação target após o primeiro reveal:**

"ah. é isso."

Dito em voz alta, com risada.

**Por que o primeiro prompt deve gerar unanimidade (ou quase):**
Prompts como "chegaria atrasado" ou "falaria sem parar" frequentemente resultam em maioria de votos numa pessoa só.
Quando o reveal mostra 4 de 6 votos numa pessoa, o impacto é imediato.
O grupo ri. A pessoa ri (e protesta).
Esse momento ensina: nomeado não é punição, é espelho.

---

# 5. COPY MESTRE — HIERARQUIA POR MOMENTO

## Hero Card
```
"o grupo sabe mais do que você imagina."
```

## Lobby
```
"o grupo vai revelar o que pensa."
```
(ou sem copy — apenas avatares)

## Transição início → primeiro prompt
```
[zero texto]
[fade to near-black, 800ms]
```

## Tela de votação (durante)
```
"o grupo está decidindo."
[contador: X de N votaram]
```

## Tela de votação (todos votaram)
```
"o grupo decidiu."
```

## Confirmação de voto individual
```
"você votou."
```

## Reveal — beat final
```
"[nome] é quem mais provavelmente [prompt]."
```

## Retrato social (fim de sessão)
```
"[nome] foi o mais nomeado da noite."
```

---

# 6. O HOOK EMOCIONAL PRIMÁRIO

## A sensação que queremos criar antes do primeiro prompt:

```
"o grupo vai revelar o que pensa sobre mim."
```

## Como chegamos lá sem dizer isso:

**Passo 1 — Hero card:**
"o grupo sabe mais do que você imagina."
→ planta a ideia de que o grupo tem opiniões sobre você

**Passo 2 — Lobby:**
os rostos das pessoas que conhece aparecem na tela
→ o grupo fica concreto; não é abstrato

**Passo 3 — Silêncio da transição:**
fade para preto
→ algo está para acontecer

**Passo 4 — Primeiro prompt:**
"quem mais provavelmente chegaria atrasado a um casamento?"
→ o jogador pensa em uma pessoa. e imediatamente sente que as outras pessoas estão pensando nele.

Esse ciclo leva ~15 segundos.
Zero texto explicando o jogo.
Zero instruções.
Estado emocional completo.

---

# 7. ENSINAR SEM PARECER TUTORIAL

## O princípio

Tutoriais são instrução antes da experiência.
Onboarding emocional é a experiência como instrução.

## As 4 formas de ensinar sem tutorial:

### 1. UI autoexplicativa
Cards com avatares de jogadores não precisam de legenda "toque para votar".
A presença de cards interativos num contexto de "quem mais provavelmente X?" é autoexplicativa.

### 2. Mecânicas implícitas por ausência
Você não pode votar em si mesmo → seu card simplesmente não reage ao toque.
Voto é secreto → você não vê quem o outros escolheram.
Nenhuma explicação necessária.

### 3. Timing deliberado como professor
3 segundos de absorção antes de ativar a votação.
Esse atraso não é loading — é uma pausa pedagógica invisível.
O jogador usa esse tempo para ter a resposta antes de poder agir.

### 4. O primeiro reveal como aula magistral
O reveal em 7 beats demonstra:
- a progressão do silêncio ao resultado
- que o nome demora a aparecer (não é lista)
- que a reação pertence ao grupo, não ao app
O jogador entende o jogo completo ao final do primeiro reveal.

---

# 8. PACING EMOCIONAL DO ONBOARDING

## Curva de estados emocionais

```
Antes de jogar:
    curiosidade ("o que vai acontecer?")
         ↓
Lobby:
    antecipação social ("quem vai ser quem aqui?")
         ↓
Transição:
    silêncio de cinema ("isso vai começar")
         ↓
Primeiro prompt:
    reconhecimento imediato ("essa pessoa, com certeza")
         ↓
Votação:
    cumplicidade secreta ("eu sei em quem votei")
         ↓
Waiting state:
    tensão coletiva ("o que o grupo decidiu?")
         ↓
Reveal:
    explosão social ("TODOS votaram nela??")
         ↓
Reação:
    caos compartilhado ("isso faz sentido demais")
         ↓
Silêncio do app:
    espaço para o grupo
         ↓
Próxima rodada:
    momentum estabelecido
```

## Tempo total até entendimento completo do jogo:

| Fase | Duração | O que é aprendido |
|---|---|---|
| Hero card | passivo | "vou ser julgado pelo grupo" |
| Lobby | ~30-60s | "esses são os meus juízes" |
| Transição | 0.8s | "começa agora" |
| Absorção do prompt | 3s | "ah, eu já sei em quem voto" |
| Votação | ~5-15s | "é só tocar" |
| Waiting | ~10-30s | "o grupo está decidindo" |
| Reveal | ~8-10s | "assim funciona. entendi tudo." |
| **Total** | **~2-3 minutos** | **jogo completamente aprendido** |

Nenhuma instrução explícita usada.

---

# 9. ANTI-PADRÕES DE ONBOARDING

## Anti-padrões de copy

❌ "Neste jogo, você vai votar em quem melhor representa cada situação."
→ explicação de mecânica. soa como briefing corporativo.

❌ "Você não pode votar em si mesmo."
→ regra comunicada como regra. invisibilizá-la na UI é mais elegante.

❌ "O voto é secreto — ninguém saberá em quem você votou."
→ explicar o segredo destrói o segredo. o sigilo é sentido, não anunciado.

❌ "Quando todos votarem, o resultado será revelado automaticamente."
→ antecipar o reveal verbalmente destrói a tensão do reveal.

❌ "Divirta-se!" ou "Boa sorte!"
→ cheerleader. incompatível com o tom do app.

## Anti-padrões de UI

❌ Tela de "Como jogar" antes do primeiro prompt
→ morte da espontaneidade. o grupo ainda não precisa saber nada.

❌ Numeração explícita "Passo 1 de 3"
→ transforma onboarding em processo.

❌ Tooltips ou hints no primeiro uso
→ quebra a imersão. cria sensação de app ensinando como se usar.

❌ Animação de tutorial (mão clicando em card)
→ infantiliza o jogador. a UI deve confiar no jogador.

❌ Modal de confirmação antes do primeiro voto
→ "Tem certeza que quer votar em [nome]?" cria fricção desnecessária na primeira rodada.

❌ "Rodada 1 de 10" como elemento visual primário antes do prompt
→ o contador é contexto, não hero. o prompt é o hero.

## Anti-padrões de timing

❌ Permitir votar imediatamente ao aparecer o prompt (0s de absorção)
→ voto reflexivo antes do pensamento social. destrói a dinâmica de grupo.

❌ Tutorial em tela separada antes do lobby
→ o grupo nem formou ainda. ninguém está pronto para aprender.

❌ Forçar todos a "confirmar que entenderam" antes de iniciar
→ checkbox de concordância é logística, não experiência.

---

# 10. VARIAÇÕES POR CONTEXTO

## Grupo com iniciante absoluto (nunca jogou)

**O que acontece:** o iniciante não sabe o que vai acontecer, mas o prompt é tão claro que ele vota sem hesitar.

**O que não fazer:** pausar para explicar para ele. O reveal vai ensinar.

**Copy adicional: zero.**

---

## Grupo que já jogou antes

**O que acontece:** o grupo pula o estado de "o que é isso?" e vai direto para "quem vai ser nomeado dessa vez?"

**O que o onboarding entrega diferente para eles:** nada diferente. A mesma abertura funciona — porque não é sobre aprender, é sobre entrar no estado.

---

## Host inexperiente (jogando pela primeira vez)

**Potencial problema:** host não sabe o que vai aparecer na tela dele.

**Solução no lobby:**
O host vê uma linha extra, visível apenas para ele:

```
"quando todos entrarem, inicie."
```

Apenas isso. A instrução do host é mínima porque a interface é autoexplicativa.
Após o primeiro reveal, o botão "próxima →" aparece. Ele sabe o que fazer.

---

# 11. O PRIMEIRO PROMPT COMO DESIGN DECISION

## Por que o primeiro prompt é um produto editorial

O primeiro prompt não é apenas o primeiro elemento do jogo.
É o onboarding funcional do produto.

Se o primeiro prompt falhar:
- o grupo não ri
- o reveal não tem impacto
- o "entendi" não acontece
- o jogador fica no modo "respondendo perguntas"

Se o primeiro prompt funcionar:
- o grupo ri antes do reveal
- o reveal é a explosão de algo que já estava construído
- o jogador está no modo "o grupo está me julgando"

## Critérios para o primeiro prompt padrão (hard-coded):

| Critério | Rationale |
|---|---|
| Situação universalmente reconhecível | todo grupo tem "aquela pessoa" |
| Voto consensual esperado | maioria de votos numa pessoa = reveal impactante |
| Leveza garantida | ninguém se sente ameaçado na abertura |
| Formato "quem mais provavelmente X" claro | a instrução está dentro do prompt |
| Sem possibilidade de interpretação ambígua | primeiro prompt não é hora de nuance |

## Candidatos para primeiro prompt padrão:

```
"quem mais provavelmente chegaria atrasado a um evento importante?"
```

Este é o mais forte:
- todo grupo tem "aquela pessoa"
- gera voto quase unânime em grupos próximos
- leveza total — ninguém leva a sério atrasos de amigos
- o reveal de unanimidade no primeiro round é o gatilho de riso máximo do jogo

---

# 12. RATIONALE EMOCIONAL FINAL

## Por que zero tutorial funciona

O ser humano aprende por imitação e por consequência — não por instrução prévia.

O primeiro prompt cria imitação:
todo mundo está fazendo a mesma coisa (olhando para o celular, pensando em alguém, votando em silêncio).

O primeiro reveal cria consequência:
alguém é nomeado, o grupo reage, a pessoa reage.

Esses dois eventos juntos ensinam o jogo completamente.
Sem texto adicional.
Sem tutorial.

## Por que o estado emocional importa mais que a compreensão mecânica

Um jogador que entende as regras mas não sente o que está em jogo vai votar mecanicamente.

Um jogador que não entende completamente as regras mas sente que "o grupo vai revelar o que pensa sobre mim" vai jogar autenticamente.

O onboarding emocional serve o jogo.
O tutorial de regras serve o app.

O Entre Nós serve o jogo.

## O que o grupo sente ao final do onboarding

Ao final do primeiro reveal, o grupo sente:

```
"isso é sobre nós."
```

Não:
```
"esse jogo funciona assim."
```

Essa distinção é o produto.

---

# 13. RESUMO EXECUTIVO

**O onboarding do Most Likely To tem seis momentos e zero tutoriais.**

| Momento | Duração | Copy | Objetivo |
|---|---|---|---|
| Hero card | passivo | "o grupo sabe mais do que você imagina." | primar exposição |
| Lobby | ~1 min | "o grupo vai revelar o que pensa." | tornar o grupo concreto |
| Transição | 0.8s | [zero] | silêncio de abertura |
| Primeiro prompt | 3s absorção | o prompt IS the onboarding | "eu já sei em quem voto" |
| Primeiro voto | imediato | "você votou." | confirmação silenciosa |
| Primeiro reveal | ~8s | copy cinematic | "entendi tudo" |

**Total de palavras de instrução explícita: zero.**

**Total de palavras de copy emocional: < 30.**

**Tempo até compreensão completa: ~2-3 minutos, aprendidos por experiência.**

**Estado emocional criado: "o grupo vai revelar o que pensa sobre mim." — sem nunca usar essas palavras.**
