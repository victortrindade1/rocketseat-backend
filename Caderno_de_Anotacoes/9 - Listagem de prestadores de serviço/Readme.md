<!-- TOC -->

- [routes](#routes)
- [src/app/models/User.js](#srcappmodelsuserjs)
- [src/app/controllers/ProviderController.js](#srcappcontrollersprovidercontrollerjs)
- [src/app/models/File.js](#srcappmodelsfilejs)
- [src/app.js](#srcappjs)

<!-- /TOC -->

## routes

```diff
import UserController from './app/controllers/UserController';
import SessionController from './app/controllers/SessionController';
import FileController from './app/controllers/FileController';
+ import ProviderController from './app/controllers/ProviderController';

import authMiddleware from './app/middlewares/auth';

const routes = new Router();
const upload = multer(multerConfig);

routes.post('/users', UserController.store);
routes.post('/sessions', SessionController.store);

routes.use(authMiddleware);

routes.put('/users', UserController.update);

+ routes.get('/providers', ProviderController.index);

routes.post('/files', upload.single('file'), FileController.store);

export default routes;
```

## src/app/models/User.js

Aqui disse que o model File se chama avatar (está associado ao
ProviderController)

```diff
static associate(models) {
-    this.belongsTo(models.File, { foreignKey: 'avatar_id' });
+    this.belongsTo(models.File, { foreignKey: 'avatar_id', as: 'avatar' });
}
```

## src/app/controllers/ProviderController.js

```javascript
import User from '../models/User';
import File from '../models/File';

class ProviderController {
  async index(req, res) {
    const providers = await User.findAll({
      where: { provider: true },
      // Os campos q eu quero q mostre ficam em "attributes"
      attributes: ['id', 'name', 'email', 'avatar_id'],
      include: [
        {
          model: File,
          as: 'avatar',
          attributes: ['name', 'path', 'url'],
        },
      ],
    });

    return res.json(providers);
  }
}

export default new ProviderController();
```

## src/app/models/File.js

```diff
super.init(
      {
        name: Sequelize.STRING,
        path: Sequelize.STRING,
+        url: {
+          type: Sequelize.VIRTUAL,
+          get() {
+            return `http://localhost:3333/files/${this.path}`;
+          },
+        },
      },
      {
        sequelize,
      }
    );
```

## src/app.js

Necessário este middleware para q o express deixe q eu acesse a URL da imagem.

```diff
middlewares() {
    this.server.use(express.json());
+    this.server.use(
+      '/files',
+      express.static(path.resolve(__dirname, '..', 'tmp', 'uploads'))
+    );
  }
```
