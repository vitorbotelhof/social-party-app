// ─── Entrelinhas — Pool de Histórias ─────────────────────────────────────────
//
// Linha editorial:
//   A solução precisa mudar completamente a interpretação da história.
//   O cérebro cria uma explicação inicial plausível — e depois percebe que
//   estava interpretando tudo errado.
//
// Critérios de aprovação:
//   ✓ Contexto curto e extremamente visual
//   ✓ Informações incompletas mas honestas
//   ✓ Detalhe oculto que reorganiza toda a lógica
//   ✓ Solução retrospectivamente óbvia
//   ✓ Forte momento "eureka"
//   ✓ Coerência absoluta após a revelação
//
// Dificuldade:
//   facil   → eureka rápido, poucas deduções, acessível a qualquer grupo
//   media   → exige 2-3 deduções encadeadas, lateral thinking moderado
//   dificil → exige contexto específico ou cadeia longa de raciocínio

export type DificuldadeHistoria = 'facil' | 'media' | 'dificil';

export interface Historia {
  id: string;
  titulo: string;
  contexto: string;
  solucao: string;
  dificuldade: DificuldadeHistoria;
}

export const HISTORIAS: ReadonlyArray<Historia> = [

  // ════════════════════════════════════════════════════════════════════════════
  // FÁCIL
  // ════════════════════════════════════════════════════════════════════════════

  {
    id: 'perfume',
    titulo: 'O Perfume',
    contexto:
      'Um homem entra no elevador sorrindo. Quando as portas se abrem no andar dele, sai chorando.',
    solucao:
      'Dentro do elevador havia uma mulher usando o mesmo perfume da sua esposa, que havia morrido meses antes. Foi o cheiro que o desfez.',
    dificuldade: 'facil',
  },

  {
    id: 'voo_ex',
    titulo: 'O Voo',
    contexto:
      'Um homem perde propositalmente um voo importante. No aeroporto, observa o avião decolar e suspira aliviado.',
    solucao:
      'No momento do embarque, viu sua ex-esposa entrando no mesmo avião. Ele estava acompanhado da amante. Perdeu o voo para evitar o encontro.',
    dificuldade: 'facil',
  },

  {
    id: 'bilhete_vaga',
    titulo: 'O Bilhete',
    contexto:
      'Uma mulher encontra na mesa de trabalho um bilhete anônimo: "eu sei o que você fez". Ela sorri, aliviada.',
    solucao:
      'Dias antes, ela havia tomado a vaga de estacionamento de um colega sem querer. Ao ler o bilhete, seu coração disparou — imaginou que alguém havia descoberto algo muito mais sério. O alívio foi imenso.',
    dificuldade: 'facil',
  },

  {
    id: 'foto_reflexo',
    titulo: 'A Foto',
    contexto:
      'Uma garota posta uma foto que recebe milhares de curtidas em minutos. Ela apaga imediatamente.',
    solucao:
      'No reflexo da tela do computador ao fundo da foto, estava visível uma conversa privada que ela não deveria ter. Ela percebeu antes que alguém mais percebesse.',
    dificuldade: 'facil',
  },

  {
    id: 'mala_pedras',
    titulo: 'A Mala',
    contexto:
      'Um homem joga sua mala no mar. Todos os outros passageiros do barco comemoram.',
    solucao:
      'O barco estava perigosamente pesado e começando a afundar. A mala do homem estava cheia de pedras — ele a havia carregado sem saber o que havia dentro. Ao jogá-la ao mar, o barco estabilizou.',
    dificuldade: 'facil',
  },

  {
    id: 'inspecao',
    titulo: 'A Inspeção',
    contexto:
      'Uma mulher entra num restaurante cheio, olha em volta e sai sem sentar.',
    solucao:
      'Era inspetora sanitária em visita surpresa. O que viu antes mesmo de chegar a uma mesa foi suficiente para interditar o local no dia seguinte.',
    dificuldade: 'facil',
  },

  {
    id: 'ligacao_refem',
    titulo: 'A Ligação',
    contexto:
      'Um homem liga para a polícia e fica em silêncio. Dez minutos depois, policiais arrombam a porta.',
    solucao:
      'Ele estava sendo mantido refém com uma arma na cabeça. Ligou para o 190 sem conseguir falar — a central rastreou a chamada e enviou socorro.',
    dificuldade: 'facil',
  },

  {
    id: 'aplauso_solo',
    titulo: 'O Aplauso',
    contexto:
      'Todo o público vaia o pianista no palco. Uma mulher na plateia aplaude de pé, sozinha.',
    solucao:
      'Era a mãe dele. Era o primeiro recital depois de um acidente que os médicos disseram que o impediria de tocar para sempre.',
    dificuldade: 'facil',
  },

  {
    id: 'briga_atores',
    titulo: 'A Briga',
    contexto:
      'Dois homens brigam na rua. Um deles para, agradece ao outro e os dois entram numa lanchonete juntos.',
    solucao:
      'Eram atores ensaiando uma cena do lado de fora do teatro. Quando o diretor gritou "corta", foram lanchar.',
    dificuldade: 'facil',
  },

  {
    id: 'chaveiro',
    titulo: 'O Ladrão',
    contexto:
      'Um homem arromba um carro na rua. Uma mulher para ao lado e o agradece.',
    solucao:
      'A mulher havia trancado o filho dentro do carro com as chaves. O homem era o chaveiro que ela havia chamado de urgência.',
    dificuldade: 'facil',
  },

  {
    id: 'dentista_sorriso',
    titulo: 'O Dentista',
    contexto:
      'Uma criança sai do dentista sorrindo apesar de ter tirado um dente.',
    solucao:
      'Era o dente que ela tentava arrancar com barbante há semanas. O dentista só completou o trabalho.',
    dificuldade: 'facil',
  },

  {
    id: 'casal_silencioso',
    titulo: 'O Jantar Silencioso',
    contexto:
      'Um casal não troca uma palavra durante um jantar de três horas. Quando saem, estão sorrindo.',
    solucao:
      'Os dois eram surdos e conversaram em língua de sinais durante todo o jantar. A mesa ao lado ficou olhando sem entender por que não falavam.',
    dificuldade: 'facil',
  },

  {
    id: 'critico_hotel',
    titulo: 'O Crítico',
    contexto:
      'Um homem paga pelo quarto mais caro de um hotel, entra e vai embora em cinco minutos.',
    solucao:
      'Era crítico de hospedagem para uma revista. Cinco minutos eram suficientes para avaliar limpeza, cheiro, temperatura e organização. A próxima reserva já estava feita em outro hotel a três quarteirões.',
    dificuldade: 'facil',
  },

  {
    id: 'escadas_diarias',
    titulo: 'As Escadas',
    contexto:
      'Um homem trabalha no 30º andar de um prédio e nunca usa o elevador.',
    solucao:
      'Ele tem claustrofobia severa. Sobe e desce de escada todos os dias há doze anos sem faltar ao trabalho.',
    dificuldade: 'facil',
  },

  {
    id: 'corrida_onibus',
    titulo: 'O Intervalo',
    contexto:
      'Uma mulher corre para pegar um ônibus. Quando o ônibus para, ela desacelera e o deixa ir.',
    solucao:
      'Ela estava no intervalo de alta intensidade de um treino. O ônibus parou exatamente no ponto onde ela devia desacelerar. Pegar o transporte teria arruinado a sessão.',
    dificuldade: 'facil',
  },

  {
    id: 'carteira_achada',
    titulo: 'A Carteira',
    contexto:
      'Um homem encontra uma carteira com muito dinheiro e a entrega na polícia. Anos depois, usa esse dinheiro para comprar um apartamento.',
    solucao:
      'A carteira nunca foi reclamada. Por lei, após o prazo sem reclamação, o valor é revertido para quem encontrou. Ele havia registrado o achado corretamente e aguardado o prazo legal.',
    dificuldade: 'facil',
  },

  {
    id: 'festa_endereco',
    titulo: 'O Endereço',
    contexto:
      'Uma mulher chega a uma festa de aniversário com um bolo. Quando vê o aniversariante, vai embora com o bolo.',
    solucao:
      'Ela havia ido ao endereço errado. A festa era do vizinho do andar de baixo. Seu amigo morava um andar acima.',
    dificuldade: 'facil',
  },

  {
    id: 'dono_taxi',
    titulo: 'O Proprietário',
    contexto:
      'Um homem entra num táxi, conversa por vinte minutos e sai sem pagar.',
    solucao:
      'Era o dono da empresa de táxi fazendo uma avaliação de motorista. O motorista havia passado em todos os critérios. A viagem era cortesia da empresa.',
    dificuldade: 'facil',
  },

  {
    id: 'estatua_curadora',
    titulo: 'A Estátua',
    contexto:
      'Um artista passa horas imóvel como estátua humana numa praça. Quando para, só uma pessoa aplaudiu.',
    solucao:
      'Essa pessoa era a curadora que havia vindo avaliá-lo. O contrato para o museu estava garantido.',
    dificuldade: 'facil',
  },

  {
    id: 'campanha_abraco',
    titulo: 'O Abraço',
    contexto:
      'Duas pessoas se abraçam num aeroporto por vinte minutos. Nenhuma das duas chora. As pessoas ao redor choram.',
    solucao:
      'Eram atores de uma campanha publicitária. A câmera estava escondida. Eles eram os únicos que sabiam que era encenação.',
    dificuldade: 'facil',
  },

  {
    id: 'reveillon_fogueira',
    titulo: 'O Réveillon',
    contexto:
      'Um casal coloca fogo em documentos no quintal de casa. Os vizinhos chamam os bombeiros.',
    solucao:
      'Era uma tradição familiar: queimar toda a papelada do ano — contas, burocracia, formulários — numa fogueira de réveillon. Os vizinhos não conheciam o costume.',
    dificuldade: 'facil',
  },

  {
    id: 'rascunho_prova',
    titulo: 'O Rascunho',
    contexto:
      'Um aluno entrega a prova em branco e sai sorrindo. Uma semana depois, o professor o procura.',
    solucao:
      'O aluno havia entregado a folha de rascunho por engano. O professor estava procurando porque as respostas no rascunho eram as melhores da turma.',
    dificuldade: 'facil',
  },

  {
    id: 'alta_oncologia',
    titulo: 'A Alta',
    contexto:
      'Uma mulher sai de um hospital e sorri para todos os estranhos na rua.',
    solucao:
      'Era sua última sessão de quimioterapia. O médico havia confirmado que estava curada. Ela saiu do hospital e entrou na primeira rua que encontrou para sorrir para quem passasse.',
    dificuldade: 'facil',
  },

  {
    id: 'xadrez_filho',
    titulo: 'O Xadrez',
    contexto:
      'Um homem perde propositalmente uma partida de xadrez. O adversário chora de alegria.',
    solucao:
      'O adversário era seu filho de 8 anos, que havia aprendido xadrez sozinho com vídeos. Era a primeira partida que jogavam juntos. O pai quis que a primeira vitória fosse do filho.',
    dificuldade: 'facil',
  },

  {
    id: 'carta_marido',
    titulo: 'A Carta',
    contexto:
      'Uma mulher recebe uma carta de amor depois de quarenta anos. Ela leva para o marido ler.',
    solucao:
      'A carta era do marido. Ele havia escrito antes do primeiro encontro deles com medo de nunca ter coragem de falar com ela, guardou a carta — e se casou com ela mesmo assim. Havia encontrado o envelope numa mudança.',
    dificuldade: 'facil',
  },

  {
    id: 'maratonista_parada',
    titulo: 'A Parada',
    contexto:
      'Um corredor desiste de uma maratona faltando 200 metros para a chegada.',
    solucao:
      'Ao lado dele, outro corredor havia caído e estava confuso. Ele parou para ficar com o colega até a ambulância chegar. Os dois haviam treinado juntos por um ano inteiro.',
    dificuldade: 'facil',
  },

  {
    id: 'rico_abrigo',
    titulo: 'O Abrigo',
    contexto:
      'Um homem rico passa toda semana dormindo num abrigo para sem-teto.',
    solucao:
      'Ele havia sido sem-teto na juventude. O abrigo havia mudado sua vida. Toda semana que passava lá era para não esquecer de onde veio — e para conversar com quem estava passando pelo mesmo.',
    dificuldade: 'facil',
  },

  {
    id: 'promessa_medico',
    titulo: 'A Promessa',
    contexto:
      'Um homem jura nunca mais entrar num hospital. Trinta anos depois, entra para trabalhar todos os dias.',
    solucao:
      'Ele havia prometido à mãe no leito de morte que nunca mais deixaria o hospital levar alguém que ele amasse. Tornou-se médico.',
    dificuldade: 'facil',
  },

  // ════════════════════════════════════════════════════════════════════════════
  // MÉDIA
  // ════════════════════════════════════════════════════════════════════════════

  {
    id: 'elevador_heranca',
    titulo: 'O Elevador',
    contexto:
      'Uma mulher entra num elevador chorando. Quando as portas se abrem no térreo, ela começa a rir.',
    solucao:
      'Ela estava indo ao funeral do ex-marido. No trajeto de descida, lembrou que finalmente herdaria o apartamento dele.',
    dificuldade: 'media',
  },

  {
    id: 'restaurante_gorjeta',
    titulo: 'O Restaurante',
    contexto:
      'Um homem é péssimamente atendido num restaurante. Ao sair, deixa uma gorjeta enorme.',
    solucao:
      'O garçom havia derramado vinho nele, obrigando-o a ir ao banheiro trocar a roupa. Ao passar pelo corredor, flagrou a esposa sendo beijada por outro homem. O garçom, sem querer, havia revelado uma traição que durava meses. A gorjeta foi um agradecimento sincero.',
    dificuldade: 'media',
  },

  {
    id: 'escada_paralisia',
    titulo: 'A Escada',
    contexto:
      'Uma mulher cai da escada na frente da família. Em vez de pedir socorro, começa a rir.',
    solucao:
      'Ela fingia estar com as pernas paralisadas há anos para receber dinheiro e cuidados da família. A queda revelou, sem que ela pudesse esconder, que conseguia se mover. O riso foi nervoso.',
    dificuldade: 'media',
  },

  {
    id: 'trem_culpa',
    titulo: 'O Trem',
    contexto:
      'Uma mulher desliga a televisão toda vez que ouve um trem passar. Isso acontece há anos, sempre que está em casa.',
    solucao:
      'O marido dela morreu atropelado por um trem enquanto ela assistia TV. Ele havia ligado várias vezes pedindo ajuda, mas ela não atendeu. Agora, toda vez que ouve um trem, ela desliga tudo — tarde demais, mas não consegue parar.',
    dificuldade: 'media',
  },

  {
    id: 'sapatos_casamento',
    titulo: 'Os Sapatos',
    contexto:
      'No dia do casamento, o noivo olha para os sapatos da noiva e cancela a cerimônia na hora. Ela jura que não entende o motivo.',
    solucao:
      'A noiva sempre disse que visitava toda semana o túmulo do irmão do noivo, em uma trilha de terra batida. Os sapatos dela estavam impecáveis, sem uma mancha. Ele percebeu que ela nunca havia ido.',
    dificuldade: 'media',
  },

  {
    id: 'cachorro_rosnou',
    titulo: 'O Cachorro',
    contexto:
      'Uma mulher termina o relacionamento com o namorado no momento em que ele tenta acariciar o cachorro dela. Ela não dá nenhuma explicação.',
    solucao:
      'O cachorro nunca havia rosnado para amigos ou familiares. Quando o namorado se abaixou para acariciá-lo, o animal rosnou baixinho. Era a primeira vez. A mulher havia aprendido a confiar no instinto do cachorro mais do que no julgamento das pessoas.',
    dificuldade: 'media',
  },

  {
    id: 'quarto_rachadura',
    titulo: 'O Quarto',
    contexto:
      'Um homem dorme tranquilamente no chão do próprio quarto. Ao lado dele, uma cama intocada.',
    solucao:
      'Horas antes de dormir, ele havia notado rachaduras profundas no teto exatamente acima da cama. Dormiu no único lugar do quarto que considerava seguro.',
    dificuldade: 'media',
  },

  {
    id: 'passos_papainoel',
    titulo: 'Os Passos',
    contexto:
      'Um casal ouve passos no telhado de madrugada. Chamam a polícia. Quando os policiais chegam, o casal começa a discutir feio.',
    solucao:
      'O marido havia contratado um ator vestido de Papai Noel para surpreender os filhos. A esposa não sabia. Quando descobriu, percebeu que o marido havia mentido sobre estar sem dinheiro para os presentes de Natal.',
    dificuldade: 'media',
  },

  {
    id: 'recado_sequestro',
    titulo: 'O Recado',
    contexto:
      'Um homem chega em casa e encontra um bilhete na mesa da cozinha: "finalmente livre". Ele liga imediatamente para a polícia.',
    solucao:
      'Sua esposa havia sido sequestrada três dias antes. Ela conseguiu escapar do cativeiro e deixou o bilhete antes de ir ao hospital. O marido, ao ler "finalmente livre" numa casa vazia, interpretou o pior.',
    dificuldade: 'media',
  },

  {
    id: 'aviso_testemunha',
    titulo: 'O Aviso',
    contexto:
      'Um homem encontra um bilhete colado na porta de casa: "eu te vi ontem". Ele chama a polícia imediatamente.',
    solucao:
      'Ele vivia no programa de proteção a testemunhas há anos, sob uma identidade completamente falsa. Qualquer indício de que alguém o havia reconhecido era questão de vida ou morte.',
    dificuldade: 'media',
  },

  {
    id: 'convite_acidente',
    titulo: 'O Convite',
    contexto:
      'Uma mulher recebe um convite valioso para aparecer num programa de televisão nacional. Ela recusa sem hesitar.',
    solucao:
      'O programa reunia sobreviventes de um acidente aéreo que havia matado dezenas de pessoas. Ela foi a única responsável pelo acidente — e ninguém sabia.',
    dificuldade: 'media',
  },

  {
    id: 'apagao_laboratorio',
    titulo: 'O Apagão',
    contexto:
      'A cidade inteira fica sem luz. Um homem que trabalhava num prédio comercial sai correndo em pânico para a rua.',
    solucao:
      'Ele trabalhava num laboratório subterrâneo do prédio. O sistema de ventilação do subsolo funcionava apenas com energia elétrica. Sem ele, o ar começaria a faltar em minutos.',
    dificuldade: 'media',
  },

  {
    id: 'presente_pai',
    titulo: 'O Presente',
    contexto:
      'Um menino ganha exatamente o presente que havia pedido e começa a chorar.',
    solucao:
      'O pai havia prometido aquele presente antes de morrer. A mãe encontrou o brinquedo escondido no sótão — comprado antes do acidente. Ela o embrulhou e entregou sem dizer nada sobre a origem.',
    dificuldade: 'media',
  },

  {
    id: 'album_foto',
    titulo: 'O Álbum',
    contexto:
      'Um homem folheia um álbum de fotos antigas da esposa e pede divórcio.',
    solucao:
      'Numa das fotos, a esposa jovem aparecia sorrindo ao lado de um homem. Meses antes, ela havia jurado sob lágrimas nunca ter visto essa pessoa na vida. Era exatamente esse homem.',
    dificuldade: 'media',
  },

  {
    id: 'casaco_exame',
    titulo: 'O Casaco',
    contexto:
      'Um homem veste um casaco que não usava há anos e desmaia.',
    solucao:
      'No bolso havia um resultado de exame médico: ele tinha poucos meses de vida. O exame era antigo — ele havia superado a doença e bloqueado completamente essa memória. Ao ler o papel, o corpo cedeu antes de o cérebro processar que já havia sobrevivido.',
    dificuldade: 'media',
  },

  {
    id: 'retrato_salvador',
    titulo: 'O Retrato',
    contexto:
      'Uma mulher tem a foto emoldurada de um estranho na escrivaninha do trabalho. Nunca contou a ninguém quem é.',
    solucao:
      'Ela o viu salvar uma criança de ser atropelada e desaparecer na multidão. Nunca soube o nome dele. A foto é de uma câmera de segurança que ela pediu ao prédio vizinho.',
    dificuldade: 'media',
  },

  {
    id: 'dois_pratos',
    titulo: 'O Lugar',
    contexto:
      'Um homem prepara jantar para duas pessoas, come sozinho e lava os dois pratos.',
    solucao:
      'A esposa havia morrido dois anos antes. Ele continuava preparando o prato favorito dela e usando o lugar dela para sentir que ela ainda estava lá.',
    dificuldade: 'media',
  },

  {
    id: 'guarda_chuva_tumulo',
    titulo: 'O Guarda-chuva',
    contexto:
      'Uma mulher sai de casa com guarda-chuva num dia de sol e volta encharcada sem ele.',
    solucao:
      'Era o aniversário de morte da mãe. Ela tinha o hábito de deixar o guarda-chuva aberto sobre o túmulo em dias de chuva. Saiu com sol, encontrou chuva no cemitério e deixou o guarda-chuva com a mãe.',
    dificuldade: 'media',
  },

  {
    id: 'cirurgiao_pai',
    titulo: 'O Cirurgião',
    contexto:
      'Um cirurgião reconhece o paciente na mesa de operação e pede para outro médico assumir.',
    solucao:
      'Era o pai com quem havia cortado relações há quinze anos. Pediu a troca para não operar com tremor emocional — não por antipatia, mas por responsabilidade com o paciente.',
    dificuldade: 'media',
  },

  {
    id: 'bolsa_documentos',
    titulo: 'A Bolsa',
    contexto:
      'Uma mulher perde a bolsa no metrô. Quando a acham, fica furiosa com quem devolveu.',
    solucao:
      'Dentro havia documentos que ela pretendia destruir. Ao ser devolvida intacta, eles continuavam lá. Era sua única chance de eliminá-los discretamente — e ela havia perdido.',
    dificuldade: 'media',
  },

  {
    id: 'confidente_policial',
    titulo: 'O Confidente',
    contexto:
      'Um homem confessa um crime para um desconhecido no avião. Quando aterrissam, o desconhecido o entrega à polícia.',
    solucao:
      'O desconhecido era policial viajando a trabalho. O crime confessado era exatamente o que ele investigava há meses. O homem não sabia com quem estava sentado.',
    dificuldade: 'media',
  },

  {
    id: 'testamento_dividas',
    titulo: 'O Testamento',
    contexto:
      'Uma filha descobre que não está no testamento do pai e liga para agradecer ao irmão.',
    solucao:
      'O pai havia deixado uma empresa com dívidas enormes. O irmão havia herdado o passivo sem saber. Ela havia descoberto antes da reunião com o advogado.',
    dificuldade: 'media',
  },

  {
    id: 'cicatriz_medico',
    titulo: 'A Cicatriz',
    contexto:
      'Uma mulher mostra uma cicatriz para um estranho. Ele chora.',
    solucao:
      'Era a cicatriz de uma cirurgia que ele havia realizado dez anos antes. Nunca soubera se a paciente havia sobrevivido. Era a primeira vez que a via viva.',
    dificuldade: 'media',
  },

  {
    id: 'registro_nome',
    titulo: 'O Registro',
    contexto:
      'Uma mulher muda o próprio nome. O marido não percebe por três meses.',
    solucao:
      'Ela havia deixado de usar o sobrenome do casamento em todos os documentos após iniciar um processo de separação. O marido havia parado de chamá-la pelo nome há tanto tempo que não notou.',
    dificuldade: 'media',
  },

  {
    id: 'trilha_cinema',
    titulo: 'O Filme',
    contexto:
      'Um homem começa a chorar no cinema durante um filme de ação. A namorada para de olhar para a tela.',
    solucao:
      'A trilha sonora usava a mesma música que havia tocado no funeral da mãe dele, morta recentemente. Ele não havia contado para a namorada sobre o velório.',
    dificuldade: 'media',
  },

  {
    id: 'porteiro_exsocio',
    titulo: 'A Entrada',
    contexto:
      'Um porteiro barra um homem bem vestido. O dono do prédio, que estava atrás, agradece ao porteiro.',
    solucao:
      'O homem bem vestido era o ex-sócio que havia desviado dinheiro da empresa do dono do prédio. O porteiro havia recebido uma foto e uma instrução: nunca deixe essa pessoa entrar.',
    dificuldade: 'media',
  },

  {
    id: 'cano_autismo',
    titulo: 'O Cano',
    contexto:
      'Um bombeiro chega para consertar um cano e a dona da casa pede para ele não consertar.',
    solucao:
      'O som do cano pingando era o único som que conseguia fazer o filho autista dela dormir. Ela havia esperado meses para chegar àquele sono.',
    dificuldade: 'media',
  },

  {
    id: 'autografo_professor',
    titulo: 'O Autógrafo',
    contexto:
      'Um escritor famoso passa a noite assinando livros de fãs. No final, pede para um fã assinar o dele.',
    solucao:
      'O fã era o professor que havia incentivado o escritor na infância. O livro era dedicado a ele. Sem saber o endereço, o escritor havia esperado anos que ele aparecesse numa sessão de autógrafos.',
    dificuldade: 'media',
  },

  {
    id: 'culpa_filho',
    titulo: 'A Culpa',
    contexto:
      'Um homem vai a uma delegacia e confessa um crime que não cometeu.',
    solucao:
      'O verdadeiro culpado era o filho. O homem sabia que a pena para ele — já idoso — seria menor do que para o filho, que teria a vida inteira arruinada.',
    dificuldade: 'media',
  },

  {
    id: 'cego_aceno',
    titulo: 'O Aceno',
    contexto:
      'Um homem acena da janela para uma mulher na rua todos os dias. Um dia ela sobe, bate na porta e ele não abre.',
    solucao:
      'Ele era cego de nascença e acenava sempre no horário em que o barulho do ônibus passava — era seu relógio. A mulher havia interpretado os acenos como direcionados a ela durante meses.',
    dificuldade: 'media',
  },

  {
    id: 'ritual_pedido',
    titulo: 'O Ritual',
    contexto:
      'Um homem pede a mulher em casamento. Ela diz não. Os dois voltam para casa de mãos dadas.',
    solucao:
      'Eles já eram casados há dez anos. Todo ano, no mesmo local, ele repetia o pedido original — e ela dizia não de brincadeira. Era o ritual deles.',
    dificuldade: 'media',
  },

  {
    id: 'autora_livro',
    titulo: 'Os Direitos',
    contexto:
      'Uma mulher rouba um livro de uma livraria. O dono a vê e não faz nada.',
    solucao:
      'O livro havia sido escrito por ela. A livraria estava vendendo exemplares sem pagar os direitos autorais acordados. Ela levou os que havia vendido. O dono não fez nada porque sabia que ela tinha razão.',
    dificuldade: 'media',
  },

  {
    id: 'delirio_febre',
    titulo: 'O Equívoco',
    contexto:
      'Um homem liga para a polícia dizendo que o vizinho está em perigo. Quando a polícia chega, o vizinho está bem e o homem é levado.',
    solucao:
      'O homem havia ligado enquanto delirante de febre alta e havia confundido os apartamentos. O vizinho em perigo era ele mesmo. A polícia o levou para o hospital.',
    dificuldade: 'media',
  },

  {
    id: 'infiltrada_contrato',
    titulo: 'O Contrato',
    contexto:
      'Uma mulher assina um contrato de trabalho e chora de alívio. O empregador fica sem entender.',
    solucao:
      'Ela havia sido contratada como investigadora infiltrada para apurar irregularidades na empresa. O alívio era por ter conseguido acesso depois de meses de tentativa. O empregador nunca saberia.',
    dificuldade: 'media',
  },

  {
    id: 'escultura_filho',
    titulo: 'O Memorial',
    contexto:
      'Um homem vende uma escultura por um valor simbólico para um museu. O museu oferece dez vezes mais. Ele recusa.',
    solucao:
      'A escultura havia sido feita pelo filho quando criança, antes de morrer. Para ele, não tinha preço. Vendê-la por um valor simbólico foi a forma de garantir que ficasse onde muitas pessoas pudessem ver — sem ficar numa coleção privada.',
    dificuldade: 'media',
  },

  {
    id: 'dois_relogios',
    titulo: 'Os Fusos',
    contexto:
      'Um homem usa dois relógios — um em cada pulso. Numa entrevista de emprego, tira os dois de repente e sai correndo.',
    solucao:
      'Um relógio marcava o horário local, o outro marcava o da cidade onde vivia a família. Ao tirar os relógios por hábito, percebeu que havia confundido os fusos — e estava perdendo a chamada semanal com o filho.',
    dificuldade: 'media',
  },

  {
    id: 'rua_infancia',
    titulo: 'O Mapa',
    contexto:
      'Um homem para diante de um mapa turístico de uma cidade e começa a tremer.',
    solucao:
      'No mapa, ele reconheceu a rua onde havia morado na infância. Era a primeira vez, em trinta anos, que alguém conseguia mostrar onde havia crescido antes de ser adotado e mudar de país.',
    dificuldade: 'media',
  },

  {
    id: 'detetive_joalheria',
    titulo: 'A Testemunha',
    contexto:
      'Uma mulher assiste a um roubo numa joalheria e não reage. Quando o ladrão sai, ela entra.',
    solucao:
      'Era detetive e havia passado meses infiltrada para chegar até o ladrão. Entrou para confirmar o roubo e acionar os colegas do lado de fora — era a prisão planejada.',
    dificuldade: 'media',
  },

  {
    id: 'livro_dedicatoria',
    titulo: 'A Dedicatória',
    contexto:
      'Uma mulher lê o mesmo livro toda semana há dez anos. Ela nunca passa da primeira página.',
    solucao:
      'O livro havia sido dado pelo filho antes de uma viagem da qual ele não voltou. A dedicatória estava na primeira página. Ela nunca foi além porque não conseguia.',
    dificuldade: 'media',
  },

  {
    id: 'diagnostico_melhora',
    titulo: 'O Diagnóstico',
    contexto:
      'Uma mulher sai do médico sorrindo depois de um diagnóstico grave.',
    solucao:
      'O médico havia dito que ela tinha seis meses de vida com o tratamento certo. Dois anos antes, o diagnóstico havia sido semanas. Ela estava ganhando tempo.',
    dificuldade: 'media',
  },

  {
    id: 'irmaos_rivais',
    titulo: 'O DNA',
    contexto:
      'Dois adversários políticos se encontram num bar e saem amigos horas depois.',
    solucao:
      'Um deles havia acabado de descobrir que eram irmãos por parte de pai. A rivalidade havia começado antes de qualquer um saber sobre o laço sanguíneo.',
    dificuldade: 'media',
  },

  {
    id: 'tatuagem_numero',
    titulo: 'O Número',
    contexto:
      'Um homem tatua um número no braço. A mãe chora ao ver.',
    solucao:
      'Era a posição no ranking mundial de xadrez que ele havia alcançado — o mesmo número da camiseta do pai, que havia morrido antes de vê-lo se tornar profissional.',
    dificuldade: 'media',
  },

  {
    id: 'alianca_emprestada',
    titulo: 'A Aliança',
    contexto:
      'Uma mulher usa aliança de casamento num jantar de negócios. Em casa, a tira e a devolve para uma colega.',
    solucao:
      'Ela havia descoberto que o cliente com quem negociava era assediador. Pediu a aliança emprestada a uma colega para usar durante a reunião.',
    dificuldade: 'media',
  },

  {
    id: 'manuscrito_aviao',
    titulo: 'O Manuscrito',
    contexto:
      'Uma mulher chora durante todo o voo. A aeromoça para ao seu lado e pergunta se pode ajudar. A mulher diz que não.',
    solucao:
      'Ela estava terminando de ler o manuscrito do marido, que havia morrido antes de publicar. Era a primeira vez que ela o lia completo.',
    dificuldade: 'media',
  },

  {
    id: 'garrafa_enterrada',
    titulo: 'A Garrafa',
    contexto:
      'Todo ano no mesmo dia, um homem enterra uma garrafa no quintal. No dia seguinte, a desencava.',
    solucao:
      'Era alcoólatra em recuperação. Toda vez que sentia vontade de beber, enterrava a garrafa para testar a própria força de vontade. A desencavava no dia seguinte como prova de que havia resistido. Doze anos sem tomar um gole.',
    dificuldade: 'media',
  },

  {
    id: 'prova_filosofia',
    titulo: 'A Folha',
    contexto:
      'Um aluno entrega a prova em branco. Uma semana depois, recebe a maior nota da turma.',
    solucao:
      'Era uma prova de filosofia. A única questão pedia uma reflexão sobre o conceito de vazio. O professor entendeu a folha em branco como a resposta mais coerente possível.',
    dificuldade: 'media',
  },

  {
    id: 'diagnostico_trocado',
    titulo: 'O Adeus',
    contexto:
      'Um homem se despede de todos os amigos e familiares em um único dia. No dia seguinte, está de volta.',
    solucao:
      'Havia sido diagnosticado com uma doença terminal. Horas depois, ligou do hospital: o diagnóstico havia sido trocado com o de outro paciente. Ele estava saudável.',
    dificuldade: 'media',
  },

  {
    id: 'sinistro_carro',
    titulo: 'O Sinistro',
    contexto:
      'Uma mulher bate levemente no próprio carro enquanto saindo de casa. Depois chama o seguro.',
    solucao:
      'Um vândalo havia arranhado o carro na noite anterior e fugido. O arranhão não era coberto pela apólice — acidente com outro veículo, sim. Ela fez o próprio acidente para cobrir o dano.',
    dificuldade: 'media',
  },

  {
    id: 'fotografa_reuniao',
    titulo: 'O Relatório',
    contexto:
      'Uma mulher tira fotos de uma reunião de negócios sem permissão. O CEO a agradece.',
    solucao:
      'Ela era investigadora contratada para documentar que um diretor compartilhava informações sigilosas com concorrentes. As fotos seriam usadas no processo judicial.',
    dificuldade: 'media',
  },

  {
    id: 'passagem_ida',
    titulo: 'A Viagem',
    contexto:
      'Um homem compra passagem de ida sem volta para uma cidade que nunca visitou. Volta no dia seguinte.',
    solucao:
      'Ele sabia que se tivesse opção de voltar a qualquer momento, poderia desistir antes de chegar. Comprou só a ida para se forçar. Quando chegou, resolveu o que precisava. Comprou a volta no aeroporto.',
    dificuldade: 'media',
  },

  {
    id: 'idioma_errado',
    titulo: 'O Idioma',
    contexto:
      'Uma professora faz uma pergunta para a turma. Todos sabem a resposta. Ninguém responde.',
    solucao:
      'Ela havia trocado de idioma sem perceber — estava ansiosa por uma reunião que teria depois. Nenhum aluno havia entendido uma palavra.',
    dificuldade: 'media',
  },

  {
    id: 'velorio_proprio',
    titulo: 'O Velório',
    contexto:
      'Um homem chega a um velório e todas as pessoas ao seu redor entram em pânico.',
    solucao:
      'O velório era o dele. Havia sido declarado morto por engano após um acidente. Acordou no hospital, saiu sem avisar ninguém e foi até lá.',
    dificuldade: 'media',
  },

  {
    id: 'filho_paciente',
    titulo: 'O Reconhecimento',
    contexto:
      'Um médico vê o rosto de um paciente em recuperação e sai da sala chorando.',
    solucao:
      'O paciente havia dado entrada inconsciente e sem documentos. Só durante a recuperação o médico reconheceu o rosto: era o pai com quem havia cortado relações há quinze anos.',
    dificuldade: 'media',
  },

  {
    id: 'presente_embrulhado',
    titulo: 'O Embrulho',
    contexto:
      'Uma mulher devolve um presente ao marido sem abrir. Ele sorri e aceita.',
    solucao:
      'Era o próprio presente de aniversário dela, que o marido havia escondido. Ela havia encontrado por acidente, embrulhado de volta e devolvido para não estragar a surpresa. Ele não percebeu que ela sabia.',
    dificuldade: 'media',
  },

  {
    id: 'surpresa_amigos',
    titulo: 'A Mentira',
    contexto:
      'Uma mulher mente para o marido sobre onde esteve a tarde inteira. Quando ele chega em casa, chora de gratidão.',
    solucao:
      'Ela havia passado a tarde organizando uma surpresa de aniversário. Para manter o segredo, mentiu sobre o paradeiro. Quando ele chegou, encontrou amigos que não via há vinte anos.',
    dificuldade: 'media',
  },

  {
    id: 'churrasco_fumaca',
    titulo: 'O Incêndio',
    contexto:
      'Uma mulher vê fumaça saindo de um prédio e não liga para os bombeiros.',
    solucao:
      'Era churrasco no terraço do prédio — ela havia organizado a festa. Ficou parada para avisar as pessoas que paravam assustadas na calçada.',
    dificuldade: 'media',
  },

  {
    id: 'escritor_apaga',
    titulo: 'O Final',
    contexto:
      'Um escritor termina um livro, lê o último parágrafo e apaga tudo.',
    solucao:
      'O personagem principal morria no final. Ao reler, o escritor percebeu que havia dado ao personagem o nome do filho que perdera. Não havia notado durante a escrita. Não conseguiu manter o final.',
    dificuldade: 'media',
  },

  {
    id: 'retorno_desconhecido',
    titulo: 'O Retorno',
    contexto:
      'Um homem bate na própria porta depois de dez anos. A esposa abre e fecha sem reconhecê-lo.',
    solucao:
      'Ele havia engordado muito, crescido barba e mudado completamente o visual. A esposa achou que era um vendedor. Ele foi para um hotel, se arrumou e voltou no dia seguinte.',
    dificuldade: 'media',
  },

  {
    id: 'carta_para_si',
    titulo: 'A Carta para Si',
    contexto:
      'Um carteiro encontra, no lote que ele mesmo deve distribuir, uma carta endereçada a si mesmo.',
    solucao:
      'Meses antes, num período de crise pessoal, ele havia enviado uma carta para si mesmo com instruções para não abrir antes de uma data. Era sua forma de falar com o futuro.',
    dificuldade: 'media',
  },

  {
    id: 'senha_metro',
    titulo: 'A Senha',
    contexto:
      'Uma mulher escreve a senha do próprio celular num papel e entrega para uma desconhecida no metrô.',
    solucao:
      'Ela estava sendo seguida por alguém que a ameaçava e precisava que alguém ligasse para emergências sem chamar atenção. Entregou o papel para a primeira pessoa de confiança que passou.',
    dificuldade: 'media',
  },

  {
    id: 'ultimo_dia',
    titulo: 'O Último Dia',
    contexto:
      'Um homem passa o último dia de trabalho pedindo desculpa a todos os colegas. Eles ficam confusos.',
    solucao:
      'Era o último dia de um projeto específico — não do emprego. Ele havia sido difícil durante todo o projeto e quis se desculpar antes de começar o próximo. Nenhum colega sabia que ele continuaria trabalhando lá.',
    dificuldade: 'media',
  },

  {
    id: 'fila_banco',
    titulo: 'A Fila',
    contexto:
      'Um homem fura a fila de um banco. O segurança o deixa passar. Os outros clientes reclamam.',
    solucao:
      'Ele havia ligado antes informando que era vítima de um golpe em andamento. O banco havia instruído o segurança a deixá-lo entrar imediatamente e de forma discreta.',
    dificuldade: 'media',
  },

  {
    id: 'engano_negocio',
    titulo: 'O Engano',
    contexto:
      'Um homem aparece no endereço errado num jantar de negócios e fecha o melhor contrato da vida.',
    solucao:
      'O endereço errado era o de um concorrente do seu cliente original. Ao explicar o engano, acabou apresentando seu produto. O concorrente se interessou mais do que o cliente original havia se interessado.',
    dificuldade: 'media',
  },

  // ════════════════════════════════════════════════════════════════════════════
  // DIFÍCIL
  // ════════════════════════════════════════════════════════════════════════════

  {
    id: 'fotografia_revelacao',
    titulo: 'A Fotografia',
    // NOTA EDITORIAL: exige conhecimento de fotografia analógica.
    // Recomendado para grupos mais velhos ou com interesse em fotografia.
    contexto:
      'Uma mulher atira no marido, mergulha ele em água e depois os dois jantam tranquilamente juntos.',
    solucao:
      'Ela era fotógrafa. No seu laboratório de revelação, tirou uma foto do marido, mergulhou o papel em solução química para revelar a imagem e pendurou para secar. Depois o chamou para jantar.',
    dificuldade: 'dificil',
  },

  {
    id: 'relogio_voo',
    titulo: 'O Relógio',
    // NOTA EDITORIAL: cadeia longa (relógio errado → atraso → voo perdido → voo caiu).
    contexto:
      'Um homem quebra o relógio de parede do escritório. Os colegas aplaudem.',
    solucao:
      'O relógio estava duas horas atrasado. Por meses, a equipe havia chegado tarde a compromissos sem entender o motivo. Naquele dia, chegaram ao aeroporto atrasados e perderam o voo. O voo caiu logo depois de decolar.',
    dificuldade: 'dificil',
  },

  {
    id: 'grupo_intervencao',
    titulo: 'O Grupo',
    // NOTA EDITORIAL: depende de o grupo conhecer o conceito de "intervenção".
    contexto:
      'Um homem manda o endereço de um local no grupo de amigos. Ninguém responde. Ele chega ao local e todos estão lá.',
    solucao:
      'Os amigos haviam combinado em segredo estar no local — não era festa. Ele estava tentando sair de um relacionamento abusivo há meses e não conseguia sozinho. Eles decidiram aparecer juntos quando souberam que a namorada estaria fora naquele dia.',
    dificuldade: 'dificil',
  },

  {
    id: 'leilao_procedencia',
    titulo: 'O Lance',
    contexto:
      'Uma mulher dá um lance enorme num objeto sem valor num leilão. Ela perde para outro lance e sai aliviada.',
    solucao:
      'O objeto havia sido roubado da família dela décadas antes. Ela ofereceu o lance para forçar o preço a subir e expor que alguém havia pago caro por algo sem procedência. O comprador seria investigado.',
    dificuldade: 'dificil',
  },

  {
    id: 'sentenca_proposital',
    titulo: 'A Sentença',
    contexto:
      'Um advogado perde um caso propositalmente. Seu cliente o abraça.',
    solucao:
      'Havia um inocente condenado pelo mesmo crime que o cliente havia cometido de fato. Ao perder o caso, o advogado deu início ao processo de revisão que libertaria o inocente. O cliente havia pedido isso — e jamais contou para a família.',
    dificuldade: 'dificil',
  },

  {
    id: 'vigilancia_hotel',
    titulo: 'A Vigilância',
    contexto:
      'Um policial reserva o quarto mais caro de um hotel e passa a noite no banco do parque em frente.',
    solucao:
      'Ele estava monitorando um suspeito que o seguia há dias. Reservou o quarto para que o suspeito acreditasse que estava dentro. Passou a noite observando a entrada do hotel do lado de fora.',
    dificuldade: 'dificil',
  },

  {
    id: 'consultor_cofre',
    titulo: 'O Teste',
    contexto:
      'Um funcionário abre o cofre da empresa, olha dentro e fecha sem tirar nada. Horas depois, é demitido.',
    solucao:
      'Era consultor de segurança contratado para testar se conseguia acessar o cofre usando uma combinação obtida por engenharia social. Conseguiu. O relatório foi devastador — e a empresa preferiu demiti-lo a admitir a falha internamente.',
    dificuldade: 'dificil',
  },

  {
    id: 'greve_portavoz',
    titulo: 'A Greve',
    contexto:
      'Um funcionário é o único que não adere à greve. Seus colegas grevistas o elegem porta-voz.',
    solucao:
      'Era o único que não podia participar — seu contrato tinha cláusula específica de não-paralisação. Por isso, era o único que conseguia falar com a empresa sem sofrer retaliação legal.',
    dificuldade: 'dificil',
  },

  {
    id: 'produto_falha',
    titulo: 'A Demonstração',
    contexto:
      'Um inventor apresenta um produto que não funciona para investidores. Eles investem imediatamente.',
    solucao:
      'O produto era um sistema de detecção de falhas em equipamentos. Ao não funcionar durante a apresentação, havia detectado exatamente a falha que os investidores testavam em todos os produtos antes de investir. O fracasso foi a demonstração.',
    dificuldade: 'dificil',
  },

];

