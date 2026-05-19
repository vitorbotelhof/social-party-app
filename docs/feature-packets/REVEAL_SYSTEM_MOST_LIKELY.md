# MOST LIKELY TO — REVEAL SYSTEM BLUEPRINT

## Versão
0.1 — Pré-implementação

---

# 1. PRINCÍPIO CENTRAL

O reveal não é um resultado.
É uma narrativa de julgamento coletivo.

O grupo votou em silêncio.
Ninguém sabe o que os outros escolheram.
O reveal é o momento em que o inconsciente coletivo se torna público.

A sequência não entrega informação — ela entrega drama.

---

# 2. ARQUITETURA EMOCIONAL

O reveal tem três arcos emocionais distintos:

## Arco A: Antecipação (beats 1–4)

O grupo ainda não sabe quem ganhou.
A tensão é máxima.
Cada jogador está relembando em quem votou.
Cada jogador está se perguntando: "votaram em mim?"

**Design goal:** sustentar a dúvida. Não revelar nada ainda.

## Arco B: Veredicto (beats 5–6)

Os votos chegam. O vencedor emerge.
O nome é o clímax.

**Design goal:** máximo impacto no momento do nome.

## Arco C: Cristalização (beat 7 + silêncio)

O nome é associado ao prompt para sempre.
O app vai embora.
O grupo reage.

**Design goal:** o app sai do caminho em menos de 1s após o nome aparecer.

---

# 3. SEQUÊNCIA COMPLETA — 7 BEATS

## Pré-condição

A engine detectou `subFase: 'reveal'`.
A tela de votação dissolve.
A tela de reveal abre em preto limpo.

---

## Beat 0 — Escuridão intencional (300ms)

Tela completamente vazia.
Preto. Silêncio.

Intenção: redefine o contexto. A votação terminou. Algo novo está prestes a acontecer. Os 300ms de nada são uma pausa editorial — como a batida de silêncio antes de um acorde importante.

**Animação:** nenhuma.
**Elementos:** nenhum.
**Timing:** 0–300ms.

---

## Beat 1 — "o grupo decidiu." (0ms → 900ms)

O único elemento na tela.

```
Typography:  serifDisplay (PlayfairDisplay_700Bold)
Text:        "o grupo decidiu."
Size:        tamanhoSubtituloGrande (24px)
Color:       cores.texto (#F0EAE0)
Align:       center
Position:    centro vertical ligeiramente acima do meio (-10%)
```

**Animação de entrada:**
- `opacity`: 0 → 1, duration: 600ms, ease-out
- `translateY`: 10 → 0, duration: 600ms, ease-out

**Permanece:** o texto fica estático por ~900ms após entrar.
Total no beat: ~1500ms.

**Por que serifDisplay e não serifItalico:**
Esse é um momento de afirmação. Não de sugestão. O Playfair Bold tem peso de sentença.

---

## Beat 2 — Prompt retorna (delay: 1500ms)

"o grupo decidiu." dissolve. O prompt ocupa o topo da tela.

**"o grupo decidiu." saída:**
- `opacity`: 1 → 0, duration: 300ms, ease-in
- Antes de qualquer outro elemento aparecer

**Prompt entrada (delay: 1800ms):**
```
Typography:  serifItalico (PlayfairDisplay_400Regular_Italic)
Text:        [texto completo do prompt]
Size:        tamanhoCorpoMenor (15px)
Color:       cores.textoMudo (#6B5A4A)
Align:       center
Position:    topo, paddingTop = 20% da altura
```

**Animação:**
- `opacity`: 0 → 1, duration: 500ms, ease-out
- `translateY`: 8 → 0, duration: 500ms, ease-out

**Por que o prompt retorna:**
Quando o vencedor for revelado, o grupo precisa lembrar **por que** está vendo esse nome. O prompt reativa a memória do voto individual de cada pessoa. O momento de reconhecimento ("ah, eu votei nele por causa disso") amplifica a reação.

---

## Beat 3 — Cards anônimos surgem (delay: 2300ms, stagger: 60ms)

