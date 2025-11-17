# PromptHack 2025 — симулятор экзамена с AI‑преподавателем

Платформа имитирует сдачу экзамена с «живым» виртуальным преподавателем: он задаёт вопросы, реагирует эмоциями, оценивает ответы, возвращает к теме, формирует дополнительные вопросы и ведёт разбор. Система сочетает RAG over Qdrant, распознавание речи, синтез голоса и текстовые модели, поэтому диалог ощущается максимально естественным.

## Возможности

- Голосовой экзамен с эмоциональной оценкой преподавателя и историей контекста
- Подготовка к экзамену в формате чата с тем же «преподом»
- Загрузка PDF/URL материалов в Qdrant и построение RAG-контекста
- Автоматическая проверка, не ушёл ли студент от темы, и мягкий возврат к предмету
- Встроенный портал с расписанием, материалами и интерфейсом ассистента

## Используемые модели и сервисы

- `gpt-4o` и `gpt-4o-mini` — генерация вопросов, анализ ответов, создание подсказок
- `text-embedding-3-small` — векторизация материалов для Qdrant
- Deepgram `nova-2` — транскрибация голосовых ответов
- Yandex SpeechKit (голоса jane, zahar, omazh, ermil) — эмоциональный синтез речи преподавателя
- RAG-стек: Qdrant + PostgreSQL для хранения материалов и fallback

## Архитектура

- **Frontend** (`Frontend/`): React + Vite, UI ассистента, расписания и загрузки материалов
- **Backend** (`Backend/`): FastAPI, эндпоинты экзамена и обучения, интеграции с AI/voice сервисами
- **Data Layer**: PostgreSQL (пользователи, сессии), Qdrant (векторное хранилище материалов), S3-совместимое хранилище для аудио
- **Инфраструктура**: Docker Compose поднимает backend, frontend, PostgreSQL и Qdrant

## Быстрый старт

1. Создайте `Backend/.env` (см. блок ниже)
2. Запустите сервисы:
   ```bash
   cd Backend
   docker-compose up -d
   ```
3. Логи: `docker-compose logs -f`
4. Остановка: `docker-compose down` (или `down -v` для очистки volumes)
5. Пересборка после изменений:
   ```bash
   cd Backend
   docker-compose up -d --build
   ```
6. Точечный запуск: `docker-compose up -d db qdrant app` или `docker-compose up -d frontend`

Порты по умолчанию:
- Frontend `http://localhost:3000`
- Backend `http://localhost:8000`
- PostgreSQL `localhost:5432`
- Qdrant `localhost:6333`

## Переменные окружения (`Backend/.env`)

```env
POSTGRES_DB=your_db_name
POSTGRES_USER=your_db_user
POSTGRES_PASSWORD=your_db_password
POSTGRES_PORT=5432
APP_PORT=8000
FRONTEND_PORT=3000
QDRANT_PORT=6333
QDRANT_GRPC_PORT=6334
ORIGINS=http://localhost:3000,http://localhost:8000
DATABASE_URL=postgresql+asyncpg://postgres:postgres@db:5432/prompt_hack_db
IAM_TOKEN=your_iam_token
FOLDER_ID=your_folder_id
S3_BUCKET=your_s3_bucket
S3_ENDPOINT=your_s3_endpoint
S3_ACCESS_KEY=your_s3_access_key
S3_SECRET_KEY=your_s3_secret_key
OPENAI_TOKEN=your_openai_token
SECRET_KEY=your_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
```

## Команда проекта

- Богданов Кирилл — тимлид, `t.me/Kirill050905`
- Набиуллин Булат — Backend + ML, `t.me/talubarni`
- Гатин Разиль — Frontend, `t.me/Mazzotta33`
- Маркелов Степан — веб-дизайн, `t.me/kre3d`
- Селюнина Валерия — веб-дизайн, `t.me/leruusya`

