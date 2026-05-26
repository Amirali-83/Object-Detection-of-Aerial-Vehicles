from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO
from pathlib import Path
import numpy as np
import cv2
import base64

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "best.pt"

model = YOLO(str(MODEL_PATH))
print("Model classes:", model.names)


@app.get("/")
def health_check():
    return {
        "model_loaded": model is not None,
        "model_path": str(MODEL_PATH.name),
        "classes": model.names
    }


@app.post("/detect")
async def detect(file: UploadFile = File(...)):
    contents = await file.read()

    np_array = np.frombuffer(contents, np.uint8)
    image = cv2.imdecode(np_array, cv2.IMREAD_COLOR)

    if image is None:
        return {"error": "Invalid image file"}

    results = model(image, conf=0.45, imgsz=640)
    result = results[0]

    annotated_image = result.plot()

    detections = []

    for box in result.boxes:
        class_id = int(box.cls[0])
        confidence = float(box.conf[0])
        label = model.names[class_id]

        detections.append({
            "label": label,
            "confidence": confidence
        })

    success, buffer = cv2.imencode(".jpg", annotated_image)

    if not success:
        return {"error": "Could not encode result image"}

    encoded_image = base64.b64encode(buffer).decode("utf-8")

    return {
        "image": encoded_image,
        "detections": detections,
        "total": len(detections)
    }


@app.get("/metrics")
def metrics():
    return {
        "precision": None,
        "recall": None,
        "mAP50": None,
        "mAP50_95": None,
        "epochs": None,
        "box_loss": None,
        "cls_loss": None,
        "note": "Metrics are not loaded automatically yet. Add your training results manually or connect results.csv later."
    }