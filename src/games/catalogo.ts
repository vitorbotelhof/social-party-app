import {
  CATEGORIAS_EMOCIONAIS,
  JOGOS,
  type CategoriaEmocional,
  type CategoriaMeta,
  type DefinicaoJogo,
} from '@/games/gameRegistry';

const DIA_MS = 24 * 60 * 60 * 1000;

const IDS_RECENTES_FAKE = [
  'mrwhite',
  'inquisicao',
  'voce-me-conhece',
  'na-ponta-da-lingua',
] as const;

export type TipoSecaoCatalogo = 'recentes' | 'categoria';

export interface JogoDestaqueCatalogo {
  jogo: DefinicaoJogo;
  badge: string;
  descricao: string;
}

export interface SecaoCatalogo {
  id: string;
  titulo: string;
  subtitulo?: string;
  tipo: TipoSecaoCatalogo;
  categoriaId?: CategoriaEmocional;
  jogos: DefinicaoJogo[];
}

interface OpcoesListagem {
  incluirIndisponiveis?: boolean;
}

function ordenarJogos(jogos: DefinicaoJogo[]): DefinicaoJogo[] {
  return [...jogos].sort(
    (a, b) => (a.ordemNaCategoria ?? 999) - (b.ordemNaCategoria ?? 999),
  );
}

function indiceDoDia(data: Date): number {
  const inicioDoDiaLocal = new Date(
    data.getFullYear(),
    data.getMonth(),
    data.getDate(),
  ).getTime();

  return Math.floor(inicioDoDiaLocal / DIA_MS);
}

export function getJogosDisponiveis(
  jogos: ReadonlyArray<DefinicaoJogo> = JOGOS,
): DefinicaoJogo[] {
  return jogos.filter((jogo) => jogo.disponivel);
}

export function getJogoPorId(
  id: string,
  jogos: ReadonlyArray<DefinicaoJogo> = JOGOS,
): DefinicaoJogo | null {
  return jogos.find((jogo) => jogo.id === id) ?? null;
}

export function getJogosPorCategoriaCatalogo(
  categoriaId: CategoriaEmocional,
  jogos: ReadonlyArray<DefinicaoJogo> = JOGOS,
  { incluirIndisponiveis = true }: OpcoesListagem = {},
): DefinicaoJogo[] {
  const filtrados = jogos.filter((jogo) => {
    if (!incluirIndisponiveis && !jogo.disponivel) return false;
    return jogo.categorias.includes(categoriaId);
  });

  return ordenarJogos(filtrados);
}

export function getJogoDestaqueDoDia(
  data: Date = new Date(),
  jogos: ReadonlyArray<DefinicaoJogo> = JOGOS,
): JogoDestaqueCatalogo {
  const candidatosDestaque = jogos.filter(
    (jogo) => jogo.disponivel && jogo.destaque,
  );
  const candidatosDisponiveis = getJogosDisponiveis(jogos);
  const candidatos =
    candidatosDestaque.length > 0
      ? candidatosDestaque
      : candidatosDisponiveis.length > 0
        ? candidatosDisponiveis
        : [...jogos];

  const jogo = candidatos[indiceDoDia(data) % candidatos.length] ?? jogos[0]!;

  return {
    jogo,
    badge: jogo.destaque ? 'destaque' : 'pra hoje',
    descricao: jogo.descricao,
  };
}

export function getJogosRecentesFake(
  jogos: ReadonlyArray<DefinicaoJogo> = JOGOS,
): DefinicaoJogo[] {
  return IDS_RECENTES_FAKE.map((id) => getJogoPorId(id, jogos)).filter(
    (jogo): jogo is DefinicaoJogo => !!jogo?.disponivel,
  );
}

export function getSecoesCategoriasCatalogo(
  categorias: ReadonlyArray<CategoriaMeta> = CATEGORIAS_EMOCIONAIS,
  jogos: ReadonlyArray<DefinicaoJogo> = JOGOS,
): SecaoCatalogo[] {
  return categorias
    .map((categoria) => ({
      id: `categoria-${categoria.id}`,
      titulo: categoria.labelCurto,
      subtitulo: categoria.sublabel,
      tipo: 'categoria' as const,
      categoriaId: categoria.id,
      jogos: getJogosPorCategoriaCatalogo(categoria.id, jogos),
    }))
    .filter((secao) => secao.jogos.length > 0);
}

export function getSecaoRecentesFake(
  jogos: ReadonlyArray<DefinicaoJogo> = JOGOS,
): SecaoCatalogo | null {
  const recentes = getJogosRecentesFake(jogos);
  if (recentes.length === 0) return null;

  return {
    id: 'jogados-recentemente',
    titulo: 'jogados recentemente',
    tipo: 'recentes',
    jogos: recentes,
  };
}

export function getSecoesHomeCatalogo(
  jogos: ReadonlyArray<DefinicaoJogo> = JOGOS,
): SecaoCatalogo[] {
  const recentes = getSecaoRecentesFake(jogos);
  const categorias = getSecoesCategoriasCatalogo(CATEGORIAS_EMOCIONAIS, jogos);

  return recentes ? [recentes, ...categorias] : categorias;
}
