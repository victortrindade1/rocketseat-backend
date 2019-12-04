<!-- TOC -->

- [Validação de Entrada](#validação-de-entrada)
  - [Yup](#yup)
    - [Exemplo 1 - UserController](#exemplo-1---usercontroller)
    - [Exemplo 2 - SessionController](#exemplo-2---sessioncontroller)

<!-- /TOC -->

# Validação de Entrada

Para fazer validação de entrada no backend, vamos tetificar usando uma lib
chamada `Yup`. Em vez de ficarmos sofrendo fazendo validações, o mundo traz esta
teta.

> O interessante do Yup é que podemos criar condicionais na validação, usando a
> própria lib do yup

## Yup

`yarn add yup`

O yup não tem na lib um `export default`, logo, vc não consegue importar da
forma tradicional `Import Yup from 'yup';`. Em vez disso, vc deve importar assim:

`Import * as Yup from 'yup';`

### Exemplo 1 - UserController

Path: src/app/controllers/UserController.js

Antes:

```javascript
import User from '../models/User';

class UserController {
  async store(req, res) {
    const userExists = await User.findOne({ where: { email: req.body.email } });

    if (userExists) {
      return res.status(400).json({ error: 'User already exists.' });
    }

    // Em vez de carregar na response todos os dados de User, eu escolho carregar estes 4
    const { id, name, email, provider } = await User.create(req.body);

    return res.json({
      id,
      name,
      email,
      provider,
    });
  }

  async update(req, res) {
    const { email, oldPassword } = req.body;

    const user = await User.findByPk(req.userId);

    if (email !== user.email) {
      const userExists = await User.findOne({ where: { email } });

      if (userExists) {
        return res.status(400).json({ error: 'User already exists.' });
      }
    }

    if (oldPassword && !(await user.checkPassword(oldPassword))) {
      return res.status(401).json({ error: 'Password does not match' });
    }

    const { id, name, provider } = await user.update(req.body);

    return res.json({
      id,
      name,
      email,
      provider,
    });
  }
}

export default new UserController();
```

Depois:

```diff
+import * as Yup from 'yup';
import User from '../models/User';

class UserController {
  async store(req, res) {
+    const schema = Yup.object().shape({
+      name: Yup.string().required(),
+      email: Yup.string()
+        .email()
+        .required(),
+      password: Yup.string()
+        .required()
+        .min(6),
+    });
+
+    if (!(await schema.isValid(req.body))) {
+      return res.status(400).json({ error: 'Validation fails' });
+    }

    const userExists = await User.findOne({ where: { email: req.body.email } });

    if (userExists) {
      return res.status(400).json({ error: 'User already exists.' });
    }

    // Em vez de carregar na response todos os dados de User, eu escolho carregar estes 4
    const { id, name, email, provider } = await User.create(req.body);

    return res.json({
      id,
      name,
      email,
      provider,
    });
  }

  async update(req, res) {
+    const schema = Yup.object().shape({
+      name: Yup.string(),
+      email: Yup.string().email(),
+      oldPassword: Yup.string().min(6),
+      // Condicional: Se for passado um oldPassword, então o campo password é
+      // obrigatório
+      password: Yup.string()
+        .min(6)
+        .when('oldPassword', (oldPassword, field) =>
+          oldPassword ? field.required() : field
+        ),
+      // Condicional: confirmPassword = password
+      confirmPassword: Yup.string().when('password', (password, field) =>
+        password ? field.required().oneOf([Yup.ref('password')]) : field
+      ),
+    });
+
+    if (!(await schema.isValid(req.body))) {
+      return res.status(400).json({ error: 'Validation fails' });
+    }

    const { email, oldPassword } = req.body;

    const user = await User.findByPk(req.userId);

    if (email !== user.email) {
      const userExists = await User.findOne({ where: { email } });

      if (userExists) {
        return res.status(400).json({ error: 'User already exists.' });
      }
    }

    if (oldPassword && !(await user.checkPassword(oldPassword))) {
      return res.status(401).json({ error: 'Password does not match' });
    }

    const { id, name, provider } = await user.update(req.body);

    return res.json({
      id,
      name,
      email,
      provider,
    });
  }
}

export default new UserController();
```

### Exemplo 2 - SessionController

Path: src/app/controllers/SessionController.js

Antes:

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

Depois:

```diff
+import * as Yup from 'yup';
import jwt from 'jsonwebtoken';
import authConfig from '../../config/auth';
import User from '../models/User';

class SessionController {
  // Método store -> cria nova session]
  // Repare q store não necessariamente significa gravar algo no banco

  async store(req, res) {
+    const schema = Yup.object().shape({
+      email: Yup.string()
+        .email()
+        .required(),
+      password: Yup.string().required(),
+    });
+
+    if (!(await schema.isValid(req.body))) {
+      return res.status(400).json({ error: 'Validation fails' });
+    }

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
