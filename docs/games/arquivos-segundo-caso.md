# ARQUIVOS — PLANO DO SEGUNDO CASO

## Template canônico de caso

Todo caso de Arquivos deve seguir a estrutura de `src/games/arquivos/casos/dossie-sumido.ts`. Este documento descreve o template, os critérios de qualidade e sugestões para o Caso 2.

---

## Campos obrigatórios

### `id`

Tipo: `string`

Identificador único do caso em kebab-case. Exemplo: `'empresa-fantasma'`.

---

### `intro`

Campos obrigatórios:
- `titulo` — nome do caso, curto e evocativo. Máx. 5 palavras.
- `subtitulo` — linha de tensão. Máx. 10 palavras. Deve criar suspense imediato.
- `incidente` — o que aconteceu, em uma frase direta.
- `resumoPublico` — contexto de 3 a 4 frases mostrado a todos antes da leitura privada. Deve criar curiosidade sem revelar a verdade.
- `tipoIncidente` — enum de tipo: `'objeto_sumido' | 'fraude' | 'vazamento' | 'sabotagem' | 'chantagem' | 'escandalo' | 'heranca' | 'desaparecimento'`

Campo opcional:
- `tom` — array de strings livres que comunicam o clima do caso para o host. Exemplos: `['corporativo_leve', 'amizades']`, `['familiar', 'comico']`.

---

### `config`

Campos:
- `minPlayers` — mínimo de jogadores. Para MVP de 6 personagens: `6`.
- `targetPlayers` — número ideal. Para MVP: `6`.
- `maxPlayers` — máximo. Para MVP: `6`.
- `targetDurationMinutes.min` e `targetDurationMinutes.max` — faixa de duração em minutos.
- `supportedPlayerCounts` — array de contagens suportadas. Para MVP: `[6]`.

Para criar um caso de 4 jogadores: reduzir `minPlayers`, `targetPlayers`, `maxPlayers` e `supportedPlayerCounts` e criar apenas 4 personagens no `characters`. O engine já suporta contagens diferentes.

---

### `truth`

Campos obrigatórios:
- `resumo` — verdade completa em 2 a 3 frases. Deve responder todas as perguntas centrais.
- `responsavelCharacterId` — `characterId` do personagem principal responsável pelo incidente.
- `motivacaoPrincipal` — motivação em uma frase curta. Deve ser legível na revelação final.
- `segredoCentral` — o segredo mais importante do caso em uma frase.
- `documentosDecisivos` — array de `evidenceId`s das 3 a 5 evidências mais importantes para resolver o caso.
- `errosDeInterpretacaoComuns` — array de strings com as interpretações erradas mais prováveis. Ajuda a calibrar as pistas enganosas.

Campo opcional:
- `linhaDoTempo` — array de objetos `{ horario: string; evento: string; personagemId?: string }`. Essencial para casos com alibi e sequência de eventos.

---

### `characters`

Array de personagens. Cada personagem tem:

Campos obrigatórios:
- `id` — `characterId` único em formato `'char-nome'`.
- `nome` — nome completo do personagem.
- `funcao` — cargo ou papel no contexto do caso. Deve explicar por que a pessoa está envolvida.
- `resumoPublico` — frase de apresentação pública (30 a 50 palavras). Deve comunicar tensão e papel no caso, não apenas função. Este texto aparece na tela compartilhada.
- `contextoPrivado` — contexto privado legível pelo próprio jogador (80 a 120 palavras). Deve explicar a perspectiva do personagem, criar identidade e comunicar o que o personagem sabe e o que prefere não revelar.
- `conhecimentos` — array de fatos que o personagem sabe. Curtos, acionáveis em conversa. Máximo 6 por personagem.
- `segredo` — string com o segredo do personagem. Pode ser inocente, suspeito ou ambíguo. Não precisa ser o responsável para ter segredo.
- `objetivoIndividual` — o que esse personagem quer que aconteça ao final. Deve criar atrito sem sabotar a investigação.

Campo opcional:
- `tipoObjetivo` — categoriza o objetivo: `'proteger_reputacao' | 'proteger_pessoa' | 'expor_culpado' | 'esconder_erro' | 'proteger_empresa' | 'garantir_versao'`.

---

### `privateFiles`

