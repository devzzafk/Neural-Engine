import mne

EEG_FILE = r"C:\Users\HP 0186TU\OneDrive\Desktop\eeg_motor_imagery\eeg_motor_imagery\data\MNE-eegbci-data\files\eegmmidb\1.0.0\S001\S001R04.edf"

print("Loading EEG...")

raw = mne.io.read_raw_edf(
    EEG_FILE,
    preload=True,
    verbose=False
)

raw.pick("eeg")

# Motor-imagery frequency range
raw.filter(
    l_freq=7,
    h_freq=30,
    verbose=False
)

print("EEG filtered.")

# Extract event markers
events, event_ids = mne.events_from_annotations(
    raw,
    verbose=False
)

print("\nAvailable events:")
print(event_ids)

# T1 = left fist imagery
# T2 = right fist imagery
event_map = {
    "T1": event_ids["T1"],
    "T2": event_ids["T2"]
}

# Create 0–4 second epochs after each imagery event
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

print("\nEpoching complete!")
print(epochs)

print("\nNumber of trials:", len(epochs))
print("Epoch shape:", epochs.get_data().shape)

print("\nTrial labels:")
print(epochs.events[:, -1])