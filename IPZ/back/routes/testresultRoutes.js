const express = require('express');
const router = express.Router();
const TestResult = require('../models/TestResult'); // Importujemy model TestResult
const User = require('../models/User'); // Importujemy model User
const verifyToken = require('../middleWare/VerifyToken');
const Course = require('../models/Course');

// 1. Pobierz wszystkie wyniki testów отримати рейтинг
router.get('/', verifyToken, async (req, res) => {
  try {
    const user = req.user;
    if (!user.course) return res.status(400).json({ message: 'Brak kursu' });

    const course = await Course.findById(user.course);
    if (!course) return res.status(400).json({ message: 'Nie znaleziono kursu' });

    function mapCategory(cat) {
      if (['A1', 'A2', 'AM'].includes(cat)) return 'A';
      if (cat === 'BE') return 'B';
      return cat;
    }

    const normalizedCat = mapCategory(course.category);

    const testResults = await TestResult.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "student",
          foreignField: "_id",
          as: "userInfo"
        }
      },
      { $unwind: "$userInfo" },
      {
        $lookup: {
          from: "courses",
          localField: "userInfo.course",
          foreignField: "_id",
          as: "courseInfo"
        }
      },
      { $unwind: "$courseInfo" },
      {
        $addFields: {
          mappedCategory: {
            $switch: {
              branches: [
                { case: { $in: ["$courseInfo.category", ["A1", "A2", "AM"]] }, then: "A" },
                { case: { $eq: ["$courseInfo.category", "BE"] }, then: "B" }
              ],
              default: "$courseInfo.category"
            }
          }
        }
      },
      {
        $match: {
          mappedCategory: normalizedCat,
          category: normalizedCat
        }
      },
      {
        $group: {
          _id: "$student",
          totalScore: { $sum: "$result" },
          userInfo: { $first: "$userInfo" }
        }
      },
      { $sort: { totalScore: -1 } },
      { $limit: 5 },
      {
        $project: {
          _id: 0,
          name: "$userInfo.name",
          surname: "$userInfo.surname",
          totalScore: 1
        }
      }
    ]);

    res.status(200).json(testResults);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Błąd podczas generowania rankingu', error: err });
  }
});

// 2. Pobierz wyniki testów konkretnego użytkownika po jego ID
router.get('/getInfoForUser', verifyToken, async (req, res) => {
  const userId = req.user._id;
  try {
    const testResults = await TestResult.find({ student: userId })
      .populate('student', 'name surname')
      .exec();

    // ✅ Даже если пусто — возвращаем [], не 404
    return res.status(200).json(testResults);
  } catch (err) {
    res.status(500).json({ message: 'Błąd podczas pobierania wyników testów', error: err });
  }
});


// 3. Dodaj nowy lub zaktualizuj wynik testu
router.post('/', verifyToken, async (req, res) => {
  const { category, result, testName } = req.body;
  const userId = req.user._id;

  if (!category || !testName || result === undefined || isNaN(result)) {
    return res.status(400).json({ message: 'Wszystkie pola (category, testName, result) są obowiązkowe i result musi być liczbą' });
  }

  try {
    const existing = await TestResult.findOne({ student: userId, category, testName });
    if (existing) {
      existing.result = result;
      await existing.save();
      return res.status(200).json({ message: 'Zaktualizowano wynik testu', updatedTestResult: existing });
    }

    const newTest = await TestResult.create({ student: userId, category, testName, result });
    res.status(201).json({ message: 'Zapisano nowy wynik testu', newTestResult: newTest });
  } catch (err) {
    console.error('Błąd:', err.message);
    res.status(500).json({ message: 'Błąd serwera', error: err.message });
  }
});


// 4. Pobierz wynik testu z szczegółami o użytkowniku
router.get('/:id', async (req, res) => {
  const { id } = req.params;


  try {
    const testResult = await TestResult.findById(id)
      .populate('user', 'name surname') // Uzupełniamy informacje o użytkowniku
      .exec();

    if (!testResult) {
      return res.status(404).json({ message: 'Nie znaleziono wyniku testu' });
    }

    res.status(200).json(testResult);
  } catch (err) {
    res.status(500).json({ message: 'Błąd podczas pobierania wyniku testu', error: err });
  }
});
// 5. Pobierz wyniki testów użytkownika po kategorii
router.get('/user/:userId/category/:category', async (req, res) => {
    const { userId, category } = req.params;
    try {
      const testResult = await TestResult.findOne({ student: userId, category })
        .populate('user', 'name surname') // Убираем личную информацию пользователя (по желанию)
        .exec();
  
      if (!testResult) {
        return res.status(404).json({ message: 'Nie znaleziono wyników dla tej kategorii' });
      }
  
      res.status(200).json(testResult); // Возвращаем результат
    } catch (err) {
      res.status(500).json({ message: 'Błąd podczas pobierania wyników testów', error: err });
    }
});
module.exports = router;
