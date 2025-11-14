# Настройка Qdrant

## Локальная разработка

Для локальной разработки Qdrant будет запущен через Docker Compose.

### Переменные окружения

Добавьте в ваш `.env` файл следующие переменные (опционально, если хотите изменить порты):

```env
# Qdrant настройки (опционально)
# Для Docker Compose автоматически используется хост "qdrant"
# Для локальной разработки установите:
# QDRANT_HOST=localhost
# QDRANT_PORT=6333
# QDRANT_GRPC_PORT=6334
# QDRANT_API_KEY=  # Оставьте пустым для локальной разработки

# Или используйте полный URL:
# QDRANT_URL=http://qdrant:6333  # Для Docker Compose
# QDRANT_URL=http://localhost:6333  # Для локальной разработки
```

### Запуск через Docker Compose

```bash
docker-compose up -d
```

Это запустит:
- PostgreSQL базу данных
- Qdrant векторную базу данных
- Приложение FastAPI

Приложение автоматически:
1. Дождется готовности PostgreSQL
2. Дождется готовности Qdrant
3. Выполнит миграции
4. Запустится

### Проверка работы Qdrant

После запуска вы можете проверить работу Qdrant:

```bash
# Проверка здоровья
curl http://localhost:6333/healthz

# Просмотр коллекций
curl http://localhost:6333/collections
```

### Использование

После запуска Qdrant будет автоматически:
- Создана коллекция `subject_materials` при первом запуске
- Использоваться для семантического поиска материалов по предметам
- Сохранять PDF файлы, загруженные через API

### Эндпоинты для работы с PDF

- `POST /materials/upload-pdf` - загрузка PDF файла
- `POST /materials/upload-pdf-from-url` - загрузка PDF по URL

### Локальная разработка без Docker

Если вы запускаете приложение локально (не в Docker), убедитесь что:

1. Qdrant запущен локально или доступен по сети
2. В `.env` установлено:
   ```env
   QDRANT_HOST=localhost
   QDRANT_PORT=6333
   ```

### Запуск Qdrant локально (без Docker Compose)

Если хотите запустить Qdrant отдельно:

```bash
docker run -p 6333:6333 -p 6334:6334 -v $(pwd)/qdrant_storage:/qdrant/storage qdrant/qdrant
```

Или используйте Qdrant Cloud (тогда укажите `QDRANT_URL` и `QDRANT_API_KEY` в `.env`).

