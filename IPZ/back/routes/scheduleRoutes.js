const express = require('express');
const Schedule = require('../models/Schedule'); // Импорт модели расписания
const router = express.Router();
const verifyToken = require('../middleWare/VerifyToken');
const User = require('../models/User');
const notification = require('../models/notification');
const nodemailer = require('nodemailer');
const { format } = require('date-fns');
const path = require('path');
const logoPath = path.join(__dirname, '../../front/images/logofull.png');


//Словарь для писем
const lessonTypeMap = {
  praktyka: 'Zajęcia Praktyczne',
  wyklad: 'Zajęcia Teoretyczne',
  egzamin_t: 'Egzamin Teoretyczny',
  egzamin_p: 'Egzamin Praktyczny',
};

//отримати всіх інструкторів
router.get('/instructors',verifyToken,async(req,res)=>{
  try{
    const instruktors=await User.find({role:'instructor'});
    return res.json({ instruktors })
  }catch(error){
    res.status(500).json({ message: 'Błąd podczas pobierania listy instruktorów', error });
  }
})

// Створення або скасування розкладу
router.post('/', verifyToken, async (req, res) => {
  try {
    //const student = req.user._id; // Отримуємо ID студента з токену
    let { student, instructor, date, startTime, endTime, type = 'praktyka',status,isInstruktorSet=false,fromAdminInstructorId,isStudent } = req.body; // За замовчуванням 'practice'
    
    const typeName = lessonTypeMap[type] || type; // fallback якщо ключу немає


    if(isInstruktorSet){
      instructor=req.user._id;
    }

    if(!student){
      student=req.user._id
    }
    if(fromAdminInstructorId){
      instructor=fromAdminInstructorId;
    }

    // Перевірка на валідність типу заняття
    if (!['wyklad', 'praktyka', 'egzamin_t','egzamin_p', 'latwo'].includes(type)) {
      return res.status(400).json({ message: 'Niepoprawny typ zajęć!' });
    }

    if(type!='latwo'&&!student){
      return res.status(400).json({message:'Student jest niezdefiniowany'});
    }

    // Створення розкладу для нового заняття
    const schedule = await Schedule.create({ 
      instructor, 
      student:type=='latwo'?null:student, 
      date, 
      startTime, 
      endTime,
      status:status?status:'scheduled',
      type // додаємо тип заняття
    });
    const stud = await User.findOne({ _id: student });

    if(isStudent){
      const not = await notification.create({
        recipient:instructor,
        sender:student,
        type:'instuktor_create',
        schedule:schedule._id,
        message:`Instruktor zapisał ucznia na zajęcie typu ${typeName}`
      })

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
        to: stud.email, // Кому надсилаємо
        subject:`Instruktor zapisał ucznia na zajęcie typu: ${typeName}`,
        html: `
          <div style="text-align: center; font-family: Arial, sans-serif;">
            <img src="cid:logo" alt="Logo" style="width: 150px; margin-bottom: 20px;">
            <p style="font-size: 16px; color: #333;">Instruktor zapisał ucznia na zajęcie typu: <strong>${typeName}</strong></p>
          </div>`,
        attachments: [{
          filename: 'logofull.png',
          path: logoPath, // путь к изображению
          cid: 'logo'  // HTML-контент письма
        }]
      };
  
      // Відправка листа
      await transporter.sendMail(mailOptions);
    }
    if(type=='latwo'){

    }else if(!status){
      const not = await notification.create({
        recipient:instructor,
        sender:student,
        type:'instuktor_create',
        schedule:schedule._id,
        message:`Instruktor utworzył lekcję ${typeName}`
      })



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
        from: '"IPZ" <narokallantest@gmail.com>',
        to: stud.email,
        subject: `Instruktor utworzył lekcję ${typeName}`,
        html: `
          <div style="text-align: center; font-family: Arial, sans-serif;">
            <img src="cid:logo" alt="Logo" style="width: 150px; margin-bottom: 20px;">
            <p style="font-size: 16px; color: #333;">Instruktor utworzył lekcję typu: <strong>${typeName}</strong></p>
          </div>`,
        attachments: [{
          filename: 'logofull.png',
          path: logoPath, // путь к изображению
          cid: 'logo' // должно совпадать с "cid:logo" в HTML
        }]
      };

      // Відправка листа
      await transporter.sendMail(mailOptions);
    }
    return res.status(201).json(schedule);
  } catch (error) {
    console.error('Błąd podczas tworzenia harmonogramu:', error);
    return res.status(500).json({ message: 'Błąd podczas tworzenia harmonogramu', error });
  }
});


