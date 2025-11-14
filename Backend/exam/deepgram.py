import requests
import os
from main.config import Settings


async def transcribe_audio(audio_url: str) -> str:
    """
    Транскрибирует аудио с помощью Deepgram

    Args:
        audio_url: URL аудио файла

    Returns:
        str: Транскрибированный текст
    """
    deepgram_api_key = os.getenv("DEEPGRAM_API_KEY")
    if not deepgram_api_key:
        raise ValueError("DEEPGRAM_API_KEY not found in environment variables")

    # Скачиваем аудио файл
    try:
        response = requests.get(audio_url, timeout=30)
        response.raise_for_status()
        audio_data = response.content
    except requests.exceptions.RequestException as e:
        raise ValueError(f"Failed to download audio from URL: {str(e)}")

    # Отправляем на транскрипцию
    url = "https://api.deepgram.com/v1/listen"
    headers = {
        "Authorization": f"Token {deepgram_api_key}"
    }

    files = {
        "audio": ("audio.ogg", audio_data, "audio/ogg")
    }

    params = {
        "model": "nova-2",
        "language": "ru",
        "punctuate": "true",
        "diarize": "false"
    }

    try:
        response = requests.post(url, headers=headers,
                                 files=files, params=params, timeout=60)
        response.raise_for_status()
        result = response.json()
    except requests.exceptions.RequestException as e:
        raise ValueError(f"Failed to transcribe audio with Deepgram: {str(e)}")

    # Извлекаем текст из результата
    if "results" in result and "channels" in result["results"]:
        if len(result["results"]["channels"]) > 0:
            if "alternatives" in result["results"]["channels"][0]:
                if len(result["results"]["channels"][0]["alternatives"]) > 0:
                    return result["results"]["channels"][0]["alternatives"][0]["transcript"]

    return ""
