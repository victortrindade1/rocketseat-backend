# Listando agenda do prestador

## src/routes.js

```diff
+ import ScheduleController from './app/controllers/ScheduleController';
...
+ routes.get('/schedule', ScheduleController.index);
```

## src/app/controllers/ScheduleController.js

Controller para o próprio prestador de serviço criar o agendamento do serviço.

```javascript
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
      order: ['date'],
    });
    return res.json(appointments);
  }
}

export default new ScheduleController();
```
