import json
from typing import List, Dict, Optional
from main.config import Settings


async def check_if_off_topic(user_message: str, subject: str, materials_context: str = "") -> Dict:
    materials_slice = materials_context[:1000]
    system_prompt = f"""Ты - помощник, который проверяет, не уходит ли студент от темы учебы.

Предмет: {subject}

Материалы по предмету:
{materials_slice}

Твоя задача - определить, относится ли сообщение студента к учебе и предмету "{subject}", или студент уходит от темы.

Верни ответ в формате JSON:
{{
    "is_off_topic": true/false,
    "redirect_message": "вежливое сообщение для возврата к теме, если is_off_topic=true, иначе null"
}}

Правила:
- is_off_topic = true, если студент задает вопросы не по предмету, переходит на личные темы, спрашивает о чем-то не связанном с учебой
- is_off_topic = false, если вопрос относится к предмету, даже если формулировка не идеальна
- redirect_message должен быть вежливым, но настойчивым, возвращающим к теме предмета"""

    user_prompt = f"""Сообщение студента: "{user_message}"

Определи, уходит ли студент от темы предмета "{subject}"."""

    response = Settings.client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        response_format={"type": "json_object"},
        temperature=0.3
    )

    result = json.loads(response.choices[0].message.content)
    return result


async def generate_teacher_response(
    student_message: str,
    teacher_name: str,
    subject: str,
    teacher_description: str,
    context_history: List[Dict],
    materials_context: str = ""
) -> str:
    history_text = ""
    for msg in context_history[-10:]:
        role = msg.get("role", "user")
        content = msg.get("content", "")
        history_text += f"{role}: {content}\n"

    materials_preview = materials_context[:2000]
    system_prompt = f"""Ты - преподаватель {teacher_name}, который помогает студенту подготовиться к экзамену по предмету "{subject}".

Описание преподавателя: {teacher_description}

Материалы по предмету:
{materials_preview}

История диалога:
{history_text}

ВАЖНО: Ты должен отвечать как РЕАЛЬНЫЙ преподаватель вуза:
- Используй естественные междометия: "Кхм...", "Ага...", "Хм...", "Так-с...", "Ну...", "Эээ..."
- Будь живым и эмоциональным, но профессиональным
- Используй разговорный стиль, но сохраняй авторитет преподавателя
- Можешь использовать фразы типа "Понимаешь?", "Видишь?", "Так вот..."
- Если студент правильно понимает - хвали: "Верно!", "Точно!", "Правильно!"
- Если неправильно - мягко поправляй: "Не совсем так...", "Хм, давай подумаем..."
- Задавай наводящие вопросы для лучшего понимания

Твоя задача - помочь студенту понять материал по предмету {subject}, объяснить сложные моменты, ответить на вопросы.

Если студент уходит от темы учебы, вежливо, но настойчиво верни его к предмету.

Отвечай ТОЛЬКО текстом ответа, без дополнительных пояснений. Ответ должен быть естественным, как живой диалог с преподавателем."""

    user_prompt = f"""Студент спрашивает: "{student_message}"

Ответь как преподаватель, помогая студенту подготовиться к экзамену."""

    response = Settings.client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        temperature=0.8
    )

    return response.choices[0].message.content.strip()
