const { Pool } = require('pg');  

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'project11',
    user: 'postgres',
    password: '12345',
    client_encoding: 'UTF8'
});

module.exports = pool;