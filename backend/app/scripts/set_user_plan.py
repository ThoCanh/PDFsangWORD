from pathlib import Path
import sys
BASE_DIR = Path(__file__).resolve().parents[2]
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from app.db.session import SessionLocal
from app.db.models import User
from datetime import datetime, timezone
import argparse

parser = argparse.ArgumentParser()
parser.add_argument('--email', required=True)
parser.add_argument('--plan', default='plan:1')
parser.add_argument('--months', type=int, default=None)
args = parser.parse_args()

s = SessionLocal()
try:
    user = s.query(User).filter(User.email == args.email.lower()).first()
    if not user:
        print('User not found')
    else:
        user.plan_key = args.plan
        user.plan_assigned_at = datetime.now(timezone.utc)
        user.plan_duration_months = args.months
        s.add(user)
        s.commit()
        print('Updated', user.email, user.plan_key, user.plan_assigned_at, user.plan_duration_months)
finally:
    s.close()
