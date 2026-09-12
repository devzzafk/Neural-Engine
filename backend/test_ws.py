import websocket
import json

print("Connecting to NeuroBridge...")

ws = websocket.create_connection(
    "ws://127.0.0.1:8000/ws"
)

print("Connected!\n")

try:
    while True:

        message = ws.recv()

        data = json.loads(message)

        print(
            f"INTENT: {data['intent']} | "
            f"COMMAND: {data['command']} | "
            f"CONFIDENCE: {data['confidence'] * 100:.2f}% | "
            f"WINDOW: {data['window']} | "
            f"MODE: {data['mode']}"
        )

except KeyboardInterrupt:

    print("\nDisconnected.")

    ws.close()