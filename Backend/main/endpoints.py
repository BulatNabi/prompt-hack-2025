from sqlalchemy import select
from exam.deepgram import transcribe_audio
from exam.speechkit import text_to_speech_url
from exam.openai_service import generate_first_question, analyze_answer, generate_next_question, get_emotion_voice_mapping, get_emotion_emotion_mapping
from exam.rag import build_rag_context, get_subject_materials
from exam.study_service import generate_teacher_response, check_if_off_topic
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from main.config import Settings
from main.schemas import (
    VideoRequestDto, CutVideoRequestDto, AudioRequestDto, UserCreate, Token,
    RefreshTokenRequest, UserResponse, SubscriptionUpdate, UserLogin,
    ExamStartRequest, QuestionResponse, AnswerRequest, AnswerResponse, ExamStatusResponse,
    StudyStartRequest, StudyMessageRequest, StudyResponse, StudyMessageResponse
)
from typing import List
from botocore.exceptions import NoCredentialsError, ClientError
from pydantic import HttpUrl
import aiofiles
from fastapi import FastAPI, Depends, HTTPException, status, Path, UploadFile, File, Form, Request
from sqlalchemy.ext.asyncio import AsyncSession
import uvicorn
from datetime import datetime, timedelta
from fastapi.security import OAuth2PasswordRequestForm
from auth.dependencies import get_db, get_current_user
from auth.models import User, ExamSession, ExamQuestion, ExamAnswer, StudySession, StudyMessage
from auth.auth import authenticate_user, create_access_token, save_refresh_token, get_refresh_token, revoke_refresh_token, \
    create_refresh_token, get_password_hash, get_user_by_email, get_user_by_name
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timedelta
import uuid

app = FastAPI(title="Video Translation Platform")

