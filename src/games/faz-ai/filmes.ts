import type { CartaFazAi } from '@/games/faz-ai/types';

type FilmeFazAiSeed = {
  texto: string;
  respostasAceitas: string[];
} & Partial<
  Pick<
    CartaFazAi,
    | 'dificuldadeAtuacao'
    | 'energiaRodada'
    | 'intensidadeSocial'
    | 'atuabilidade'
  >
>;

const TITULOS_FILMES = `
300
2012
10 Coisas que Eu Odeio em Você
8 Mile: Rua das Ilusões
A Barraca do Beijo
A Bela e a Fera
A Bruxa
A Bússola de Ouro
A Culpa é das Estrelas
A Entidade
A Era do Gelo
À Espera de um Milagre
A Família Addams
A Fantástica Fábrica de Chocolate
A Freira
A Hora do Pesadelo
A Ilha do Medo
A Múmia
A Nova Onda do Imperador
A Órfã
A Origem
À Procura da Felicidade
A Proposta
A Rede Social
A Viagem de Chihiro
A Vida é Bela
A Vida Secreta de Walter Mitty
A Volta do Todo Poderoso
Ace Ventura
Across the Universe
Adoráveis Mulheres
Ainda Estou Aqui
Air: A História por Trás do Logo
Akira
Aladdin
Alice Através do Espelho
Alice no País das Maravilhas
Alien vs. Predador
Alien: O Oitavo Passageiro
Alvin e os Esquilos
American Pie
Amor à Segunda Vista
Angry Birds 2: O Filme
Angry Birds: O Filme
Animais Fantásticos e Onde Habitam
Anjos e Demônios
Annabelle
Antes da Meia-Noite
Antes do Amanhecer
Antes do Pôr do Sol
Aquaman
Armageddon
Arremessando Alto
As Aventuras de Pi
As Aventuras de Sharkboy e Lavagirl
As Aventuras de Tintim
As Aventuras do Ursinho Pooh
As Branquelas
As Crônicas de Nárnia
As Férias da Minha Vida
As Panteras
As Patricinhas de Beverly Hills
Assassinato no Expresso do Oriente
Assassino a Preço Fixo
Asteroid City
Até que a Sorte nos Separe
Atividade Paranormal
Atlantis: O Reino Perdido
Austin Powers
Auto da Compadecida
Avatar
Babe: O Porquinho Atrapalhado
Babe: O Porquinho na Cidade
Bacurau
Bad Boys
Bad Boys para Sempre
Bambi
Barbie
Bastardos Inglórios
Batman: O Cavaleiro das Trevas
Bee Movie: A História de uma Abelha
Beethoven: O Magnífico
Beleza Americana
Besouro Azul
Besouro Verde
Bingo: O Rei das Manhãs
Bird Box
Birdman
Blade Runner 2049
Bohemian Rhapsody
Bolt: Supercão
Borat
Branca de Neve e os Sete Anões
Brilho Eterno de uma Mente sem Lembranças
Bruno
Bumblebee
Burlesque
Busca Implacável
Buzz Lightyear do Comando Estelar
Cães de Aluguel
Camp Rock
Camp Rock 2
Capitã Marvel
Capitão América: Guerra Civil
Carga Explosiva
Carrie, a Estranha
Cartas para Julieta
Casa Gucci
Casper
Cassino
Central do Brasil
Chappie
Charlie e a Fábrica de Chocolate
Chicago
Chicken Little
Chucky: O Brinquedo Assassino
Cidade de Deus
Cinderela
Círculo de Fogo
Cisne Negro
Click
Cloverfield: Monstro
Clube da Luta
Clube dos Cinco
Coach Carter: Treino para a Vida
Código de Conduta
Comando para Matar
Comer, Rezar, Amar
Como Estrelas na Terra
Como Eu Era Antes de Você
Como Se Fosse a Primeira Vez
Como Treinar o Seu Dragão
Constantine
Continência ao Amor
Coração Valente
Coringa
Corpo Fechado
Corra!
Creed: Nascido para Lutar
Creed II
Creed III
Crepúsculo
Cruella
Curtindo a Vida Adoidado
De Repente 30
De Volta para o Futuro
Deadpool
Debi & Loide
Dennis, o Pimentinha
Descendentes
Desencantada
Detona Ralph
Diário da Princesa
Diário de Bridget Jones
Diário de um Banana
Diário de uma Paixão
Dirty Dancing: Ritmo Quente
Distrito 9
Divergente
Divertida Mente
Django Livre
Dodgeball: Com a Bola Toda
Dona Hermínia
Donnie Brasco
Donnie Darko
Doutor Dolittle
Doutor Estranho
Dragon Ball Super: Broly
Dreamgirls
Dumbo
Duna
Duna: Parte Dois
Duro de Matar
E.T. - O Extraterrestre
Ela Dança, Eu Danço
Ela é Demais
Elementos
Elvis
Elysium
Emma
Emoji: O Filme
Encantada
Encanto
Ender's Game: O Jogo do Exterminador
Enola Holmes
Enrolados
Entre Facas e Segredos
Era Uma Vez em... Hollywood
Eragon
Escola de Rock
Espíritos: A Morte Está ao Seu Lado
Esposa de Mentirinha
Esqueceram de Mim
Estrelas Além do Tempo
Eternos
Eu Sou a Lenda
Eu Sou o Número Quatro
Eu, Robô
Eurotrip: Passaporte para a Confusão
Extraordinário
Ferdinand
Flubber: Uma Invenção Desmiolada
Footloose
Ford vs Ferrari
Forrest Gump: O Contador de Histórias
Fragmentado
Free Guy: Assumindo o Controle
Frozen: Uma Aventura Congelante
Garota Exemplar
Gasparzinho, o Fantasminha Camarada
Gênio Indomável
Gente Grande
Gente Grande 2
Ghost Rider: Motoqueiro Fantasma
Ghost: Do Outro Lado da Vida
Gladiador
Godzilla
Goosebumps: Monstros e Arrepios
Goosebumps 2: Halloween Assombrado
Gran Turismo: De Jogador a Corredor
Gravidade
Grease: Nos Tempos da Brilhantina
Green Book: O Guia
Guardiões da Galáxia
Guardiões da Galáxia Vol. 2
Guardiões da Galáxia Vol. 3
Guerra dos Mundos
Guerra Mundial Z
Hachi: A Dog's Tale
Halloween: A Noite do Terror
Han Solo: Uma História Star Wars
Hancock
Hannah Montana: O Filme
Harry Potter e a Pedra Filosofal
Harry Potter e o Cálice de Fogo
Harry Potter e as Relíquias da Morte
Hellboy
Hellboy II: O Exército Dourado
Hereditário
High School Musical
High School Musical 2
Histórias Cruzadas
Hitch: Conselheiro Amoroso
Hobbs & Shaw
Homem-Aranha
Homem-Aranha: Sem Volta para Casa
Homem-Formiga
Homem-Formiga e a Vespa
Hook: A Volta do Capitão Gancho
Hotel Transilvânia
Impacto Profundo
Independence Day
Indiana Jones e os Caçadores da Arca Perdida
Inferno
Inkheart: Coração de Tinta
Interestelar
Intocáveis
Invasão à Casa Branca
Invasão a Londres
Invasão ao Serviço Secreto
Invocação do Mal
Irmão Urso
Irmão Urso 2
It: A Coisa
Jack: O Caçador de Gigantes
João e Maria: Caçadores de Bruxas
Jobs
Jogo de Amor em Las Vegas
Jogos Mortais
Jogos Vorazes
John Wick
Joias Brutas
Jojo Rabbit
Jumanji
Jumper
Juno
Juntos e Misturados
Jurassic Park: Parque dos Dinossauros
Jurassic World
Karate Kid
Kick-Ass: Quebrando Tudo
Kill Bill: Volume 1
Kill Bill: Volume 2
King Kong
Kung Fu Panda
Kuzco 2: O Rei da Onda
La La Land: Cantando Estações
Lady Bird: A Hora de Voar
Lanterna Verde
Legalmente Loira
Legalmente Loira 2
Lemonade Mouth
Liga da Justiça
Lightyear
Lilo & Stitch
Logan
Looney Tunes: De Volta à Ação
Lua Nova
Luca
Lucy
Madagascar
Magic Mike
Magic Mike XXL
Malévola
Malévola: Dona do Mal
Mama
Mamma Mia!
Máquina Mortífera
Marley & Eu
Matilda
Matrix
Maze Runner: Correr ou Morrer
Maze Runner: Prova de Fogo
Maze Runner: A Cura Mortal
Me Chame Pelo Seu Nome
Mean Girls: Meninas Malvadas
Menina de Ouro
Meninas Malvadas
Mente Brilhante
Mercenários 2
Mercenários 3
Meu Amigo Totoro
Meu Malvado Favorito
MIB: Homens de Preto
Midsommar: O Mal Não Espera a Noite
Milagre na Cela 7
Minecraft: O Filme
Minha Mãe é uma Peça
Minions
Miss Simpatia
Miss Simpatia 2
Missão Impossível
Moana
Mogli: Entre Dois Mundos
Mogli: O Menino Lobo
Moneyball: O Homem que Mudou o Jogo
Monstros S.A.
Moonrise Kingdom
Morte no Nilo
Motoqueiro Fantasma: Espírito de Vingança
Moulin Rouge: Amor em Vermelho
Mulan
Mulher-Maravilha
Napoleão
Naruto: O Filme
Nasce Uma Estrela
Náufrago
Need for Speed: O Filme
No Limite do Amanhã
Noiva em Fuga
Nope
Norbit
Nós
Now You See Me 2
O Amor Não Tira Férias
O Aprendiz de Feiticeiro
O Bicho Vai Pegar
O Bom Gigante Amigo
O Casamento do Meu Melhor Amigo
O Castelo Animado
O Chamado
O Código Da Vinci
O Colecionador de Ossos
O Curioso Caso de Benjamin Button
O Dia Depois de Amanhã
O Diabo Veste Prada
O Diário da Princesa 2
O Discurso do Rei
O Ditador
O Exorcismo de Emily Rose
O Exorcista
O Exterminador do Futuro
O Fabuloso Destino de Amélie Poulain
O Fantasma da Ópera
O Grande Gatsby
O Grande Hotel Budapeste
O Grande Truque
O Grinch
O Grito
O Guia do Mochileiro das Galáxias
O Hobbit
O Homem que Copiava
O Iluminado
O Irlandês
O Jogo da Imitação
O Lobo de Wall Street
O Máskara
O Máskara do Zorro
O Menino do Pijama Listrado
O Menino e a Garça
O Menino que Descobriu o Vento
O Mentiroso
O Náufrago
O Pequenino
O Planeta dos Macacos
O Poço
O Poderoso Chefão
O Professor Aloprado
O Protetor
O Protetor 2
O Protetor 3
O Regresso
O Rei Leão
O Resgate do Soldado Ryan
O Retorno da Múmia
O Segredo dos Animais
O Senhor dos Anéis: A Sociedade do Anel
O Sexto Sentido
O Show de Truman
O Telefone Preto
O Terminal
O Virgem de 40 Anos
Oblivion
Oldboy
One Piece Film: Red
Operação Big Hero
Operação Cupido
Oppenheimer
Orgulho e Preconceito
Os Batutinhas
Os Bons Companheiros
Os Caça-Fantasmas
Os Croods
Os Incríveis
Os Mercenários
Os Oito Odiados
Os Parças
Os Sem-Floresta
Oz: Mágico e Poderoso
Pacific Rim: Círculo de Fogo
Paddington
Paddington 2
Pânico
Pantera Negra
Para Todos os Garotos que Já Amei
Parasita
Pequena Miss Sunshine
Pequenos Espiões
Pequenos Espiões 2: A Ilha dos Sonhos Perdidos
Pequenos Espiões 3D
Percy Jackson e o Ladrão de Raios
Percy Jackson e o Mar de Monstros
Persuasão
Peter Pan
Peter Pan & Wendy
Pets: A Vida Secreta dos Bichos
Pinóquio
Piratas do Caribe: A Maldição do Pérola Negra
Pitch Perfect: A Escolha Perfeita
Pixels
Planeta do Tesouro
Pokémon Detetive Pikachu
Pokémon: O Filme
Poltergeist: O Fenômeno
Ponyo: Uma Amizade que Veio do Mar
Predador
Premonição
Prenda-me Se For Capaz
Procurando Dory
Procurando Nemo
Projeto X: Uma Festa Fora de Controle
Psicose
Pulp Fiction: Tempo de Violência
Quarteto Fantástico
Que Horas Ela Volta?
Querida, Encolhi as Crianças
Questão de Tempo
Rambo: Programado para Matar
Ratatouille
Razão e Sensibilidade
Ready Player One: Jogador Nº 1
REC
Red: Crescer é uma Fera
Rent: Os Boêmios
Resident Evil: O Hóspede Maldito
Resident Evil 2: Apocalipse
Resident Evil 3: A Extinção
Respect: A História de Aretha Franklin
Rio
Rio 2
Robocop
Robôs
Rocketman
Rocky: Um Lutador
Rocky Balboa
Rogue One: Uma História Star Wars
Rush Hour: A Hora do Rush
Rush: No Limite da Emoção
Salt
Scarface
School of Rock
Scooby-Doo
Scooby-Doo 2: Monstros à Solta
Scott Pilgrim Contra o Mundo
Se Beber, Não Case!
Se Eu Fosse Você
Sempre ao Seu Lado
Serviço de Entregas da Kiki
Seven: Os Sete Crimes Capitais
Sexta-Feira 13
Sexta-Feira em Apuros
Sexta-Feira Muito Louca
Shang-Chi e a Lenda dos Dez Anéis
Sharknado
Shaun of the Dead
Shazam!
Sherlock Holmes
Sherlock Holmes: O Jogo de Sombras
Shrek
Sim Senhor
Simplesmente Amor
Sing: Quem Canta Seus Males Espanta
Sing 2
Sobrenatural
Sobrenatural: A Origem
Sobrenatural: Capítulo 2
Sociedade dos Poetas Mortos
Sonic: O Filme
Sonic 2: O Filme
Soul
Space Jam
Space Jam: Um Novo Legado
Spaceballs
Spirit: O Corcel Indomável
Spotlight: Segredos Revelados
Star Trek
Star Trek: Além da Escuridão
Star Wars: Uma Nova Esperança
Star Wars: O Império Contra-Ataca
Star Wars: O Retorno de Jedi
Stardust: O Mistério da Estrela
Steve Jobs
Straight Outta Compton: A História do N.W.A.
Stuart Little
Stuart Little 2
Super Mario Bros. O Filme
Superbad: É Hoje
Superman
Suzume
Tá Chovendo Hambúrguer
Tá Rindo do Quê?
Tarzan
Ted
Ted 2
Teen Beach Movie
Thor: Ragnarok
Through My Window: Através da Minha Janela
Titanic
Todo Mundo em Pânico
Todo Mundo Quase Morto
Todo Poderoso
Top Gun: Maverick
Toy Story
Toy Story 3
Train to Busan
Transformers
Troia
Trolls
Tron: O Legado
Tropa de Elite
Truque de Mestre
Truque de Mestre 2
Tubarão
Um Lugar Chamado Notting Hill
Um Lugar Silencioso
Um Maluco no Pedaço
Um Sonho de Liberdade
Um Tira da Pesada
Uma Linda Mulher
Up: Altas Aventuras
Van Helsing
Velozes e Furiosos
Velozes e Furiosos 5: Operação Rio
Velozes e Furiosos 7
Vidro
Vingadores: Guerra Infinita
Vingadores: Ultimato
Viúva Negra
Viva: A Vida é uma Festa
Vizinhos
Wall Street: Poder e Cobiça
Wall-E
Watchmen: O Filme
Whiplash: Em Busca da Perfeição
WiFi Ralph
Wonka
X-Men
Yesterday
Your Name
Zoolander
Zoolander 2
Zootopia
Zumbilândia
`;

