import mne
from mne.datasets import eegbci

# MNE needs a parent directory here
DATA_PATH = r"C:\Users\HP 0186TU\OneDrive\Desktop"

mne.set_config("MNE_DATA", DATA_PATH)

print("Downloading EEG motor imagery data...")

files = eegbci.load_data(
    subjects=[1],
    runs=[4, 8, 12]
)

print("\nDownloaded files:")
for file in files:
    print(file)
