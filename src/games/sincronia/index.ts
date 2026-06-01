export { montarBaralho, PALAVRAS_FACIL, PALAVRAS_MEDIO, PALAVRAS_DIFICIL } from './palavras';
export {
  criarEstadoInicial,
  iniciarContagem,
  tickContagem,
  iniciarRodada,
  registrarAcerto,
  registrarInfracao,
  registrarSkip,
  encerrarRodada,
  avancarTurno,
  quemDaDica,
  quemAdivinha,
  getRanking,
  podeSkip,
  totalTurnos,
  turnoAtual,
} from './engine';
export type {
  ConfiguracaoSincronia,
  DuplaSincronia,
  EstadoJogoSincronia,
  FaseSincronia,
  PalavraJogada,
  PlacarDupla,
  ResultadoRodadaSincronia,
  ResultadoPalavra,
} from './types';
