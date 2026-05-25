# Duvido — Rankings v1 (MVP)

---

## Aviso Obrigatório

Todos os rankings deste documento devem ser verificados contra a fonte original antes de entrar no código.

Dados de futebol, música e streaming mudam com frequência.
Rankings históricos (recordes, geografia, cinema clássico) são mais estáveis.

Cada ranking marcado com ⚠️ tem posições que precisam de verificação antes de publicar.
Cada ranking marcado com ✓ tem dados considerados estáveis o suficiente para entrada direta.

Fonte de verificação indicada em cada item.

---

## Distribuição do MVP

| Categoria | Total | Fácil | Médio | Difícil |
|---|---|---|---|---|
| Futebol | 6 | 2 | 2 | 2 |
| Música | 5 | 1 | 3 | 1 |
| Recordes | 5 | 2 | 2 | 1 |
| Cinema | 4 | 1 | 2 | 1 |
| Brasil | 4 | 1 | 2 | 1 |
| Geografia | 3 | 1 | 2 | 0 |
| Cultura Pop | 2 | 0 | 1 | 1 |
| Marcas | 1 | 0 | 1 | 0 |
| **Total** | **30** | **8** | **15** | **7** |

---

## FUTEBOL (6 rankings)

---

### F01 ✓
```
id:          'futebol-artilheiros-copa-mundo'
titulo:      'Top 5 maiores artilheiros das Copas do Mundo'
fonte:       'FIFA'
tamanho:     5
categoria:   'futebol'
dificuldade: 1
expiresAt:   null  (histórico, atemporal)
```

**Lista:**
1. Miroslav Klose (Alemanha) — 16 gols
2. Ronaldo Fenômeno (Brasil) — 15 gols
3. Gerd Müller (Alemanha) — 14 gols
4. Just Fontaine (França) — 13 gols
5. Pelé (Brasil) — 12 gols

**Variantes:**
```
'Miroslav Klose'  → ['klose', 'miroslav']
'Ronaldo Fenômeno' → ['ronaldo', 'r9', 'ronaldo fenomeno']
'Gerd Müller'     → ['muller', 'gerd muller', 'der bomber']
'Just Fontaine'   → ['fontaine', 'just fontaine']
'Pelé'            → ['pele', 'edson arantes']
```

**Análise editorial:**
Klose como #1 é a grande surpresa — a maioria esperaria Pelé ou Ronaldo.
Pelé em #5 gera reação coletiva imediata.
Fontaine em #4 é zona de incerteza produtiva (não é óbvio, mas reconhecível).
Borda limpa: 6° lugar seria Sándor Kocsis (11 gols, 1954) — muito menos conhecido.

---

### F02 ✓
```
id:          'futebol-champions-titulos'
titulo:      'Top 5 clubes com mais títulos da Champions League'
fonte:       'UEFA, 2024'
tamanho:     5
categoria:   'futebol'
dificuldade: 1
expiresAt:   '2027-06-01'
```

**Lista:**
1. Real Madrid — 15 títulos
2. AC Milan — 7 títulos
3. Bayern Munich — 6 títulos *(empate)*
3. Liverpool — 6 títulos *(empate)*
5. Barcelona — 5 títulos

**Variantes:**
```
'Real Madrid'  → ['real', 'madrid', 'merengue']
'AC Milan'     → ['milan', 'ac milan']
'Bayern Munich'→ ['bayern', 'munich', 'munique']
'Liverpool'    → ['liverpool', 'reds']
'Barcelona'    → ['barça', 'barca', 'barcelona']
```

**Análise editorial:**
Real Madrid como #1 é amplamente conhecida.
Bayern e Liverpool empatados cria discussão pós-reveal.
Borda limpa: 6° seria Ajax com 4 títulos — muito menos óbvio.

---

### F03 ⚠️
```
id:          'futebol-artilheiros-selecao-brasileira'
titulo:      'Top 10 artilheiros da história da Seleção Brasileira'
fonte:       'CBF'
tamanho:     10
categoria:   'futebol'
dificuldade: 2
expiresAt:   '2026-12-01'
```

**Lista:**
1. Neymar Jr — 79 gols *(verificar: número pode ter mudado após aposentadoria)*
2. Pelé — 77 gols
3. Ronaldo Fenômeno — 62 gols
4. Romário — 55 gols
5. Zico — 52 gols
6. Bebeto — 39 gols
7. Rivaldo — 35 gols
8. Jairzinho — 33 gols
9. *(verificar: Leônidas da Silva, Ademir de Menezes ou Tostão — disputam posições 9-10)*
10. *(verificar)*

**Variantes:**
```
'Neymar Jr'        → ['neymar', 'ney', 'neymar junior']
'Pelé'             → ['pele', 'edson arantes']
'Ronaldo Fenômeno' → ['ronaldo', 'r9']
'Romário'          → ['romario', 'baixinho']
'Zico'             → ['zico', 'arthur coimbra']
'Bebeto'           → ['bebeto', 'jose roberto']
'Rivaldo'          → ['rivaldo', 'rivaldo ferreira']
'Jairzinho'        → ['jairzinho', 'jair ventura']
```

**Análise editorial:**
Neymar como #1 (acima de Pelé) é a grande tensão desta lista.
Muitos vão citar Pelé como #1 — excelente zona de bluff.
Posições 9-10 precisam de verificação antes de publicar.

---

### F04 ✓
```
id:          'futebol-bolas-de-ouro'
titulo:      'Top 5 jogadores com mais Bolas de Ouro'
fonte:       'France Football / Ballon d\'Or, 2024'
tamanho:     5
categoria:   'futebol'
dificuldade: 2
expiresAt:   '2025-12-01'
```

**Lista:**
1. Lionel Messi — 8 Bolas de Ouro
2. Cristiano Ronaldo — 5 Bolas de Ouro
3. Michel Platini — 3 Bolas de Ouro *(empate)*
3. Johan Cruyff — 3 Bolas de Ouro *(empate)*
3. Marco van Basten — 3 Bolas de Ouro *(empate)*

