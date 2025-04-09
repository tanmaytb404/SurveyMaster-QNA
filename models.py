from sqlalchemy import Column, Integer, String, Text, Float, Boolean, ForeignKey, DateTime, Enum, UniqueConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from database import Base

# SQLAlchemy Models
class UserModel(Base):
    __tablename__ = "userbase"
    
    user_id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)

class QuestionModel(Base):
    __tablename__ = "question_master"
    
    question_id = Column(Integer, primary_key=True, index=True)
    context = Column(Text, nullable=False)
    question = Column(Text, nullable=False)
    phase = Column(String(50), nullable=False)
    section = Column(String(50), nullable=False)
    answer_type = Column(String(50), nullable=False)
    created_by = Column(Integer, ForeignKey("userbase.user_id"), nullable=False)

# New models for Templates
class TemplateModel(Base):
    __tablename__ = "template_metadata"
    
    template_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    purpose = Column(Text, nullable=True)
    type = Column(String(50), nullable=False)
    created_by = Column(Integer, ForeignKey("userbase.user_id"), nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    questions = relationship("TemplateDefinitionModel", back_populates="template")
    
class TemplateAccessModel(Base):
    __tablename__ = "sfr_users"
    
    id = Column(Integer, primary_key=True, index=True)
    template_id = Column(Integer, ForeignKey("template_metadata.template_id"), nullable=True)
    user_id = Column(Integer, ForeignKey("userbase.user_id"), nullable=False)
    access_type = Column(String(20), nullable=False)  # "administrator", "editor", "user"
    
    # Constraints
    __table_args__ = (
        # For NULL or 0 template_id values, still ensure user_id is unique for global roles
        UniqueConstraint('template_id', 'user_id', name='uix_template_user'),
    )
    
class TemplateDefinitionModel(Base):
    __tablename__ = "template_definition"
    
    id = Column(Integer, primary_key=True, index=True)
    template_id = Column(Integer, ForeignKey("template_metadata.template_id"), nullable=False)
    question_id = Column(Integer, ForeignKey("question_master.question_id"), nullable=False)
    order = Column(Integer, nullable=False)
    
    # Relationships
    template = relationship("TemplateModel", back_populates="questions")
    
    # Constraints
    __table_args__ = (
        UniqueConstraint('template_id', 'question_id', name='uix_template_question'),
    )

class AuditDetailsModel(Base):
    __tablename__ = "audit_details"
    
    audit_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("userbase.user_id"), nullable=False)
    action_type = Column(String(50), nullable=False)  # e.g., "CREATE", "UPDATE", "DELETE"
    entity_type = Column(String(50), nullable=False)  # e.g., "QUESTION", "TEMPLATE", "USER"
    entity_id = Column(Integer, nullable=False)  # ID of the affected entity
    old_values = Column(Text, nullable=True)  # JSON string of old values
    new_values = Column(Text, nullable=True)  # JSON string of new values
    ip_address = Column(String(45), nullable=True)  # IPv6 compatible
    user_agent = Column(String(255), nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationship with UserModel
    user = relationship("UserModel")

