import time
import mne

EEG_FILE = r"C:\Users\HP 0186TU\OneDrive\Desktop\eeg_motor_imagery\eeg_motor_imagery\data\MNE-eegbci-data\files\eegmmidb\1.0.0\S001\S001R04.edf"

print("Loading EEG recording...")

raw = mne.io.read_raw_edf(
    EEG_FILE,
    preload=True,
    verbose=False
)

raw.pick("eeg")

# Filter the signal
raw.filter(
    l_freq=7,
    h_freq=30,
    verbose=False
)

print("\n==============================")
print("NEUROBRIDGE EEG REPLAY")
print("==============================")

print(f"Channels: {len(raw.ch_names)}")
print(f"Sampling rate: {raw.info['sfreq']} Hz")
print(f"Duration: {raw.times[-1]:.2f} seconds")

print("\nStarting replay...\n")

# Replay 1-second chunks
chunk_size = int(raw.info["sfreq"])

for start in range(0, len(raw.times), chunk_size):

    stop = min(start + chunk_size, len(raw.times))

    chunk = raw.get_data(
        start=start,
        stop=stop
    )

    elapsed = stop / raw.info["sfreq"]

    print(
        f"EEG STREAM | "
        f"time={elapsed:6.2f}s | "
        f"samples={chunk.shape[1]}"
    )

    # Simulate real-time streaming
    time.sleep(0.5)

print("\nReplay complete.")