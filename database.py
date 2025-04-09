from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv
from urllib.parse import quote_plus

# # Load environment variables
load_dotenv()

# Get database connection details from environment variables
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = quote_plus(os.getenv("DB_PASSWORD", "P@ssw0rd"))  # URL encode the password
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "3306")
DB_NAME = os.getenv("DB_NAME", "tryfast")

# Create SQLAlchemy engine
SQLALCHEMY_DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
engine = create_engine(SQLALCHEMY_DATABASE_URL)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()

