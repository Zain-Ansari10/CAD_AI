# backend/routes/session_routes.py
from fastapi import APIRouter, HTTPException, status, Depends
from database.db import get_sessions_collection, get_prompts_collection, get_projects_collection
from authentication.auth import get_current_user
from models.request import CreateSessionRequest, CreateSessionInProjectRequest
from datetime import datetime
from bson import ObjectId

router = APIRouter(prefix="/sessions", tags=["Sessions"])

@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_session(
    request: CreateSessionRequest, 
    user: dict = Depends(get_current_user)
):
    """Create a new session linked to the logged-in user (standalone session)."""
    session_doc = {
        "user_id": user["_id"],  # Link to the local MongoDB User ID
        "name": request.name,
        "created_at": datetime.utcnow(),
        "history": []
    }
    result = get_sessions_collection().insert_one(session_doc)
    
    return {
        "id": str(result.inserted_id),
        "name": request.name,
        "created_at": session_doc["created_at"]
    }

@router.post("/in-project", status_code=status.HTTP_201_CREATED)
async def create_session_in_project(
    request: CreateSessionInProjectRequest, 
    user: dict = Depends(get_current_user)
):
    """Create a new session within a specific project."""
    if not ObjectId.is_valid(request.project_id):
        raise HTTPException(status_code=400, detail="Invalid Project ID")

    # Ensure project belongs to user
    project = get_projects_collection().find_one({
        "_id": ObjectId(request.project_id), 
        "user_id": user["_id"]
    })
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    session_doc = {
        "user_id": user["_id"],
        "project_id": ObjectId(request.project_id),
        "name": request.name,
        "created_at": datetime.utcnow(),
        "history": []
    }
    result = get_sessions_collection().insert_one(session_doc)
    
    return {
        "id": str(result.inserted_id),
        "name": request.name,
        "project_id": request.project_id,
        "created_at": session_doc["created_at"]
    }

@router.get("/", response_model=list)
async def list_user_sessions(user: dict = Depends(get_current_user)):
    """List all sessions belonging to the current user."""
    cursor = get_sessions_collection().find({"user_id": user["_id"]}).sort("created_at", -1)
    
    return [{
        "id": str(doc["_id"]),
        "name": doc["name"],
        "project_id": str(doc["project_id"]) if "project_id" in doc else None,
        "created_at": doc["created_at"]
    } for doc in cursor]

@router.get("/project/{project_id}", response_model=list)
async def list_project_sessions(
    project_id: str, 
    user: dict = Depends(get_current_user)
):
    """List all sessions within a specific project."""
    if not ObjectId.is_valid(project_id):
        raise HTTPException(status_code=400, detail="Invalid Project ID")

    # Ensure project belongs to user
    project = get_projects_collection().find_one({
        "_id": ObjectId(project_id), 
        "user_id": user["_id"]
    })
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    cursor = get_sessions_collection().find({
        "user_id": user["_id"],
        "project_id": ObjectId(project_id)
    }).sort("created_at", -1)
    
    return [{
        "id": str(doc["_id"]),
        "name": doc["name"],
        "created_at": doc["created_at"]
    } for doc in cursor]

@router.delete("/{session_id}")
async def delete_session(session_id: str, user: dict = Depends(get_current_user)):
    """Delete a session and all prompts inside it."""
    if not ObjectId.is_valid(session_id):
        raise HTTPException(status_code=400, detail="Invalid Session ID")

    # Ensure session belongs to user
    session = get_sessions_collection().find_one({
        "_id": ObjectId(session_id), 
        "user_id": user["_id"]
    })
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Delete the session
    get_sessions_collection().delete_one({"_id": ObjectId(session_id)})
    
    # Cascade delete all prompts/models in this session
    get_prompts_collection().delete_many({"session_id": ObjectId(session_id)})
    
    return {"message": "Session and associated models deleted"}