const FILMES_DIRETOS = new Set([
  '300',
  '2012',
  'A Bela e a Fera',
  'A Era do Gelo',
  'A Família Addams',
  'A Múmia',
  'Aladdin',
  'Avatar',
  'Barbie',
  'Batman: O Cavaleiro das Trevas',
  'Duna',
  'E.T. - O Extraterrestre',
  'Frozen: Uma Aventura Congelante',
  'Harry Potter e a Pedra Filosofal',
  'Homem-Aranha',
  'Interestelar',
  'It: A Coisa',
  'Jogos Vorazes',
  'John Wick',
  'Jumanji',
  'Jurassic Park: Parque dos Dinossauros',
  'Karate Kid',
  'King Kong',
  'Kung Fu Panda',
  'Madagascar',
  'Matrix',
  'Minions',
  'Moana',
  'Monstros S.A.',
  'Mulan',
  'O Máskara',
  'O Rei Leão',
  'O Senhor dos Anéis: A Sociedade do Anel',
  'Os Caça-Fantasmas',
  'Os Incríveis',
  'Pantera Negra',
  'Piratas do Caribe: A Maldição do Pérola Negra',
  'Procurando Nemo',
  'Ratatouille',
  'Rocky: Um Lutador',
  'Scooby-Doo',
  'Shrek',
  'Sonic: O Filme',
  'Star Wars: Uma Nova Esperança',
  'Super Mario Bros. O Filme',
  'Titanic',
  'Toy Story',
  'Transformers',
  'Tropa de Elite',
  'Tubarão',
  'Up: Altas Aventuras',
  'Velozes e Furiosos',
  'Wall-E',
  'Wonka',
  'X-Men',
]);

