import time


def neural_intent_to_command(intent, confidence):
    """
    Convert decoded EEG intent into a standardized
    NeuroBridge command.
    """

    if confidence < 0.60:
        return {
            "command": "STOP",
            "confidence": confidence,
            "timestamp": time.time()
        }

    if intent == "LEFT":
        command = "MOVE_LEFT"

    elif intent == "RIGHT":
        command = "MOVE_RIGHT"

    else:
        command = "STOP"

    return {
        "command": command,
        "confidence": confidence,
        "timestamp": time.time()
    }


# Test the command layer
if __name__ == "__main__":

    examples = [
        ("LEFT", 0.87),
        ("RIGHT", 0.91),
        ("LEFT", 0.42)
    ]

    for intent, confidence in examples:

        result = neural_intent_to_command(
            intent,
            confidence
        )

        print(result)