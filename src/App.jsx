import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

/* =========================
   3D ROBOT / BOX
========================= */

function Robot({ position, command }) {
  const meshRef = useRef();

  useFrame(() => {
    if (!meshRef.current) return;

    // Small visual rotation while moving
    if (command !== "STOP") {
      meshRef.current.rotation.y += 0.01;
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <boxGeometry args={[1.5, 1, 1.5]} />
      <meshStandardMaterial color="#00e5ff" />
    </mesh>
  );
}

/* =========================
   MAIN APP
========================= */

function App() {
  const [position, setPosition] = useState([0, 0, 0]);

  const [command, setCommand] = useState("STOP");
  const [intent, setIntent] = useState("NONE");
  const [confidence, setConfidence] = useState(0);
  const [latency, setLatency] = useState(0);

  const [connection, setConnection] = useState("DISCONNECTED");
  const [replayMode, setReplayMode] = useState(true);

  const [history, setHistory] = useState([]);

  /* =========================
     COMMAND HANDLER
  ========================= */

  const handleCommand = (data) => {
    if (!data) return;

    const newCommand = data.command || "STOP";
    const newIntent = data.intent || "NONE";
    const newConfidence = data.confidence || 0;

    setCommand(newCommand);
    setIntent(newIntent);
    setConfidence(Math.round(newConfidence * 100));

    if (data.timestamp) {
      const currentTime = Date.now();
      const backendTime = data.timestamp * 1000;

      setLatency(Math.max(0, currentTime - backendTime));
    }

    /* =========================
       MOVE 3D OBJECT
    ========================= */

    setPosition((current) => {
      let [x, y, z] = current;

      const step = 0.5;

      switch (newCommand) {
        case "MOVE_LEFT":
          x -= step;
          break;

        case "MOVE_RIGHT":
          x += step;
          break;

        case "MOVE_FORWARD":
          z -= step;
          break;

        case "MOVE_BACKWARD":
          z += step;
          break;

        case "STOP":
        default:
          break;
      }

      return [x, y, z];
    });

    /* =========================
       COMMAND HISTORY
    ========================= */

    setHistory((oldHistory) => {
      const newEntry = {
        command: newCommand,
        confidence: Math.round(newConfidence * 100),
        time: new Date().toLocaleTimeString(),
      };

      return [newEntry, ...oldHistory].slice(0, 8);
    });
  };

  /* =========================
     WEBSOCKET CONNECTION
  ========================= */

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8000/ws");

    ws.onopen = () => {
      console.log("Connected to EEG backend");
      setConnection("CONNECTED");
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        console.log("Backend command:", data);

        setReplayMode(false);

        handleCommand(data);
      } catch (error) {
        console.error("Invalid backend data:", error);
      }
    };

    ws.onerror = () => {
      console.log("WebSocket error");
      setConnection("ERROR");
    };

    ws.onclose = () => {
      console.log("Backend disconnected");
      setConnection("DISCONNECTED");
    };

    return () => {
      ws.close();
    };
  }, []);

  /* =========================
     TEST MODE
     Keyboard controls
  ========================= */

  useEffect(() => {
    const handleKeyboard = (event) => {
      switch (event.key.toLowerCase()) {
        case "a":
          setReplayMode(true);

          handleCommand({
            intent: "LEFT",
            command: "MOVE_LEFT",
            confidence: 0.95,
            timestamp: Date.now() / 1000,
          });
          break;

        case "d":
          setReplayMode(true);

          handleCommand({
            intent: "RIGHT",
            command: "MOVE_RIGHT",
            confidence: 0.95,
            timestamp: Date.now() / 1000,
          });
          break;

        case "w":
          setReplayMode(true);

          handleCommand({
            intent: "FORWARD",
            command: "MOVE_FORWARD",
            confidence: 0.95,
            timestamp: Date.now() / 1000,
          });
          break;

        case "s":
          setReplayMode(true);

          handleCommand({
            intent: "BACKWARD",
            command: "MOVE_BACKWARD",
            confidence: 0.95,
            timestamp: Date.now() / 1000,
          });
          break;

        case " ":
          event.preventDefault();

          setReplayMode(true);

          handleCommand({
            intent: "NONE",
            command: "STOP",
            confidence: 1,
            timestamp: Date.now() / 1000,
          });
          break;

        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyboard);

    return () => {
      window.removeEventListener("keydown", handleKeyboard);
    };
  }, []);

  /* =========================
     BUTTON CONTROLS
  ========================= */

  const testCommand = (commandName, intentName) => {
    setReplayMode(true);

    handleCommand({
      intent: intentName,
      command: commandName,
      confidence: 0.95,
      timestamp: Date.now() / 1000,
    });
  };

  /* =========================
     UI
  ========================= */

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: "#05070d",
        color: "white",
        fontFamily: "Arial, sans-serif",
        overflow: "hidden",
      }}
    >
      {/* HEADER */}

      <div
        style={{
          height: "80px",
          padding: "15px 30px",
          boxSizing: "border-box",
          borderBottom: "1px solid #222",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              color: "#00e5ff",
              letterSpacing: "3px",
            }}
          >
            NEUROCOMMAND
          </h1>

          <p
            style={{
              margin: "5px 0 0",
              color: "#888",
            }}
          >
            Motor-Imagery EEG → Neural Intent → 3D Control
          </p>
        </div>

        <div style={{ display: "flex", gap: "15px" }}>
          <StatusBadge
            text={replayMode ? "REPLAY MODE" : "LIVE EEG"}
            active={replayMode}
          />

          <StatusBadge
            text={`SIGNAL: ${connection}`}
            active={connection === "CONNECTED"}
          />
        </div>
      </div>

      {/* MAIN DASHBOARD */}

      <div
        style={{
          height: "calc(100vh - 80px)",
          display: "grid",
          gridTemplateColumns: "1fr 2fr",
          gap: "15px",
          padding: "15px",
          boxSizing: "border-box",
        }}
      >
        {/* LEFT PANEL */}

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "15px",
          }}
        >
          {/* CAMERA */}

          <Panel title="COMPUTER VISION">
            <div
              style={{
                height: "180px",
                background: "#090d16",
                border: "1px solid #1b2735",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#555",
              }}
            >
              CAMERA FEED
              <br />
              CV MODULE
            </div>

            <p style={{ color: "#777", fontSize: "13px" }}>
              Camera / body-motion information can be displayed here when the
              CV module is connected.
            </p>
          </Panel>

          {/* EEG */}

          <Panel title="EEG SIGNAL">
            <div
              style={{
                height: "130px",
                background: "#090d16",
                border: "1px solid #1b2735",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: "90%",
                  height: "2px",
                  background: "#00e5ff",
                  boxShadow: "0 0 10px #00e5ff",
                }}
              />
            </div>

            <p style={{ color: "#777", fontSize: "13px" }}>
              Motor-imagery EEG visualization
            </p>
          </Panel>

          {/* TEST CONTROLS */}

          <Panel title="DEVELOPER TEST MODE">
            <p
              style={{
                color: "#777",
                fontSize: "12px",
              }}
            >
              Temporary controls until the EEG backend is connected.
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "8px",
              }}
            >
              <TestButton
                text="← LEFT"
                onClick={() => testCommand("MOVE_LEFT", "LEFT")}
              />

              <TestButton
                text="RIGHT →"
                onClick={() => testCommand("MOVE_RIGHT", "RIGHT")}
              />

              <TestButton
                text="↑ FORWARD"
                onClick={() => testCommand("MOVE_FORWARD", "FORWARD")}
              />

              <TestButton
                text="↓ BACKWARD"
                onClick={() => testCommand("MOVE_BACKWARD", "BACKWARD")}
              />

              <TestButton
                text="STOP"
                onClick={() => testCommand("STOP", "NONE")}
              />
            </div>

            <p
              style={{
                fontSize: "11px",
                color: "#555",
                marginTop: "10px",
              }}
            >
              Keyboard: A / D / W / S / SPACE
            </p>
          </Panel>
        </div>

        {/* RIGHT SIDE */}

        <div
          style={{
            display: "grid",
            gridTemplateRows: "2fr 1fr",
            gap: "15px",
          }}
        >
          {/* 3D SIMULATION */}

          <Panel title="3D NEURAL CONTROL SIMULATION">
  <div
    style={{
      width: "100%",
      height: "450px",
      background: "#050912",
      borderRadius: "6px",
      overflow: "hidden",
    }}
  >
    <Canvas
      camera={{
        position: [0, 2, 7],
        fov: 50,
      }}
    >
      <color attach="background" args={["#050912"]} />

      <ambientLight intensity={2} />

      <directionalLight
        position={[5, 5, 5]}
        intensity={3}
      />

      <gridHelper
        args={[20, 20]}
        position={[0, -1, 0]}
      />

      <Robot
        position={position}
        command={command}
      />

      <OrbitControls />
    </Canvas>
  </div>
