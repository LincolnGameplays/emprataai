module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:import/errors",
    "plugin:import/warnings",
    "plugin:import/typescript",
    "google",
    "plugin:@typescript-eslint/recommended",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: ["tsconfig.json", "tsconfig.dev.json"],
    sourceType: "module",
  },
  ignorePatterns: [
    "/lib/**/*", // Ignora arquivos compilados
    ".eslintrc.js", // Ignora a si mesmo para evitar o erro de Parsing
  ],
  plugins: [
    "@typescript-eslint",
    "import",
  ],
  rules: {
    "quotes": ["error", "double"],
    "import/no-unresolved": 0,
    "indent": ["error", 2],
    
    // --- CORREÇÕES PARA WINDOWS E AGILIDADE ---
    "linebreak-style": "off",       // Ignora erro CRLF (Windows) vs LF (Linux)
    "require-jsdoc": "off",         // Não obriga comentar todas as funções
    "valid-jsdoc": "off",           // Não valida a sintaxe estrita dos comentários
    "object-curly-spacing": "off",  // Relaxa regras de espaço dentro de {}
    "no-trailing-spaces": "off",    // Relaxa regra de espaços no fim da linha
    "eol-last": "off",              // Não obriga linha em branco no final
    "max-len": "off",               // Permite linhas longas
    "@typescript-eslint/no-explicit-any": "off", // Permite usar 'any' se precisar
  },
};
