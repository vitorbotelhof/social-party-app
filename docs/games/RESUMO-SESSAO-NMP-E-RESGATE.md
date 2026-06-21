# Resumo da Sessão — Na Mesma Página + Operação Resgate

Contexto consolidado para continuar o desenvolvimento. Definições finais apenas — para discussões e raciocínio, ver `na-mesma-pagina.md`, `na-mesma-pagina-roadmap.md`, `operacao-resgate.md` e `operacao-resgate-roadmap.md`.

---

## 1. Na Mesma Página

Jogo de associação por times, inspirado em Codenames. Status: **completo (Sprints 0–7)**.

### Conceito
Dois times com palavras secretas numa grade. Um Mestre por time vê o mapa e dá pistas (palavra + número) para o time adivinhar suas palavras antes do adversário. Uma palavra "perigosa" pode encerrar o jogo na hora.

### Definições finais
- **Cor:** `#6366F1` (indigo)
- **Jogadores:** 4–12, número par obrigatório (divididos em 2 times iguais)
- **4 modos:** Clássico (grade 5×5, perigosa encerra o jogo), Rápido (4×4, 5–8 min), Festa (perigosa é penalidade, não fim de jogo), Difícil (mais neutras, mesma grade do clássico)
- **Distribuição por modo** (`DISTRIBUICAO_POR_MODO`): clássico 9/8/7/1, rápido 5/4/6/1, festa 9/8/7/1, difícil 8/7/9/1 (timeA/timeB/neutras/perigosa)
- **7 decks de palavras** (todos ativos): cotidiano, brasil, cultura_pop, internet, futebol, sentimentos, surpresa (mix)
- **Mecânica de chute:** acertos consecutivos permitem continuar; até N+1 tentativas por pista (chute livre)

### Arquitetura de arquivos
```
src/games/na-mesma-pagina/
  types.ts       — ModoNMP, NomeDeck, Jogador, ConfiguracaoNMP, EstadoNMP, etc.
  engine.ts       — criarEstadoInicial, darPistaSemVer, revelarPalavra, passarTurno, etc.
  palavras.ts     — bancos de palavras + sortearPalavras()
src/screens/
  TelaConfiguracaoLocalNaMesmaPagina.tsx
  TelaJogoLocalNaMesmaPagina.tsx   — 6 sub-telas (aguardando pista, ver mapa, dar pista, adivinhando, resultado, encerrado)
```
Navegação, `gameRegistry.ts` e `TelaInicio.tsx` já wired. Assets em `assets/games/na mesma pagina/`.

---

## 2. Operação Resgate

Jogo de dedução social e negociação, inspirado em Two Rooms and a Boom. Status: **completo (Sprints 0–7)**.

### Conceito
Jogadores divididos em duas zonas físicas/simbólicas (Zona A / Zona B). Cada jogador tem um papel secreto. A cada rodada, os líderes de cada zona negociam e trocam 1 membro com a outra zona. Ao final: se o Alvo e a Ameaça estiverem na mesma zona, a Sabotagem vence; se estiverem separados, o Resgate vence.

### Definições finais
- **Cor:** `#F97316` (orange). Zona A: `#3B82F6` (azul). Zona B: `#10B981` (emerald)
- **Jogadores:** 4–12
- **3 modos:** Rápido (3 rodadas, ~15 min), Padrão (4 rodadas, ~25 min), Avançado (5 rodadas, ~35 min, com Duplo Agente e eventos especiais opcionais)
- **Papéis:** `alvo`, `ameaca` (sempre 1 cada), `agente`, `informante`, `operador`, `duplo_agente` (só Avançado). Facções: Resgate (todos exceto ameaça/duplo_agente) vs Sabotagem
- **Distribuição de papéis:** tabelas fixas por modo × contagem de jogadores (4–12), em `papeis.ts`
- **Informantes** recebem 1 fragmento de informação verdadeira sobre zonas (gerado após a divisão real de zonas via `ajustarInformacoesDeZona`)
- **Duplo Agente** vê a mesma carta que Operador (não sabe que é da Sabotagem) — decisão de design deliberada
- **5 eventos especiais** (modo Avançado, opcionais): comunicação cortada, vazamento de informação, ordem superior, última chance, operador descoberto
- **Timer de discussão** opcional: 1:30 / 2 / 3 / 4 minutos
- **Decisão chave:** ao final, o sistema identifica e narra qual troca foi decisiva para o resultado (`identificarDecisaoChave`)

### Arquitetura de arquivos
```
src/games/operacao-resgate/
  types.ts    — PapelOR, FaccaoOR, ZonaOR, ModoOR, FaseOR, JogadorOR, ConfiguracaoOR, EstadoOR, etc.
  engine.ts   — criarEstadoInicial, avancarDistribuicao, registrarDecisaoZonaA/B, verificarCondicaoFinal, etc.
  papeis.ts   — distribuirPapeis, gerarTextoCarta, EVENTOS_ESPECIAIS, labels e cores
  index.ts    — re-exporta os 3 módulos
src/screens/
  TelaConfiguracaoLocalOperacaoResgate.tsx
  TelaJogoLocalOperacaoResgate.tsx   — 7 sub-telas (distribuindo, zonas iniciais, discussão, evento, decisão zona A/B, resultado rodada, debrief)
```
Navegação, `gameRegistry.ts` e `TelaInicio.tsx` já wired (`jogoId === 'operacao-resgate'`). Assets em `assets/games/operacao resgate/`.

---

## Convenções de código reaproveitáveis no projeto

- `assegurarSessaoIniciada()` + `salvarGrupoRecente()` — padrão de sessão local ao iniciar um jogo
- `SafeAreaView` de `react-native-safe-area-context`, sempre `edges={['top', 'bottom']}`
- Haptics: `ImpactFeedbackStyle.Light/Medium`, `NotificationFeedbackType.Success/Warning/Error`
- Tema: `cores`, `espacamento`, `familias`, `tipografia`, `raio` de `@/theme/colors`
  - `raio` só tem: `sm, md, lg, xl, xxl, pill` (não existe `xs` — usar número direto se precisar)
  - `tipografia` só tem: `tamanhoLegenda, tamanhoCorpoMenor, tamanhoCorpo, tamanhoSubtitulo, tamanhoTitulo, tamanhoTituloGrande` (não existe `tamanhoCabecalho`)
- Componentes reutilizáveis: `CadastroJogadores`, `SecaoConfig`, `SegmentControl`
- Navegação para tela de jogo usa `navigation.replace()` (sem permitir voltar à configuração)
- Revelação de carta privada: fundo neutro escuro, mesmo fluxo visual para todos os papéis, sem cor de facção exposta — para não dar pista visual de quem é o quê
- `gameRegistry.ts` exige `categoriasPrincipais` (de `CategoriaPrincipalId`), `tagsSociais` (de `TagSocialId`) e `categorias` (de `CategoriaEmocional`) — strings livres não passam o type-check; checar `src/games/taxonomia.ts` para os valores válidos antes de escrever uma nova entrada

---

## Próximos passos sugeridos
- Testar manualmente os dois jogos no app (não foi feito teste em dispositivo/simulador nesta sessão, só type-check)
- Considerar playtests para validar duração real das partidas e clareza dos textos de carta do Operação Resgate
- Avaliar se passa a vale a pena ter modo multiplayer (Firebase) para algum desses jogos no futuro — v1 de ambos é local/mesmo-dispositivo
