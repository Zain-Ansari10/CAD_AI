from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
import os
from routes.cad_routes import router as cad_router
from database.db import connect_to_mongo
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Text-to-CAD API", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],  
    allow_headers=["*"],  
)
# Mount static files
os.makedirs("stls", exist_ok=True)
app.mount("/stls", StaticFiles(directory="stls"), name="stls")


app.include_router(cad_router)

# Startup: connect to DB
@app.on_event("startup")
def startup_event():
    connect_to_mongo()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)