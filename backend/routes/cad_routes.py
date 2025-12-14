# routes/cad_routes.py
from fastapi import APIRouter, HTTPException, status
from models.request import PromptRequest
from services.llm_service import generate_code
from services.cad_service import run_code_and_export
from database.db import get_prompts_collection

from datetime import datetime
from bson import ObjectId
from typing import List, Optional
import os
import uuid

router = APIRouter(prefix="/cad", tags=["CAD Models"])

# convert MongoDB document to dict with string ID
def model_to_dict(doc) -> dict:
    stl_filename = doc.get("stl_filename")
    return {
        "id": str(doc["_id"]),
        "prompt": doc["prompt"],
        "generated_code": doc.get("generated_code", ""),
        "stl_filename": stl_filename,
        "stl_url": f"/stls/{stl_filename}" if stl_filename else None,
        "timestamp": doc["timestamp"].isoformat() + "Z",
    }


@router.post("/generate", status_code=status.HTTP_201_CREATED)
async def generate_model(request: PromptRequest):
    code = generate_code(request.prompt)
    filename = f"{uuid.uuid4()}.stl"
    filepath = run_code_and_export(code, filename)

    insert_result = get_prompts_collection().insert_one({
        "prompt": request.prompt,
        "generated_code": code,
        "stl_filename": filename,
        "timestamp": datetime.utcnow()
    })

    return {
        "id": str(insert_result.inserted_id),
        "prompt": request.prompt,
        "generated_code": code,
        "stl_url": f"/stls/{filename}",
        "download": f"/stls/{filename}?download=1",
        "message": "Model generated and saved!"
    }


@router.get("/", response_model=List[dict])
async def list_models(
    prompt: Optional[str] = None,
    skip: int = 0,
    limit: int = 50
):
    try:
        query = {}
        if prompt:
            query["prompt"] = {"$regex": prompt, "$options": "i"}

        cursor = get_prompts_collection() \
            .find(query) \
            .sort("timestamp", -1) \
            .skip(skip) \
            .limit(limit)

        models = [model_to_dict(doc) for doc in cursor]
        return models
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {e}")


@router.get("/{model_id}", response_model=dict)
async def get_model(model_id: str):
    if not ObjectId.is_valid(model_id):
        raise HTTPException(status_code=400, detail="Invalid model ID")

    doc = get_prompts_collection().find_one({"_id": ObjectId(model_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Model not found")

    return model_to_dict(doc)


@router.put("/{model_id}", status_code=status.HTTP_200_OK)
async def update_model(model_id: str, request: PromptRequest):
    if not ObjectId.is_valid(model_id):
        raise HTTPException(status_code=400, detail="Invalid model ID")

    old_doc = get_prompts_collection().find_one({"_id": ObjectId(model_id)})
    if not old_doc:
        raise HTTPException(status_code=404, detail="Model not found")

    # Optional: delete old STL file
    old_filename = old_doc["stl_filename"]
    old_path = os.path.join("stls", old_filename)
    if os.path.exists(old_path):
        try:
            os.remove(old_path)
        except:
            pass  

    # Generate new code & STL
    new_code = generate_code(request.prompt)
    new_filename = f"{uuid.uuid4()}.stl"
    run_code_and_export(new_code, new_filename)

    # Update in DB
    updated = get_prompts_collection().update_one(
        {"_id": ObjectId(model_id)},
        {"$set": {
            "prompt": request.prompt,
            "generated_code": new_code,
            "stl_filename": new_filename,
            "timestamp": datetime.utcnow()
        }}
    )

    if updated.modified_count == 0:
        raise HTTPException(status_code=500, detail="Failed to update model")

    return {
        "id": model_id,
        "prompt": request.prompt,
        "generated_code": new_code,
        "stl_url": f"/stls/{new_filename}",
        "message": "Model updated successfully!"
    }


@router.delete("/{model_id}", status_code=status.HTTP_200_OK)
async def delete_model(model_id: str):
    if not ObjectId.is_valid(model_id):
        raise HTTPException(status_code=400, detail="Invalid model ID")

    doc = get_prompts_collection().find_one({"_id": ObjectId(model_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Model not found")

    # Delete STL file
    filename = doc["stl_filename"]
    filepath = os.path.join("stls", filename)
    if os.path.exists(filepath):
        try:
            os.remove(filepath)
        except Exception as e:
            print(f"Warning: Could not delete STL file {filename}: {e}")

    # Delete from DB
    result = get_prompts_collection().delete_one({"_id": ObjectId(model_id)})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=500, detail="Failed to delete from database")

    return {"message": "Model and file deleted successfully", "id": model_id}


@router.get("/health")
def health():
    return {"status": "Text-to-CAD API running!", "endpoints": [
        "POST   /cad/generate",
        "GET    /cad/",
        "GET    /cad/{id}",
        "PUT    /cad/{id}",
        "DELETE /cad/{id}"
    ]}