const User = require('../models/User'); // Подключение модели пользователя
const jwt = require('jsonwebtoken');

// Middleware для перевірки токена
const verifyToken = async(req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1]; // Беремо токен з заголовка
  if (!token) {
    return res.status(401).json({ message: 'Nie podano tokenu.' });
  }
  // Використовуємо метод verify від jwt
  jwt.verify(token, process.env.SECRET, async(err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Nieprawidłowy token' });
    }
    const userDB = await User.findById(decoded.userId)
    req.user = userDB;
    next();
  });
};

module.exports=verifyToken;
