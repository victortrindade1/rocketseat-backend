<!-- TOC -->

- [Sequelize](#sequelize)
  - [sequelize-cli](#sequelize-cli)
    - [Usage](#usage)
  - [Migrations](#migrations)
    - [/src/database/index.js (o loader dos models)](#srcdatabaseindexjs-o-loader-dos-models)
      - [src/app.js](#srcappjs)
    - [Create Table](#create-table)
    - [Migrate](#migrate)
  - [Sequelize Seeds](#sequelize-seeds)
    - [Criar um user admin com o seeds](#criar-um-user-admin-com-o-seeds)
  - [Arquitetura MVC (Model, View, Controller)](#arquitetura-mvc-model-view-controller)
  - [Controllers](#controllers)
  - [Models](#models)
    - [/src/app/models/User.js](#srcappmodelsuserjs)
  - [Configurando o Sequelize](#configurando-o-sequelize)
    - [.sequelizerc](#sequelizerc)
    - [Postgres c/ Sequelize](#postgres-c-sequelize)
    - [/src/config/database.js](#srcconfigdatabasejs)

<!-- /TOC -->

# Sequelize

O Sequelize é um ORM. ORMs são manipuladores de bancos de dados. Eles tetificam
os bancos, onde nós, seres superiores, paramos de usar o SQL.

`yarn add sequelize`

Exemplo:

- Com SQL

```SQL
INSERT INTO users (name, email)
  VALUES (
    "Foobar",
    "foo@bar.com"
  )
```

- Com Sequelize:

```javascript
User.create({
  name: 'Foobar',
  email: 'foo@bar.com',
});
```

- Com SQL:

```SQL
SELECT *
FROM users
WHERE email = "foo@bar.com"
LIMIT 1
```

- Com Sequelize:

```javascript
User.findOne({
  where: {
    email: 'foo@bar.com',
  },
});
```

## sequelize-cli

O sequelize cli permite executar o sequelize por linha de comando no terminal.

`yarn add sequelize-cli -D`

### Usage

`yarn sequelize <comand>`

Commands:

```
sequelize db:migrate ----- Run pending migrations
sequelize db:migrate:schema:timestamps:add ----- Update migration table to have timestamps
sequelize db:migrate:status ----- List the status of all migrations
sequelize db:migrate:undo ----- Reverts a migration
sequelize db:migrate:undo:all ----- Revert all migrations ran
sequelize db:seed ----- Run specified seeder
sequelize db:seed:undo ----- Deletes data from the database
sequelize db:seed:all ----- Run every seeder
sequelize db:seed:undo:all ----- Deletes data from the database
sequelize db:create ----- Create database specified by configuration
sequelize db:drop ----- Drop database specified by configuration
sequelize init ----- Initializes project
sequelize init:config ----- Initializes configuration
sequelize init:migrations ----- Initializes migrations
sequelize init:models ----- Initializes models
sequelize init:seeders ----- Initializes seeders
sequelize migration:generate ----- Generates a new migration file [Sinônimo: migration:create]
sequelize model:generate ----- Generates a model and its migration [Sinônimo: model:create]
sequelize seed:generate ----- Generates a new seed file [Sinônimo: seed:create]
```

Options:

```
--version ----- Show version number [boolean]
--help ----- Show help [boolean]
```

## Migrations

- Controla a versão do banco de dados;
- Cada arquivo contém instruções para criação, alteração ou remoção de tabelas
  ou colunas;
- Mantém a base atualizada entre todos os desenvolvedores do time, e também no
  ambiente de produção;
- Cada arquivo é uma migration, e sua ordenação ocorre por data.
- Jamais edite uma migration. Se precisar editar, crie uma nova.
- É possível desfazer a migration se errarmos algo.
- Cada migration é pra cada tabela. Se tiver 3 tabelas, use 3 migrations.

Crie a pasta /src/database/migrations/

### /src/database/index.js (o loader dos models)

Todo model criado, vc tem q vir aqui atualizar o array models.

```javascript
import Sequelize from 'sequelize';

import User from '../app/models/User';

import databaseConfig from '../config/database';

const models = [User];

class Database {
  constructor() {
    this.init();
  }

  init() {
    this.connection = new Sequelize(databaseConfig);

    models
      .map(model => model.init(this.connection))
      .map(model => model.associate && model.associate(this.connection.models));
  }
}

export default new Database();
```

#### src/app.js

```diff
import express from 'express';
import routes from './routes';

+import './database';

class App {
  constructor() {
    this.server = express();
```

### Create Table

`yarn sequelize migration:generate --name=create-users`

Aqui iniciei uma migration, e dei um nome à migration. Esta migration gera um
arquivo "em branco" em /src/database/migrations/. Este arquivo pode ser uma
criação de tabela, ou algum outro descrito ali acima.

Migration gerada:

```javascript
'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {},

  down: (queryInterface, Sequelize) => {},
};
```

Acrescente os campos da tabela:

```javascript
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('users', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      name: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      email: {
        allowNull: false,
        unique: true,
        type: Sequelize.STRING,
      },
      password_hash: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('users');
  },
};
```

### Migrate

Após finalizar a criação de uma migration, temos q migrar para q execute o SQL.

`yarn sequelize db:migrate`

## Sequelize Seeds

O sequelize possui uma lib de seeds para banco. A lib cria dados fictícios no
banco pra facilitar o desenvolvimento.

### Criar um user admin com o seeds

Essa funcionalidade serve para criarmos registros na base de dados de forma
automatizada.

Um jeito muito massa de ter um user admin num sistema é criando um user admin
pelo próprio seeds. O q vai salvar no banco é o hash, mas a senha vai estar
dentro do código! Confere ae:

`yarn sequelize seed:generate --name admin-user`

/src/database/seeds/20191105182020-admin-user.js:

```javascript
const bcrypt = require('bcryptjs');

module.exports = {
  up: QueryInterface => {
    return QueryInterface.bulkInsert(
      'users',
      [
        {
          name: 'Administrador',
          email: 'foo@bar.com',
          password_hash: bcrypt.hashSync('123456', 8),
          created_at: new Date(),
          updated_at: new Date(),
        },
      ],
      {}
    );
  },

  down: () => {},
};
```

`yarn sequelize db:seed:all`

## Arquitetura MVC (Model, View, Controller)

- Models -> são as tabelas. Cada model é uma tabela;
- Views -> view é o q o usuário vê. No caso do backend, é o arquivo JSON q retorna.
- Controllers -> São as regras de negócio (inserir, editar...)

Crie as pastas:

```
/src/app/controllers/
/src/app/models/
```

## Controllers

São 5 os métodos possíveis a um controller. Se vc criou um sexto, vc tá errado!

São classes. Sempre retornam um JSON. Não chama outro controller.

Ex:

```javascript
class UserController {
  index() {} // Listagem de usuários
  show() {} // Exibir um único usuário
  store() {} // Cadastrar usuário
  update() {} // Alterar usuário
  delete() {} // Remover usuário
}
```

## Models

Por mais q vc crie uma tabela pela migration, vc tb tem q escrever os ítens da
tabela num model, porém, de uma forma diferente. Aqui, não entram as colunas com
preenchimento automático, como "id", "created_at" e "updated_at".

### /src/app/models/User.js

```javascript
import Sequelize, { Model } from 'sequelize';

class User extends Model {
  static init(sequelize) {
    super.init(
      {
        name: Sequelize.STRING,
        email: Sequelize.STRING,
        password_hash: Sequelize.STRING,
        provider: Sequelize.BOOLEAN,
      },
      // Necessário passar um objeto com o sequelize como segundo parâmetro. Tb
      // existem muitos outros métodos que podem passar junto com o sequelize.
      // Para vê-los, use a intellisense do vscode, clicando em Ctrl + <espaço>
      {
        sequelize,
      }
    );
    return this;
  }
}

export default User;
```

> Bug: se vc não colocar `return this` no método estático `init`, vai dar erro
> se vc precisar associar tabelas. Então não esqueça do return this.

## Configurando o Sequelize

### .sequelizerc

Como os diretórios são separados de forma diferente nos SOs (ex: windows é \, já
no iOs é /), esse arquivo resolve este problema com as paths que iremos
trabalhar no sequelize.

```javascript
const { resolve } = require('path'); // para ser compatível com todos os SOs.

module.exports = {
  config: resolve(__dirname, 'src', 'config', 'database.js'), // /src/config/database.js
  'models-path': resolve(__dirname, 'src', 'app', 'models'), // /src/app/models/
  'migrations-path': resolve(__dirname, 'src', 'database', 'migrations'), // /src/database/migrations/
  'seeders-path': resolve(__dirname, 'src', 'database', 'seeds'), // /src/database/seeds/
};
```

### Postgres c/ Sequelize

`yarn add pg pg-hstore`

### /src/config/database.js

```javascript
module.exports = {
  dialect: 'postgres',
  host: 'localhost',
  username: 'postgres',
  password: 'docker',
  database: 'gobarber',
  define: {
    timestamp: true,
    underscored: true,
    underscoredAll: true,
  },
};
```
