<!-- TOC -->

- [Get started](#get-started)
- [Usando sintaxe ES6+ - SUCRASE](#usando-sintaxe-es6---sucrase)
  - [/nodemon.json](#nodemonjson)
  - [Consertando o debug do vscode](#consertando-o-debug-do-vscode)
    - [package.json](#packagejson)
    - [Configuração do debug](#configuração-do-debug)

<!-- /TOC -->

## Get started

`yarn init -y`
`yarn add express`
`yarn add nodemon sucrase -D`

## Usando sintaxe ES6+ - SUCRASE

O Node ainda não entende a nova sintaxe do JS, então é necessário instalar
uma lib no projeto. A mais famosa é o babel, mas o professor prefere o
`sucrase`, por ser até 20x mais rápido.

`yarn add sucrase -D`

Só ficar ligado q pra rodar um arquivo, não dá mais pra usar um
`node to/myFile/myFile.js`, e sim um
`node sucrase-node to/myFile/myFile.js`.

### /nodemon.json

Este arquivo é necessário para podermos usar o sucrase.

```json
{
  "execMap": {
    "js": "node -r sucrase/register"
  }
}
```

### Consertando o debug do vscode

Quando usa o sucrase, o debug pára de funcionar. Então, é preciso fazer umas
configurações

#### package.json

Acrescente a flag --inspect no nodemon

```json
"scripts": {
"dev": "nodemon src/server.js",
"dev:debug": "nodemon --inspect src/server.js"
},
```

#### Configuração do debug

Na aba de debug do vscode, crie uma nova configuração (lá em cima em "No
Configurations").

```diff
{
  // Use IntelliSense to learn about possible attributes.
  // Hover to view descriptions of existing attributes.
  // For more information, visit: https://go.microsoft.com/fwlink/?linkid=830387
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
+      "request": "attach",
      "name": "Launch Program",
      "restart": true,
+      "protocol": "inspector"
    }
  ]
}
```

Agora, para debugar, marque um breakpoint no código, mandar um `yarn dev:debug`
e dar play no debug do vscode.