Os cards dos jogadores aparecem em grid, sem nomes e sem votos.

**Layout do grid (por número de jogadores):**

| N | Layout |
|---|--------|
| 3 | 3 em linha |
| 4 | 2 × 2 |
| 5 | 3 em cima + 2 embaixo |
| 6 | 3 × 2 |
| 7 | 4 + 3 |
| 8 | 4 × 2 |
| 9 | 3 × 3 |
| 10 | 4 + 3 + 3 |

**Anatomia do card anônimo:**

```
Tamanho:     72 × 72px
BorderRadius: raio.lg (12px)
Background:  cores.superficie
Border:      cores.borda, 1px
Conteúdo:    avatar com gradiente + letra inicial (40px)
Nome:        invisível
Votos:       invisível
```

**Animação por card (stagger 60ms entre cada):**
- `opacity`: 0 → 1, duration: 350ms, ease-out
- `scale`: 0.82 → 1, duration: 350ms, ease-out

**Por que stagger de 60ms:**
50ms é muito rápido — parece uma lista carregando. 60ms é deliberado. Cada card "chega" individualmente. O grupo inconscientemente tenta identificar cada avatar (pela cor do gradiente ou pela inicial) antes do nome aparecer.

---

## Beat 4 — Silêncio dos cards (800ms)

Todos os cards estão visíveis.
Nenhum nome.
Nenhum voto.
A tela simplesmente existe.

**Animação:** nenhuma.
**Duração:** 800ms.

Este é o momento de maior tensão do reveal.

O grupo está olhando para avatares anônimos sabendo que os votos já foram contados. Cada pessoa está calculando: "será que votaram em mim?"

Os 800ms não são um delay de loading.
São o silêncio antes da sentença.

**Anti-padrão:** não adicionar nenhuma animação de "loading" ou "processando" aqui. O silêncio é intencional.

---

## Beat 5 — Nomes e votos emergem (delay: ~3900ms)

Todos os nomes e contagens de votos aparecem **simultaneamente** em todos os cards, **exceto no vencedor**.

### 5a — Cards com 0 votos:

```
Nome aparece:  fade-in, 250ms, serifItalico, cores.textoMudo
Badge votos:   "0 votos" — não mostrar (omitir badge)
Card opacity:  0.45 (suavemente, 400ms)
```

Razão: cards com 0 votos ficam em segundo plano. Não precisam de badge — a ausência de votos é comunicada pela opacidade.

### 5b — Cards com 1+ votos (exceto vencedor):

```
Nome aparece:  fade-in, 300ms, serifItalico, cores.textoSecundario
Badge votos:   "N voto(s)" — aparece no canto sup. direito
               Fundo: cores.superficie
               Borda: cores.borda, 1px
               Texto: tamanhoMicro (12px), pesoMedio, textoSecundario
Card opacity:  1.0
```

### 5c — Card do vencedor (hidden, ainda):

```
Nome:          NÃO aparece ainda (avatar + inicial apenas)
Badge votos:   mostra a contagem (o número mais alto), mas sem nome
               Fundo: cores.acentoEscuro
               Borda: cores.acento
               Texto: tamanhoMicro, acento
Card opacity:  1.0
Border:        cores.borda (ainda sem acento)
```

**Por que o vencedor mantém o nome escondido:**
Todos os outros cards revelaram seus nomes. O grupo já pode fazer as contas: o card sem nome é o vencedor. Mas é diferente deduzir e ter confirmação. A antecipação daquele único card sem nome concentra toda a atenção do grupo nele por ~600ms antes do beat 6.

**Animação dos badges:**
- `opacity`: 0 → 1, duration: 300ms, ease-out
- `scale`: 0.85 → 1, duration: 300ms (spring, tension: 70, friction: 8)
- Delay entre badge e nome: 0ms (simultâneos)

---

## Beat 6 — O vencedor é revelado (delay: ~4700ms)

O card do vencedor emerge. O nome aparece. O grupo reage.

**Sequência interna do beat 6:**

