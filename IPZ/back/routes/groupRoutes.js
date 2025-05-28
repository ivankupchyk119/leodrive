const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Group = require('../models/Group');

// Middleware для auth
function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, process.env.SECRET || 'aboba');
    req.user = decoded;
    next();
  } catch (err) {
    res.status(403).json({ error: 'Invalid token' });
  }
}

// 🔧 Создать группу
router.post('/', auth, async (req, res) => {
  const { name, members = [] } = req.body;

  // Проверка, чтобы имя группы не было пустым
  if (!name || name.trim() === '') {
    return res.status(400).json({ error: 'Название группы обязательно' });
  }

  try {
    // При создании группы добавляем текущего пользователя в список участников
    const group = new Group({
      name,
      members: [...new Set([...members, req.user.userId])], // добавление уникального пользователя
      createdBy: req.user.userId,
    });

    await group.save();
    res.status(201).json(group);
  } catch (err) {
    console.error(err); // Логирование ошибки для диагностики
    res.status(500).json({ error: 'Ошибка при создании группы' });
  }
});

// 📦 Получить группы, в которых состоит пользователь
router.get('/', auth, async (req, res) => {
  try {
    const groups = await Group.find({ members: req.user.userId });
    res.json(groups);
  } catch (err) {
    console.error(err); // Логирование ошибки
    res.status(500).json({ error: 'Ошибка при получении групп' });
  }
});

// ➕ Добавить пользователя в группу
router.post('/:groupId/add', auth, async (req, res) => {
  const { userId } = req.body;

  // Проверка на корректность userId
  if (!userId) {
    return res.status(400).json({ error: 'Не указан ID пользователя' });
  }

  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ error: 'Группа не найдена' });

    // Проверка, что текущий пользователь является участником группы
    if (!group.members.includes(req.user.userId)) {
      return res.status(403).json({ error: 'Нет доступа' });
    }

    // Добавление нового пользователя в группу, если его нет в списке
    if (!group.members.includes(userId)) {
      group.members.push(userId);
      await group.save();
    }

    res.json(group);
  } catch (err) {
    console.error(err); // Логирование ошибки
    res.status(500).json({ error: 'Ошибка при добавлении пользователя' });
  }
});

module.exports = router;
