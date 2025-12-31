#!/usr/bin/env python3
"""
Open-rPPG Backend Service for MediTriage AI
Real-time heart rate detection from webcam video
"""

import asyncio
import base64
import json
import logging
from typing import Optional
import numpy as np
import cv2
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import rppg

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(title="rPPG Service", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Open-rPPG model (lazy loading)
model: Optional[rppg.Model] = None


def get_model():
    """Lazy load the rPPG model"""
    global model
    if model is None:
        logger.info("Initializing Open-rPPG model...")
        model = rppg.Model()  # Uses default FacePhys.rlap model
        logger.info("Model initialized successfully")
    return model


@app.on_event("startup")
async def startup_event():
    """Initialize model on startup"""
    get_model()
    logger.info("rPPG Service started successfully")


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "model_loaded": model is not None,
        "service": "rppg"
    }


@app.websocket("/ws/rppg")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for real-time rPPG processing
    
    Client sends: {"frame": "base64_encoded_image", "timestamp": 1234567890}
    Server responds: {"hr": 72.5, "confidence": 0.95, "status": "measuring"}
    """
    await websocket.accept()
    logger.info("WebSocket connection established")
    
    rppg_model = get_model()
    frame_buffer = []
    frame_count = 0
    
    try:
        while True:
            # Receive frame from client
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message.get("action") == "start":
                # Reset buffer when starting new measurement
                frame_buffer = []
                frame_count = 0
                await websocket.send_json({
                    "status": "started",
                    "message": "Measurement started"
                })
                continue
            
            if message.get("action") == "stop":
                # Stop measurement
                frame_buffer = []
                await websocket.send_json({
                    "status": "stopped",
                    "message": "Measurement stopped"
                })
                continue
            
            # Decode frame
            frame_data = message.get("frame")
            if not frame_data:
                continue
            
            try:
                # Decode base64 image
                img_bytes = base64.b64decode(frame_data.split(',')[1] if ',' in frame_data else frame_data)
                nparr = np.frombuffer(img_bytes, np.uint8)
                frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                
                if frame is None:
                    await websocket.send_json({
                        "status": "error",
                        "message": "Failed to decode frame"
                    })
                    continue
                
                # Convert BGR to RGB
                frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                frame_buffer.append(frame_rgb)
                frame_count += 1
                
                # Process every 30 frames (about 1 second at 30fps)
                if frame_count % 30 == 0 and len(frame_buffer) >= 150:  # Need at least 5 seconds
                    try:
                        # Convert buffer to numpy array
                        frames_array = np.array(frame_buffer[-300:])  # Use last 10 seconds
                        
                        # Process with Open-rPPG
                        result = rppg_model.process_video_tensor(
                            frames_array,
                            fps=30.0
                        )
                        
                        hr = result.get('hr', 0)
                        sqi = result.get('SQI', 0)
                        
                        # Send result to client
                        await websocket.send_json({
                            "status": "measuring",
                            "hr": round(hr, 1) if hr else None,
                            "confidence": round(sqi, 2) if sqi else 0,
                            "progress": min(100, (len(frame_buffer) / 450) * 100),  # 15 seconds = 100%
                            "message": f"Heart Rate: {round(hr, 1)} BPM" if hr else "Detecting..."
                        })
                        
                    except Exception as e:
                        logger.error(f"Processing error: {e}")
                        await websocket.send_json({
                            "status": "error",
                            "message": f"Processing failed: {str(e)}"
                        })
                
                else:
                    # Send progress update
                    progress = min(100, (len(frame_buffer) / 450) * 100)
                    await websocket.send_json({
                        "status": "calibrating" if progress < 33 else "measuring",
                        "progress": round(progress, 1),
                        "message": "Calibrating..." if progress < 33 else "Measuring..."
                    })
                    
            except Exception as e:
                logger.error(f"Frame processing error: {e}")
                await websocket.send_json({
                    "status": "error",
                    "message": f"Frame error: {str(e)}"
                })
                
    except WebSocketDisconnect:
        logger.info("WebSocket connection closed")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        try:
            await websocket.send_json({
                "status": "error",
                "message": f"Connection error: {str(e)}"
            })
        except:
            pass


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001, log_level="info")
