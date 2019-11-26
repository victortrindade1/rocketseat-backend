<!-- TOC -->

- [Configurando MongoDB (Docker com MongoDB)](#configurando-mongodb-docker-com-mongodb)
  - [Novo container do MongoDB](#novo-container-do-mongodb)
  - [ORM Mongoose](#orm-mongoose)
  - [src/database/index.js](#srcdatabaseindexjs)
- [Notificando novos agendamentos](#notificando-novos-agendamentos)
  - [src/app/schemas/Notifications.js](#srcappschemasnotificationsjs)
  - [src/app/controllers/AppointmentController.js](#srcappcontrollersappointmentcontrollerjs)
- [Listando notificações do usuário](#listando-notificações-do-usuário)
  - [src/routes.js](#srcroutesjs)
  - [src/app/controllers/NotificationController.js](#srcappcontrollersnotificationcontrollerjs)
- [Marcar notificações como lidas](#marcar-notificações-como-lidas)
  - [src/routes.js](#srcroutesjs-1)
  - [src/app/controllers/NotificationController.js](#srcappcontrollersnotificationcontrollerjs-1)
- [Cancelamento de Agendamento](#cancelamento-de-agendamento)
  - [src/routes.js](#srcroutesjs-2)
  - [src/app/controllers/AppointmentController.js](#srcappcontrollersappointmentcontrollerjs-1)

<!-- /TOC -->

# Configurando MongoDB (Docker com MongoDB)

Assim como existe o ORM sequelize pro Postgres, eu posso usar o `mongoose` para
o MongoDB.

Assim como existe o Postbird para ver banco do Postgres, existe o
`mongodb compass community` para ver o conteúdo do mongodb. Para usar, baixe a
versão community (gratuita) no site do mongodb.

## Novo container do MongoDB

Para criar uma nova container do MongoDB no Docker:

`docker run --name mongodatabase -p 27017:27017 -d -t mongo`

A porta do mongodb no docker é 27017, mas na sua máquina (a da direita) é
editável.
O nome `mongodatabase` tb é editável.

Para verificar os containers:

`docker ps -a`.

Outros comandos:
`docker start mongodatabase`
`docker stop mongodatabase`

## ORM Mongoose

`yarn add mongoose`

## src/database/index.js

```diff
import Sequelize from 'sequelize';
+ import mongoose from 'mongoose';

import User from '../app/models/User';
import File from '../app/models/File';
import Appointment from '../app/models/Appointment';

import databaseConfig from '../config/database';

const models = [User, File, Appointment];

class Database {
  constructor() {
    this.init();
+    this.mongo();
  }

  init() {
    this.connection = new Sequelize(databaseConfig);

    models
      .map(model => model.init(this.connection))
      .map(model => model.associate && model.associate(this.connection.models));
  }

+  mongo() {
+    this.mongoConnection = mongoose.connect(
+      'mongodb://localhost:27017/gobarber',
+      { useNewUrlParser: true, useFindAndModify: true }
+    );
+  }
}

export default new Database();
```

> Repare que estou conectando na base de dados "gobarber", mas em nenhum momento
> eu cheguei a criar esta base. Na verdade, o mongoose faz isso pra mim
> automático.

# Notificando novos agendamentos

No mongodb, não chego a fazer migrations pra criar/editar tabelas, e também não
chego a fazer models. De fato, no mongodb eu simplesmente crio outra espécie de
tabela, chamada `schema`. O schema é como uma tabela, só que não possui a
estrutura de uma tabela com colunas, e, por isso, não é um banco relacional. Ou
seja, um schema não interage com outro.

O mongodb é útil apenas em alguns casos. Como há essa limitação por não haver
relacionamentos, use o mongodb apenas para casos pontuais, onde necessitem ser
mais performáticos.

No caso do projeto atual, vou usar o mongodb apenas para gravar notificações
para mostrar os agendamentos aos prestadores de serviço.

## src/app/schemas/Notifications.js

No mongodb não tem model nem migration, apenas schemas =D

```javascript
import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: true,
    },
    user: {
      type: Number,
      required: true,
    },
    read: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Notification', NotificationSchema);
```

## src/app/controllers/AppointmentController.js

```diff
- import { startOfHour, parseISO, isBefore } from 'date-fns';
+ import { startOfHour, parseISO, isBefore, format } from 'date-fns';
+ import pt from 'date-fns/locale/pt';

+ import Notification from '../schemas/Notification';

  ...

  async store(req, res) {
    const schema = Yup.object().shape({
      provider_id: Yup.number().required(),
      date: Yup.date().required(),
    });

    ...

    const appointment = await Appointment.create({
      user_id: req.userId, // userId vem do middleware auth no momento que loga
      provider_id,
      date,
    });

+    /**
+     * Notificar prestador de serviço
+     */
+    const user = await User.findByPk(req.userId);
+    const formattedDate = format(
+      hourStart,
+      "'dia' dd 'de' MMMM', às' H:mm'h'",
+      { locale: pt }
+    );
+
+    await Notification.create({
+      content: `Novo agendamento de ${user.name} para ${formattedDate}`,
+      user: provider_id,
+    });

    return res.json(appointment);
  }
}

export default new AppointmentController();
```

# Listando notificações do usuário

O prestador do serviço poderá ver todos os agendamentos do dia.

## src/routes.js

```diff
+ import NotificationController from './app/controllers/NotificationController';

+ routes.get('/notifications', NotificationController.index);
```

## src/app/controllers/NotificationController.js

```javascript
import User from '../models/User';
import Notification from '../schemas/Notification';

class NotificationController {
  async index(req, res) {
    /**
     *  Verifica se o usuário é prestador de serviço
     */
    const checkIsProvider = await User.findOne({
      where: { id: req.userId, provider: true },
    });

    if (!checkIsProvider) {
      return res
        .status(401)
        .json({ error: 'Only providers can load notifications' });
    }

    /**
     * ######## Atenção ########
     * Método para buscar todos:
     *  Models -> findAll()
     *  Schemas -> find()
     */
    const notifications = await Notification.find({
      user: req.userId,
    })
      .sort({ createdAt: 'desc' })
      .limit(20);
    return res.json(notifications);
  }
}

export default new NotificationController();
```

# Marcar notificações como lidas

O prestador do serviço poderá marcar suas notificações de serviços como lidas.

## src/routes.js

```diff
+ routes.put('/notifications/:id', NotificationController.update);
```

## src/app/controllers/NotificationController.js

```diff
+ async update(req, res) {
+    // findByIdAndUpdate é uma função do mongoose muito boa. Encontra, insere e
+    // salva tudo tetificado pronto
+    const notification = await Notification.findByIdAndUpdate(
+      req.params.id, // id do MongoDB é um hash
+      { read: true },
+      { new: true } // new = true pra além de atualizar, me retornar atualizado
+    );
+
+    return res.json(notification);
+  }
```

# Cancelamento de Agendamento

O usuário poderá cancelar seu agendamento até 2 horas antes do horário marcado.

## src/routes.js

```diff
+ routes.delete('/appointments/:id', AppointmentController.delete);
```

## src/app/controllers/AppointmentController.js

```javascript
async delete(req, res) {
    const appointment = await Appointment.findByPk(req.params.id);

    if (appointment.user_id !== req.userId) {
      return res.status(401).json({
        error: "You don't have permission to cancel this appointment.",
      });
    }

    const dateWithSub = subHours(appointment.date, 2); // O campo de data já vem em formato de data. Não precisa de um parseIso pq não é uma string

    // 13:00
    // dateWithSub: 11h
    // now: 11:25h
    // res: horário já passou

    if (isBefore(dateWithSub, new Date())) {
      return res.status(401).json({
        error: 'You can only cancel appointments 2 hours in advance.',
      });
    }

    appointment.canceled_at = new Date();

    await appointment.save();

    return res.json(appointment);
  }
```
