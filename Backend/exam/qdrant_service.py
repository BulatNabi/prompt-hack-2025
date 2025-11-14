import os
import uuid
import hashlib
from typing import List, Optional, Dict
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct, Filter, FieldCondition, MatchValue
from main.config import Settings
from openai import OpenAI


class QdrantService:
    """Сервис для работы с Qdrant векторной базой данных"""

    def __init__(self):
        # Для Docker Compose используем имя сервиса, для локальной разработки - localhost
        # Если QDRANT_URL установлен, используем его, иначе собираем из HOST и PORT
        qdrant_url_env = os.getenv("QDRANT_URL")
        if qdrant_url_env:
            self.qdrant_url = qdrant_url_env
        else:
            qdrant_host = os.getenv("QDRANT_HOST", "localhost")
            qdrant_port = os.getenv("QDRANT_PORT", "6333")
            self.qdrant_url = f"http://{qdrant_host}:{qdrant_port}"

        self.qdrant_api_key = os.getenv("QDRANT_API_KEY", None)
        self.collection_name = "subject_materials"
        self.embedding_model = "text-embedding-3-small"
        self.embedding_dimension = 1536

        # Инициализация клиента Qdrant
        try:
            if self.qdrant_api_key:
                self.client = QdrantClient(
                    url=self.qdrant_url,
                    api_key=self.qdrant_api_key
                )
            else:
                self.client = QdrantClient(url=self.qdrant_url)
            print(f"✅ Qdrant client initialized: {self.qdrant_url}")
        except Exception as e:
            print(f"⚠️  Warning: Failed to initialize Qdrant client: {e}")
            print(f"   Qdrant URL: {self.qdrant_url}")
            print(f"   RAG will fallback to database storage")
            self.client = None

        # Инициализация OpenAI для эмбеддингов
        self.openai_client = Settings.client

        # Создаем коллекцию, если её нет
        self._ensure_collection()

    def _ensure_collection(self):
        """Создает коллекцию, если её не существует"""
        if self.client is None:
            print(
                "Warning: Qdrant client is not initialized, skipping collection creation")
            return

        try:
            collections = self.client.get_collections()
            collection_names = [col.name for col in collections.collections]

            if self.collection_name not in collection_names:
                self.client.create_collection(
                    collection_name=self.collection_name,
                    vectors_config=VectorParams(
                        size=self.embedding_dimension,
                        distance=Distance.COSINE
                    )
                )
                print(f"✅ Created Qdrant collection: {self.collection_name}")
        except Exception as e:
            print(f"Error ensuring collection: {e}")

    def _get_embedding(self, text: str) -> List[float]:
        """Получает эмбеддинг текста через OpenAI"""
        if self.openai_client is None:
            raise ValueError("OpenAI client is not initialized")

        try:
            response = self.openai_client.embeddings.create(
                model=self.embedding_model,
                input=text
            )
            return response.data[0].embedding
        except Exception as e:
            raise ValueError(f"Failed to get embedding: {str(e)}")

    def add_document(
        self,
        subject: str,
        content: str,
        document_id: Optional[str] = None,
        metadata: Optional[Dict] = None
    ) -> str:
        """
        Добавляет документ в Qdrant

        Args:
            subject: Предмет
            content: Содержимое документа
            document_id: ID документа (если None, генерируется автоматически)
            metadata: Дополнительные метаданные

        Returns:
            str: ID добавленного документа
        """
        if self.client is None:
            raise ValueError("Qdrant client is not initialized")

        if document_id is None:
            document_id = str(uuid.uuid4())

        # Получаем эмбеддинг
        embedding = self._get_embedding(content)

        # Формируем метаданные
        point_metadata = {
            "subject": subject,
            "content": content,
            "document_id": document_id
        }
        if metadata:
            point_metadata.update(metadata)

        # Генерируем уникальный ID для точки (используем hash от document_id + content)
        unique_string = f"{document_id}_{content[:100]}"
        point_id = int(hashlib.md5(
            unique_string.encode()).hexdigest()[:15], 16)

        # Добавляем точку в коллекцию
        point = PointStruct(
            id=point_id,
            vector=embedding,
            payload=point_metadata
        )

        self.client.upsert(
            collection_name=self.collection_name,
            points=[point]
        )

        return document_id

    def search_similar(
        self,
        query: str,
        subject: Optional[str] = None,
        limit: int = 5
    ) -> List[Dict]:
        """
        Ищет похожие документы по запросу

        Args:
            query: Поисковый запрос
            subject: Фильтр по предмету (опционально)
            limit: Количество результатов

        Returns:
            List[Dict]: Список найденных документов с метаданными
        """
        if self.client is None:
            raise ValueError("Qdrant client is not initialized")

        # Получаем эмбеддинг запроса
        query_embedding = self._get_embedding(query)

        # Формируем фильтр
        query_filter = None
        if subject:
            query_filter = Filter(
                must=[
                    FieldCondition(
                        key="subject",
                        match=MatchValue(value=subject)
                    )
                ]
            )

        # Выполняем поиск
        search_results = self.client.search(
            collection_name=self.collection_name,
            query_vector=query_embedding,
            query_filter=query_filter,
            limit=limit
        )

        # Формируем результат
        results = []
        for result in search_results:
            results.append({
                "score": result.score,
                "content": result.payload.get("content", ""),
                "subject": result.payload.get("subject", ""),
                "document_id": result.payload.get("document_id", ""),
                "metadata": {k: v for k, v in result.payload.items()
                             if k not in ["content", "subject", "document_id"]}
            })

        return results

    def get_subject_materials(
        self,
        subject: str,
        query: Optional[str] = None,
        limit: int = 10
    ) -> str:
        """
        Получает материалы по предмету из Qdrant

        Args:
            subject: Предмет
            query: Поисковый запрос (если None, возвращает все материалы по предмету)
            limit: Максимальное количество документов

        Returns:
            str: Контекст материалов
        """
        if self.client is None:
            return ""

        if query:
            # Если есть запрос, используем семантический поиск
            results = self.search_similar(query, subject=subject, limit=limit)
        else:
            # Иначе ищем все документы по предмету
            results = self.search_similar(
                subject, subject=subject, limit=limit)

        if not results:
            return ""

        # Объединяем содержимое документов
        materials = []
        for result in results:
            materials.append(result["content"])

        return "\n\n---\n\n".join(materials)

    def delete_document(self, document_id: str):
        """Удаляет документ из Qdrant"""
        if self.client is None:
            raise ValueError("Qdrant client is not initialized")

        self.client.delete(
            collection_name=self.collection_name,
            points_selector=[document_id]
        )

    def delete_subject_materials(self, subject: str):
        """Удаляет все материалы по предмету"""
        if self.client is None:
            raise ValueError("Qdrant client is not initialized")

        # Получаем все точки с данным предметом
        subject_filter = Filter(
            must=[
                FieldCondition(
                    key="subject",
                    match=MatchValue(value=subject)
                )
            ]
        )

        scroll_result = self.client.scroll(
            collection_name=self.collection_name,
            scroll_filter=subject_filter,
            limit=1000
        )

        # Удаляем все найденные точки
        if scroll_result[0]:
            point_ids = [point.id for point in scroll_result[0]]
            self.client.delete(
                collection_name=self.collection_name,
                points_selector=point_ids
            )


# Глобальный экземпляр сервиса
qdrant_service = QdrantService()
