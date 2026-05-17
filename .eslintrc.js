/**
 * ESLint config — boundaries arquiteturais.
 *
 * As regras `import/no-restricted-paths` traduzem a Arquitetura
 * documentada em /docs/ARCHITECTURE.md em verificações automáticas.
 *
 * Filosofia:
 *   - Camadas dependem APENAS para BAIXO (fluxo unidirecional).
 *   - Features são ilhas (sem cross-feature imports).
 *   - Engines são UI-agnostic.
 *   - Types/Theme são folhas puras.
 *   - /app está reservado para Onda 2 — off-limits temporariamente.
 *
 * Comparação `target` vs `from`:
 *   - `target` = arquivos onde a regra se APLICA (importadores).
 *   - `from`   = paths que aqueles arquivos NÃO podem importar.
 */
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
    project: './tsconfig.json',
  },
  env: {
    'react-native/react-native': true,
    es2022: true,
    node: true,
  },
  plugins: [
    '@typescript-eslint',
    'react',
    'react-hooks',
    'react-native',
    'import',
    'prettier',
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:react-native/all',
    'prettier',
  ],
  settings: {
    react: { version: 'detect' },
    'import/resolver': {
      typescript: { project: './tsconfig.json' },
      node: { extensions: ['.js', '.jsx', '.ts', '.tsx'] },
    },
  },
  rules: {
    'prettier/prettier': 'error',
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-unused-vars': [
      'error',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
    ],
    'react-native/no-raw-text': 'off',
    'react-native/sort-styles': 'off',

    // ============================================================
    //  Architecture boundaries
    // ============================================================
    'import/no-restricted-paths': [
      'error',
      {
        zones: [
          // ---------------------------------------------------------
          //  /app está OFF-LIMITS até Onda 2 da migração.
          //  Ninguém em /src deve importar de /app — quando o Expo
          //  Router for ativado, o fluxo é o inverso (/app importa
          //  de /src), nunca o contrário.
          // ---------------------------------------------------------
          {
            target: './src',
            from: './app',
            message:
              '[Onda 1] /app está reservado pro Expo Router. Não importe de lá ainda.',
          },

          // ---------------------------------------------------------
          //  /src/engine = ENGINE LAYER
          //  Deve ser UI-agnostic e independente de features.
          //  Pode usar types e utils. Não pode tocar UI nem games.
          // ---------------------------------------------------------
          {
            target: './src/engine',
            from: [
              './src/components',
              './src/screens',
              './src/games',
              './src/navigation',
              './src/hooks',
              './src/services',
              './src/theme',
            ],
            message:
              'Engines são UI-agnostic e independentes de features/services. Use apenas /types e /utils.',
          },

          // ---------------------------------------------------------
          //  Cross-feature imports = PROIBIDOS.
          //  Um jogo não pode importar de outro jogo. Primitivas
          //  compartilhadas devem subir para /engines.
          //  (Hoje só existe mr-white; a regra fica pronta pro 2º.)
          // ---------------------------------------------------------
          {
            target: './src/games/mr-white',
            from: './src/games',
            except: ['./mr-white'],
            message:
              'Cross-feature imports proibidos. Extraia primitivas compartilhadas pra /src/engine.',
          },

          // ---------------------------------------------------------
          //  /src/types = FOLHA PURA.
          //  Só pode importar de outros types ou bibliotecas externas.
          //  Nada de implementação interna.
          // ---------------------------------------------------------
          {
            target: './src/types',
            from: [
              './src/components',
              './src/screens',
              './src/games',
              './src/engine',
              './src/navigation',
              './src/services',
              './src/hooks',
              './src/theme',
              './src/utils',
            ],
            message:
              '/types é folha pura. Não pode depender de implementação interna.',
          },

          // ---------------------------------------------------------
          //  /src/theme = TOKENS PUROS.
          //  Cores, espaçamento, tipografia. Sem deps internas.
          // ---------------------------------------------------------
          {
            target: './src/theme',
            from: [
              './src/components',
              './src/screens',
              './src/games',
              './src/engine',
              './src/navigation',
              './src/services',
              './src/hooks',
              './src/types',
              './src/utils',
            ],
            message:
              '/theme contém apenas design tokens. Sem deps internas.',
          },

          // ---------------------------------------------------------
          //  /src/utils = HELPERS PUROS.
          //  Não importam de nada interno (idealmente puro JS/TS).
          // ---------------------------------------------------------
          {
            target: './src/utils',
            from: [
              './src/components',
              './src/screens',
              './src/games',
              './src/engine',
              './src/navigation',
              './src/services',
              './src/hooks',
              './src/theme',
              './src/types',
            ],
            message:
              '/utils são helpers puros — sem deps internas. Tipos compartilhados vão pra /types.',
          },

          // ---------------------------------------------------------
          //  /src/components = UI COMPOSITIONS.
          //  Não podem importar de screens nem de business services.
          //  (Services técnicos como firebase/audio/storage são ok
          //  via exceções listadas abaixo — IndicadorConexao precisa
          //  do firebase pra observar .info/connected.)
          // ---------------------------------------------------------
          {
            target: './src/components',
            from: [
              './src/screens',
              './src/games',
              './src/navigation',
              './src/services/roomService.ts',
              './src/services/gameActions.ts',
              './src/services/mockRoomService.ts',
              './src/services/mockGameActions.ts',
              './src/services/jogoLocal.ts',
              './src/services/partidaAtiva.ts',
              './src/services/tutorial.ts',
              './src/services/presenca.ts',
              './src/services/jogadorLocal.ts',
              './src/services/comTimeout.ts',
            ],
            message:
              'Components são UI puros. Sem screens, games, navigation ou services de negócio. (Services técnicos como firebase/audio são permitidos.)',
          },

          // ---------------------------------------------------------
          //  /src/navigation = ROTAS.
          //  Pode importar de screens e types, mas não da inversa.
          // ---------------------------------------------------------
          {
            target: './src/screens',
            from: './src/navigation/RootNavigator.tsx',
            message:
              'Screens não importam o RootNavigator. Use props do native-stack ou useNavigation().',
          },
        ],
      },
    ],

    // ============================================================
    //  Ciclos de import: travar de vez.
    // ============================================================
    'import/no-cycle': ['error', { maxDepth: 5, ignoreExternal: true }],
  },
  ignorePatterns: [
    'node_modules/',
    'babel.config.js',
    '.eslintrc.js',
    'metro.config.js',
    'expo-env.d.ts',
  ],
};
