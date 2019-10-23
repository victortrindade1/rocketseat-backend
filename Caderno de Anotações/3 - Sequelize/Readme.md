## Sequelize

O Sequelize é um ORM. ORMs são manipuladores de bancos de dados. Eles tetificam
os bancos, onde nós, seres superiores, paramos de usar o SQL.

`yarn add sequelize`

Com SQL:

```
INSERT INTO users (name, email)
  VALUES (
    "Foobar",
    "foo@bar.com"
  )
```

Com Sequelize:

```
User.create({
  name: "Foobar",
  email: "foo@bar.com"
})
```

Com SQL:

```
SELECT *
FROM users
WHERE email = "foo@bar.com"
LIMIT 1
```

Com Sequelize:

```
User.findOne({
  where: {
    email: "foo@bar.com"
  }
})
```

### sequelize-cli

O sequelize cli é uma interface gráfica pra tetificar o sequelize.

`yarn add sequelize-cli -D`

### Migrations

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

#### Create Table

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
      }
    })
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('users')
  }
}
```

### Seeds - Lib pra popular base com dados fictícios

Lib q popula dados fictícios pra vc testar.

### Arquitetura MVC

M - model - são as tabelas. Cada model é uma tabela;
V - View - view é o q o usuário vê. No caso do backend, é o arquivo JSON q retorna.
C - Controller - São as regras de negócio (inserir, editar...)

Crie as pastas:
/src/app/controllers/
/src/app/models/

#### Controllers

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

### Configurando o Sequelize

#### .sequelizerc

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

#### Postgres no Sequelize

`yarn add pg pg-hstore`

#### /src/config/database.js

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
