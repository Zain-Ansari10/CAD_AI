# backend/routes/cad_routes.py
from fastapi import APIRouter, HTTPException, status, Response, Depends
from models.request import PromptRequest
from services.llm_service import generate_code
from services.cad_service import run_code_and_export
from database.db import get_prompts_collection, get_sessions_collection
from authentication.auth import get_current_user
from datetime import datetime
from bson import ObjectId, Binary
from typing import List, Optional
import os
import uuid

router = APIRouter(prefix="/cad", tags=["CAD Models"])

# --- Helper to verify session ownership ---
def verify_session_ownership(session_id_str: str, user_id: ObjectId):
    if not ObjectId.is_valid(session_id_str):
        raise HTTPException(status_code=400, detail="Invalid Session ID")
    
    session = get_sessions_collection().find_one({
        "_id": ObjectId(session_id_str),
        "user_id": user_id
    })
    if not session:
        raise HTTPException(status_code=404, detail="Session not found or access denied")
    return ObjectId(session_id_str)


@router.post("/generate", status_code=status.HTTP_201_CREATED)
async def generate_model(
    request: PromptRequest, 
    user: dict = Depends(get_current_user)
):
    # 1. Verify the session exists and belongs to this user
    session_oid = verify_session_ownership(request.sessionId, user["_id"])

    # 2. Fetch conversation history
    # history_cursor = get_prompts_collection().find(
    #     {"session_id": session_oid},
    #     {"prompt": 1, "generated_code": 1, "_id": 0}
    # ).sort("timestamp", 1)
    # history = list(history_cursor)


    # 3. Existing Generation Logic
    code = generate_code(request.prompt)
    filename = f"{uuid.uuid4()}.stl"
    filepath = run_code_and_export(code, filename)
    history_entry=[request.prompt,code]
    get_sessions_collection().update_one({
        "_id":session_oid,
        "user_id":user["_id"]
    },
    {
        "$push":{"history":history_entry}
    }
    )
    with open(filepath, "rb") as f:
        stl_bytes = f.read()

    # 4. Insert with Reference to Session
    new_prompt_doc = {
        "session_id": session_oid,  # LINK TO SESSION
        "user_id": user["_id"],     # Optional: Link to user for easier querying later
        "prompt": request.prompt,
        "generated_code": code,
        "stl_data": Binary(stl_bytes),
        "timestamp": datetime.utcnow()
    }
    insert_result = get_prompts_collection().insert_one(new_prompt_doc)
    
    os.remove(filepath)

    return {
        "id": str(insert_result.inserted_id),
        "session_id": str(session_oid),
        "message": "Model generated and saved to Session!"
    }

# GET /cad/session/{session_id} -> Get all models for a specific session
@router.get("/session/{session_id}", response_model=List[dict])
async def list_models_in_session(
    session_id: str,
    user: dict = Depends(get_current_user)
):
    # Verify ownership
    verify_session_ownership(session_id, user["_id"])

    cursor = get_prompts_collection()\
        .find({"session_id": ObjectId(session_id)})\
        .sort("timestamp", 1)

    models = [{
        "id": str(doc["_id"]),
        "prompt": doc.get("prompt", ""),
        "generated_code": doc.get("generated_code", ""),
        "stl_url": f"/cad/{doc['_id']}/download_stl",  # URL to download STL
        "timestamp": doc["timestamp"].isoformat() + "Z",
    } for doc in cursor]
    return models

@router.get("/{model_id}", response_model=dict)
async def get_model_by_id(
    model_id: str,
    user: dict = Depends(get_current_user)
):
    if not ObjectId.is_valid(model_id):
        raise HTTPException(status_code=400, detail="Invalid ID")
        
    doc = get_prompts_collection().find_one({
        "_id": ObjectId(model_id),
        "user_id": user["_id"] # Ensure user owns this model
    })
    
    if not doc:
        raise HTTPException(status_code=404, detail="Model not found or access denied.")
        
    return {
        "id": str(doc["_id"]),
        "prompt": doc.get("prompt", ""),
        "generated_code": doc.get("generated_code", ""),
        "stl_url": f"/cad/{doc['_id']}/download_stl",
        "timestamp": doc["timestamp"].isoformat() + "Z",
    }

@router.get("/{model_id}/download_stl", response_class=Response)
async def download_stl_from_db(
    model_id: str,
    # We generally verify auth for downloads too, though sometimes presigned URLs are better.
    # For now, let's keep it protected:
    user: dict = Depends(get_current_user) 
):
    if not ObjectId.is_valid(model_id):
        raise HTTPException(status_code=400, detail="Invalid ID")
        
    doc = get_prompts_collection().find_one({
        "_id": ObjectId(model_id),
        "user_id": user["_id"] # Ensure user owns this model
    })
    
    if not doc or "stl_data" not in doc:
        raise HTTPException(status_code=404, detail="STL not found or access denied.")
        
    stl_bytes = doc["stl_data"]
    filename = f"model_{model_id[:8]}.stl"
    headers = {
        "Content-Disposition": f'attachment; filename="{filename}"'
    }
    return Response(content=stl_bytes, media_type="application/sla", headers=headers)