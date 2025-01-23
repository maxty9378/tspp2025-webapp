# ТСПП2025 Web App

Веб-приложение для участников программы ТСПП2025.

## Функциональность

- Авторизация через Telegram WebApp
- Общий чат участников
- Система достижений и баллов
- Анкеты обратной связи (АОС)
- Офлайн поддержка
- Административная панель

## Технологии

- React
- TypeScript
- Tailwind CSS
- Supabase
- Telegram Bot API
- Framer Motion

## Установка 

```bash
# Клонируем репозиторий
git clone https://github.com/USERNAME/tspp2025-webapp.git

# Переходим в директорию проекта
cd tspp2025-webapp

# Устанавливаем зависимости
npm install

# Создаем .env файл и заполняем переменные окружения
cp .env.example .env
```

## Запуск

```bash
# Режим разработки
npm run dev

# Сборка проекта
npm run build
```

## Переменные окружения

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_TELEGRAM_BOT_TOKEN=your_telegram_bot_token
``` 