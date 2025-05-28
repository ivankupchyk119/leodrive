const express = require('express');
const User = require('../models/User'); // Импорт модели пользователя
const verifyToken = require('../middleWare/VerifyToken');
const Notification = require('../models/notification');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Создание нового пользователя
router.post('/', async (req, res) => {
  try {
    const { email, name, surname, password, role } = req.body;
    const user = new User({ email, name, surname, password, role });
    await user.save();
    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Błąd podczas tworzenia użytkownika', error });
  }
});

// Получение всех пользователей
router.get('/', async (req, res) => {
  try {
    const users = await User.find().populate('ratings schedule course');

    const enrichedUsers = users.map(user => {
      const baseCoursePrice = parseFloat(user.course?.price || 0);
      const paid = parseFloat(user.paid || 0);
      const premiumCost = user.premium ? 2000 : 0;
      const total = baseCoursePrice + premiumCost;

      return {
        ...user.toObject(), // преобразуем mongoose document в обычный объект
        fullyPaidPremium: user.premium === true && paid >= total
      };
    });

    res.status(200).json(enrichedUsers);
  } catch (error) {
    res.status(500).json({ message: 'Błąd podczas pobierania użytkowników', error });
  }
});


router.get('/getInfoForMe', verifyToken, async (req, res) => {
  try {
    const userId = req.user._id; // Отримуємо ID користувача з токена

    // Знаходимо користувача та отримуємо його курс за допомогою populate
    const user = await User.findById(userId).populate('course'); 

    if (!user) {
      return res.status(404).json({ message: 'Użytkownik nie został znaleziony.' });
    }

    return res.json(user); // Повертаємо дані користувача разом із курсом
  } catch (error) {
    console.error('Błąd podczas pobierania informacji o użytkowniku:', error.message);
    res.status(500).json({ message: 'Błąd podczas pobierania danych użytkownika', error });
  }
});


// Отримання сповіщень
router.get('/notifications', verifyToken, async (req, res) => {
  try {
    const userId = req.user._id; // Отримуємо ID користувача з токену
    const userRole = req.user.role; // Отримуємо роль користувача з токену
    
    // Якщо користувач - адміністратор, повертаємо всі сповіщення
    if (userRole === 'admin') {
      const notifications = await Notification.find().populate('sender recipient schedule');
      return res.status(200).json(notifications);
    }

    // Якщо користувач не адміністратор, повертаємо сповіщення тільки для цього користувача
    const notifications = await Notification.find({
      $or: [
        { recipient: userId }, // Для отримувача
        { sender: userId }      // Для відправника (якщо це студент)
      ]
    }).populate('sender recipient schedule');

    return res.status(200).json(notifications);
  } catch (error) {
    console.error('Błąd podczas odbierania powiadomień:', error.message);
    res.status(500).json({ message: 'Błąd serwera podczas odbierania powiadomień' });
  }
});

// 👤 Установка аватара пользователю
router.put('/set-avatar', verifyToken, async (req, res) => {
  const { avatarUrl } = req.body;

  if (!avatarUrl) {
    return res.status(400).json({ message: 'Brakuje URL do avatara' });
  }

  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { avatarUrl },
      { new: true }
    );
    res.json({ message: 'Avatar został pomyślnie zaktualizowany', avatarUrl: updatedUser.avatarUrl });
  } catch (err) {
    console.error('Błąd przy aktualizacji avatara:', err);
    res.status(500).json({ message: 'Błąd serwera podczas ustawiania avatara' });
  }
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, '..', 'uploads', 'avatars');

    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueName = `avatar_${Date.now()}${ext}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

router.post('/upload-avatar', verifyToken, upload.single('avatar'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'Brak pliku' });

  const avatarUrl = `/uploads/avatars/${req.file.filename}`;
  const userId = req.user._id; // <-- ВАЖНО: _id, не id

  await User.findByIdAndUpdate(userId, { avatarUrl });
  res.json({ avatarUrl });
});


module.exports = router;

