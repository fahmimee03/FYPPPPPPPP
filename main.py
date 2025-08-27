# main.py
import os
import uuid
import cv2
import numpy as np
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO

app = FastAPI()
# allow your Next.js dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["POST"],
    allow_headers=["*"],
)

#path
# Load model once
MODEL_PATH = r"runs/detect/pcb_defect_yolov8n2/weights/best.onnx"

DATA_YAML      = r"dataset/data.yaml"
UPLOAD_DIR    = "uploads"
INSPECTED_DIR = "inspected"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(INSPECTED_DIR, exist_ok=True)


print(f"🔄 Loading model from {MODEL_PATH}")
model = YOLO(MODEL_PATH)

# 2) Compute and cache validation metrics at startup
print("Computing validation metrics...")
val_res = model.val(data=DATA_YAML, imgsz=320, batch=4)
# Filter only the core metrics
METRICS = {
    k.replace("metrics/", ""): float(v)
    for k, v in val_res.results_dict.items()
    if k.startswith("metrics/")
}
print("validation Metrics:", METRICS)


@app.post("/detect/")
async def detect(file: UploadFile = File(...)):
    # 1. Save upload
    ext = os.path.splitext(file.filename)[1]
    uid = f"{uuid.uuid4().hex}{ext}"
    src_path = os.path.join(UPLOAD_DIR, uid)
    with open(src_path, "wb") as f:
        f.write(await file.read())

    # 2. Run inference
    try:
        results = model.predict(source=src_path, imgsz=320, save=False)
    except Exception as e:
        raise HTTPException(500, f"Inference error: {e}")
     # --- 3. Extract defect labels & confidences ---
    boxes = results[0].boxes
    cls_idxs = boxes.cls.cpu().numpy().tolist()
    confs    = boxes.conf.cpu().numpy().tolist()
    defects  = [
        {"class": model.names[int(c)], "confidence": confs[i]}
        for i, c in enumerate(cls_idxs)
    ]
    print(f"Detected {len(defects)} defects in {file.filename}")

    

    # 4. Annotate & save image
    annotated = results[0].plot()
    out_name  = f"{uuid.uuid4().hex}_annotated{ext}"
    out_path  = os.path.join(INSPECTED_DIR, out_name)
    cv2.imwrite(out_path, annotated)

    # 5. Return JSON response with everything frontend needs
    return JSONResponse({
        "annotated_url": f"/inspected/{out_name}",
        "defects":       defects,
        "metrics":       METRICS
    })


@app.get("/inspected/{filename}")
def inspected_file(filename: str):
    return FileResponse(os.path.join(INSPECTED_DIR, filename))



if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
