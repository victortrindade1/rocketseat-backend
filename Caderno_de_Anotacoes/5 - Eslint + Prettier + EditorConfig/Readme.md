<!-- TOC -->

- [Eslint, Prettier e EditorConfig](#eslint-prettier-e-editorconfig)
  - [Eslint](#eslint)
    - [.eslintrc.js](#eslintrcjs)
    - [settings.json](#settingsjson)
  - [Prettier](#prettier)
    - [.prettierrc](#prettierrc)
  - [EditorConfig](#editorconfig)
    - [.editorconfig](#editorconfig)

<!-- /TOC -->

## Eslint, Prettier e EditorConfig

### Eslint

Tenha a extensão do Eslint instalada no vscode (já está provavelmente)

Instale a lib no projeto:
`yarn add eslint -D`

Inicie o arquivo de configuração:

1. `yarn eslint --init`
2. Responda umas perguntinhas tetas.
3. deleta o arquivo gerado package.lock.json, pois estamos usando o yarn
4. dê um `yarn`

#### .eslintrc.js

Aplique estas rules:

```javascript
  rules: {
    "class-methods-use-this": "off",
    "no-params-reassign": "off",
    camelcase: "off",
    "no-unused-vars": ["error", { argsIgnorePattern: "next" }]
  }
};
```

#### settings.json

Abra o settings.json do vscode e acrescente:

```json
"editor.formatOnSave": true,
  "eslint.autoFixOnSave": true,
  "eslint.validate": [
    {
      "language": "javascript",
      "autoFix": true
    },
    {
      "language": "javascriptreact",
      "autoFix": true
    },
    {
      "language": "typescript",
      "autoFix": true
    },
    {
      "language": "typescriptreact",
      "autoFix": true
    }
  ],
```

### Prettier

O prettier é como um complemento do Eslint. Parece a mesma coisa, mas na verdade não é. O foco do prettier não é buscar erros, e sim deixar o código mais bonito.

`yarn add prettier eslint-config-prettier eslint-plugin-prettier -D`

No .eslintrc.js:

```javascript
module.exports = {
  ...
  extends: ["airbnb-base", "prettier"],
  plugins: ["prettier"],

  ...
  rules: {
    ...
    "prettier/prettier": "error",
    ...
  }
};
```

#### .prettierrc

Vc pode criar o arquivo .prettierrc para fazer configurações manuais.

```json
{
  "singleQuote": true,
  "trailingComma": "es5"
}
```

### EditorConfig

Para padronizar regras de código entre plataformas (ex: sublime text com vscode), caso não esteja programando sozinho.

1. Instale a extensão no vscode.
2. na pasta raiz, com o botão auxiliar do mouse, clique em "Generate .editorconfig"

#### .editorconfig

Antes:

```
root = true

[*]
indent_style = space
indent_size = 2
charset = utf-8
trim_trailing_whitespace = false
insert_final_newline = false
```

Depois:

```diff
root = true

[*]
indent_style = space
indent_size = 2
charset = utf-8
+ trim_trailing_whitespace = true
+ insert_final_newline = true
```
