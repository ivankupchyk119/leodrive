const express = require('express');
const Course = require('../models/Course');
const verifyToken = require('../middleWare/VerifyToken');
const User = require('../models/User');
const router = express.Router();
const nodemailer = require('nodemailer');

router.get('/',async(req,res)=>{
    try{
        const courses=await Course.find({});
        res.json(courses);
    }catch(error){
        res.status(500).json({ message: 'Błąd podczas pobierania kursów.', error });
    }
});


router.post('/', verifyToken, async (req, res) => {
    try {
        const userId = req.user._id; // Pobieranie ID użytkownika z tokena
        const { courseId } = req.body; // Pobieranie ID kursu z ciała żądania

        if (!courseId) {
            return res.status(400).json({ message: 'ID kursu jest wymagane' });
        }

        // Sprawdzamy, czy kurs istnieje
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: 'Nie znaleziono kursu' });
        }

        // Znajdujemy użytkownika
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'Nie znaleziono użytkownika' });
        }

        // Dodajemy kurs do użytkownika
        user.course = courseId;
        await user.save();

        // Konfiguracja emaila
        const adminEmail = process.env.EMAIL_ADMIN; // Email administratora
        const emailContent = `
          <div>
            <h3>Nowy kurs został wybrany przez użytkownika!</h3>
            <p><strong>Użytkownik:</strong> ${user.name} ${user.surname} (${user.email})</p>
            <p><strong>Kurs:</strong> ${course.name}</p>
            <p><strong>Kategoria:</strong> ${course.category}</p>
          </div>
        `;

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER, // Twoja poczta Gmail
                pass: process.env.EMAIL_PASS, // Hasło aplikacji z Google
            },
        });

        const mailOptions = {
            from: '"Leo Drive" <narokallantest@gmail.com>', // Adres nadawcy
            to: adminEmail, // Adres administratora
            subject: 'Użytkownik wybrał nowy kurs', // Temat wiadomości
            html: emailContent, // Zawartość wiadomości w HTML
        };

        // Wysyłanie emaila
        await transporter.sendMail(mailOptions);

        res.status(200).json({ message: 'Kurs został pomyślnie przypisany, administrator został powiadomiony', user });
    } catch (error) {
        console.error('Błąd przypisywania kursu:', error.message);
        res.status(500).json({ message: 'Błąd przypisywania kursu', error });
    }
});




module.exports=router