origins = Settings.ORIGINS

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/upload-from-url")
async def upload_from_url(video_url: str, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return await upload_video_from_url(video_url)


@app.post("/upload")
async def upload(file: UploadFile = File(...), current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    try:
        file_content = await file.read()
        final_filename = f'{str(uuid.uuid4())}_{file.filename}'
        last_err = None
        for attempt in range(3):
            try:
                Settings.S3_CLIENT.put_object(
                    Bucket=Settings.S3_BUCKET,
                    Key=final_filename,
                    Body=file_content,
                    ContentType=file.content_type,
                )
                break
            except Exception as e:
                last_err = str(e)
                import time
                time.sleep(1 * (attempt + 1))

        file_url = f"{Settings.S3_ENDPOINT}/{Settings.S3_BUCKET}/{final_filename}"
        return {"url": file_url}
    except (NoCredentialsError, ClientError) as e:
        raise HTTPException(status_code=500, detail=f"S3 error: {str(e)}")


@app.post("/cut")
async def cut_video(request: CutVideoRequestDto, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await cut_video_fn(request.video_url, request.start, request.end)
    current_user.video_urls.append(result["filename"])
    await db.commit()
    return result


@app.post("/translate")
async def translate_video(request: VideoRequestDto, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if request.text is None:
        result = await translate_video_without_text(request.video_url, request.params)
    else:
        result = await translate_video_with_text(request.video_url, request.text, request.params)

    current_user.video_urls.append(result["filename"])
    await db.commit()
    return result


@app.post("/make-subs")
async def subtitles_video(request: VideoRequestDto, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if request.text is None:
        return await subtitles_video_without_text(request.video_url, request.params)
    else:
        return await subtitles_video_with_text(request.video_url, request.text, request.params)


@app.post("/translate_audio")
async def translate_audio(request: AudioRequestDto, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = None
    if request.text is None:
        result = await translate_audio_without_text(request.audio_url, request.params)
    else:
        result = await translate_audio_with_text(request.audio_url, request.text, request.params)

    current_user.video_urls.append(result["filename"])
    await db.commit()
    return result


@app.post("/register", response_model=UserResponse)
async def register(user: UserCreate, db: AsyncSession = Depends(get_db)):
    existing_user = await get_user_by_email(db, user.email)
    if existing_user:
        raise HTTPException(
            status_code=400, detail="Username already registered")
    hashed_password = get_password_hash(user.password)
    new_user = User(email=user.email, username=user.username,
                    hashed_password=hashed_password)
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return new_user


@app.post("/login", response_model=Token)
async def login(user: UserLogin, db: AsyncSession = Depends(get_db)):
    user = await authenticate_user(db, user.email, user.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect credentials")
    access_token = create_access_token(data={"email": user.email}, expires_delta=timedelta(
        minutes=Settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    refresh_token = create_refresh_token()
    try:
        await save_refresh_token(db, user.id, refresh_token, timedelta(days=Settings.REFRESH_TOKEN_EXPIRE_DAYS))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to save refresh token: {str(e)}")

    response = JSONResponse(content={
        "access_token": access_token,
        "token_type": "bearer"
    })
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        # Убрать при HTTPS secure=True,
        samesite="lax",
        max_age=Settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60
    )
    return response


@app.post("/refresh", response_model=Token)
async def refresh(request: Request, db: AsyncSession = Depends(get_db)):
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise HTTPException(
            status_code=401, detail="No refresh token provided")
    token_record = await get_refresh_token(db, refresh_token)
    if not token_record or token_record.expires_at < datetime.now() or token_record.is_revoked:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    user = await db.get(User, token_record.user_id)
    await revoke_refresh_token(db, token_record)
    new_access_token = create_access_token({"email": user.email}, timedelta(
        minutes=Settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    new_refresh_token = create_refresh_token()
    await save_refresh_token(db, user.id, new_refresh_token, timedelta(days=Settings.REFRESH_TOKEN_EXPIRE_DAYS))

    response = JSONResponse(content={
        "access_token": new_access_token,
        "token_type": "bearer"
    })
    response.set_cookie(
        key="refresh_token",
        value=new_refresh_token,
        httponly=True,
        # Убрать при HTTPS secure=True,
        samesite="lax",
        max_age=Settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60
    )
    return response


@app.post("/logout")
async def logout(request: Request, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    refresh_token = request.cookies.get("refresh_token")
    if refresh_token:
        token_record = await get_refresh_token(db, refresh_token)
        if token_record and token_record.user_id == current_user.id:
            await revoke_refresh_token(db, token_record)
    response = JSONResponse(content={"detail": "Logged out"})
    response.delete_cookie("refresh_token")
    return response


@app.get("/users/me", response_model=UserResponse)
async def me(current_user: User = Depends(get_current_user)):
    return current_user


@app.post("/users/{user_id}/subscription")
async def update_sub(user_id: int = Path(...), update: SubscriptionUpdate = None, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.id != user_id:
        raise HTTPException(403, "Forbidden")
    user = await db.get(User, user_id)
    user.subscription_level = update.new_level
    await db.commit()
    return {"new_level": user.subscription_level}


# Exam endpoints


@app.post("/exam/start", response_model=QuestionResponse)
async def start_exam(
    request: ExamStartRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Запускает экзамен для студента
    """
    # Строим RAG контекст из материалов
    materials_context = await build_rag_context(db, request.subject, request.materials)

    # Генерируем первый вопрос с помощью OpenAI
    question_data = await generate_first_question(
        request.teacher_name,
        request.subject,
        request.teacher_description,
        materials_context
    )

    # Создаем сессию экзамена
    exam_session = ExamSession(
        student_id=current_user.id,
        teacher_name=request.teacher_name,
        subject=request.subject,
        teacher_description=request.teacher_description,
        context_history=[
            {"role": "system", "content": f"Преподаватель: {request.teacher_name}, Предмет: {request.subject}"},
            {"role": "assistant", "content": question_data["question"]}
        ]
    )
    db.add(exam_session)
    await db.commit()
    await db.refresh(exam_session)

    # Создаем вопрос
    question_text = question_data["question"]
    question_audio_url = await text_to_speech_url(
        question_text,
        voice=get_emotion_voice_mapping(exam_session.teacher_mood),
        emotion=get_emotion_emotion_mapping(exam_session.teacher_mood)
    )

    exam_question = ExamQuestion(
        exam_session_id=exam_session.id,
        question_index=0,
        question_text=question_text,
        question_audio_url=question_audio_url,
        is_follow_up=False
    )
    db.add(exam_question)
    await db.commit()
    await db.refresh(exam_question)

    return QuestionResponse(
        exam_session_id=exam_session.id,
        question_id=exam_question.id,
        question_text=exam_question.question_text,
        question_audio_url=exam_question.question_audio_url,
        question_index=exam_question.question_index,
        is_follow_up=exam_question.is_follow_up
    )


@app.post("/exam/answer", response_model=AnswerResponse)
async def submit_answer(
    request: AnswerRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Обрабатывает ответ студента на вопрос
    """
    # Получаем сессию экзамена
    exam_session = await db.get(ExamSession, request.exam_session_id)
    if not exam_session:
        raise HTTPException(status_code=404, detail="Exam session not found")

    if exam_session.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")

    if exam_session.status != "in_progress":
        raise HTTPException(
            status_code=400, detail="Exam session is not in progress")

    # Получаем вопрос
    question = await db.get(ExamQuestion, request.question_id)
    if not question or question.exam_session_id != exam_session.id:
        raise HTTPException(status_code=404, detail="Question not found")

    # Транскрибируем аудио ответа
    transcribed_text = await transcribe_audio(request.answer_audio_url)

    # Сохраняем ответ
    exam_answer = ExamAnswer(
        question_id=question.id,
        answer_audio_url=request.answer_audio_url,
        transcribed_text=transcribed_text
    )
    db.add(exam_answer)
    await db.commit()

    # Получаем материалы для контекста
    from exam.rag import get_subject_materials
    materials_context = await get_subject_materials(db, exam_session.subject)

    # Проверяем, не уходит ли студент от темы
    off_topic_check = check_if_off_topic(
        transcribed_text, exam_session.subject, materials_context)

    # Анализируем ответ с помощью OpenAI
    analysis = await analyze_answer(
        question.question_text,
        transcribed_text,
        exam_session.teacher_name,
        exam_session.subject,
        exam_session.teacher_description,
        exam_session.teacher_mood,
        exam_session.context_history or [],
        materials_context
    )

    # Если студент уходит от темы, используем redirect_message
    if off_topic_check.get("is_off_topic") or analysis.get("is_off_topic"):
        analysis["feedback"] = off_topic_check.get(
            "redirect_message", analysis.get("feedback", "Давай вернемся к теме экзамена."))
        analysis["is_correct"] = False
        analysis["should_ask_followup"] = True
        # Не задаем новый вопрос, просто возвращаем к теме
        analysis["followup_question"] = None

    # Обновляем ответ
    exam_answer.is_correct = analysis["is_correct"]
    exam_answer.ai_feedback = analysis["feedback"]
    exam_answer.teacher_mood_after = analysis["teacher_mood"]

    # Обновляем сессию
    exam_session.teacher_mood = analysis["teacher_mood"]
    exam_session.context_history = (exam_session.context_history or []) + [
        {"role": "user", "content": f"Студент: {transcribed_text}"},
        {"role": "assistant", "content": analysis["feedback"]}
    ]

    next_question = None
    exam_completed = analysis.get("exam_completed", False)

    # Если нужен дополнительный вопрос или следующий вопрос
    if analysis.get("should_ask_followup") and analysis.get("followup_question"):
        # Создаем follow-up вопрос
        followup_text = analysis["followup_question"]
        followup_audio_url = await text_to_speech_url(
            followup_text,
            voice=get_emotion_voice_mapping(exam_session.teacher_mood),
            emotion=get_emotion_emotion_mapping(exam_session.teacher_mood)
        )

        followup_question = ExamQuestion(
            exam_session_id=exam_session.id,
            question_index=exam_session.current_question_index + 1,
            question_text=followup_text,
            question_audio_url=followup_audio_url,
            is_follow_up=True
        )
        db.add(followup_question)
        await db.commit()
        await db.refresh(followup_question)

        exam_session.current_question_index += 1
        exam_session.context_history.append(
            {"role": "assistant", "content": followup_text}
        )

        next_question = QuestionResponse(
            exam_session_id=exam_session.id,
            question_id=followup_question.id,
            question_text=followup_question.question_text,
            question_audio_url=followup_question.question_audio_url,
            question_index=followup_question.question_index,
            is_follow_up=followup_question.is_follow_up
        )
    elif not exam_completed:
        # Генерируем следующий основной вопрос
        next_question_data = await generate_next_question(
            exam_session.teacher_name,
            exam_session.subject,
            exam_session.teacher_description,
            exam_session.teacher_mood,
            exam_session.context_history or [],
            materials_context,
            exam_session.current_question_index + 1
        )

        next_question_text = next_question_data["question"]
        next_question_audio_url = await text_to_speech_url(
            next_question_text,
            voice=get_emotion_voice_mapping(exam_session.teacher_mood),
            emotion=get_emotion_emotion_mapping(exam_session.teacher_mood)
        )

        next_exam_question = ExamQuestion(
            exam_session_id=exam_session.id,
            question_index=exam_session.current_question_index + 1,
            question_text=next_question_text,
            question_audio_url=next_question_audio_url,
            is_follow_up=False
        )
        db.add(next_exam_question)
        await db.commit()
        await db.refresh(next_exam_question)

        exam_session.current_question_index += 1
        exam_session.context_history.append(
            {"role": "assistant", "content": next_question_text}
        )

        next_question = QuestionResponse(
            exam_session_id=exam_session.id,
            question_id=next_exam_question.id,
            question_text=next_exam_question.question_text,
            question_audio_url=next_exam_question.question_audio_url,
            question_index=next_exam_question.question_index,
            is_follow_up=next_exam_question.is_follow_up
        )

    # Если экзамен завершен
    if exam_completed:
        exam_session.status = "completed"
        exam_session.completed_at = datetime.now()

    await db.commit()
    await db.refresh(exam_answer)

    return AnswerResponse(
        exam_session_id=exam_session.id,
        answer_id=exam_answer.id,
        is_correct=exam_answer.is_correct,
        ai_feedback=exam_answer.ai_feedback,
        teacher_mood=exam_session.teacher_mood,
        next_question=next_question,
        exam_completed=exam_completed
    )


@app.get("/exam/{exam_session_id}/status", response_model=ExamStatusResponse)
async def get_exam_status(
    exam_session_id: int = Path(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Получает статус экзамена
    """
    exam_session = await db.get(ExamSession, exam_session_id)
    if not exam_session:
        raise HTTPException(status_code=404, detail="Exam session not found")

    if exam_session.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")

    # Подсчитываем количество вопросов
    result = await db.execute(
        select(ExamQuestion).where(
            ExamQuestion.exam_session_id == exam_session_id)
    )
    questions_count = len(result.scalars().all())

    return ExamStatusResponse(
        exam_session_id=exam_session.id,
        status=exam_session.status,
        teacher_mood=exam_session.teacher_mood,
        current_question_index=exam_session.current_question_index,
        questions_count=questions_count,
        created_at=exam_session.created_at
    )


# Study endpoints
@app.post("/study/start", response_model=StudyResponse)
async def start_study(
    request: StudyStartRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Запускает сессию подготовки к экзамену
    """
    # Строим RAG контекст из материалов
    materials_context = await build_rag_context(db, request.subject, request.materials)

    # Создаем сессию подготовки
    study_session = StudySession(
        student_id=current_user.id,
        teacher_name=request.teacher_name,
        subject=request.subject,
        teacher_description=request.teacher_description,
        context_history=[
            {"role": "system", "content": f"Преподаватель: {request.teacher_name}, Предмет: {request.subject}"},
            {"role": "assistant", "content": f"Здравствуй! Я {request.teacher_name}, помогу тебе подготовиться к экзамену по {request.subject}. Задавай вопросы, и я объясню материал."}
        ]
    )
    db.add(study_session)
    await db.commit()
    await db.refresh(study_session)

    # Сохраняем приветственное сообщение
    welcome_message = StudyMessage(
        study_session_id=study_session.id,
        message_text=f"Здравствуй! Я {request.teacher_name}, помогу тебе подготовиться к экзамену по {request.subject}. Задавай вопросы, и я объясню материал.",
        is_from_student=False
    )
    db.add(welcome_message)
    await db.commit()

    return StudyResponse(
        study_session_id=study_session.id,
        teacher_response=welcome_message.message_text
    )


@app.post("/study/message", response_model=StudyResponse)
async def send_study_message(
    request: StudyMessageRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Отправляет сообщение в сессию подготовки
    """
    # Получаем сессию
    study_session = await db.get(StudySession, request.study_session_id)
    if not study_session:
        raise HTTPException(status_code=404, detail="Study session not found")

    if study_session.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")

    if study_session.status != "active":
        raise HTTPException(
            status_code=400, detail="Study session is not active")

    # Сохраняем сообщение студента
    student_message = StudyMessage(
        study_session_id=study_session.id,
        message_text=request.message,
        is_from_student=True
    )
    db.add(student_message)
    await db.commit()

    # Получаем материалы для контекста
    materials_context = await get_subject_materials(db, study_session.subject)

    # Проверяем, не уходит ли студент от темы
    off_topic_check = check_if_off_topic(
        request.message, study_session.subject, materials_context)

    # Если уходит от темы, возвращаем redirect_message
    if off_topic_check.get("is_off_topic"):
        teacher_response_text = off_topic_check.get(
            "redirect_message", "Давай вернемся к теме подготовки.")
    else:
        # Генерируем ответ преподавателя
        teacher_response_text = await generate_teacher_response(
            request.message,
            study_session.teacher_name,
            study_session.subject,
            study_session.teacher_description,
            study_session.context_history or [],
            materials_context
        )

    # Сохраняем ответ преподавателя
    teacher_message = StudyMessage(
        study_session_id=study_session.id,
        message_text=teacher_response_text,
        is_from_student=False
    )
    db.add(teacher_message)
    await db.commit()

    # Обновляем историю контекста
    study_session.context_history = (study_session.context_history or []) + [
        {"role": "user", "content": f"Студент: {request.message}"},
        {"role": "assistant", "content": teacher_response_text}
    ]
    await db.commit()

    return StudyResponse(
        study_session_id=study_session.id,
        teacher_response=teacher_response_text
    )


@app.get("/study/{study_session_id}/messages", response_model=List[StudyMessageResponse])
async def get_study_messages(
    study_session_id: int = Path(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Получает все сообщения из сессии подготовки
    """
    study_session = await db.get(StudySession, study_session_id)
    if not study_session:
        raise HTTPException(status_code=404, detail="Study session not found")

    if study_session.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")

    result = await db.execute(
        select(StudyMessage).where(
            StudyMessage.study_session_id == study_session_id)
        .order_by(StudyMessage.created_at)
    )
    messages = result.scalars().all()

    return [StudyMessageResponse(
        study_session_id=m.study_session_id,
        message_id=m.id,
        message_text=m.message_text,
        is_from_student=m.is_from_student,
        created_at=m.created_at
    ) for m in messages]