**Variantes:**
```
'Lionel Messi'      → ['messi', 'leo', 'leo messi']
'Cristiano Ronaldo' → ['cr7', 'cristiano', 'ronaldo']
'Michel Platini'    → ['platini']
'Johan Cruyff'      → ['cruyff', 'cruijff']
'Marco van Basten'  → ['van basten']
```

**Análise editorial:**
Messi (8) e CR7 (5) são amplamente conhecidos — entram rápido, sem tensão.
Platini, Cruyff e Van Basten são a zona de incerteza. Muitos vão tentar Ronaldinho (1), Zidane (1) ou Ronaldo Fenômeno (2) — bluffs naturais.
Borda limpa: 6° seria Ronaldo Fenômeno com 2 — muito menos famoso neste contexto.
⚠️ Verificar: se novo vencedor surgir antes do lançamento, atualizar.

---

### F05 ⚠️
```
id:          'futebol-maiores-transferencias'
titulo:      'Top 10 maiores transferências do futebol'
fonte:       'Transfermarkt, 2024'
tamanho:     10
categoria:   'futebol'
dificuldade: 3
expiresAt:   '2026-07-01'
```

**Lista (verificar posições 3-10 no Transfermarkt antes de publicar):**
1. Neymar (Santos → PSG, 2017) — ~€222m
2. Kylian Mbappé (PSG → Real Madrid, 2024) — ~€180m
3-10: verificar ordem exata. Candidatos confirmados para a lista:
  Philippe Coutinho (~€145m), João Félix (~€126m), Enzo Fernández (~€121m),
  Antoine Griezmann (~€120m), Moises Caicedo (~€116m), Jack Grealish (~€117m),
  Romelu Lukaku (~€113m), Ousmane Dembélé (~€105m), Declan Rice (~€105m)

**Variantes para os itens claros:**
```
'Neymar'         → ['neymar', 'neymar jr', 'ney']
'Kylian Mbappé'  → ['mbappe', 'kylian', 'kylian mbappe']
```

**Análise editorial:**
Neymar como #1 é muito conhecida.
Mbappé como #2 é relativamente conhecida.
As posições 3-10 são zona de bluff puro — quem cita Coutinho ou Griezmann?
⚠️ Este ranking precisa de verificação completa de posições 3-10 antes de publicar.

---

### F06 ⚠️
```
id:          'futebol-artilheiros-champions'
titulo:      'Top 10 artilheiros da história da Champions League'
fonte:       'UEFA, 2024'
tamanho:     10
categoria:   'futebol'
dificuldade: 3
expiresAt:   '2027-06-01'
```

**Lista (verificar posições 3-10 no site da UEFA):**
1. Cristiano Ronaldo — verificar total (≈140 gols)
2. Lionel Messi — verificar total (≈129 gols)
3-10: verificar. Candidatos: Karim Benzema, Robert Lewandowski, Raúl González,
  Ruud van Nistelrooy, Thomas Müller, Andriy Shevchenko, Filippo Inzaghi, Eusébio

**Análise editorial:**
CR7 como #1 é muito conhecida.
Posições 3-10 são desconhecidas para a maioria — zona pura de bluff e leitura social.
Raúl como ex-recordista pode aparecer nos bluffs.
⚠️ Verificação completa obrigatória antes de publicar.

---

## MÚSICA (5 rankings)

---

### M07 ✓
```
id:          'musica-albuns-mais-vendidos-historia'
titulo:      'Top 10 álbuns mais vendidos da história'
fonte:       'IFPI'
tamanho:     10
categoria:   'musica'
dificuldade: 1
expiresAt:   null  (histórico, estável)
```

**Lista:**
1. Thriller — Michael Jackson (~70 milhões de cópias)
2. Back in Black — AC/DC (~50 milhões)
3. The Dark Side of the Moon — Pink Floyd (~45 milhões)
4. Their Greatest Hits (1971-1975) — Eagles (~42 milhões)
5. Come On Over — Shania Twain (~40 milhões)
6. Rumours — Fleetwood Mac (~40 milhões)
7. Led Zeppelin IV — Led Zeppelin (~37 milhões)
8. The Bodyguard (trilha sonora) — Whitney Houston/vários (~45 milhões) ⚠️ verificar posição
9. Bat Out of Hell — Meat Loaf (~28 milhões)
10. Their Greatest Hits Vol. 2 — Eagles / Saturday Night Fever — Bee Gees ⚠️ verificar

**Variantes:**
```
'Thriller'                          → ['thriller', 'michael jackson', 'mj']
'Back in Black'                     → ['back in black', 'ac dc', 'acdc']
'The Dark Side of the Moon'         → ['dark side of the moon', 'pink floyd', 'the dark side']
'Their Greatest Hits (1971-1975)'   → ['eagles', 'eagles greatest hits']
'Come On Over'                      → ['come on over', 'shania twain', 'shania']
'Rumours'                           → ['rumours', 'rumors', 'fleetwood mac']
'Led Zeppelin IV'                   → ['led zeppelin iv', 'led zeppelin 4', 'led zeppelin', 'stairway to heaven']
'The Bodyguard'                     → ['the bodyguard', 'whitney houston', 'bodyguard']
'Bat Out of Hell'                   → ['bat out of hell', 'meat loaf']
```

**Análise editorial:**
Thriller como #1 é universalmente conhecida — entra rápido, sem tensão.
Eagles e Shania Twain causam surpresa. "Que isso está aqui?"
Led Zeppelin IV (sem nome oficial) vai gerar hesitação. Aceitar "Stairway to Heaven" como referência ao álbum.
⚠️ Verificar posições 7-10 contra IFPI — esses dados têm versões diferentes em fontes diversas.

