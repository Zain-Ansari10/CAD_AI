# backend/database/db.py
from pymongo import MongoClient
from config.settings import settings
import sys
from dotenv import load_dotenv

load_dotenv()
client = None
db = None
prompts_collection = None

def connect_to_mongo():
    global client, db, prompts_collection
    try:
        client = MongoClient(settings.MONGODB_URI, serverSelectionTimeoutMS=5000)
        client.admin.command('ismaster')
        db = client['cad_ai_db']
        prompts_collection = db['prompts']
        print("Connected to MongoDB successfully.")
    except Exception as e:
        print(f"Failed to connect to MongoDB: {e}")

def get_prompts_collection():
    if prompts_collection is None:
        connect_to_mongo()
    return prompts_collection