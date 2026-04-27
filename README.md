# Telegram-бот «Елизаветинское барокко»

Бот на Node.js, TypeScript и Telegraf работает как навигатор по Telegram-каналу «Елизаветинское барокко». Пользователь выбирает рубрику, видит список публикаций в виде inline URL-кнопок и переходит прямо к нужному посту в канале.

## Что умеет бот

- отвечает на команды `/start` и `/help`
- показывает главное меню с кнопками:
  - `🔎 Найти пост по теме`
  - `🎲 Викторина`
  - `📢 Вернуться в канал`
  - `🚶 Заказать экскурсию`
  - `ℹ️ Помощь`
- показывает рубрики постов:
  - `👥 Истории о людях`
  - `🏛️ Архитектура и скульптура`
  - `🦁 Петербургские львы`
  - `💎 Фаберже`
  - `📍 Куда сходить?`
- выводит посты выбранной рубрики списком inline URL-кнопок
- показывает первые 8 постов рубрики и добавляет кнопку `➡️ Показать ещё`, если постов больше
- запускает викторину с inline-вариантами ответов
- поддерживает вопросы викторины с локальными изображениями
- выдаёт вопросы викторины в случайном порядке без повторов до прохождения всего списка
- хранит данные локально в JSON, без базы данных и внешних API

## Стек

- Node.js
- TypeScript
- Telegraf
- dotenv
- локальные JSON-файлы

## Установка зависимостей

```bash
npm install
```

## Настройка `.env`

Скопируйте пример:

```bash
copy .env.example .env
```

Заполните переменные:

```env
BOT_TOKEN=ваш_токен_от_BotFather
CHANNEL_URL=https://t.me/elizaveta_guide_spb
GUIDE_DM_URL=https://t.me/lisademyanova
```

`CHANNEL_URL` используется для кнопки возвращения в канал. `GUIDE_DM_URL` используется для кнопки заказа экскурсии; если переменная не задана, бот использует `https://t.me/lisademyanova`.

## Запуск

Локальный запуск в режиме polling:

```bash
npm run dev
```

Сборка TypeScript:

```bash
npm run build
```

Запуск собранной версии:

```bash
npm start
```

## Деплой

Для Koyeb через GitHub используйте такие команды:

- Build Command: `npm run build`
- Start Command: `npm start`

Environment Variables:

```env
BOT_TOKEN=
CHANNEL_URL=
GUIDE_DM_URL=
```

Файл `.env` нельзя публиковать и нельзя коммитить в GitHub: реальный токен нужно добавить только в переменные окружения Koyeb.

После деплоя не держите одновременно локальный `npm run dev` с тем же `BOT_TOKEN`, иначе polling будет конфликтовать между локальным ботом и ботом на Koyeb.

## Деплой на Vercel

1. Импортируйте GitHub-репозиторий в Vercel.
2. Добавьте Environment Variables:
   - `BOT_TOKEN`
   - `CHANNEL_URL`
   - `GUIDE_DM_URL`
   - `WEBHOOK_SECRET`
   - `SETUP_SECRET`
3. После деплоя откройте ссылку:

```text
https://<vercel-domain>/api/set-webhook?secret=<SETUP_SECRET>
```

4. Проверьте webhook endpoint:

```text
https://<vercel-domain>/api/bot
```

5. После установки webhook не запускайте локальный polling с тем же токеном одновременно.

## Деплой на VPS Timeweb

Что нужно на сервере:

- Ubuntu 22.04/24.04
- Node.js 20+
- Git
- PM2

Команды для первого запуска:

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2

git clone <URL_РЕПОЗИТОРИЯ>
cd <ПАПКА_ПРОЕКТА>
nano .env
```

Содержимое `.env`:

```env
BOT_TOKEN=реальный_токен
CHANNEL_URL=https://t.me/elizaveta_guide_spb
GUIDE_DM_URL=https://t.me/lisademyanova
```

Дальше:

```bash
npm install
npm run build
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

Команды обслуживания:

```bash
pm2 status
pm2 logs elizaveta-barokko-bot
pm2 restart elizaveta-barokko-bot
pm2 stop elizaveta-barokko-bot
```

Команды обновления проекта:

```bash
git pull
npm install
npm run build
pm2 restart elizaveta-barokko-bot
```

Важно:

- Не запускайте локально `npm run dev` с тем же токеном одновременно с VPS.
- После переезда на VPS Vercel webhook больше не нужен, потому что `src/index.ts` вызывает `deleteWebhook()`.
- `.env` никогда нельзя коммитить.
- Перед production-запуском перевыпустите `BOT_TOKEN` в BotFather.