function normalizarTitulo(titulo: string): string {
  return titulo
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function dificuldadePorTitulo(
  titulo: string,
): FilmeFazAiSeed['dificuldadeAtuacao'] {
  if (FILMES_DIRETOS.has(titulo)) return 'facil';
  if (titulo.length > 34 || titulo.includes(':')) return 'dificil';
  return 'media';
}

function atuabilidadePorTitulo(titulo: string): FilmeFazAiSeed['atuabilidade'] {
  if (FILMES_DIRETOS.has(titulo)) return 'direta';
  if (titulo.includes(':')) return 'sutil';
  return 'boa';
}

function criarFilme(titulo: string): FilmeFazAiSeed {
  return {
    texto: titulo,
    respostasAceitas: [titulo, normalizarTitulo(titulo)].filter(
      (item, indice, todos) =>
        item.length > 0 && todos.indexOf(item) === indice,
    ),
    dificuldadeAtuacao: dificuldadePorTitulo(titulo),
    atuabilidade: atuabilidadePorTitulo(titulo),
    energiaRodada: FILMES_DIRETOS.has(titulo) ? 'aquecimento' : 'ritmo',
    intensidadeSocial: FILMES_DIRETOS.has(titulo) ? 'leve' : 'social',
  };
}

export const FILMES_FAZ_AI: readonly FilmeFazAiSeed[] = [
  ...new Set(
    TITULOS_FILMES.trim()
      .split('\n')
      .map((titulo) => titulo.trim())
      .filter(Boolean),
  ),
].map(criarFilme);
