import { JOGOS, type DefinicaoJogo } from '@/games/gameRegistry';
import {
  CATEGORIAS_PRINCIPAIS,
  CONTEXTOS_SOCIAIS,
  TAGS_SOCIAIS,
} from '@/games/taxonomia';

const PESO_NOME = 130;
const PESO_ALIAS = 108;
const PESO_TAG = 62;
const PESO_CONTEXTO = 54;
const PESO_CATEGORIA = 48;
const PESO_SLOGAN = 50;
const PESO_DESCRICAO = 38;
const PESO_INSTRUCAO = 22;
const LIMIAR_RESULTADO = 28;

const PALAVRAS_VAZIAS = new Set([
  'a',
  'as',
  'com',
  'da',
  'das',
  'de',
  'do',
  'dos',
  'e',
  'em',
  'jogar',
  'jogo',
  'o',
  'os',
  'para',
  'por',
  'pra',
  'que',
  'um',
  'uma',
]);

const ALIASES_JOGOS: Readonly<Record<string, readonly string[]>> = {
  mrwhite: ['mr white', 'mister white', 'impostor', 'sem palavra'],
  'most-likely-to': ['mais provavel', 'quem faria isso', 'apontar'],
  inquisicao: ['mafia', 'salem', 'corrompidos', 'inocentes'],
  'voce-me-conhece': ['vmc', 'prioridades', 'adivinhar escolhas'],
  alianca: ['traidores', 'leais', 'missoes', 'sabotagem'],
  'faz-ai': ['mimica', 'charades', 'atuacao'],
  duvido: ['bluff', 'ranking', 'blefar'],
  'eu-nunca': ['never have i ever', 'confissoes'],
  'verdade-desafio': ['verdade ou desafio', 'truth or dare'],
  'quem-na-sala': ['quem na sala', 'votacao anonima'],
  'de-0-a-10': ['nota secreta', 'zero a dez'],
};

const ROTULOS_MECANICA: Record<
  DefinicaoJogo['descoberta']['mecanicaPrincipal'],
  string
> = {
  atuacao: 'atuacao mimica corpo',
  blefe: 'blefe mentir manipulacao',
  confissao: 'confissao historias revelacao',
  deducao: 'deducao suspeita investigar',
  desafio: 'desafio missao coragem',
  leitura: 'ler pessoas conhecer escolhas',
  palavra: 'palavra dica adivinhar',
  ranking: 'ranking conhecimento lista',
  votacao: 'votacao apontar escolher',
};

const ROTULOS_INTENCAO: Record<
  DefinicaoJogo['descoberta']['intencaoSocial'],
  string
> = {
  aquecer: 'quebrar gelo comecar rapido',
  competir: 'competir ganhar disputa',
  conectar: 'conectar intimidade conhecer',
  expor: 'expor votar zoar',
  gerar_historia: 'risada historia memoravel',
  provocar: 'provocar tensao caos',
  revelar: 'revelar descobrir conversa',
};

interface CampoBusca {
  texto: string;
  peso: number;
}

interface IndiceJogo {
  jogo: DefinicaoJogo;
  campos: CampoBusca[];
}

export interface ResultadoBuscaJogo {
  jogo: DefinicaoJogo;
  pontuacao: number;
}

