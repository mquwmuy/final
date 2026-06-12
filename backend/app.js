const express = require('express');
const cors = require('cors');
const db = require('./connect');  // это просто проверить подключение

const app = express();
const PORT = 3000;

app.use(cors()); //cors типа чтобы браузер мог обращаться к серверу с разных адресов/ и чтобы это работало везде
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // это всё мидлваре

const authRoutes = require('./auth');
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
    res.send('Сервер работает!');
});

// Запускаем сервер
app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
});