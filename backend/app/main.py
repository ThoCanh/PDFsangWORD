from fastapi import FastAPI

# CHÚ Ý: Biến này BẮT BUỘC phải tên là 'app' (vì lệnh chạy là :app)
app = FastAPI(title="DocuFlowAI Backend") 

@app.get("/")
def read_root():
    return {"message": "Hello! DocuFlowAI is running perfectly."}