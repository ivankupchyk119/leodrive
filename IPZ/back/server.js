const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();
const session = require('express-session');
const MongoStore = require('connect-mongo');
const cors = require('cors');
const path = require('path');
const nodemailer = require('nodemailer'); // Для отправки email
const jwt = require('jsonwebtoken');
const Group = require('./models/Group');

const webpush = require('web-push');
const cron = require('node-cron');

// Подключение к базе данных MongoDB
mongoose
  .connect(process.env.MONGO_URI || 'mongodb+srv://noname52:oralcumshot@cluster0.zohi8.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('Połączono z MongoDB'))
  .catch((err) => console.error('Błąd połączenia z MongoDB:', err));

// Инициализация Express приложения
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: '*', // Разрешить все источники
  credentials: true,
}));

// Middleware для работы с JSON
app.use(express.json());

// Настройка сессий
const mongoStore = MongoStore.create({
  mongoUrl: process.env.MONGO_URI || 'mongodb+srv://noname52:oralcumshot@cluster0.zohi8.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0',
});
app.use(
  session({
    secret: process.env.SECRET || 'aboba',
    resave: false,
    saveUninitialized: false,
    store: mongoStore,
    cookie: {
      secure: process.env.NODE_ENV === 'production', // Включите secure только в продакшене
      httpOnly: true, // Куки недоступны JavaScript
      maxAge: 24 * 60 * 60 * 1000, // 1 день
    },
  })
);

// Статические файлы (CSS, JS)
app.use('/front/public', express.static(path.join(__dirname, '..', 'front', 'public')));

// ✅ Добавляем поддержку изображений
app.use('/front/images', express.static(path.join(__dirname, '..', 'front', 'images')));



app.get('/', (req, res) => {
  res.redirect('/front/public/Strona Glowna/main.html');
});



// Импорт маршрутов
const userRoutes = require('./routes/userRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const ratingRoutes = require('./routes/ratingRoutes');
const authRoutes = require('./routes/auth'); // Авторизационные маршруты
const testResultRoutes = require('./routes/testresultRoutes');
const coursesRoutes = require('./routes/CourseRouter');
const reviewsRoutes = require('./routes/reviewsRouter');
const notificationRoutes = require('./routes/notificationRoutes');
const materialRoutes = require('./routes/materialRoutes');
const groupRoutes = require('./routes/groupRoutes');
const premiumRoutes = require('./routes/premiumRoutes');


// Подключение маршрутов
app.use('/api/users', userRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/auth', authRoutes); // Маршруты для авторизации
app.use('/api/testResults', testResultRoutes);
app.use('/api/courses', coursesRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/premium', premiumRoutes);



// --- Реализация маршрута для восстановления пароля ---
app.post('/api/auth/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: 'Wymagany jest adres e-mail' });
  }

  try {
    // Найти пользователя в базе данных
    const user = await mongoose.connection.collection('users').findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'Użytkownik nie został znaleziony' });
    }

    // Настроить Nodemailer
    const transporter = nodemailer.createTransport({
      service: 'Gmail', // Use Gmail as email service
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      debug: true, // Enable debugging for the email sending process
      logger: true, // Enable logging for the email sending process
    });


    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reminder',
      text: `Hello, your password is: ${user.password}`,
    };



    // Отправить email
    await transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Błąd podczas wysyłania e-maila:', error);
        return res.status(500).json({ message: 'Błąd podczas wysyłania e-maila z hasłem', error: error.message });
      } else {
        console.log('Wiadomość wysłana:', info.response);
        return res.json({ message: 'E-mail z hasłem został wysłany pomyślnie' });
      }
    });
  } catch (error) {
    console.error('Błąd w trasie zapomniane hasło:', error);
    res.status(500).json({ message: 'Błąd podczas wysyłania e-maila z hasłem' });
  }
});
// Получение текущего пользователя
app.get('/api/user', (req, res) => {
  const token = req.headers['authorization']?.split(' ')[1]; // Извлекаем токен из заголовка

  if (!token) {
    return res.status(401).json({ message: 'Token jest nieobecny' });
  }

  jwt.verify(token, process.env.SECRET || 'aboba', (err, decoded) => {
    if (err) {
      console.error('Błąd weryfikacji tokena:', err.message);
      return res.status(401).json({ message: 'Nieprawidłowy lub wygasły token' });
    }

    res.json({
      userId: decoded.userId,
      firstName: decoded.name,
      lastName: decoded.surname,
      role: decoded.role,
    });
  });
});

