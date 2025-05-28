const express = require('express');
const router = express.Router();
const User = require('../models/User');
const verifyToken = require('../middleWare/VerifyToken');

router.post('/buy', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'Nie znaleziono użytkownika' });
    }

    if (user.premium) {
      return res.status(400).json({ message: 'Użytkownik już posiada premium' });
    }

    // ✅ Тут могла бы быть интеграция с оплатой
    user.premium = true;
    await user.save();

    return res.status(200).json({ message: 'Premium aktywowane!' });
  } catch (error) {
    console.error('Błąd aktywacji premium:', error);
    res.status(500).json({ message: 'Błąd aktywacji premium', error });
  }
});

module.exports = router;
