# Ajustes na API - avatar

## src/app/controllers/SessionController.js

O avatar vai carregar na Session Controller. Assim q o usuário loga, vai
aparecer o avatar do usuário no Header da aplicação.

Outra modificação é q vai carregar na Session o provider. Isso pq só providers
podem abrir sessão na aplicação, uma vez q os usuários só vão usar a versão
mobile.

```diff
import * as Yup from 'yup';
import jwt from 'jsonwebtoken';
import authConfig from '../../config/auth';
import User from '../models/User';
+import File from '../models/File';

class SessionController {
  // Método store -> cria nova session]
  // Repare q store não necessariamente significa gravar algo no banco
  async store(req, res) {
    const schema = Yup.object().shape({
      email: Yup.string()
        .email()
        .required(),
      password: Yup.string().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const { email, password } = req.body;

    const user = await User.findOne({
      where: { email },
+      include: [
+        {
+          model: File,
+          as: 'avatar',
+          attributes: ['id', 'path', 'url'],
+        }
+      ]
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    if (!(await user.checkPassword(password))) {
      return res.status(401).json({ error: 'Password does not match' });
    }

-    const { id, name } = user;
+    const { id, name, avatar, provider } = user;

    return res.json({
      user: {
        id,
        name,
        email,
+        avatar,
+        provider
      },
      token: jwt.sign({ id }, authConfig.secret, {
        expiresIn: authConfig.expiresIn,
      }),
    });
  }
}

export default new SessionController();
```

## src/app/controllers/UserController.js

Na tela de edição do usuário, qnd o usuário editar o avatar, vai carregar o novo
avatar no Header da aplicação.

```diff
import * as Yup from 'yup';
import User from '../models/User';
+ import File from '../models/File';

class UserController {
  async store(req, res) {
    const schema = Yup.object().shape({
      name: Yup.string().required(),
      email: Yup.string()
        .email()
        .required(),
      password: Yup.string()
        .required()
        .min(6),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

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
    const schema = Yup.object().shape({
      name: Yup.string(),
      email: Yup.string().email(),
      oldPassword: Yup.string().min(6),
      // Condicional: Se for passado um oldPassword, então o campo password é
      // obrigatório
      password: Yup.string()
        .min(6)
        .when('oldPassword', (oldPassword, field) =>
          oldPassword ? field.required() : field
        ),
      // Condicional: confirmPassword = password
      confirmPassword: Yup.string().when('password', (password, field) =>
        password ? field.required().oneOf([Yup.ref('password')]) : field
      ),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

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

-    const { id, name, provider } = await user.update(req.body);
+    await user.update(req.body);

+    const { id, name, avatar } = await User.findByPk(req.userId, {
+      include: [
+        {
+          model: File,
+          as: 'avatar',
+          attributes: ['id', 'path', 'url'],
+        },
+      ],
+    });

    return res.json({
      id,
      name,
      email,
-     provider,
+     avatar
    });
  }
}

export default new UserController();
```

## src/app/controllers/ScheduleController.js

Uma informação não está sendo retornada, q é o nome do usuário q agendou.

```diff
import { startOfDay, endOfDay, parseISO } from 'date-fns';
import { Op } from 'sequelize';

import User from '../models/User';
import Appointment from '../models/Appointment';

class ScheduleController {
  async index(req, res) {
    // Verifica se o usuário é prestador de serviço
    const checkUserProvider = await User.findOne({
      where: { id: req.userId, provider: true },
    });

    if (!checkUserProvider) {
      return res.status(401).json({ error: 'User is not a provider' });
    }

    const { date } = req.query; // date = 2019-11-15T00:00:00-03:00
    const parsedDate = parseISO(date);

    const appointments = await Appointment.findAll({
      where: {
        provider_id: req.userId,
        canceled_at: null,
        // Mostrar somente agendamentos do dia da data da query
        date: {
          [Op.between]: [startOfDay(parsedDate), endOfDay(parsedDate)],
        },
      },
+      include: [
+        {
+          model: User,
+          as: 'user',
+          attributes: ['name'],
+        },
+      ],
      order: ['date'],
    });
    return res.json(appointments);
  }
}

export default new ScheduleController();
```