## Telegram API proxy через Cloudflare Worker

Если на VPS не открывается `https://api.telegram.org`, можно оставить бота на VPS и отправлять запросы Telegraf к Telegram API через Cloudflare Worker.

1. Авторизуйтесь в Cloudflare:

```bash
npx wrangler login
```

2. Добавьте secret для Worker:

```bash
npm run cf:proxy:secret
```

3. Задеплойте Worker:

```bash
npm run cf:proxy:deploy
```

4. Скопируйте URL Worker из вывода Wrangler.

5. На VPS добавьте в `.env`:

```env
TELEGRAM_API_ROOT=https://<worker-domain>/telegram/<PROXY_SECRET>
```

6. Обновите проект на VPS:

```bash
git pull
npm install
npm run build
pm2 restart elizaveta-barokko-bot
```

7. Проверьте прокси:

```bash
curl -4 -m 20 "https://<worker-domain>/telegram/<PROXY_SECRET>/bot${BOT_TOKEN}/getMe"
```

`PROXY_SECRET` не нужно добавлять в код или Git. Он хранится в Cloudflare Worker secrets, а на VPS используется только внутри `TELEGRAM_API_ROOT`.

## Структура проекта

```text
.
├─ src/
│  ├─ data/
│  │  ├─ posts.json
│  │  ├─ quizQuestions.json
│  │  ├─ buildings.json
│  │  ├─ foodPlaces.json
│  │  └─ places.json
│  ├─ types/
│  │  ├─ post.ts
│  │  ├─ quizQuestion.ts
│  │  ├─ building.ts
│  │  ├─ foodPlace.ts
│  │  └─ place.ts
│  ├─ utils/
│  │  ├─ keyboards.ts
│  │  ├─ formatBuilding.ts
│  │  ├─ formatFoodPlace.ts
│  │  └─ formatPlace.ts
│  └─ index.ts
├─ assets/
│  └─ quiz/
├─ .env.example
├─ package.json
├─ README.md
└─ tsconfig.json
```

## Как устроены посты

Посты для раздела `🔎 Найти пост по теме` лежат в `src/data/posts.json`.

Чтобы добавить новый пост, нужен объект с полями:

- `title` — название кнопки, которое увидит пользователь
- `category` — одна из рубрик бота
- `url` — ссылка на конкретную публикацию в Telegram-канале
- `tags` — теги для внутренней группировки и будущего поиска

Пример:

```json
{
  "id": 19,
  "title": "Название нового поста",
  "category": "Истории о людях",
  "url": "https://t.me/elizaveta_guide_spb/99",
  "tags": ["#люди", "#истории"]
}
```

Описание поста можно не добавлять: в интерфейсе раздела показываются только кнопки-ссылки с названиями публикаций.

## Как устроена викторина

Вопросы для раздела `🎲 Викторина` лежат в `src/data/quizQuestions.json`.

Для каждого пользователя бот создаёт отдельную перемешанную очередь вопросов. Вопросы не повторяются, пока пользователь не пройдёт весь список; после этого бот начинает новый круг.

Чтобы добавить обычный вопрос, нужен объект с полями:

- `question` — текст вопроса
- `options` — варианты ответа
- `correctOptionIndex` — индекс правильного варианта, начиная с `0`
- `explanation` — пояснение после ответа пользователя
- `category` — тема вопроса

Чтобы добавить вопрос с фото, положите изображение в папку `assets/quiz` и добавьте в объект поле `imagePath`. Путь указывается от корня проекта. Для единообразия называйте файлы по id вопроса: `question-001.jpg`, `question-002.jpg`, `question-003.jpg`.

Пример вопроса с изображением:

```json
{
  "id": 5,
  "question": "Кто изображён на картине?",
  "options": [
    "Екатерина II",
    "Елизавета Петровна",
    "Анна Иоанновна",
    "Мария Фёдоровна"
  ],
  "correctOptionIndex": 1,
  "explanation": "Это Елизавета Петровна — российская императрица, с эпохой которой связано развитие русского барокко.",
  "category": "История",
  "imagePath": "assets/quiz/question-001.jpg"
}
```

Если у вопроса есть `imagePath`, бот отправит фото с вопросом в caption и inline-кнопками ответов. Если фото не отправится, бот автоматически покажет обычный текстовый вопрос.
