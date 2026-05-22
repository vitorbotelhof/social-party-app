import { JOGOS, type DefinicaoJogo } from '@/games/gameRegistry';
import {
  CATEGORIAS_PRINCIPAIS,
  CONTEXTOS_SOCIAIS,
  TAGS_SOCIAIS,
  type CategoriaPrincipalId,
  type CategoriaPrincipalMeta,
  type ContextoSocialId,
  type ContextoSocialMeta,
  type TagSocialId,
  type TagSocialMeta,
} from '@/games/taxonomia';

const DIA_MS = 24 * 60 * 60 * 1000;
const LIMITE_SECAO_HOME = 8;

const IDS_RECENTES_FAKE = [
  'mrwhite',
  'inquisicao',
  'faz-ai',
  'voce-me-conhece',
  'na-ponta-da-lingua',
] as const;

const CONTEXTOS_HOME: readonly ContextoSocialId[] = [
  'pra_comecar',
  'ninguem_confia',
  'grupo_sem_vergonha',
  'pra_descobrir_o_grupo',
  'pra_subir_energia',
  'pouco_tempo',
];

export type TipoSecaoCatalogo =
  | 'recentes'
  | 'categoria_principal'
  | 'contexto'
  | 'tag';

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
  categoriaPrincipalId?: CategoriaPrincipalId;
  contextoId?: ContextoSocialId;
  tagId?: TagSocialId;
  jogos: DefinicaoJogo[];
}

interface OpcoesListagem {
  incluirIndisponiveis?: boolean;
  limitar?: number;
}

function ordenarJogos(jogos: DefinicaoJogo[]): DefinicaoJogo[] {
  return [...jogos].sort((a, b) => {
    if (a.disponivel !== b.disponivel) return a.disponivel ? -1 : 1;
    const destaqueA = a.destaque ? 0 : 1;
    const destaqueB = b.destaque ? 0 : 1;
    if (destaqueA !== destaqueB) return destaqueA - destaqueB;
    return (a.ordemNaCategoria ?? 999) - (b.ordemNaCategoria ?? 999);
  });
}

