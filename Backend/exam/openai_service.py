import json
from typing import List, Dict, Optional
from main.config import Settings


async def detect_teacher_gender(teacher_name: str) -> str:
    female_endings = ["а", "я", "ь"]
    first_name = teacher_name.split()[0] if teacher_name else ""

    if first_name and first_name[-1].lower() in female_endings:
        return "female"

    try:
        prompt = f"""Определи пол человека по имени. Верни только "male" или "female" без дополнительных объяснений.

Имя: {teacher_name}

Пол:"""

        response = Settings.client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "Ты помощник, который определяет пол по имени. Отвечай только 'male' или 'female'."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.1,
            max_tokens=10
        )

        result = response.choices[0].message.content.strip().lower()
        if "female" in result or "жен" in result.lower():
            return "female"
        elif "male" in result or "муж" in result.lower():
            return "male"
        else:
            return "male"
    except Exception:
        if first_name and first_name[-1].lower() in female_endings:
            return "female"
        return "male"


def get_voice_by_gender_and_emotion(gender: str, emotion: str) -> str:
    if gender == "female":
        mapping = {
            "neutral": "jane",
            "happy": "jane",
            "disappointed": "omazh",
            "angry": "omazh"
        }
    else:
        mapping = {
            "neutral": "zahar",
            "happy": "zahar",
            "disappointed": "ermil",
            "angry": "zahar"
        }

    return mapping.get(emotion, "jane" if gender == "female" else "zahar")


def get_emotion_voice_mapping(emotion: str, gender: str = "female") -> str:
    return get_voice_by_gender_and_emotion(gender, emotion)


def get_emotion_emotion_mapping(emotion: str) -> str:
    mapping = {
        "neutral": "neutral",
        "happy": "good",
        "disappointed": "neutral",
        "angry": "evil"
    }
    return mapping.get(emotion, "neutral")


async def generate_first_question(
    teacher_name: str,
    subject: str,
    teacher_description: str,
    materials_context: str = ""
) -> Dict:
    system_prompt = f"""Ты - преподаватель {teacher_name}, который проводит экзамен по предмету "{subject}".

Описание преподавателя: {teacher_description}

ВАЖНО: Ты должен задавать вопросы как РЕАЛЬНЫЙ преподаватель вуза:
- Используй естественные междометия: "Кхм...", "Ага...", "Хм...", "Так-с...", "Ну...", "Эээ..."
- Будь живым и эмоциональным, но профессиональным
- Используй разговорный стиль, но сохраняй авторитет преподавателя
- Можешь использовать фразы типа "Скажи мне...", "Объясни...", "Что ты знаешь о..."

Твоя задача - задать первый вопрос студенту по предмету {subject}. Вопрос должен быть:
- Релевантным предмету
- Достаточно сложным, чтобы проверить знания
- Четко сформулированным
- Естественным, как живая речь преподавателя

Материалы по предмету:
{materials_context}

Верни ответ в формате JSON:
{{
    "question": "текст вопроса с естественной речью преподавателя",
    "reasoning": "краткое объяснение, почему задан этот вопрос"
}}"""

    response = Settings.client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": "Задай первый вопрос студенту."}
        ],
        response_format={"type": "json_object"},
        temperature=0.7
    )

    result = json.loads(response.choices[0].message.content)
    return result