// ─── Histórias removidas — registro editorial ─────────────────────────────────
//
// As histórias abaixo foram descartadas. O registro existe para evitar
// que sejam reintroduzidas por engano e para documentar a decisão editorial.
//
// CLÁSSICOS CONHECIDOS (não usar — puzzles amplamente publicados):
//   • O Elevador (mora no 20º, sobe até o 12º) — clássico universal
//   • O Homem no Deserto / O Campo (palito no balão) — clássico, duas versões
//   • O Albatross / O Restaurante do Mar — clássico de canibalismo, viola tom
//   • O Hotel (Monopoly) — clássico, fonte citada pelo autor
//   • O Quarto Fechado (bloco de gelo) — clássico
//   • A Escada (mulher corre na chuva) — variação do clássico do elevador
//   • O Farol — clássico de navegação amplamente compartilhado
//   • O Avião (sem paraquedas, no chão) — clássico
//   • O Mergulhador (avião de combate a incêndio) — lenda urbana conhecida
//   • O Enterro (mata a irmã para rever o homem) — clássico de lógica lateral
//   • O Cego (hambúrguer, canibalismo) — variação do Albatross
//
// REJEITADOS — violam linha editorial:
//   • O Sorvete — solução emocional subjetiva, não deduzível por perguntas
//   • A Pizza — adivinhável na primeira pergunta, sem eureka
//   • O Funeral (nome na lápide) — adivinhável na primeira pergunta
//   • O Espelho (quebra espelhos, esconde hematomas) — solução incoerente
//   • O Guarda-Chuva (vidro caindo) — coincidência pura, sem lógica dedutível
//   • O Banheiro (bilhete de loteria) — solução completamente arbitrária
//   • O Quadro (documentos de mina na moldura) — arbitrário, sem ancoragem
//   • O Sanduíche (Polo Norte, bússola) — conhecimento técnico específico
//   • O Cigarro (vazamento de gás) — solução previsível na primeira pergunta
//   • O Copo (água no computador) — coincidências encadeadas, escala absurda
//   • O Barulho (câmara frigorífica) — convoluto, múltiplas deduções impossíveis
//   • O Homem Molhado (pedia fogo para se matar) — motivação não deduzível
//   • O Concurso (surda vence canto) — história emocional, não puzzle lógico
//   • O Casamento (irmã gêmea) — "gêmea" é a primeira hipótese de qualquer grupo
//   • O Relógio (ruído mascarava gás) — coincidência específica
//   • O Táxi (fugiu do troco) — solução = hipótese inicial
