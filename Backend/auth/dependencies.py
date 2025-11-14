from fastapi import Depends, HTTPException, status
from jose import JWTError, jwt
from sqlalchemy.ext.asyncio import AsyncSession
from auth.database import AsyncSessionLocal
from auth.auth import get_user_by_name, get_user_by_email
from main.config import Settings


async def get_db():
    async with AsyncSessionLocal() as session:
        yield session

async def get_current_user(db: AsyncSession = Depends(get_db), token: str = Depends(Settings.oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, Settings.SECRET_KEY, algorithms=[Settings.ALGORITHM])
        email: str = payload.get("email")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = await get_user_by_email(db, email)
    if user is None:
        raise credentials_exception
    return user