function aplicarLimite(
  jogos: DefinicaoJogo[],
  limite?: number,
): DefinicaoJogo[] {
  return typeof limite === 'number' ? jogos.slice(0, limite) : jogos;
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

export function getJogosPorCategoriaPrincipal(
  categoriaId: CategoriaPrincipalId,
  jogos: ReadonlyArray<DefinicaoJogo> = JOGOS,
  { incluirIndisponiveis = true, limitar }: OpcoesListagem = {},
): DefinicaoJogo[] {
  const filtrados = jogos.filter((jogo) => {
    if (!incluirIndisponiveis && !jogo.disponivel) return false;
    return jogo.categoriasPrincipais.includes(categoriaId);
  });

  return aplicarLimite(ordenarJogos(filtrados), limitar);
}

export function getJogosPorContextoCatalogo(
  contextoId: ContextoSocialId,
  jogos: ReadonlyArray<DefinicaoJogo> = JOGOS,
  { incluirIndisponiveis = true, limitar }: OpcoesListagem = {},
): DefinicaoJogo[] {
  const filtrados = jogos.filter((jogo) => {
    if (!incluirIndisponiveis && !jogo.disponivel) return false;
    return jogo.contextos.includes(contextoId);
  });

  return aplicarLimite(ordenarJogos(filtrados), limitar);
}

export function getJogosPorTagCatalogo(
  tagId: TagSocialId,
  jogos: ReadonlyArray<DefinicaoJogo> = JOGOS,
  { incluirIndisponiveis = true, limitar }: OpcoesListagem = {},
): DefinicaoJogo[] {
  const filtrados = jogos.filter((jogo) => {
    if (!incluirIndisponiveis && !jogo.disponivel) return false;
    return jogo.tagsSociais.includes(tagId);
  });

  return aplicarLimite(ordenarJogos(filtrados), limitar);
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

export function getSecoesCategoriasPrincipaisCatalogo(
  categorias: ReadonlyArray<CategoriaPrincipalMeta> = CATEGORIAS_PRINCIPAIS,
  jogos: ReadonlyArray<DefinicaoJogo> = JOGOS,
): SecaoCatalogo[] {
  return categorias
    .map((categoria) => ({
      id: `categoria-principal-${categoria.id}`,
      titulo: categoria.nome.toLowerCase(),
      subtitulo: categoria.descricao,
      tipo: 'categoria_principal' as const,
      categoriaPrincipalId: categoria.id,
      jogos: getJogosPorCategoriaPrincipal(categoria.id, jogos, {
        limitar: LIMITE_SECAO_HOME,
      }),
    }))
    .filter((secao) => secao.jogos.length > 0);
}

export function getSecaoCategoriaPrincipalCatalogo(
  categoriaId: CategoriaPrincipalId,
  jogos: ReadonlyArray<DefinicaoJogo> = JOGOS,
): SecaoCatalogo | null {
  const categoria = getMetaCategoriaPrincipal(categoriaId);
  if (!categoria) return null;
  const jogosFiltrados = getJogosPorCategoriaPrincipal(categoriaId, jogos);
  if (jogosFiltrados.length === 0) return null;

  return {
    id: `filtro-categoria-principal-${categoria.id}`,
    titulo: categoria.nome.toLowerCase(),
    subtitulo: categoria.descricao,
    tipo: 'categoria_principal',
    categoriaPrincipalId: categoria.id,
    jogos: jogosFiltrados,
  };
}

export function getSecoesContextosCatalogo(
  contextosIds: ReadonlyArray<ContextoSocialId> = CONTEXTOS_HOME,
  jogos: ReadonlyArray<DefinicaoJogo> = JOGOS,
): SecaoCatalogo[] {
  return contextosIds
    .map((contextoId): SecaoCatalogo | null => {
      const contexto = CONTEXTOS_SOCIAIS.find((c) => c.id === contextoId);
      if (!contexto) return null;

      return {
        id: `contexto-${contexto.id}`,
        titulo: contexto.titulo,
        subtitulo: contexto.subtitulo,
        tipo: 'contexto' as const,
        contextoId: contexto.id,
        jogos: getJogosPorContextoCatalogo(contexto.id, jogos, {
          limitar: LIMITE_SECAO_HOME,
        }),
      };
    })
    .filter(
      (secao): secao is SecaoCatalogo => !!secao && secao.jogos.length > 0,
    );
}

export function getSecaoContextoCatalogo(
  contextoId: ContextoSocialId,
  jogos: ReadonlyArray<DefinicaoJogo> = JOGOS,
): SecaoCatalogo | null {
  const contexto = getMetaContextoSocial(contextoId);
  if (!contexto) return null;
  const jogosFiltrados = getJogosPorContextoCatalogo(contextoId, jogos);
  if (jogosFiltrados.length === 0) return null;

  return {
    id: `filtro-contexto-${contexto.id}`,
    titulo: contexto.titulo,
    subtitulo: contexto.subtitulo,
    tipo: 'contexto',
    contextoId: contexto.id,
    jogos: jogosFiltrados,
  };
}

export function getSecoesTagsCatalogo(
  tags: ReadonlyArray<TagSocialMeta> = TAGS_SOCIAIS,
  jogos: ReadonlyArray<DefinicaoJogo> = JOGOS,
): SecaoCatalogo[] {
  return tags
    .map((tag) => ({
      id: `tag-${tag.id}`,
      titulo: tag.nome,
      tipo: 'tag' as const,
      tagId: tag.id,
      jogos: getJogosPorTagCatalogo(tag.id, jogos, {
        limitar: LIMITE_SECAO_HOME,
      }),
    }))
    .filter((secao) => secao.jogos.length > 1);
}

export function getSecaoTagCatalogo(
  tagId: TagSocialId,
  jogos: ReadonlyArray<DefinicaoJogo> = JOGOS,
): SecaoCatalogo | null {
  const tag = getMetaTagSocial(tagId);
  if (!tag) return null;
  const jogosFiltrados = getJogosPorTagCatalogo(tagId, jogos);
  if (jogosFiltrados.length === 0) return null;

  return {
    id: `filtro-tag-${tag.id}`,
    titulo: tag.nome,
    tipo: 'tag',
    tagId: tag.id,
    jogos: jogosFiltrados,
  };
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
  const contextos = getSecoesContextosCatalogo(CONTEXTOS_HOME, jogos);
  const categorias = getSecoesCategoriasPrincipaisCatalogo(
    CATEGORIAS_PRINCIPAIS,
    jogos,
  );

  return recentes
    ? [recentes, ...contextos, ...categorias]
    : [...contextos, ...categorias];
}

export function getMetaCategoriaPrincipal(
  id: CategoriaPrincipalId,
): CategoriaPrincipalMeta | null {
  return CATEGORIAS_PRINCIPAIS.find((categoria) => categoria.id === id) ?? null;
}

export function getMetaContextoSocial(
  id: ContextoSocialId,
): ContextoSocialMeta | null {
  return CONTEXTOS_SOCIAIS.find((contexto) => contexto.id === id) ?? null;
}

export function getMetaTagSocial(id: TagSocialId): TagSocialMeta | null {
  return TAGS_SOCIAIS.find((tag) => tag.id === id) ?? null;
}
