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


from fastapi import FastAPI, HTTPException, Depends, status, Request
from pydantic import BaseModel, field_validator
from typing import Annotated, List, Optional
import models
from database import engine, SessionLocal
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
import json
from pydantic import validator

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

models.Base.metadata.create_all(bind=engine)

class QuestionModelBase(BaseModel):
    context: str
    question: str
    phase: str
    section: str
    answer_type: str
    created_by: int

class QuestionUpdateModel(BaseModel):
    context: Optional[str] = None
    question: Optional[str] = None
    phase: Optional[str] = None
    section: Optional[str] = None
    answer_type: Optional[str] = None
    created_by: Optional[int] = None

class UserModelBase(BaseModel):
    username: str
    email: str
    password_hash: str

class UserUpdateModel(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None

class QuestionResponse(BaseModel):
    question_id: int
    context: str
    question: str
    phase: str
    section: str
    answer_type: str
    created_by: int
    
    class Config:
        from_attributes = True

# Template models
class TemplateBase(BaseModel):
    name: str
    purpose: Optional[str] = None
    type: str
    created_by: int

class TemplateCreate(TemplateBase):
    pass

class TemplateUpdate(BaseModel):
    name: Optional[str] = None
    purpose: Optional[str] = None
    type: Optional[str] = None

class TemplateResponse(TemplateBase):
    template_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class TemplateAccessCreate(BaseModel):
    template_id: int
    user_id: int
    access_type: str

class TemplateAccessResponse(TemplateAccessCreate):
    id: int
    
    class Config:
        from_attributes = True

class TemplateQuestionCreate(BaseModel):
    question_id: int
    order: int

class TemplateQuestionResponse(BaseModel):
    id: int
    template_id: int
    question_id: int
    order: int
    
    class Config:
        from_attributes = True

class TemplateWithQuestions(TemplateResponse):
    questions: List[QuestionResponse]
    
    class Config:
        from_attributes = True

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close() 

db_dependency = Annotated[Session, Depends(get_db)]

@app.post("/users/", status_code=status.HTTP_201_CREATED)
async def create_user(user: UserModelBase, db: db_dependency):
    db_user = models.UserModel(**user.dict())
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.get("/users/{user_id}", status_code=status.HTTP_200_OK)
async def get_user(user_id: int, db: db_dependency):
    user = db.query(models.UserModel).filter(models.UserModel.user_id == user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@app.get("/users", status_code=status.HTTP_200_OK)
async def get_users(db: db_dependency):
    users = db.query(models.UserModel).all()
    if users is None:
        raise HTTPException(status_code=404, detail="Users not found")
    user_list = []
    for user in users:
        user_list.append({
        "user_id": user.user_id,
        "username": user.username,
        "email": user.email,
        "password_hash": user.password_hash
        })
    return user_list

@app.post("/questions/", status_code=status.HTTP_201_CREATED, response_model=QuestionResponse)
async def add_question(question: QuestionModelBase, request: Request, db: db_dependency):
    db_question = models.QuestionModel(**question.dict())
    db.add(db_question)
    db.commit()
    db.refresh(db_question)
    
    # Create audit entry
    await create_audit_entry(
        db=db,
        user_id=question.created_by,
        action_type="CREATE",
        entity_type="QUESTION",
        entity_id=db_question.question_id,
        new_values=question.dict(),
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent", "")
    )
    
    return db_question

@app.post("/questions/add", status_code=status.HTTP_201_CREATED, response_model=QuestionResponse)
async def add_question(question: QuestionUpdateModel, request: Request, db: db_dependency):
    db_question = models.QuestionModel(**question.dict())
    db.add(db_question)
    db.commit()
    db.refresh(db_question)
    
    # Create audit entry
    await create_audit_entry(
        db=db,
        user_id=question.created_by,
        action_type="CREATE",
        entity_type="QUESTION",
        entity_id=db_question.question_id,
        new_values=question.dict(),
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent", "")
    )
    
    return db_question

@app.get("/questions/{qid}", status_code=status.HTTP_200_OK, response_model=QuestionResponse)
async def get_question(qid: int, db: db_dependency):
    question = db.query(models.QuestionModel).filter(models.QuestionModel.question_id == qid).first()
    if question is None:
        raise HTTPException(status_code=404, detail="Question not found")
    return question

@app.get("/questions", status_code=status.HTTP_200_OK, response_model=List[QuestionResponse])
async def get_all_questions(db: db_dependency):
    questions = db.query(models.QuestionModel).all()
    return questions

@app.put("/questions/{qid}", status_code=status.HTTP_200_OK, response_model=QuestionResponse)
async def update_question(qid: int, question: QuestionUpdateModel, request: Request, db: db_dependency):
    db_question = db.query(models.QuestionModel).filter(models.QuestionModel.question_id == qid).first()
    if db_question is None:
        raise HTTPException(status_code=404, detail="Question not found")
    
    # Save old values for audit
    old_values = {
        "context": db_question.context,
        "question": db_question.question,
        "phase": db_question.phase,
        "section": db_question.section,
        "answer_type": db_question.answer_type,
        "created_by": db_question.created_by
    }
    
    # Update the question fields that are provided
    question_data = question.dict(exclude_unset=True)
    for key, value in question_data.items():
        setattr(db_question, key, value)
    
    db.commit()
    db.refresh(db_question)
    
    # Create audit entry
    await create_audit_entry(
        db=db,
        user_id=db_question.created_by,
        action_type="UPDATE",
        entity_type="QUESTION",
        entity_id=db_question.question_id,
        old_values=old_values,
        new_values=question_data,
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent", "")
    )
    
    return db_question

@app.delete("/questions/{qid}", status_code=status.HTTP_200_OK)
async def delete_question(qid: int, request: Request, db: db_dependency):
    db_question = db.query(models.QuestionModel).filter(models.QuestionModel.question_id == qid).first()
    if db_question is None:
        raise HTTPException(status_code=404, detail="Question not found")
    
    # Save old values for audit
    old_values = {
        "context": db_question.context,
        "question": db_question.question,
        "phase": db_question.phase,
        "section": db_question.section,
        "answer_type": db_question.answer_type,
        "created_by": db_question.created_by
    }
    
    user_id = db_question.created_by
    
    db.delete(db_question)
    db.commit()
    
    # Create audit entry
    await create_audit_entry(
        db=db,
        user_id=user_id,
        action_type="DELETE",
        entity_type="QUESTION",
        entity_id=qid,
        old_values=old_values,
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent", "")
    )
    
    return {"message": "Question deleted successfully"}

# Template endpoints
@app.post("/templates", status_code=status.HTTP_201_CREATED, response_model=TemplateResponse)
async def create_template(template: TemplateCreate, request: Request, db: db_dependency):
    # Create the template
    db_template = models.TemplateModel(**template.dict())
    db.add(db_template)
    db.commit()
    db.refresh(db_template)
    
    # Create audit entry
    await create_audit_entry(
        db=db,
        user_id=template.created_by,
        action_type="CREATE",
        entity_type="TEMPLATE",
        entity_id=db_template.template_id,
        new_values=template.dict(),
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent", "")
    )
    
    return db_template

@app.get("/templates", status_code=status.HTTP_200_OK, response_model=List[TemplateResponse])
async def get_all_templates(db: db_dependency):
    templates = db.query(models.TemplateModel).all()
    return templates

@app.get("/templates/{template_id}", status_code=status.HTTP_200_OK, response_model=TemplateWithQuestions)
async def get_template(template_id: int, db: db_dependency):
    template = db.query(models.TemplateModel).filter(models.TemplateModel.template_id == template_id).first()
    if template is None:
        raise HTTPException(status_code=404, detail="Template not found")
    
    # Get questions associated with this template
    template_questions = db.query(models.TemplateDefinitionModel).filter(
        models.TemplateDefinitionModel.template_id == template_id
    ).order_by(models.TemplateDefinitionModel.order).all()
    
    # Get question details
    questions = []
    for tq in template_questions:
        question = db.query(models.QuestionModel).filter(
            models.QuestionModel.question_id == tq.question_id
        ).first()
        if question:
            questions.append(question)
    
    # Create response
    result = {
        "template_id": template.template_id,
        "name": template.name,
        "purpose": template.purpose,
        "type": template.type,
        "created_by": template.created_by,
        "created_at": template.created_at.isoformat(),
        "updated_at": template.updated_at.isoformat(),
        "questions": questions
    }
    
    return result

@app.put("/templates/{template_id}", status_code=status.HTTP_200_OK, response_model=TemplateResponse)
async def update_template(template_id: int, template: TemplateUpdate, request: Request, db: db_dependency):
    db_template = db.query(models.TemplateModel).filter(models.TemplateModel.template_id == template_id).first()
    if db_template is None:
        raise HTTPException(status_code=404, detail="Template not found")
    
    # Save old values for audit
    old_values = {
        "name": db_template.name,
        "purpose": db_template.purpose,
        "type": db_template.type
    }
    
    # Update the template fields that are provided
    template_data = template.dict(exclude_unset=True)
    for key, value in template_data.items():
        setattr(db_template, key, value)
    
    db.commit()
    db.refresh(db_template)
    
    # Create audit entry
    await create_audit_entry(
        db=db,
        user_id=db_template.created_by,
        action_type="UPDATE",
        entity_type="TEMPLATE",
        entity_id=db_template.template_id,
        old_values=old_values,
        new_values=template_data,
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent", "")
    )
    
    return db_template

@app.delete("/templates/{template_id}", status_code=status.HTTP_200_OK)
async def delete_template(template_id: int, request: Request, db: db_dependency):
    db_template = db.query(models.TemplateModel).filter(models.TemplateModel.template_id == template_id).first()
    if db_template is None:
        raise HTTPException(status_code=404, detail="Template not found")
    
    # Save old values and user ID for audit
    old_values = {
        "name": db_template.name,
        "purpose": db_template.purpose,
        "type": db_template.type,
        "created_by": db_template.created_by
    }
    user_id = db_template.created_by
    
    # Delete related template questions first
    db.query(models.TemplateDefinitionModel).filter(
        models.TemplateDefinitionModel.template_id == template_id
    ).delete()
    
    # Delete template access records
    db.query(models.TemplateAccessModel).filter(
        models.TemplateAccessModel.template_id == template_id
    ).delete()
    
    # Delete the template
    db.delete(db_template)
    db.commit()
    
    # Create audit entry
    await create_audit_entry(
        db=db,
        user_id=user_id,
        action_type="DELETE",
        entity_type="TEMPLATE",
        entity_id=template_id,
        old_values=old_values,
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent", "")
    )
    
    return {"message": "Template deleted successfully"}

# Template access (sfr_users) endpoints
@app.post("/templates/{template_id}/access", status_code=status.HTTP_201_CREATED, response_model=TemplateAccessResponse)
async def add_template_access(template_id: int, access: TemplateAccessCreate, db: db_dependency):
    # Verify template exists
    template = db.query(models.TemplateModel).filter(models.TemplateModel.template_id == template_id).first()
    if template is None:
        raise HTTPException(status_code=404, detail="Template not found")
    
    # Verify user exists
    user = db.query(models.UserModel).filter(models.UserModel.user_id == access.user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Create access record
    db_access = models.TemplateAccessModel(
        template_id=template_id,
        user_id=access.user_id,
        access_type=access.access_type
    )
    
    db.add(db_access)
    db.commit()
    db.refresh(db_access)
    return db_access

@app.get("/templates/{template_id}/access", status_code=status.HTTP_200_OK, response_model=List[TemplateAccessResponse])
async def get_template_access(template_id: int, db: db_dependency):
    # Verify template exists
    template = db.query(models.TemplateModel).filter(models.TemplateModel.template_id == template_id).first()
    if template is None:
        raise HTTPException(status_code=404, detail="Template not found")
    
    # Get access records
    access_records = db.query(models.TemplateAccessModel).filter(
        models.TemplateAccessModel.template_id == template_id
    ).all()
    
    return access_records

@app.delete("/templates/{template_id}/access/{user_id}", status_code=status.HTTP_200_OK)
async def remove_template_access(template_id: int, user_id: int, db: db_dependency):
    # Verify template exists
    template = db.query(models.TemplateModel).filter(models.TemplateModel.template_id == template_id).first()
    if template is None:
        raise HTTPException(status_code=404, detail="Template not found")
    
    # Find and delete access record
    access_record = db.query(models.TemplateAccessModel).filter(
        models.TemplateAccessModel.template_id == template_id,
        models.TemplateAccessModel.user_id == user_id
    ).first()
    
    if access_record is None:
        raise HTTPException(status_code=404, detail="Access record not found")
    
    db.delete(access_record)
    db.commit()
    return {"message": "Access removed successfully"}

# Template questions endpoints
@app.post("/templates/{template_id}/questions", status_code=status.HTTP_201_CREATED, response_model=List[TemplateQuestionResponse])
async def add_questions_to_template(template_id: int, questions: List[TemplateQuestionCreate], db: db_dependency):
    # Verify template exists
    template = db.query(models.TemplateModel).filter(models.TemplateModel.template_id == template_id).first()
    if template is None:
        raise HTTPException(status_code=404, detail="Template not found")
    
    # Clear existing questions if any
    db.query(models.TemplateDefinitionModel).filter(
        models.TemplateDefinitionModel.template_id == template_id
    ).delete()
    
    # Add new questions
    created_template_questions = []
    for question_data in questions:
        # Verify question exists
        question = db.query(models.QuestionModel).filter(
            models.QuestionModel.question_id == question_data.question_id
        ).first()
        if question is None:
            raise HTTPException(status_code=404, detail=f"Question with ID {question_data.question_id} not found")
        
        # Create template question mapping
        db_template_question = models.TemplateDefinitionModel(
            template_id=template_id,
            question_id=question_data.question_id,
            order=question_data.order
        )
        
        db.add(db_template_question)
        created_template_questions.append(db_template_question)
    
    db.commit()
    
    # Refresh all created objects
    for tq in created_template_questions:
        db.refresh(tq)
    
    return created_template_questions

@app.get("/templates/{template_id}/questions", status_code=status.HTTP_200_OK, response_model=List[QuestionResponse])
async def get_template_questions(template_id: int, db: db_dependency):
    # Verify template exists
    template = db.query(models.TemplateModel).filter(models.TemplateModel.template_id == template_id).first()
    if template is None:
        raise HTTPException(status_code=404, detail="Template not found")
    
    # Get questions associated with this template
    template_questions = db.query(models.TemplateDefinitionModel).filter(
        models.TemplateDefinitionModel.template_id == template_id
    ).order_by(models.TemplateDefinitionModel.order).all()
    
    # Get question details
    questions = []
    for tq in template_questions:
        question = db.query(models.QuestionModel).filter(
            models.QuestionModel.question_id == tq.question_id
        ).first()
        if question:
            questions.append(question)
    
    return questions

@app.delete("/templates/{template_id}/questions/{question_id}", status_code=status.HTTP_200_OK)
async def remove_question_from_template(template_id: int, question_id: int, db: db_dependency):
    # Verify template exists
    template = db.query(models.TemplateModel).filter(models.TemplateModel.template_id == template_id).first()
    if template is None:
        raise HTTPException(status_code=404, detail="Template not found")
    
    # Find and delete template question mapping
    template_question = db.query(models.TemplateDefinitionModel).filter(
        models.TemplateDefinitionModel.template_id == template_id,
        models.TemplateDefinitionModel.question_id == question_id
    ).first()
    
    if template_question is None:
        raise HTTPException(status_code=404, detail="Question not in template")
    
    db.delete(template_question)
    db.commit()
    return {"message": "Question removed from template successfully"}

# Audit models
class AuditCreate(BaseModel):
    user_id: int
    action_type: str
    entity_type: str
    entity_id: int
    old_values: Optional[str] = None
    new_values: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None

class AuditResponse(AuditCreate):
    audit_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# Audit endpoints
@app.post("/audit", status_code=status.HTTP_201_CREATED, response_model=AuditResponse)
async def create_audit_log(audit: AuditCreate, request: Request, db: db_dependency):
    # Create audit log
    audit_data = audit.dict()
    
    # Get IP address and user agent if not provided
    if not audit_data.get("ip_address"):
        audit_data["ip_address"] = request.client.host
    if not audit_data.get("user_agent"):
        audit_data["user_agent"] = request.headers.get("user-agent", "")
    
    db_audit = models.AuditDetailsModel(**audit_data)
    db.add(db_audit)
    db.commit()
    db.refresh(db_audit)
    return db_audit

@app.get("/audit", status_code=status.HTTP_200_OK, response_model=List[AuditResponse])
async def get_audit_logs(
    db: db_dependency,
    skip: int = 0, 
    limit: int = 100, 
    user_id: Optional[int] = None,
    entity_type: Optional[str] = None,
    entity_id: Optional[int] = None,
    action_type: Optional[str] = None
):
    # Build query with filters
    query = db.query(models.AuditDetailsModel)
    
    if user_id:
        query = query.filter(models.AuditDetailsModel.user_id == user_id)
    if entity_type:
        query = query.filter(models.AuditDetailsModel.entity_type == entity_type)
    if entity_id:
        query = query.filter(models.AuditDetailsModel.entity_id == entity_id)
    if action_type:
        query = query.filter(models.AuditDetailsModel.action_type == action_type)
    
    # Order by creation time (newest first) and apply pagination
    audit_logs = query.order_by(models.AuditDetailsModel.created_at.desc()).offset(skip).limit(limit).all()
    return audit_logs

@app.get("/audit/{audit_id}", status_code=status.HTTP_200_OK, response_model=AuditResponse)
async def get_audit_log(audit_id: int, db: db_dependency):
    audit_log = db.query(models.AuditDetailsModel).filter(models.AuditDetailsModel.audit_id == audit_id).first()
    if audit_log is None:
        raise HTTPException(status_code=404, detail="Audit log not found")
    return audit_log

@app.put("/users/{user_id}", status_code=status.HTTP_200_OK)
async def update_user(user_id: int, user: UserUpdateModel, request: Request, db: db_dependency):
    db_user = db.query(models.UserModel).filter(models.UserModel.user_id == user_id).first()
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Save old values for audit
    old_values = {
        "username": db_user.username,
        "email": db_user.email
    }
    
    # Update the user fields that are provided, excluding role
    user_data = user.dict(exclude={"role"}, exclude_unset=True)
    for key, value in user_data.items():
        setattr(db_user, key, value)
    
    db.commit()
    db.refresh(db_user)
    
    # Create audit entry
    admin_id = 1  # Placeholder, should come from authentication
    await create_audit_entry(
        db=db,
        user_id=admin_id,
        action_type="UPDATE",
        entity_type="USER",
        entity_id=db_user.user_id,
        old_values=old_values,
        new_values=user_data,
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent", "")
    )
    
    return db_user

# Helper function to create audit log
async def create_audit_entry(db: Session, user_id: int, action_type: str, entity_type: str, 
                           entity_id: int, old_values=None, new_values=None, 
                           ip_address=None, user_agent=None):
    """
    Helper function to create audit entries from other endpoints
    """
    audit_data = {
        "user_id": user_id,
        "action_type": action_type,
        "entity_type": entity_type,
        "entity_id": entity_id,
        "old_values": json.dumps(old_values) if old_values else None,
        "new_values": json.dumps(new_values) if new_values else None,
        "ip_address": ip_address,
        "user_agent": user_agent
    }
    
    db_audit = models.AuditDetailsModel(**audit_data)
    db.add(db_audit)
    db.commit()
    return db_audit

class UserRoleCreate(BaseModel):
    user_id: int
    access_type: str  # "administrator", "editor", "user"

class UserRoleResponse(BaseModel):
    id: int
    user_id: int
    access_type: str
    template_id: Optional[int] = None
    
    class Config:
        from_attributes = True

# Assign a global role to a user
@app.post("/user-roles", status_code=status.HTTP_201_CREATED, response_model=UserRoleResponse)
async def assign_user_role(user_role: UserRoleCreate, request: Request, db: db_dependency):
    # Check if user already has a global role
    existing_role = db.query(models.TemplateAccessModel).filter(
        models.TemplateAccessModel.user_id == user_role.user_id,
        models.TemplateAccessModel.template_id == None  # Using NULL for global roles
    ).first()
    
    if existing_role:
        # Update existing role
        existing_role.access_type = user_role.access_type
        db.commit()
        db.refresh(existing_role)
        return existing_role
    
    # Create new role
    db_role = models.TemplateAccessModel(
        user_id=user_role.user_id,
        access_type=user_role.access_type,
        template_id=None  # Using NULL for global roles
    )
    db.add(db_role)
    db.commit()
    db.refresh(db_role)
    return db_role

# Get a user's role
@app.get("/user-roles/{user_id}", status_code=status.HTTP_200_OK, response_model=UserRoleResponse)
async def get_user_role(user_id: int, db: db_dependency):
    # Check for global role
    user_role = db.query(models.TemplateAccessModel).filter(
        models.TemplateAccessModel.user_id == user_id,
        models.TemplateAccessModel.template_id == None  # Using NULL for global roles
    ).first()
    
    if not user_role:
        # If no global role, create default "user" role
        user_role = models.TemplateAccessModel(
            user_id=user_id,
            access_type="user",
            template_id=None  # Using NULL for global roles
        )
        db.add(user_role)
        db.commit()
        db.refresh(user_role)
    
    return user_role

# Get all users with their roles
@app.get("/user-roles", status_code=status.HTTP_200_OK, response_model=List[UserRoleResponse])
async def get_all_user_roles(db: db_dependency):
    user_roles = db.query(models.TemplateAccessModel).filter(
        models.TemplateAccessModel.template_id == None  # Using NULL for global roles
    ).all()
    return user_roles