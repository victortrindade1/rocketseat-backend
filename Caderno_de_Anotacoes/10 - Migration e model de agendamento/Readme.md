Cria tabela Appointments. Possui 2 relações com a tabelas users
(user_id, provider_id), pois tanto o usuário quanto o funcionário poderão
agendar.

`yarn sequelize migration:create --name=create-appointments`

## src/database/migrations/20191114215251-create-appointments.js

```javascript
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('appointments', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      date: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      user_id: {
        type: Sequelize.INTEGER,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL', // se deletar o usuário, não deleta o agendamento
        allowNull: true,
      },
      provider_id: {
        type: Sequelize.INTEGER,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL', // se deletar o funcionário, não deleta o agendamento
        allowNull: true,
      },
      canceled_at: {
        type: Sequelize.DATE,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
  },

  down: queryInterface => {
    return queryInterface.dropTable('appointments');
  },
};
```

`yarn sequelize db:migrate`

## src/app/models/Appointment.js

```javascript
import Sequelize, { Model } from 'sequelize';

class Appointment extends Model {
  static init(sequelize) {
    super.init(
      {
        date: Sequelize.DATE,
        canceled_at: Sequelize.DATE,
      },
      {
        sequelize,
      }
    );

    return this;
  }

  static associate(models) {
    // Atenção: se tiver mais de um relacionamento, é obrigatório colocar apelido nos campos
    this.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    this.belongsTo(models.User, { foreignKey: 'provider_id', as: 'provider' });
  }
}

export default Appointment;
```

## src/database/index.js

```diff
import File from '../app/models/File';
+ import Appointment from '../app/models/Appointment';

import databaseConfig from '../config/database';

- const models = [User, File];
+ const models = [User, File, Appointment];

class Database {
```
