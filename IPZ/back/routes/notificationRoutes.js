const express = require('express');
const router = express.Router();
const Notification = require('../models/notification');

// 📌 Отримати всі сповіщення для конкретного користувача  
// 📌 Pobierz wszystkie powiadomienia dla konkretnego użytkownika
router.get('/:userId', async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.params.userId }).sort({ createdAt: -1 });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Błąd serwera.', error }); // Błąd serwera
  }
});

// 📌 Створити нове сповіщення  
// 📌 Utwórz nowe powiadomienie
router.post('/', async (req, res) => {
  try {
    const { recipient, sender, type, schedule, message } = req.body;
    const newNotification = new Notification({ recipient, sender, type, schedule, message });

    await newNotification.save();
    res.status(201).json(newNotification);
  } catch (error) {
    res.status(500).json({ message: 'Błąd serwera.', error }); // Błąd serwera
  }
});

// 📌 Видалити сповіщення  
// 📌 Usuń powiadomienie
router.delete('/:notificationId', async (req, res) => {
  try {
    await Notification.findByIdAndDelete(req.params.notificationId);
    res.json({ message: 'Powiadomienie zostało usunięte.' }); // Powiadomienie usunięte
  } catch (error) {
    res.status(500).json({ message: 'Błąd serwera.', error }); // Błąd serwera
  }
});

module.exports = router;