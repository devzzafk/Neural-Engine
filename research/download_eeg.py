import mne
from mne.datasets import eegbci

print("Downloading EEG motor imagery data...")

files = eegbci.load_data(
    subjects=[1],
    runs=[4, 8, 12]
)

print("\nDownloaded files:")
for file in files:
    print(file)
