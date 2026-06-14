//регистрация
const express = require('express'); // библиотека express
const bcrypt = require('bcrypt');  // для шифрования паролей
const db = require('./connect');   // подключение к БД

const router = express.Router();
//req (request) — то, что прислал пользователь (логин, пароль, имя)
//res (response) — то, что мы вернём обратно (сообщение об успехе или ошибке)
router.post('/register', async (req, res) => {
    try {
        const { // получаем данные для регистрации
            login, 
            password, 
            name, 
            lastName, 
            middleName, 
            email, 
            phone 
        } = req.body;
  
        // Проверка длины логина (мин 6 символов, только латиница и цифры)
        if (login.length < 6) {
            return res.status(400).json({ error: 'Логин должен быть минимум 6 символов' });
        }
        if (!/^[a-zA-Z0-9]+$/.test(login)) { //.test(login)	Метод, который проверяет, подходит ли строка под правило
            return res.status(400).json({ error: 'Логин может содержать только латинские буквы и цифры' });
        }
        
        // Проверка пароля (мин 8 символов)
        if (password.length < 8) {
            return res.status(400).json({ error: 'Пароль должен быть минимум 8 символов' });
        }
        
        // Проверка email
        if (!email.includes('@')) {
            return res.status(400).json({ error: 'Введите корректный email' });
        }

        // Проверяем не занят ли логин
        const checkUser = await db.query(
            'SELECT * FROM user_ WHERE login_user = $1',
            [login]
        );
        
        if (checkUser.rows.length > 0) {
            return res.status(400).json({ error: 'Этот логин уже занят' });
        }

        // Шифрую пароль
        const hashedPassword = await bcrypt.hash(password, 10);

        // cохраня. пользователя в базу данных
        const result = await db.query(
            `INSERT INTO user_ (login_user, password_user, name_user, last_name_user, 
                                middle_name_user, email_user, contact_phone_user, role_id_fk) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
             RETURNING user_id`,
            [login, hashedPassword, name, lastName, middleName || null, email, phone, 3]
        );

        res.status(201).json({ 
            userId: result.rows[0].user_id
        });

    } catch (error) {
        console.error('Ошибка регистрации:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { login, password } = req.body;

        if (!login || !password) {
            return res.status(400).json({ error: 'Введите логин и пароль' });
        }

        const result = await db.query(
            'SELECT * FROM user_ WHERE login_user = $1',
            [login]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Неверный логин или пароль' });
        }

        const user = result.rows[0];
        const isPasswordValid = await bcrypt.compare(password, user.password_user);

        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Неверный логин или пароль' });
        }

        res.json({
            success: true,
            userId: user.user_id,
            roleId: user.role_id_fk
        });

    } catch (error) {
        console.error('Ошибка входа:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

module.exports = router;