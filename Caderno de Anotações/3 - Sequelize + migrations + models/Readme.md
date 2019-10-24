# Sequelize

O Sequelize é um ORM. ORMs são manipuladores de bancos de dados. Eles tetificam
os bancos, onde nós, seres superiores, paramos de usar o SQL.

`yarn add sequelize`

Exemplo:

- Com SQL

```
INSERT INTO users (name, email)
  VALUES (
    "Foobar",
    "foo@bar.com"
  )
```

- Com Sequelize:

```
User.create({
  name: "Foobar",
  email: "foo@bar.com"
})
```

- Com SQL:

```
SELECT *
FROM users
WHERE email = "foo@bar.com"
LIMIT 1
```

- Com Sequelize:

```
User.findOne({
  where: {
    email: "foo@bar.com"
  }
})
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
--version ----- Show version number [boolean]
--help ----- Show help [boolean]

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

Todo model criado, vc tem q vir aqui atualizar o vetor.

```
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

    models.map(model => model.init(this.connection));
  }
}

export default new Database();
```

### Create Table

`yarn sequelize migration:generate --name=create-users`

Aqui iniciei uma migration, e dei um nome à migration. Esta migration gera um
arquivo "em branco" em /src/database/migrations/. Este arquivo pode ser uma
criação de tabela, mas creio q possa ser tb outros comandos no banco (ainda não
sei).

Migration gerada:

```
'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {

  },

  down: (queryInterface, Sequelize) => {

  }
};
```

Acrescente os campos da tabela:

```
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('users', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        allowNull: false,
        type: Sequelize.STRING
      },
      email: {
        allowNull: false,
        unique: true,
        type: Sequelize.STRING
      },
      password_hash: {
        type: Sequelize.STRING,
        allowNull: false,
      },
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('users')
  },
};
```

### Migrate

Após finalizar a criação de uma migration, temos q migrar para q execute o SQL.

`yarn sequelize db:migrate`

## Seeds - Lib pra popular base com dados fictícios

Lib q popula dados fictícios pra vc testar.

## Arquitetura MVC

M - model - são as tabelas. Cada model é uma tabela;
V - View - view é o q o usuário vê. No caso do backend, é o arquivo JSON q retorna.
C - Controller - São as regras de negócio (inserir, editar...)

Crie as pastas:
/src/app/controllers/
/src/app/models/

## Controllers

São 5 os métodos possíveis a um controller. Se vc criou um sexto, vc tá errado!

São classes. Sempre retornam um JSON. Não chama outro controller.

Ex:

```
class UserController {
  index() { } // Listagem de usuários
  show() { } // Exibir um único usuário
  store() { } // Cadastrar usuário
  update() { } // Alterar usuário
  delete() { } // Remover usuário
}
```

## Models

Por mais q vc crie uma tabela pela migration, vc tb tem q escrever os ítens da
tabela num model, porém, de uma forma diferente. Aqui, não entram as colunas com
preenchimento automático, como "id", "created_at" e "updated_at".

### /src/app/models/User.js

```
import Sequelize, { Model } from 'sequelize'

class User extends Model {
  static init(sequelize) {
    super this.init(
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
    )
  }
}

export default User
```

## Configurando o Sequelize

### .sequelizerc

Como os diretórios são separados de forma diferente nos SOs (ex: windows é \, já
no iOs é /), esse arquivo resolve este problema com as paths que iremos
trabalhar no sequelize.

```
const { resolve } = require('path'); // para ser compatível com todos os SOs.

module.exports = {
  config: resolve(__dirname, 'src', 'config', 'database.js'), // /src/config/database.js
  'models-path': resolve(__dirname, 'src', 'app', 'models'), // /src/app/models/
  'migrations-path': resolve(__dirname, 'src', 'database', 'migrations'), // /src/database/migrations/
  'seeders-path': resolve(__dirname, 'src', 'database', 'seeds'), // /src/database/seeds/
};
```

### Postgres no Sequelize

`yarn add pg pg-hstore`

### /src/config/database.js

```
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
