import os
from deepgram import DeepgramClient


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

    try:
        # Инициализируем клиент Deepgram
        deepgram = DeepgramClient(api_key=deepgram_api_key)

        # Транскрибируем аудио по URL
        response = deepgram.listen.v1.media.transcribe_url(
            url=audio_url,
            model="nova-2",
            language="ru",
            smart_format=True,
        )

        # Извлекаем транскрипт из ответа
        if response.results and response.results.channels:
            if len(response.results.channels) > 0:
                channel = response.results.channels[0]
                if channel.alternatives and len(channel.alternatives) > 0:
                    print(channel.alternatives[0].transcript)
                    return channel.alternatives[0].transcript

        return ""
    except Exception as e:
        raise ValueError(f"Failed to transcribe audio with Deepgram: {str(e)}")
