import type { CartaFazAi } from '@/games/faz-ai/types';

type CelebridadeFazAiSeed = {
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

const NOMES_CELEBRIDADES = `
50 Cent
Adam Sandler
Addison Rae
Adele
Adriana Lima
Adriane Galisteu
Al Pacino
Albert Einstein
Alok
Amanda Nunes
Ana Maria Braga
Anderson Silva
Andrew Garfield
Angelina Jolie
Anitta
Anne Hathaway
Ariana Grande
Arnold Schwarzenegger
Audrey Hepburn
Avril Lavigne
Bad Bunny
Barack Obama
Barbie
Bart Simpson
Batman
Bella Hadid
Bella Poarch
Ben Stiller
Benedict Cumberbatch
Beyoncé
Bill Gates
Billie Eilish
Bob Esponja
Bob Marley
Bon Jovi
Brad Pitt
Britney Spears
Bruce Lee
Bruna Marquezine
Bruno Mars
Buzz Lightyear
Caetano Veloso
Calvin Harris
Cameron Diaz
Camila Cabello
Capitão América
Cardi B
Carlinhos Maia
Casimiro
Chapolin Colorado
Charles Darwin
Charles do Bronx
Charli D'Amelio
Chaves
Chico Buarque
Chris Evans
Chris Hemsworth
Christopher Nolan
Cleópatra
Conor McGregor
Cristiano Ronaldo
Daenerys Targaryen
Daniel Radcliffe
Darth Maul
Darth Vader
David Beckham
David Guetta
Deadpool
Demi Lovato
Dercy Gonçalves
Doja Cat
Donald Trump
Doutor Estranho
Drake
Dua Lipa
Dwayne Johnson
Ed Sheeran
Eleven
Elon Musk
Elsa
Elton John
Elvis Presley
Eminem
Emma Stone
Emma Watson
Endrick
Enrique Iglesias
Fábio Porchat
Fausto Silva
Felipe Neto
Fernanda Montenegro
Freddie Mercury
Frida Kahlo
Gal Gadot
Galvão Bueno
George Lucas
Gilberto Gil
Gisele Bündchen
Goku
Gordon Ramsay
Grazi Massafera
Greta Gerwig
Greta Thunberg
Gru
Gusttavo Lima
Hailey Bieber
Harry Potter
Harry Styles
Heath Ledger
Hebe Camargo
Hermione Granger
Homem de Ferro
Homem-Aranha
Homer Simpson
Hugh Jackman
Hulk
Ice Cube
Isaac Newton
Ivete Sangalo
Jackie Chan
Jackie Kennedy
Jake Paul
James Cameron
Jason Momoa
Jean-Claude Van Damme
Jeff Bezos
Jenna Ortega
Jennifer Aniston
Jennifer Lopez
Jim Carrey
Joaquin Phoenix
Joe Biden
Joey Tribbiani
Johnny Depp
Jon Snow
José Aldo
Julia Roberts
Juliette
Júlio César
Júnior Lima
Justin Bieber
Kanye West
Karol G
Katy Perry
Keanu Reeves
Ken
Kendall Jenner
Kendrick Lamar
Khaby Lame
Kim Kardashian
Kobe Bryant
Kurt Cobain
Kylie Jenner
Lady Gaga
Lana Del Rey
LeBron James
Leonardo DiCaprio
Lindsay Lohan
Lionel Messi
Logan Paul
Loki
Luan Santana
Luciano Huck
Luffy
Luigi
Madonna
Maiara e Maraisa
Maluma
Margot Robbie
Marie Curie
Marília Mendonça
Marilyn Monroe
Mario
Mark Ruffalo
Mark Zuckerberg
Marshmello
Marta
Martin Garrix
Martin Scorsese
Mbappé
Megan Fox
Michael Jackson
Michael Jordan
Michael Phelps
Michael Scott
Mick Jagger
Mickey Mouse
Mike Tyson
Mila Kunis
Miley Cyrus
Minions
Morgan Freeman
Mr. Bean
MrBeast
Naomi Campbell
Napoleão Bonaparte
Naruto
Natalie Portman
Neymar
Nicki Minaj
Nikola Tesla
Notorious B.I.G.
Novak Djokovic
Olaf
Olivia Rodrigo
Oprah Winfrey
Owen Wilson
Ozzy Osbourne
Pablo Picasso
Pamela Anderson
Pantera Negra
Paolla Oliveira
Papa Francisco
Paris Hilton
Paulo Gustavo
Pelé
PewDiePie
Pikachu
Post Malone
Princess Diana
Quentin Tarantino
Rachel Green
Rafael Nadal
Rainha Elizabeth II
Rei Charles III
Renato Aragão
Ricky Martin
Rihanna
Robert De Niro
Robert Downey Jr.
Roberto Carlos
Rodrigo Faro
Roger Federer
Romário
Ronaldinho Gaúcho
Ronaldo Fenômeno
Ronda Rousey
Rosalía
Rowan Atkinson
Rupert Grint
Ryan Reynolds
Sabrina Carpenter
Sabrina Sato
Samuel L. Jackson
Sandra Bullock
Sandy
Scarlett Johansson
Scooby-Doo
Selena Gomez
Selton Mello
Serena Williams
Shakira
Shaquille O'Neal
Shawn Mendes
Sheldon Cooper
Shrek
Sigmund Freud
Silvio Santos
Simone Biles
Slash
Snoop Dogg
Sonic
Stephen Curry
Stephen Hawking
Steve Aoki
Steve Jobs
Steven Seagal
Steven Spielberg
Stitch
Superman
Sylvester Stallone
Tatá Werneck
Taylor Swift
Thanos
The Weeknd
Thor
Tiger Woods
Timothée Chalamet
Tobey Maguire
Tom Cavalcante
Tom Cruise
Tom Hanks
Tom Holland
Tommy Shelby
Travis Scott
Tupac
Usain Bolt
Vanessa Hudgens
Victoria Beckham
Vin Diesel
Vincent van Gogh
Vini Jr.
Virginia Fonseca
Viúva Negra
Vladimir Putin
Wagner Moura
Walt Disney
Walter White
Wanda Maximoff
Warren Buffett
Wednesday Addams
Wesley Safadão
Whindersson Nunes
Will Smith
William Shakespeare
Wolverine
Woody
Xuxa
Yoda
Zac Efron
Zendaya
`;

const DIRETOS = new Set([
  'Anitta',
  'Arnold Schwarzenegger',
  'Barbie',
  'Bart Simpson',
  'Batman',
  'Beyoncé',
  'Bob Esponja',
  'Britney Spears',
  'Bruce Lee',
  'Buzz Lightyear',
  'Capitão América',
  'Chapolin Colorado',
  'Chaves',
  'Cristiano Ronaldo',
  'Darth Vader',
  'Deadpool',
  'Doutor Estranho',
  'Dwayne Johnson',
  'Elsa',
  'Elvis Presley',
  'Freddie Mercury',
  'Goku',
  'Gordon Ramsay',
  'Gru',
  'Harry Potter',
  'Hermione Granger',
  'Homem de Ferro',
  'Homem-Aranha',
  'Homer Simpson',
  'Hulk',
  'Jackie Chan',
  'Jim Carrey',
  'Ken',
  'Lady Gaga',
  'LeBron James',
  'Lionel Messi',
  'Loki',
  'Luigi',
  'Madonna',
  'Marilyn Monroe',
  'Mario',
  'Michael Jackson',
  'Michael Jordan',
  'Mickey Mouse',
  'Mike Tyson',
  'Minions',
  'Mr. Bean',
  'Neymar',
  'Olaf',
  'Pantera Negra',
  'Pelé',
  'Pikachu',
  'Ronaldinho Gaúcho',
  'Scooby-Doo',
  'Shakira',
  'Shrek',
  'Silvio Santos',
  'Sonic',
  'Stitch',
  'Superman',
  'Taylor Swift',
  'Thanos',
  'Thor',
  'Usain Bolt',
  'Velozes e Furiosos',
  'Viúva Negra',
  'Wolverine',
  'Woody',
  'Xuxa',
  'Yoda',
]);

function normalizarNome(nome: string): string {
  return nome
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function dificuldadePorNome(
  nome: string,
): CelebridadeFazAiSeed['dificuldadeAtuacao'] {
  if (DIRETOS.has(nome)) return 'facil';
  if (nome.length > 24 || nome.includes('.')) return 'dificil';
  return 'media';
}

function atuabilidadePorNome(
  nome: string,
): CelebridadeFazAiSeed['atuabilidade'] {
  if (DIRETOS.has(nome)) return 'direta';
  if (nome.includes(' ') || nome.includes('.')) return 'sutil';
  return 'boa';
}

function criarCelebridade(nome: string): CelebridadeFazAiSeed {
  return {
    texto: nome,
    respostasAceitas: [nome, normalizarNome(nome)].filter(
      (item, indice, todos) =>
        item.length > 0 && todos.indexOf(item) === indice,
    ),
    dificuldadeAtuacao: dificuldadePorNome(nome),
    atuabilidade: atuabilidadePorNome(nome),
    energiaRodada: DIRETOS.has(nome) ? 'aquecimento' : 'ritmo',
    intensidadeSocial: DIRETOS.has(nome) ? 'leve' : 'social',
  };
}

export const CELEBRIDADES_FAZ_AI: readonly CelebridadeFazAiSeed[] = [
  ...new Set(
    NOMES_CELEBRIDADES.trim()
      .split('\n')
      .map((nome) => nome.trim())
      .filter(Boolean),
  ),
].map(criarCelebridade);
