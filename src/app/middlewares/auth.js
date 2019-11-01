import jwt from 'jsonwebtoken';
import { promisify } from 'util';

import authConfig from '../../config/auth';

export default async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'Token not provided' });
  }

  // Aqui estou pegando o segundo elemento do array authHeader
  const [, token] = authHeader.split(' ');

  try {
    // O promisify cria uma new Promisse de forma menos verbosa
    // Fazemos promisses qnd queremos organizar um callback. A função jwt.verify
    // retorna um callback, logo, preciso tratar. O promisify é o melhor jeito
    // de criar callbacks mais limpos
    const decoded = await promisify(jwt.verify)(token, authConfig.secret);

    req.userId = decoded.id;

    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Token invalid' });
  }
};
