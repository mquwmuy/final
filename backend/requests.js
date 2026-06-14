//заявки   


// разобрать



const express = require('express');
const db = require('./connect');

const router = express.Router();

// ПОЛУЧИТЬ ВСЕ ЗАЯВКИ ПОЛЬЗОВАТЕЛЯ
router.get('/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        const result = await db.query(
            `SELECT r.*, t.type_transport 
             FROM requests r
             JOIN transport t ON r.transport_id_fk = t.transport_id
             WHERE r.user_id_fk = $1
             ORDER BY r.created_at DESC`,
            [userId]
        );
        
        res.json(result.rows);
    } catch (error) {
        console.error('Ошибка получения заявок:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// новая заявка
router.post('/', async (req, res) => {
    try {
        const { userId, transportId, startDate, paymentMethod } = req.body;
        
        if (!userId || !transportId || !startDate || !paymentMethod) {
            return res.status(400).json({ error: 'Заполните все поля' });
        }
        
        const result = await db.query(
            `INSERT INTO requests (status_requests, payment_requests, start_requests, user_id_fk, transport_id_fk) 
             VALUES ($1, $2, $3, $4, $5) 
             RETURNING *`,
            ['Новая', paymentMethod, startDate, userId, transportId]
        );
        
        res.status(201).json({
            message: 'Заявка создана!',
            request: result.rows[0]
        });
    } catch (error) {
        console.error('Ошибка создания заявки:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// ДОБАВИТЬ ОТЗЫВ К ЗАЯВКЕ
router.post('/:requestId/feedback', async (req, res) => {
    try {
        const { requestId } = req.params;
        const { feedback, userId } = req.body;
        
        // проверяем что заявка принадлежит пользователю и имеет статус "Обучение завершено"
        const checkResult = await db.query(
            `SELECT * FROM requests 
             WHERE requests_id = $1 AND user_id_fk = $2`,
            [requestId, userId]
        );
        
        if (checkResult.rows.length === 0) {
            return res.status(404).json({ error: 'Заявка не найдена' });
        }
        
        const request = checkResult.rows[0];
        
        if (request.status_requests !== 'Обучение завершено') {
            return res.status(400).json({ error: 'Отзыв можно оставить только после завершения обучения' });
        }
        
        // добавляем отзыв
        await db.query(
            `UPDATE requests SET feedback = $1 WHERE requests_id = $2`,
            [feedback, requestId]
        );
        
        res.json({ message: 'Отзыв добавлен!' });
    } catch (error) {
        console.error('Ошибка добавления отзыва:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// ПОЛУЧИТЬ ВСЕ ВИДЫ ТРАНСПОРТА (для выпадающего списка)
router.get('/transports', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM transport ORDER BY transport_id');
        res.json(result.rows);
    } catch (error) {
        console.error('Ошибка получения транспорта:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

module.exports = router;