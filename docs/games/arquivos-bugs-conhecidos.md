# ARQUIVOS — BUGS CONHECIDOS E LIMITAÇÕES

## Formato deste documento

Cada item tem: descrição, origem (sprint onde foi identificado), status e mitigação atual.

---

## Bugs corrigidos antes do release v1

### Duplo processamento de resultado na reconexão

Origem: Sprint 10 (identificado), Sprint 14 (corrigido).

Descrição: quando um jogador desconectava e reconectava durante a fase de Revelação, o componente `TelaArquivos` remontava e disparava `processarResultadoArquivos` novamente, duplicando contadores de sessão no SessionStore.

Correção: `resultadosProcessadosPorSessao` — Set no escopo do módulo, fora do componente. Sobrevive a remontagens dentro do mesmo processo. Chave `${roomCode}:${jogadorId}` por sessão.

---

## Limitações estruturais do MVP

### L1 — Exatamente 6 jogadores

Origem: Sprint 0.

Descrição: O caso O Dossiê Sumido foi criado para exatamente 6 jogadores. O sistema rejeita início com menos de 6 e não suporta mais de 6.

Mitigação atual: bloqueio explícito na tela de configuração com mensagem clara.

Backlog: variações para 4 e 8 jogadores exigem casos ou personagens alternativos — não uma mudança de engine.

---

### L2 — Firebase Security Rules em modo v0.2

Origem: Sprint 10.

Descrição: as regras do Firebase protegem escrita por papel (host vs. jogador vs. leitura pública) mas não isolam leitura de arquivos privados no nível do Firebase RTDB sem autenticação. Um jogador com acesso ao SDK poderia tecnicamente ler o nó de outro jogador conhecendo o `playerId`.

Mitigação atual: nenhum dado realmente confidencial é armazenado — os arquivos privados são conteúdo de jogo, não dados pessoais. Em sessões presenciais com pessoas conhecidas o risco é baixo.

Backlog: Firebase Authentication + regras de leitura por UID resolveria completamente. Requer mudança arquitetural maior.

---

### L3 — Logs apenas em memória

Origem: Sprint 14.

Descrição: o logger estruturado (`arquivosLogger.ts`) armazena entradas em memória com buffer de 200 entradas. Ao fechar o app, todos os logs são perdidos.

Mitigação atual: em `__DEV__`, todos os eventos aparecem no console em tempo real. `exportarLogsArquivos()` está disponível para extração manual antes de fechar o app.

Backlog: conectar `exportarLogsArquivos` a um endpoint remoto de coleta ou AsyncStorage para persistência entre sessões.

---

### L4 — Transferência de controle de host não automática

Origem: Sprint 14.

Descrição: se o host desconectar permanentemente durante a partida, nenhum outro jogador assume o controle automaticamente. A partida fica sem possibilidade de avanço de fase.

Mitigação atual: se o host fechar e reabrir o app e entrar pelo código, o controle retorna automaticamente. O checklist de suporte orienta o grupo a aguardar o host reconectar.

Backlog: lógica de promoção automática de host — o jogador mais antigo na sala assume se o host ficar offline por mais de 2 minutos.

---

### L5 — Jogador que entra na fase de Leitura Privada após reconexão não recebe os arquivos na tela

Origem: Sprint 11.

Descrição: um jogador que desconecta durante a Leitura Privada e reconecta após a fase avançar não vê mais sua ficha de personagem na tela principal. O conteúdo privado ainda existe no Firebase mas a tela não exibe mais a fase de leitura.

Mitigação atual: Sprint 11 adicionou botão "forçar avanço (jogador ausente)" para o host. Se o jogador reconectar, pode ler arquivos diretamente na seção "seus arquivos" da tela de investigação (os arquivos privados continuam visíveis por fase em diante).

Backlog: permitir que o jogador acesse a ficha completa em qualquer fase posterior.

---

### L6 — Ação secreta não substituída automaticamente se inelegível

Origem: Sprint 7.

Descrição: se um jogador recebe uma ação secreta que envolve comportamento físico (ex.: "fique em pé por 2 minutos") e está em contexto onde isso é impossível, a alternativa precisa ser acessada manualmente tocando em "não consigo fazer esta ação". O sistema não detecta automaticamente contexto ou limitação física.

Mitigação atual: toda ação tem alternativa acessível via botão. A alternativa oferece recompensa reduzida mas válida.

Backlog: alternativa automática baseada em perfil de acessibilidade — não prioritário.

---

### L7 — Veredito não pode ser editado após envio

Origem: Sprint 8.

Descrição: uma vez que o host envia o veredito, ele não pode ser corrigido. Se o host tocar em "enviar" por acidente antes de confirmar com o grupo, o veredito errado é registrado e a revelação acontece com as respostas incorretas.

Mitigação atual: o app pede confirmação antes de enviar. O host deve confirmar cada resposta com o grupo antes de tocar em enviar.

Backlog: período de 30 segundos para cancelar após o envio, antes de a revelação começar.

---

### L8 — Pontuação coletiva não considera peso relativo das perguntas

Origem: Sprint 8.

Descrição: as 3 perguntas obrigatórias têm o mesmo peso na pontuação coletiva. Errar "quem removeu o dossiê" tem o mesmo impacto que errar "qual foi a motivação", mesmo que uma resposta seja mais central para o caso.

Mitigação atual: o sistema funciona — a pontuação é justa se não perfeita. Não distorce a experiência.

Backlog: pesos configuráveis por pergunta no template do caso.

---

### L9 — Sem modo de reconexão avançada para estado de Veredito

Origem: Sprint 14.

Descrição: um jogador que desconecta durante a fase de Veredito e reconecta vê o estado atual (Veredito em andamento) mas não vê as respostas que o host já selecionou antes da reconexão. As respostas ficam vazias até o host selecionar novamente ou o veredito ser enviado.

Mitigação atual: o host deve confirmar todas as respostas com o grupo antes de enviar, e pode consultar novamente se precisar.

Backlog: persistir rascunho de veredito no Firebase para que jogadores reconectados vejam o estado atual.

---

### L10 — Resultado individual não é salvo além da sessão

Origem: Sprint 9.

Descrição: o resultado individual de cada jogador (objetivo alcançado, segredo exposto, título pós-jogo) fica acessível apenas durante a tela de revelação. Ao sair do app, os dados não são recuperáveis.

Mitigação atual: resumo compartilhável disponível na tela de encerramento — o jogador pode compartilhar antes de sair.

Backlog: histórico de partidas com resumo por sessão.

---

## Comportamentos esperados (não são bugs)

### Jogador que entrou atrasado não vê arquivos de fases anteriores

Comportamento intencional de privacidade. Arquivos privados são entregues no início da partida. Não há distribuição retroativa.

### Host não consegue ler os arquivos privados de outros jogadores

Comportamento intencional de segurança. A tela de host tem controles de fase mas não tem visão dos segredos dos outros jogadores.

### Ação secreta não aparece para todos os jogadores na mesma fase

Comportamento intencional. Ações secretas são distribuídas seletivamente — nem todo jogador recebe ação em toda fase. O design prevê que 3 a 5 jogadores recebam ações ao longo da partida, não todos em todas as fases.
