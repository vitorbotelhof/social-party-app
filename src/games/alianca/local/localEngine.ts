/**
 * ALIANCA LOCAL ENGINE
 *
 * Motor do modo 1 celular. O engine guarda papéis, votos e ações de missão
 * em memória privada. A UI só recebe estado público.
 *
 * Loop:
 *   distribuir papéis
 *   → líder escolhe equipe
 *   → debate
 *   → votação secreta da equipe
 *   → missão secreta, se aprovada
 *   → reveal sem autoria
 *   → próxima liderança
 */

import type {
  AcaoMissaoAlianca,
  AcaoMissaoRegistradaAlianca,
  AliancaCallbacks,
  ConfiguracaoAlianca,
  EquipeAliancaRejeitada,
  EstadoAliancaPublico,
  HistoricoMissaoAlianca,
  JogadorAlianca,
  PapelAlianca,
  PapelAtribuidoAlianca,
  PlayerId,
  ResultadoAliancaFinalizado,
  ResultadoVotacaoEquipeAlianca,
  VotoEquipeAlianca,
  VotoEquipeRegistradoAlianca,
} from './types';
import { criarConfiguracaoAlianca } from './types';

interface EstadoPrivadoAlianca {
  papeis: Map<PlayerId, PapelAlianca>;
  votosEquipe: VotoEquipeRegistradoAlianca[];
  acoesMissao: AcaoMissaoRegistradaAlianca[];
}

export class AliancaLocalEngine {
  private readonly _jogadores: JogadorAlianca[];
  private readonly _config: ConfiguracaoAlianca;
  private readonly _callbacks: AliancaCallbacks;
  private readonly _onMudanca: (estado: EstadoAliancaPublico) => void;
  private _priv: EstadoPrivadoAlianca;
  private _estado: EstadoAliancaPublico;

  constructor(
    jogadores: JogadorAlianca[],
    config: ConfiguracaoAlianca | null,
    onMudanca: (estado: EstadoAliancaPublico) => void,
    callbacks: AliancaCallbacks = {},
  ) {
    const configuracao = config ?? criarConfiguracaoAlianca(jogadores.length);
    if (jogadores.length < configuracao.minJogadores) {
      throw new Error('Aliança Local: mínimo 4 jogadores.');
    }
    if (jogadores.length > configuracao.maxJogadores) {
      throw new Error('Aliança Local: máximo 10 jogadores.');
    }

    this._jogadores = jogadores;
    this._config = configuracao;
    this._callbacks = callbacks;
    this._onMudanca = onMudanca;

    const jogadoresOrdem = jogadores.map((j) => j.id);
    const papeis = this._atribuirPapeis(jogadoresOrdem);

    this._priv = {
      papeis,
      votosEquipe: [],
      acoesMissao: [],
    };

    this._estado = {
      fase: 'distribuindo_papeis',
      rodada: 1,
      indiceLider: 0,
      liderId: jogadoresOrdem[0]!,
      jogadoresOrdem,
      equipeProposta: [],
      distribuicao: { indiceAtual: 0, jogadoresOrdem },
      votacao: null,
      missao: null,
      resultadoVotacao: null,
      resultadoMissao: null,
      historicoMissoes: [],
      sucessosLeais: 0,
      sabotagensTraidores: 0,
      rejeicoesSeguidas: 0,
      vencedor: null,
      revelacaoFinal: null,
      configuracao,
      totalJogadores: jogadores.length,
    };
  }

  getEstado(): EstadoAliancaPublico {
    return this._estado;
  }

  avancarDistribuicao(): void {
    if (this._estado.fase !== 'distribuindo_papeis') return;
    const distribuicao = this._estado.distribuicao;
    if (!distribuicao) return;

    const proximoIndice = distribuicao.indiceAtual + 1;
    if (proximoIndice >= distribuicao.jogadoresOrdem.length) {
      this._emit({
        fase: 'escolhendo_equipe',
        distribuicao: null,
      });
      return;
    }

    this._emit({
      distribuicao: { ...distribuicao, indiceAtual: proximoIndice },
    });
  }

  proporEquipe(equipe: PlayerId[]): void {
    if (this._estado.fase !== 'escolhendo_equipe') return;
    if (!this._equipeEhValida(equipe)) return;

    this._emit({
      fase: 'debate',
      equipeProposta: [...equipe],
      resultadoVotacao: null,
      resultadoMissao: null,
    });
  }