---

### M08 ⚠️
```
id:          'musica-mais-tocadas-spotify-global-historico'
titulo:      'Top 5 músicas com mais streams no Spotify de todos os tempos'
fonte:       'Spotify, 2024'
tamanho:     5
categoria:   'musica'
dificuldade: 2
expiresAt:   '2026-01-01'
```

**Lista (verificar no Spotify Charts ou Spotify Newsroom):**
1. "Blinding Lights" — The Weeknd (~4,2 bilhões de streams) *(verificar)*
2. "Shape of You" — Ed Sheeran (~3,9 bilhões) *(verificar)*
3. "As It Was" — Harry Styles / "Someone You Loved" — Lewis Capaldi *(verificar posição)*
4. "Dance Monkey" — Tones and I *(verificar)*
5. "Sunflower" — Post Malone & Swae Lee *(verificar)*

**Variantes:**
```
'Blinding Lights'    → ['blinding lights', 'the weeknd', 'weeknd']
'Shape of You'       → ['shape of you', 'ed sheeran']
'Someone You Loved'  → ['someone you loved', 'lewis capaldi']
'Dance Monkey'       → ['dance monkey', 'tones and i', 'tones and i dance monkey']
'Sunflower'          → ['sunflower', 'post malone', 'swae lee']
```

**Análise editorial:**
Blinding Lights é reconhecida como "a mais tocada" — mas muitos vão duvidar.
Ed Sheeran em #2 é plausível. As posições 3-5 são zona pura de bluff.
⚠️ Lista muda com o tempo. Verificar Spotify Newsroom antes de publicar.

---

### M09 ⚠️
```
id:          'musica-artistas-spotify-global'
titulo:      'Top 10 artistas com mais ouvintes mensais no Spotify'
fonte:       'Spotify, 2024'
tamanho:     10
categoria:   'musica'
dificuldade: 2
expiresAt:   '2025-06-01'
```

**Lista (verificar em spotifycharts.com na data de publicação):**
⚠️ Esta lista muda semanalmente. Capturar e congelar os dados em uma data específica.
Candidatos frequentes ao top 10: Taylor Swift, The Weeknd, Ed Sheeran, Billie Eilish,
Bad Bunny, Drake, Ariana Grande, Post Malone, Harry Styles, Justin Bieber, Dua Lipa.

**Análise editorial:**
A alta rotatividade é um risco. Solução: publicar como "Top 10 de [mês/ano]" explicitamente.
Excelente zona de bluff — todo mundo acha que sabe mas as posições mudam constantemente.
⚠️ Verificar e congelar data exata antes de publicar. Marcar expiresAt agressivo (6 meses).

---

### M10 ✓
```
id:          'musica-videos-mais-views-youtube'
titulo:      'Top 10 vídeos com mais views no YouTube de todos os tempos'
fonte:       'YouTube, 2024'
tamanho:     10
categoria:   'musica'
dificuldade: 2
expiresAt:   '2026-01-01'
```

**Lista (verificar no YouTube oficial — "Most viewed YouTube videos"):**
1. "Baby Shark Dance" — Pinkfong (~14 bilhões de views)
2. "Despacito" — Luis Fonsi ft. Daddy Yankee (~8,4 bilhões)
3. "Shape of You" — Ed Sheeran (~6,3 bilhões)
4. "See You Again" — Wiz Khalifa ft. Charlie Puth (~6,2 bilhões)
5. "Uptown Funk" — Mark Ronson ft. Bruno Mars (~5,3 bilhões)
6. "Gangnam Style" — PSY (~5,3 bilhões)
7-10: verificar posições restantes

**Variantes:**
```
'Baby Shark Dance'    → ['baby shark', 'pinkfong', 'baby shark dance']
'Despacito'          → ['despacito', 'luis fonsi', 'daddy yankee']
'Shape of You'       → ['shape of you', 'ed sheeran']
'See You Again'      → ['see you again', 'wiz khalifa', 'charlie puth', 'fast and furious']
'Uptown Funk'        → ['uptown funk', 'mark ronson', 'bruno mars']
'Gangnam Style'      → ['gangnam style', 'psy', 'gangnam']
```

**Análise editorial:**
Baby Shark como #1 é muito conhecida e sempre gera reação ("que absurdo").
Despacito em #2 é conhecida. See You Again e Uptown Funk são a zona de incerteza.
⚠️ Verificar posições 7-10 no YouTube antes de publicar.

---

### M11 ⚠️
```
id:          'musica-artistas-brasileiros-instagram'
titulo:      'Top 5 cantores brasileiros com mais seguidores no Instagram'
fonte:       'Instagram / HypeAuditor, 2024'
tamanho:     5
categoria:   'musica'
dificuldade: 3
expiresAt:   '2025-06-01'
```

**Lista (verificar contagens atuais — mudam mensalmente):**
1. Anitta — verificar (~65 milhões)
2-5: candidatos — Gustavo Lima, Ivete Sangalo, Wesley Safadão, Luan Santana, Ferrugem, Ludmilla

**Variantes:**
```
'Anitta' → ['anitta', 'larissa macedo', 'mc anitta']
```

**Análise editorial:**
Anitta como #1 é bem conhecida e serve como âncora.
Posições 2-5 são zona de bluff total — sertanejo vs funk vs pop.
⚠️ Alta rotatividade. Verificar e congelar data antes de publicar.

---

## RECORDES (5 rankings)

---

### R12 ✓
```
id:          'recordes-animais-perigosos'
titulo:      'Top 5 animais que mais matam humanos por ano'
fonte:       'Guinness World Records'
tamanho:     5
categoria:   'recordes'
dificuldade: 1
expiresAt:   null
```

**Lista:**
1. Mosquito — ~725.000 mortes/ano (malária, dengue, febre amarela)
2. Ser humano — ~400.000 mortes/ano (homicídios)
3. Cobra — ~100.000 mortes/ano
4. Cão — ~59.000 mortes/ano (raiva)
5. Mosca tsé-tsé — ~10.000 mortes/ano (doença do sono)