Array de arquivos privados. Cada arquivo tem:

Campos obrigatórios:
- `id` — identificador único em formato `'arq-nome-personagem'`.
- `characterId` — a quem pertence o arquivo.
- `titulo` — título curto do documento (máx. 6 palavras). Exemplos: `"Mensagem de 21h43"`, `"Recibo de impressão"`.
- `tipo` — tipo do documento: `'mensagem' | 'email' | 'recibo' | 'foto' | 'anotacao' | 'relatorio' | 'alerta' | 'print'`.
- `corpo` — texto do documento (60 a 120 palavras). Deve ser diálogo ou conteúdo concreto, não apenas descrição.
- `fase` — em que fase este arquivo é entregue ao jogador: `'leitura_inicial' | 'investigacao' | 'nova_evidencia'`.
- `classificacao` — tipo de pista: `'essencial' | 'apoio' | 'ambigua' | 'distracao' | 'reputacional' | 'social'`.

Campo opcional:
- `recompensaDeAcaoSecreta` — boolean. Se `true`, este arquivo só aparece como recompensa de ação secreta e não é entregue automaticamente.

---

### `evidences`

Array de evidências públicas. Cada evidência tem:

Campos obrigatórios:
- `id` — identificador em formato `'ev-nome'`.
- `titulo` — título curto.
- `tipo` — tipo: `'email' | 'mensagem' | 'recibo' | 'registro' | 'relatorio' | 'depoimento'`.
- `corpo` — conteúdo (50 a 100 palavras).
- `fase` — quando é liberada: `'apresentacao' | 'investigacao' | 'nova_evidencia' | 'confronto'`.
- `visibilidade` — `'publica'` (todos veem ao mesmo tempo) ou `'privada'` (só o personagem indicado).
- `classificacao` — tipo de pista.

---

### `secretActions`

Array de ações secretas. Cada ação tem:

Campos obrigatórios:
- `id` — identificador único.
- `fase` — em que fase a ação é distribuída.
- `eligibleCharacterIds` — array de `characterId`s que podem receber a ação. Pode ser qualquer subconjunto dos personagens.
- `instrucao` — texto da ação em tom de orientação de campo (máx. 40 palavras). Deve soar como protocolo, não como prenda.
- `alternativa` — instrução alternativa para quem não puder cumprir a principal.
- `recompensa` — descrição da recompensa completa (arquivo extra, metainformação, etc.).
- `recompensaAlternativa` — recompensa reduzida para quem cumpriu a alternativa.
- `metainfoParaOutros` — string opcional exibida para outros jogadores quando a ação é cumprida. Deve criar suspeita sem revelar o conteúdo.

---

### `verdictQuestions`

Array de perguntas do veredito. Cada pergunta tem:

Campos obrigatórios:
- `id` — identificador.
- `pergunta` — texto da pergunta (máx. 10 palavras).
- `opcoes` — array de 3 a 5 opções de resposta (objetos com `id` e `texto`).
- `respostaCorretaId` — `id` da resposta correta.
- `obrigatoria` — boolean. Use `true` para as 3 perguntas principais, `false` para opcionais.

---

### `revelation`

Campos obrigatórios:
- `verdadeCompleta` — texto narrativo de 3 a 5 frases contando o que realmente aconteceu.
- `linhaDoTempoReal` — array de eventos com `horario` e `descricao`.
- `pistaIgnoradaComum` — pista que os grupos costumam ignorar mas era decisiva.
- `perguntasPosjogo` — array de perguntas para guiar a conversa após a revelação.

---

## Campos opcionais (não implementados no MVP, mas aceitos pelo tipo)

- `scoring.pesos` — peso de cada pergunta na pontuação coletiva
- `titulos` — títulos pós-jogo por personagem, condicionais ao resultado

---

## Como calibrar os personagens

### Distribuição de informação

Cada personagem deve ter:
- 1 pista essencial (necessária para resolver uma das 3 perguntas)
- 1 pista ambígua ou de apoio (útil mas não decisiva)
- 1 informação que prejudica sua própria reputação

Nenhuma pista essencial pode existir em apenas um personagem. Se a pista é essencial, deve aparecer de pelo menos duas formas (documento + testemunho + metainformação + evidência pública).

### Objetivos individuais

