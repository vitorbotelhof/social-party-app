const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const CARDS_PATH = path.join(ROOT, 'src/games/voce-me-conhece/local/cards.ts');

const CATEGORY_PREFIX = {
  vibes: 'vib',
  escolhas: 'esc',
  prioridades: 'pri',
  'vida-real': 'vr',
  'o-que-vale-mais': 'ovm',
};

const MAX_OPTION_LENGTH = 34;
const SIMULATED_ROUNDS = 18;

function fail(message) {
  console.error(`VMC cards validation failed: ${message}`);
  process.exitCode = 1;
}

function getArrayDeclarations(source) {
  return [
    ...source.matchAll(/const (CARDS_[A-Z0-9_]+): CartaoVMCBase\[\] =/g),
  ].map((match) => match[1]);
}

function getExportedSpreads(source) {
  const exportMatch = source.match(
    /export const CARDS_VMC: CartaoVMC\[\] = \[([\s\S]*?)\]\.map/,
  );
  if (!exportMatch) return [];
  return [...exportMatch[1].matchAll(/\.\.\.(CARDS_[A-Z0-9_]+)/g)].map(
    (match) => match[1],
  );
}

function getCards(source) {
  const cardRegex =
    /\{\s*id: '([^']+)',\s*categoriaId: '([^']+)',\s*temperatura: '([^']+)',\s*opcoes: \[([\s\S]*?)\],\s*tipoEscolha: '([^']+)',\s*\}/g;
  const cards = [];
  let match;

  while ((match = cardRegex.exec(source))) {
    const opcoes = [...match[4].matchAll(/'([^']+)'/g)].map((item) => item[1]);
    cards.push({
      id: match[1],
      categoriaId: match[2],
      temperatura: match[3],
      opcoes,
      tipoEscolha: match[5],
    });
  }

  return cards;
}

function validateArraysAreExported(source) {
  const declarations = getArrayDeclarations(source);
  const exported = new Set(getExportedSpreads(source));
  const missing = declarations.filter((name) => !exported.has(name));

  if (missing.length > 0) {
    fail(
      `arrays declared but not exported in CARDS_VMC: ${missing.join(', ')}`,
    );
  }
}

function validateCards(cards) {
  const ids = new Set();
  const byCategory = {};

  cards.forEach((card) => {
    if (ids.has(card.id)) fail(`duplicated id "${card.id}"`);
    ids.add(card.id);

    const expectedPrefix = CATEGORY_PREFIX[card.categoriaId];
    if (!expectedPrefix)
      fail(`unknown category "${card.categoriaId}" in ${card.id}`);
    if (expectedPrefix && !card.id.startsWith(`${expectedPrefix}-`)) {
      fail(`id "${card.id}" does not match category "${card.categoriaId}"`);
    }

    byCategory[card.categoriaId] = (byCategory[card.categoriaId] ?? 0) + 1;

    if (card.opcoes.length !== 4) {
      fail(`${card.id} has ${card.opcoes.length} options instead of 4`);
    }

    const normalizedOptions = card.opcoes.map((option) =>
      option.trim().toLocaleLowerCase('pt-BR'),
    );
    if (new Set(normalizedOptions).size !== normalizedOptions.length) {
      fail(`${card.id} has repeated options`);
    }

    card.opcoes.forEach((option) => {
      if (option.trim() !== option) {
        fail(`${card.id} has option with surrounding whitespace: "${option}"`);
      }
      if (option.length > MAX_OPTION_LENGTH) {
        fail(
          `${card.id} option is too long (${option.length}/${MAX_OPTION_LENGTH}): "${option}"`,
        );
      }
    });

    if (!['leve', 'social', 'pessoal', 'intenso'].includes(card.temperatura)) {
      fail(`${card.id} has invalid temperatura "${card.temperatura}"`);
    }

    if (!['top1', 'last', 'ambos'].includes(card.tipoEscolha)) {
      fail(`${card.id} has invalid tipoEscolha "${card.tipoEscolha}"`);
    }
  });

  Object.keys(CATEGORY_PREFIX).forEach((categoryId) => {
    if (!byCategory[categoryId]) fail(`category "${categoryId}" has no cards`);
  });

  return byCategory;
}

