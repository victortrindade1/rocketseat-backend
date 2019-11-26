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

  async update(req, res) {
    // findByIdAndUpdate é uma função do mongoose muito boa. Encontra, insere e
    // salva tudo tetificado pronto
    const notification = await Notification.findByIdAndUpdate(
      // No Imsomnia vc verá o id sendo um hash, isso pq é assim o id do MongoDB
      req.params.id,
      { read: true },
      { new: true } // new = true pra além de atualizar, me retornar atualizado
    );

    return res.json(notification);
  }
}

export default new NotificationController();