// API endpoint to save test result
app.post('/api/testResult', (req, res) => {
  const { userId, result, category } = req.body;  // Изменено на правильные названия полей

  if (!userId || result === undefined || !category) {
    return res.status(400).json({ success: false, message: 'Nieprawidłowe dane' });
  }

  const newTestResult = new TestResult({
    user: userId,   // Ссылаемся на пользователя
    result,         // Результат теста
    category,       // Категория теста
  });

  newTestResult.save()
    .then(() => {
      res.json({ success: true, message: 'Wynik testu zapisany' });
    })
    .catch(error => {
      res.status(500).json({ success: false, message: 'Błąd serwera' });
    });
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const Schedule = require('./models/Schedule');
const User = require('./models/User');

webpush.setVapidDetails(
  'mailto:test@example.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// Временное хранилище подписок (в бою — лучше MongoDB)
const subscriptions = {};

app.post('/api/subscribe', (req, res) => {
  const { userId, subscription } = req.body;

  if (!userId || !subscription) {
    return res.status(400).json({ message: 'Missing subscription data' });
  }

  subscriptions[userId] = subscription;
  res.status(201).json({ message: 'Subscribed successfully' });
});

// Вспомогательная функция для получения точного Date начала урока в локальном времени сервера
function getLessonStartDate(lesson) {
  const date = new Date(lesson.date);
  const [hours, minutes] = lesson.startTime.split(':').map(Number);
  // Устанавливаем часы и минуты локально (с учетом временной зоны сервера)
  date.setHours(hours, minutes, 0, 0);
  return date;
}

cron.schedule('*/1 * * * *', async () => {
  console.log('⏰ Cron job запущен');
  const now = new Date(); // локальное время сервера
  const inFiveMinutes = new Date(now.getTime() + 5 * 60000);

  try {
    // Получаем все занятия на сегодня со статусом "scheduled"
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    const lessons = await Schedule.find({
      date: { $gte: todayStart, $lte: todayEnd },
      status: 'scheduled'
    });

    console.log(`📚 Найдено занятий: ${lessons.length}`);

    // Фильтруем занятия, которые начинаются в интервале now - inFiveMinutes (локальное время)
    const upcomingLessons = lessons.filter(lesson => {
      const lessonStart = getLessonStartDate(lesson);

      console.log(`lessonStart: ${lessonStart.toISOString()}, now: ${now.toISOString()}, inFiveMinutes: ${inFiveMinutes.toISOString()}`);

      return lessonStart >= now && lessonStart <= inFiveMinutes;
    });

    console.log('Часовой пояс сервера (в минутах):', new Date().getTimezoneOffset());

    console.log(`📆 Занятий в ближайшие 5 минут: ${upcomingLessons.length}`);
    upcomingLessons.forEach(lesson => {
      console.log(`🔔 Занятие в ${lesson.startTime}, дата: ${lesson.date.toISOString()}`);
    });

    for (const lesson of upcomingLessons) {
      const user = await User.findById(lesson.student);
      if (!user) continue;

      const subscription = subscriptions[user._id];
      if (!subscription) continue;

      console.log(`📨 Пытаемся отправить уведомление пользователю ${user.email}`);

      const payload = JSON.stringify({
        title: 'Przypomnienie o lekcji',
        body: `Twoje zajęcia zaczną się o ${lesson.startTime} typu "${lesson.type}".`
      });

      await webpush.sendNotification(subscription, payload);
      console.log(`✅ Push wysłany до ${user.email}`);
    }
  } catch (err) {
    console.error('❌ Бłąд в cron уведомлениях:', err);
  }
});


// Обработка ошибок
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Coś poszło nie tak!');
});

// ✅ Удаляем app.listen(...) — он больше не нужен

// ✅ Создаём HTTP-сервер на базе Express
const http = require('http');
const server = http.createServer(app);

// ✅ Настройка socket.io
const { Server } = require('socket.io');
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const Message = require('./models/Message');

// ✅ JWT middleware для socket.io
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Unauthorized'));

  try {
    const decoded = jwt.verify(token, process.env.SECRET || 'aboba');
    socket.user = decoded;

    // Присоединяем к комнатам: личная и групповые
    socket.join(decoded.userId); // Личная комната
    const groups = await Group.find({ members: decoded.userId });
    groups.forEach(group => {
      socket.join(group._id.toString()); // Групповые комнаты
    });

    next();
  } catch (err) {
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.user.name);

  socket.on('message', async (data) => {
    const message = new Message({
      sender: socket.user.userId,
      content: data.content,
      room: data.recipient ? null : data.room,
      recipient: data.recipient || null,
      name: socket.user.name,
      surname: socket.user.surname,
    });

    await message.save();

    if (data.recipient) {
      // Личное сообщение
      io.to(data.recipient).emit('message', message);
      io.to(socket.user.userId).emit('message', message);
    } else if (data.room) {
      // Групповое сообщение
      io.to(data.room).emit('message', message);
    }
  });
});

app.get('/api/messages/group/:groupId', async (req, res) => {
  const token = req.headers['authorization']?.split(' ')[1]; // Получаем токен из заголовка
  if (!token) return res.status(401).json({ message: 'Unauthorized' }); // Если токен отсутствует, возвращаем ошибку

  try {
    // Проверяем токен и извлекаем данные пользователя
    const decoded = jwt.verify(token, process.env.SECRET || 'aboba');
    const userId = decoded.userId;
    const groupId = req.params.groupId;

    // Получаем сообщения для группы, фильтруя по полю room (группа идентифицируется через room)
    const messages = await Message.find({
      room: groupId,  // Используем поле room для фильтрации по группе
      recipient: null  // Убедимся, что фильтруем только групповые сообщения (recipient == null)
    })
      .sort({ createdAt: 1 }) // Сортируем сообщения по времени создания (от старых к новым)
      .limit(100); // Ограничиваем количество сообщений

    // Возвращаем полученные сообщения
    res.json(messages);
  } catch (err) {
    console.error('Błąd przy otrzymaniu powiadomień:', err); // Логируем ошибку на сервере
    res.status(403).json({ message: 'Invalid token' }); // Если ошибка с токеном, отправляем 403
  }
});




app.get('/api/messages/private/:userId', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    const decoded = jwt.verify(token, process.env.SECRET || 'aboba');
    const currentUserId = decoded.userId;
    const otherUserId = req.params.userId;

    const messages = await Message.find({
      $or: [
        { sender: currentUserId, recipient: otherUserId },
        { sender: otherUserId, recipient: currentUserId }
      ]
    }).sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

//Удаление сообщений
app.delete('/api/messages/:id', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, process.env.SECRET || 'aboba');

    const message = await Message.findById(req.params.id);
    if (!message) return res.status(404).json({ error: 'Message not found' });

    if (message.sender.toString() !== decoded.userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await Message.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Message deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});




// ✅ Запускаем сервер — только один!
server.listen(PORT, () => {
  console.log(`Server działa na porcie ${PORT}`);
});