router.post('/setNotes', verifyToken, async (req, res) => {
  try {
    const { studentNotes, date, startTime } = req.body;
    const userId = req.user._id; // з middleware verifyToken

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const updateSchedule = await Schedule.updateOne(
      {
        student: userId,
        date: { $gte: startOfDay, $lt: endOfDay },
        startTime: startTime,
      },
      {
        $set: { studentNotes: studentNotes },
      }
    );

    res.status(200).json({ updateSchedule });
  } catch (error) {
    console.error('Błąd podczas aktualizacji harmonogramu:', error);
    res.status(500).json({ message: 'Błąd podczas aktualizacji harmonogramu', error });
  }
});

router.post('/setassessment', verifyToken, async (req, res) => {
  try {
    const { assessment, date, startTime } = req.body;
    const userId = req.user._id; // з middleware verifyToken

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const updateSchedule = await Schedule.updateOne(
      {
        instructor: userId,
        date: { $gte: startOfDay, $lt: endOfDay },
        startTime: startTime,
      },
      {
        $set: { assessment: parseInt(assessment) },
      }
    );
    console.log(updateSchedule)

    res.status(200).json({ updateSchedule });
  } catch (error) {
    console.error('Błąd podczas aktualizacji harmonogramu:', error);
    res.status(500).json({ message: 'Błąd podczas aktualizacji harmonogramu', error });
  }
});

// Usuwanie lub anulowanie zapisu
router.delete('/', verifyToken, async (req, res) => {
  try {
    const { instructor, date, startTime } = req.body;
    const user = req.user;
    
    // Sprawdzenie, czy podano wszystkie wymagane dane
    if (!instructor || !date || !startTime) {
      return res.status(400).json({ message: 'Wymagane pola: instruktor, data, godzina rozpoczęcia' });
    }

    if (user.role === 'student') {
      // Student może tylko zmienić status na "cancelled", nie może usuwać
      const updatedSchedule = await Schedule.findOneAndUpdate(
        { 
          instructor, 
          date: { $gte: new Date(date).setHours(0, 0, 0, 0), $lt: new Date(date).setHours(23, 59, 59, 999) }, 
          startTime 
        },
        { $set: { status: 'cancelled' } }, 
        { new: true } 
      );

      if (!updatedSchedule) {
        return res.status(404).json({ message: 'Nie znaleziono zapisu lub brak uprawnień do jego zmiany' });
      }



      // Tworzenie powiadomienia dla instruktora
      const notificationRes = new notification({
        recipient: instructor,
        sender: user._id,
        type: 'request_cancellation',
        schedule: updatedSchedule._id,
        message: `Prośba o anulowanie zajęć na dzień ${updatedSchedule.date} o ${updatedSchedule.startTime}`,
      });

      await notificationRes.save();

      res.status(200).json({ message: 'Zapis został pomyślnie anulowany, powiadomienie wysłano do instruktora' });
    } else {
      // Instruktor lub administrator może usunąć zapis
      const deletedSchedule = await Schedule.findOneAndDelete({
        instructor,
        date: { $gte: new Date(date).setHours(0, 0, 0, 0), $lt: new Date(date).setHours(23, 59, 59, 999) }, 
        startTime,
      });

      if (!deletedSchedule) {
        return res.status(404).json({ message: 'Nie znaleziono zapisu lub brak uprawnień do jego usunięcia' });
      }

      const formattedDate = format(new Date(deletedSchedule.date), 'yyyy-MM-dd');

      // Powiadomienie dla studenta o anulowaniu zajęć
      const res_notification = new notification({
        recipient: deletedSchedule.student,
        sender: instructor,
        type: 'lesson_cancelled',
        schedule: deletedSchedule._id,
        message: `Instruktor anulował zajęcia na ${formattedDate} o ${deletedSchedule.startTime}`,
      });

      await res_notification.save();

      const stud = await User.findOne({ _id: deletedSchedule.student });

      // Konfiguracja transportu (Gmail)
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      // Parametry wiadomości e-mail
      const mailOptions = {
        from: '"IPZ" <narokallantest@gmail.com>',
        to: stud.email,
        subject: 'Instruktor anulował zajęcia',
        html: `
          <div style="text-align: center; font-family: Arial, sans-serif;">
            <img src="cid:logo" alt="Logo" style="width: 150px; margin-bottom: 20px;">
            <p style="font-size: 16px; color: #333;">Instruktor anulował zajęcia na ${formattedDate} o ${deletedSchedule.startTime}</p>
          </div>`,
        attachments: [{
          filename: 'logofull.png',
          path: logoPath,
          cid: 'logo'
        }]
      };

      await transporter.sendMail(mailOptions);

      res.status(200).json({ message: 'Zapis został pomyślnie usunięty, powiadomienie wysłano do studenta' });
    }
  } catch (err) {
    console.error('Błąd podczas usuwania lub anulowania zapisu:', err.message);
    res.status(500).json({ message: 'Wystąpił błąd serwera' });
  }
});




