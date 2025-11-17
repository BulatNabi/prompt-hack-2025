from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, JSON, Text, Float
from sqlalchemy.orm import relationship
from datetime import datetime
from auth.database import Base
from pydantic import BaseModel


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, nullable=False)
    username = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.now())

    subscription_level = Column(String, default="free", nullable=False)
    video_urls = Column(JSON, default=list)

    refresh_tokens = relationship(
        "RefreshToken", back_populates="user", cascade="all, delete-orphan")
    exam_sessions = relationship(
        "ExamSession", back_populates="student", cascade="all, delete-orphan")
    study_sessions = relationship(
        "StudySession", back_populates="student", cascade="all, delete-orphan")


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id = Column(Integer, primary_key=True, index=True)
    token_hash = Column(String, unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_revoked = Column(Boolean, default=False)

    user = relationship("User", back_populates="refresh_tokens")


class SubjectMaterials(Base):
    __tablename__ = "subject_materials"

    id = Column(Integer, primary_key=True, index=True)
    subject = Column(String, nullable=False, index=True)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.now())


class ExamSession(Base):
    __tablename__ = "exam_sessions"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    teacher_name = Column(String, nullable=False)
    subject = Column(String, nullable=False)
    teacher_description = Column(Text, nullable=False)
    teacher_gender = Column(String, default="male", nullable=False)
    status = Column(String, default="in_progress", nullable=False)
    teacher_mood = Column(String, default="neutral", nullable=False)
    context_history = Column(JSON, default=list)
    current_question_index = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.now())
    completed_at = Column(DateTime, nullable=True)

    student = relationship("User", back_populates="exam_sessions")
    questions = relationship("ExamQuestion", back_populates="exam_session",
                             cascade="all, delete-orphan", order_by="ExamQuestion.question_index")


class StudySession(Base):
    __tablename__ = "study_sessions"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    teacher_name = Column(String, nullable=False)
    subject = Column(String, nullable=False)
    teacher_description = Column(Text, nullable=False)
    teacher_gender = Column(String, default="male", nullable=False)
    status = Column(String, default="active",
                    nullable=False)
    context_history = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.now())
    completed_at = Column(DateTime, nullable=True)

    student = relationship("User", back_populates="study_sessions")
    messages = relationship("StudyMessage", back_populates="study_session",
                            cascade="all, delete-orphan", order_by="StudyMessage.created_at")


class StudyMessage(Base):
    __tablename__ = "study_messages"

    id = Column(Integer, primary_key=True, index=True)
    study_session_id = Column(Integer, ForeignKey(
        "study_sessions.id"), nullable=False)
    message_text = Column(Text, nullable=False)
    is_from_student = Column(Boolean, nullable=False)
    created_at = Column(DateTime, default=datetime.now())

    study_session = relationship("StudySession", back_populates="messages")


class ExamQuestion(Base):
    __tablename__ = "exam_questions"

    id = Column(Integer, primary_key=True, index=True)
    exam_session_id = Column(Integer, ForeignKey(
        "exam_sessions.id"), nullable=False)
    question_index = Column(Integer, nullable=False)
    question_text = Column(Text, nullable=False)
    question_audio_url = Column(String, nullable=True)
    is_follow_up = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.now())

    exam_session = relationship("ExamSession", back_populates="questions")
    answers = relationship("ExamAnswer", back_populates="question",
                           cascade="all, delete-orphan", order_by="ExamAnswer.created_at")


class ExamAnswer(Base):
    __tablename__ = "exam_answers"

    id = Column(Integer, primary_key=True, index=True)
    question_id = Column(Integer, ForeignKey(
        "exam_questions.id"), nullable=False)
    answer_audio_url = Column(String, nullable=False)
    transcribed_text = Column(Text, nullable=True)
    is_correct = Column(Boolean, nullable=True)
    ai_feedback = Column(Text, nullable=True)
    teacher_mood_after = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.now())

    question = relationship("ExamQuestion", back_populates="answers")
