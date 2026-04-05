# backend/routes/project_routes.py
from fastapi import APIRouter, HTTPException, status, Depends
from database.db import get_projects_collection, get_sessions_collection
from authentication.auth import get_current_user
from models.request import CreateProjectRequest, UpdateProjectRequest
from datetime import datetime
from bson import ObjectId

router = APIRouter(prefix="/projects", tags=["Projects"])

@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_project(
    request: CreateProjectRequest, 
    user: dict = Depends(get_current_user)
):
    """Create a new project linked to the logged-in user."""
    project_doc = {
        "user_id": user["_id"],
        "name": request.name,
        "description": request.description,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    result = get_projects_collection().insert_one(project_doc)
    
    return {
        "id": str(result.inserted_id),
        "name": request.name,
        "description": request.description,
        "created_at": project_doc["created_at"],
        "updated_at": project_doc["updated_at"]
    }

@router.get("/", response_model=list)
async def list_user_projects(user: dict = Depends(get_current_user)):
    """List all projects belonging to the current user."""
    cursor = get_projects_collection().find({"user_id": user["_id"]}).sort("updated_at", -1)
    
    return [{
        "id": str(doc["_id"]),
        "name": doc["name"],
        "description": doc.get("description"),
        "created_at": doc["created_at"],
        "updated_at": doc["updated_at"]
    } for doc in cursor]

@router.get("/{project_id}")
async def get_project(project_id: str, user: dict = Depends(get_current_user)):
    """Get a specific project by ID."""
    if not ObjectId.is_valid(project_id):
        raise HTTPException(status_code=400, detail="Invalid Project ID")

    project = get_projects_collection().find_one({
        "_id": ObjectId(project_id), 
        "user_id": user["_id"]
    })
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Count sessions in this project
    session_count = get_sessions_collection().count_documents({
        "project_id": ObjectId(project_id),
        "user_id": user["_id"]
    })
    
    return {
        "id": str(project["_id"]),
        "name": project["name"],
        "description": project.get("description"),
        "created_at": project["created_at"],
        "updated_at": project["updated_at"],
        "session_count": session_count
    }

@router.put("/{project_id}")
async def update_project(
    project_id: str, 
    request: UpdateProjectRequest, 
    user: dict = Depends(get_current_user)
):
    """Update a project."""
    if not ObjectId.is_valid(project_id):
        raise HTTPException(status_code=400, detail="Invalid Project ID")

    # Ensure project belongs to user
    project = get_projects_collection().find_one({
        "_id": ObjectId(project_id), 
        "user_id": user["_id"]
    })
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Prepare update data
    update_data = {"updated_at": datetime.utcnow()}
    if request.name is not None:
        update_data["name"] = request.name
    if request.description is not None:
        update_data["description"] = request.description

    # Update the project
    get_projects_collection().update_one(
        {"_id": ObjectId(project_id)},
        {"$set": update_data}
    )
    
    return {"message": "Project updated successfully"}

@router.delete("/{project_id}")
async def delete_project(project_id: str, user: dict = Depends(get_current_user)):
    """Delete a project and all sessions inside it."""
    if not ObjectId.is_valid(project_id):
        raise HTTPException(status_code=400, detail="Invalid Project ID")

    # Ensure project belongs to user
    project = get_projects_collection().find_one({
        "_id": ObjectId(project_id), 
        "user_id": user["_id"]
    })
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Delete all sessions in this project
    sessions_cursor = get_sessions_collection().find({
        "project_id": ObjectId(project_id),
        "user_id": user["_id"]
    })
    
    for session in sessions_cursor:
        # Delete prompts in each session
        get_projects_collection().database.prompts.delete_many({
            "session_id": session["_id"]
        })
    
    # Delete all sessions in this project
    get_sessions_collection().delete_many({
        "project_id": ObjectId(project_id),
        "user_id": user["_id"]
    })
    
    # Delete the project
    get_projects_collection().delete_one({"_id": ObjectId(project_id)})
    
    return {"message": "Project and all associated sessions deleted"}