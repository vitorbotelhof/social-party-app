import type {
  EventoSocialLocal,
  ModoLocal,
  ResultadoVotacaoLocal,
  TipoEventoSocialLocal,
} from './types';

interface ContextoEventoDia {
  loop: number;
  modo: ModoLocal;
  resultadoVotacaoAnterior: ResultadoVotacaoLocal['tipo'];
  ultimoEventoId: string | null;
}

const EVENTOS: Record<TipoEventoSocialLocal, EventoSocialLocal[]> = {
  suspeita: [
    { id: 'sus-001', tipo: 'suspeita', texto: 'alguém hesitou.' },
    { id: 'sus-002', tipo: 'suspeita', texto: 'algo não encaixa.' },
    { id: 'sus-003', tipo: 'suspeita', texto: 'olhem de novo.' },
    { id: 'sus-004', tipo: 'suspeita', texto: 'tem defesa demais.' },
    { id: 'sus-005', tipo: 'suspeita', texto: 'o silêncio pesou.' },
  ],
  pressao: [
    { id: 'pre-001', tipo: 'pressao', texto: 'acuse alguém agora.' },
    { id: 'pre-002', tipo: 'pressao', texto: 'defenda alguém.' },
    { id: 'pre-003', tipo: 'pressao', texto: 'ninguém foge da pergunta.' },
    { id: 'pre-004', tipo: 'pressao', texto: 'escolham um lado.' },
    { id: 'pre-005', tipo: 'pressao', texto: 'uma resposta rápida.' },
  ],
  caos: [
    { id: 'cao-001', tipo: 'caos', texto: 'o grupo rachou.' },
    { id: 'cao-002', tipo: 'caos', texto: 'duas versões surgiram.' },
    { id: 'cao-003', tipo: 'caos', texto: 'ninguém concorda.' },
    { id: 'cao-004', tipo: 'caos', texto: 'a dúvida venceu.' },
    { id: 'cao-005', tipo: 'caos', texto: 'todo mundo parece culpado.' },
  ],
  corrupcao_sugerida: [
    { id: 'cor-001', tipo: 'corrupcao_sugerida', texto: 'alguém mudou.' },
    { id: 'cor-002', tipo: 'corrupcao_sugerida', texto: 'a influência ficou.' },
    { id: 'cor-003', tipo: 'corrupcao_sugerida', texto: 'nada voltou igual.' },
    { id: 'cor-004', tipo: 'corrupcao_sugerida', texto: 'confiem menos.' },
    {
      id: 'cor-005',
      tipo: 'corrupcao_sugerida',
      texto: 'um aliado talvez não seja.',
    },
  ],
};

function sortearDaCategoria(
  tipo: TipoEventoSocialLocal,
  ultimoEventoId: string | null,
): EventoSocialLocal {
  const candidatos = EVENTOS[tipo].filter(
    (evento) => evento.id !== ultimoEventoId,
  );
  const pool = candidatos.length > 0 ? candidatos : EVENTOS[tipo];
  return pool[Math.floor(Math.random() * pool.length)] ?? EVENTOS[tipo][0]!;
}

function escolherTipo(
  contexto: ContextoEventoDia,
): TipoEventoSocialLocal | null {
  if (contexto.loop === 1) return 'suspeita';

  if (contexto.resultadoVotacaoAnterior === 'empate') return 'caos';
  if (contexto.resultadoVotacaoAnterior === 'sem_eliminacao') return 'pressao';

  if (contexto.modo === 'paranoia' && contexto.loop >= 3) {
    return contexto.loop % 2 === 1 ? 'corrupcao_sugerida' : 'suspeita';
  }

  if (contexto.loop % 2 === 0) return 'suspeita';
  return null;
}

export function sortearEventoDia(
  contexto: ContextoEventoDia,
): EventoSocialLocal | null {
  const tipo = escolherTipo(contexto);
  if (!tipo) return null;
  return sortearDaCategoria(tipo, contexto.ultimoEventoId);
}
