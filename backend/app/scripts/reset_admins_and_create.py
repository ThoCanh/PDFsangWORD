import os
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[2]
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from app.db.session import SessionLocal
from app.db.models import User
from app.services.auth.security import hash_password


def reset_admins_and_create(email: str, password: str):
    db = SessionLocal()
    try:
        # Delete all existing admins
        admins = db.query(User).filter(User.role == "admin").all()
        for adm in admins:
            db.delete(adm)
        if admins:
            db.commit()
            print(f"Deleted {len(admins)} admin account(s)")

        # Create new admin
        existing = db.query(User).filter(User.email == email.lower()).first()
        if existing:
            # If existing user, update role and password
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
    email = os.environ.get("ADMIN_EMAIL", "phamhuutoan.dev@gmail.com")
    password = os.environ.get("ADMIN_PASSWORD", "admin12345")
    reset_admins_and_create(email, password)
