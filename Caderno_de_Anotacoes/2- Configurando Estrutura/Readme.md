<!-- TOC -->

- [A partir do projeto vazio...](#a-partir-do-projeto-vazio)
  - [/src/app.js](#srcappjs)
  - [/src/server.js](#srcserverjs)
  - [/src/routes.js](#srcroutesjs)

<!-- /TOC -->

# A partir do projeto vazio...

Crie a pasta /src/ e os arquivos:

```
/src/app.js
/src/server.js
/src/routes.js
```

## /src/app.js

```javascript
import express from 'express';
import routes from './routes';
// import './database'; (só depois com sequelize)

// O professor disse não gostar de usar "class" no frontend, mas no backend é
// muito bom de usar, usa bastante.
class App {
  constructor() {
    this.server = express();

    this.middlewares();
    this.routes();
  }

  middlewares() {
    this.server.use(express.json());
  }

  routes() {
    this.server.use(routes);
  }
}

// Exporto apenas o server da classe, e não a classe toda, pois traz segurança
export default new App().server;
```

## /src/server.js

```javascript
// O server.js faço separado do App, pq qnd eu fizer testes unitários, não
// chegarei a conectar o servidor por porta
import app from './app';

app.listen(3333);
```

## /src/routes.js

```javascript
import { Router } from 'express';

import UserController from './app/controllers/UserController';

const routes = new Router();

routes.get('/', (req, res) => {
  return res.json({ message: 'hello world!' });
});

export default routes;
```