**Variantes:**
```
'Mosquito'      → ['mosquito', 'mosquitos', 'pernilongo']
'Ser humano'    → ['humano', 'ser humano', 'pessoa', 'homem', 'gente']
'Cobra'         → ['cobra', 'serpente', 'cobras']
'Cão'           → ['cachorro', 'cão', 'dog', 'cao']
'Mosca tsé-tsé' → ['tse-tse', 'tsé-tsé', 'mosca tse-tse', 'mosca africana']
```

**Análise editorial:**
O ranking mais viral do Duvido. Mosquito como #1 é amplamente divulgada mas ainda surpreende na hora.
Ser humano em #2 cria reação imediata — "gente no ranking de animais perigosos?"
Aceitar "mosca da África" como variante para tsé-tsé.
Borda limpa: 6° seria crocodilo — muito menos conhecido como causador de mortes.

---

### R13 ✓
```
id:          'recordes-paises-expectativa-vida'
titulo:      'Top 5 países com maior expectativa de vida'
fonte:       'OMS / ONU, 2023'
tamanho:     5
categoria:   'recordes'
dificuldade: 1
expiresAt:   '2026-01-01'
```

**Lista:**
1. Japão — ~84,3 anos
2. Suíça — ~83,9 anos
3. Coreia do Sul — ~83,7 anos *(verificar posição exata)*
4. Espanha — ~83,5 anos *(verificar)*
5. Austrália — ~83,4 anos *(verificar)*

**Variantes:**
```
'Japão'       → ['japao', 'japan', 'japão']
'Suíça'       → ['suica', 'suíça', 'switzerland']
'Coreia do Sul' → ['coreia', 'coreia do sul', 'south korea']
'Espanha'     → ['espanha', 'spain', 'espania']
'Austrália'   → ['australia', 'austrália']
```

**Análise editorial:**
Japão como #1 é amplamente conhecida.
Coreia do Sul no top 5 é uma surpresa produtiva — muitos não esperariam.
⚠️ Verificar posições 3-5 — variam entre fontes (OMS vs ONU) e ano de publicação.

---

### R14 ✓
```
id:          'recordes-maiores-animais-peso'
titulo:      'Top 5 maiores animais do mundo por peso'
fonte:       'Guinness World Records'
tamanho:     5
categoria:   'recordes'
dificuldade: 2
expiresAt:   null
```

**Lista:**
1. Baleia-azul — até 190 toneladas
2. Baleia-da-groenlândia — até 100 toneladas
3. Elefante africano — até 7 toneladas
4. Elefante asiático — até 5 toneladas
5. Hipopótamo — até 3 toneladas *(verificar: girafa vs hipopótamo vs rinoceronte)*

**Variantes:**
```
'Baleia-azul'            → ['baleia azul', 'baleia-azul', 'blue whale']
'Baleia-da-groenlândia'  → ['baleia groelandia', 'baleia da groenlandia', 'bowhead whale']
'Elefante africano'      → ['elefante', 'elefante africano']
'Elefante asiático'      → ['elefante asiatico', 'elefante da asia']
'Hipopótamo'             → ['hipopotamo', 'hipopótamo', 'hippo']
```

**Análise editorial:**
Baleia-azul como #1 é bem conhecida.
Baleia-da-groenlândia em #2 é a grande surpresa — quase ninguém espera.
Elefante africano em #3 é razoavelmente conhecida.
Hipopótamo em #5 cria discussão: "mas e o rinoceronte?"
⚠️ Verificar posições 4-5 (hipopótamo vs rinoceronte branco).

---

### R15 ✓
```
id:          'recordes-paises-medalhas-olimpiadas'
titulo:      'Top 5 países com mais medalhas de ouro nas Olimpíadas de verão'
fonte:       'Comitê Olímpico Internacional (COI)'
tamanho:     5
categoria:   'recordes'
dificuldade: 2
expiresAt:   '2025-09-01'
```

**Lista (histórico acumulado — incluindo URSS separada dos países modernos):**
1. Estados Unidos — ~1.000+ ouros (verificar total exato após Paris 2024)
2. União Soviética — ~395 ouros (histórico encerrado)
3. Grã-Bretanha — verificar posição *(China e Grã-Bretanha disputam 3-4)*
4. China — verificar posição
5. Alemanha — verificar (complexo: DDR + RFA histórico separado)

**Variantes:**
```
'Estados Unidos' → ['eua', 'usa', 'estados unidos', 'america', 'united states']
'União Soviética'→ ['urss', 'união soviética', 'soviet union', 'russia antiga']
'Grã-Bretanha'  → ['gra bretanha', 'grã-bretanha', 'reino unido', 'uk', 'great britain', 'england']
'China'         → ['china', 'china olimpica']
'Alemanha'      → ['alemanha', 'germany']
```

**Análise editorial:**
EUA como #1 é muito conhecida.
URSS em #2 surpreende — muitos não consideram um país encerrado como o histórico permite.
⚠️ Verificar posições 3-5 contra o histórico completo do COI incluindo Paris 2024.
Decidir: contar URSS separada de Rússia ou unificada? Declarar explicitamente no título se necessário.

---

### R16 ✓
```
id:          'recordes-estruturas-mais-altas'
titulo:      'Top 5 estruturas mais altas do mundo'
fonte:       'Guinness World Records, 2024'
tamanho:     5
categoria:   'recordes'
dificuldade: 3
expiresAt:   '2027-01-01'
```

**Lista:**
1. Burj Khalifa (Dubai) — 828 metros
2. Merdeka 118 (Kuala Lumpur) — 679 metros
3. Shanghai Tower (Shanghai) — 632 metros
4. Abraj Al-Bait (Meca, Arábia Saudita) — 601 metros
5. Ping An Finance Centre (Shenzhen) — 599 metros

