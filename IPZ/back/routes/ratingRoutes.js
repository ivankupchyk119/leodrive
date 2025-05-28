const express = require('express');
const Rating = require('../models/Rating'); // Импорт модели оценки
const router = express.Router();

// Создание оценки
router.post('/', async (req, res) => {
  try {
    const { user, ratedBy, score, comment } = req.body;
    const rating = new Rating({ user, ratedBy, score, comment });
    await rating.save();
    res.status(201).json(rating);
  } catch (error) {
    res.status(500).json({ message: 'Błąd podczas tworzenia oceny.', error });
  }
});

// Получение всех оценок
router.get('/', async (req, res) => {
  try {
    const ratings = await Rating.find().populate('user ratedBy');
    res.status(200).json(ratings);
  } catch (error) {
    res.status(500).json({ message: 'Błąd podczas pobierania ocen.', error });
  }
});

module.exports = router;