# backend/auth/dependencies.py
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt  # PyJWT
from jwt.exceptions import ExpiredSignatureError, InvalidTokenError
from database.db import get_users_collection
from datetime import datetime
from config.settings import settings
import logging

logger = logging.getLogger(__name__)

clerk_public_key = settings.CLERK_PEM_PUBLIC_KEY.replace("\\n","\n")

# Verify the key is loaded
if not clerk_public_key or not clerk_public_key.strip():
    logger.error("CLERK_PEM_PUBLIC_KEY is not set or empty!")
elif not clerk_public_key.startswith("-----BEGIN PUBLIC KEY-----"):
    logger.warning("CLERK_PEM_PUBLIC_KEY may not be in correct format")

security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        # 1. Decode & Verify Token
        # Clerk tokens typically have 'iss' claim that should be verified
        # But we'll allow flexibility for now
        payload = jwt.decode(
            token, 
            key=clerk_public_key, 
            algorithms=["RS256"],
            options={
                "verify_signature": True,
                "verify_exp": True,
                "verify_aud": False,  # Clerk tokens may not have standard aud claim
                "verify_iss": False,  # Allow any issuer for now
                "verify_iat": False,  # Disable iat validation to avoid clock skew issues
            },
            leeway=60  # Allow 60 seconds of clock skew for exp claim
        )
        
        clerk_id = payload.get("sub")
        email = payload.get("email", "")

        if not clerk_id:
            logger.error("Token missing 'sub' claim")
            raise HTTPException(status_code=401, detail="Invalid Token: missing user ID")

        # 2. Sync User to MongoDB (Upsert)
        # This ensures the user exists in your DB so we can link sessions to them
        user = get_users_collection().find_one_and_update(
            {"clerk_id": clerk_id},
            {
                "$set": {
                    "clerk_id": clerk_id,
                    "email": email,
                    "last_login": datetime.utcnow()
                },
                "$setOnInsert": {"created_at": datetime.utcnow()}
            },
            upsert=True,
            return_document=True
        )
        return user

    except ExpiredSignatureError:
        logger.error("Token has expired")
        raise HTTPException(status_code=401, detail="Token has expired")
    except InvalidTokenError as e:
        logger.error(f"Invalid token: {str(e)}")
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")
    except Exception as e:
        logger.error(f"Authentication error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")