**Variantes:**
```
'Burj Khalifa'           → ['burj khalifa', 'dubai', 'burj']
'Merdeka 118'            → ['merdeka', 'merdeka 118', 'kuala lumpur', 'malaysia']
'Shanghai Tower'         → ['shanghai tower', 'xangai', 'shanghai']
'Abraj Al-Bait'         → ['abraj al-bait', 'meca', 'clock tower', 'torre meca']
'Ping An Finance Centre' → ['ping an', 'shenzhen']
```

**Análise editorial:**
Burj Khalifa como #1 é muito conhecida — âncora segura.
As posições 2-5 são desconhecidas para 95% das pessoas — bluff puro.
Muitos vão dizer "Torre Eiffel" (324m) ou "Empire State" (443m) — boa zona de eliminação.
Merdeka 118 em #2 é uma surpresa genuína que vai gerar "não sabia disso".

---

## CINEMA (4 rankings)

---

### C17 ✓
```
id:          'cinema-maiores-bilheterias-historia'
titulo:      'Top 5 filmes de maior bilheteria da história'
fonte:       'Box Office Mojo'
tamanho:     5
categoria:   'cinema'
dificuldade: 1
expiresAt:   '2026-12-01'
```

**Lista:**
1. Avatar (2009) — ~$2,9 bilhões *(com re-lançamentos)*
2. Avengers: Endgame (2019) — ~$2,8 bilhões
3. Avatar: The Way of Water (2022) — ~$2,3 bilhões
4. Titanic (1997) — ~$2,2 bilhões *(com re-lançamentos)*
5. Star Wars: The Force Awakens (2015) — ~$2,1 bilhões

**Variantes:**
```
'Avatar'                          → ['avatar', 'avatar 1', 'james cameron']
'Avengers: Endgame'               → ['endgame', 'avengers endgame', 'vingadores', 'vingadores ultimato']
'Avatar: The Way of Water'        → ['avatar 2', 'avatar the way of water', 'avatar o caminho da agua']
'Titanic'                         → ['titanic', 'titanic 1997']
'Star Wars: The Force Awakens'    → ['the force awakens', 'star wars 7', 'star wars episode 7', 'o despertar da força']
```

**Análise editorial:**
Avatar como #1 é conhecida, mas muitos esperariam Avengers: Endgame.
Avatar 2 em #3 pode surpreender — muitos não sabem que ultrapassou Titanic.
Borda limpa: 6° seria Jurassic World (~$1,67 bilhões) — claramente menor.
⚠️ Verificar se nenhum filme ultrapassou Star Wars após 2024.

---

### C18 ✓
```
id:          'cinema-franquias-mais-lucrativas'
titulo:      'Top 10 franquias de cinema mais lucrativas da história'
fonte:       'Box Office Mojo / The Numbers'
tamanho:     10
categoria:   'cinema'
dificuldade: 2
expiresAt:   '2026-12-01'
```

**Lista:**
1. Marvel Cinematic Universe — ~$30 bilhões+
2. Star Wars — ~$10 bilhões+
3. Harry Potter / Wizarding World — ~$9 bilhões
4. James Bond — ~$7 bilhões
5. Velozes e Furiosos — ~$7 bilhões
6. Batman / DC Universe — ~$6 bilhões *(verificar escopo)*
7. Spider-Man — ~$5 bilhões *(verificar se conta separado do MCU)*
8. Jurassic Park/World — ~$5 bilhões
9. Transformers — ~$4,8 bilhões
10. O Senhor dos Anéis / O Hobbit — ~$5,8 bilhões *(verificar posição)*

**Variantes:**
```
'Marvel Cinematic Universe'   → ['mcu', 'marvel', 'avengers', 'marvel universe']
'Star Wars'                   → ['star wars', 'guerra nas estrelas']
'Harry Potter / Wizarding World' → ['harry potter', 'hogwarts', 'animais fantasticos', 'wizarding world']
'James Bond'                  → ['james bond', '007', 'bond']
'Velozes e Furiosos'          → ['velozes e furiosos', 'fast and furious', 'fast furious']
'Batman / DC Universe'        → ['batman', 'dc', 'dc universe', 'liga da justica']
'Spider-Man'                  → ['homem aranha', 'spider man', 'spiderman']
'Jurassic Park/World'         → ['jurassic park', 'jurassic world', 'jurassico']
'Transformers'                → ['transformers']
'O Senhor dos Anéis / O Hobbit' → ['senhor dos aneis', 'hobbit', 'lotr', 'lord of the rings']
```

**Análise editorial:**
MCU como #1 é amplamente conhecida.
James Bond e Velozes e Furiosos em posições altas surpreendem muitos.
⚠️ Verificar se Spider-Man conta separado do MCU nas fontes usadas — definir critério explicitamente.
⚠️ Posições 6-10 podem variar entre fontes. Verificar e declarar critério de contagem.

---

### C19 ⚠️
```
id:          'cinema-filmes-mais-indicacoes-oscar'
titulo:      'Top 5 filmes com mais indicações ao Oscar'
fonte:       'Academy of Motion Picture Arts and Sciences'
tamanho:     5
categoria:   'cinema'
dificuldade: 2
expiresAt:   null
```

**Lista:**
1. All About Eve (1950) — 14 indicações *(empate)*
1. Titanic (1997) — 14 indicações *(empate)*
1. La La Land (2016) — 14 indicações *(empate)*
4. Ben-Hur (1959) — 12 indicações *(empate — verificar outros filmes com 12)*
5. verificar

**Variantes:**
```
'All About Eve'  → ['all about eve', 'a malvada']
'Titanic'        → ['titanic']
'La La Land'     → ['la la land', 'la la land musical']
'Ben-Hur'        → ['ben-hur', 'ben hur']
```