  iniciarVotacao(): void {
    if (this._estado.fase !== 'debate') return;
    this._priv.votosEquipe = [];
    this._emit({
      fase: 'votando_equipe',
      votacao: {
        indiceAtual: 0,
        jogadoresOrdem: [...this._estado.jogadoresOrdem],
        totalVotos: 0,
      },
    });
  }

  registrarVotoEquipe(jogadorId: PlayerId, voto: VotoEquipeAlianca): void {
    if (this._estado.fase !== 'votando_equipe') return;
    const votacao = this._estado.votacao;
    if (!votacao) return;
    if (votacao.jogadoresOrdem[votacao.indiceAtual] !== jogadorId) return;

    this._priv.votosEquipe = [
      ...this._priv.votosEquipe.filter((v) => v.jogadorId !== jogadorId),
      { jogadorId, voto },
    ];

    const proximoIndice = votacao.indiceAtual + 1;
    if (proximoIndice >= votacao.jogadoresOrdem.length) {
      this._resolverVotacaoEquipe();
      return;
    }

    this._emit({
      votacao: {
        ...votacao,
        indiceAtual: proximoIndice,
        totalVotos: this._priv.votosEquipe.length,
      },
    });
  }

  confirmarResultadoVotacao(): void {
    if (this._estado.fase !== 'resultado_votacao') return;
    const resultado = this._estado.resultadoVotacao;
    if (!resultado) return;

    if (!resultado.aprovado) {
      if (this._estado.rejeicoesSeguidas >= this._config.maxRejeicoesSeguidas) {
        this._encerrarJogo('traidores');
        return;
      }
      this._avancarLiderSemRodada();
      return;
    }

    this._priv.acoesMissao = [];
    this._emit({
      fase: 'missao',
      missao: {
        indiceAtual: 0,
        participantesOrdem: [...this._estado.equipeProposta],
        totalAcoes: 0,
      },
    });
  }

  registrarAcaoMissao(jogadorId: PlayerId, acao: AcaoMissaoAlianca): void {
    if (this._estado.fase !== 'missao') return;
    const missao = this._estado.missao;
    if (!missao) return;
    if (missao.participantesOrdem[missao.indiceAtual] !== jogadorId) return;
    if (!this._acaoMissaoEhValida(jogadorId, acao)) return;

    this._priv.acoesMissao = [
      ...this._priv.acoesMissao.filter((a) => a.jogadorId !== jogadorId),
      { jogadorId, acao },
    ];

    const proximoIndice = missao.indiceAtual + 1;
    if (proximoIndice >= missao.participantesOrdem.length) {
      this._resolverMissao();
      return;
    }

    this._emit({
      missao: {
        ...missao,
        indiceAtual: proximoIndice,
        totalAcoes: this._priv.acoesMissao.length,
      },
    });
  }

  confirmarResultadoMissao(): void {
    if (this._estado.fase !== 'resultado_missao') return;
    if (this._estado.vencedor) return;
    this._avancarRodada();
  }

  getJogadorNaVezDistribuicao(): JogadorAlianca | null {
    const distribuicao = this._estado.distribuicao;
    if (!distribuicao) return null;
    const id = distribuicao.jogadoresOrdem[distribuicao.indiceAtual];
    return this._jogadores.find((j) => j.id === id) ?? null;
  }

  getJogadorVotando(): JogadorAlianca | null {
    const votacao = this._estado.votacao;
    if (!votacao) return null;
    const id = votacao.jogadoresOrdem[votacao.indiceAtual];
    return this._jogadores.find((j) => j.id === id) ?? null;
  }

  getParticipanteMissaoNaVez(): JogadorAlianca | null {
    const missao = this._estado.missao;
    if (!missao) return null;
    const id = missao.participantesOrdem[missao.indiceAtual];
    return this._jogadores.find((j) => j.id === id) ?? null;
  }

  getPapelAtribuido(jogadorId: PlayerId): PapelAtribuidoAlianca | null {
    const papel = this._priv.papeis.get(jogadorId);
    if (!papel) return null;
    return {
      papel,
      aliadosTraidores:
        papel === 'traidor'
          ? this._estado.jogadoresOrdem.filter(
              (id) =>
                id !== jogadorId && this._priv.papeis.get(id) === 'traidor',
            )
          : [],
    };
  }

