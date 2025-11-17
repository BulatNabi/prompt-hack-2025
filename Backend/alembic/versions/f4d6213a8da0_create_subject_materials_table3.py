from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'f4d6213a8da0'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('subject_materials',
                    sa.Column('id', sa.Integer(), nullable=False),
                    sa.Column('subject', sa.String(), nullable=False),
                    sa.Column('content', sa.Text(), nullable=False),
                    sa.Column('created_at', sa.DateTime(), nullable=True),
                    sa.PrimaryKeyConstraint('id')
                    )
    op.create_index(op.f('ix_subject_materials_id'),
                    'subject_materials', ['id'], unique=False)
    op.create_index(op.f('ix_subject_materials_subject'),
                    'subject_materials', ['subject'], unique=False)
    op.create_table('users',
                    sa.Column('id', sa.Integer(), nullable=False),
                    sa.Column('email', sa.String(), nullable=False),
                    sa.Column('username', sa.String(), nullable=False),
                    sa.Column('hashed_password', sa.String(), nullable=False),
                    sa.Column('is_active', sa.Boolean(), nullable=True),
                    sa.Column('created_at', sa.DateTime(), nullable=True),
                    sa.Column('subscription_level',
                              sa.String(), nullable=False),
                    sa.Column('video_urls', sa.JSON(), nullable=True),
                    sa.PrimaryKeyConstraint('id'),
                    sa.UniqueConstraint('email')
                    )
    op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)
    op.create_table('exam_sessions',
                    sa.Column('id', sa.Integer(), nullable=False),
                    sa.Column('student_id', sa.Integer(), nullable=False),
                    sa.Column('teacher_name', sa.String(), nullable=False),
                    sa.Column('subject', sa.String(), nullable=False),
                    sa.Column('teacher_description',
                              sa.Text(), nullable=False),
                    sa.Column('teacher_gender', sa.String(), nullable=False),
                    sa.Column('status', sa.String(), nullable=False),
                    sa.Column('teacher_mood', sa.String(), nullable=False),
                    sa.Column('context_history', sa.JSON(), nullable=True),
                    sa.Column('current_question_index',
                              sa.Integer(), nullable=False),
                    sa.Column('created_at', sa.DateTime(), nullable=True),
                    sa.Column('completed_at', sa.DateTime(), nullable=True),
                    sa.ForeignKeyConstraint(['student_id'], ['users.id'], ),
                    sa.PrimaryKeyConstraint('id')
                    )
    op.create_index(op.f('ix_exam_sessions_id'),
                    'exam_sessions', ['id'], unique=False)
    op.create_table('refresh_tokens',
                    sa.Column('id', sa.Integer(), nullable=False),
                    sa.Column('token_hash', sa.String(), nullable=False),
                    sa.Column('user_id', sa.Integer(), nullable=False),
                    sa.Column('expires_at', sa.DateTime(), nullable=False),
                    sa.Column('created_at', sa.DateTime(), nullable=True),
                    sa.Column('is_revoked', sa.Boolean(), nullable=True),
                    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
                    sa.PrimaryKeyConstraint('id')
                    )
    op.create_index(op.f('ix_refresh_tokens_id'),
                    'refresh_tokens', ['id'], unique=False)
    op.create_index(op.f('ix_refresh_tokens_token_hash'),
                    'refresh_tokens', ['token_hash'], unique=True)
    op.create_table('study_sessions',
                    sa.Column('id', sa.Integer(), nullable=False),
                    sa.Column('student_id', sa.Integer(), nullable=False),
                    sa.Column('teacher_name', sa.String(), nullable=False),
                    sa.Column('subject', sa.String(), nullable=False),
                    sa.Column('teacher_description',
                              sa.Text(), nullable=False),
                    sa.Column('teacher_gender', sa.String(), nullable=False),
                    sa.Column('status', sa.String(), nullable=False),
                    sa.Column('context_history', sa.JSON(), nullable=True),
                    sa.Column('created_at', sa.DateTime(), nullable=True),
                    sa.Column('completed_at', sa.DateTime(), nullable=True),
                    sa.ForeignKeyConstraint(['student_id'], ['users.id'], ),
                    sa.PrimaryKeyConstraint('id')
                    )
    op.create_index(op.f('ix_study_sessions_id'),
                    'study_sessions', ['id'], unique=False)
    op.create_table('exam_questions',
                    sa.Column('id', sa.Integer(), nullable=False),
                    sa.Column('exam_session_id', sa.Integer(), nullable=False),
                    sa.Column('question_index', sa.Integer(), nullable=False),
                    sa.Column('question_text', sa.Text(), nullable=False),
                    sa.Column('question_audio_url',
                              sa.String(), nullable=True),
                    sa.Column('is_follow_up', sa.Boolean(), nullable=False),
                    sa.Column('created_at', sa.DateTime(), nullable=True),
                    sa.ForeignKeyConstraint(['exam_session_id'], [
                                            'exam_sessions.id'], ),
                    sa.PrimaryKeyConstraint('id')
                    )
    op.create_index(op.f('ix_exam_questions_id'),
                    'exam_questions', ['id'], unique=False)
    op.create_table('study_messages',
                    sa.Column('id', sa.Integer(), nullable=False),
                    sa.Column('study_session_id',
                              sa.Integer(), nullable=False),
                    sa.Column('message_text', sa.Text(), nullable=False),
                    sa.Column('is_from_student', sa.Boolean(), nullable=False),
                    sa.Column('created_at', sa.DateTime(), nullable=True),
                    sa.ForeignKeyConstraint(['study_session_id'], [
                                            'study_sessions.id'], ),
                    sa.PrimaryKeyConstraint('id')
                    )
    op.create_index(op.f('ix_study_messages_id'),
                    'study_messages', ['id'], unique=False)
    op.create_table('exam_answers',
                    sa.Column('id', sa.Integer(), nullable=False),
                    sa.Column('question_id', sa.Integer(), nullable=False),
                    sa.Column('answer_audio_url', sa.String(), nullable=False),
                    sa.Column('transcribed_text', sa.Text(), nullable=True),
                    sa.Column('is_correct', sa.Boolean(), nullable=True),
                    sa.Column('ai_feedback', sa.Text(), nullable=True),
                    sa.Column('teacher_mood_after',
                              sa.String(), nullable=True),
                    sa.Column('created_at', sa.DateTime(), nullable=True),
                    sa.ForeignKeyConstraint(
                        ['question_id'], ['exam_questions.id'], ),
                    sa.PrimaryKeyConstraint('id')
                    )
    op.create_index(op.f('ix_exam_answers_id'),
                    'exam_answers', ['id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_exam_answers_id'), table_name='exam_answers')
    op.drop_table('exam_answers')
    op.drop_index(op.f('ix_study_messages_id'), table_name='study_messages')
    op.drop_table('study_messages')
    op.drop_index(op.f('ix_exam_questions_id'), table_name='exam_questions')
    op.drop_table('exam_questions')
    op.drop_index(op.f('ix_study_sessions_id'), table_name='study_sessions')
    op.drop_table('study_sessions')
    op.drop_index(op.f('ix_refresh_tokens_token_hash'),
                  table_name='refresh_tokens')
    op.drop_index(op.f('ix_refresh_tokens_id'), table_name='refresh_tokens')
    op.drop_table('refresh_tokens')
    op.drop_index(op.f('ix_exam_sessions_id'), table_name='exam_sessions')
    op.drop_table('exam_sessions')
    op.drop_index(op.f('ix_users_id'), table_name='users')
    op.drop_table('users')
    op.drop_index(op.f('ix_subject_materials_subject'),
                  table_name='subject_materials')
    op.drop_index(op.f('ix_subject_materials_id'),
                  table_name='subject_materials')
    op.drop_table('subject_materials')
