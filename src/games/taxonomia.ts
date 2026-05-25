export type CategoriaPrincipalId =
  | 'blefe_deducao'
  | 'votacao_exposicao'
  | 'improviso_performance'
  | 'confissoes_revelacoes'
  | 'conhecimento_grupo'
  | 'rapidos_para_esquentar'
  | 'casal_intimidade';

export interface CategoriaPrincipalMeta {
  id: CategoriaPrincipalId;
  nome: string;
  descricao: string;
}

export const CATEGORIAS_PRINCIPAIS: readonly CategoriaPrincipalMeta[] = [
  {
    id: 'blefe_deducao',
    nome: 'Blefe e Dedução',
    descricao: 'segredos, suspeitas e gente fingindo naturalidade.',
  },
  {
    id: 'votacao_exposicao',
    nome: 'Votação e Exposição',
    descricao: 'o grupo decide quem está no centro.',
  },
  {
    id: 'improviso_performance',
    nome: 'Improviso e Performance',
    descricao: 'corpo, pressão, atuação ruim e gritaria.',
  },
  {
    id: 'confissoes_revelacoes',
    nome: 'Confissões e Revelações',
    descricao: 'histórias, verdades e coisas que ninguém tinha dito.',
  },
  {
    id: 'conhecimento_grupo',
    nome: 'Conhecimento do Grupo',
    descricao: 'jogos sobre ler pessoas e descobrir padrões.',
  },
  {
    id: 'rapidos_para_esquentar',
    nome: 'Rápidos Para Esquentar',
    descricao: 'pouca explicação, começo rápido, energia imediata.',
  },
  {
    id: 'casal_intimidade',
    nome: 'Casal e Intimidade',
    descricao: 'experiências para grupos íntimos ou duas pessoas.',
  },
];

export type TagSocialId =
  | 'baixo_texto'
  | 'bebida_opcional'
  | 'blefe'
  | 'competitivo'
  | 'conversa'
  | 'deducao'
  | 'exposicao'
  | 'fisico'
  | 'gritaria'
  | 'grupo_intimo'
  | 'improviso'
  | 'paranoia'
  | 'rapido'
  | 'segredo'
  | 'sem_vergonha'
  | 'vergonha_leve'
  | 'votacao';

export interface TagSocialMeta {
  id: TagSocialId;
  nome: string;
}

export const TAGS_SOCIAIS: readonly TagSocialMeta[] = [
  { id: 'baixo_texto', nome: 'baixo texto' },
  { id: 'bebida_opcional', nome: 'bebida opcional' },
  { id: 'blefe', nome: 'blefe' },
  { id: 'competitivo', nome: 'competitivo' },
  { id: 'conversa', nome: 'conversa' },
  { id: 'deducao', nome: 'dedução' },
  { id: 'exposicao', nome: 'exposição' },
  { id: 'fisico', nome: 'físico' },
  { id: 'gritaria', nome: 'gritaria' },
  { id: 'grupo_intimo', nome: 'grupo íntimo' },
  { id: 'improviso', nome: 'improviso' },
  { id: 'paranoia', nome: 'paranoia' },
  { id: 'rapido', nome: 'rápido' },
  { id: 'segredo', nome: 'segredo' },
  { id: 'sem_vergonha', nome: 'sem vergonha' },
  { id: 'vergonha_leve', nome: 'vergonha leve' },
  { id: 'votacao', nome: 'votação' },
];

export type ContextoSocialId =
  | 'amigos_novos'
  | 'casal'
  | 'grupo_frio'
  | 'grupo_intimo'
  | 'grupo_sem_vergonha'
  | 'noite_quente'
  | 'ninguem_confia'
  | 'pouco_tempo'
  | 'pra_comecar'
  | 'pra_descobrir_o_grupo'
  | 'pra_gerar_historia'
  | 'pra_subir_energia';

export interface ContextoSocialMeta {
  id: ContextoSocialId;
  titulo: string;
  subtitulo: string;
}

export const CONTEXTOS_SOCIAIS: readonly ContextoSocialMeta[] = [
  {
    id: 'pra_comecar',
    titulo: 'pra começar sem explicar muito',
    subtitulo: 'entra rápido e deixa o grupo aquecer.',
  },
  {
    id: 'ninguem_confia',
    titulo: 'quando ninguém confia em ninguém',
    subtitulo: 'segredo, suspeita e acusação.',
  },
  {
    id: 'grupo_sem_vergonha',
    titulo: 'pra grupos que já perderam a vergonha',
    subtitulo: 'exposição alta, risada alta.',
  },
  {
    id: 'pra_descobrir_o_grupo',
    titulo: 'pra descobrir quem vocês são',
    subtitulo: 'o grupo se revela sem perceber.',
  },
  {
    id: 'pra_subir_energia',
    titulo: 'pra subir a energia',
    subtitulo: 'mais ritmo, mais corpo, menos silêncio.',
  },
  {
    id: 'pra_gerar_historia',
    titulo: 'pra sair com história',
    subtitulo: 'o tipo de jogo que alguém comenta depois.',
  },
  {
    id: 'pouco_tempo',
    titulo: 'pra jogar em poucos minutos',
    subtitulo: 'curto, direto e sem preparação.',
  },
  {
    id: 'grupo_frio',
    titulo: 'pra quebrar o gelo',
    subtitulo: 'baixo risco social para começar.',
  },
  {
    id: 'grupo_intimo',
    titulo: 'pra quem já se conhece',
    subtitulo: 'fica melhor quando existe história.',
  },
  {
    id: 'amigos_novos',
    titulo: 'pra amigos novos',
    subtitulo: 'descobre sem pesar a mão.',
  },
  {
    id: 'casal',
    titulo: 'pra jogar a dois',
    subtitulo: 'intimidade com um pouco de provocação.',
  },
  {
    id: 'noite_quente',
    titulo: 'quando a noite já esquentou',
    subtitulo: 'a sessão já passou do ponto de educação.',
  },
];

export type MecanicaPrincipal =
  | 'atuacao'
  | 'blefe'
  | 'confissao'
  | 'deducao'
  | 'desafio'
  | 'leitura'
  | 'palavra'
  | 'ranking'
  | 'votacao';

export type IntencaoSocial =
  | 'aquecer'
  | 'competir'
  | 'conectar'
  | 'expor'
  | 'gerar_historia'
  | 'provocar'
  | 'revelar';

export type NivelDescoberta = 1 | 2 | 3 | 4 | 5;

export interface PerfilDescobertaJogo {
  mecanicaPrincipal: MecanicaPrincipal;
  intencaoSocial: IntencaoSocial;
  ritmo: NivelDescoberta;
  exposicao: NivelDescoberta;
  energiaFisica: NivelDescoberta;
  conversaPosRodada: NivelDescoberta;
  complexidade: NivelDescoberta;
  intimidade: NivelDescoberta;
  toleranciaVergonha: NivelDescoberta;
}