  getAcoesMissaoDisponiveis(jogadorId: PlayerId): AcaoMissaoAlianca[] {
    const papel = this._priv.papeis.get(jogadorId);
    if (papel === 'traidor') return ['ajudar', 'sabotar'];
    if (papel === 'leal') return ['ajudar'];
    return [];
  }

  getTamanhoEquipeAtual(): number {
    const indice = Math.min(
      this._estado.rodada - 1,
      this._config.tamanhosMissoes.length - 1,
    );
    return this._config.tamanhosMissoes[indice] ?? 2;
  }

  destroy(): void {
    // Engine local não mantém recursos persistentes.
  }

  private _atribuirPapeis(
    jogadoresOrdem: PlayerId[],
  ): Map<PlayerId, PapelAlianca> {
    const papeis = new Map<PlayerId, PapelAlianca>();
    const ordem = this._embaralhar(jogadoresOrdem);
    const traidores = new Set(ordem.slice(0, this._config.numeroTraidores));

    for (const id of jogadoresOrdem) {
      papeis.set(id, traidores.has(id) ? 'traidor' : 'leal');
    }

    return papeis;
  }

  private _embaralhar<T>(itens: T[]): T[] {
    const copia = [...itens];
    for (let i = copia.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copia[i], copia[j]] = [copia[j]!, copia[i]!];
    }
    return copia;
  }

  private _equipeEhValida(equipe: PlayerId[]): boolean {
    if (equipe.length !== this.getTamanhoEquipeAtual()) return false;
    const unicos = new Set(equipe);
    if (unicos.size !== equipe.length) return false;
    return equipe.every((id) => this._estado.jogadoresOrdem.includes(id));
  }

  private _acaoMissaoEhValida(
    jogadorId: PlayerId,
    acao: AcaoMissaoAlianca,
  ): boolean {
    const papel = this._priv.papeis.get(jogadorId);
    if (papel === 'leal') return acao === 'ajudar';
    if (papel === 'traidor') return acao === 'ajudar' || acao === 'sabotar';
    return false;
  }

  private _resolverVotacaoEquipe(): void {
    const aprovacoes = this._priv.votosEquipe.filter(
      (v) => v.voto === 'aprovar',
    ).length;
    const rejeicoes = this._priv.votosEquipe.length - aprovacoes;
    const aprovado = aprovacoes > rejeicoes;
    const rejeicoesSeguidas = aprovado ? 0 : this._estado.rejeicoesSeguidas + 1;
    const resultado: ResultadoVotacaoEquipeAlianca = {
      aprovado,
      aprovacoes,
      rejeicoes,
      rejeicoesSeguidas,
    };

    if (!aprovado) {
      const rejeicao: EquipeAliancaRejeitada = {
        rodada: this._estado.rodada,
        liderId: this._estado.liderId,
        equipe: [...this._estado.equipeProposta],
        aprovacoes,
        rejeicoes,
        rejeicoesSeguidas,
      };
      this._callbacks.onEquipeRejeitada?.(rejeicao);
    }

    this._emit({
      fase: 'resultado_votacao',
      votacao: null,
      resultadoVotacao: resultado,
      rejeicoesSeguidas,
    });
  }

  private _resolverMissao(): void {
    const sabotagens = this._priv.acoesMissao.filter(
      (a) => a.acao === 'sabotar',
    ).length;
    const sucesso = sabotagens === 0;
    const sucessosLeais = this._estado.sucessosLeais + (sucesso ? 1 : 0);
    const sabotagensTraidores =
      this._estado.sabotagensTraidores + (sucesso ? 0 : 1);
    const resultadoVotacao = this._estado.resultadoVotacao;
    const historico: HistoricoMissaoAlianca = {
      rodada: this._estado.rodada,
      liderId: this._estado.liderId,
      equipe: [...this._estado.equipeProposta],
      aprovacoes: resultadoVotacao?.aprovacoes ?? 0,
      rejeicoes: resultadoVotacao?.rejeicoes ?? 0,
      aprovada: true,
      sabotagens,
      sucesso,
    };

    const historicoMissoes = [...this._estado.historicoMissoes, historico];
    const vencedor =
      sucessosLeais >= this._config.totalMissoesParaVencer
        ? 'leais'
        : sabotagensTraidores >= this._config.totalMissoesParaVencer
          ? 'traidores'
          : null;

    this._callbacks.onRodadaResolvida?.({
      rodada: historico.rodada,
      liderId: historico.liderId,
      equipe: historico.equipe,
      aprovacoes: historico.aprovacoes,
      rejeicoes: historico.rejeicoes,
      sabotagens,
      sucesso,
      sucessosLeais,
      sabotagensTraidores,
      rejeicoesSeguidasAntesDaMissao: this._estado.rejeicoesSeguidas,
    });

    this._emit({
      fase: vencedor ? 'finalizado' : 'resultado_missao',
      missao: null,
      resultadoMissao: {
        sucesso,
        sabotagens,
        rodada: this._estado.rodada,
        equipe: [...this._estado.equipeProposta],
      },
      historicoMissoes,
      sucessosLeais,
      sabotagensTraidores,
      vencedor,
      revelacaoFinal: vencedor
        ? this._construirRevelacaoFinal(historicoMissoes)
        : null,
    });

    if (vencedor) this._emitFinalizado(vencedor, historicoMissoes);
  }

  private _avancarLiderSemRodada(): void {
    const proximoIndice = this._proximoIndiceLider();
    this._emit({
      fase: 'escolhendo_equipe',
      indiceLider: proximoIndice,
      liderId: this._estado.jogadoresOrdem[proximoIndice]!,
      equipeProposta: [],
      resultadoVotacao: null,
      resultadoMissao: null,
      votacao: null,
      missao: null,
    });
  }

  private _avancarRodada(): void {
    const proximoIndice = this._proximoIndiceLider();
    this._emit({
      fase: 'escolhendo_equipe',
      rodada: this._estado.rodada + 1,
      indiceLider: proximoIndice,
      liderId: this._estado.jogadoresOrdem[proximoIndice]!,
      equipeProposta: [],
      resultadoVotacao: null,
      resultadoMissao: null,
      votacao: null,
      missao: null,
    });
  }

  private _proximoIndiceLider(): number {
    return (this._estado.indiceLider + 1) % this._estado.jogadoresOrdem.length;
  }

  private _encerrarJogo(vencedor: 'leais' | 'traidores'): void {
    const revelacaoFinal = this._construirRevelacaoFinal(
      this._estado.historicoMissoes,
    );

    this._emit({
      fase: 'finalizado',
      vencedor,
      revelacaoFinal,
      votacao: null,
      missao: null,
    });
    this._emitFinalizado(vencedor, this._estado.historicoMissoes);
  }

  private _construirRevelacaoFinal(historicoMissoes: HistoricoMissaoAlianca[]) {
    const papeisPorJogador: Record<PlayerId, PapelAlianca> = {};
    for (const jogador of this._jogadores) {
      papeisPorJogador[jogador.id] =
        this._priv.papeis.get(jogador.id) ?? 'leal';
    }

    return {
      papeisPorJogador,
      totalRodadas: this._estado.rodada,
      historicoMissoes,
    };
  }

  private _emitFinalizado(
    vencedor: 'leais' | 'traidores',
    historicoMissoes: HistoricoMissaoAlianca[],
  ): void {
    const papeisPorJogador: ResultadoAliancaFinalizado['papeisPorJogador'] = {};
    for (const jogador of this._jogadores) {
      papeisPorJogador[jogador.id] =
        this._priv.papeis.get(jogador.id) ?? 'leal';
    }

    this._callbacks.onJogoFinalizado?.({
      vencedor,
      totalRodadas: this._estado.rodada,
      totalJogadores: this._jogadores.length,
      sucessosLeais: this._estado.sucessosLeais,
      sabotagensTraidores: this._estado.sabotagensTraidores,
      rejeicoesSeguidas: this._estado.rejeicoesSeguidas,
      papeisPorJogador,
      historicoMissoes,
    });
  }

  private _emit(parcial: Partial<EstadoAliancaPublico>): void {
    this._estado = { ...this._estado, ...parcial };
    this._onMudanca(this._estado);
  }
}
