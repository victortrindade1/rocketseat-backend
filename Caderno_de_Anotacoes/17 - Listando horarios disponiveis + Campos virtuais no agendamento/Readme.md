<!-- TOC -->

- [Listando horários disponíveis](#listando-horários-disponíveis)
  - [src/routes.js](#srcroutesjs)
  - [src/app/controllers/AvailableController.js](#srcappcontrollersavailablecontrollerjs)
- [Campos virtuais no agendamento](#campos-virtuais-no-agendamento)
  - [src/app/models/Appointment.js](#srcappmodelsappointmentjs)
  - [src/app/controllers/AppointmentController.js](#srcappcontrollersappointmentcontrollerjs)

<!-- /TOC -->

# Listando horários disponíveis

Uma API para listar todos os horários disponíveis do prestador de serviço no dia
escolhido. O projeto não chegará a gravar horários editáveis do prestador, e sim
procurará algo tipo 08:00 até 18:00, e verifica se horário já passou ou
se está vago.

## src/routes.js

```diff
+ import AvailableController from './app/controllers/AvailableController';

+ routes.get('/providers/:providerId/available', AvailableController.index);
```

## src/app/controllers/AvailableController.js

```javascript
import {
  startOfDay,
  endOfDay,
  setHours,
  setMinutes,
  setSeconds,
  format,
  isAfter,
} from 'date-fns';
import { Op } from 'sequelize';
import Appointment from '../models/Appointment';

class AvailableController {
  async index(req, res) {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ error: 'Invalid date' });
    }

    const searchDate = Number(date);

    const appointments = await Appointment.findAll({
      where: {
        provider_id: req.params.providerId,
        canceled_at: null,
        date: {
          [Op.between]: [startOfDay(searchDate), endOfDay(searchDate)],
        },
      },
    });

    const schedule = [
      '08:00',
      '09:00',
      '10:00',
      '11:00',
      '12:00',
      '13:00',
      '14:00',
      '15:00',
      '16:00',
      '17:00',
      '18:00',
    ];

    const available = schedule.map(time => {
      const [hour, minute] = time.split(':');
      const value = setSeconds(
        setMinutes(setHours(searchDate, hour), minute),
        0
      );

      return {
        time,
        value: format(value, "yyyy-MM-dd'T'HH:mm:ssxxx"),
        available:
          isAfter(value, new Date()) &&
          !appointments.find(a => format(a.date, 'HH:mm') === time),
      };
    });

    return res.json(available);
  }
}

export default new AvailableController();
```

# Campos virtuais no agendamento

Vou colocar no model Appointment os campos `past` e `cancelable`. O past vai
retornar se o agendamento é no passado. Cancelable vai retornar se é cancelável
ou não (se for nas últimas 2 horas não é cancelável).

## src/app/models/Appointment.js

```diff
import Sequelize, { Model } from 'sequelize';
+ import { isBefore, subHours } from 'date-fns';

class Appointment extends Model {
  static init(sequelize) {
    super.init(
      {
        date: Sequelize.DATE,
        canceled_at: Sequelize.DATE,
+        past: {
+          type: Sequelize.VIRTUAL,
+          get() {
+            return isBefore(this.date, new Date());
+          },
+        },
+        cancelable: {
+          type: Sequelize.VIRTUAL,
+          get() {
+            return isBefore(new Date(), subHours(this.date, 2));
+          },
+        },
      },
      {
        sequelize,
      }
    );

    return this;
  }
```

## src/app/controllers/AppointmentController.js

```diff
class AppointmentController {
  async index(req, res) {
    const { page = 1 } = req.query; // default = página 1

    const appointments = await Appointment.findAll({
      where: { user_id: req.userId, canceled_at: null },
      order: ['date'],
-      attributes: ['id', 'date'],
+      attributes: ['id', 'date', 'past', 'cancelable'],
      limit: 20, // mostra até 20 agendamentos por página
      offset: (page - 1) * 20,
```
