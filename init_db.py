# from database import engine
# from models import Base
# import os
# from dotenv import load_dotenv

# # Load environment variables
# load_dotenv()

# def init_db():
#     # Create all tables
#     Base.metadata.create_all(bind=engine)
#     print("Database tables created successfully!")

# if __name__ == "__main__":
#     init_db() 


from fastapi import FastAPI, HTTPException, Depends, status
from pydantic import BaseModel
from typing import Annotated
import models
from database import engine, SessionLocal
from sqlalchemy.orm import Session

app = FastAPI()
models.Base.metadata.create_all(bind=engine)

class QuestionModelBase(BaseModel):
    context = str
    question = str
    phase = str
    section =str
    answer_type = str
    created_by = int

class UserModelBase(BaseModel):
    username = str
    email = str
    password_hash = str

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close() 

db_dependency = Annotated(Session, Depends(get_db))

@app.post("/users/", status_code=status.HTTP_201_CREATED)
async def create_user(user: UserModelBase, db: db_dependency):
    db_user = models.UserModel(**user.dict())
    db.add(db_user)
    db.commit()