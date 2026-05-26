// ─── De 0 a 10 — Pulsos Sociais ─────────────────────────────────────────────
//
// Um reveal bom termina no grupo, não na tela. Estes prompts são ações curtas
// para provocar defesa, exposição ou comparação sem abrir uma nova fase.

import type {
  LeituraColetivaDe0a10,
  PulsoSocialDe0a10,
  ResultadoRodada,
} from './types';

interface TemplatePulso {
  id: string;
  chamada: string;
  texto: (nome: string) => string;
}

const PULSOS: Record<LeituraColetivaDe0a10, readonly TemplatePulso[]> = {
  cravaram: [
    {
      id: 'cravaram-entregou',
      chamada: 'entregou demais',
      texto: () => 'qual resposta denunciou a nota primeiro?',
    },
    {
      id: 'cravaram-leitores',
      chamada: 'leitura coletiva',
      texto: (nome) => `${nome}, você esperava ser tão fácil de ler?`,
    },
    {
      id: 'cravaram-apaga',
      chamada: 'teste rápido',
      texto: () => 'apaguem uma resposta: ainda teria ficado óbvio?',
    },
  ],
  te_leram: [
    {
      id: 'leram-chave',
      chamada: 'pista-chave',
      texto: () => 'qual resposta colocou todo mundo na faixa certa?',
    },
    {
      id: 'leram-defesa',
      chamada: 'defende a leitura',
      texto: () => 'quem chegou mais perto explica seu raciocínio.',
    },
    {
      id: 'leram-surpresa',
      chamada: 'era tão você assim?',
      texto: (nome) => `${nome}, qual resposta você achou mais reveladora?`,
    },
  ],
  quase: [
    {
      id: 'quase-lados',
      chamada: 'dois lados',
      texto: () => 'quem leu certo tenta convencer quem errou.',
    },
    {
      id: 'quase-confundiu',
      chamada: 'onde confundiu?',
      texto: () => 'qual resposta empurrou parte do grupo para outra nota?',
    },
    {
      id: 'quase-reescreve',
      chamada: 'segunda chance',
      texto: (nome) => `${nome}, qual resposta você mudaria agora?`,
    },
  ],
  divididos: [
    {
      id: 'divididos-extremos',
      chamada: 'defendam seus lados',
      texto: () => 'menor e maior palpite: expliquem-se em voz alta.',
    },
    {
      id: 'divididos-culpada',
      chamada: 'achem a culpada',
      texto: () => 'qual resposta rachou o grupo?',
    },
    {
      id: 'divididos-julgamento',
      chamada: 'tribunal relâmpago',
      texto: (nome) => `${nome}, escolha quem te interpretou mais errado.`,
    },
  ],
  nao_te_leram: [
    {
      id: 'perdidos-explica',
      chamada: 'se explica agora',
      texto: (nome) => `${nome}, conta a lógica que ninguém captou.`,
    },
    {
      id: 'perdidos-absurda',
      chamada: 'qual foi a pior?',
      texto: () => 'o grupo escolhe a resposta mais impossível de entender.',
    },
    {
      id: 'perdidos-revanche',
      chamada: 'direito de resposta',
      texto: (nome) => `${nome}, quem chegou mais longe da sua cabeça?`,
    },
  ],
};

export function selecionarPulsoSocial(
  leitura: LeituraColetivaDe0a10,
  respondenteNome: string,
  historico: readonly ResultadoRodada[],
  aleatorio: () => number = Math.random,
): PulsoSocialDe0a10 {
  const templates = PULSOS[leitura];
  const usados = new Set(
    historico.flatMap((rodada) =>
      rodada.pulsoSocial ? [rodada.pulsoSocial.id] : [],
    ),
  );
  const ineditos = templates.filter((template) => !usados.has(template.id));
  const anterior = historico[historico.length - 1]?.pulsoSocial?.id;
  const semRepeticaoImediata = templates.filter(
    (template) => template.id !== anterior,
  );
  const pool =
    ineditos.length > 0
      ? ineditos
      : semRepeticaoImediata.length > 0
        ? semRepeticaoImediata
        : templates;
  const escolhido = pool[Math.floor(aleatorio() * pool.length)]!;

  return {
    id: escolhido.id,
    chamada: escolhido.chamada,
    texto: escolhido.texto(respondenteNome),
  };
}
