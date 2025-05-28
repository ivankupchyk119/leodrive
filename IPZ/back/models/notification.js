const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Інструктор
  // Кому приходить сповіщення (учень або інструктор)  
  // Do kogo przychodzi powiadomienie (uczeń lub instruktor)

  sender:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Учень
  // Хто відправив сповіщення (необов'язково)  
  // Kto wysłał powiadomienie (nieobowiązkowe)

  type: { 
    type: String, 
    enum: [
      'request_cancellation', // Запит на скасування заняття (від учня до інструктора)  
                              // Prośba o anulowanie zajęć (od ucznia do instruktora)
      'cancellation_approved', // Інструктор схвалив скасування (для учня)  
                               // Instruktor zatwierdził anulowanie (dla ucznia)
      'cancellation_rejected', // Інструктор відхилив скасування (для учня)  
                               // Instruktor odrzucił anulowanie (dla ucznia)
      'new_booking', // Учень записався на заняття (інструктор отримує сповіщення)  
                     // Uczeń zapisał się na zajęcia (instruktor otrzymuje powiadomienie)
      'lesson_cancelled', // Інструктор скасував заняття (учень отримує сповіщення)  
                         // Instruktor anulował zajęcia (uczeń otrzymuje powiadomienie)
      'instuktor_create'
    ], 
    required: true 
  },

  schedule: { type: mongoose.Schema.Types.ObjectId, ref: 'Schedule', required: false },
  // Посилання на заняття, яке стосується сповіщення  
  // Odnośnik do zajęć, których dotyczy powiadomienie

  message: { type: String, required: true }, 
  // Текст сповіщення  
  // Treść powiadomienia

  createdAt: { type: Date, default: Date.now } 
  // Дата створення сповіщення  
  // Data utworzenia powiadomienia
});

module.exports = mongoose.model('Notification', NotificationSchema);
