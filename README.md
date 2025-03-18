# VA Appointment Booking System

Система за резервации, преработена за хостване в Netlify.

## Технологичен стек

- **Frontend:** React, Bootstrap
- **Backend:** Netlify Functions (serverless)
- **База данни:** FaunaDB
- **Автентикация:** JWT

## Настройка за разработка

### Предварителни изисквания

1. Node.js (v14+)
2. Netlify CLI (`npm install -g netlify-cli`)
3. FaunaDB акаунт (https://fauna.com)

### Стъпки за настройка

1. **Клониране на репозиторито**

```bash
git clone <repository-url>
cd va-appointment-booking
```

2. **Инсталиране на зависимостите**

```bash
npm install
```

3. **Създаване на .env файл**

Копирайте `.env.example` към `.env` и попълнете необходимите стойности:

```bash
cp .env.example .env
```

4. **Настройка на FaunaDB**

- Създайте акаунт в FaunaDB
- Създайте нова база данни
- Създайте API ключ и го добавете в .env файла като FAUNA_SECRET_KEY
- Инициализирайте базата данни с нашия помощен скрипт:

```bash
npm run init-db
```

Това ще създаде автоматично всички необходими колекции и индекси в базата данни.

5. **Стартиране на проекта в режим за разработка**

```bash
npm run dev
```

Това ще стартира frontend на http://localhost:8888 и serverless функциите на http://localhost:8888/.netlify/functions/

## Деплойване в Netlify

### Настройка на Netlify

1. Създайте акаунт в Netlify
2. Свържете вашия GitHub репозитори
3. Конфигурирайте environment променливите в Netlify:
   - `FAUNA_SECRET_KEY`
   - `JWT_SECRET`

### Деплойване от командния ред

```bash
# Логин в Netlify
netlify login

# Създаване на нов Netlify сайт
netlify init

# Деплойване
netlify deploy --prod
```

## Мигриране на данни

За да мигрирате съществуващите данни от PostgreSQL към FaunaDB, можете да използвате скрипта за миграция:

```bash
node scripts/migrate-data.js
```

## Файлова структура

```
project/
├── functions/           # Netlify serverless функции
│   ├── auth.js          # Автентикация
│   ├── services.js      # Управление на услуги
│   ├── appointments.js  # Резервации
│   ├── gallery.js       # Галерия
│   ├── reviews.js       # Отзиви
│   └── utils/           # Помощни функции
│       ├── db.js        # База данни
│       └── auth.js      # Авторизация
├── scripts/             # Помощни скриптове
│   └── init-fauna-db.js # Инициализиране на база данни
├── src/                 # React frontend
├── public/              # Статични файлове
├── netlify.toml         # Конфигурация за Netlify
└── package.json         # Проектни зависимости
```

```bash
npm run init-db
```