Cada objetivo deve:
- Criar uma razão para não revelar tudo imediatamente
- Ser avaliável ao final (passou ou não passou — não pode ser subjetivo demais)
- Nunca impedir a resolução do caso — apenas criar atrito

Objetivos proibidos: impedir que o grupo chegue a qualquer resposta correta, mentir sobre todos os fatos do personagem, sabotar o veredito.

### Personagens sem culpa direta

A maioria dos personagens não é culpada do incidente principal. Mas todos devem ter:
- Um segredo que prefeririam não revelar
- Uma motivação para omitir ou distorcer alguma informação
- Uma pista útil que o grupo precisa extrair

Personagem irrelevante é falha de design, não de jogabilidade.

---

## Como calibrar as ações secretas

### Critérios de qualidade

Uma boa ação secreta:
- Cria comportamento observável em mesa (alguém faz algo diferente)
- Tem recompensa narrativa ligada ao caso
- Gera suspeita ou curiosidade nos outros jogadores
- Pode ser cumprida por qualquer pessoa, em qualquer contexto físico (se não for, deve ter alternativa acessível)
- Não dura mais de 2 a 3 minutos

Uma ação secreta ruim:
- Parece prenda desconectada do caso
- Exige álcool, contato físico ou exposição pessoal
- Não gera nenhuma conversa
- Pode ser ignorada sem nenhum impacto

### Distribuição por fase

- Fase de Investigação: 2 a 3 ações para personagens-chave
- Fase de Confronto: 1 a 2 ações de pressão (perguntas diretas, defesas públicas)
- Não distribuir ações na Leitura Privada ou Veredito

---

## Sugestões de temas para o Caso 2

### Opção A — A Herança Contestada

Contexto: família de médio porte, leitura do testamento de um avô/tio rico. Documento desapareceu ou foi adulterado. Todos os herdeiros têm motivo.

Tom: familiar, leve, cômico com tensão reputacional.

Funciona bem porque:
- Todo mundo conhece a dinâmica de herança familiar
- Segredos de família têm peso emocional sem violência
- Versões conflitantes são naturais nesse contexto
- Ideal para grupos que se conhecem bem (amigos próximos, família)

### Opção B — A Viagem que Não Aconteceu

Contexto: grupo de amigos planeava uma viagem juntos. Uma pessoa cancelou a reserva sem avisar ninguém. A viagem foi perdida. Cada pessoa tem uma versão diferente do que aconteceu.

Tom: cotidiano, amizades, leve.

Funciona bem porque:
- Contexto imediato e reconhecível
- Sem jargão corporativo — mais acessível
- Motivações pequenas (ciúme, dinheiro, relacionamento) são mais críveis
- Ideal para grupos de amigos

### Opção C — O Projeto Cancelado

Contexto: startup de tecnologia. Um projeto promissor foi cancelado um dia antes do pitch para investidores. Alguém vazou o deck para um concorrente, ou alguém sabotou internamente para impedir o lançamento.

Tom: corporativo moderno, rivalidade, ambição.

Funciona bem porque:
- Estrutura similar ao Dossiê Sumido mas com motivações diferentes
- Permite personagens com interesses financeiros claros
- Conflito entre fundadores é dramaticamente rico
- Ideal para grupos que trabalham em tech ou startups

### Opção D — A Noite do Aniversário

Contexto: festa de aniversário surpresa que deu errado. Algo valioso sumiu, um segredo foi revelado sem querer, ou uma pessoa ficou magoada de um jeito que ninguém entende completamente. O grupo precisa reconstruir o que aconteceu na festa.

Tom: social, dramático, leve.

Funciona bem porque:
- Sem contexto profissional — acessível a qualquer grupo
- Aliança e rivalidade social são motivações universais
- Ideal para bar ou festa

### Recomendação para o Caso 2

Começar com a Opção B (A Viagem que Não Aconteceu) ou a Opção D (A Noite do Aniversário) — ambas evitam jargão corporativo, têm motivações imediatas e funcionam para o público mais amplo do app.

O Caso 2 deve ser validado com o mesmo processo do Dossiê Sumido: escrever a verdade completa antes das pistas, fazer leitura editorial com todas as fichas impressas, verificar que nenhuma pista essencial fica em um único jogador.
