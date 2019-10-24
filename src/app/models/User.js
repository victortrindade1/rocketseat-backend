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
      // Necessário passar um objeto com o sequelize como segundo parâmetro. Tb
      // existem muitos outros métodos que podem passar junto com o sequelize.
      // Para vê-los, use a intellisense do vscode, clicando em Ctrl + <espaço>
      {
        sequelize,
      }
    );
  }
}

export default User;