**Análise editorial:**
Titanic é amplamente conhecida como recordista — mas La La Land e All About Eve surpreendem.
O empate triplo em 14 indicações é um fato interessante por si só.
⚠️ Verificar posições 4-5 — existe debate sobre quais filmes empatam com 12 indicações.
⚠️ Definir se o ranking aceita empates ou usa critério de desempate.

---

### C20 ⚠️
```
id:          'cinema-diretores-mais-oscars-direcao'
titulo:      'Top 5 diretores com mais Oscars de Melhor Direção'
fonte:       'Academy of Motion Picture Arts and Sciences'
tamanho:     5
categoria:   'cinema'
dificuldade: 3
expiresAt:   null
```

**Lista (verificar lista completa antes de publicar):**
1. John Ford — 4 Oscars de Direção
2-5: verificar. Candidatos: William Wyler (3), Frank Capra (3), outros com 2 (Spielberg, Coppola, etc.)

**Análise editorial:**
John Ford como #1 com 4 Oscars de direção é pouco conhecida para o público geral — boa zona de bluff.
Spielberg sendo apenas #2 ou inferior surpreende muitos.
⚠️ Verificar lista completa de vencedores múltiplos da Academy.

---

## BRASIL (4 rankings)

---

### B21 ✓
```
id:          'brasil-estados-mais-populosos'
titulo:      'Top 5 estados mais populosos do Brasil'
fonte:       'IBGE, Censo 2022'
tamanho:     5
categoria:   'brasil'
dificuldade: 1
expiresAt:   '2033-01-01'
```

**Lista:**
1. São Paulo — ~44,4 milhões
2. Minas Gerais — ~21,3 milhões
3. Rio de Janeiro — ~16,1 milhões
4. Bahia — ~14,1 milhões
5. Paraná — ~11,4 milhões

**Variantes:**
```
'São Paulo'     → ['sao paulo', 'sp', 'são paulo']
'Minas Gerais'  → ['minas', 'minas gerais', 'mg']
'Rio de Janeiro'→ ['rio', 'rio de janeiro', 'rj']
'Bahia'         → ['bahia', 'ba']
'Paraná'        → ['parana', 'paraná', 'pr']
```

**Análise editorial:**
SP, MG e RJ como top 3 são muito conhecidos.
Bahia em #4 é conhecida mas muitos podem hesitar.
Paraná em #5 causa surpresa — muitos esperariam Rio Grande do Sul ou Pernambuco.
Borda limpa: 6° é RS com ~11,3 milhões (muito próximo do PR — verificar margem).
⚠️ Verificar se PR e RS estão claramente separados no censo 2022 para evitar problema de borda.

---

### B22 ✓
```
id:          'brasil-cidades-mais-populosas'
titulo:      'Top 10 cidades mais populosas do Brasil'
fonte:       'IBGE, Censo 2022'
tamanho:     10
categoria:   'brasil'
dificuldade: 2
expiresAt:   '2033-01-01'
```

**Lista:**
1. São Paulo — ~12,3 milhões
2. Rio de Janeiro — ~6,7 milhões
3. Brasília — ~3,1 milhões
4. Salvador — ~2,9 milhões
5. Fortaleza — ~2,7 milhões
6. Belo Horizonte — ~2,5 milhões
7. Manaus — ~2,2 milhões
8. Curitiba — ~1,9 milhões
9. Recife — ~1,6 milhões
10. Goiânia — ~1,5 milhões

**Variantes:**
```
'São Paulo'     → ['sao paulo', 'sampa', 'sp']
'Rio de Janeiro'→ ['rio', 'rio de janeiro', 'rj']
'Brasília'      → ['brasilia', 'brasília', 'distrito federal', 'df']
'Salvador'      → ['salvador', 'salvador da bahia']
'Fortaleza'     → ['fortaleza', 'ceara', 'forte']
'Belo Horizonte'→ ['belo horizonte', 'bh', 'beagá']
'Manaus'        → ['manaus', 'amazonas']
'Curitiba'      → ['curitiba', 'cwb', 'coritiba']
'Recife'        → ['recife', 'pernambuco']
'Goiânia'       → ['goiania', 'goiânia', 'goias']
```

**Análise editorial:**
SP e RJ são incontestáveis.
Brasília em #3 é bem conhecida.
Manaus em #7 cria surpresa positiva — "maior que Curitiba?"
A ordem 4-6 (Salvador, Fortaleza, BH) vai gerar bluffs e debates.
Borda limpa: 11° seria Porto Alegre (~1,33 milhões) — mais de 10% menor que Goiânia.

---

### B23 ✓
```
id:          'brasil-estados-maior-pib'
titulo:      'Top 5 estados com maior PIB do Brasil'
fonte:       'IBGE'
tamanho:     5
categoria:   'brasil'
dificuldade: 2
expiresAt:   '2026-01-01'
```

**Lista:**
1. São Paulo
2. Rio de Janeiro
3. Minas Gerais
4. Rio Grande do Sul *(verificar: pode ser Paraná ou RS dependendo do ano)*
5. Paraná *(verificar posição contra RS)*

**Variantes:**
```
'São Paulo'      → ['sao paulo', 'sp', 'são paulo']
'Rio de Janeiro' → ['rio', 'rj', 'rio de janeiro']
'Minas Gerais'   → ['minas', 'mg', 'minas gerais']
'Rio Grande do Sul' → ['rio grande do sul', 'rs', 'gaucho', 'gaúcho']
'Paraná'         → ['parana', 'pr', 'paraná']
```

**Análise editorial:**
SP em #1 é incontestável. RJ em #2 também.
MG em #3 surpresa positiva — muitos esperariam RJ em #3 e MG em #4.
Diferença entre PIB (este ranking) e população (outro ranking) cria tensão interessante.
⚠️ Verificar posições 4-5 — RS e PR alternaram nos últimos anos.

