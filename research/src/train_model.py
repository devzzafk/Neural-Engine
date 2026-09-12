import mne
import numpy as np

from sklearn.model_selection import train_test_split
from sklearn.svm import SVC
from sklearn.metrics import accuracy_score, classification_report
from mne.decoding import CSP

BASE = r"C:\Users\HP 0186TU\OneDrive\Desktop\eeg_motor_imagery\eeg_motor_imagery\data\MNE-eegbci-data\files\eegmmidb\1.0.0\S001"

RUNS = ["S001R04.edf", "S001R08.edf", "S001R12.edf"]

all_X = []
all_y = []

for run in RUNS:

    EEG_FILE = BASE + "\\" + run

    print(f"\nLoading {run}...")

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
    y = epochs.events[:, -1]

    all_X.append(X)
    all_y.append(y)

    print(f"Trials extracted: {len(X)}")


# Combine all runs
X = np.concatenate(all_X)
y = np.concatenate(all_y)

print("\n==============================")
print("COMBINED DATASET")
print("==============================")

print("Total trials:", len(X))
print("Data shape:", X.shape)


# Train/test split
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.3,
    random_state=42,
    stratify=y
)


# CSP
print("\nTraining CSP...")

csp = CSP(
    n_components=4,
    reg=None,
    log=True,
    norm_trace=False
)

X_train_csp = csp.fit_transform(X_train, y_train)
X_test_csp = csp.transform(X_test)


# SVM
print("Training SVM...")

model = SVC(
    kernel="linear",
    probability=True,
    random_state=42
)

model.fit(X_train_csp, y_train)


# Prediction
predictions = model.predict(X_test_csp)

accuracy = accuracy_score(
    y_test,
    predictions
)


print("\n==============================")
print("NEUROBRIDGE EEG DECODER")
print("==============================")

print(f"\nTest accuracy: {accuracy * 100:.2f}%")

print("\nClassification report:")

print(
    classification_report(
        y_test,
        predictions,
        target_names=["LEFT", "RIGHT"]
    )
)
# ==============================
# SAVE TRAINED MODEL
# ==============================

import os
import joblib

MODEL_DIR = os.path.join(
    os.path.dirname(os.path.dirname(__file__)),
    "model"
)

os.makedirs(MODEL_DIR, exist_ok=True)

joblib.dump(
    csp,
    os.path.join(MODEL_DIR, "csp.joblib")
)

joblib.dump(
    model,
    os.path.join(MODEL_DIR, "svm.joblib")
)

print("\nModel saved successfully!")
print("CSP:", os.path.join(MODEL_DIR, "csp.joblib"))
print("SVM:", os.path.join(MODEL_DIR, "svm.joblib"))