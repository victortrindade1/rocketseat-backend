# Cors

Este tópico não foi tratado no backend do curso, apenas qnd chegamos na fase 5.

O `cors` impede q outros apps acessem o seu backend, protegendo-o.

`yarn add cors`

Por enquanto, o cors vai ficar em branco, pois não hospedamos ainda a aplicação.
Após sabermos, passamos desse jeito:

```javascript
import cors from 'cors';

class App {
  ...
  middlewares() {
    ...
    this.server.use(cors({ origin: 'https://foobar.com.br' }));
    ...
  }
}
```

## src/app.js

```diff
import 'dotenv/config';

import express from 'express';
import * as Sentry from '@sentry/node';
import path from 'path';
+ import cors from 'cors';
import Youch from 'youch';
import 'express-async-errors';

import sentryConfig from './config/sentry';
import routes from './routes';

import './database';

// O professor disse não gostar de usar "class" no frontend, mas no backend é
// muito bom de usar, usa bastante.
class App {
  constructor() {
    this.server = express();

    Sentry.init(sentryConfig);

    this.middlewares();
    this.routes();
    this.exceptionHandler();
  }

  middlewares() {
    this.server.use(Sentry.Handlers.requestHandler());
+   this.server.use(cors());
    this.server.use(express.json());
    // Para o express aceitar acessar arquivos estáticos por url
    this.server.use(
      '/files',
      express.static(path.resolve(__dirname, '..', 'tmp', 'uploads'))
    );
  }

  routes() {
    this.server.use(routes);
    this.server.use(Sentry.Handlers.errorHandler());
  }

  exceptionHandler() {
    this.server.use(async (err, req, res, next) => {
      if (process.env.NODE_ENV === 'development') {
        const errors = await new Youch(err, req).toJSON();

        return res.status(500).json(errors);
      }

      return res.status(500).json({ error: 'Internal server error' });
    });
  }
}

// Exporto apenas o server da classe, e não a classe toda, pois traz segurança
export default new App().server;
```