router.delete('/instruktorDel', verifyToken, async (req, res) => {
  try {
    const { type, date, startTime,instructor } = req.body;
    let userId;
    if(instructor){
      userId=instructor
    } else userId= req.user;

    // Перевірка, чи надано всі необхідні параметри
    if (!date || !startTime || !type) {
      return res.status(400).json({ message: 'Nie ma wystarczających danych do wykonania operacji.' });
    }

    // Якщо тип 'del', видаляємо запис
    if (type === 'usun') {
      const deletedSchedule = await Schedule.findOneAndDelete({
        instructor: userId, // інструктор має право видаляти лише свої записи
        date: { $gte: new Date(date).setHours(0, 0, 0, 0), $lt: new Date(date).setHours(23, 59, 59, 999) }, 
        startTime,
      });

      
      if (!deletedSchedule) {
        return res.status(404).json({ message: 'Rejestracja nie została znaleziona lub nie masz uprawnień do jej usunięcia.' });
      }
      if(deletedSchedule.student){
        const formattedDate = format(new Date(deletedSchedule.date), 'yyyy-MM-dd');



        
        // Створюємо сповіщення для студента
        const notificationres = await notification.create({
          recipient: deletedSchedule.student, // Сповіщення йде студенту
          sender: userId, // Інструктор є відправником
          type: 'cancellation_rejected', // Тип сповіщення
          schedule: deletedSchedule._id, // Пов'язуємо з конкретним розкладом
          message: `Instruktor anulował zajęcia na ${formattedDate} o ${deletedSchedule.startTime}`,
        });
  
        const stud = await User.findOne({ _id: deletedSchedule.student });

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
          to: stud.email, // Кому надсилаємо
          subject:'Instruktor anulował zajęcia ', // Тема листа
          html: 
          `<div style="text-align: center; font-family: Arial, sans-serif;">
          <img src="cid:logo" alt="Logo" style="width: 150px; margin-bottom: 20px;">
          <p style="font-size: 16px; color: #333;">Instruktor anulował zajęcia na ${formattedDate} o ${deletedSchedule.startTime}</p>
          </div>`,
          attachments: [{
            filename: 'logofull.png',
            path: logoPath, // путь к изображению
            cid: 'logo'  // HTML-контент письма
          }] // HTML-контент листа
          
        };

        await transporter.sendMail(mailOptions);
      }


      return res.status(200).json({ message: 'Rejestracja została pomyślnie usunięta, powiadomienie zostało wysłane.' });
    }

    // Якщо тип 'cancel_del', змінюємо статус на "cancelled"
    else if (type === 'cancel_del') {
      const updatedSchedule = await Schedule.findOneAndUpdate(
        {         
          instructor: userId, // інструктор має право видаляти лише свої записи
          date: { $gte: new Date(date).setHours(0, 0, 0, 0), $lt: new Date(date).setHours(23, 59, 59, 999) }, 
          startTime, 
        },
        { $set: { status: 'scheduled' } },
        { new: true } // Повертаємо оновлений документ
      );

      if (!updatedSchedule) {
        return res.status(404).json({ message: 'Rejestracja nie została znaleziona lub nie masz uprawnień do jej edytowania.' });
      }

      // Створюємо сповіщення для студента
      const notificationres = await notification.create({
        recipient: updatedSchedule.student, // Сповіщення йде студенту
        sender: userId, // Інструктор є відправником
        type: 'cancellation_rejected', // Тип сповіщення
        schedule: updatedSchedule._id, // Пов'язуємо з конкретним розкладом
        message: `Instruktor odmówił anulowania zajęć na ${formattedDate} o ${deletedSchedule.startTime}`,
      });

      return res.status(200).json({ message: 'Rejestracja została pomyślnie anulowana, powiadomienie zostało wysłane.' });
    } else {
      return res.status(400).json({ message: 'Nieznany typ operacji.' });
    }
  } catch (err) {
    console.error('Błąd podczas usuwania lub anulowania rejestracji:', err.message);
    return res.status(500).json({ message: 'Wystąpił błąd serwera.' });
  }
});


