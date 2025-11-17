import requests
import os
from main.config import Settings
import uuid


async def synthesize_speech(text: str, voice: str = "jane", emotion: str = "neutral") -> bytes:
    url = "https://tts.api.cloud.yandex.net/speech/v1/tts:synthesize"

    headers = {
        "Authorization": f"Bearer {Settings.IAM_TOKEN}"
    }

    data = {
        "text": text,
        "lang": "ru-RU",
        "voice": voice,
        "emotion": emotion,
        "format": "oggopus",
        "folderId": Settings.FOLDER_ID
    }

    try:
        response = requests.post(url, headers=headers, data=data, timeout=30)
        response.raise_for_status()
        return response.content
    except requests.exceptions.RequestException as e:
        raise ValueError(f"Failed to synthesize speech: {str(e)}")


async def save_audio_to_s3(audio_data: bytes, filename: str = None) -> str:
    if filename is None:
        filename = f"{uuid.uuid4()}.mp3"

    Settings.S3_CLIENT.put_object(
        Bucket=Settings.S3_BUCKET,
        Key=filename,
        Body=audio_data,
        ContentType="audio/mp3"
    )

    return f"{Settings.S3_ENDPOINT}/{Settings.S3_BUCKET}/{filename}"


async def text_to_speech_url(text: str, voice: str = "jane", emotion: str = "neutral") -> str:
    audio_data = await synthesize_speech(text, voice, emotion)
    return await save_audio_to_s3(audio_data)
