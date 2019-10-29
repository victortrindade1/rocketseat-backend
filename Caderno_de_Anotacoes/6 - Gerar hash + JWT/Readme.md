# Gerar Hash

A partir da senha digitada pelo usuário no form, vamos gerar um hash, e salvar
apenas o hash e não a senha. Para gerar hash, use o `bcryptjs`.

`yarn add bcryptjs`

## No model...

Antes:

```
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
      {
        sequelize,
      }
    );
  }
}

export default User;
```

Depois:

```
import Sequelize, { Model } from 'sequelize';
import bcrypt from 'bcryptjs';

class User extends Model {
  static init(sequelize) {
    super.init(
      {
        name: Sequelize.STRING,
        email: Sequelize.STRING,
        password: Sequelize.VIRTUAL,
        password_hash: Sequelize.STRING,
        provider: Sequelize.BOOLEAN,
      },
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
```

# JWT (JSON Web Token)

O JWT é uma forma de fazer autenticação para serviços RESTful. Vc manipula o
token em formato JSON.

O JWT fica da seguinte forma:
![jwt-image](./Caderno_de_Anotacoes/6- Gerar hash + JWT/img1.png)
