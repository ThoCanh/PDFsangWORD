from pathlib import Path
import sys
BASE_DIR = Path(__file__).resolve().parents[2]
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from app.db.session import SessionLocal
from app.db.models import User
from datetime import datetime, timezone


def assign(email, plan_key='plan:1', months=None):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email.lower()).first()
        if not user:
            print('User not found')
            return
        user.plan_key = plan_key
        user.plan_assigned_at = datetime.now(timezone.utc)
        user.plan_duration_months = months
        db.add(user)
        db.commit()
        print('Assigned', user.email, user.plan_key, user.plan_assigned_at, user.plan_duration_months)
    finally:
        db.close()


if __name__ == '__main__':
    import os
    email = os.environ.get('TEST_EMAIL', 'test.user@example.com')
    months = os.environ.get('DURATION_MONTHS')
    months = int(months) if months else None
    assign(email, plan_key=os.environ.get('PLAN_KEY','plan:1'), months=months)
