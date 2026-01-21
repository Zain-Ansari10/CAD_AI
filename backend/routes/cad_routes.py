# routes/cad_routes.py
from fastapi import APIRouter, HTTPException, status, Response
from models.request import PromptRequest
from services.llm_service import generate_code
from services.cad_service import run_code_and_export
from database.db import get_prompts_collection
from datetime import datetime
from bson import ObjectId, Binary
from typing import List, Optional
import os
import uuid

router = APIRouter(prefix="/cad", tags=["CAD Models"])

# --- Store STL as binary in MongoDB and expose via streaming endpoint --- #

@router.post("/generate", status_code=status.HTTP_201_CREATED)
async def generate_model(request: PromptRequest):
    code = generate_code(request.prompt)
    filename = f"{uuid.uuid4()}.stl"
    filepath = run_code_and_export(code, filename)

    # Read STL file as binary
    with open(filepath, "rb") as f:
        stl_bytes = f.read()

    # Insert prompt, code, STL binary to MongoDB
    insert_result = get_prompts_collection().insert_one({
        "prompt": request.prompt,
        "generated_code": code,
        "stl_data": Binary(stl_bytes),
        "timestamp": datetime.utcnow()
    })
    # Optionally remove file from disk here if you want ONLY DB storage
    os.remove(filepath)

    return {
        "id": str(insert_result.inserted_id),
        "message": "Model generated and saved to MongoDB!"
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
        models = [{
            "id": str(doc["_id"]),
            "prompt": doc["prompt"],
            "timestamp": doc["timestamp"].isoformat() + "Z",
        } for doc in cursor]
        return models
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

@router.get("/{model_id}/download_stl", response_class=Response)
async def download_stl_from_db(model_id: str):
    doc = get_prompts_collection().find_one({"_id": ObjectId(model_id)})
    if not doc or "stl_data" not in doc:
        raise HTTPException(status_code=404, detail="STL not found in DB.")
    stl_bytes = doc["stl_data"]
    filename = f"model_{model_id[:8]}.stl"
    headers = {
        "Content-Disposition": f'attachment; filename="{filename}"'
    }
    return Response(content=stl_bytes, media_type="application/sla", headers=headers)

@router.get("/{model_id}", response_model=dict)
async def get_model(model_id: str):
    if not ObjectId.is_valid(model_id):
        raise HTTPException(status_code=400, detail="Invalid model ID")
    doc = get_prompts_collection().find_one({"_id": ObjectId(model_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Model not found")
    return {
        "id": str(doc["_id"]),
        "prompt": doc["prompt"],
        "timestamp": doc["timestamp"].isoformat() + "Z",
        # Add additional fields you want to send
    }

@router.put("/{model_id}", status_code=status.HTTP_200_OK)
async def update_model(model_id: str, request: PromptRequest):
    if not ObjectId.is_valid(model_id):
        raise HTTPException(status_code=400, detail="Invalid model ID")

    collection = get_prompts_collection()
    
    # 1. Check if the model exists before doing expensive generation work
    if not collection.find_one({"_id": ObjectId(model_id)}):
        raise HTTPException(status_code=404, detail="Model not found")

    try:
        # 2. Regenerate Code and STL based on the new prompt
        new_code = generate_code(request.prompt)
        filename = f"{uuid.uuid4()}.stl"
        filepath = run_code_and_export(new_code, filename)

        # 3. Read the new STL binary
        with open(filepath, "rb") as f:
            stl_bytes = f.read()

        # 4. Update the MongoDB document
        collection.update_one(
            {"_id": ObjectId(model_id)},
            {"$set": {
                "prompt": request.prompt,
                "generated_code": new_code,
                "stl_data": Binary(stl_bytes),
                "last_updated": datetime.utcnow()
            }}
        )

        # 5. Cleanup temp file
        if os.path.exists(filepath):
            os.remove(filepath)

        return {
            "id": model_id,
            "message": "Model updated and regenerated successfully"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update model: {str(e)}")
@router.delete("/{model_id}", status_code=status.HTTP_200_OK)
async def delete_model(model_id: str):
    if not ObjectId.is_valid(model_id):
        raise HTTPException(status_code=400, detail="Invalid model ID")
    doc = get_prompts_collection().find_one({"_id": ObjectId(model_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Model not found")
    get_prompts_collection().delete_one({"_id": ObjectId(model_id)})
    return {"message": "Model and file deleted successfully", "id": model_id}

@router.get("/health")
def health():
    return {
        "status": "Text-to-CAD API running!",
        "endpoints": [
            "POST   /cad/generate",
            "GET    /cad/",
            "GET    /cad/{id}",
            "GET    /cad/{id}/download_stl",
            "DELETE /cad/{id}"
        ]
    }
