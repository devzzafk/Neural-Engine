import mne
import numpy as np

from sklearn.svm import SVC
from sklearn.metrics import accuracy_score, classification_report
from mne.decoding import CSP


BASE = r"C:\Users\HP 0186TU\OneDrive\Desktop\eeg_motor_imagery\eeg_motor_imagery\data\MNE-eegbci-data\files\eegmmidb\1.0.0\S001"
RUNS = [
    "S001R04.edf",
    "S001R08.edf",
    "S001R12.edf"
]


def load_run(filename):

    path = BASE + "\\" + filename

    raw = mne.io.read_raw_edf(
        path,
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

    return epochs.get_data(), epochs.events[:, -1]


# ==========================================
# LEAVE-ONE-RUN-OUT VALIDATION
# ==========================================

results = []

for test_run in RUNS:

    print("\n================================")
    print(f"TEST RUN: {test_run}")
    print("================================")

    train_X = []
    train_y = []

    test_X = []
    test_y = []

    for run in RUNS:

        X, y = load_run(run)

        if run == test_run:

            test_X.append(X)
            test_y.append(y)

        else:

            train_X.append(X)
            train_y.append(y)

    train_X = np.concatenate(train_X)
    train_y = np.concatenate(train_y)

    test_X = np.concatenate(test_X)
    test_y = np.concatenate(test_y)

    print("Training trials:", len(train_X))
    print("Testing trials:", len(test_X))

    # Train CSP ONLY on training runs
    csp = CSP(
        n_components=4,
        reg=None,
        log=True,
        norm_trace=False
    )

    train_features = csp.fit_transform(
        train_X,
        train_y
    )

    test_features = csp.transform(
        test_X
    )

    # Train SVM
    model = SVC(
        kernel="linear",
        probability=True,
        random_state=42
    )

    model.fit(
        train_features,
        train_y
    )

    # Predict unseen run
    predictions = model.predict(
        test_features
    )

    accuracy = accuracy_score(
        test_y,
        predictions
    )

    results.append(accuracy)

    print(
        f"\nAccuracy on unseen run: "
        f"{accuracy * 100:.2f}%"
    )

    print(
        classification_report(
            test_y,
            predictions,
            target_names=["LEFT", "RIGHT"]
        )
    )


# ==========================================
# FINAL RESULT
# ==========================================

print("\n================================")
print("NEUROBRIDGE VALIDATION")
print("================================")

for run, accuracy in zip(RUNS, results):

    print(
        f"{run}: "
        f"{accuracy * 100:.2f}%"
    )

print(
    f"\nMean accuracy: "
    f"{np.mean(results) * 100:.2f}%"
)

print(
    f"Std deviation: "
    f"{np.std(results) * 100:.2f}%"
)