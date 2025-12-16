from app.db.session import SessionLocal
from app.db.models import ConversionJob

db = SessionLocal()
jobs = db.query(ConversionJob).order_by(ConversionJob.id.desc()).limit(10).all()
for j in jobs:
    print(j.id, j.filename, j.status, j.mode, j.error)

db.close()