### 6a — Card se destaca (0ms):
```
Border:       cores.acento (#C9893A), 2px → animação: 0→1 opacidade, 300ms
Background:   cores.acentoEscuro (#2A1F0E) → animação: interpolação, 400ms
              [Atenção: requer useNativeDriver: false]
```

### 6b — Nome explode no card (delay: 200ms):
```
Typography:   serifDisplay (PlayfairDisplay_700Bold)
Color:        cores.acento (#C9893A)
Size:         tamanhoSubtitulo (20px) — maior que os outros cards
Animação:     opacity 0→1, 420ms
              scale spring: 0.82 → 1.0
              tension: 52, friction: 7
              (mesmo spring usado no OverlayTransicao)
```

### 6c — Haptic (simultâneo ao nome):
```
Haptics.notificationAsync(NotificationFeedbackType.Success)
```

### 6d — Outros cards recuam (delay: 300ms):
```
opacity: 1.0 → 0.35, duration: 400ms, ease-in
```

**Por que ease-in para os não-vencedores:**
ease-in significa que o fade começa devagar e acelera. É como "afundar". Os cards que não ganharam recuam naturalmente enquanto o vencedor avança.

---

## Beat 7 — Cristalização (delay: ~5500ms)

O nome está revelado. O grupo está reagindo.
O app adiciona um último elemento: a sentença completa.

```
Position:     abaixo do card vencedor, paddingTop: 24px
Typography:   serifItalico
Color:        cores.textoSecundario
Size:         tamanhoCorpoMenor (15px)
Text:         "[Nome] é quem mais provavelmente [prompt]"
Align:        center
LineHeight:   22px

Animação:     opacity 0 → 0.8, duration: 600ms, ease-out
              translateY: 6 → 0, duration: 600ms, ease-out
```

**Por que opacity 0.8 e não 1.0:**
A cristalização é uma legenda. Um subtítulo do momento. Não deve competir com o nome do vencedor. 0.8 cria hierarquia tipográfica sutil.

**Por que serifItalico e não serifDisplay:**
A sentença completa é editorial. É como uma legenda de fotografia. O itálico sugere: "esta é a memória desta rodada."

---

## Silêncio (delay: ~6100ms → ~10100ms)

A tela não faz mais nada por 4 segundos.

- Nenhuma nova animação
- Nenhum loop
- Nenhum pulso
- Nenhum contador regressivo
- Nenhuma instrução

O grupo está reagindo.
O app está presente mas quieto.
4 segundos é o tempo mínimo para uma primeira reação espontânea.

---

## Botão "próxima →" (delay: ~10100ms)

Aparece suavemente.

```
Typography:   serifItalico
Color:        cores.textoMudo
Opacity:      0.65 (animado: 0 → 0.65, 500ms, ease-out)
Size:         tamanhoLegenda (13px)
Text:         "próxima →"  [host]  |  "[nome-host] vai decidir" [não-host]
Position:     bottom safe area, centralizado
Padding:      espacamento.xl de padding inferior
```

**Regras de visibilidade do botão:**
- **Host:** "próxima →" (tela não-final) ou "encerrar" (última rodada)
- **Não-host:** não recebe botão. Vê a tela mas não pode avançar.

**Por que não aparecer antes de 4s:**
Se o botão aparecer logo, o host sente pressão para clicar. Isso encurta a reação do grupo. O host é o guardião do ritmo social — ele deve avançar quando O GRUPO estiver pronto, não quando o app indicar.

---

# 4. LINHA DO TEMPO COMPLETA

```
0ms      ───── Beat 0: escuridão (300ms)
300ms    ───── Beat 1: "o grupo decidiu." entra (600ms)
900ms    ───── Beat 1: texto estático (600ms de pausa)
1500ms   ───── "o grupo decidiu." sai (300ms)
1800ms   ───── Beat 2: prompt entra (500ms)
2300ms   ───── Beat 3: cards anônimos (stagger 60ms × N)
2300ms
+ (N×60) ───── Beat 4: silêncio dos cards (800ms fixo)
~3900ms  ───── Beat 5: nomes + votos (exceto vencedor)
~4700ms  ───── Beat 6: vencedor revelado (spring ~600ms)
~5500ms  ───── Beat 7: cristalização (600ms)
~6100ms  ───── Silêncio do app (4000ms)
~10100ms ───── "próxima →" aparece (500ms fade-in)
```

