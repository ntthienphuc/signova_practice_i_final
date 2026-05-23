from datetime import datetime, timedelta, timezone
from typing import Any, Dict
from jose import JWTError, jwt
from app.config import settings

def create_token(data: Dict[str, Any], expires_delta: timedelta, secret_key: str) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + expires_delta
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, secret_key, algorithm=settings.algorithm)

def create_access_token(data: Dict[str, Any]) -> str:
    expires = timedelta(minutes=settings.access_token_expire_minutes)
    return create_token(data, expires, settings.jwt_secret_key)

def create_refresh_token(data: Dict[str, Any]) -> str:
    expires = timedelta(days=settings.refresh_token_expire_days)
    return create_token(data, expires, settings.jwt_refresh_secret_key)

def decode_token(token: str, secret_key: str) -> Dict[str, Any] | None:
    try:
        payload = jwt.decode(token, secret_key, algorithms=[settings.algorithm])
        return payload
    except JWTError:
        return None

def decode_access_token(token: str) -> Dict[str, Any] | None:
    return decode_token(token, settings.jwt_secret_key)

def decode_refresh_token(token: str) -> Dict[str, Any] | None:
    return decode_token(token, settings.jwt_refresh_secret_key)
