const mongoose = require("mongoose");
const express = require('express');
const Review = require('../models/Reviews'); // Імпорт моделі відгуку
const verifyToken = require('../middleWare/VerifyToken');
const router = express.Router();

router.post('/', verifyToken, async (req, res) => {
    try {
        console.log(req.body, req.user._id); // Логування для дебагу
        const { instructorId, text } = req.body;

        if (!instructorId || !text) {
            return res.status(400).json({ message: 'Instruktor i tekst są obowiązkowe.' });
        }

        // Перетворення instructorId у ObjectId
        const review = await Review.create({
            instructorId: new mongoose.Types.ObjectId(instructorId), // Використовуємо 'new'
            student: req.user._id, // ID студента береться з токена
            text,
        });

        res.status(201).json(review);
    } catch (error) {
        console.error('Błąd podczas tworzenia recenzji:', error.message);
        res.status(500).json({ message: 'Błąd podczas tworzenia opinii', error });
    }
});
  

// Отримання всіх відгуків для інструктора
router.get('/:instructorId', verifyToken, async (req, res) => {
    try {
        const { instructorId } = req.params;

        // Знаходимо всі відгуки для конкретного інструктора
        const reviews = await Review.find({ instructorId }) // Використовуємо правильне ім'я поля
            .populate('student', 'name surname') // Отримуємо ім’я та прізвище студента
            .populate('instructorId', 'name surname') // Отримуємо ім’я та прізвище інструктора
            .exec();

        res.status(200).json(reviews);
    } catch (error) {
        console.error('Błąd podczas pobierania opinii.:', error.message);
        res.status(500).json({ message: 'Błąd podczas pobierania opinii', error });
    }
});
  

module.exports = router;