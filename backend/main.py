from fastapi import FastAPI, WebSocket
import asyncio
import os
import sys
import time
import joblib
import mne


app = FastAPI(title="NeuroBridge")

# ==========================================
# PATHS
# ==========================================

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

EEG_FILE = r"C:\Users\HP 0186TU\OneDrive\Desktop\eeg_motor_imagery\eeg_motor_imagery\data\MNE-eegbci-data\files\eegmmidb\1.0.0\S001\S001R04.edf"

MODEL_DIR = os.path.join(
    BASE,
    "research",
    "model"
)

CSP_FILE = os.path.join(MODEL_DIR, "csp.joblib")
SVM_FILE = os.path.join(MODEL_DIR, "svm.joblib")

# ==========================================
# LOAD MODEL + EEG
# ==========================================

print("Loading NeuroBridge model...")

csp = joblib.load(CSP_FILE)
model = joblib.load(SVM_FILE)

print("Model loaded.")


print("Loading EEG recording...")

raw = mne.io.read_raw_edf(
    EEG_FILE,
    preload=True,
    verbose=False
)

raw.pick("eeg")

raw.filter(
    l_freq=7,
    h_freq=30,
    verbose=False
)

events, event_ids = mne.events_from_annotations(
    raw,
    verbose=False
)

event_map = {
    "LEFT": event_ids["T1"],
    "RIGHT": event_ids["T2"]
}

epochs = mne.Epochs(
    raw,
    events,
    event_id=event_map,
    tmin=0,
    tmax=4,
    baseline=None,
    preload=True,
    verbose=False
)

X = epochs.get_data()

print(f"EEG windows loaded: {len(X)}")


# ==========================================
# ROOT
# ==========================================

@app.get("/")
def root():

    return {
        "project": "NeuroBridge",
        "status": "online",
        "mode": "REPLAY",
        "decoder": "CSP + SVM"
    }


# ==========================================
# WEBSOCKET
# ==========================================

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):

    await websocket.accept()

    print("\nFrontend connected.")

    try:

        for i, epoch in enumerate(X):

            # CSP feature extraction
            features = csp.transform(
                epoch[None, :, :]
            )

            # Prediction
            prediction = model.predict(features)[0]

            probabilities = model.predict_proba(features)[0]

            confidence = float(max(probabilities))


            # Convert prediction → intent
            if prediction == event_ids["T1"]:

                intent = "LEFT"
                command = "MOVE_LEFT"

            else:

                intent = "RIGHT"
                command = "MOVE_RIGHT"


            message = {
                "intent": intent,
                "command": command,
                "confidence": confidence,
                "timestamp": time.time(),
                "window": i + 1,
                "mode": "REPLAY"
            }


            await websocket.send_json(message)


            print(
                f"[{i + 1}/{len(X)}] "
                f"{intent} | "
                f"{command} | "
                f"{confidence * 100:.2f}%"
            )


            # Simulate streaming
            await asyncio.sleep(2)


    except Exception as e:

        print("Frontend disconnected:", e)

