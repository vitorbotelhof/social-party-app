import type { Categoria, CategoriaId } from '@/games/mr-white/types';

export const CATEGORIAS: Record<CategoriaId, Categoria> = {
  // ─────────────────────────────────────────────────────────────
  // CATEGORIAS CLÁSSICAS — auditadas e evoluídas
  // ─────────────────────────────────────────────────────────────
  comidas: {
    id: 'comidas',
    nome: 'Comidas',
    emoji: '🍕',
    descricao: 'Pratos brasileiros, clássicos e contemporâneos',
    palavras: [
      // leve
      { civis: 'Coxinha', undercover: 'Kibe', dificuldade: 'leve', tags: ['brasil', 'salgado'] },
      { civis: 'Brigadeiro', undercover: 'Beijinho', dificuldade: 'leve', tags: ['brasil', 'doce'] },
      { civis: 'Paçoca', undercover: 'Pé de Moleque', dificuldade: 'leve', tags: ['brasil', 'doce'] },
      { civis: 'Tapioca', undercover: 'Crepe', dificuldade: 'leve', tags: ['brasil'] },
      { civis: 'Churrasco', undercover: 'Espeto de feira', dificuldade: 'leve', tags: ['brasil', 'social'] },
      { civis: 'Açaí', undercover: 'Sorvete de creme', dificuldade: 'leve', tags: ['brasil'] },
      { civis: 'Pão de Queijo', undercover: 'Pão Francês', dificuldade: 'leve', tags: ['brasil'] },
      { civis: 'Acarajé', undercover: 'Bolinho de Bacalhau', dificuldade: 'leve', tags: ['brasil', 'regional'] },
      { civis: 'Yakisoba', undercover: 'Lámen', dificuldade: 'leve', tags: ['japones'] },
      { civis: 'Cookie', undercover: 'Brownie', dificuldade: 'leve', tags: ['doce'] },
      // media
      { civis: 'Feijoada', undercover: 'Caldo de Feijão', dificuldade: 'media', tags: ['brasil'] },
      { civis: 'Sushi', undercover: 'Temaki', dificuldade: 'media', tags: ['japones'] },
      { civis: 'Esfiha', undercover: 'Quibe Frito', dificuldade: 'media', tags: ['arabe'] },
      { civis: 'Pavê', undercover: 'Tiramisù', dificuldade: 'media', tags: ['doce'] },
      { civis: 'Moqueca', undercover: 'Caldeirada de Peixe', dificuldade: 'media', tags: ['brasil', 'regional'] },
      { civis: 'Pamonha', undercover: 'Curau', dificuldade: 'media', tags: ['brasil', 'regional'] },
      { civis: 'Quindim', undercover: 'Cocada', dificuldade: 'media', tags: ['brasil', 'doce'] },
      { civis: 'Beirute', undercover: 'Bauru', dificuldade: 'media', tags: ['brasil', 'sanduiche'] },
      { civis: 'Poke Bowl', undercover: 'Ceviche', dificuldade: 'media', tags: ['contemporaneo'] },
      { civis: 'Fondue', undercover: 'Raclette', dificuldade: 'media', tags: ['europeu'] },
      { civis: 'Strogonoff', undercover: 'Frango ao Molho', dificuldade: 'media', tags: ['brasil'] },
      { civis: 'Arroz com Leite', undercover: 'Canjica', dificuldade: 'media', tags: ['brasil', 'doce'] },
      { civis: 'Calzone', undercover: 'Pastel Assado', dificuldade: 'media', tags: ['italiano'] },
      // hard
      { civis: 'Feijão Tropeiro', undercover: 'Feijoada', dificuldade: 'hard', tags: ['brasil', 'regional'] },
      { civis: 'Dobradinha', undercover: 'Mocotó', dificuldade: 'hard', tags: ['brasil', 'regional'] },
      { civis: 'Granola', undercover: 'Açaí Bowl', dificuldade: 'hard', tags: ['saudavel'] },
      { civis: 'Bruschetta', undercover: 'Pão de Alho', dificuldade: 'hard', tags: ['italiano'] },
      { civis: 'Hambúrguer Artesanal', undercover: 'X-Burguer', dificuldade: 'hard', tags: ['contemporaneo', 'brasil'] },
      { civis: 'Petisco', undercover: 'Aperitivo', dificuldade: 'hard', tags: ['social'] },
      { civis: 'Salpicão', undercover: 'Maionese de Batata', dificuldade: 'hard', tags: ['brasil'] },
      { civis: 'Crepioca', undercover: 'Tapioca', dificuldade: 'hard', tags: ['brasil', 'saudavel'] },
      { civis: 'Pastel de Feira', undercover: 'Empada', dificuldade: 'hard', tags: ['brasil'] },
      { civis: 'Caldo Verde', undercover: 'Sopa de Ervilha', dificuldade: 'hard', tags: ['sopa'] },
      // insana
      { civis: 'Brunch', undercover: 'Café da Manhã', dificuldade: 'insana', tags: ['contemporaneo', 'social'] },
      { civis: 'Petisco', undercover: 'Lanche', dificuldade: 'insana', tags: ['social'] },
      { civis: 'Smoothie', undercover: 'Vitamina', dificuldade: 'insana', tags: ['saudavel'] },
      { civis: 'Hot Dog Gourmet', undercover: 'Cachorro-quente', dificuldade: 'insana', tags: ['brasil', 'contemporaneo'] },
      { civis: 'Bolo de Confeitaria', undercover: 'Bolo Caseiro', dificuldade: 'insana', tags: ['doce', 'social'] },
      { civis: 'Sobremesa', undercover: 'Doce', dificuldade: 'insana', tags: ['doce'] },
      { civis: 'Pizza Gourmet', undercover: 'Pizza de Delivery', dificuldade: 'insana', tags: ['italia', 'brasil', 'social'] },
      { civis: 'Frango Assado', undercover: 'Peru Assado', dificuldade: 'insana', tags: ['brasil'] },
      { civis: 'Sanduíche', undercover: 'Wrap', dificuldade: 'insana', tags: [] },
      { civis: 'Milkshake', undercover: 'Vitamina', dificuldade: 'insana', tags: [] },
      { civis: 'Caldo', undercover: 'Sopa', dificuldade: 'insana', tags: [] },
    ],
  },

  lugares: {
    id: 'lugares',
    nome: 'Lugares',
    emoji: '🌍',
    descricao: 'Lugares, cidades e espaços que todo brasileiro conhece',
    palavras: [
      // leve
      { civis: 'Praia', undercover: 'Piscina', dificuldade: 'leve', tags: ['lazer'] },
      { civis: 'Cinema', undercover: 'Teatro', dificuldade: 'leve', tags: ['cultura'] },
      { civis: 'Shopping', undercover: 'Outlet', dificuldade: 'leve', tags: ['consumo'] },
      { civis: 'Aeroporto', undercover: 'Rodoviária', dificuldade: 'leve', tags: ['viagem'] },
      { civis: 'Disney', undercover: 'Universal Studios', dificuldade: 'leve', tags: ['viagem', 'cultura_pop'] },
      { civis: 'Estádio', undercover: 'Ginásio', dificuldade: 'leve', tags: ['esporte'] },
      { civis: 'Museu', undercover: 'Biblioteca', dificuldade: 'leve', tags: ['cultura'] },
      { civis: 'Academia', undercover: 'CrossFit Box', dificuldade: 'leve', tags: ['saude', 'brasil'] },
      // media
      { civis: 'Bar', undercover: 'Boteco', dificuldade: 'media', tags: ['brasil', 'social'] },
      { civis: 'Hotel', undercover: 'Pousada', dificuldade: 'media', tags: ['viagem'] },
      { civis: 'Florianópolis', undercover: 'Búzios', dificuldade: 'media', tags: ['brasil', 'viagem'] },
      { civis: 'Copacabana', undercover: 'Ipanema', dificuldade: 'media', tags: ['brasil', 'rio'] },
      { civis: 'Lisboa', undercover: 'Porto', dificuldade: 'media', tags: ['europa', 'viagem'] },
      { civis: 'Cancún', undercover: 'Punta Cana', dificuldade: 'media', tags: ['viagem', 'caribe'] },
      { civis: 'Buenos Aires', undercover: 'Santiago', dificuldade: 'media', tags: ['viagem', 'america_latina'] },
      { civis: 'Restaurante', undercover: 'Lanchonete', dificuldade: 'media', tags: ['social'] },
      { civis: 'Cachoeira', undercover: 'Lago', dificuldade: 'media', tags: ['natureza'] },
      { civis: 'Montanha', undercover: 'Serra', dificuldade: 'media', tags: ['natureza'] },
      { civis: 'Praça', undercover: 'Parque', dificuldade: 'media', tags: ['lazer'] },
      { civis: 'Dubai', undercover: 'Abu Dhabi', dificuldade: 'media', tags: ['viagem', 'luxo'] },
      // hard
      { civis: 'Rio de Janeiro', undercover: 'São Paulo', dificuldade: 'hard', tags: ['brasil', 'rivalidade'] },
      { civis: 'Salvador', undercover: 'Recife', dificuldade: 'hard', tags: ['brasil', 'nordeste'] },
      { civis: 'Balada', undercover: 'Clube', dificuldade: 'hard', tags: ['social', 'noite'] },
      { civis: 'Paris', undercover: 'Milão', dificuldade: 'hard', tags: ['europa', 'viagem'] },
      { civis: 'Tóquio', undercover: 'Seul', dificuldade: 'hard', tags: ['asia', 'viagem'] },
      { civis: 'Salão de Beleza', undercover: 'Barbearia', dificuldade: 'hard', tags: ['brasil'] },
      { civis: 'Hospedagem no Airbnb', undercover: 'Hotel Boutique', dificuldade: 'hard', tags: ['viagem', 'contemporaneo'] },
      { civis: 'Escola', undercover: 'Faculdade', dificuldade: 'hard', tags: ['educacao'] },
      { civis: 'Hospital', undercover: 'Clínica Particular', dificuldade: 'hard', tags: [] },
      { civis: 'Mercado', undercover: 'Feira Livre', dificuldade: 'hard', tags: ['brasil'] },
      // insana
      { civis: 'Bahia', undercover: 'Pernambuco', dificuldade: 'insana', tags: ['brasil', 'nordeste'] },
      { civis: 'Camarote', undercover: 'Bloquinho de Rua', dificuldade: 'insana', tags: ['brasil', 'carnaval'] },
      { civis: 'Airbnb', undercover: 'Casa de Amigo', dificuldade: 'insana', tags: ['viagem', 'social'] },
      { civis: 'Coworking', undercover: 'Café com Wi-Fi', dificuldade: 'insana', tags: ['trabalho', 'contemporaneo'] },
      { civis: 'Casa de Shows', undercover: 'Balada', dificuldade: 'insana', tags: ['musica', 'social'] },
      { civis: 'Spa', undercover: 'Retiro', dificuldade: 'insana', tags: ['lazer', 'luxo'] },
    ],
  },

  animais: {
    id: 'animais',
    nome: 'Animais',
    emoji: '🦁',
    descricao: 'Bichos do reino animal — brasileiros e do mundo',
    palavras: [
      // leve
      { civis: 'Cachorro', undercover: 'Gato', dificuldade: 'leve', tags: ['pets'] },
      { civis: 'Tubarão', undercover: 'Baleia', dificuldade: 'leve', tags: ['mar'] },
      { civis: 'Leão', undercover: 'Tigre', dificuldade: 'leve', tags: ['selva'] },
      { civis: 'Galinha', undercover: 'Pato', dificuldade: 'leve', tags: ['fazenda'] },
      { civis: 'Águia', undercover: 'Falcão', dificuldade: 'leve', tags: ['aves'] },
      { civis: 'Cobra', undercover: 'Lagarto', dificuldade: 'leve', tags: ['repteis'] },
      { civis: 'Coelho', undercover: 'Hamster', dificuldade: 'leve', tags: ['pets'] },
      { civis: 'Elefante', undercover: 'Hipopótamo', dificuldade: 'leve', tags: ['africa'] },
      // media
      { civis: 'Cavalo', undercover: 'Mula', dificuldade: 'media', tags: ['fazenda'] },
      { civis: 'Coruja', undercover: 'Morcego', dificuldade: 'media', tags: ['noturnos'] },
      { civis: 'Pinguim', undercover: 'Foca', dificuldade: 'media', tags: ['polares'] },
      { civis: 'Aranha', undercover: 'Escorpião', dificuldade: 'media', tags: ['insetos'] },
      { civis: 'Borboleta', undercover: 'Mariposa', dificuldade: 'media', tags: ['insetos'] },
      { civis: 'Abelha', undercover: 'Vespa', dificuldade: 'media', tags: ['insetos'] },
      { civis: 'Beija-flor', undercover: 'Andorinha', dificuldade: 'media', tags: ['brasil', 'aves'] },
      { civis: 'Urso', undercover: 'Panda', dificuldade: 'media', tags: [] },
      { civis: 'Polvo', undercover: 'Lula', dificuldade: 'media', tags: ['mar'] },
      { civis: 'Capivara', undercover: 'Paca', dificuldade: 'media', tags: ['brasil'] },
      { civis: 'Tatu', undercover: 'Tamanduá', dificuldade: 'media', tags: ['brasil'] },
      { civis: 'Tucano', undercover: 'Arara', dificuldade: 'media', tags: ['brasil', 'aves'] },
      // hard
      { civis: 'Onça', undercover: 'Leopardo', dificuldade: 'hard', tags: ['brasil', 'felinos'] },
      { civis: 'Camaleão', undercover: 'Iguana', dificuldade: 'hard', tags: ['repteis'] },
      { civis: 'Lobo', undercover: 'Coiote', dificuldade: 'hard', tags: [] },
      { civis: 'Canguru', undercover: 'Coala', dificuldade: 'hard', tags: ['australia'] },
      { civis: 'Camelo', undercover: 'Lhama', dificuldade: 'hard', tags: [] },
      { civis: 'Tartaruga', undercover: 'Jabuti', dificuldade: 'hard', tags: ['brasil'] },
      { civis: 'Lagosta', undercover: 'Caranguejo', dificuldade: 'hard', tags: ['mar'] },
      { civis: 'Veado', undercover: 'Cervo', dificuldade: 'hard', tags: [] },
      { civis: 'Porco', undercover: 'Javali', dificuldade: 'hard', tags: [] },
      // insana
      { civis: 'Ovelha', undercover: 'Cabra', dificuldade: 'insana', tags: ['fazenda'] },
      { civis: 'Formiga', undercover: 'Cupim', dificuldade: 'insana', tags: ['insetos'] },
      { civis: 'Rato', undercover: 'Esquilo', dificuldade: 'insana', tags: [] },
      { civis: 'Vaca', undercover: 'Búfalo', dificuldade: 'insana', tags: ['fazenda'] },
      { civis: 'Pavão', undercover: 'Faisão', dificuldade: 'insana', tags: ['aves'] },
      { civis: 'Cavalo-marinho', undercover: 'Estrela do Mar', dificuldade: 'insana', tags: ['mar'] },
    ],
  },

  esportes: {
    id: 'esportes',
    nome: 'Esportes',
    emoji: '⚽',
    descricao: 'Modalidades esportivas e cultura fitness brasileira',
    palavras: [
      // leve
      { civis: 'Futebol', undercover: 'Futsal', dificuldade: 'leve', tags: ['brasil', 'popular'] },
      { civis: 'Vôlei', undercover: 'Handebol', dificuldade: 'leve', tags: [] },
      { civis: 'Natação', undercover: 'Hidroginástica', dificuldade: 'leve', tags: [] },
      { civis: 'Skate', undercover: 'Patins', dificuldade: 'leve', tags: ['urbano'] },
      { civis: 'Boxe', undercover: 'Muay Thai', dificuldade: 'leve', tags: ['luta'] },
      { civis: 'Surfe', undercover: 'Bodyboard', dificuldade: 'leve', tags: ['brasil', 'praia'] },
      // media
      { civis: 'Corrida', undercover: 'Caminhada', dificuldade: 'media', tags: ['fitness'] },
      { civis: 'Tênis', undercover: 'Beach Tennis', dificuldade: 'media', tags: ['brasil'] },
      { civis: 'Ciclismo', undercover: 'Mountain Bike', dificuldade: 'media', tags: [] },
      { civis: 'Judô', undercover: 'Karatê', dificuldade: 'media', tags: ['luta'] },
      { civis: 'Capoeira', undercover: 'Jiu-jitsu', dificuldade: 'media', tags: ['brasil', 'luta'] },
      { civis: 'MMA', undercover: 'Luta Livre', dificuldade: 'media', tags: ['luta'] },
      { civis: 'Rugby', undercover: 'Futebol Americano', dificuldade: 'media', tags: [] },
      { civis: 'Maratona', undercover: 'Triatlo', dificuldade: 'media', tags: ['fitness'] },
      { civis: 'Yoga', undercover: 'Pilates', dificuldade: 'media', tags: ['fitness', 'bem_estar'] },
      { civis: 'Stand Up Paddle', undercover: 'Caiaque', dificuldade: 'media', tags: ['agua'] },
      { civis: 'Escalada', undercover: 'Rapel', dificuldade: 'media', tags: ['aventura'] },
      // hard
      { civis: 'Levantamento de Peso', undercover: 'CrossFit', dificuldade: 'hard', tags: ['fitness'] },
      { civis: 'Ginástica Olímpica', undercover: 'Ginástica Rítmica', dificuldade: 'hard', tags: [] },
      { civis: 'Sinuca', undercover: 'Bilhar', dificuldade: 'hard', tags: [] },
      { civis: 'Pingue-Pongue', undercover: 'Badminton', dificuldade: 'hard', tags: [] },
      { civis: 'Basquete', undercover: 'Vôlei', dificuldade: 'hard', tags: [] },
      { civis: 'Parkour', undercover: 'Calistenia', dificuldade: 'hard', tags: ['urbano', 'fitness'] },
      { civis: 'Mergulho', undercover: 'Snorkel', dificuldade: 'hard', tags: ['agua'] },
      { civis: 'Hipismo', undercover: 'Polo', dificuldade: 'hard', tags: ['luxo'] },
      // insana
      { civis: 'Xadrez', undercover: 'Damas', dificuldade: 'insana', tags: [] },
      { civis: 'Corrida de Rua', undercover: 'Corrida de Trilha', dificuldade: 'insana', tags: ['fitness'] },
      { civis: 'Personal Trainer', undercover: 'Educador Físico', dificuldade: 'insana', tags: ['fitness', 'trabalho'] },
      { civis: 'Treino na Academia', undercover: 'Treino em Casa', dificuldade: 'insana', tags: ['fitness', 'brasil'] },
      { civis: 'SmartFit', undercover: 'Biofit', dificuldade: 'insana', tags: ['fitness', 'brasil'] },
    ],
  },

  filmes: {
    id: 'filmes',
    nome: 'Filmes e Séries',
    emoji: '🎬',
    descricao: 'Filmes e séries que todo mundo já viu ou ouviu falar',
    palavras: [
      // leve
      { civis: 'Titanic', undercover: 'Avatar', dificuldade: 'leve', tags: ['cinema', 'blockbuster'] },
      { civis: 'Toy Story', undercover: 'Procurando Nemo', dificuldade: 'leve', tags: ['animacao', 'pixar'] },
      { civis: 'Frozen', undercover: 'Moana', dificuldade: 'leve', tags: ['animacao', 'disney'] },
      { civis: 'Shrek', undercover: 'Madagascar', dificuldade: 'leve', tags: ['animacao'] },
      { civis: 'Rei Leão', undercover: 'Tarzan', dificuldade: 'leve', tags: ['animacao', 'disney'] },
      { civis: 'Tropa de Elite', undercover: 'Cidade de Deus', dificuldade: 'leve', tags: ['brasil', 'cinema'] },
      // media
      { civis: 'Harry Potter', undercover: 'O Senhor dos Anéis', dificuldade: 'media', tags: ['fantasia', 'franchise'] },
      { civis: 'Matrix', undercover: 'Origem', dificuldade: 'media', tags: ['ficcao_cientifica'] },
      { civis: 'Star Wars', undercover: 'Star Trek', dificuldade: 'media', tags: ['ficcao_cientifica'] },
      { civis: 'Round 6', undercover: 'La Casa de Papel', dificuldade: 'media', tags: ['serie', 'suspense'] },
      { civis: 'Stranger Things', undercover: 'Dark', dificuldade: 'media', tags: ['serie', 'suspense'] },
      { civis: 'Friends', undercover: 'How I Met Your Mother', dificuldade: 'media', tags: ['serie', 'comedia'] },
      { civis: 'Coringa', undercover: 'Batman', dificuldade: 'media', tags: ['dc', 'heroi'] },
      { civis: 'Kung Fu Panda', undercover: 'Como Treinar Seu Dragão', dificuldade: 'media', tags: ['animacao'] },
      { civis: 'Diabo Veste Prada', undercover: 'Legalmente Loira', dificuldade: 'media', tags: ['drama', 'chick_flick'] },
      { civis: 'Forrest Gump', undercover: 'Náufrago', dificuldade: 'media', tags: ['drama', 'tom_hanks'] },
      // hard
      { civis: 'The Office', undercover: 'Brooklyn Nine-Nine', dificuldade: 'hard', tags: ['serie', 'comedia'] },
      { civis: 'La La Land', undercover: 'Whiplash', dificuldade: 'hard', tags: ['musical', 'drama'] },
      { civis: 'Pulp Fiction', undercover: 'Kill Bill', dificuldade: 'hard', tags: ['tarantino', 'cinema'] },
      { civis: 'Truman Show', undercover: 'Pleasantville', dificuldade: 'hard', tags: ['drama', 'ficcao'] },
      { civis: 'Wandinha', undercover: 'Sabrina', dificuldade: 'hard', tags: ['serie', 'fantasia'] },
      { civis: 'Sex Education', undercover: 'Heartstopper', dificuldade: 'hard', tags: ['serie', 'jovens'] },
      { civis: 'Vingadores', undercover: 'Liga da Justiça', dificuldade: 'hard', tags: ['heroi', 'blockbuster'] },
      { civis: 'Jurassic Park', undercover: 'King Kong', dificuldade: 'hard', tags: ['aventura', 'blockbuster'] },
      // insana
      { civis: 'Bridgerton', undercover: 'The Crown', dificuldade: 'insana', tags: ['serie', 'netflix', 'drama'] },
      { civis: 'Gladiador', undercover: 'Coração Valente', dificuldade: 'insana', tags: ['acao', 'historico'] },
      { civis: 'Pantera Negra', undercover: 'Capitão América', dificuldade: 'insana', tags: ['marvel', 'heroi'] },
      { civis: 'Encanto', undercover: 'Luca', dificuldade: 'insana', tags: ['animacao', 'pixar', 'disney'] },
      { civis: 'Homem-Aranha', undercover: 'Demolidor', dificuldade: 'insana', tags: ['marvel', 'heroi'] },
    ],
  },

  festas: {
    id: 'festas',
    nome: 'Festas',
    emoji: '🎉',
    descricao: 'Celebrações, rolês e comemorações brasileiras',
    palavras: [
      // leve
      { civis: 'Carnaval', undercover: 'São João', dificuldade: 'leve', tags: ['brasil', 'tradicional'] },
      { civis: 'Halloween', undercover: 'Festa à Fantasia', dificuldade: 'leve', tags: [] },
      { civis: 'Show', undercover: 'Festival de Música', dificuldade: 'leve', tags: ['musica'] },
      { civis: 'Churrasco', undercover: 'Luau', dificuldade: 'leve', tags: ['brasil', 'social'] },
      { civis: 'Chá de Bebê', undercover: 'Chá Revelação', dificuldade: 'leve', tags: ['familia'] },
      // media
      { civis: 'Formatura', undercover: 'Despedida de Solteiro', dificuldade: 'media', tags: ['social'] },
      { civis: 'Casamento', undercover: 'Noivado', dificuldade: 'media', tags: ['relacionamento'] },
      { civis: 'Réveillon', undercover: 'Aniversário', dificuldade: 'media', tags: ['celebracao'] },
      { civis: 'Rave', undercover: 'Balada', dificuldade: 'media', tags: ['noite', 'social'] },
      { civis: 'After Party', undercover: 'Esquenta', dificuldade: 'media', tags: ['noite', 'social', 'brasil'] },
      { civis: 'Open Bar', undercover: 'Open Food', dificuldade: 'media', tags: ['social'] },
      { civis: 'Festa de 15 Anos', undercover: 'Festa de 18 Anos', dificuldade: 'media', tags: ['familia'] },
      { civis: 'Confraternização de Empresa', undercover: 'Happy Hour', dificuldade: 'media', tags: ['trabalho', 'social'] },
      // hard
      { civis: 'Festa em Casa', undercover: 'Festa em Sítio', dificuldade: 'hard', tags: ['social'] },
      { civis: 'Bloquinho de Rua', undercover: 'Camarote', dificuldade: 'hard', tags: ['brasil', 'carnaval'] },
      { civis: 'Bingo', undercover: 'Karaokê', dificuldade: 'hard', tags: ['entretenimento'] },
      { civis: 'Festa Eletrônica', undercover: 'Festa Sertaneja', dificuldade: 'hard', tags: ['musica', 'social'] },
      { civis: 'Reveillon na Praia', undercover: 'Reveillon no Terraço', dificuldade: 'hard', tags: ['celebracao'] },
      { civis: 'Casamento na Praia', undercover: 'Casamento no Campo', dificuldade: 'hard', tags: ['celebracao', 'relacionamento'] },
      { civis: 'Festa do Pijama', undercover: 'Sleepover', dificuldade: 'hard', tags: ['jovens', 'social'] },
      // insana
      { civis: 'Amigo Secreto', undercover: 'Amigo da Onça', dificuldade: 'insana', tags: ['brasil', 'social'] },
      { civis: 'Festa Anos 80', undercover: 'Festa Anos 90', dificuldade: 'insana', tags: ['nostalgia'] },
      { civis: 'Batizado', undercover: 'Crisma', dificuldade: 'insana', tags: ['religiao', 'familia'] },
      { civis: 'Casamento Civil', undercover: 'Casamento Religioso', dificuldade: 'insana', tags: ['relacionamento'] },
      { civis: 'Coquetel', undercover: 'Recepção', dificuldade: 'insana', tags: ['social', 'formal'] },
    ],
  },

  bebidas: {
    id: 'bebidas',
    nome: 'Bebidas',
    emoji: '🍻',
    descricao: 'Bebidas geladas, quentes, alcoólicas e o clássico brasileiro',
    palavras: [
      // leve
      { civis: 'Caipirinha', undercover: 'Mojito', dificuldade: 'leve', tags: ['alcool', 'brasil'] },
      { civis: 'Cerveja', undercover: 'Chopp', dificuldade: 'leve', tags: ['alcool', 'brasil'] },
      { civis: 'Café', undercover: 'Cappuccino', dificuldade: 'leve', tags: ['cafe'] },
      { civis: 'Suco', undercover: 'Vitamina', dificuldade: 'leve', tags: [] },
      { civis: 'Chimarrão', undercover: 'Chá Verde', dificuldade: 'leve', tags: ['brasil', 'regional'] },
      { civis: 'Caldo de Cana', undercover: 'Água de Coco', dificuldade: 'leve', tags: ['brasil'] },
      // media
      { civis: 'Vinho', undercover: 'Champanhe', dificuldade: 'media', tags: ['alcool'] },
      { civis: 'Uísque', undercover: 'Bourbon', dificuldade: 'media', tags: ['alcool'] },
      { civis: 'Tequila', undercover: 'Mezcal', dificuldade: 'media', tags: ['alcool'] },
      { civis: 'Aperol Spritz', undercover: 'Hugo Spritz', dificuldade: 'media', tags: ['alcool', 'contemporaneo'] },
      { civis: 'Gin Tônica', undercover: 'Gin Fizz', dificuldade: 'media', tags: ['alcool'] },
      { civis: 'Caipiroska', undercover: 'Caipifruta', dificuldade: 'media', tags: ['alcool', 'brasil'] },
      { civis: 'Iced Coffee', undercover: 'Cold Brew', dificuldade: 'media', tags: ['cafe', 'contemporaneo'] },
      { civis: 'Smoothie', undercover: 'Suco Detox', dificuldade: 'media', tags: ['saudavel'] },
      { civis: 'Sake', undercover: 'Soju', dificuldade: 'media', tags: ['asiatico', 'alcool'] },
      // hard
      { civis: 'Espresso', undercover: 'Americano', dificuldade: 'hard', tags: ['cafe'] },
      { civis: 'Latte', undercover: 'Flat White', dificuldade: 'hard', tags: ['cafe', 'contemporaneo'] },
      { civis: 'Piña Colada', undercover: 'Daiquiri', dificuldade: 'hard', tags: ['alcool', 'tropical'] },
      { civis: 'Bloody Mary', undercover: 'Michelada', dificuldade: 'hard', tags: ['alcool'] },
      { civis: 'Cerveja Artesanal', undercover: 'Cerveja IPA', dificuldade: 'hard', tags: ['alcool', 'contemporaneo'] },
      { civis: 'Energético', undercover: 'Isotônico', dificuldade: 'hard', tags: [] },
      { civis: 'Quentão', undercover: 'Vinho Quente', dificuldade: 'hard', tags: ['brasil', 'junina'] },
      { civis: 'Rum', undercover: 'Cachaça', dificuldade: 'hard', tags: ['alcool'] },
      // insana
      { civis: 'Vodka', undercover: 'Gin', dificuldade: 'insana', tags: ['alcool'] },
      { civis: 'Cerveja Pilsen', undercover: 'Cerveja Lager', dificuldade: 'insana', tags: ['alcool'] },
      { civis: 'Champagne', undercover: 'Prosecco', dificuldade: 'insana', tags: ['alcool', 'celebracao'] },
      { civis: 'Agua', undercover: 'Água com Gás', dificuldade: 'insana', tags: [] },
      { civis: 'Refrigerante de Cola', undercover: 'Refrigerante de Limão', dificuldade: 'insana', tags: [] },
      { civis: 'Chá Preto', undercover: 'Chá Mate', dificuldade: 'insana', tags: [] },
    ],
  },

  celebridades: {
    id: 'celebridades',
    nome: 'Celebridades',
    emoji: '🌟',
    descricao: 'Famosos brasileiros e internacionais que todo mundo conhece',
    palavras: [
      // leve
      { civis: 'Anitta', undercover: 'Pabllo Vittar', dificuldade: 'leve', tags: ['brasil', 'musica', 'pop'] },
      { civis: 'Neymar', undercover: 'Vinicius Júnior', dificuldade: 'leve', tags: ['brasil', 'futebol'] },
      { civis: 'Xuxa', undercover: 'Angélica', dificuldade: 'leve', tags: ['brasil', 'tv'] },
      { civis: 'Beyoncé', undercover: 'Rihanna', dificuldade: 'leve', tags: ['musica', 'internacional'] },
      { civis: 'Cristiano Ronaldo', undercover: 'Lionel Messi', dificuldade: 'leve', tags: ['futebol', 'internacional'] },
      // media
      { civis: 'Taylor Swift', undercover: 'Ariana Grande', dificuldade: 'media', tags: ['musica', 'internacional'] },
      { civis: 'Whindersson Nunes', undercover: 'Felipe Neto', dificuldade: 'media', tags: ['brasil', 'youtube'] },
      { civis: 'Ivete Sangalo', undercover: 'Claudia Leitte', dificuldade: 'media', tags: ['brasil', 'axe', 'musica'] },
      { civis: 'Leonardo DiCaprio', undercover: 'Brad Pitt', dificuldade: 'media', tags: ['cinema', 'internacional'] },
      { civis: 'Ryan Reynolds', undercover: 'Chris Evans', dificuldade: 'media', tags: ['cinema', 'internacional'] },
      { civis: 'Kim Kardashian', undercover: 'Kylie Jenner', dificuldade: 'media', tags: ['influencer', 'internacional'] },
      { civis: 'Casimiro', undercover: 'Cellbit', dificuldade: 'media', tags: ['brasil', 'stream'] },
      { civis: 'Lady Gaga', undercover: 'Dua Lipa', dificuldade: 'media', tags: ['musica', 'internacional'] },
      { civis: 'Gretchen', undercover: 'Inês Brasil', dificuldade: 'media', tags: ['brasil', 'meme', 'tv'] },
      // hard
      { civis: 'Luan Santana', undercover: 'Gusttavo Lima', dificuldade: 'hard', tags: ['brasil', 'sertanejo'] },
      { civis: 'Pedro Pascal', undercover: 'Oscar Isaac', dificuldade: 'hard', tags: ['cinema', 'internacional'] },
      { civis: 'Drake', undercover: 'The Weeknd', dificuldade: 'hard', tags: ['musica', 'rap'] },
      { civis: 'Tata Werneck', undercover: 'Fátima Bernardes', dificuldade: 'hard', tags: ['brasil', 'tv'] },
      { civis: 'Boninho', undercover: 'Tadeu Schmidt', dificuldade: 'hard', tags: ['brasil', 'tv', 'bbb'] },
      { civis: 'Caetano Veloso', undercover: 'Gilberto Gil', dificuldade: 'hard', tags: ['brasil', 'mpb'] },
      // insana
      { civis: 'Pelé', undercover: 'Maradona', dificuldade: 'insana', tags: ['futebol', 'historia'] },
      { civis: 'Faustão', undercover: 'Silvio Santos', dificuldade: 'insana', tags: ['brasil', 'tv'] },
      { civis: 'Roberto Carlos', undercover: 'Erasmo Carlos', dificuldade: 'insana', tags: ['brasil', 'musica'] },
      { civis: 'Sabrina Carpenter', undercover: 'Olivia Rodrigo', dificuldade: 'insana', tags: ['musica', 'pop', 'genz'] },
      { civis: 'LeBron James', undercover: 'Stephen Curry', dificuldade: 'insana', tags: ['basquete', 'internacional'] },
    ],
  },

  musicas: {
    id: 'musicas',
    nome: 'Música',
    emoji: '🎵',
    descricao: 'Estilos musicais, artistas e cultura musical brasileira',
    palavras: [
      // leve
      { civis: 'Sertanejo', undercover: 'Pagode', dificuldade: 'leve', tags: ['brasil', 'popular'] },
      { civis: 'Funk Carioca', undercover: 'Funk Paulista', dificuldade: 'leve', tags: ['brasil', 'funk'] },
      { civis: 'Forró', undercover: 'Xote', dificuldade: 'leve', tags: ['brasil', 'nordeste'] },
      { civis: 'Rock', undercover: 'Metal', dificuldade: 'leve', tags: [] },
      { civis: 'Hip Hop', undercover: 'Trap', dificuldade: 'leve', tags: ['urbano'] },
      // media
      { civis: 'Bossa Nova', undercover: 'MPB', dificuldade: 'media', tags: ['brasil', 'classico'] },
      { civis: 'Samba', undercover: 'Pagode', dificuldade: 'media', tags: ['brasil'] },
      { civis: 'Eletrônica', undercover: 'House', dificuldade: 'media', tags: ['noite'] },
      { civis: 'K-Pop', undercover: 'J-Pop', dificuldade: 'media', tags: ['asia'] },
      { civis: 'R&B', undercover: 'Soul', dificuldade: 'media', tags: ['internacional'] },
      { civis: 'Axé', undercover: 'Pagode Baiano', dificuldade: 'media', tags: ['brasil', 'bahia'] },
      { civis: 'Brega Funk', undercover: 'Piseiro', dificuldade: 'media', tags: ['brasil', 'nordeste'] },
      { civis: 'Sertanejo Universitário', undercover: 'Sertanejo Raiz', dificuldade: 'media', tags: ['brasil'] },
      { civis: 'BTS', undercover: 'BLACKPINK', dificuldade: 'media', tags: ['kpop', 'asia'] },
      // hard
      { civis: 'Coldplay', undercover: 'U2', dificuldade: 'hard', tags: ['rock', 'internacional'] },
      { civis: 'Beatles', undercover: 'Rolling Stones', dificuldade: 'hard', tags: ['rock', 'classico'] },
      { civis: 'Skank', undercover: 'Jota Quest', dificuldade: 'hard', tags: ['brasil', 'rock', 'bh'] },
      { civis: 'Legião Urbana', undercover: 'Os Paralamas', dificuldade: 'hard', tags: ['brasil', 'rock'] },
      { civis: 'Luísa Sonza', undercover: 'Lexa', dificuldade: 'hard', tags: ['brasil', 'pop'] },
      { civis: 'Maroon 5', undercover: 'Imagine Dragons', dificuldade: 'hard', tags: ['pop_rock', 'internacional'] },
      { civis: 'Tim Maia', undercover: 'Jorge Ben Jor', dificuldade: 'hard', tags: ['brasil', 'mpb', 'classico'] },
      // insana
      { civis: 'Queen', undercover: 'Led Zeppelin', dificuldade: 'insana', tags: ['rock', 'classico'] },
      { civis: 'Jazz', undercover: 'Blues', dificuldade: 'insana', tags: ['internacional'] },
      { civis: 'Country', undercover: 'Folk', dificuldade: 'insana', tags: ['internacional'] },
      { civis: 'Reggae', undercover: 'Reggaeton', dificuldade: 'insana', tags: ['internacional'] },
      { civis: 'Djavan', undercover: 'Lulu Santos', dificuldade: 'insana', tags: ['brasil', 'mpb'] },
      { civis: 'Música Clássica', undercover: 'Música Erudita', dificuldade: 'insana', tags: ['classico'] },
    ],
  },

  memes: {
    id: 'memes',
    nome: 'Internet BR',
    emoji: '😂',
    descricao: 'Expressões, gírias e referências da internet brasileira contemporânea',
    palavras: [
      // leve
      { civis: 'Sextou', undercover: 'Sábado', dificuldade: 'leve', tags: ['gíria', 'brasil'] },
      { civis: 'Crush', undercover: 'Pessoa Especial', dificuldade: 'leve', tags: ['dating', 'genz'] },
      { civis: 'Slay', undercover: 'Arrasou', dificuldade: 'leve', tags: ['genz', 'internet'] },
      { civis: 'POV', undercover: 'Imagine', dificuldade: 'leve', tags: ['tiktok', 'genz'] },
      { civis: 'Print', undercover: 'Screenshot', dificuldade: 'leve', tags: ['internet'] },
      // media
      { civis: 'Cancelado', undercover: 'Cancelamento', dificuldade: 'media', tags: ['internet', 'politica'] },
      { civis: 'Trend do TikTok', undercover: 'Viral do Instagram', dificuldade: 'media', tags: ['tiktok', 'instagram'] },
      { civis: 'Story', undercover: 'Reels', dificuldade: 'media', tags: ['instagram'] },
      { civis: 'Stalker', undercover: 'Curioso', dificuldade: 'media', tags: ['internet', 'comportamento'] },
      { civis: 'Indireta', undercover: 'Subtweet', dificuldade: 'media', tags: ['internet', 'relacionamento'] },
      { civis: 'Exposição', undercover: 'Print vazado', dificuldade: 'media', tags: ['internet', 'caos_social'] },
      { civis: 'Thread', undercover: 'Tweet raiz', dificuldade: 'media', tags: ['twitter', 'internet'] },
      // hard
      { civis: 'Mute', undercover: 'Unfollow', dificuldade: 'hard', tags: ['internet', 'relacionamento'] },
      { civis: 'Block', undercover: 'Mute', dificuldade: 'hard', tags: ['internet', 'relacionamento'] },
      { civis: 'Lacrou', undercover: 'Deu um show', dificuldade: 'hard', tags: ['genz', 'internet'] },
      { civis: 'Viralizar', undercover: 'Trending', dificuldade: 'hard', tags: ['internet'] },
      { civis: 'Cringe', undercover: 'Brega', dificuldade: 'hard', tags: ['genz', 'internet'] },
      { civis: 'Red Flag', undercover: 'Ick', dificuldade: 'hard', tags: ['dating', 'genz', 'internet'] },
      { civis: 'NPC', undercover: 'Robô', dificuldade: 'hard', tags: ['genz', 'internet'] },
      // insana
      { civis: 'KKKKKK', undercover: 'HAHAHA', dificuldade: 'insana', tags: ['gíria', 'internet'] },
      { civis: 'Tô morto', undercover: 'Tô morrendo', dificuldade: 'insana', tags: ['gíria'] },
      { civis: 'Surreal', undercover: 'Inacreditável', dificuldade: 'insana', tags: ['gíria'] },
      { civis: 'Tô passada', undercover: 'Tô chocada', dificuldade: 'insana', tags: ['gíria'] },
      { civis: 'Não vou mentir', undercover: 'Pra ser sincero', dificuldade: 'insana', tags: ['gíria'] },
      { civis: 'Aff', undercover: 'Eita', dificuldade: 'insana', tags: ['gíria', 'brasil'] },
    ],
  },

  profissoes: {
    id: 'profissoes',
    nome: 'Profissões',
    emoji: '👔',
    descricao: 'Profissões clássicas e as do mercado contemporâneo',
    palavras: [
      // leve
      { civis: 'Médico', undercover: 'Dentista', dificuldade: 'leve', tags: ['saude'] },
      { civis: 'Bombeiro', undercover: 'Policial', dificuldade: 'leve', tags: ['servico_publico'] },
      { civis: 'Professor', undercover: 'Tutor', dificuldade: 'leve', tags: ['educacao'] },
      { civis: 'Piloto', undercover: 'Comissário de Voo', dificuldade: 'leve', tags: ['aviacao'] },
      { civis: 'Fotógrafo', undercover: 'Cinegrafista', dificuldade: 'leve', tags: ['criativo'] },
      // media
      { civis: 'Programador', undercover: 'Designer', dificuldade: 'media', tags: ['tech', 'criativo'] },
      { civis: 'Jornalista', undercover: 'Escritor', dificuldade: 'media', tags: ['criativo'] },
      { civis: 'Psicólogo', undercover: 'Psiquiatra', dificuldade: 'media', tags: ['saude', 'mental'] },
      { civis: 'Garçom', undercover: 'Barista', dificuldade: 'media', tags: ['servico'] },
      { civis: 'Influencer', undercover: 'Youtuber', dificuldade: 'media', tags: ['internet', 'contemporaneo'] },
      { civis: 'Chef de Cozinha', undercover: 'Confeiteiro', dificuldade: 'media', tags: ['gastronomia'] },
      { civis: 'Advogado', undercover: 'Juiz', dificuldade: 'media', tags: ['juridico'] },
      { civis: 'Engenheiro', undercover: 'Arquiteto', dificuldade: 'media', tags: [] },
      // hard
      { civis: 'Personal Trainer', undercover: 'Coach', dificuldade: 'hard', tags: ['fitness', 'trabalho', 'contemporaneo'] },
      { civis: 'Nutricionista', undercover: 'Personal Trainer', dificuldade: 'hard', tags: ['saude', 'fitness'] },
      { civis: 'Vendedor', undercover: 'Representante Comercial', dificuldade: 'hard', tags: ['trabalho'] },
      { civis: 'UX Designer', undercover: 'UI Designer', dificuldade: 'hard', tags: ['tech', 'criativo'] },
      { civis: 'Content Creator', undercover: 'Social Media', dificuldade: 'hard', tags: ['internet', 'trabalho'] },
      { civis: 'Corretor de Imóveis', undercover: 'Gerente de Banco', dificuldade: 'hard', tags: ['trabalho'] },
      { civis: 'Estilista', undercover: 'Personal Stylist', dificuldade: 'hard', tags: ['moda', 'contemporaneo'] },
      // insana
      { civis: 'Coach', undercover: 'Mentor', dificuldade: 'insana', tags: ['trabalho', 'contemporaneo'] },
      { civis: 'Empreendedor', undercover: 'Freelancer', dificuldade: 'insana', tags: ['trabalho', 'contemporaneo'] },
      { civis: 'Analista', undercover: 'Consultor', dificuldade: 'insana', tags: ['trabalho'] },
      { civis: 'Gestor', undercover: 'Líder', dificuldade: 'insana', tags: ['trabalho'] },
      { civis: 'Motorista de Uber', undercover: 'Entregador de iFood', dificuldade: 'insana', tags: ['gig_economy', 'brasil'] },
    ],
  },

  objetos: {
    id: 'objetos',
    nome: 'Objetos',
    emoji: '📱',
    descricao: 'Objetos do cotidiano — do básico ao contemporâneo',
    palavras: [
      // leve
      { civis: 'Celular', undercover: 'Tablet', dificuldade: 'leve', tags: ['tech'] },
      { civis: 'Computador', undercover: 'Notebook', dificuldade: 'leve', tags: ['tech'] },
      { civis: 'Guarda-chuva', undercover: 'Sombrinha', dificuldade: 'leve', tags: [] },
      { civis: 'Mochila', undercover: 'Bolsa', dificuldade: 'leve', tags: [] },
      { civis: 'Fone de Ouvido', undercover: 'Caixa de Som', dificuldade: 'leve', tags: ['tech'] },
      // media
      { civis: 'Relógio', undercover: 'Smartwatch', dificuldade: 'media', tags: ['tech'] },
      { civis: 'Câmera', undercover: 'GoPro', dificuldade: 'media', tags: ['tech', 'foto'] },
      { civis: 'Sofá', undercover: 'Poltrona', dificuldade: 'media', tags: [] },
      { civis: 'Geladeira', undercover: 'Freezer', dificuldade: 'media', tags: [] },
      { civis: 'Carregador', undercover: 'Power Bank', dificuldade: 'media', tags: ['tech'] },
      { civis: 'Caderno', undercover: 'Agenda', dificuldade: 'media', tags: [] },
      { civis: 'Panela', undercover: 'Frigideira', dificuldade: 'media', tags: [] },
      { civis: 'Espelho', undercover: 'Câmera Frontal', dificuldade: 'media', tags: ['contemporaneo'] },
      // hard
      { civis: 'Carteira', undercover: 'Necessaire', dificuldade: 'hard', tags: [] },
      { civis: 'Toalha', undercover: 'Roupão', dificuldade: 'hard', tags: [] },
      { civis: 'Óculos', undercover: 'Lentes de Contato', dificuldade: 'hard', tags: [] },
      { civis: 'Televisão', undercover: 'Projetor', dificuldade: 'hard', tags: ['tech'] },
      { civis: 'Escrivaninha', undercover: 'Mesa de Jantar', dificuldade: 'hard', tags: [] },
      { civis: 'Airpods', undercover: 'Fone de Ouvido Bluetooth', dificuldade: 'hard', tags: ['tech', 'contemporaneo'] },
      { civis: 'Cobertor', undercover: 'Edredom', dificuldade: 'hard', tags: [] },
      // insana
      { civis: 'Copo', undercover: 'Caneca', dificuldade: 'insana', tags: [] },
      { civis: 'Caneta', undercover: 'Lápis', dificuldade: 'insana', tags: [] },
      { civis: 'Livro', undercover: 'Revista', dificuldade: 'insana', tags: [] },
      { civis: 'Prato', undercover: 'Tigela', dificuldade: 'insana', tags: [] },
      { civis: 'Sabonete', undercover: 'Gel de Banho', dificuldade: 'insana', tags: [] },
      { civis: 'Cama', undercover: 'Sofá-cama', dificuldade: 'insana', tags: [] },
    ],
  },

  sentimentos: {
    id: 'sentimentos',
    nome: 'Sentimentos',
    emoji: '💭',
    descricao: 'Emoções, estados de espírito e nuances psicológicas',
    palavras: [
      // leve
      { civis: 'Alegria', undercover: 'Animação', dificuldade: 'leve', tags: ['emocao'] },
      { civis: 'Medo', undercover: 'Pavor', dificuldade: 'leve', tags: ['emocao'] },
      { civis: 'Raiva', undercover: 'Indignação', dificuldade: 'leve', tags: ['emocao'] },
      { civis: 'Surpresa', undercover: 'Susto', dificuldade: 'leve', tags: ['emocao'] },
      { civis: 'Tristeza', undercover: 'Angústia', dificuldade: 'leve', tags: ['emocao'] },
      // media
      { civis: 'Saudade', undercover: 'Nostalgia', dificuldade: 'media', tags: ['brasil', 'emocao'] },
      { civis: 'Ciúme', undercover: 'Inveja', dificuldade: 'media', tags: ['social', 'relacionamento'] },
      { civis: 'Esperança', undercover: 'Fé', dificuldade: 'media', tags: ['emocao'] },
      { civis: 'Orgulho', undercover: 'Vaidade', dificuldade: 'media', tags: ['emocao'] },
      { civis: 'Tédio', undercover: 'Apatia', dificuldade: 'media', tags: ['emocao'] },
      { civis: 'Solidão', undercover: 'Isolamento', dificuldade: 'media', tags: ['saude_mental'] },
      { civis: 'Frustração', undercover: 'Decepção', dificuldade: 'media', tags: ['emocao'] },
      { civis: 'Curiosidade', undercover: 'Interesse', dificuldade: 'media', tags: ['emocao'] },
      { civis: 'Empolgação', undercover: 'Euforia', dificuldade: 'media', tags: ['emocao'] },
      // hard
      { civis: 'Amor', undercover: 'Carinho', dificuldade: 'hard', tags: ['relacionamento', 'emocao'] },
      { civis: 'Ansiedade', undercover: 'Nervosismo', dificuldade: 'hard', tags: ['saude_mental'] },
      { civis: 'Empatia', undercover: 'Simpatia', dificuldade: 'hard', tags: ['social'] },
      { civis: 'Vergonha', undercover: 'Constrangimento', dificuldade: 'hard', tags: ['social', 'emocao'] },
      { civis: 'Coragem', undercover: 'Impulsividade', dificuldade: 'hard', tags: ['emocao'] },
      { civis: 'Gratidão', undercover: 'Alívio', dificuldade: 'hard', tags: ['emocao'] },
      { civis: 'Desprezo', undercover: 'Indiferença', dificuldade: 'hard', tags: ['social', 'emocao'] },
      { civis: 'Paixão', undercover: 'Obsessão', dificuldade: 'hard', tags: ['relacionamento', 'emocao'] },
      { civis: 'Calma', undercover: 'Frieza', dificuldade: 'hard', tags: ['emocao'] },
      // insana
      { civis: 'Amor', undercover: 'Costume', dificuldade: 'insana', tags: ['relacionamento', 'psicologia'] },
      { civis: 'Confiança', undercover: 'Autoestima', dificuldade: 'insana', tags: ['psicologia'] },
      { civis: 'Insegurança', undercover: 'Humildade', dificuldade: 'insana', tags: ['psicologia'] },
      { civis: 'Felicidade', undercover: 'Satisfação', dificuldade: 'insana', tags: ['emocao'] },
      { civis: 'Realização', undercover: 'Plenitude', dificuldade: 'insana', tags: ['emocao'] },
      { civis: 'Inveja', undercover: 'Admiração', dificuldade: 'insana', tags: ['social'] },
      { civis: 'Apego', undercover: 'Amor', dificuldade: 'insana', tags: ['relacionamento', 'psicologia'] },
      { civis: 'Compaixão', undercover: 'Pena', dificuldade: 'insana', tags: ['social', 'emocao'] },
    ],
  },

  aplicativos: {
    id: 'aplicativos',
    nome: 'Aplicativos',
    emoji: '📲',
    descricao: 'Apps e redes sociais que todo mundo tem no celular',
    palavras: [
      // leve
      { civis: 'Instagram', undercover: 'TikTok', dificuldade: 'leve', tags: ['social_media'] },
      { civis: 'WhatsApp', undercover: 'Telegram', dificuldade: 'leve', tags: ['mensagens'] },
      { civis: 'Spotify', undercover: 'Deezer', dificuldade: 'leve', tags: ['musica', 'streaming'] },
      { civis: 'Netflix', undercover: 'Disney+', dificuldade: 'leve', tags: ['streaming'] },
      { civis: 'iFood', undercover: 'Rappi', dificuldade: 'leve', tags: ['brasil', 'delivery'] },
      { civis: 'Uber', undercover: '99', dificuldade: 'leve', tags: ['brasil', 'transporte'] },
      // media
      { civis: 'Tinder', undercover: 'Bumble', dificuldade: 'media', tags: ['dating', 'brasil'] },
      { civis: 'YouTube', undercover: 'Twitch', dificuldade: 'media', tags: ['video', 'stream'] },
      { civis: 'Nubank', undercover: 'Inter', dificuldade: 'media', tags: ['fintech', 'brasil'] },
      { civis: 'Mercado Livre', undercover: 'Shopee', dificuldade: 'media', tags: ['ecommerce', 'brasil'] },
      { civis: 'Google Maps', undercover: 'Waze', dificuldade: 'media', tags: ['navegacao'] },
      { civis: 'LinkedIn', undercover: 'Glassdoor', dificuldade: 'media', tags: ['trabalho', 'brasil'] },
      { civis: 'Zoom', undercover: 'Google Meet', dificuldade: 'media', tags: ['trabalho'] },
      { civis: 'Duolingo', undercover: 'Babbel', dificuldade: 'media', tags: ['educacao'] },
      // hard
      { civis: 'Facebook', undercover: 'Twitter', dificuldade: 'hard', tags: ['social_media'] },
      { civis: 'Notion', undercover: 'Trello', dificuldade: 'hard', tags: ['produtividade'] },
      { civis: 'Discord', undercover: 'Slack', dificuldade: 'hard', tags: ['comunicacao', 'tech'] },
      { civis: 'Snapchat', undercover: 'BeReal', dificuldade: 'hard', tags: ['social_media', 'genz'] },
      { civis: 'PicPay', undercover: 'Mercado Pago', dificuldade: 'hard', tags: ['fintech', 'brasil'] },
      { civis: 'Strava', undercover: 'Nike Run Club', dificuldade: 'hard', tags: ['fitness'] },
      // insana
      { civis: 'Threads', undercover: 'Twitter', dificuldade: 'insana', tags: ['social_media', 'contemporaneo'] },
      { civis: 'Canva', undercover: 'Figma', dificuldade: 'insana', tags: ['design', 'criativo'] },
      { civis: 'Google Drive', undercover: 'Dropbox', dificuldade: 'insana', tags: ['produtividade'] },
      { civis: 'Prime Video', undercover: 'Globoplay', dificuldade: 'insana', tags: ['streaming'] },
      { civis: 'Airbnb', undercover: 'Booking', dificuldade: 'insana', tags: ['viagem'] },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // CATEGORIAS PREMIUM — novas, contemporâneas, brasileiras
  // ─────────────────────────────────────────────────────────────
  relacionamentos: {
    id: 'relacionamentos',
    nome: 'Relacionamentos',
    emoji: '💔',
    descricao: 'Dinâmicas afetivas, vínculos e o caos entre pessoas',
    palavras: [
      // leve
      { civis: 'Namoro', undercover: 'Ficada', dificuldade: 'leve', tags: ['relacionamento', 'brasil'] },
      { civis: 'Crush', undercover: 'Paquera', dificuldade: 'leve', tags: ['relacionamento', 'dating'] },
      { civis: 'Briga', undercover: 'Discussão', dificuldade: 'leve', tags: ['relacionamento'] },
      { civis: 'Pedido de Namoro', undercover: 'Assumir', dificuldade: 'leve', tags: ['relacionamento', 'brasil'] },
      { civis: 'Noivado', undercover: 'Namoro Sério', dificuldade: 'leve', tags: ['relacionamento'] },
      // media
      { civis: 'Paixão', undercover: 'Atração', dificuldade: 'media', tags: ['relacionamento'] },
      { civis: 'Amizade Colorida', undercover: 'Ficante', dificuldade: 'media', tags: ['relacionamento', 'brasil'] },
      { civis: 'Reconciliação', undercover: 'Recaída', dificuldade: 'media', tags: ['relacionamento'] },
      { civis: 'Triângulo Amoroso', undercover: 'Affair', dificuldade: 'media', tags: ['relacionamento', 'caos_social'] },
      { civis: 'Beijo', undercover: 'Selinho', dificuldade: 'media', tags: ['relacionamento', 'caos_social'] },
      { civis: 'Relacionamento Aberto', undercover: 'Poliamor', dificuldade: 'media', tags: ['relacionamento'] },
      { civis: 'Lua de Mel', undercover: 'Viagem a Dois', dificuldade: 'media', tags: ['relacionamento'] },
      // hard
      { civis: 'Término', undercover: 'Pausa', dificuldade: 'hard', tags: ['relacionamento'] },
      { civis: 'Traição', undercover: 'Vacilo', dificuldade: 'hard', tags: ['relacionamento', 'caos_social'] },
      { civis: 'Ciúme', undercover: 'Possessividade', dificuldade: 'hard', tags: ['relacionamento', 'psicologia'] },
      { civis: 'Red Flag', undercover: 'Ick', dificuldade: 'hard', tags: ['relacionamento', 'dating', 'genz'] },
      { civis: 'Parceria', undercover: 'Amizade Profunda', dificuldade: 'hard', tags: ['relacionamento'] },
      { civis: 'Término por Mensagem', undercover: 'Ghosting', dificuldade: 'hard', tags: ['relacionamento', 'dating'] },
      { civis: 'Saudade', undercover: 'Recaída', dificuldade: 'hard', tags: ['relacionamento', 'emocao'] },
      { civis: 'Relacionamento Tóxico', undercover: 'Relacionamento Intenso', dificuldade: 'hard', tags: ['relacionamento', 'psicologia'] },
      { civis: 'Ciúme Retroativo', undercover: 'Ciúme Comum', dificuldade: 'hard', tags: ['relacionamento', 'psicologia'] },
      { civis: 'Traição Emocional', undercover: 'Traição Física', dificuldade: 'hard', tags: ['relacionamento'] },
      // insana
      { civis: 'Amor', undercover: 'Costume', dificuldade: 'insana', tags: ['relacionamento', 'psicologia'] },
      { civis: 'Apego', undercover: 'Amor', dificuldade: 'insana', tags: ['relacionamento', 'psicologia'] },
      { civis: 'Ex', undercover: 'Pessoa do Passado', dificuldade: 'insana', tags: ['relacionamento'] },
      { civis: 'Recaída', undercover: 'Segunda Chance', dificuldade: 'insana', tags: ['relacionamento'] },
      { civis: 'Stalker', undercover: 'Curioso sobre o Ex', dificuldade: 'insana', tags: ['relacionamento', 'internet'] },
      { civis: 'Gostar', undercover: 'Amar', dificuldade: 'insana', tags: ['relacionamento', 'emocao'] },
      { civis: 'Parceria', undercover: 'Relacionamento', dificuldade: 'insana', tags: ['relacionamento'] },
    ],
  },

  dating: {
    id: 'dating',
    nome: 'Dating & Apps',
    emoji: '🔥',
    descricao: 'Cultura de dating, apps de relacionamento e comportamentos modernos',
    palavras: [
      // leve
      { civis: 'Match', undercover: 'Like', dificuldade: 'leve', tags: ['dating', 'app'] },
      { civis: 'Date', undercover: 'Rolê', dificuldade: 'leve', tags: ['dating', 'brasil'] },
      { civis: 'Swipe', undercover: 'Curtida', dificuldade: 'leve', tags: ['dating', 'app'] },
      { civis: 'Tinder', undercover: 'Bumble', dificuldade: 'leve', tags: ['dating', 'app'] },
      // media
      { civis: 'Ghosting', undercover: 'Sumiço', dificuldade: 'media', tags: ['dating', 'comportamento'] },
      { civis: 'Soft Launch', undercover: 'Assumir', dificuldade: 'media', tags: ['dating', 'instagram'] },
      { civis: 'Red Flag', undercover: 'Ick', dificuldade: 'media', tags: ['dating', 'genz'] },
      { civis: 'Date Gourmet', undercover: 'Jantar Romântico', dificuldade: 'media', tags: ['dating', 'brasil'] },
      { civis: 'Perfil Falso', undercover: 'Catfish', dificuldade: 'media', tags: ['dating', 'internet'] },
      { civis: 'Breadcrumbing', undercover: 'Enrolação', dificuldade: 'media', tags: ['dating', 'comportamento'] },
      { civis: 'Close Friends', undercover: 'Story Privado', dificuldade: 'media', tags: ['dating', 'instagram'] },
      // hard
      { civis: 'Ghosting', undercover: 'Slow Fade', dificuldade: 'hard', tags: ['dating', 'comportamento', 'genz'] },
      { civis: 'Situacionship', undercover: 'Ficante', dificuldade: 'hard', tags: ['dating', 'genz'] },
      { civis: 'Benching', undercover: 'Segunda Opção', dificuldade: 'hard', tags: ['dating', 'comportamento'] },
      { civis: 'Love Bombing', undercover: 'Muito Atencioso', dificuldade: 'hard', tags: ['dating', 'psicologia'] },
      { civis: 'Rizz', undercover: 'Chame', dificuldade: 'hard', tags: ['dating', 'genz'] },
      { civis: 'Ex nas Recomendações', undercover: 'Ex na Timeline', dificuldade: 'hard', tags: ['dating', 'internet'] },
      { civis: 'Submarining', undercover: 'Ressurgido', dificuldade: 'hard', tags: ['dating', 'comportamento'] },
      // insana
      { civis: 'Slow Fade', undercover: 'Desaparecimento', dificuldade: 'insana', tags: ['dating', 'comportamento'] },
      { civis: 'DTR', undercover: 'Conversa Difícil', dificuldade: 'insana', tags: ['dating'] },
      { civis: 'Talking Stage', undercover: 'Ficante', dificuldade: 'insana', tags: ['dating', 'genz'] },
      { civis: 'Situacionship', undercover: 'Namoro Não Oficial', dificuldade: 'insana', tags: ['dating', 'genz'] },
      { civis: 'Cuffing Season', undercover: 'Inverno com Alguém', dificuldade: 'insana', tags: ['dating', 'comportamento'] },
    ],
  },

  vida_adulta: {
    id: 'vida_adulta',
    nome: 'Vida Adulta',
    emoji: '😮‍💨',
    descricao: 'A realidade brutal de crescer: trabalho, dinheiro e CLT',
    palavras: [
      // leve
      { civis: 'PIX', undercover: 'Transferência', dificuldade: 'leve', tags: ['brasil', 'dinheiro'] },
      { civis: 'Aluguel', undercover: 'Financiamento', dificuldade: 'leve', tags: ['vida_adulta'] },
      { civis: 'Imposto de Renda', undercover: 'Declaração', dificuldade: 'leve', tags: ['brasil', 'vida_adulta'] },
      { civis: 'Reunião', undercover: 'Call', dificuldade: 'leve', tags: ['trabalho', 'brasil'] },
      { civis: 'Home Office', undercover: 'Trabalho Remoto', dificuldade: 'leve', tags: ['trabalho'] },
      // media
      { civis: 'CLT', undercover: 'PJ', dificuldade: 'media', tags: ['brasil', 'trabalho'] },
      { civis: 'Uber Cancelando', undercover: 'Motorista Sumido', dificuldade: 'media', tags: ['brasil', 'caos_social'] },
      { civis: 'Conta de Luz', undercover: 'Boleto', dificuldade: 'media', tags: ['brasil', 'vida_adulta'] },
      { civis: 'Networking', undercover: 'Papo Furado', dificuldade: 'media', tags: ['trabalho', 'caos_social'] },
      { civis: 'LinkedIn', undercover: 'Perfil Profissional', dificuldade: 'media', tags: ['trabalho', 'brasil'] },
      { civis: 'SmartFit', undercover: 'Academia', dificuldade: 'media', tags: ['brasil', 'fitness'] },
      { civis: 'Promoção', undercover: 'Aumento', dificuldade: 'media', tags: ['trabalho'] },
      // hard
      { civis: 'Burnout', undercover: 'Esgotamento', dificuldade: 'hard', tags: ['saude_mental', 'trabalho'] },
      { civis: 'Resiliência', undercover: 'Sofrimento', dificuldade: 'hard', tags: ['trabalho', 'psicologia'] },
      { civis: 'Proatividade', undercover: 'Workaholism', dificuldade: 'hard', tags: ['trabalho'] },
      { civis: 'Terapia', undercover: 'Coach', dificuldade: 'hard', tags: ['saude_mental', 'contemporaneo', 'brasil'] },
      { civis: 'Demissão', undercover: 'Pedido de Demissão', dificuldade: 'hard', tags: ['trabalho'] },
      { civis: 'Meta Batida', undercover: 'Sorte', dificuldade: 'hard', tags: ['trabalho', 'caos_social'] },
      { civis: 'Churrasco de Firma', undercover: 'Happy Hour', dificuldade: 'hard', tags: ['trabalho', 'brasil'] },
      { civis: 'Feedback', undercover: 'Crítica', dificuldade: 'hard', tags: ['trabalho'] },
      // insana
      { civis: 'Burnout', undercover: 'Ansiedade', dificuldade: 'insana', tags: ['saude_mental'] },
      { civis: 'Ambição', undercover: 'Ganância', dificuldade: 'insana', tags: ['trabalho', 'psicologia'] },
      { civis: 'Salário', undercover: 'Renda', dificuldade: 'insana', tags: ['trabalho', 'dinheiro'] },
      { civis: 'Produtividade', undercover: 'Eficiência', dificuldade: 'insana', tags: ['trabalho'] },
      { civis: 'Férias', undercover: 'Licença', dificuldade: 'insana', tags: ['trabalho'] },
      { civis: 'Investimento', undercover: 'Poupança', dificuldade: 'insana', tags: ['dinheiro'] },
    ],
  },

  internet: {
    id: 'internet',
    nome: 'Cultura Internet',
    emoji: '🌐',
    descricao: 'Comportamentos, vícios e referências da geração online',
    palavras: [
      // leve
      { civis: 'Story Indireta', undercover: 'Post Indireto', dificuldade: 'leve', tags: ['instagram', 'social'] },
      { civis: 'Print', undercover: 'Captura de Tela', dificuldade: 'leve', tags: ['internet'] },
      { civis: 'Live', undercover: 'Podcast', dificuldade: 'leve', tags: ['internet', 'conteudo'] },
      { civis: 'Viral', undercover: 'Trending', dificuldade: 'leve', tags: ['internet'] },
      { civis: 'Clique', undercover: 'Acesso', dificuldade: 'leve', tags: ['internet'] },
      // media
      { civis: 'Cancelar', undercover: 'Bloquear', dificuldade: 'media', tags: ['internet', 'social'] },
      { civis: 'Mute', undercover: 'Unfollow', dificuldade: 'media', tags: ['internet', 'social'] },
      { civis: 'Feed Curado', undercover: 'Bolha', dificuldade: 'media', tags: ['internet', 'comportamento'] },
      { civis: 'Engajamento', undercover: 'Alcance', dificuldade: 'media', tags: ['internet', 'criacao'] },
      { civis: 'Clickbait', undercover: 'Manchete Sensacionalista', dificuldade: 'media', tags: ['internet', 'midia'] },
      { civis: 'Doomscrolling', undercover: 'Vício em Celular', dificuldade: 'media', tags: ['internet', 'comportamento'] },
      { civis: 'FOMO', undercover: 'Ansiedade Social', dificuldade: 'media', tags: ['internet', 'psicologia'] },
      // hard
      { civis: 'Influencer', undercover: 'Criador de Conteúdo', dificuldade: 'hard', tags: ['internet', 'trabalho'] },
      { civis: 'Cancelamento', undercover: 'Polêmica', dificuldade: 'hard', tags: ['internet', 'social'] },
      { civis: 'Exposição', undercover: 'Print Vazado', dificuldade: 'hard', tags: ['internet', 'caos_social'] },
      { civis: 'Troll', undercover: 'Hater', dificuldade: 'hard', tags: ['internet', 'comportamento'] },
      { civis: 'Algoritmo', undercover: 'Curadoria', dificuldade: 'hard', tags: ['internet', 'tech'] },
      { civis: 'Phubbing', undercover: 'Ignorar no Celular', dificuldade: 'hard', tags: ['internet', 'comportamento', 'social'] },
      // insana
      { civis: 'Desinformação', undercover: 'Fake News', dificuldade: 'insana', tags: ['internet', 'midia'] },
      { civis: 'Lurker', undercover: 'Stalker', dificuldade: 'insana', tags: ['internet', 'comportamento'] },
      { civis: 'Repost', undercover: 'Compartilhar', dificuldade: 'insana', tags: ['internet'] },
      { civis: 'Notificação', undercover: 'Alerta', dificuldade: 'insana', tags: ['tech'] },
      { civis: 'Username', undercover: 'Apelido', dificuldade: 'insana', tags: ['internet'] },
    ],
  },

  caos_social: {
    id: 'caos_social',
    nome: 'Caos Social',
    emoji: '🌪️',
    descricao: 'Situações ambíguas, constrangedoras e socialmente explosivas',
    palavras: [
      // leve
      { civis: 'Fofoca', undercover: 'Comentário', dificuldade: 'leve', tags: ['social', 'comportamento'] },
      { civis: 'Saiu Cedo da Festa', undercover: 'Não Quis Ir', dificuldade: 'leve', tags: ['social'] },
      { civis: 'Esqueceu de Responder', undercover: 'Deixou no Visto', dificuldade: 'leve', tags: ['social', 'internet'] },
      // media
      { civis: 'Deu em Cima', undercover: 'Foi Simpático', dificuldade: 'media', tags: ['caos_social', 'social'] },
      { civis: 'Indireta', undercover: 'Comentário Inocente', dificuldade: 'media', tags: ['caos_social', 'social'] },
      { civis: 'Briga de Grupo', undercover: 'Mal Entendido', dificuldade: 'media', tags: ['social', 'caos_social'] },
      { civis: 'Mentira Branca', undercover: 'Omissão', dificuldade: 'media', tags: ['comportamento'] },
      { civis: 'Reclamar', undercover: 'Desabafar', dificuldade: 'media', tags: ['social'] },
      { civis: 'Falta de Limites', undercover: 'Generosidade', dificuldade: 'media', tags: ['psicologia', 'social'] },
      // hard
      { civis: 'Bêbado', undercover: 'Eufórico', dificuldade: 'hard', tags: ['social', 'festa'] },
      { civis: 'Estava Flertando', undercover: 'Era Educado', dificuldade: 'hard', tags: ['caos_social', 'social'] },
      { civis: 'Inveja', undercover: 'Inspiração', dificuldade: 'hard', tags: ['psicologia', 'social'] },
      { civis: 'Encrenqueiro', undercover: 'Honesto', dificuldade: 'hard', tags: ['social', 'caos_social'] },
      { civis: 'Chato', undercover: 'Detalhista', dificuldade: 'hard', tags: ['social', 'comportamento'] },
      { civis: 'Prepotência', undercover: 'Autoconfiança', dificuldade: 'hard', tags: ['psicologia', 'caos_social'] },
      { civis: 'Ignorou na Rua', undercover: 'Não Viu', dificuldade: 'hard', tags: ['caos_social'] },
      // insana
      { civis: 'Ciúme', undercover: 'Cuidado', dificuldade: 'insana', tags: ['relacionamento', 'caos_social'] },
      { civis: 'Gritar', undercover: 'Falar Alto', dificuldade: 'insana', tags: ['caos_social'] },
      { civis: 'Mentira', undercover: 'Versão Adaptada', dificuldade: 'insana', tags: ['comportamento'] },
      { civis: 'Pegou No Flagra', undercover: 'Coincidência', dificuldade: 'insana', tags: ['caos_social'] },
      { civis: 'Intimidade', undercover: 'Invasão de Privacidade', dificuldade: 'insana', tags: ['social', 'relacionamento'] },
    ],
  },

  psicologia_social: {
    id: 'psicologia_social',
    nome: 'Psicologia Social',
    emoji: '🧠',
    descricao: 'Conceitos psicológicos que o grupo usa (e confunde) no dia a dia',
    palavras: [
      // leve
      { civis: 'Ansiedade', undercover: 'Preocupação', dificuldade: 'leve', tags: ['saude_mental'] },
      { civis: 'Depressão', undercover: 'Tristeza Profunda', dificuldade: 'leve', tags: ['saude_mental'] },
      { civis: 'Terapia', undercover: 'Consulta', dificuldade: 'leve', tags: ['saude_mental', 'brasil'] },
      // media
      { civis: 'Trauma', undercover: 'Experiência Ruim', dificuldade: 'media', tags: ['psicologia', 'saude_mental'] },
      { civis: 'Projeção', undercover: 'Suposição', dificuldade: 'media', tags: ['psicologia'] },
      { civis: 'Negação', undercover: 'Otimismo', dificuldade: 'media', tags: ['psicologia'] },
      { civis: 'Overthinking', undercover: 'Preocupação', dificuldade: 'media', tags: ['saude_mental', 'genz'] },
      { civis: 'Ansiedade Social', undercover: 'Timidez', dificuldade: 'media', tags: ['saude_mental', 'social'] },
      { civis: 'Apego Ansioso', undercover: 'Apego Seguro', dificuldade: 'media', tags: ['psicologia', 'relacionamento'] },
      { civis: 'Burnout', undercover: 'Cansaço', dificuldade: 'media', tags: ['saude_mental', 'trabalho'] },
      // hard
      { civis: 'Gaslighting', undercover: 'Manipulação', dificuldade: 'hard', tags: ['psicologia', 'relacionamento'] },
      { civis: 'Narcisismo', undercover: 'Autoconfiança', dificuldade: 'hard', tags: ['psicologia'] },
      { civis: 'Limite', undercover: 'Frieza', dificuldade: 'hard', tags: ['psicologia', 'relacionamento'] },
      { civis: 'Dependência Emocional', undercover: 'Apego', dificuldade: 'hard', tags: ['psicologia', 'relacionamento'] },
      { civis: 'Introversão', undercover: 'Antissocial', dificuldade: 'hard', tags: ['psicologia'] },
      { civis: 'Overthinking', undercover: 'Paranoia', dificuldade: 'hard', tags: ['saude_mental'] },
      { civis: 'Manipulação', undercover: 'Persuasão', dificuldade: 'hard', tags: ['psicologia', 'caos_social'] },
      { civis: 'Gaslight', undercover: 'Discordar', dificuldade: 'hard', tags: ['psicologia', 'caos_social'] },
      // insana
      { civis: 'Autoestima', undercover: 'Arrogância', dificuldade: 'insana', tags: ['psicologia'] },
      { civis: 'Confiança', undercover: 'Dependência', dificuldade: 'insana', tags: ['psicologia', 'relacionamento'] },
      { civis: 'Ambição', undercover: 'Vaidade', dificuldade: 'insana', tags: ['psicologia'] },
      { civis: 'Sensibilidade', undercover: 'Fragilidade', dificuldade: 'insana', tags: ['psicologia'] },
      { civis: 'Cura', undercover: 'Esquecimento', dificuldade: 'insana', tags: ['psicologia', 'saude_mental'] },
      { civis: 'Empatia', undercover: 'Projeção', dificuldade: 'insana', tags: ['psicologia', 'social'] },
      { civis: 'Terapia', undercover: 'Autoconhecimento', dificuldade: 'insana', tags: ['psicologia', 'brasil'] },
    ],
  },
};

export const LISTA_CATEGORIAS: Categoria[] = Object.values(CATEGORIAS);

// ─── Helpers ────────────────────────────────────────────────
// Utilitários leves para discovery e curadoria futura.
// Não alteram engine nem gameplay.

import type { DificuldadeParPalavras } from '@/games/mr-white/types';
import type { ParPalavras } from '@/games/mr-white/types';

/** Filtra palavras de uma categoria por dificuldade. */
export function palavrasPorDificuldade(
  categoriaId: CategoriaId,
  dificuldade: DificuldadeParPalavras,
): ParPalavras[] {
  return CATEGORIAS[categoriaId].palavras.filter(
    (p) => p.dificuldade === dificuldade,
  );
}

/** Retorna categorias que contêm palavras com a tag especificada. */
export function categoriasPorTag(tag: string): Categoria[] {
  return LISTA_CATEGORIAS.filter((cat) =>
    cat.palavras.some((p) => p.tags?.includes(tag)),
  );
}