**Duração total até "próxima →" aparecer: ~10s**

Para 8 jogadores (N=8): Beat 3 dura 480ms → delays se ajustam proportionally.
A duração total varia ±1s dependendo do número de jogadores.

---

# 5. VARIAÇÃO: EMPATE

Quando `foiEmpate: true` e dois jogadores têm o mesmo número máximo de votos:

## Diferenças da sequência padrão

**Beat 5:** Nomes e votos aparecem em **todos** os cards, incluindo os dois empatados. Nenhum card fica com nome escondido.

**Beat 6 — variante empate:**

Os dois cards empatados se destacam **simultaneamente**:

```
Ambos:    border → cores.alerta (#FFB020), 2px
          background → cores.acentoEscuro (suave)
          names:  serifDisplay, cores.alerta (âmbar)
          scale spring: 0.9 → 1.02 (apenas leve — não explode)
          tension: 40, friction: 8
```

Haptic: `Haptics.impactAsync(ImpactFeedbackStyle.Medium)` — diferente do Success. Um empate não é uma vitória. É uma ambiguidade. O haptic medium comunica isso.

**Beat 7 — variante empate:**

A cristalização não nomeia um único vencedor. Fica silenciosa.
O grupo decide no mundo real.

```
Text:     "o grupo se dividiu."
          (não aparece a sentença "[Nome] é quem mais provavelmente...")
Typography: serifItalico, cores.textoMudo
Opacity:    0.7
```

**Botão "próxima →":** aparece após 3s (não 4s). O empate resolve-se mais rápido — a conversa já está acontecendo.

---

# 6. VARIAÇÃO: VOTAÇÃO UNÂNIME

Quando todos votam no mesmo jogador (N de N votos).

Beat 6 tem tratamento especial. O badge de votos mostra:

```
"todos votaram"  (em vez de "N votos")
```

A cristalização fica:

```
"todo o grupo escolheu [Nome]."
```

Em serifDisplay em vez de serifItalico. Uma afirmação, não uma legenda.

Esse é o momento mais poderoso do jogo.
A unanimidade não precisa de superlativo — ela fala por si.

---

# 7. CARD ANATOMY — ESPECIFICAÇÃO COMPLETA

## Card anônimo (Beat 3)

```
Dimensão:        72 × 72px
BorderRadius:    raio.lg (12px)
Background:      cores.superficie
Border:          1px, cores.borda
Conteúdo:        [LinearGradient avatar circle] + [inicial letra]
  Avatar size:   44px diameter
  Inicial:       fontSize 18, fontWeight pesoBold, cores.textoSobrePrimaria
```

## Card com nome + votos (Beat 5, não-vencedor)

```
[base do card anônimo]
+ Nome abaixo do avatar:
    fontSize: tamanhoMicro (12px)
    fontFamily: serifItalico
    color: cores.textoSecundario ou cores.textoMudo (0 votos)
    marginTop: 6px
    numberOfLines: 1
+ Badge votos (canto sup direito, se >0):
    Posição: absolute, top: -4, right: -4
    Size: auto, padding: 2px 6px
    BorderRadius: raio.pill
    Background: cores.superficie
    Border: 1px, cores.borda
    Text: "N voto(s)", tamanhoMicro, pesoMedio, textoSecundario
```

## Card vencedor antes do Beat 6

```
[base do card anônimo]
+ Badge votos maior:
    Background: cores.acentoEscuro
    Border: 1px, cores.acento
    Text: "N voto(s)", tamanhoMicro, pesoBold, acento
+ Nome: INVISÍVEL (opacity: 0)
```

## Card vencedor após Beat 6

