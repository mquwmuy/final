const express = require('express');
const db = require('./connect');

const router = express.Router();

// АДМИН: вход (только специальная пара Admin26/Demo20)
router.post('/login', async (req, res) => {
    try {
        const { login, password } = req.body;
        
        // Проверяем специальную пару из задания
        if (login === 'Admin26' && password === 'Demo20') {
            return res.json({
                success: true,
                message: 'Вход в админ-панель'
            });
        }
        
        // Если не совпало - ошибка
        return res.status(401).json({ error: 'Неверный логин или пароль администратора' });
        
    } catch (error) {
        console.error('Ошибка:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// АДМИН: получить ВСЕ заявки (с фильтрацией и сортировкой)
router.get('/requests', async (req, res) => {
    try {
        // Получаем параметры фильтрации из запроса
        const { status, sort, page = 1, limit = 10 } = req.query;
        
        let sql = `
            SELECT r.*, 
                   u.name_user, u.last_name_user, u.email_user,
                   t.type_transport
            FROM requests r
            JOIN user_ u ON r.user_id_fk = u.user_id
            JOIN transport t ON r.transport_id_fk = t.transport_id
            WHERE 1=1
        `;
        const params = [];
        let paramIndex = 1;
        
        // Фильтр по статусу
        if (status && status !== 'все') {
            sql += ` AND r.status_requests = $${paramIndex}`;
            params.push(status);
            paramIndex++;
        }
        
        // Сортировка
        if (sort === 'date_asc') {
            sql += ` ORDER BY r.created_at ASC`;
        } else if (sort === 'date_desc') {
            sql += ` ORDER BY r.created_at DESC`;
        } else if (sort === 'status_asc') {
            sql += ` ORDER BY r.status_requests ASC`;
        } else {
            sql += ` ORDER BY r.created_at DESC`;
        }
        
        // Пагинация
        const offset = (page - 1) * limit;
        sql += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(limit, offset);
        
        const result = await db.query(sql, params);
        
        // Получаем общее количество заявок для пагинации
        let countSql = `SELECT COUNT(*) FROM requests WHERE 1=1`;
        const countParams = [];
        if (status && status !== 'все') {
            countSql += ` AND status_requests = $1`;
            countParams.push(status);
        }
        const countResult = await db.query(countSql, countParams);
        const total = parseInt(countResult.rows[0].count);
        
        res.json({
            requests: result.rows,
            total: total,
            page: parseInt(page),
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        console.error('Ошибка:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// АДМИН: изменить статус заявки
router.put('/requests/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        // Разрешённые статусы по заданию
        const allowedStatuses = ['Новая', 'Идет обучение', 'Обучение завершено'];
        
        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({ error: 'Недопустимый статус' });
        }
        
        // Проверяем, существует ли заявка
        const checkResult = await db.query(
            'SELECT * FROM requests WHERE requests_id = $1',
            [id]
        );
        
        if (checkResult.rows.length === 0) {
            return res.status(404).json({ error: 'Заявка не найдена' });
        }
        
        // Обновляем статус
        await db.query(
            'UPDATE requests SET status_requests = $1 WHERE requests_id = $2',
            [status, id]
        );
        
        res.json({
            success: true,
            message: `Статус изменён на "${status}"`
        });
    } catch (error) {
        console.error('Ошибка:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

module.exports = router;