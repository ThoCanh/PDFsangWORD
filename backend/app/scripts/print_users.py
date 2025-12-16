from pathlib import Path
import sys
BASE_DIR = Path(__file__).resolve().parents[2]
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from app.db.session import SessionLocal
from app.db.models import User

s = SessionLocal()
for u in s.query(User).all():
    print(u.id, u.email, u.role, u.plan_key, u.plan_assigned_at, u.plan_duration_months)
s.close()
