import io
from typing import List, Optional
from pypdf import PdfReader
import requests


async def parse_pdf_from_url(url: str) -> List[str]:
    try:
        response = requests.get(url, timeout=60)
        response.raise_for_status()
        pdf_data = response.content

        return parse_pdf_from_bytes(pdf_data)
    except Exception as e:
        raise ValueError(f"Failed to parse PDF from URL: {str(e)}")


def parse_pdf_from_bytes(pdf_data: bytes) -> List[str]:
    try:
        pdf_file = io.BytesIO(pdf_data)
        reader = PdfReader(pdf_file)

        pages = []
        for page_num, page in enumerate(reader.pages):
            text = page.extract_text()
            if text.strip():
                pages.append(text)

        return pages
    except Exception as e:
        raise ValueError(f"Failed to parse PDF: {str(e)}")


async def parse_pdf_from_file(file) -> List[str]:
    try:
        pdf_data = await file.read()
        return parse_pdf_from_bytes(pdf_data)
    except Exception as e:
        raise ValueError(f"Failed to parse PDF file: {str(e)}")


def split_text_into_chunks(text: str, chunk_size: int = 1000, overlap: int = 200) -> List[str]:
    if len(text) <= chunk_size:
        return [text]

    chunks = []
    start = 0

    while start < len(text):
        end = start + chunk_size
        chunk = text[start:end]

        if end < len(text):
            last_sentence_end = max(
                chunk.rfind('.'),
                chunk.rfind('!'),
                chunk.rfind('?')
            )
            if last_sentence_end > chunk_size // 2:
                chunk = chunk[:last_sentence_end + 1]
                end = start + last_sentence_end + 1

        chunks.append(chunk.strip())
        start = end - overlap

    return chunks
