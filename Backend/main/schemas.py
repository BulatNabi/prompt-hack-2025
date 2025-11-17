from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import List, Optional


class UserBase(BaseModel):
    email: EmailStr
    username: str


class UserCreate(UserBase):
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(UserBase):
    subscription_level: str
    video_urls: List[str] = []
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class SubscriptionUpdate(BaseModel):
    new_level: str


class ExamStartRequest(BaseModel):
    teacher_name: str
    subject: str
    teacher_description: str
    materials: Optional[List[str]] = None


class QuestionResponse(BaseModel):
    exam_session_id: int
    question_id: int
    question_text: str
    question_audio_url: str
    question_index: int
    is_follow_up: bool

    class Config:
        from_attributes = True


class AnswerRequest(BaseModel):
    exam_session_id: int
    question_id: int
    answer_audio_url: str


class AnswerResponse(BaseModel):
    exam_session_id: int
    answer_id: int
    is_correct: bool
    ai_feedback: str
    teacher_mood: str
    next_question: Optional[QuestionResponse] = None
    exam_completed: bool = False

    class Config:
        from_attributes = True


class ExamStatusResponse(BaseModel):
    exam_session_id: int
    status: str
    teacher_mood: str
    current_question_index: int
    questions_count: int
    created_at: datetime

    class Config:
        from_attributes = True


class SubjectMaterialsRequest(BaseModel):
    subject: str
    content: str


class SubjectMaterialsResponse(BaseModel):
    id: int
    subject: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True


class VideoRequestDto(BaseModel):
    video_url: str
    text: Optional[str] = None
    params: Optional[dict] = None


class CutVideoRequestDto(BaseModel):
    video_url: str
    start: float
    end: float


class AudioRequestDto(BaseModel):
    audio_url: str
    text: Optional[str] = None
    params: Optional[dict] = None


class StudyStartRequest(BaseModel):
    teacher_name: str
    subject: str
    teacher_description: str
    materials: Optional[List[str]] = None


class StudyMessageRequest(BaseModel):
    study_session_id: int
    message: str


class StudyMessageResponse(BaseModel):
    study_session_id: int
    message_id: int
    message_text: str
    is_from_student: bool
    created_at: datetime

    class Config:
        from_attributes = True


class StudyResponse(BaseModel):
    study_session_id: int
    teacher_response: str

    class Config:
        from_attributes = True


class PDFUploadResponse(BaseModel):
    subject: str
    document_ids: List[str]
    pages_count: int
    chunks_count: int
    message: str
