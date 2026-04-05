# backend/database/db.py
from pymongo import MongoClient
from config.settings import settings
import sys
from dotenv import load_dotenv

load_dotenv()
client = None
db = None
prompts_collection = None
sessions_collection=None
users_collection=None
projects_collection=None

def connect_to_mongo():
    global client, db, prompts_collection,sessions_collection,users_collection,projects_collection
    try:
        client = MongoClient(settings.MONGODB_URI, serverSelectionTimeoutMS=5000)
        client.admin.command('ismaster')
        db = client['cad_ai_db']
        prompts_collection = db['prompts']
        users_collection=db['users']
        sessions_collection=db['sessions']
        projects_collection=db['projects']
        print("Connected to MongoDB successfully.")
    except Exception as e:
        print(f"Failed to connect to MongoDB: {e}")

def get_prompts_collection():
    if prompts_collection is None:
        connect_to_mongo()
    return prompts_collection

def get_sessions_collection():
    if sessions_collection is None:
        connect_to_mongo()
    return sessions_collection

def get_users_collection():
    if users_collection is None:
        connect_to_mongo()
    return users_collection

def get_projects_collection():
    if projects_collection is None:
        connect_to_mongo()
    return projects_collection