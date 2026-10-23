"""
Lexra — Database Setup
"""
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from .models import Base

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./data/lexra.db")

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def create_all_tables():
    os.makedirs("./data", exist_ok=True)
    Base.metadata.create_all(bind=engine)
    print("[DB] Tables created")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