```
Background:      cores.acentoEscuro (animado)
Border:          2px, cores.acento (animado)
+ Nome:
    fontSize: tamanhoSubtitulo (20px)  ← maior que os outros
    fontFamily: serifDisplay
    color: cores.acento
    marginTop: 8px
    spring: tension 52, friction 7
+ Badge votos:
    Background: cores.acento
    Text: "N voto(s)", pesoBold, textoSobrePrimaria
```

---

# 8. MOTION PHILOSOPHY

## As cinco leis do reveal

### 1. O silêncio é o produto

O Beat 4 (800ms de cards anônimos sem nenhuma animação) é o momento de maior tensão. É tentador preenchê-lo com algo — não preencher. O silêncio é intencional e inegociável.

### 2. Spring para identidade, timing para contexto

- **Contexto** (prompt, texto editorial, badge de votos): `Animated.timing` com ease-out.
- **Identidade** (nome do vencedor): `Animated.spring` com `tension: 52, friction: 7`.

A diferença é física. O spring tem massa. O nome do vencedor tem peso — não deve entrar como qualquer outro texto.

### 3. Exit mais rápido que enter

Quando os cards não-vencedores recuam (Beat 6d), eles somem em 400ms com ease-in. O vencedor entrou em 600ms+ com spring. A assimetria é intencional: o que recua é menos importante do que o que chega.

### 4. Amplitude crescente por beat

Cada beat tem mais impacto emocional que o anterior:

```
Beat 1:  texto quieto (1 elemento, opacity only)
Beat 2:  texto quieto (1 elemento, troca)
Beat 3:  múltiplos cards (stagger, scale + opacity)
Beat 4:  silêncio (zero)
Beat 5:  revelação parcial (múltiplos elementos simultâneos)
Beat 6:  clímax (spring + haptic + fade de background)
Beat 7:  conclusão (opacity + translateY suaves)
```

O clímax é o Beat 6. Tudo antes constrói para ele. Tudo depois é deceleração.

### 5. O app para antes do grupo parar

Beat 7 termina em ~6100ms. "Próxima →" aparece em ~10100ms. O app deliberadamente congela por 4 segundos antes de oferecer qualquer interação.

O tempo de reação humana a uma surpresa social é 2–5 segundos. Os 4s de silêncio cobrem esse intervalo e deixam o grupo iniciar a conversa sem interferência.

---

# 9. COPY SYSTEM COMPLETO

| Momento | Copy | Tipografia | Cor | Opacity |
|---|---|---|---|---|
| Beat 1 | "o grupo decidiu." | serifDisplay | cores.texto | 1.0 |
| Beat 2 | [prompt completo] | serifItalico | cores.textoMudo | 1.0 |
| Beat 5 nome (não-venc.) | [nome] | serifItalico | cores.textoSecundario | 1.0 |
| Beat 5 nome (0 votos) | [nome] | serifItalico | cores.textoMudo | 1.0 |
| Beat 5 badge (N > 0) | "N voto(s)" | sem-serif, pesoMedio | textoSecundario | 1.0 |
| Beat 6 nome (vencedor) | [nome] | serifDisplay | cores.acento | 1.0 |
| Beat 6 badge (vencedor) | "N votos" / "1 voto" | pesoMedio | textoSobrePrimaria | 1.0 |
| Beat 7 cristalização | "[nome] é quem mais provavelmente [prompt]" | serifItalico | textoSecundario | 0.8 |
| Próxima (host) | "próxima →" | serifItalico | textoMudo | 0.65 |
| Próxima (não-host) | nenhum | — | — | — |
| Empate beat 7 | "o grupo se dividiu." | serifItalico | textoMudo | 0.7 |
| Unânime badge | "todos votaram" | pesoMedio | textoSobrePrimaria | 1.0 |
| Unânime cristalização | "todo o grupo escolheu [nome]." | serifDisplay | texto | 1.0 |

---

# 10. ANTI-PATTERNS

## Visuais

❌ **Gráfico de barras ou pizza**
Visualizações de dados destroem a atmosfera. O reveal não é um relatório de pesquisa.