async def analyze_answer(
    question: str,
    answer: str,
    teacher_name: str,
    subject: str,
    teacher_description: str,
    current_mood: str,
    context_history: List[Dict],
    materials_context: str = ""
) -> Dict:
    history_text = ""
    for msg in context_history[-5:]:
        role = msg.get("role", "user")
        content = msg.get("content", "")
        history_text += f"{role}: {content}\n"

    system_prompt = f"""Ты - преподаватель {teacher_name}, который проводит экзамен по предмету "{subject}".

Описание преподавателя: {teacher_description}

Текущее настроение преподавателя: {current_mood}

Материалы по предмету:
{materials_context}

История диалога:
{history_text}

ВАЖНО: Ты должен отвечать как РЕАЛЬНЫЙ преподаватель вуза:
- Используй естественные междометия: "Кхм...", "Ага...", "Хм...", "Так-с...", "Ну...", "Эээ..."
- Будь живым и эмоциональным, но профессиональным
- Используй разговорный стиль, но сохраняй авторитет преподавателя
- Если ответ правильный - хвали: "Верно!", "Точно!", "Правильно!", "Хорошо!"
- Если неправильный - мягко, но четко указывай на ошибки: "Не совсем так...", "Хм, тут есть неточность...", "Давай подумаем..."

КРИТИЧЕСКИ ВАЖНО: Если студент уходит от темы учебы или задает вопросы не по предмету, ВЕЖЛИВО, но НАСТОЙЧИВО верни его к теме экзамена. Например: "Кхм... Давай вернемся к предмету экзамена", "Так-с, мы сейчас на экзамене по {subject}, давай сосредоточимся на этом".

Твоя задача - оценить ответ студента на вопрос "{question}".

Ответ студента: "{answer}"

Проанализируй ответ и верни результат в формате JSON:
{{
    "is_correct": true/false,
    "feedback": "детальный фидбек на ответ студента с естественной речью преподавателя",
    "teacher_mood": "neutral/happy/disappointed/angry",
    "should_ask_followup": true/false,
    "followup_question": "дополнительный вопрос с естественной речью, если нужен, иначе null",
    "exam_completed": true/false,
    "is_off_topic": true/false
}}

Правила:
- Если ответ правильный и полный, teacher_mood должен быть "happy", exam_completed может быть true если это последний вопрос
- Если ответ неправильный или неполный, teacher_mood должен быть "disappointed" или "angry" в зависимости от серьезности ошибки
- Если ответ неполный, задай followup_question
- exam_completed = true только если студент ответил на все основные вопросы правильно и экзамен можно завершить
- Настроение преподавателя должно меняться в зависимости от качества ответов
- is_off_topic = true, если студент уходит от темы учебы - в этом случае feedback должен возвращать к теме"""

    user_prompt = f"""Вопрос: {question}
Ответ студента: {answer}

Проанализируй ответ и верни вердикт в формате JSON."""

    response = Settings.client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        response_format={"type": "json_object"},
        temperature=0.7
    )

    result = json.loads(response.choices[0].message.content)
    return result


async def generate_next_question(
    teacher_name: str,
    subject: str,
    teacher_description: str,
    current_mood: str,
    context_history: List[Dict],
    materials_context: str = "",
    question_index: int = 0
) -> Dict:
    history_text = ""
    for msg in context_history[-5:]:
        role = msg.get("role", "user")
        content = msg.get("content", "")
        history_text += f"{role}: {content}\n"

    system_prompt = f"""Ты - преподаватель {teacher_name}, который проводит экзамен по предмету "{subject}".

Описание преподавателя: {teacher_description}

Текущее настроение преподавателя: {current_mood}

Материалы по предмету:
{materials_context}

История диалога:
{history_text}

ВАЖНО: Ты должен задавать вопросы как РЕАЛЬНЫЙ преподаватель вуза:
- Используй естественные междометия: "Кхм...", "Ага...", "Хм...", "Так-с...", "Ну...", "Эээ..."
- Будь живым и эмоциональным, но профессиональным
- Используй разговорный стиль, но сохраняй авторитет преподавателя

Ты уже задал {question_index} вопрос(ов). Задай следующий вопрос по предмету {subject}.

Верни ответ в формате JSON:
{{
    "question": "текст вопроса с естественной речью преподавателя",
    "reasoning": "краткое объяснение, почему задан этот вопрос"
}}"""

    response = Settings.client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": "Задай следующий вопрос студенту."}
        ],
        response_format={"type": "json_object"},
        temperature=0.7
    )

    result = json.loads(response.choices[0].message.content)
    return result