---

### B24 ⚠️
```
id:          'brasil-produtos-mais-exportados'
titulo:      'Top 5 produtos mais exportados pelo Brasil'
fonte:       'MDIC / Comex Stat, 2023'
tamanho:     5
categoria:   'brasil'
dificuldade: 3
expiresAt:   '2025-12-01'
```

**Lista (verificar no Comex Stat — dados variam por ano):**
1. Soja — principal exportação histórica
2. Petróleo bruto — crescimento recente
3. Minério de ferro — posição estável
4. Carne bovina — verificar posição exata
5. Açúcar / Milho / Café — verificar qual está em 5° no ano base

**Variantes:**
```
'Soja'           → ['soja', 'soy', 'graos de soja', 'farelo de soja']
'Petróleo bruto' → ['petroleo', 'petróleo', 'petroleo bruto', 'crude oil']
'Minério de ferro'→ ['minerio de ferro', 'minério de ferro', 'ferro']
'Carne bovina'   → ['carne bovina', 'carne', 'beef', 'boi gordo']
'Açúcar'         → ['acucar', 'açúcar', 'sugar']
```

**Análise editorial:**
Soja como #1 é razoavelmente conhecida.
Petróleo em #2 surpreende muitos que esperariam café ou carne.
Café fora do top 5 vai chocar muita gente — excelente momento de reveal.
⚠️ Verificar Comex Stat para o ano base escolhido. Os dados variam significativamente por período.

---

## GEOGRAFIA (3 rankings)

---

### G25 ✓
```
id:          'geo-paises-mais-populosos'
titulo:      'Top 5 países mais populosos do mundo'
fonte:       'ONU, 2024'
tamanho:     5
categoria:   'geografia'
dificuldade: 1
expiresAt:   '2027-01-01'
```

**Lista:**
1. Índia — ~1,44 bilhão *(ultrapassou China em 2023)*
2. China — ~1,42 bilhão
3. Estados Unidos — ~340 milhões
4. Indonésia — ~280 milhões
5. Paquistão — ~240 milhões

**Variantes:**
```
'Índia'         → ['india', 'índia', 'hindustan']
'China'         → ['china', 'republica popular']
'Estados Unidos'→ ['eua', 'usa', 'estados unidos', 'america']
'Indonésia'     → ['indonesia', 'indonésia']
'Paquistão'     → ['paquistao', 'paquistão', 'pakistan']
```

**Análise editorial:**
Índia como #1 (acima da China) é a grande surpresa — a mudança aconteceu em 2023 e muitos ainda não sabem.
China em #2 vai ser a resposta instintiva de muitos para #1 — excelente zona de bluff.
Indonésia em #4 e Paquistão em #5 são menos conhecidas nesta posição.
Borda limpa: 6° seria Brasil (~215 milhões) — claramente menor.

---

### G26 ✓
```
id:          'geo-paises-maior-territorio'
titulo:      'Top 10 países com maior território'
fonte:       'CIA World Factbook'
tamanho:     10
categoria:   'geografia'
dificuldade: 2
expiresAt:   null
```

**Lista:**
1. Rússia — 17,1 milhões km²
2. Canadá — 10,0 milhões km²
3. Estados Unidos — 9,8 milhões km²
4. China — 9,6 milhões km²
5. Brasil — 8,5 milhões km²
6. Austrália — 7,7 milhões km²
7. Índia — 3,3 milhões km²
8. Argentina — 2,8 milhões km²
9. Cazaquistão — 2,7 milhões km²
10. Argélia — 2,4 milhões km²

**Variantes:**
```
'Rússia'        → ['russia', 'rússia']
'Canadá'        → ['canada', 'canadá']
'Estados Unidos'→ ['eua', 'usa', 'estados unidos', 'america']
'China'         → ['china']
'Brasil'        → ['brasil', 'brazil']
'Austrália'     → ['australia', 'austrália']
'Índia'         → ['india', 'índia']
'Argentina'     → ['argentina']
'Cazaquistão'   → ['cazaquistao', 'cazaquistão', 'kazakhstan', 'casaquistão']
'Argélia'       → ['argelia', 'argélia', 'algeria']
```

**Análise editorial:**
Rússia como #1 é incontestável e bem conhecida.
Canadá em #2 (acima dos EUA) surpreende muitos.
Brasil em #5 é bem conhecido, serve como âncora de referência.
Cazaquistão e Argélia no top 10 são as grandes surpresas.
Borda limpa: 11° seria Sudão (~1,86 milhões km²) — muito menor.

---

### G27 ✓
```
id:          'geo-montanhas-mais-altas'
titulo:      'Top 5 montanhas mais altas do mundo'
fonte:       'National Geographic / Guinness'
tamanho:     5
categoria:   'geografia'
dificuldade: 2
expiresAt:   null
```

**Lista:**
1. Everest (Nepal/China) — 8.849 metros
2. K2 (Paquistão/China) — 8.611 metros
3. Kangchenjunga (Nepal/Índia) — 8.586 metros
4. Lhotse (Nepal/China) — 8.516 metros
5. Makalu (Nepal/China) — 8.485 metros

**Variantes:**
```
'Everest'          → ['everest', 'monte everest', 'chomolungma']
'K2'               → ['k2', 'karakoram', 'chhogori']
'Kangchenjunga'    → ['kangchenjunga', 'kanchenjunga', 'terceira mais alta']
'Lhotse'           → ['lhotse']
'Makalu'           → ['makalu']
```

**Análise editorial:**
Everest como #1 é universalmente conhecida.
K2 como #2 é relativamente conhecida entre quem tem referência de alpinismo.
Posições 3-5 são desconhecidas para a maioria — zona de bluff puro.
Muitos vão tentar Aconcágua (6.962m — 8°) ou Mont Blanc (4.808m) — boa zona de eliminação.
Borda limpa: 6° seria Cho Oyu (8.188m) — completamente desconhecida.

