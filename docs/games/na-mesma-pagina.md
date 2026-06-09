# NA MESMA PÁGINA — DEFINIÇÃO CANÔNICA

## O que é o jogo

Na Mesma Página é um jogo social de associação, dedução e leitura coletiva em equipes.

Dois times competem para encontrar suas palavras numa grade compartilhada.
Cada time tem um Mestre que sabe quais palavras pertencem a quem.
O Mestre dá uma pista curta e um número. O time discute e escolha.

A emoção central é **alinhamento mental coletivo**:

> "será que o time consegue pensar do mesmo jeito?"

---

## Decisões canônicas

### Plataforma e modo de jogo

- **Jogo local**, um único dispositivo compartilhado pelo grupo.
- Não requer Firebase nem múltiplos celulares.
- O Mestre usa um fluxo de "ver mapa privadamente" (botão discreto durante o turno).
- A conversa e a discussão acontecem em voz alta ao redor do celular.

### Estrutura de jogadores

- Mínimo: 4 jogadores (2 por time)
- Máximo: 12 jogadores
- 2 times, cada time tem exatamente 1 Mestre
- Os demais jogadores são membros do time

### Grade padrão (Modo Clássico)

- 5×5 = 25 palavras
- Time A (começa): 9 palavras
- Time B: 8 palavras
- Neutras: 7 palavras
- Palavra perigosa: 1 palavra

### Turno

1. O Mestre da vez pensa na pista.
2. O Mestre vê o mapa privadamente (botão "ver mapa", cobre a tela).
3. O Mestre anuncia verbalmente: **pista + número** (ex: "mar, 3").
4. O time discute livremente.
5. O time toca nas palavras, uma por vez.
6. Para cada escolha, o app revela se é do time, adversária, neutra ou perigosa.
7. O time para quando errar, atingir o limite ou decidir parar voluntariamente.
8. O turno passa para o outro time.

### Condições de fim de jogo

- **Vitória**: um time revela todas as suas palavras.
- **Derrota imediata**: o time toca na palavra perigosa.
- **Vitória do adversário**: tocar numa palavra adversária ajuda o outro time e encerra o turno.

### Regras de pista

A pista deve ser:
- preferencialmente uma única palavra
- não pode ser palavra da grade nem radical, plural, diminutivo, tradução direta, rima ou dica fonética de uma palavra da grade
- acompanhada de um número que indica quantas palavras o Mestre quer cobrir

O time pode tentar uma escolha extra além do número indicado se tiver acertado todas as anteriores (chute livre).

### Modos de jogo (v1)

| Modo | Grade | Perigosa | Particularidade |
|------|-------|----------|-----------------|
| Clássico | 5×5 | derrota imediata | padrão, equilibrado |
| Rápido | 4×4 | encerra turno | partida de 5–8 min |
| Festa | 5×5 | penalidade menor | pistas mais livres, menos punição |
| Difícil | 5×5 | derrota imediata | palavras abstratas, mais neutras |

Modo Cooperativo: backlog pós-release.

---

## O papel do app

O app é indispensável porque:

- gera a grade e sorteia palavras
- cria o mapa secreto sem setup manual
- mostra o mapa apenas ao Mestre durante o turno
- controla turnos e registra escolhas
- revela palavras com visual diferenciado por tipo
- evita discussão sobre regras
- permite decks temáticos
- calcula estatísticas e registra momentos sociais

---

## Decks de palavras

**MVP (Sprint 2):** `cotidiano` — ~250 palavras comuns, ambíguas no ponto certo.

**Expansão (Sprint 6):**
- `brasil` — lugares, cultura, expressões nacionais
- `cultura_pop` — filmes, séries, música, memes
- `internet` — gírias, dinâmicas online, redes sociais
- `futebol` — times, jogadores, posições, expressões
- `comida` — ingredientes, pratos, restaurantes
- `sentimentos` — emoções e estados emocionais ambíguos

---

## Critérios de uma boa palavra

**Boa:**
- Permite múltiplas associações
- Ambígua no ponto certo (pode conectar a várias pistas plausíveis)
- Conhecida pelo público geral brasileiro
- Exemplos: `praia`, `banco`, `coroa`, `estrela`, `ponte`, `tempo`, `chave`, `carta`

**Ruim:**
- Técnica ou obscura demais
- Sem associação clara
- Muito parecida com outra palavra da grade
- Dependente de conhecimento nichado
- Muito longa

---

## Momentos sociais relevantes

O jogo deve registrar e reconhecer:

- `pista_perfeita` — time acertou todas as palavras da pista sem errar
- `mestre_ousado` — pista com número ≥ 3
- `chute_fatal` — time tocou na palavra perigosa
- `chute_livre_correto` — tentativa extra além do número acertou
- `ajudou_adversario` — time tocou em palavra do time oposto
- `palavra_perigosa_evitada` — time esteve a um passo da perigosa e parou
- `vitoria_por_sincronia` — vitória com todos acertando a última pista
- `time_perdido` — time errou 2+ vezes seguidas

---

## Identidade visual

Cor de destaque: `#6366F1` (indigo) — associação, conexão, sincronia.

Paleta de palavras na grade:
- Time A: azul (`#3B82F6`)
- Time B: vermelho (`#EF4444`)
- Neutra: cinza (`cores.borda`)
- Perigosa: preto (`cores.texto`)
- Não revelada: superfície neutra (`cores.fundoSecundario`)

---

## Fora do MVP v1

- Modo Cooperativo
- Estatísticas históricas por grupo
- Timer configurável para discussão
- Voto secreto individual por jogador
- Histórico de pistas na tela
- Matchmaking online
- Editor de decks
- Modo assíncrono

---

## Documentação relacionada

- `docs/games/na-mesma-pagina-roadmap.md` — sprints de implementação
