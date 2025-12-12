import os
import sys
from pathlib import Path

# Ensure app package is importable
BASE_DIR = Path(__file__).resolve().parents[2]
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from app.db.session import SessionLocal
from app.db.models import User
from app.services.auth.security import hash_password


def create_admin(email: str, password: str):
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == email.lower()).first()
        if existing:
            existing.role = "admin"
            existing.password_hash = hash_password(password)
            db.add(existing)
            db.commit()
            print(f"Updated existing user to admin: {email}")
            return
        user = User(
            email=email.lower(),
            password_hash=hash_password(password),
            role="admin",
        )
        db.add(user)
        db.commit()
        print(f"Created admin user: {email}")
    finally:
        db.close()


if __name__ == "__main__":
    email = os.environ.get("ADMIN_EMAIL", "phamhuutoan.dev")
    password = os.environ.get("ADMIN_PASSWORD", "admin12345")
    create_admin(email, password)
