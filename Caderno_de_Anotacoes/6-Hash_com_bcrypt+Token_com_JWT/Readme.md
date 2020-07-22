<!-- TOC -->

- [Gerar Hash](#gerar-hash)
  - [No model...](#no-model)
- [JWT (JSON Web Token)](#jwt-json-web-token)
  - [src/app/controllers/SessionController.js](#srcappcontrollerssessioncontrollerjs)
    - [src/config/auth.js](#srcconfigauthjs)
  - [Middlewares p/ autenticação](#middlewares-p-autenticação)
    - [src/app/middlewares/auth.js](#srcappmiddlewaresauthjs)
  - [Testando token no Insomnia](#testando-token-no-insomnia)

<!-- /TOC -->

# Gerar Hash

A partir da senha digitada pelo usuário no form, vamos gerar um hash, e salvar
apenas o hash e não a senha. Para gerar hash, use o `bcryptjs`.

`yarn add bcryptjs`

## No model...

Antes:

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
      {
        sequelize,
      }
    );
  }
}

export default User;
```

Depois:

```javascript
import Sequelize, { Model } from 'sequelize';
import bcrypt from 'bcryptjs';

class User extends Model {
  static init(sequelize) {
    super.init(
      {
        name: Sequelize.STRING,
        email: Sequelize.STRING,
        password: Sequelize.VIRTUAL,
        password_hash: Sequelize.STRING,
        provider: Sequelize.BOOLEAN,
      },
      {
        sequelize,
      }
    );

    this.addHook('beforeSave', async user => {
      if (user.password) {
        const userEncrypted = user;
        userEncrypted.password_hash = await bcrypt.hash(user.password, 8);
      }
    });

    return this;
  }

  checkPassword(password) {
    return bcrypt.compare(password, this.password_hash);
  }
}

export default User;
```

# JWT (JSON Web Token)

`yarn add jsonwebtoken`

O JWT é uma forma de fazer autenticação para serviços RESTful. Vc manipula o
token em formato JSON.

Com o JWT, o usuário logado possui uma chave de acesso, um token mesmo. O token
nos prova que realmente é um usuário desse sistema.

O token não pode conter a senha do usuário, pois é fácil desvendar informações
num token. Não é para isso q ele serve, não é para criptografar. É para provar q
ele veio daqui de dentro, com uma chave única vinculada a este sistema.

O JWT é dividido em 3 partes separadas por um ponto `.`:

![jwt-image](/Caderno_de_Anotacoes/6-Hash_com_bcrypt+Token_com_JWT/images/img1.png)

- Headers
  - Mostram o tipo de token. O JWT possui muitos tipos, e aqui mostra o seu.
  - É importante ter noção de onde é o header, pois usaremos isto no front-end.
- Payloads
  - São suas informações dentro do token, como id, e-mail, nome, etc.
    > **Nunca coloque senha ou outras informações sensíveis no token**
- Assinatura
  - Por mais que tentem alterar informações do payload, existe a assinatura, que
    garante que minhas informações não serão violadas.

Neste projeto, o JWT foi usado nas Sessions, q são seções do usuário logado.
As informações do usuário vêm acompanhadas do token:

## src/app/controllers/SessionController.js

Criando um novo jwt `jwt.sign` na criação de uma nova sessão:

```javascript
import jwt from 'jsonwebtoken';
import authConfig from '../../config/auth';
import User from '../models/User';

class SessionController {
  // Método store -> cria nova session]
  // Repare q store não necessariamente significa gravar algo no banco
  async store(req, res) {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    if (!(await user.checkPassword(password))) {
      return res.status(401).json({ error: 'Password does not match' });
    }

    const { id, name } = user;

    return res.json({
      user: {
        id,
        name,
        email,
      },
      token: jwt.sign({ id }, authConfig.secret, {
        expiresIn: authConfig.expiresIn,
      }),
    });
  }
}

export default new SessionController();
```

Pra organizar, foi criado um arquivo para guardar informações sensíveis `auth.js`

### src/config/auth.js

É vc q escolhe a chave de segurança q prova q o token do jwt vem realmente do
seu sistema. Essa chave foi colocada num arquivo separado para organizar. Junto,
o prazo para expirar a sessão do usuário.

```javascript
export default {
  secret: 'eb8f7b80ca95741e6d69c8905a64fa7e',
  expiresIn: '7d',
};
```

> Uma dica: tá com preguiça de escolher senha? [me acesse](https://www.md5online.org)

## Middlewares p/ autenticação

Vou usar o JWT para ver se o usuário está realmente logado.

### src/app/middlewares/auth.js

```javascript
import jwt from 'jsonwebtoken';
import { promisify } from 'util';

import authConfig from '../../config/auth';

export default async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'Token not provided' });
  }

  // Aqui estou pegando o segundo elemento do array authHeader
  const [, token] = authHeader.split(' ');

  try {
    const decoded = await promisify(jwt.verify)(token, authConfig.secret);

    req.userId = decoded.id;

    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Token invalid' });
  }
};
```

Nas rotas:

```javascript
routes.post('/users', UserController.store);
routes.post('/sessions', SessionController.store);

routes.use(authMiddleware);

routes.put('/users', UserController.update);
```

## Testando token no Insomnia

O token é um header. Vc pode empregar a informação do token na rota de 2 formas:

- Aba Auth
  1. Selecione _Bearer Token_
  2. Cole o token
     ou
- Aba Header
  1. New header = _Bearer_
  2. Value = _token_
