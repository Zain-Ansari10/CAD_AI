# backend/services/cad_service.py
import cadquery as cq
import os
import uuid
from fastapi import HTTPException
import traceback # Useful for detailed error logs

STL_DIR = "stls"
os.makedirs(STL_DIR, exist_ok=True)

def run_code_and_export(code: str, filename: str = None) -> str:
    if not filename:
        filename = f"{uuid.uuid4()}.stl"
    
    filepath = os.path.join(STL_DIR, filename)
    
    # Pre-inject 'cq' so the LLM doesn't need to import it
    namespace = {"cq": cq,"CQ":cq.Workplane, "result": None}
    
    # --- LOGGING FOR DEBUGGING ---
    print("------ GENERATED CODE START ------")
    print(code)
    print("------- GENERATED CODE END -------")
    # -----------------------------

    try:
        exec(code, namespace)
        result = namespace.get("result")
        
        if result is None:
            raise ValueError("Code did not assign anything to 'result'")
        
        # Handle cases where result is a Workplane or a Shape
        if not hasattr(result, "val"): 
             raise ValueError(f"Result is type {type(result)}, expected Workplane")

        result.val().exportStl(filepath)
        return filepath
        
    except SyntaxError as se:
        # This will now tell you exactly where the syntax error is in your logs
        print(f"Syntax Error details: {se}")
        raise HTTPException(status_code=500, detail=f"Generated invalid Python syntax: {se.msg}")
    except Exception as e:
        traceback.print_exc() # Print full stack trace to console
        raise HTTPException(status_code=500, detail=f"CAD execution failed: {str(e)}")