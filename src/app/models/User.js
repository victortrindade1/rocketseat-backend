import Sequelize, { Model } from 'sequelize';
import bcrypt from 'bcryptjs';

class User extends Model {
  static init(sequelize) {
    super.init(
      {
        name: Sequelize.STRING,
        email: Sequelize.STRING,
        password: Sequelize.VIRTUAL, // O campo do tipo VIRTUAL nunca vai existir na base de dados
        password_hash: Sequelize.STRING,
        provider: Sequelize.BOOLEAN,
      },
      // Necessário passar um objeto com o sequelize como segundo parâmetro. Tb
      // existem muitos outros métodos que podem passar junto com o sequelize.
      // Para vê-los, use a intellisense do vscode, clicando em Ctrl + <espaço>
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
}

export default User;