// Отримання розкладу на тиждень
router.get('/', verifyToken, async (req, res) => {
  try {
    let { date, instructorId } = req.query; // Дата понеділка передається через query параметри
    if(!instructorId){
      instructorId = req.user._id; // ID інструктора з токена
    }

    if (!date) {
      return res.status(400).json({ message: 'Wymagana jest data początku tygodnia (poniedziałek).' });
    }

    // Перетворюємо дату в ISO формат
    const startOfWeek = new Date(date);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate()+7); // Додаємо 6 днів, щоб отримати неділю



    // Знаходимо всі заняття в діапазоні дат для інструктора
    const schedules = await Schedule.find({
      instructor: instructorId,
      date: {
        $gte: startOfWeek,
        $lte: endOfWeek,
      },
    })
      .populate('student', 'name surname') // Додаємо інформацію про студента
      .populate('instructor', 'name surname') // Додаємо інформацію про інструктора
      .exec();

    res.status(200).json(schedules);
  } catch (error) {
    console.error('Błąd podczas pobierania harmonogramu:', error.message);
    res.status(500).json({ message: 'Błąd serwera.', error: error.message });
  }
});


// Отримання розкладу на тиждень
router.get('/withInstrukor', verifyToken, async (req, res) => {
  try {
    const instructorId=req.user._id;
    const { date } = req.query; // Дата понеділка передається через query параметри
    //const instructorId = req.user._id; // ID інструктора з токена

    if (!date) {
      return res.status(400).json({ message: 'Wymagana jest data początku tygodnia (poniedziałek).' });
    }

    // Перетворюємо дату в ISO формат
    const startOfWeek = new Date(date);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Додаємо 6 днів, щоб отримати неділю

    // Знаходимо всі заняття в діапазоні дат для інструктора
    const schedules = await Schedule.find({
      instructor: instructorId,
      date: {
        $gte: startOfWeek,
        $lte: endOfWeek,
      },
    })
      .populate('student', 'name surname') // Додаємо інформацію про студента
      .populate('instructor', 'name surname') // Додаємо інформацію про інструктора
      .exec();

    res.status(200).json(schedules);
  } catch (error) {
    console.error('Błąd podczas pobierania harmonogramu', error.message);
    res.status(500).json({ message: 'Błąd serwera.', error: error.message });
  }
});

// Запись ученика на занятие
router.post('/book', async (req, res) => {
  try {
    const { instructor, student, date, startTime, endTime } = req.body;

    // Проверка, свободен ли слот
    const conflictingSchedule = await Schedule.findOne({
      instructor,
      date,
      startTime: { $lt: endTime }, // Слот пересекается по времени
      endTime: { $gt: startTime },
      status: 'scheduled',
    });

    if (conflictingSchedule) {
      return res.status(400).json({ message: 'Wybrany czas jest już zarezerwowany.' });
    }

    // Создание новой записи
    const newSchedule = new Schedule({
      instructor,
      student,
      date,
      startTime,
      endTime,
      status: 'scheduled',
    });

    await newSchedule.save();
    res.status(201).json({ message: 'Rezerwacja zakończona pomyślnie!', schedule: newSchedule });
  } catch (error) {
    res.status(500).json({ message: 'Błąd podczas rezerwacji harmonogramu.', error });
  }
});

// Получение доступных слотов инструктора
router.get('/available/:instructorId', async (req, res) => {
  try {
    const { instructorId } = req.params;
    const { date } = req.query; // Фильтрация по дате (если требуется)

    const query = { 
      instructor: instructorId, 
      status: 'scheduled',
    };

    if (date) {
      query.date = date; // Фильтр по конкретной дате
    }

    const availableSlots = await Schedule.find(query)
      .populate('instructor', 'name email') // Информация об инструкторе
      .select('date startTime endTime status'); // Только важные поля

    res.status(200).json(availableSlots);
  } catch (error) {
    res.status(500).json({ message: 'Błąd podczas pobierania dostępnych slotów.', error });
  }
});

// Отмена записи
router.delete('/:scheduleId', async (req, res) => {
  try {
    const { scheduleId } = req.params;

    const schedule = await Schedule.findById(scheduleId);

    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    schedule.status = 'cancelled'; // Изменяем статус
    await schedule.save();



    res.status(200).json({ message: 'Harmonogram został pomyślnie anulowany.', schedule });
  } catch (error) {
    res.status(500).json({ message: 'Błąd podczas anulowania harmonogramu.', error });
  }
});