❌ **Confetes ou partículas**
A celebração é do grupo, não do app. Confetes infantilizam o momento e falsificam a emoção.

❌ **Animação de "loading" durante o Beat 4**
O silêncio dos cards anônimos é intencional. Adicionar um spinner ou pulso comunica "aguardando" em vez de "tensão".

❌ **Nome do vencedor como primeiro elemento revelado**
Elimina todo o build. O nome é o clímax, não a abertura.

❌ **Vote map individual ("João votou em Ana")**
Preservar o anonimato de quem votou em quem é não-negociável. Revelar o mapa individual cria constrangimento interpessoal destrutivo — diferente do constrangimento coletivo divertido que é o objetivo.

❌ **Revelar simultaneamente todos os votos de todas as rodadas anteriores**
Sem arqueologia de votos passados. Cada rodada é um momento isolado.

## Timing

❌ **Countdown antes do reveal**
"3... 2... 1..." gamifica o momento de forma errada. A tensão deve ser orgânica.

❌ **"Próxima →" aparecer antes de 4s**
Pressiona o grupo. O app não deve impor ritmo ao grupo — o grupo impõe ao app.

❌ **Reveal instantâneo (lista simples)**
Sem build. Sem antecipação. É informação, não drama.

❌ **Fechar o reveal automaticamente após N segundos**
O grupo pode estar no meio de uma conversa importante. Respeitar o ritmo social.

## Motion

❌ **Scroll horizontal entre cards durante o reveal**
Quebra o modelo mental. O reveal é uma apresentação, não um carrossel.

❌ **Animações em loop após o reveal completar**
Pulsos, respirações, rotações decorativas — qualquer animação contínua durante o silêncio pós-reveal é distração.

❌ **`useNativeDriver: false` desnecessário**
Todo o reveal usa apenas `opacity` e `transform` (scale, translateY). Todas as animações rodam no UI thread via `useNativeDriver: true`. Exceto a interpolação de `backgroundColor` do card vencedor (Beat 6a) — essa sim requer `useNativeDriver: false`.

---

# 11. DEAD ZONE PREVENTION

## Dead zone 1: O reveal parece lento

**Risco:** o grupo acha que o app travou durante os 800ms de silêncio (Beat 4).
**Solução:** os cards já estão visíveis (proof of life). O silêncio é percebido como antecipação, não loading, porque há elementos na tela.
**Diagnóstico:** se alguém mexer no celular durante o Beat 4, o reveal está funcionando como deveria — eles estão nervosos, não entediados.

## Dead zone 2: Ninguém reage após o reveal

**Risco:** o grupo assiste o reveal em silêncio e espera o botão "próxima →".
**Sintoma:** prompts sem personalidade suficiente para gerar reação.
**Solução:** acontece no sistema de prompts, não no reveal. O reveal bem executado não pode salvar um prompt fraco — e um prompt forte torna qualquer reação inevitável. O reveal apenas maximiza a amplitude da reação.

## Dead zone 3: Empate gera confusão sobre quem "ganhou"

**Risco:** dois cards em âmbar. O grupo não sabe como reagir.
**Solução:** "o grupo se dividiu." em copy explícito. O empate tem seu próprio drama — dois nomes dividindo a atenção gera discussão sobre "mas quem REALMENTE é esse prompt?".

## Dead zone 4: Host não sabe quando avançar

**Risco:** "próxima →" aparece antes do grupo terminar de reagir.
**Solução:** o botão aparece em 10s, mas é suave (opacity 0.65, sem borda, sem destaque). Não pressiona. O host vai clicar quando sentir que o grupo está pronto.

## Dead zone 5: Não-hosts ficam olhando a tela enquanto host avança

**Risco:** experiência assimétrica — host clica "próxima →" instantaneamente sem deixar o grupo reagir.
**Solução:** o botão só aparece para o host após 10s. Os não-hosts veem a mesma tela sem elemento de avanço. Isso cria pressão social implícita para o host aguardar o grupo — porque os não-hosts estão claramente na mesma tela, reagindo.

---

