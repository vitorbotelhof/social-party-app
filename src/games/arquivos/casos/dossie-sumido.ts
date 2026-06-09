import type { ArquivosCase } from '@/games/arquivos/types';

export const CASO_DOSSIE_SUMIDO: ArquivosCase = {
  id: 'dossie-sumido',
  intro: {
    titulo: 'O Dossiê Sumido',
    subtitulo: 'Uma reunião decisiva. Um arquivo desaparecido. Seis versões.',
    incidente:
      'Um dossiê confidencial sumiu minutos antes de uma reunião de aquisição.',
    resumoPublico:
      'A Vértice, uma startup brasileira de eventos sociais, estava prestes a fechar uma venda milionária. Antes da reunião final, o dossiê que justificava o valor da empresa desapareceu da sala de conferência. Todos tinham acesso parcial, todos tinham algo a perder e ninguém conhece a história inteira.',
    tom: ['corporativo_leve', 'amizades'],
    tipoIncidente: 'objeto_sumido',
  },
  config: {
    minPlayers: 6,
    targetPlayers: 6,
    maxPlayers: 6,
    targetDurationMinutes: {
      min: 35,
      max: 45,
    },
    supportedPlayerCounts: [6],
  },
  truth: {
    resumo:
      'Rafael removeu o dossiê da sala de conferência para impedir que Clara fechasse uma venda baseada em métricas infladas. O dossiê escondia que a Vértice chamava convites enviados de presença confirmada, aumentando artificialmente os números usados na negociação.',
    responsavelCharacterId: 'char-rafael',
    motivacaoPrincipal: 'impedir uma venda baseada em métricas infladas',
    segredoCentral: 'as métricas de presença da Vértice estavam infladas',
    documentosDecisivos: [
      'ev-metricas-brutas',
      'ev-export-rafael',
      'ev-impressao-2110',
      'ev-reclamacao-julia',
    ],
    errosDeInterpretacaoComuns: [
      'Achar que Bianca roubou o dossiê para vazar para a imprensa.',
      'Achar que Marina sumiu com o dossiê por ter controlado a sala.',
      'Achar que Davi manipulou os dados sozinho por interesse técnico.',
      'Tratar o segredo de Clara como prova de que ela removeu fisicamente o arquivo.',
    ],
    linhaDoTempoReal: [
      {
        id: 'time-1840-reuniao-remarcada',
        horario: '18h40',
        titulo: 'Reunião antecipada',
        descricao:
          'Os compradores avisam que querem ver o dossiê antes da assinatura preliminar, ainda naquela noite.',
        envolvidos: ['char-clara', 'char-marina'],
        evidenceIds: ['ev-agenda-antecipada'],
      },
      {
        id: 'time-1948-metricas-brutas',
        horario: '19h48',
        titulo: 'Planilha bruta aberta',
        descricao:
          'Rafael acessa a planilha bruta e vê que a presença real é muito menor do que a versão preparada para os compradores.',
        envolvidos: ['char-rafael', 'char-davi'],
        evidenceIds: ['ev-metricas-brutas', 'ev-export-rafael'],
      },
      {
        id: 'time-2020-versao-limpa',
        horario: '20h20',
        titulo: 'Versão limpa enviada',
        descricao:
          'Clara pede que a versão final não inclua a aba de divergências internas.',
        envolvidos: ['char-clara'],
        evidenceIds: ['ev-versao-limpa'],
      },
      {
        id: 'time-2050-dossie-na-sala',
        horario: '20h50',
        titulo: 'Dossiê deixado na sala',
        descricao:
          'Marina deixa o envelope lacrado na sala de conferência e registra a sala como pronta.',
        envolvidos: ['char-marina'],
        evidenceIds: ['ev-chave-arquivo'],
      },
      {
        id: 'time-2110-impressao-rafael',
        horario: '21h10',
        titulo: 'Cópia emergencial',
        descricao:
          'Uma impressão emergencial é feita com o login de Rafael, usando páginas do dossiê.',
        envolvidos: ['char-rafael'],
        evidenceIds: ['ev-impressao-2110'],
      },
      {
        id: 'time-2112-retirada',
        horario: '21h12',
        titulo: 'Envelope retirado',
        descricao:
          'Rafael pega o envelope da sala para impedir a assinatura naquela noite.',
        envolvidos: ['char-rafael', 'char-marina'],
        evidenceIds: ['ev-corredor-rafael', 'ev-anotacao-rafael'],
      },
      {
        id: 'time-2120-sumico-percebido',
        horario: '21h20',
        titulo: 'Sumiu',
        descricao:
          'O grupo percebe que o dossiê não está mais na sala. A reunião é suspensa.',
        envolvidos: [
          'char-clara',
          'char-rafael',
          'char-davi',
          'char-bianca',
          'char-nanda',
          'char-marina',
        ],
        evidenceIds: ['ev-sumico-confirmado'],
      },
    ],
  },
  characters: [
    {
      id: 'char-clara',
      nome: 'Clara Menezes',
      papelNoCaso: 'fundadora e CEO da Vértice',
      resumoPublico:
        'Clara comanda a negociação. É quem mais tem a ganhar — e a perder.',
      contextoPrivado:
        'A aquisição precisa acontecer. A empresa está sem fôlego e uma reunião ruim derruba meses de trabalho. Você não pegou o dossiê, mas pediu uma versão mais favorável dos números — sem as divergências internas.',
      conhecimentos: [
        'Rafael se recusou a assinar sem ver a planilha bruta.',
        'Existiam apenas três cópias impressas do dossiê final.',
        'A reunião foi antecipada pelos compradores no fim do dia.',
      ],
      segredo: {
        titulo: 'Versão favorável',
        descricao:
          'Você pediu para retirar a aba de divergências internas da versão que seria apresentada aos compradores.',
        riscoReputacional: 'alto',
        relacionadoAoCaso: true,
      },
      objetivoIndividual: {
        id: 'obj-clara-preservar-venda',
        titulo: 'Preservar a venda',
        descricao:
          'Evite que o grupo conclua que você tentou enganar os compradores, mesmo que a investigação descubra quem pegou o dossiê.',
        criteriosSucesso: [
          'O grupo identifica que você não removeu fisicamente o dossiê.',
          'Seu pedido de versão favorável não vira a explicação central do sumiço.',
        ],
        criteriosFalha: [
          'O grupo atribui o sumiço a você.',
          'A revelação final coloca sua decisão como o foco principal da mesa.',
        ],
      },
      relacoes: [
        {
          characterId: 'char-rafael',
          descricao:
            'Rafael era seu aliado financeiro, mas vinha travando a assinatura.',
          tensao: 'alta',
          publico: true,
        },
        {
          characterId: 'char-davi',
          descricao:
            'Davi montou os dashboards usados na negociação e depende da sua aprovação.',
          tensao: 'media',
          publico: true,
        },
      ],
      initialFileIds: ['file-clara-agenda', 'file-clara-rafael'],
    },
    {
      id: 'char-rafael',
      nome: 'Rafael Torres',
      papelNoCaso: 'diretor financeiro',
      resumoPublico:
        'Rafael queria validar os números antes de qualquer assinatura.',
      contextoPrivado:
        'Você pegou o dossiê. Queria impedir uma venda com números enganosos e pretendia devolver o envelope depois — mas o sumiço virou crise antes disso. Contar tudo ajuda o grupo, mas expõe o acesso não autorizado.',
      conhecimentos: [
        'A planilha bruta não batia com o dossiê final.',
        'Clara queria fechar sem mostrar a aba de divergências internas.',
        'A cópia emergencial das 21h10 saiu com seu login.',
      ],
      segredo: {
        titulo: 'Retirada do envelope',
        descricao:
          'Você pegou o dossiê da sala e fez uma cópia emergencial sem autorização formal.',
        riscoReputacional: 'alto',
        relacionadoAoCaso: true,
      },
      objetivoIndividual: {
        id: 'obj-rafael-impedir-fraude',
        titulo: 'Impedir a assinatura ruim',
        descricao:
          'Faça o grupo entender que o dossiê escondia um problema real sem deixar que sua retirada pareça sabotagem pessoal.',
        criteriosSucesso: [
          'O grupo identifica o segredo das métricas infladas.',
          'Sua motivação é entendida como proteção contra uma venda enganosa.',
        ],
        criteriosFalha: [
          'O grupo acha que você roubou o dossiê por vingança ou interesse próprio.',
          'O segredo central não é descoberto.',
        ],
      },
      relacoes: [
        {
          characterId: 'char-clara',
          descricao:
            'Você e Clara discordavam sobre o quanto os compradores deveriam saber.',
          tensao: 'alta',
          publico: true,
        },
        {
          characterId: 'char-marina',
          descricao:
            'Marina havia te emprestado uma chave do arquivo mais cedo.',
          tensao: 'media',
          publico: false,
        },
      ],
      initialFileIds: ['file-rafael-planilha', 'file-rafael-clara'],
    },
    {
      id: 'char-davi',
      nome: 'Davi Sato',
      papelNoCaso: 'líder de produto e dados',
      resumoPublico:
        'Davi criou o dashboard que embasou o valor da empresa na negociação.',
      contextoPrivado:
        'Você não pegou o dossiê, mas o dashboard usava uma métrica arriscada: convites enviados contavam como presença estimada. Clara chamava de projeção; Rafael chamava de maquiagem. Se você explicar cedo demais, pode virar o técnico culpado por tudo.',
      conhecimentos: [
        'Rafael exportou a planilha bruta antes do sumiço.',
        'O dashboard tinha uma aba chamada Projeção Azul com a fórmula central.',
        'A versão final do dossiê ocultava a divergência de presença real.',
      ],
      segredo: {
        titulo: 'Fórmula conveniente',
        descricao:
          'Você criou a fórmula que permitia chamar convites enviados de presença estimada.',
        riscoReputacional: 'medio',
        relacionadoAoCaso: true,
      },
      objetivoIndividual: {
        id: 'obj-davi-nao-virar-bode',
        titulo: 'Não virar bode expiatório',
        descricao:
          'Ajude o grupo a entender a manipulação dos números sem deixar que toda a culpa técnica caia em você.',
        criteriosSucesso: [
          'O grupo entende que a fórmula foi uma decisão de negócio, não um erro isolado.',
          'Você não é apontado como responsável pelo sumiço.',
        ],
        criteriosFalha: [
          'O grupo conclui que você manipulou o dossiê sozinho.',
          'Você omite a Projeção Azul até o final.',
        ],
      },
      relacoes: [
        {
          characterId: 'char-clara',
          descricao:
            'Clara defendia a fórmula como projeção comercial aceitável.',
          tensao: 'media',
          publico: false,
        },
        {
          characterId: 'char-nanda',
          descricao:
            'Nanda recebeu reclamações internas sobre a forma como os dados eram vendidos.',
          tensao: 'media',
          publico: true,
        },
      ],
      initialFileIds: ['file-davi-export', 'file-davi-formula'],
    },
    {
      id: 'char-bianca',
      nome: 'Bianca Prado',
      papelNoCaso: 'consultora de relações públicas',
      resumoPublico:
        'Bianca preparava a comunicação da venda para imprensa e investidores.',
      contextoPrivado:
        'Você não pegou o dossiê. Mas quando uma jornalista perguntou sobre maquiagem de números, você confirmou que havia desconforto interno — sem citar nomes. Se isso aparecer, todo mundo vai achar que você queria vazar o arquivo.',
      conhecimentos: [
        'Uma jornalista já sabia que havia algo estranho nos números antes do sumiço.',
        'Leo, dos compradores, pediu para segurar qualquer nota pública.',
        'Rafael parecia mais preocupado com responsabilidade legal do que com dinheiro.',
      ],
      segredo: {
        titulo: 'Fonte indireta',
        descricao:
          'Você confirmou para uma jornalista que havia desconforto interno, sem autorização da empresa.',
        riscoReputacional: 'medio',
        relacionadoAoCaso: true,
      },
      objetivoIndividual: {
        id: 'obj-bianca-evitar-vazamento',
        titulo: 'Evitar parecer a fonte',
        descricao:
          'Mantenha o foco no sumiço do dossiê e evite que o grupo conclua que você tentou vazar o material.',
        criteriosSucesso: [
          'O grupo não atribui o sumiço a uma estratégia de imprensa.',
          'Sua conversa com a jornalista não vira a teoria principal.',
        ],
        criteriosFalha: [
          'O grupo acredita que você moveu o dossiê para gerar crise pública.',
          'Você é tratada como principal manipuladora da investigação.',
        ],
      },
      relacoes: [
        {
          characterId: 'char-clara',
          descricao: 'Clara contratou você para proteger a narrativa da venda.',
          tensao: 'media',
          publico: true,
        },
        {
          characterId: 'char-rafael',
          descricao:
            'Rafael te pareceu disposto a enfrentar a venda, mas não a vazar para imprensa.',
          tensao: 'baixa',
          publico: false,
        },
      ],
      initialFileIds: ['file-bianca-jornalista', 'file-bianca-leo'],
    },
    {
      id: 'char-nanda',
      nome: 'Nanda Ribeiro',
      papelNoCaso: 'coordenadora de pessoas',
      resumoPublico:
        'Nanda acompanhava denúncias internas sobre pressão nas métricas.',
      contextoPrivado:
        'Júlia, analista júnior, reclamou que pediam para ela tratar convite como presença. Você atrasou o encaminhamento porque a venda poderia salvar empregos. Agora essa omissão pode parecer proteção à fraude.',
      conhecimentos: [
        'Júlia reclamou da forma como as métricas eram apresentadas internamente.',
        'Marina desligou as notificações da sala durante a reunião.',
        'Davi parecia desconfortável quando a aba Projeção Azul era mencionada.',
      ],
      segredo: {
        titulo: 'Reclamação engavetada',
        descricao:
          'Você segurou por dois dias uma reclamação interna sobre as métricas para não explodir a negociação.',
        riscoReputacional: 'alto',
        relacionadoAoCaso: true,
      },
      objetivoIndividual: {
        id: 'obj-nanda-proteger-equipe',
        titulo: 'Proteger a equipe',
        descricao:
          'Faça o grupo reconhecer que a equipe júnior foi pressionada, sem deixar que Júlia vire culpada pelo vazamento ou pelo sumiço.',
        criteriosSucesso: [
          'O grupo entende que a reclamação de Júlia era alerta, não sabotagem.',
          'A responsabilidade não cai nos funcionários júnior.',
        ],
        criteriosFalha: [
          'Júlia ou a equipe júnior são acusadas como fonte do sumiço.',
          'Sua omissão vira a causa central da crise.',
        ],
      },
      relacoes: [
        {
          characterId: 'char-davi',
          descricao:
            'Davi liderava a área que pressionou a equipe por números melhores.',
          tensao: 'media',
          publico: true,
        },
        {
          characterId: 'char-clara',
          descricao:
            'Clara pediu para tratar reclamações internas depois da assinatura.',
          tensao: 'alta',
          publico: false,
        },
      ],
      initialFileIds: ['file-nanda-julia', 'file-nanda-marina'],
    },
    {
      id: 'char-marina',
      nome: 'Marina Azevedo',
      papelNoCaso: 'assistente executiva',
      resumoPublico:
        'Marina preparou a sala, imprimiu as cópias e controlava a chave do arquivo.',
      contextoPrivado:
        'Você deixou o dossiê na sala às 20h50 — ele estava lá. Mais cedo, emprestou a chave para Rafael por cinco minutos porque ele disse que precisava conferir uma nota fiscal. Isso te coloca perto demais do sumiço, mesmo sem ter tocado no envelope.',
      conhecimentos: [
        'O envelope lacrado estava na sala às 20h50.',
        'Rafael ficou com a chave do arquivo por alguns minutos antes da reunião.',
        'A câmera do corredor não enviou alerta porque você mudou o modo da sala.',
      ],
      segredo: {
        titulo: 'Chave emprestada',
        descricao:
          'Você emprestou a chave do arquivo para Rafael sem registrar a retirada.',
        riscoReputacional: 'medio',
        relacionadoAoCaso: true,
      },
      objetivoIndividual: {
        id: 'obj-marina-nao-ser-culpada',
        titulo: 'Não virar a culpada conveniente',
        descricao:
          'Mostre que você controlou a sala corretamente sem esconder que Rafael teve acesso à chave.',
        criteriosSucesso: [
          'O grupo entende que o dossiê estava na sala depois da sua entrega.',
          'A chave emprestada aparece como pista, não como culpa sua.',
        ],
        criteriosFalha: [
          'O grupo conclui que você sumiu com o envelope.',
          'Você omite a chave até o final.',
        ],
      },
      relacoes: [
        {
          characterId: 'char-rafael',
          descricao:
            'Rafael te pediu acesso rápido ao arquivo pouco antes do sumiço.',
          tensao: 'alta',
          publico: false,
        },
        {
          characterId: 'char-bianca',
          descricao:
            'Bianca pediu para segurar qualquer notícia até a reunião acabar.',
          tensao: 'baixa',
          publico: true,
        },
      ],
      initialFileIds: ['file-marina-chave', 'file-marina-sala'],
    },
  ],
  files: [
    {
      id: 'file-clara-agenda',
      tipo: 'email',
      titulo: 'E-mail dos compradores — 18h40',
      corpo:
        '"Clara, precisamos ver o dossiê completo antes da assinatura. Se os números fecharem, seguimos hoje. Se houver divergência relevante, remarcamos."',
      recebidoEm: 'leitura_privada',
      evidenceIds: ['ev-agenda-antecipada'],
    },
    {
      id: 'file-clara-rafael',
      tipo: 'mensagem',
      titulo: 'Mensagem de Rafael — 20h14',
      corpo:
        '"Não assino nada sem a planilha bruta. A versão limpa não explica a diferença de presença."',
      recebidoEm: 'leitura_privada',
      evidenceIds: ['ev-versao-limpa', 'ev-metricas-brutas'],
    },
    {
      id: 'file-rafael-planilha',
      tipo: 'relatorio',
      titulo: 'Comparativo bruto',
      corpo:
        'Presença real: 41%. Presença no dossiê: 73%. A projeção inclui convites enviados como intenção de presença.',
      recebidoEm: 'leitura_privada',
      evidenceIds: ['ev-metricas-brutas'],
    },
    {
      id: 'file-rafael-clara',
      tipo: 'mensagem',
      titulo: 'Mensagem de Clara — 20h20',
      corpo:
        '"A aba de divergências só vai confundir. Explica a metodologia se perguntarem. Manda a versão limpa."',
      recebidoEm: 'leitura_privada',
      evidenceIds: ['ev-versao-limpa'],
    },
    {
      id: 'file-davi-export',
      tipo: 'registro',
      titulo: 'Log de acesso ao sistema',
      corpo:
        '20h03 — exportação da planilha bruta: usuário r.torres. 20h44 — nova consulta à aba Projeção Azul: mesmo usuário.',
      recebidoEm: 'leitura_privada',
      evidenceIds: ['ev-export-rafael', 'ev-metricas-brutas'],
    },
    {
      id: 'file-davi-formula',
      tipo: 'anotacao',
      titulo: 'Fórmula da Projeção Azul',
      corpo:
        'Presença estimada = check-ins confirmados + 65% de convites aceitos + 30% de convites enviados.',
      recebidoEm: 'leitura_privada',
      evidenceIds: ['ev-formula-projecao'],
    },
    {
      id: 'file-bianca-jornalista',
      tipo: 'mensagem',
      titulo: 'Pergunta da jornalista',
      corpo:
        '"Tem gente dizendo que a Vértice chama convite de presença. Isso procede ou é briga interna antes da venda?"',
      recebidoEm: 'leitura_privada',
      evidenceIds: ['ev-jornalista-rumor'],
    },
    {
      id: 'file-bianca-leo',
      tipo: 'mensagem',
      titulo: 'Pedido dos compradores — Leo',
      corpo:
        '"Segura qualquer nota até vermos o dossiê. Se a história das métricas for real, a compra muda de figura."',
      recebidoEm: 'leitura_privada',
      evidenceIds: ['ev-jornalista-rumor', 'ev-agenda-antecipada'],
    },
    {
      id: 'file-nanda-julia',
      tipo: 'email',
      titulo: 'E-mail de Júlia — analista júnior',
      corpo:
        '"Me pediram para classificar convite enviado como presença estimada. Isso vai pro comprador? Não quero assinar dado que parece presença real."',
      recebidoEm: 'leitura_privada',
      evidenceIds: ['ev-reclamacao-julia', 'ev-formula-projecao'],
    },
    {
      id: 'file-nanda-marina',
      tipo: 'mensagem',
      titulo: 'Mensagem de Marina — 20h47',
      corpo:
        '"Vou deixar a sala sem notificação para não interromper a reunião. Se precisar, me chama direto."',
      recebidoEm: 'leitura_privada',
      evidenceIds: ['ev-corredor-sem-alerta'],
    },
    {
      id: 'file-marina-chave',
      tipo: 'registro',
      titulo: 'Controle da chave — 20h32',
      corpo:
        'Chave retirada por Marina. Anotação: "Rafael conferiu nota fiscal por 5 min." Sem registro de devolução.',
      recebidoEm: 'leitura_privada',
      evidenceIds: ['ev-chave-arquivo'],
    },
    {
      id: 'file-marina-sala',
      tipo: 'anotacao',
      titulo: 'Checklist da sala — 20h50',
      corpo:
        'Envelope lacrado no centro da mesa. Água, projetor e seis cadeiras conferidos. Sala liberada.',
      recebidoEm: 'leitura_privada',
      evidenceIds: ['ev-sumico-confirmado'],
    },
    {
      id: 'file-rafael-anotacao',
      tipo: 'anotacao',
      titulo: 'Rascunho não enviado — Rafael',
      corpo:
        'Se assinarmos hoje, a responsabilidade contábil cai em mim também. Preciso forçar pausa. O envelope é a única coisa que eles não conseguem ignorar.',
      recebidoEm: 'investigacao_inicial',
      evidenceIds: ['ev-anotacao-rafael'],
      desbloqueadoPorActionId: 'act-rafael-nao-acusar',
    },
    {
      id: 'file-marina-corredor',
      tipo: 'registro',
      titulo: 'Registro do corredor — 21h11',
      corpo:
        'Movimento detectado no corredor da sala de conferência. Notificação não enviada — sala em modo reunião.',
      recebidoEm: 'confronto',
      evidenceIds: ['ev-corredor-rafael', 'ev-corredor-sem-alerta'],
      desbloqueadoPorActionId: 'act-marina-perguntar-chave',
    },
    {
      id: 'file-davi-cache',
      tipo: 'registro',
      titulo: 'Cache do dashboard',
      corpo:
        'Última prévia antes do sumiço: aba Projeção Azul expandida, aba Presença Real minimizada.',
      recebidoEm: 'nova_evidencia',
      evidenceIds: ['ev-formula-projecao', 'ev-metricas-brutas'],
      desbloqueadoPorActionId: 'act-davi-explicar-formula',
    },
  ],
  evidences: [
    {
      id: 'ev-agenda-antecipada',
      titulo: 'A reunião foi antecipada',
      descricao:
        'Os compradores queriam ver o dossiê completo ainda naquela noite.',
      tipo: 'apoio',
      visibilidade: 'privada',
      phaseAvailable: 'leitura_privada',
      relatedCharacterIds: ['char-clara', 'char-bianca', 'char-marina'],
      sourceFileIds: ['file-clara-agenda', 'file-bianca-leo'],
      isEssential: false,
    },
    {
      id: 'ev-metricas-brutas',
      titulo: 'As métricas brutas não batiam',
      descricao:
        'A presença real era muito menor que a presença estimada no dossiê.',
      tipo: 'essencial',
      visibilidade: 'privada',
      phaseAvailable: 'leitura_privada',
      relatedCharacterIds: ['char-rafael', 'char-davi', 'char-nanda'],
      sourceFileIds: [
        'file-rafael-planilha',
        'file-davi-export',
        'file-clara-rafael',
      ],
      isEssential: true,
    },
    {
      id: 'ev-versao-limpa',
      titulo: 'Clara pediu a versão limpa',
      descricao:
        'A versão apresentada aos compradores não incluía a aba de divergências.',
      tipo: 'reputacional',
      visibilidade: 'privada',
      phaseAvailable: 'leitura_privada',
      relatedCharacterIds: ['char-clara', 'char-rafael'],
      sourceFileIds: ['file-rafael-clara', 'file-clara-rafael'],
      isEssential: false,
    },
    {
      id: 'ev-export-rafael',
      titulo: 'Rafael acessou a planilha bruta',
      descricao:
        'O login de Rafael exportou a base bruta pouco antes do sumiço.',
      tipo: 'essencial',
      visibilidade: 'privada',
      phaseAvailable: 'leitura_privada',
      relatedCharacterIds: ['char-rafael', 'char-davi'],
      sourceFileIds: ['file-davi-export'],
      isEssential: true,
    },
    {
      id: 'ev-formula-projecao',
      titulo: 'A fórmula misturava convite e presença',
      descricao:
        'A Projeção Azul contava parte dos convites enviados como presença estimada.',
      tipo: 'apoio',
      visibilidade: 'privada',
      phaseAvailable: 'leitura_privada',
      relatedCharacterIds: ['char-davi', 'char-nanda'],
      sourceFileIds: ['file-davi-formula', 'file-nanda-julia'],
      isEssential: false,
    },
    {
      id: 'ev-jornalista-rumor',
      titulo: 'A imprensa já farejava a história',
      descricao:
        'Uma jornalista perguntou sobre maquiagem de números antes do sumiço.',
      tipo: 'distracao',
      visibilidade: 'privada',
      phaseAvailable: 'leitura_privada',
      relatedCharacterIds: ['char-bianca'],
      sourceFileIds: ['file-bianca-jornalista', 'file-bianca-leo'],
      isEssential: false,
    },
    {
      id: 'ev-reclamacao-julia',
      titulo: 'Júlia alertou sobre a métrica',
      descricao:
        'Uma analista interna questionou a classificação de convites como presença.',
      tipo: 'essencial',
      visibilidade: 'privada',
      phaseAvailable: 'leitura_privada',
      relatedCharacterIds: ['char-nanda', 'char-davi'],
      sourceFileIds: ['file-nanda-julia'],
      isEssential: true,
    },
    {
      id: 'ev-chave-arquivo',
      titulo: 'Rafael teve acesso à chave',
      descricao:
        'Marina emprestou a chave do arquivo para Rafael antes do sumiço.',
      tipo: 'apoio',
      visibilidade: 'privada',
      phaseAvailable: 'leitura_privada',
      relatedCharacterIds: ['char-marina', 'char-rafael'],
      sourceFileIds: ['file-marina-chave'],
      isEssential: false,
    },
    {
      id: 'ev-sumico-confirmado',
      titulo: 'O dossiê estava na sala às 20h50',
      descricao:
        'Marina registrou o envelope lacrado na sala antes da reunião.',
      tipo: 'apoio',
      visibilidade: 'privada',
      phaseAvailable: 'leitura_privada',
      relatedCharacterIds: ['char-marina'],
      sourceFileIds: ['file-marina-sala'],
      isEssential: false,
    },
    {
      id: 'ev-corredor-sem-alerta',
      titulo: 'A sala estava sem notificação',
      descricao:
        'O corredor teve movimento, mas o alerta automático estava desligado.',
      tipo: 'ambigua',
      visibilidade: 'privada',
      phaseAvailable: 'leitura_privada',
      relatedCharacterIds: ['char-nanda', 'char-marina'],
      sourceFileIds: ['file-nanda-marina', 'file-marina-corredor'],
      isEssential: false,
    },
    {
      id: 'ev-impressao-2110',
      titulo: 'Impressão emergencial às 21h10',
      descricao:
        'Uma cópia parcial do dossiê foi impressa com o login de Rafael dois minutos antes da retirada do envelope.',
      tipo: 'essencial',
      visibilidade: 'publica',
      phaseAvailable: 'nova_evidencia',
      relatedCharacterIds: ['char-rafael'],
      sourceFileIds: [],
      isEssential: true,
    },
    {
      id: 'ev-corredor-rafael',
      titulo: 'Movimento no corredor',
      descricao:
        'O registro de movimento coloca alguém no corredor da sala no horário em que o dossiê desapareceu.',
      tipo: 'apoio',
      visibilidade: 'privada',
      phaseAvailable: 'confronto',
      relatedCharacterIds: ['char-rafael', 'char-marina'],
      sourceFileIds: ['file-marina-corredor'],
      isEssential: false,
    },
    {
      id: 'ev-anotacao-rafael',
      titulo: 'Rafael queria forçar uma pausa',
      descricao:
        'Uma anotação não enviada indica que Rafael via o envelope como forma de impedir a assinatura.',
      tipo: 'essencial',
      visibilidade: 'privada',
      phaseAvailable: 'investigacao_inicial',
      relatedCharacterIds: ['char-rafael'],
      sourceFileIds: ['file-rafael-anotacao'],
      isEssential: true,
    },
  ],
  secretActions: [
    {
      id: 'act-rafael-nao-acusar',
      tipo: 'omissao_controlada',
      phaseAvailable: 'investigacao_inicial',
      recipientCharacterIds: ['char-rafael'],
      titulo: 'Segure a primeira acusação',
      instrucaoPrivada:
        'Não seja a primeira pessoa a acusar alguém diretamente nesta fase. Faça perguntas, ouça — só então aponte nomes.',
      textoAoRecusar:
        'Você decidiu não cumprir a ação. Uma pista menor será desbloqueada.',
      reward: {
        tipo: 'arquivo_extra',
        titulo: 'Rascunho não enviado',
        descricao:
          'Você encontra sua própria anotação sobre forçar uma pausa na assinatura.',
        fileId: 'file-rafael-anotacao',
        evidenceId: 'ev-anotacao-rafael',
      },
      alternativaAcessivel: {
        instrucao:
          'Se preferir, apenas faça uma pergunta aberta ao grupo sobre motivação.',
        reward: {
          tipo: 'confirmacao_parcial',
          titulo: 'Motivação importa',
          descricao:
            'O sumiço provavelmente não foi por dinheiro imediato, mas para controlar a reunião.',
          evidenceId: 'ev-anotacao-rafael',
        },
      },
      metainfoForCharacterIds: ['char-bianca'],
    },
    {
      id: 'act-davi-explicar-formula',
      tipo: 'pergunta_social',
      phaseAvailable: 'nova_evidencia',
      recipientCharacterIds: ['char-davi'],
      titulo: 'Explique antes de ser acusado',
      instrucaoPrivada:
        'Antes de alguém te acusar, explique ao grupo a diferença entre presença real e presença estimada. Seja técnico, não defensivo.',
      textoAoRecusar:
        'Você preferiu não explicar a fórmula agora. Uma pista menos direta será desbloqueada.',
      reward: {
        tipo: 'arquivo_extra',
        titulo: 'Cache do dashboard',
        descricao:
          'Você recupera uma prévia que mostra quais abas estavam abertas antes do sumiço.',
        fileId: 'file-davi-cache',
        evidenceId: 'ev-formula-projecao',
      },
      alternativaAcessivel: {
        instrucao:
          'Se não quiser explicar em voz alta, peça que alguém leia uma pista sobre números.',
        reward: {
          tipo: 'metainformacao',
          titulo: 'A palavra-chave é projeção',
          descricao:
            'A diferença entre projeção e presença real é central para o caso.',
          evidenceId: 'ev-formula-projecao',
        },
      },
      metainfoForCharacterIds: ['char-nanda'],
    },
    {
      id: 'act-bianca-pergunta-fonte',
      tipo: 'pergunta_social',
      phaseAvailable: 'investigacao_inicial',
      recipientCharacterIds: ['char-bianca'],
      titulo: 'Pergunte sobre reputação',
      instrucaoPrivada:
        'Em algum momento desta fase, pergunte ao grupo: "quem aqui tem mais a perder se isso virar notícia?"',
      textoAoRecusar: 'Você decidiu não puxar essa pergunta agora.',
      reward: {
        tipo: 'metainformacao',
        titulo: 'Risco de manchete',
        descricao:
          'A imprensa é uma distração forte, mas não explica sozinha quem pegou o envelope.',
        evidenceId: 'ev-jornalista-rumor',
      },
      alternativaAcessivel: {
        instrucao:
          'Se preferir, peça para alguém listar quem se prejudica com a reunião suspensa.',
        reward: {
          tipo: 'confirmacao_parcial',
          titulo: 'Vazamento não basta',
          descricao:
            'A pessoa responsável queria controlar a reunião, não só gerar notícia.',
          evidenceId: 'ev-jornalista-rumor',
        },
      },
      metainfoForCharacterIds: ['char-clara'],
    },
    {
      id: 'act-nanda-defender-julia',
      tipo: 'defesa_publica',
      phaseAvailable: 'confronto',
      recipientCharacterIds: ['char-nanda'],
      titulo: 'Defenda a equipe júnior',
      instrucaoPrivada:
        'Se alguém citar Júlia ou a equipe júnior durante o confronto, diga com clareza que levantar um alerta interno não é sabotagem.',
      textoAoRecusar: 'Você decidiu não defender a equipe neste momento.',
      reward: {
        tipo: 'confirmacao_parcial',
        titulo: 'Júlia alertou, não removeu',
        descricao:
          'A reclamação de Júlia aponta para o segredo das métricas, mas não para a retirada física do envelope.',
        evidenceId: 'ev-reclamacao-julia',
      },
      alternativaAcessivel: {
        instrucao:
          'Se a equipe não for citada, pergunte quem sabia da reclamação interna.',
        reward: {
          tipo: 'metainformacao',
          titulo: 'Alerta interno',
          descricao:
            'A reclamação existia antes do sumiço e ajuda a explicar a motivação.',
          evidenceId: 'ev-reclamacao-julia',
        },
      },
      metainfoForCharacterIds: ['char-davi'],
    },
    {
      id: 'act-marina-perguntar-chave',
      tipo: 'pedido_de_informacao',
      phaseAvailable: 'confronto',
      recipientCharacterIds: ['char-marina'],
      titulo: 'Confronte sobre a chave',
      instrucaoPrivada:
        'Pergunte diretamente a Rafael por que ele precisou da chave do arquivo antes da reunião.',
      textoAoRecusar: 'Você preferiu não confrontar Rafael sobre a chave agora.',
      reward: {
        tipo: 'arquivo_extra',
        titulo: 'Registro do corredor',
        descricao:
          'Você encontra o registro de movimento que não disparou notificação.',
        fileId: 'file-marina-corredor',
        evidenceId: 'ev-corredor-rafael',
      },
      alternativaAcessivel: {
        instrucao:
          'Se não quiser confrontar Rafael, conte ao grupo que a chave saiu do seu controle por alguns minutos.',
        reward: {
          tipo: 'confirmacao_parcial',
          titulo: 'A chave importa',
          descricao:
            'O acesso ao arquivo é uma ponte entre a sala preparada e o sumiço.',
          evidenceId: 'ev-chave-arquivo',
        },
      },
      metainfoForCharacterIds: ['char-rafael'],
    },
  ],
  verdictQuestions: [
    {
      id: 'q-responsavel',
      tipo: 'responsavel',
      pergunta: 'Quem removeu o dossiê?',
      obrigatoria: true,
      opcoes: [
        'char-clara',
        'char-rafael',
        'char-davi',
        'char-bianca',
        'char-nanda',
        'char-marina',
      ],
      respostaCorreta: 'char-rafael',
      peso: 4,
    },
    {
      id: 'q-motivacao',
      tipo: 'motivacao',
      pergunta: 'Qual foi a motivação principal?',
      obrigatoria: true,
      opcoes: [
        'impedir uma venda baseada em métricas infladas',
        'vazar o dossiê para a imprensa',
        'proteger Marina de uma falha operacional',
        'conseguir uma proposta melhor dos compradores',
      ],
      respostaCorreta: 'impedir uma venda baseada em métricas infladas',
      peso: 3,
    },
    {
      id: 'q-segredo-central',
      tipo: 'segredo_central',
      pergunta: 'O que o dossiê escondia?',
      obrigatoria: true,
      opcoes: [
        'as métricas de presença da Vértice estavam infladas',
        'a empresa tinha perdido todos os clientes',
        'Bianca já tinha vendido a história para a imprensa',
        'Marina havia falsificado o checklist da sala',
      ],
      respostaCorreta: 'as métricas de presença da Vértice estavam infladas',
      peso: 3,
    },
    {
      id: 'q-documento-decisivo',
      tipo: 'documento_decisivo',
      pergunta: 'Qual pista mais aproxima o grupo da verdade?',
      obrigatoria: false,
      opcoes: [
        'ev-impressao-2110',
        'ev-jornalista-rumor',
        'ev-corredor-sem-alerta',
        'ev-sumico-confirmado',
      ],
      respostaCorreta: 'ev-impressao-2110',
      peso: 1,
    },
  ],
  finalTitles: [
    'A Chave do Caso',
    'O Omitidor Convicto',
    'A Pessoa Que Sabia Demais',
    'A Teoria Perigosa',
    'A Testemunha Incômoda',
    'A Guardiã da Sala',
  ],
};
