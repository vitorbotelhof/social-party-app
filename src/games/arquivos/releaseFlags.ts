/**
 * Arquivos — Feature Flags de Release
 *
 * Controla a disponibilidade de Arquivos no catálogo e seus comportamentos
 * de release sem exigir mudanças espalhadas no código.
 *
 * Sprint 15 — Release Interno:
 *   Para ativar: ARQUIVOS_DISPONIVEL = true
 *   Para desativar: ARQUIVOS_DISPONIVEL = false
 *
 * Quando ARQUIVOS_DISPONIVEL = false:
 *   - o jogo desaparece do catálogo principal
 *   - criação de sala retorna erro antes de qualquer Firebase call
 *   - jogadores que tentem acessar via link direto recebem tela de indisponível
 *
 * Regras de manutenção:
 *   - não adicionar lógica de negócio aqui — só flags
 *   - não ler de AsyncStorage ou Firebase — deve ser síncrono e determinístico
 *   - em caso de dúvida, manter false até playtest confirmar qualidade
 */

// ─── Flag principal ───────────────────────────────────────────────────────────

/**
 * Controla se Arquivos aparece no catálogo e aceita novas salas.
 *
 * true  → release ativo. Jogadores podem criar salas e jogar.
 * false → release pausado. Jogo some do catálogo sem remover código.
 */
export const ARQUIVOS_DISPONIVEL = true;

// ─── Flags de funcionalidade ─────────────────────────────────────────────────

/**
 * Ativa o banner de reconexão na tela de partida.
 *
 * Deve permanecer true em campo para degradação graciosa.
 * Só desativar em testes de UI específicos.
 */
export const ARQUIVOS_BANNER_RECONEXAO = true;

/**
 * Ativa logging estruturado no console durante desenvolvimento.
 *
 * Controlado internamente pelo arquivosLogger via __DEV__.
 * Esta flag é reserva para forçar silêncio em testes de performance.
 */
export const ARQUIVOS_LOGGING_DEV = true;

/**
 * Número mínimo de jogadores para abrir o caso.
 *
 * MVP: exatamente 6. Não alterar sem criar um segundo caso com targetPlayers diferente.
 * Derivado de CASO_DOSSIE_SUMIDO.config.targetPlayers — aqui como constante explícita
 * para que o gameRegistry possa importar sem criar dependência circular com o engine.
 */
export const ARQUIVOS_MIN_JOGADORES = 6;
export const ARQUIVOS_MAX_JOGADORES = 6;