# 12. CONEXÃO COM O DESIGN SYSTEM EXISTENTE

## Padrões reutilizados de outras telas

| Padrão | Origem | Uso no Reveal |
|---|---|---|
| Spring `tension: 52, friction: 7` | OverlayTransicao (descoberto) | Beat 6: nome do vencedor |
| 3-beat reveal: label → hairline → nome | OverlayTransicao (descoberto), TelaEspera (TelaPalpiteMrWhite) | Arco estrutural do reveal |
| Slow breath 2400ms | RodapeEspera (TelaVotacao) | NÃO usar no reveal — silêncio é melhor |
| `serifDisplay` para identidade, `serifItalico` para contexto | Estabelecido em todo o produto | Beat 6 (nome) vs Beat 2/7 (prompt, cristalização) |
| `cores.acento` como cor de veredicto | OverlayTransicao, TelaPalpiteMrWhite | Card vencedor |
| Beat de silêncio antes do clímax | `'o grupo decidiu.'` em TelaVotacao | Beat 4 (800ms de cards anônimos) |
| Haptic Success em clímax | TelaVotacao (votar), TelaPalpiteMrWhite (enviar) | Beat 6 (nome do vencedor) |

---

# 13. ARQUITETURA DO COMPONENTE

## Hierarquia de componentes

```
TelaRevealMostLikely
├── [Animated] textoGrupoDecidiu     ← beat 1
├── [Animated] textoPrompt           ← beat 2
├── GridCardsReveal                  ← beat 3–6
│   └── CardReveal × N
│       ├── [LinearGradient] avatar
│       ├── [Animated] nome
│       └── [Animated] badgeVotos
├── [Animated] textosCristalizacao   ← beat 7
└── [Animated] botaoProxima          ← 10s+
```

## Props da tela

```typescript
interface TelaRevealProps {
  prompt: string;
  votos: Record<PlayerId, PlayerId>;
  vencedorId: PlayerId;
  foiEmpate: boolean;
  foiUnanime: boolean;
  ordemJogadores: PlayerId[];      // para grid ordering
  jogadores: Player[];             // para nomes e avatares
  jogadorAtualId: PlayerId;        // para saber se é host
  anfitriaoId: PlayerId;           // para saber se é host
  onProxima: () => void;           // despacha 'avancar_rodada'
  ehUltimaRodada: boolean;         // "encerrar" vs "próxima →"
}
```

## Gestão de animações

Usar `animRef = useRef<Animated.CompositeAnimation | null>(null)` (padrão estabelecido no produto) para limpeza no unmount.

Todas as animações são disparadas em sequência no `useEffect` do mount, usando `Animated.sequence` e `Animated.delay`.

A cristalização e o botão "próxima →" são gerenciados por estados React separados (`setCristalizacaoVisivel(true)`, `setBotaoVisivel(true)`) disparados por callbacks dos `Animated.timing`.

## `useNativeDriver` por elemento

| Animação | `useNativeDriver` |
|---|---|
| opacity (todos os textos) | `true` |
| translateY (textos) | `true` |
| scale (cards, nome vencedor) | `true` |
| backgroundColor (card vencedor) | `false` ← único JS-thread |
| borderColor (card vencedor) | `false` ← único JS-thread |

**Nota de implementação:** separar o card vencedor em dois componentes nested para isolar as animações JS-thread das UI-thread. O outer view anima backgroundColor/border (JS). O inner view anima scale/opacity do nome (UI thread).

---

# 14. PRINCÍPIO FINAL

O reveal do Most Likely To não é feature.
É o produto inteiro comprimido em 10 segundos.

Tudo que vem antes — o prompt, a votação, a espera — é setup para esse momento.
Tudo que vem depois — a conversa, as acusações, as risadas — é a reação a esse momento.

O app existe para criar a condição.
O reveal a executa.
O grupo faz o resto.

O design do reveal tem apenas um critério de sucesso:

**Quando o nome aparecer, alguém no grupo ri, protesta, ou fala "EU SABIA".**

Se isso acontecer, o reveal funcionou.
