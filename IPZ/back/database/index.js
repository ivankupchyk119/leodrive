const mongoose = require('mongoose');
require('dotenv').config();  // Додати для роботи з .env файлом

const uri = process.env.MONGO_URI;  // Використовуємо URI з .env файлу

mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log("Connected to MongoDB Atlas"))
  .catch(err => console.error("Error connecting to MongoDB Atlas:", err));
