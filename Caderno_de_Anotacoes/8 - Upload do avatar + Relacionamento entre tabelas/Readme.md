<!-- TOC -->

- [Multer](#multer)
  - [src/config/multer.js](#srcconfigmulterjs)
  - [src/routes.js](#srcroutesjs)
  - [src/app/controllers/FileController.js](#srcappcontrollersfilecontrollerjs)
  - [src/app/models/File.js](#srcappmodelsfilejs)
  - [Relacione as tabelas users com files](#relacione-as-tabelas-users-com-files)
    - [src/database/migrations/20191114110753-add-avatar-field-to-users.js](#srcdatabasemigrations20191114110753-add-avatar-field-to-usersjs)
    - [src/app/models/User.js](#srcappmodelsuserjs)
    - [src/database/index.js](#srcdatabaseindexjs)

<!-- /TOC -->

# Multer

Para lidar com arquivos de imagem, o json não suporta. Logo, vou usar o multer,
uma lib para `multipart/form-data`.

`yarn add multer`

O multer pode ser usado com vários _storages_ diferentes, como o Amazon S3, ou o
Digital Ocean Spaces. Aqui na aplicação, vou usar com uma pasta tmp mesmo
`tmp/uploads/`.

Durante o upload, o nome do arquivo será trocado para um nome randômico.
No banco, salvarei os nomes originais e os paths para os randômicos.

## src/config/multer.js

```javascript
import multer from 'multer';
import crypto from 'crypto';
import { extname, resolve } from 'path';

export default {
  storage: multer.diskStorage({
    destination: resolve(__dirname, '..', '..', 'tmp', 'uploads'),
    filename: (req, file, cb) => {
      crypto.randomBytes(16, (err, res) => {
        if (err) return cb(err);

        return cb(null, res.toString('hex') + extname(file.originalname));
      });
    },
  }),
};
```

## src/routes.js

```diff
import { Router } from 'express';
+ import multer from 'multer';
+ import multerConfig from './config/multer';

import UserController from './app/controllers/UserController';
import SessionController from './app/controllers/SessionController';

import authMiddleware from './app/middlewares/auth';

const routes = new Router();
+ const upload = multer(multerConfig);

routes.post('/users', UserController.store);
routes.post('/sessions', SessionController.store);

routes.use(authMiddleware);

routes.put('/users', UserController.update);

+ routes.post('/files', upload.single('file'), FileController.store);

export default routes;
```

## src/app/controllers/FileController.js

```javascript
import File from '../models/File';

class FileController {
  async store(req, res) {
    const { originalname: name, filename: path } = req.file;

    const file = await File.create({
      name,
      path,
    });

    return res.json(file);
  }
}

export default new FileController();
```

## src/app/models/File.js

```javascript
import Sequelize, { Model } from 'sequelize';

class File extends Model {
  static init(sequelize) {
    super.init(
      {
        name: Sequelize.STRING,
        path: Sequelize.STRING,
      },
      {
        sequelize,
      }
    );

    return this;
  }
}

export default File;
```

## Relacione as tabelas users com files

### src/database/migrations/20191114110753-add-avatar-field-to-users.js

Crie o campo avatar na tabela _users_, e relacione com o id do avatar da
tabela _files_.

```javascript
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('users', 'avatar_id', {
      type: Sequelize.INTEGER,
      references: { model: 'files', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      allowNull: true,
    });
  },

  down: queryInterface => {
    return queryInterface.removeColumn('users', 'avatar_id');
  },
};
```

### src/app/models/User.js

Faça o relacionamento entre as tabelas.

```diff
    this.addHook('beforeSave', async user => {
      if (user.password) {
        const userEncrypted = user;
        userEncrypted.password_hash = await bcrypt.hash(user.password, 8);
      }
    });

    return this;
  }

+  static associate(models) {
+    this.belongsTo(models.File, { foreignKey: 'avatar_id' });
+  }

  checkPassword(password) {
    return bcrypt.compare(password, this.password_hash);
  }
```

> O relacionamento `belongsTo` é um relacionamento One to One. Existe tb o
> `hasOne` q tb é One to One. A diferença não muda a forma como o banco
> interage, muda apenas qual model será chamado.

> Existem outros relacionamentos, como o `hasToMany`, `belongsToMany`.

### src/database/index.js

Sem essa adição no index do database, ele não relaciona tabelas.

```diff
class Database {
  constructor() {
    this.init();
  }

  init() {
    this.connection = new Sequelize(databaseConfig);

    models
      .map(model => model.init(this.connection))
+      .map(model => model.associate && model.associate(this.connection.models));
  }
}

export default new Database();
```
