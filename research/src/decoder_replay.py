import os
import time
import joblib
import mne


# ==========================================
# PATHS
# ==========================================

BASE = r"C:\Users\HP 0186TU\OneDrive\Desktop\Neural-Engine\Neural-Engine"

EEG_FILE = (
    BASE
    + r"\research\data\MNE-eegbci-data\files\eegmmidb\1.0.0\S001\S001R04.edf"
)

MODEL_DIR = BASE + r"\research\model"

CSP_FILE = os.path.join(MODEL_DIR, "csp.joblib")
SVM_FILE = os.path.join(MODEL_DIR, "svm.joblib")


# ==========================================
# LOAD MODELS
# ==========================================

print("Loading NeuroBridge models...")

csp = joblib.load(CSP_FILE)
model = joblib.load(SVM_FILE)

print("Models loaded successfully.")


# ==========================================
# LOAD EEG
# ==========================================

print("\nLoading EEG recording...")

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

print("EEG loaded.")


# ==========================================
# FIND MOTOR-IMAGERY EVENTS
# ==========================================

events, event_ids = mne.events_from_annotations(
    raw,
    verbose=False
)

event_map = {
    "LEFT": event_ids["T1"],
    "RIGHT": event_ids["T2"]
}


# ==========================================
# CREATE EEG WINDOWS
# ==========================================

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


# ==========================================
# NEUROBRIDGE REPLAY
# ==========================================

print("\n================================")
print("      NEUROBRIDGE REPLAY")
print("================================")

print(f"EEG windows: {len(X)}")
print("\nStarting neural replay...\n")


for i, epoch in enumerate(X):

    # CSP feature extraction
    features = csp.transform(
        epoch[None, :, :]
    )

    # SVM prediction
    prediction = model.predict(features)[0]

    probabilities = model.predict_proba(features)[0]

    confidence = max(probabilities)

    # Convert model label to human-readable intent
    if prediction == event_ids["T1"]:
        intent = "LEFT"
        command = "MOVE_LEFT"

    else:
        intent = "RIGHT"
        command = "MOVE_RIGHT"


    print("--------------------------------")
    print(f"EEG WINDOW : {i + 1}")
    print(f"INTENT     : {intent}")
    print(f"CONFIDENCE : {confidence * 100:.2f}%")
    print(f"COMMAND    : {command}")
    print("--------------------------------")

    # Simulate real-time processing
    time.sleep(1)


print("\nReplay complete.")
print("NeuroBridge decoder finished.")