// Получение записей пользователя
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const schedules = await Schedule.find({
      $or: [{ instructor: userId }, { student: userId }],
    })
      .populate('instructor student', 'name email')
      .select('date startTime endTime status');
      
    res.status(200).json(schedules);
  } catch (error) {
    res.status(500).json({ message: 'Błąd podczas pobierania harmonogramów użytkownika.', error });
  }
});

// Редактирование записи
router.put('/:scheduleId', async (req, res) => {
  try {
    const { scheduleId } = req.params;
    const updates = req.body; // Обновляемые поля

    const schedule = await Schedule.findByIdAndUpdate(scheduleId, updates, { new: true });

    if (!schedule) {
      return res.status(404).json({ message: 'Harmonogram nie został znaleziony.' });
    }

    res.status(200).json({ message: 'Harmonogram został pomyślnie zaktualizowany.', schedule });
  } catch (error) {
    res.status(500).json({ message: 'Błąd podczas aktualizacji harmonogramu.', error });
  }
});

router.get('/getCount', verifyToken ,async (req, res) => {
  try {
    const userId = req.user._id;  // Отримуємо ID користувача з токену (передбачається, що користувач авторизований)
    // Запит до колекції Schedule, щоб підрахувати кількість різних типів занять
    const counts = await Schedule.aggregate([
      { $match: { student: userId } },  // Фільтруємо за користувачем
      { $group: {
        _id: null,  // Не групуємо за полями, оскільки нам потрібно підрахувати всі
        lectureCount: { $sum: { $cond: [{ $eq: ["$type", "wyklad"] }, 1, 0] } },  // Підрахунок кількості лекцій
        examCountT: { $sum: { $cond: [{ $eq: ["$type", "egzamin_t"] }, 1, 0] } },
        examCountP: { $sum: { $cond: [{ $eq: ["$type", "egzamin_p"] }, 1, 0] } },  // Підрахунок кількості екзаменів
        practiceCount: { $sum: { $cond: [{ $eq: ["$type", "praktyka"] }, 1, 0] } } 
         // Підрахунок кількості практичних
      }},
    ]);
    
    if (counts.length === 0) {
      return res.status(404).json({ message: 'Nie znaleziono zapisów.' });
    }
    
    // Відправляємо результат
    res.status(200).json({
      lectureCount: counts[0].lectureCount,
      examCountT: counts[0].examCountT,
      examCountP: counts[0].examCountP,
      practiceCount: counts[0].practiceCount
    });
  } catch (err) {
    console.error('Błąd podczas pobierania liczby zajęć:', err.message);
    res.status(500).json({ message: 'Wystąpił błąd podczas pobierania danych.' });
  }
});

router.get('/student/grades/:id', verifyToken, async (req, res) => {
  try {
    const results = await Schedule.find({
      student: req.params.id,
      assessment: { $exists: true }
    })
    .select('date startTime endTime type assessment')
    .sort({ date: -1 });

    res.json(results);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

//myLessons
router.get('/myLessons', verifyToken, async (req, res) => {
  try {
    const userId = req.user._id;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const inTwoWeeks = new Date(today);
    inTwoWeeks.setDate(inTwoWeeks.getDate() + 14);

    const lessons = await Schedule.find({
      student: userId,
      date: {
        $gte: today,
        $lte: inTwoWeeks
      }
    })
    .populate('instructor', 'name surname')
    .sort({ date: 1, startTime: 1 });

    res.status(200).json(lessons);
  } catch (err) {
    console.error("Błąd pobierania lekcji:", err);
    res.status(500).json({ message: 'Błąd pobierania lekcji', err });
  }
});
//Poluchenie notatok na prepode
// Получение заметок от учеников на преподавателя (ограничение на 2 недели вперёд)
router.get('/notesForInstructor', verifyToken, async (req, res) => {
  try {
    const instructorId = req.user._id;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const inTwoWeeks = new Date(today);
    inTwoWeeks.setDate(inTwoWeeks.getDate() + 14);

    const notes = await Schedule.find({
      instructor: instructorId,
      studentNotes: { $ne: '' },
      date: {
        $gte: today,
        $lte: inTwoWeeks
      }
    })
      .populate('student', 'name surname')
      .sort({ date: 1, startTime: 1 }); // сортировка по дате (по возрастанию)

    res.status(200).json(notes);
  } catch (err) {
    console.error("Błąd pobierania notatek:", err);
    res.status(500).json({ message: 'Błąd pobierania notatek', err });
  }
});




module.exports = router;