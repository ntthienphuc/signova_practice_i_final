from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.config import settings

if settings.database_url.startswith("sqlite"):
    engine = create_engine(
        settings.database_url,
        connect_args={"check_same_thread": False},
        pool_pre_ping=True
    )
else:
    engine = create_engine(
        settings.database_url,
        pool_size=10,
        max_overflow=20,
        pool_recycle=300, # Release inactive connection slots in serverless Neon DB
        pool_pre_ping=True
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
