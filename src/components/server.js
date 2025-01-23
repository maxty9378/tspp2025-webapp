const https = require('https');
const fs = require('fs');
const express = require('express');

const app = express();

// Загрузка сертификата и ключа
const options = {
  key: fs.readFileSync('server.key'),
  cert: fs.readFileSync('server.cert')
};

// Настройка маршрута
app.get('/', (req, res) => {
  res.send('Привет, мир! Это HTTPS сервер.');
});

// Запуск сервера
https.createServer(options, app).listen(5173, () => {
  console.log('Сервер запущен на https://localhost:5173');
});
