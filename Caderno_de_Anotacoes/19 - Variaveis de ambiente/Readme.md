<!-- TOC -->

- [Variáveis de ambiente](#variáveis-de-ambiente)
  - [.gitignore](#gitignore)
  - [.env](#env)
  - [dotenv](#dotenv)
    - [src/app.js](#srcappjs)
    - [src/queue.js](#srcqueuejs)
    - [src/config/database.js](#srcconfigdatabasejs)
    - [src/app/models/File.js](#srcappmodelsfilejs)
    - [src/config/auth.js](#srcconfigauthjs)
    - [src/database/index.js](#srcdatabaseindexjs)
    - [src/config/redis.js](#srcconfigredisjs)
    - [src/config/mail.js](#srcconfigmailjs)
    - [src/config/sentry.js](#srcconfigsentryjs)
  - [.env.example](#envexample)

<!-- /TOC -->

# Variáveis de ambiente

As variáveis de ambiente são as variáveis que mudam de sistema para sistema, ou
seja, são variáveis q mudam enquanto em desenvolvimento e produção, ou mesmo
mudam ao mudar de servidor, ou até mesmo mudam entre desenvolvedores. São as
senhas de databases, URLs, tudo q vc precisa se preocupar ao trocar de máquina
seu projeto.

Para lidar com as variáveis de ambiente, crie um arquivo `.env` no root do seu
projeto e coloque no `.gitignore` pois é o arquivo de informações sensíveis.

## .gitignore

```diff
node_modules
yarn.lock
+ .env
```

## .env

```
APP_URL=http://localhost:3333
NODE_ENV=development

# Auth

APP_SECRET=eb8f7b80ca95741e6d69c8905a64fa7e

# Database

DB_HOST=localhost
DB_USER=postgres
DB_PASS=docker
DB_NAME=gobarber

# Mongo

MONGO_URL=mongodb://localhost:27017/gobarber

# Redis

REDIS_HOST=127.0.0.1
REDIS_POST=6379

# Mail

MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USER=87386315217281
MAIL_PASS=4fa5d0a5dedb9e

# Sentry
#
# ********** Somente para produção **********
#
# SENTRY_DSN=https://a1d21d5b328a403d95f04f593586d03c@sentry.io/1847047
#
SENTRY_DSN=
```

## dotenv

Existe uma lib para gerenciar suas variáveis de ambiente, o `dotenv`.

`yarn add dotenv`

Após instalar, vc precisará colocar o `dotenv/config` em todos os arquivos que
de alguma forma sejam processos no core do pc. Neste projeto, são eles:

- src/app.js
- src/queue.js
- src/config/database.js

Agora, todas as variáveis de ambiente serão chamadas por
`process.env.MY_ENV_VAR`.

### src/app.js

> Fique atento: Este deve ser o primeiro import do app.js

Mais abaixo, eu tirei o debug do usuário, passei apenas para mostrar em
desenvolvimento.

```diff
+ import 'dotenv/config';

import express from 'express';
import * as Sentry from '@sentry/node';
import path from 'path';
import Youch from 'youch';
import 'express-async-errors';

...

  exceptionHandler() {
    this.server.use(async (err, req, res, next) => {
-      const errors = await new Youch(err, req).toJSON();
-
-      return res.status(500).json(errors);
+      if (process.env.NODE_ENV === 'development') {
+        const errors = await new Youch(err, req).toJSON();
+
+        return res.status(500).json(errors);
+      }
+
+      return res.status(500).json({ error: 'Internal server error' });
    });
  }
```

### src/queue.js

A fila processa em modo separado do app.js, portanto tb precisa de importar o
`dotenv/config`

```diff
+ import 'dotenv/config';

import Queue from './lib/Queue';

Queue.processQueue();
```

### src/config/database.js

Tb precisa do `dotenv/config` no database, mas aqui não posso usar JS6+,
portanto use o `require`.

```diff
+ require('dotenv/config');

module.exports = {
  dialect: 'postgres',
-  host: 'localhost',
-  username: 'postgres',
-  password: 'docker',
-  database: 'gobarber',
+  host: process.env.DB_HOST,
+  username: process.env.DB_USER,
+  password: process.env.DB_PASS,
+  database: process.env.DB_NAME,
  define: {
    timestamp: true,
    underscored: true,
    underscoredAll: true,
  },
};
```

### src/app/models/File.js

```diff
url: {
  type: Sequelize.VIRTUAL,
  get() {
-    return `http://localhost:3333/files/${this.path}`;
+    return `${process.env.APP_URL}/files/${this.path}`;
  },
},
```

### src/config/auth.js

```diff
export default {
-  secret: 'eb8f7b80ca95741e6d69c8905a64fa7e',
+  secret: process.env.APP_SECRET,
  expiresIn: '7d',
};
```

### src/database/index.js

```diff
  mongo() {
-    this.mongoConnection = mongoose.connect(
-      'mongodb://localhost:27017/gobarber',
-      {
+    this.mongoConnection = mongoose.connect(process.env.MONGO_URL, {
        useNewUrlParser: true,
        useFindAndModify: true,
        useUnifiedTopology: true,
      }
    );
  }
```

### src/config/redis.js

```diff
export default {
-  host: '127.0.0.1',
-  port: 6379,
+  host: process.env.REDIS_HOST,
+  port: process.env.REDIS_PORT,
};
```

### src/config/mail.js

```diff
// Visite mailtrap.io
export default {
-  host: 'smtp.mailtrap.io',
-  port: 2525,
+  host: process.env.MAIL_HOST,
+  port: process.env.MAIL_PORT,
  secure: false,
  auth: {
-    user: '87386315217281',
-    pass: '4fa5d0a5dedb9e',
+    user: process.env.MAIL_USER,
+    pass: process.env.MAIL_PASS,
  },
  default: {
    from: 'Equipe GoBaraber <noreply@gobarber.com>',
  },
};
```

### src/config/sentry.js

```diff
export default {
-  dsn: 'https://a1d21d5b328a403d95f04f593586d03c@sentry.io/1847047',
+  dsn: process.env.SENTRY_DSN,
};
```

## .env.example

Uma boa prática é criar um arquivo `.env.example` no root, e retirar todas as
informações sensíveis e deixar apenas as padrões. Dessa forma, outro
desenvolvedor que pegar o projeto, criará um arquivo `.env` e preencherá apenas
as informações sensíveis.

```
APP_URL=http://localhost:3333
NODE_ENV=development

# Auth

APP_SECRET=eb8f7b80ca95741e6d69c8905a64fa7e

# Database

DB_HOST=
DB_USER=
DB_PASS=
DB_NAME=

# Mongo

MONGO_URL=

# Redis

REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# Mail

MAIL_HOST=
MAIL_PORT=
MAIL_USER=
MAIL_PASS=

# Sentry

SENTRY_DSN=
```
