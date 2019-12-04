<!-- TOC -->

- [Configurando fila com Redis](#configurando-fila-com-redis)
  - [Redis pelo Docker](#redis-pelo-docker)
  - [src/config/redis.js](#srcconfigredisjs)
  - [Bee Queue](#bee-queue)
    - [src/queue.js](#srcqueuejs)
    - [src/lib/Queue.js](#srclibqueuejs)
    - [package.json](#packagejson)
  - [src/app/jobs/](#srcappjobs)
    - [src/app/jobs/CancellationMail.js](#srcappjobscancellationmailjs)
  - [src/app/controllers/AppointmentController.js](#srcappcontrollersappointmentcontrollerjs)
- [Monitorando falhas nas filas](#monitorando-falhas-nas-filas)
  - [src/lib/Queue.js](#srclibqueuejs-1)

<!-- /TOC -->

# Configurando fila com Redis

Nós usaremos agora um novo tipo de banco de dados, o Redis. O Redis é um banco
diferente, pois não possui schemas, tabelas. É um banco do tipo chave-valor.
Isto quer dizer que vc salva no banco valores string vinculados a ponteiros
(chaves). É na verdade um grande arrayzão com todos os valores, e este array
fica armazenado na memória RAM. Por isso é extremamente rápido, porém, se tiver
muitos dados no Redis, vai deixar a memória RAM lotada.

No projeto GoBarber, o papel do Redis é o de criar uma fila de envio de e-mail.
Sempre que um usuário cancela um atendimento, é disparado um e-mail para o
prestador do serviço. Sem o Redis, ao rodar o método `Mail.sendMail`, demora
alguns segundos até concluir. Logo, nossa intenção é rodar o envio de e-mail em
background enquanto o usuário mexe, para conforto dele e melhorando a
performance do sistema.

## Redis pelo Docker

Crie um container Redis.

`docker run --name redisbarber -p 6379:6379 -d -t redis:alpine`

## src/config/redis.js

```javascript
export default {
  host: '127.0.0.1',
  port: 6379,
};
```

## Bee Queue

A lib Bee Queue é uma lib de controle de filas em background pelo Node.

`yarn add bee-queue`

### src/queue.js

```javascript
import Queue from './lib/Queue';

Queue.processQueue();
```

### src/lib/Queue.js

Cada trabalho em background tem de ter uma fila própria, escalonada na
`const jobs`.

No projeto, foi adicionada a fila CancellationMail.

```javascript
import Bee from 'bee-queue';
import CancellationMail from '../app/jobs/CancellationMail';
import redisConfig from '../config/redis';

const jobs = [CancellationMail];

class Queue {
  constructor() {
    this.queues = {};

    this.init();
  }

  init() {
    jobs.forEach(({ key, handle }) => {
      this.queues[key] = {
        bee: new Bee(key, {
          redis: redisConfig,
        }),
        handle,
      };
    });
  }

  add(queue, job) {
    return this.queues[queue].bee.createJob(job).save();
  }

  processQueue() {
    jobs.forEach(job => {
      const { bee, handle } = this.queues[job.key];

      bee.process(handle);
    });
  }
}

export default new Queue();
```

### package.json

Para rodar as filas em background, vc usa outro Core do pc, separado do
programa, por isto é necessário rodar o script das queues.

```diff
  "scripts": {
    "dev": "nodemon src/server.js",
    "dev:debug": "nodemon --inspect src/server.js",
+    "queue": "nodemon src/queue.js"
  },
```

No terminal: `yarn queue`

## src/app/jobs/

Todo trabalho em background é apelidado de `job`. Portanto, a pasta
`src/app/jobs` contém todos os serviços em background.

### src/app/jobs/CancellationMail.js

```javascript
import { format, parseISO } from 'date-fns';
import pt from 'date-fns/locale/pt';
import Mail from '../../lib/Mail';

class CancellationMail {
  // O get dá a liberdade de chamarmos o valor do método sem a necessidade de criar um constructor. Ou seja, não precisa disparar o método Cancellation.key(), apenas um Cancellation.key já acessa
  get key() {
    return 'CancellationMail';
  }

  async handle({ data }) {
    // Aqui entram as filas. Aqui só existe a fila para appointment por enquanto
    const { appointment } = data;

    await Mail.sendMail({
      to: `${appointment.provider.name} <${appointment.provider.email}>`,
      subject: 'Agendamento cancelado',
      template: 'cancellation',
      context: {
        provider: appointment.provider.name,
        user: appointment.user.name,
        date: format(
          parseISO(appointment.date),
          "'dia' dd 'de' MMMM', às' H:mm'h'",
          {
            locale: pt,
          }
        ),
      },
    });
  }
}

export default new CancellationMail();
```

## src/app/controllers/AppointmentController.js

```diff
+ import CancellationMail from '../jobs/CancellationMail';
- import Mail from '../../lib/Mail';
+ import Queue from '../../lib/Queue';

class AppointmentController {

  async delete(req, res) {
    const appointment = await Appointment.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'provider',
          attributes: ['name', 'email'],
        },
        {
          model: User,
          as: 'user',
          attributes: ['name'],
        },
      ],
    });

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

-    await Mail.sendMail({
-      to: `${appointment.provider.name} <${appointment.provider.email}>`,
-      subject: 'Agendamento cancelado',
-      text: 'Você tem um novo cancelamento', // Em vez de text poderia ser um html
-    });

+    await Queue.add(CancellationMail.key, {
+      appointment,
+    });

    return res.json(appointment);
  }
}

export default new AppointmentController();
```

# Monitorando falhas nas filas

O Bee Queue possui uma série de eventos prontos que podemos manipular, como:

- queue.on('ready', () => {});
- queue.on('error', () => {});
- queue.on('succeeded', () => {});
- queue.on('retrying', () => {});
- queue.on('failed', () => {});
- queue.on('stalled', () => {});

Se der errado o `Mail.sendMail`, vamos fazer um tratamento de erro usando o
evento `queue.on('failed', () => {});`.

## src/lib/Queue.js

```diff
  add(queue, job) {
    return this.queues[queue].bee.createJob(job).save();
  }

  processQueue() {
    jobs.forEach(job => {
      const { bee, handle } = this.queues[job.key];

-      bee.process(handle);
+      bee.on('failed', this.handleFailure).process(handle);
    });
  }

+  handleFailure(job, err) {
+    console.log(`Queue ${job.queue.name}: FAILED`, err);
+  }
}

export default new Queue();
```