function normalizarTexto(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenizar(texto: string): string[] {
  const tokens = normalizarTexto(texto).split(' ').filter(Boolean);
  const relevantes = tokens.filter(
    (token) => token.length > 1 && !PALAVRAS_VAZIAS.has(token),
  );
  return relevantes.length > 0 ? relevantes : tokens;
}

function distanciaEdicao(a: string, b: string): number {
  const anterior = Array.from({ length: b.length + 1 }, (_, indice) => indice);

  for (let i = 1; i <= a.length; i += 1) {
    const atual = [i];
    for (let j = 1; j <= b.length; j += 1) {
      const custo = a[i - 1] === b[j - 1] ? 0 : 1;
      atual[j] = Math.min(
        atual[j - 1]! + 1,
        anterior[j]! + 1,
        anterior[j - 1]! + custo,
      );
    }
    for (let j = 0; j < atual.length; j += 1) {
      anterior[j] = atual[j]!;
    }
  }

  return anterior[b.length]!;
}

function similaridadeToken(consulta: string, candidato: string): number {
  if (consulta === candidato) return 1;
  if (
    Math.min(consulta.length, candidato.length) >= 3 &&
    (candidato.startsWith(consulta) || consulta.startsWith(candidato))
  ) {
    return 0.9;
  }

  if (consulta.length < 3 || candidato.length < 3) return 0;

  const limite =
    Math.max(consulta.length, candidato.length) <= 4
      ? 1
      : Math.max(consulta.length, candidato.length) <= 8
        ? 2
        : 3;
  const distancia = distanciaEdicao(consulta, candidato);
  if (distancia > limite) return 0;

  const proporcao = 1 - distancia / Math.max(consulta.length, candidato.length);
  return proporcao >= 0.56 ? proporcao * 0.9 : 0;
}

function obterMetaJogo(jogo: DefinicaoJogo): IndiceJogo {
  const categorias = CATEGORIAS_PRINCIPAIS.filter((categoria) =>
    jogo.categoriasPrincipais.includes(categoria.id),
  );
  const tags = TAGS_SOCIAIS.filter((tag) => jogo.tagsSociais.includes(tag.id));
  const contextos = CONTEXTOS_SOCIAIS.filter((contexto) =>
    jogo.contextos.includes(contexto.id),
  );

  return {
    jogo,
    campos: [
      { texto: jogo.nome, peso: PESO_NOME },
      { texto: jogo.id.replace(/-/g, ' '), peso: PESO_ALIAS },
      {
        texto: (ALIASES_JOGOS[jogo.id] ?? []).join(' '),
        peso: PESO_ALIAS,
      },
      {
        texto: [
          ...tags.map((tag) => tag.nome),
          ...jogo.socialTags,
          ROTULOS_MECANICA[jogo.descoberta.mecanicaPrincipal],
          ROTULOS_INTENCAO[jogo.descoberta.intencaoSocial],
        ].join(' '),
        peso: PESO_TAG,
      },
      {
        texto: contextos
          .map((contexto) => `${contexto.titulo} ${contexto.subtitulo}`)
          .join(' '),
        peso: PESO_CONTEXTO,
      },
      {
        texto: categorias
          .map((categoria) => `${categoria.nome} ${categoria.descricao}`)
          .join(' '),
        peso: PESO_CATEGORIA,
      },
      { texto: jogo.slogan, peso: PESO_SLOGAN },
      { texto: jogo.descricao, peso: PESO_DESCRICAO },
      {
        texto: [
          jogo.instrucoes.objetivo,
          ...jogo.instrucoes.passos,
          ...jogo.instrucoes.dicas,
        ].join(' '),
        peso: PESO_INSTRUCAO,
      },
    ]
      .filter((campo) => campo.texto.length > 0)
      .map((campo) => ({ ...campo, texto: normalizarTexto(campo.texto) })),
  };
}

const INDICE_CATALOGO = JOGOS.map(obterMetaJogo);

function pontuarJogo(indice: IndiceJogo, consulta: string): number {
  const tokensConsulta = tokenizar(consulta);
  const consultaCompacta = consulta.replace(/\s/g, '');
  let pontuacao = 0;
  let tokensEncontrados = 0;

  for (const tokenConsulta of tokensConsulta) {
    let melhor = 0;
    for (const campo of indice.campos) {
      for (const tokenCampo of tokenizar(campo.texto)) {
        melhor = Math.max(
          melhor,
          similaridadeToken(tokenConsulta, tokenCampo) * campo.peso,
        );
      }
    }
    if (melhor >= PESO_INSTRUCAO * 0.54) tokensEncontrados += 1;
    pontuacao += melhor;
  }

  for (const campo of indice.campos) {
    const compacto = campo.texto.replace(/\s/g, '');
    if (campo.texto === consulta || compacto === consultaCompacta) {
      pontuacao += campo.peso * 2.6;
    } else if (
      campo.texto.includes(consulta) ||
      compacto.includes(consultaCompacta)
    ) {
      pontuacao += campo.peso * 1.35;
    }
  }

  const cobertura = tokensEncontrados / Math.max(tokensConsulta.length, 1);
  if (cobertura < 0.5) return 0;

  return Math.round(pontuacao * (0.7 + cobertura * 0.3));
}

export function buscarJogosCatalogo(
  textoConsulta: string,
): ResultadoBuscaJogo[] {
  const consulta = normalizarTexto(textoConsulta);
  if (consulta.length < 2) return [];

  return INDICE_CATALOGO.map((indice) => ({
    jogo: indice.jogo,
    pontuacao: pontuarJogo(indice, consulta),
  }))
    .filter((resultado) => resultado.pontuacao >= LIMIAR_RESULTADO)
    .sort((a, b) => {
      if (b.pontuacao !== a.pontuacao) return b.pontuacao - a.pontuacao;
      if (a.jogo.disponivel !== b.jogo.disponivel) {
        return a.jogo.disponivel ? -1 : 1;
      }
      return a.jogo.nome.localeCompare(b.jogo.nome, 'pt-BR');
    });
}
