<!-- TOC -->

- [Agendamento de serviço](#agendamento-de-serviço)
  - [src/routes.js](#srcroutesjs)
  - [src/app/controllers/AppointmentController.js](#srcappcontrollersappointmentcontrollerjs)
- [Validações de Agendamento](#validações-de-agendamento)
  - [src/app/controllers/AppointmentController.js](#srcappcontrollersappointmentcontrollerjs-1)
- [Listando agendamentos do usuário](#listando-agendamentos-do-usuário)
  - [src/routes.js](#srcroutesjs-1)
  - [src/app/controllers/AppointmentController.js](#srcappcontrollersappointmentcontrollerjs-2)
- [Aplicando paginação](#aplicando-paginação)
  - [src/app/controllers/AppointmentController.js](#srcappcontrollersappointmentcontrollerjs-3)

<!-- /TOC -->

# Agendamento de serviço

## src/routes.js

```diff
import ProviderController from './app/controllers/ProviderController';
+ import AppointmentController from './app/controllers/AppointmentController';

import authMiddleware from './app/middlewares/auth';

...

routes.get('/providers', ProviderController.index);

+ routes.post('/appointments', AppointmentController.store);

routes.post('/files', upload.single('file'), FileController.store);
```

## src/app/controllers/AppointmentController.js

```javascript
import * as Yup from 'yup';
import User from '../models/User';
import Appointment from '../models/Appointment';

class AppointmentController {
  async store(req, res) {
    const schema = Yup.object().shape({
      provider_id: Yup.number().required(),
      date: Yup.date().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const { provider_id, date } = req.body;

    // Check if provider_id is a provider
    const isProvider = await User.findOne({
      where: { id: provider_id, provider: true },
    });

    if (!isProvider) {
      return res
        .status(401)
        .json({ error: 'You can only create appointments with providers' });
    }

    const appointment = await Appointment.create({
      user_id: req.userId, // userId vem do middleware auth no momento que loga
      provider_id,
      date,
    });
    return res.json(appointment);
  }
}

export default new AppointmentController();
```

# Validações de Agendamento

Para o Node lidar com datas, instale a lib `date-fns`

`yarn add date-fns@next`

## src/app/controllers/AppointmentController.js

```diff
import * as Yup from 'yup';
+ import { startOfHour, parseISO, isBefore } from 'date-fns';
import User from '../models/User';
import Appointment from '../models/Appointment';

class AppointmentController {
  async store(req, res) {
    const schema = Yup.object().shape({
      provider_id: Yup.number().required(),
      date: Yup.date().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const { provider_id, date } = req.body;

    /**
     * Check if provider_id is a provider
     */
    const checkIsProvider = await User.findOne({
      where: { id: provider_id, provider: true },
    });

    if (!checkIsProvider) {
      return res
        .status(401)
        .json({ error: 'You can only create appointments with providers' });
    }

    // startOfHour é a hora arredondada para baixo
    // parseISO transforma a data num objeto Date
+    const hourStart = startOfHour(parseISO(date));

    // Verifica se vai agendar num horário do passado, antes do atual
+    if (isBefore(hourStart, new Date())) {
+      return res.status(400).json({ error: 'Past dates are not permitted' });
+    }

    /**
     * Check date availability
     */
+    const checkAvailability = await Appointment.findOne({
+      where: {
+        provider_id,
+        canceled_at: null,
+        date: hourStart,
+      },
+    });

+    if (checkAvailability) {
+      return res
+        .status(400)
+        .json({ error: 'Appointment date is not available' });
+    }

    const appointment = await Appointment.create({
      user_id: req.userId, // userId vem do middleware auth no momento que loga
      provider_id,
      date,
    });

    return res.json(appointment);
  }
}

export default new AppointmentController();
```

# Listando agendamentos do usuário

## src/routes.js

```diff
routes.post('/appointments', AppointmentController.store);

+ routes.get('/appointments', AppointmentController.index);

routes.post('/files', upload.single('file'), FileController.store);
```

## src/app/controllers/AppointmentController.js

```diff
import Appointment from '../models/Appointment';
+ import File from '../models/File';

class AppointmentController {
+  async index(req, res) {
+    const appointments = await Appointment.findAll({
+      where: { user_id: req.userId, canceled_at: null },
+      order: ['date'],
+      attributes: ['id', 'date'],
+      include: [
+        {
+          model: User,
+          as: 'provider',
+          attributes: ['id', 'name'],
+          include: [
+            {
+              model: File,
+              as: 'avatar',
+              // Se não colocar id como atributo, a url tb não aparece
+              // Se não colocar path, aparece undefined, pq path é variável da url lá no model File
+              attributes: ['id', 'path', 'url'],
+            },
+          ],
+        },
+      ],
+    });
+
+    return res.json(appointments);
+  }

  async store(req, res) {
    const schema = Yup.object().shape({
```

# Aplicando paginação

## src/app/controllers/AppointmentController.js

```diff
class AppointmentController {
  async index(req, res) {
+    const { page = 1 } = req.query; // default = página 1

    const appointments = await Appointment.findAll({
      where: { user_id: req.userId, canceled_at: null },
      order: ['date'],
      attributes: ['id', 'date'],
+      limit: 20, // mostra até 20 agendamentos por página
+      offset: (page - 1) * 20,
      include: [
        {
          model: User,
          as: 'provider',
```
