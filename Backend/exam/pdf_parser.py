import io
from typing import List, Optional
from pypdf import PdfReader
import requests


async def parse_pdf_from_url(url: str) -> List[str]:
    """
    Парсит PDF файл по URL и извлекает текст

    Args:
        url: URL PDF файла

    Returns:
        List[str]: Список страниц документа
    """
    try:
        # Скачиваем PDF
        response = requests.get(url, timeout=60)
        response.raise_for_status()
        pdf_data = response.content

        # Парсим PDF
        return parse_pdf_from_bytes(pdf_data)
    except Exception as e:
        raise ValueError(f"Failed to parse PDF from URL: {str(e)}")


def parse_pdf_from_bytes(pdf_data: bytes) -> List[str]:
    """
    Парсит PDF из байтов и извлекает текст

    Args:
        pdf_data: Байты PDF файла

    Returns:
        List[str]: Список страниц документа
    """
    try:
        pdf_file = io.BytesIO(pdf_data)
        reader = PdfReader(pdf_file)

        pages = []
        for page_num, page in enumerate(reader.pages):
            text = page.extract_text()
            if text.strip():  # Добавляем только непустые страницы
                pages.append(text)

        return pages
    except Exception as e:
        raise ValueError(f"Failed to parse PDF: {str(e)}")


async def parse_pdf_from_file(file) -> List[str]:
    """
    Парсит PDF из файлового объекта и извлекает текст

    Args:
        file: Файловый объект (UploadFile)

    Returns:
        List[str]: Список страниц документа
    """
    try:
        # Читаем содержимое файла
        pdf_data = await file.read()
        return parse_pdf_from_bytes(pdf_data)
    except Exception as e:
        raise ValueError(f"Failed to parse PDF file: {str(e)}")


def split_text_into_chunks(text: str, chunk_size: int = 1000, overlap: int = 200) -> List[str]:
    """
    Разбивает текст на чанки для лучшей обработки

    Args:
        text: Текст для разбиения
        chunk_size: Размер чанка в символах
        overlap: Перекрытие между чанками

    Returns:
        List[str]: Список чанков
    """
    if len(text) <= chunk_size:
        return [text]

    chunks = []
    start = 0

    while start < len(text):
        end = start + chunk_size
        chunk = text[start:end]

        # Пытаемся разбить по предложениям
        if end < len(text):
            # Ищем последнюю точку, восклицательный или вопросительный знак
            last_sentence_end = max(
                chunk.rfind('.'),
                chunk.rfind('!'),
                chunk.rfind('?')
            )
            if last_sentence_end > chunk_size // 2:  # Если нашли в разумных пределах
                chunk = chunk[:last_sentence_end + 1]
                end = start + last_sentence_end + 1

        chunks.append(chunk.strip())
        start = end - overlap  # Перекрытие для контекста

    return chunks
