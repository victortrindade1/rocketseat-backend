<!-- TOC -->

- [Tratamento de excessões](#tratamento-de-excessões)
  - [Sentry.io](#sentryio)
    - [src/app.js](#srcappjs)
    - [src/config/sentry.js](#srcconfigsentryjs)
  - [express-async-errors](#express-async-errors)
    - [src/app.js](#srcappjs-1)
  - [Exception Handler](#exception-handler)
    - [youch](#youch)
    - [src/app.js](#srcappjs-2)

<!-- /TOC -->

# Tratamento de excessões

Vou criar o monitoramento de erros para o app em produção. Quando colocamos um
app em produção, precisamos monitorar os erros, sem que o usuário veja qualquer
msg de debug. As duas ferramentas mais famosas para debugar app em produção:

- Sentry.io
- Bugsnag

Além de debugar app em produção, a ferramenta pode ser vinculada ao github do
time, e sempre que ocorrer um erro, automaticamente é aberta uma nova issue.

## Sentry.io

O sentry, além de fornecer uma plataforma onde vc verifica e gerencia todos os
erros, vc tb pode fazer diversas integrações, como enviar o erro por e-mail, ou
criar uma nova issue automática no github.

`yarn add @sentry/node@5.10.0` (peguei na documentação essa versão)

Para usar o Sentry enquanto o app está em produção, basta acessar a plataforma
`https://sentry.io`.

### src/app.js

A configuração a seguir tb está descrita na documentação. É simples de seguir.

```diff
import express from 'express';
+ import * as Sentry from '@sentry/node';
import path from 'path';
+ import sentryConfig from './config/sentry';
import routes from './routes';
import './database';

class App {
  constructor() {
    this.server = express();

+    Sentry.init(sentryConfig);

    this.middlewares();
    this.routes();
  }

  middlewares() {
+    this.server.use(Sentry.Handlers.requestHandler());
    this.server.use(express.json());
    // Para o express aceitar acessar arquivos estáticos por url
    this.server.use(
      '/files',
      express.static(path.resolve(__dirname, '..', 'tmp', 'uploads'))
    );
  }

  routes() {
    this.server.use(routes);
+    this.server.use(Sentry.Handlers.errorHandler());
  }
}

// Exporto apenas o server da classe, e não a classe toda, pois traz segurança
export default new App().server;
```

### src/config/sentry.js

Essa dsn eu peguei ao criar o projeto no `sentry.io`.

```javascript
export default {
  dsn: 'https://a1d21d5b328a403d95f04f593586d03c@sentry.io/1847047',
};
```

## express-async-errors

As funções assíncronas não são captadas pelo Express, e daí não podem ser
rastreadas pelo Sentry. Um jeito rápido de resolver isto é usando a lib
`express-async-errors`.

`yarn add express-async-errors`

### src/app.js

Fique atento, o express-async-errors tem que estar antes das rotas!

```diff
import path from 'path';
import sentryConfig from './config/sentry';
+ import 'express-async-errors';
import routes from './routes';

import './database';
```

## Exception Handler

Se ocorrer um erro, a request não pára de rodar até que o usuário cancele. Vou
fazer um tratamento para que não fique uma request eterna. Neste tratamento, vou
retornar o erro em formato JSON (ou HTML, se preferir) se estiver em ambiente de
desenvolvimento. Se tiver em ambiente de produção, retorna uma msg a toa
(possua o arquivo .env e instale a lib `dotenv`. Mais detalhes na pasta 19 do
Caderno de Anotações).

Para passar o erro para JSON ou HTML, vou usar a lib `youch`.

### youch

`yarn add youch`

### src/app.js

```diff
+ import Youch from 'youch';

class App {
  constructor() {
    this.server = express();

    Sentry.init(sentryConfig);

    this.middlewares();
    this.routes();
+    this.exceptionHandler();
  }

  ...

  routes() {
    this.server.use(routes);
    this.server.use(Sentry.Handlers.errorHandler());
  }

+  exceptionHandler() {
+    this.server.use(async (err, req, res, next) => {
+      if (process.env.NODE_ENV === 'development') {
+        const errors = await new Youch(err, req).toJSON();
+
+        return res.status(500).json(errors);
+      }
+
+      return res.status(500).json({ error: 'Internal server error' });
+    });
+  }
}

export default new App().server;
```
