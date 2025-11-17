from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional
import secrets
from sqlalchemy import select
from auth.models import User, RefreshToken
from auth.database import AsyncSessionLocal
from main.config import Settings


def verify_password(plain_password, hashed_password):
    return Settings.pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password):
    return Settings.pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.now() + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, Settings.SECRET_KEY, algorithm=Settings.ALGORITHM)


def create_refresh_token() -> str:
    return secrets.token_hex(32)


async def get_user_by_email(db: AsyncSessionLocal, email: str):
    result = await db.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()

async def get_user_by_name(db: AsyncSessionLocal, username: str):
    result = await db.execute(select(User).where(User.username == username))
    return result.scalar_one_or_none()

async def authenticate_user(db, email: str, password: str):
    user = await get_user_by_email(db, email)
    if not user or not verify_password(password, user.hashed_password):
        return False
    return user


async def save_refresh_token(db, user_id: int, raw_token: str, expires_delta: timedelta):
    hashed_token = Settings.pwd_context.hash(raw_token)
    expires_at = datetime.now() + expires_delta
    new_refresh = RefreshToken(
        token_hash=hashed_token, user_id=user_id, expires_at=expires_at)
    db.add(new_refresh)
    await db.commit()
    return raw_token


async def get_refresh_token(db, raw_token: str):
    result = await db.execute(select(RefreshToken).where(RefreshToken.is_revoked == False))
    for token_record in result.scalars():
        if Settings.pwd_context.verify(raw_token, token_record.token_hash):
            return token_record
    return None


async def revoke_refresh_token(db, token: RefreshToken):
    token.is_revoked = True
    await db.commit()
