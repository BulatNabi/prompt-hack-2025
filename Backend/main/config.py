import os
from dotenv import load_dotenv
import boto3
from pydantic import BaseModel
from openai import OpenAI
from passlib.context import CryptContext
from fastapi.security import OAuth2PasswordBearer

load_dotenv('./.env')


class Settings:
    SAMPLE_RATE = 16000
    IAM_TOKEN = os.getenv("IAM_TOKEN")
    FOLDER_ID = os.getenv("FOLDER_ID")
    S3_BUCKET = os.getenv("S3_BUCKET")
    S3_ENDPOINT = os.getenv("S3_ENDPOINT")
    S3_ACCESS_KEY = os.getenv("S3_ACCESS_KEY")
    S3_SECRET_KEY = os.getenv("S3_SECRET_KEY")
    client = OpenAI(api_key=os.getenv("OPENAI_TOKEN"))
    _origins_str = os.getenv("ORIGINS") or "http://localhost:3000,http://localhost:8000"
    ORIGINS = [origin.strip() for origin in _origins_str.split(",") if origin.strip()]
    SECRET_KEY = os.getenv("SECRET_KEY")
    ALGORITHM = os.getenv("ALGORITHM")
    ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES"))
    REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS"))
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")
    DATABASE_URL = os.getenv("DATABASE_URL")

    S3_CLIENT = boto3.client(
        "s3",
        endpoint_url=S3_ENDPOINT,
        aws_access_key_id=S3_ACCESS_KEY,
        aws_secret_access_key=S3_SECRET_KEY,
    )