</Panel>

          {/* COMMAND PANEL */}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "15px",
            }}
          >
            {/* CURRENT COMMAND */}

            <Panel title="NEURAL COMMAND">
              <div
                style={{
                  fontSize: "28px",
                  color: "#00e5ff",
                  fontWeight: "bold",
                  marginBottom: "10px",
                }}
              >
                {command}
              </div>

              <div style={{ color: "#aaa" }}>
                Intent:{" "}
                <strong style={{ color: "white" }}>
                  {intent}
                </strong>
              </div>

              <div style={{ color: "#aaa", marginTop: "8px" }}>
                Confidence:{" "}
                <strong style={{ color: "white" }}>
                  {confidence}%
                </strong>
              </div>

              <div style={{ color: "#aaa", marginTop: "8px" }}>
                Latency:{" "}
                <strong style={{ color: "white" }}>
                  {latency} ms
                </strong>
              </div>
            </Panel>

            {/* HISTORY */}

            <Panel title="COMMAND HISTORY">
              <div
                style={{
                  maxHeight: "150px",
                  overflowY: "auto",
                }}
              >
                {history.length === 0 ? (
                  <p style={{ color: "#555" }}>
                    No commands yet.
                  </p>
                ) : (
                  history.map((item, index) => (
                    <div
                      key={index}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "6px 0",
                        borderBottom: "1px solid #18202b",
                        fontSize: "12px",
                      }}
                    >
                      <span>{item.command}</span>

                      <span style={{ color: "#777" }}>
                        {item.confidence}%
                      </span>
                    </div>
                  ))
                )}
              </div>
            </Panel>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================
   SMALL COMPONENTS
========================= */

function Panel({ title, children }) {
  return (
    <div
      style={{
        background: "#0b1019",
        border: "1px solid #1b2735",
        borderRadius: "8px",
        padding: "15px",
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      <h3
        style={{
          margin: "0 0 12px",
          fontSize: "13px",
          letterSpacing: "2px",
          color: "#888",
        }}
      >
        {title}
      </h3>

      {children}
    </div>
  );
}

function StatusBadge({ text, active }) {
  return (
    <div
      style={{
        padding: "8px 12px",
        border: "1px solid #263445",
        borderRadius: "20px",
        fontSize: "11px",
        color: active ? "#00e5ff" : "#777",
      }}
    >
      ● {text}
    </div>
  );
}

function TestButton({ text, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: "#111923",
        color: "#00e5ff",
        border: "1px solid #263445",
        padding: "8px",
        borderRadius: "5px",
        cursor: "pointer",
      }}
    >
      {text}
    </button>
  );
}

export default App;