---

## CULTURA POP (2 rankings)

---

### CP28 ⚠️
```
id:          'cultpop-videogames-mais-vendidos'
titulo:      'Top 10 videogames mais vendidos da história'
fonte:       'VGChartz / Guinness, 2024'
tamanho:     10
categoria:   'cultura_pop'
dificuldade: 2
expiresAt:   '2026-01-01'
```

**Lista (verificar posições 3-10 — dados variam por método de contagem):**
1. Minecraft — ~238 milhões de cópias (todas as plataformas)
2. Grand Theft Auto V — ~185 milhões
3. Tetris (Game Boy) — ~35 milhões *(se contado separado das outras versões)*
  OU Wii Sports — ~83 milhões *(se contado como venda não-bundle)*
  *(verificar método de contagem da fonte)*
4-10: candidatos — Mario Kart 8 Deluxe, PUBG, Pokémon Red/Blue, Super Mario Bros., FIFA series
⚠️ Este ranking depende criticamente de como "venda" é definida. Declarar critério no título.

**Variantes confirmadas:**
```
'Minecraft'         → ['minecraft', 'mine craft']
'Grand Theft Auto V'→ ['gta v', 'gta 5', 'gta', 'grand theft auto']
```

**Nota editorial:**
Minecraft e GTA V como top 2 são as âncoras seguras.
⚠️ Definir critério explicitamente no título antes de publicar (excluir versões bundled? incluir mobile?).

---

### CP29 ⚠️
```
id:          'cultpop-series-netflix-global'
titulo:      'Top 10 séries com mais horas assistidas na Netflix (primeiros 28 dias)'
fonte:       'Netflix Top 10, 2024'
tamanho:     10
categoria:   'cultura_pop'
dificuldade: 3
expiresAt:   '2025-12-01'
```

**Lista (verificar em top10.netflix.com para o período de referência):**
Candidatos para o top 10 histórico de séries:
- Squid Game (Temporada 1) — ~1,65 bilhões de horas
- Wednesday — ~1,24 bilhões de horas
- Stranger Things (Temporada 4) — ~1,35 bilhões? *(verificar)*
- Dahmer — Monster (~824 milhões)
- The Night Agent, The Diplomat, You (verificar posições)
⚠️ Netflix divide entre inglês e não-inglês. Definir escopo antes de publicar.

**Análise editorial:**
Squid Game como #1 é amplamente conhecida.
Wednesday em top 3 é conhecida.
As demais posições são zona de bluff genuíno.
⚠️ Definir claramente: séries globais ou só inglês? Incluir limitadas? Verificar dados oficiais da Netflix.

---

## MARCAS (1 ranking)

---

### Ma30 ✓
```
id:          'marcas-mais-valiosas-mundo'
titulo:      'Top 10 marcas mais valiosas do mundo'
fonte:       'Forbes, 2024'
tamanho:     10
categoria:   'marcas'
dificuldade: 2
expiresAt:   '2026-01-01'
```

**Lista (verificar edição mais recente do Forbes Brand Value):**
1. Apple
2. Google / Alphabet
3. Microsoft
4. Amazon
5. Meta (Facebook)
6. NVIDIA *(subiu muito em 2023-24 — verificar posição)*
7. Samsung
8. Louis Vuitton / LVMH *(verificar se conta como marca única)*
9. Tesla
10. Coca-Cola / Walmart / McDonald's *(verificar posição exata)*

**Variantes:**
```
'Apple'     → ['apple', 'apple inc', 'iphone']
'Google'    → ['google', 'alphabet', 'google alphabet']
'Microsoft' → ['microsoft', 'ms', 'windows']
'Amazon'    → ['amazon', 'amazon.com', 'aws']
'Meta'      → ['meta', 'facebook', 'meta facebook']
'NVIDIA'    → ['nvidia', 'nvda']
'Samsung'   → ['samsung']
'Louis Vuitton' → ['louis vuitton', 'lv', 'lvmh', 'vuitton']
'Tesla'     → ['tesla', 'tesla motors', 'elon musk']
'Coca-Cola' → ['coca cola', 'coca-cola', 'coke']
```

**Análise editorial:**
Apple e Google como top 2 são amplamente conhecidas.
NVIDIA em top 10 é uma surpresa para quem não acompanha tecnologia (subida recente).
Louis Vuitton no top 10 surpreende quem não associa moda a esse nível de valor.
⚠️ Posições 6-10 variam anualmente — verificar edição Forbes do ano base.

---

## Resumo Executivo

### Por status de verificação:

| Status | Quantidade |
|---|---|
| ✓ Estável, entrada direta | 16 |
| ⚠️ Verificação obrigatória antes de publicar | 14 |

### Por validade:

| Validade | Quantidade |
|---|---|
| Atemporal (null) | 8 |
| Anual (2025-2026) | 14 |
| Semestral (2025) | 5 |
| Indefinido até definição | 3 |

### Rankings com maior potencial de viralidade:

1. **R12** — Animais que mais matam (mosquito #1, ser humano #2)
2. **F01** — Artilheiros da Copa (Klose acima de Pelé)
3. **G25** — Países mais populosos (Índia acima da China desde 2023)
4. **M07** — Álbuns mais vendidos (Eagles e Shania acima do esperado)
5. **R16** — Estruturas mais altas (Burj Khalifa é só o começo)

### Rankings com maior risco de debate:

1. **F05** — Maiores transferências (valores disputados por add-ons)
2. **R15** — Medalhas olímpicas (inclusão da URSS como entidade separada)
3. **CP28** — Videogames mais vendidos (método de contagem é crítico)
4. **B24** — Exportações brasileiras (variam muito por período)

### Próximo passo após verificação:

Criar os arquivos de conteúdo em `src/games/duvido/rankings/` com a estrutura `RankingDuvido[]` definida em `types.ts`.
