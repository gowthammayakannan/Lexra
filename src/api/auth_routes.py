"""
Lexra - Auth Routes
"""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../.."))

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from pydantic import BaseModel

from src.database.database import get_db
from src.database.models import User
from src.auth.auth import hash_password, verify_password, create_access_token, verify_token

router = APIRouter(prefix="/auth", tags=["auth"])
security = HTTPBearer(auto_error=False)

class RegisterRequest(BaseModel):
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

class AuthResponse(BaseModel):
    token: str
    email: str
    message: str

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    if not credentials:
        return None
    payload = verify_token(credentials.credentials)
    if not payload:
        return None
    user = db.query(User).filter(User.email == payload.get("sub")).first()
    return user

@router.post("/register", response_model=AuthResponse)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == req.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    if len(req.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    user = User(email=req.email, password_hash=hash_password(req.password))
    db.add(user)
    db.commit()
    token = create_access_token({"sub": user.email})
    return AuthResponse(token=token, email=user.email, message="Account created successfully")

@router.post("/login", response_model=AuthResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token({"sub": user.email})
    return AuthResponse(token=token, email=user.email, message="Login successful")

@router.get("/me")
def me(user: User = Depends(get_current_user)):
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return {"email": user.email, "id": user.id}

class GoogleAuthRequest(BaseModel):
    credential: str  # Google access token

@router.post("/google", response_model=AuthResponse)
def google_auth(req: GoogleAuthRequest, db: Session = Depends(get_db)):
    """
    Authenticate with Google OAuth access token.
    Fetches user info from Google's userinfo endpoint.
    """
    import requests as req_lib

    try:
        # Get user info from Google using access token
        resp = req_lib.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={"Authorization": f"Bearer {req.credential}"},
            timeout=10
        )
        if resp.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid Google token")

        user_info = resp.json()
        email = user_info.get("email")

        if not email:
            raise HTTPException(status_code=400, detail="Could not get email from Google")

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Google auth failed: {str(e)}")

    # Find or create user
    user = db.query(User).filter(User.email == email).first()
    if not user:
        import bcrypt
        dummy_hash = bcrypt.hashpw(b"google_oauth_no_password", bcrypt.gensalt()).decode()
        user = User(email=email, password_hash=dummy_hash)
        db.add(user)
        db.commit()
        message = "Account created with Google"
    else:
        message = "Login successful"

    token = create_access_token({"sub": user.email})
    return AuthResponse(token=token, email=user.email, message=message)
