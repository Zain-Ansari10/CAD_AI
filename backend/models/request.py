# backend/models/request.py
from pydantic import BaseModel
from typing import Optional, List

class CreateSessionRequest(BaseModel):
    name:str
    
class PromptRequest(BaseModel):
    sessionId:str
    prompt: str

# New Project models
class CreateProjectRequest(BaseModel):
    name: str
    description: Optional[str] = None

class UpdateProjectRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

class CreateSessionInProjectRequest(BaseModel):
    name: str
    project_id: str