function getEditorialData(source) {
  const categoryFamily = {};
  const categoryIntensity = {};
  const categoryRisk = {};
  const categoryTags = {};
  const extraTags = {};

  const familyBlock = source.match(
    /const FAMILIA_POR_CATEGORIA:[\s\S]*?= \{([\s\S]*?)\};/,
  )?.[1];
  familyBlock?.replace(
    /'([^']+)'|(\w+): '([^']+)'/g,
    (full, quoted, key, value) => {
      if (quoted) {
        const after = familyBlock.slice(
          familyBlock.indexOf(full) + full.length,
        );
        const match = after.match(/:\s*'([^']+)'/);
        if (match) categoryFamily[quoted] = match[1];
      } else if (key && value) {
        categoryFamily[key] = value;
      }
      return full;
    },
  );

  const simpleRecordRegex = /(?:'([^']+)'|(\w+)):\s*'([^']+)'/g;

  const intensityBlock = source.match(
    /const INTENSIDADE_POR_CATEGORIA:[\s\S]*?= \{([\s\S]*?)\};/,
  )?.[1];
  for (const match of intensityBlock?.matchAll(simpleRecordRegex) ?? []) {
    categoryIntensity[match[1] ?? match[2]] = match[3];
  }

  const riskBlock = source.match(
    /const RISCO_POR_CATEGORIA:[\s\S]*?= \{([\s\S]*?)\};/,
  )?.[1];
  for (const match of riskBlock?.matchAll(simpleRecordRegex) ?? []) {
    categoryRisk[match[1] ?? match[2]] = match[3];
  }

  const tagsBlock = source.match(
    /const TAGS_BASE_POR_CATEGORIA:[\s\S]*?= \{([\s\S]*?)\};/,
  )?.[1];
  for (const match of tagsBlock?.matchAll(
    /(?:'([^']+)'|(\w+)):\s*\[([^\]]*)\]/g,
  ) ?? []) {
    categoryTags[match[1] ?? match[2]] = [
      ...match[3].matchAll(/'([^']+)'/g),
    ].map((item) => item[1]);
  }

  const extraTagsBlock = source.match(
    /const TAGS_POR_PREFIXO:[\s\S]*?= \{([\s\S]*?)\};/,
  )?.[1];
  for (const match of extraTagsBlock?.matchAll(/'([^']+)':\s*\[([^\]]*)\]/g) ??
    []) {
    extraTags[match[1]] = [...match[2].matchAll(/'([^']+)'/g)].map(
      (item) => item[1],
    );
  }

  return {
    categoryFamily,
    categoryIntensity,
    categoryRisk,
    categoryTags,
    extraTags,
  };
}

function enrichCard(card, editorialData) {
  return {
    ...card,
    editorial: {
      familia: editorialData.categoryFamily[card.categoriaId],
      intensidade: editorialData.categoryIntensity[card.categoriaId],
      riscoRepeticao: editorialData.categoryRisk[card.categoriaId],
      tags: [
        ...(editorialData.categoryTags[card.categoriaId] ?? []),
        ...(editorialData.extraTags[card.id] ?? []),
      ],
    },
  };
}

function scoreCard(card, recent, round, totalRounds, available) {
  const last = recent.at(-1);
  let score = 0;
  const progress = totalRounds <= 1 ? 1 : (round - 1) / (totalRounds - 1);

  if (progress < 0.25) {
    if (card.editorial.intensidade === 'baixa') score += 5;
    else if (card.editorial.intensidade === 'media') score += 1;
    else score -= 5;
  } else if (progress > 0.72) {
    if (card.editorial.intensidade === 'alta') score += 4;
    else if (card.editorial.intensidade === 'media') score += 2;
    else score -= 1;
  } else if (card.editorial.intensidade === 'media') {
    score += 4;
  } else {
    score += 1;
  }

  if (last && available.some((item) => item.categoriaId !== last.categoriaId)) {
    if (card.categoriaId === last.categoriaId) score -= 18;
    if (card.editorial.familia === last.editorial.familia) score -= 12;
  }

  recent.forEach((item, index) => {
    const distance = recent.length - index;
    const weight = distance === 1 ? 1 : 0.55;
    if (card.categoriaId === item.categoriaId) score -= 5 * weight;
    if (card.editorial.familia === item.editorial.familia) score -= 3 * weight;

    const itemTags = new Set(item.editorial.tags);
    const repeatedTags = card.editorial.tags.filter((tag) => itemTags.has(tag));
    score -= repeatedTags.length * 1.7 * weight;

    if (
      card.editorial.riscoRepeticao === 'alto' &&
      card.categoriaId === item.categoriaId
    ) {
      score -= 3 * weight;
    }
  });

  return score;
}

function simulateEditorialVariety(cards, editorialData) {
  let deck = cards.map((card) => enrichCard(card, editorialData));
  const used = new Set();
  let recent = [];
  const selected = [];

  for (let round = 1; round <= SIMULATED_ROUNDS; round += 1) {
    let available = deck.filter((card) => !used.has(card.id));
    if (available.length === 0) {
      const lastId = recent.at(-1)?.id;
      used.clear();
      available = deck.filter((card) => card.id !== lastId);
      if (available.length === 0) available = [...deck];
    }

    const selectedCard = [...available].sort(
      (a, b) =>
        scoreCard(b, recent, round, SIMULATED_ROUNDS, available) -
        scoreCard(a, recent, round, SIMULATED_ROUNDS, available),
    )[0];

    used.add(selectedCard.id);
    recent = [...recent.slice(-4), selectedCard];
    selected.push(selectedCard);
  }

  const adjacentCategoryRepeats = selected.filter(
    (card, index) =>
      index > 0 && card.categoriaId === selected[index - 1].categoriaId,
  );

  if (adjacentCategoryRepeats.length > 0) {
    fail(
      `editorial selector simulation repeated adjacent categories: ${adjacentCategoryRepeats
        .map((card) => card.id)
        .join(', ')}`,
    );
  }

  return selected.map((card) => card.categoriaId);
}

function main() {
  const source = fs.readFileSync(CARDS_PATH, 'utf8');
  validateArraysAreExported(source);

  const cards = getCards(source);
  const byCategory = validateCards(cards);
  const editorialPath = simulateEditorialVariety(
    cards,
    getEditorialData(source),
  );

  if (process.exitCode) return;

  console.log(
    JSON.stringify(
      {
        ok: true,
        total: cards.length,
        byCategory,
        editorialSimulation: editorialPath,
      },
      null,
      2,
    ),
  );
}

main();
