const { Router } = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User'); // Подключение модели пользователя
const { hashPassword, comparePassword } = require('../utils/helpers'); // Утилиты для работы с паролями
const jwt = require('jsonwebtoken');
const { secret } = require('../config'); // Секрет для JWT
const nodemailer = require('nodemailer');
const verifyToken = require('../middleWare/VerifyToken')
const router = Router();

// Регистрация пользователя
router.post(
  '/register',
  [
    body('email').isEmail().withMessage('Adres e-mail jest nieprawidłowy.'),
    body('name').notEmpty().withMessage('Imię jest wymagane.'),
    body('surname').notEmpty().withMessage('Nazwisko jest wymagane.'),
    body('password').isLength({ min: 3 }).withMessage('Hasło musi mieć co najmniej 8 znaki.'),
    body('role').isIn(['student', 'instructor', 'admin']).withMessage('Nieprawidłowa rola.'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { email, name, surname, role } = req.body;
    const userDB = await User.findOne({ email });
    if (userDB) {
      return res.status(400).json({ msg: 'Użytkownik już istnieje.' });
    }

    const password = hashPassword(req.body.password);
    try {
      const newUser = await User.create({ email, name, surname, password, role });
      res.status(201).json(newUser);
    } catch (error) {
      console.error('Błąd podczas tworzenia użytkownika:', error);
      res.status(500).json({ message: 'Błąd serwera' });
    }
  }
);

// Логин пользователя
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Adres e-mail jest nieprawidłowy.'),
    body('password').notEmpty().withMessage('Hasło jest wymagane'),
    body('password').isLength({ min: 3 }).withMessage('Hasło musi mieć co najmniej 8 znaki.'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    const userDB = await User.findOne({ email });
    if (!userDB) {
      return res.status(401).json({ message: 'Użytkownik nie istnieje' });
    }

    const isValid = comparePassword(password, userDB.password);
    if (isValid) {
      // Генерация токена с нужными данными
      const token = jwt.sign(
        {
          userId: userDB._id,
          name: userDB.name,
          surname: userDB.surname,
          role: userDB.role
        },
        secret, 
        { expiresIn: '24h' }
      );

      return res.json({ token, role: userDB.role });
    } else {
      return res.status(401).json({ message: 'Nieprawidłowe hasło.' });
    }
  }
);


// Логаут пользователя
router.post('/logout', verifyToken, (req, res) => {
  // В данном случае логаут происходит на клиенте, сервер ничего не хранит
  res.status(200).json({ message: 'Wylogowanie zakończone sukcesem' });
});

// Проверка авторизации
router.get('/checkAuth', verifyToken, (req, res) => {
  res.status(200).json({ authenticated: true });
});

// Получение текущего пользователя
router.get('/currentUser', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'Użytkownik nie znaleziony.' });
    }
    res.json(user);
  } catch (error) {
    console.error('Błąd podczas pobierania użytkownika:', error);
    res.status(500).json({ message: 'Błąd serwera.' });
  }
});

router.post('/forgot-password', [
  body('email').isEmail().withMessage('Adres e-mail jest nieprawidłowy.'),
], 
async (req, res) => {
  const { email } = req.body;

  // Перевірка наявності користувача
  const userDB = await User.findOne({ email });

  // Якщо користувач не знайдений, повертаємо помилку і завершимо функцію
  if (!userDB) {
    return res.status(401).json({ message: 'Użytkownik nie istnieje.' });
  }
    // Генерація посилання для відновлення пароля
    const token = jwt.sign({ id: userDB._id }, process.env.SECRET, {
      expiresIn: '1h', // Токен дійсний годину
    });
    const resetLink = `${process.env.FRONT_URL}/forgot-password/fotgot-password.html?token=${token}`;
    // Текст електронного листа з посиланням для відновлення пароля
    const emailContent = `
      <div>
        <p>Szanowny użytkowniku,</p>
        <p>Zażądałeś resetowania hasła. Kliknij w poniższy link, aby zmienić swoje hasło:</p>
        <a href="${resetLink}">${resetLink}</a>
        <p>Jeśli nie prosiłeś o resetowanie hasła, po pr  ostu zignoruj tę wiadomość.</p>
      </div>
    `;

      // Налаштування транспорту (використовуємо Gmail)
      const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER, // Ваша пошта Gmail
        pass: process.env.EMAIL_PASS, // Пароль програми, який ви отримали в Google
      },
    });
    

    // Параметри електронного листа
    const mailOptions = {
      from: '"IPZ" <narokallantest@gmail.com>',  // Адреса відправника
      to: email, // Кому надсилаємо
      subject:'Zapomniane hasło', // Тема листа
      html: emailContent, // HTML-контент листа
    };

    // Відправка листа
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Przypomnienie hasła zostało wysłane!' });
});

router.post('/sendToAdminEmail', async (req, res) => {
  try {
    const { emailUser, description } = req.body;
    if (!emailUser || !description) {
      return res.status(400).json({ message: 'Email użytkownika i opis są wymagane.' });
    }

    // Налаштування транспорту для відправки листів (Gmail)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER, // Ваша пошта Gmail
        pass: process.env.EMAIL_PASS, // Пароль програми
      },
    });

    // Зміст листа
    const emailContent = `
      <div>
        <p><strong>Email użytkownika:</strong> ${emailUser}</p>
        <p><strong>Opis problemu:</strong></p>
        <p>${description}</p>
      </div>
    `;

    // Параметри електронного листа
    const mailOptions = {
      from: `"IPZ System" <${process.env.EMAIL_USER}>`, // Відправник
      to: process.env.EMAIL_ADMIN, // Адміністратор
      subject: 'Zgłoszenie problemu od użytkownika', // Тема листа
      html: emailContent, // HTML контент листа
    };

    // Відправка листа адміністратору
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Email został wysłany do administratora.' });
  } catch (error) {
    console.error('Error sending email to admin:', error.message);
    res.status(500).json({ message: 'Nie udało się wysłać emaila do administratora.', error });
  }
});


// Маршрут для оновлення пароля
router.post('/update-password', [
  body('password').isLength({ min: 3 }).withMessage('Hasło musi mieć co najmniej 8 znaki.'),
  body('token').notEmpty().withMessage('Token jest wymagany'),
], async (req, res) => {
  const { password, token } = req.body;

  // Перевірка наявності помилок
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    // Декодуємо токен для отримання ID користувача
    const decoded = jwt.verify(token, process.env.SECRET);

    // Шукаємо користувача за його ID
    const userDB = await User.findById(decoded.id);
    if (!userDB) {
      return res.status(404).json({ message: 'Użytkownik nie znaleziony.' });
    }

    // Хешуємо новий пароль
    const hashedPassword = hashPassword(password);

    // Оновлюємо пароль в базі даних
    userDB.password = hashedPassword;
    await userDB.save();

    // Відправляємо підтвердження
    res.status(200).json({ message: 'Hasło zostało pomyślnie zaktualizowane!' });


  } catch (error) {
    console.error('Błąd podczas resetowania hasła:', error);
    res.status(500).json({ message: 'Błąd serwera.' });
  }
});


module.exports = router;