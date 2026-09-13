"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type DecoderMessage = {
  intent: "LEFT" | "RIGHT" | string;
  command: string;
  confidence: number;
  timestamp: number;
  window: number;
  mode: "REPLAY" | string;
};

const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL || "ws://127.0.0.1:8000/ws";

const COMMANDS = ["MOVE_LEFT", "MOVE_RIGHT", "STOP"];

export default function Home() {
  const [status, setStatus] = useState<"OFFLINE" | "CONNECTING" | "CONNECTED">("OFFLINE");
  const [message, setMessage] = useState<DecoderMessage | null>(null);
  const [history, setHistory] = useState<DecoderMessage[]>([]);
  const [autoConnect, setAutoConnect] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);

  const confidence = message ? Math.round(message.confidence * 100) : 0;
  const command = message?.command || "WAITING";

  const objectTransform = useMemo(() => {
    if (command === "MOVE_LEFT") return "translateX(-42px) rotateY(-18deg)";
    if (command === "MOVE_RIGHT") return "translateX(42px) rotateY(18deg)";
    return "translateX(0) rotateY(0deg)";
  }, [command]);

  function connect() {
    if (socketRef.current?.readyState === WebSocket.OPEN) return;

    setStatus("CONNECTING");
    const ws = new WebSocket(WS_URL);
    socketRef.current = ws;

    ws.onopen = () => {
      setStatus("CONNECTED");
      setAutoConnect(true);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data) as DecoderMessage;
      setMessage(data);
      setHistory((prev) => [data, ...prev].slice(0, 8));
    };

    ws.onerror = () => setStatus("OFFLINE");

    ws.onclose = () => {
      setStatus("OFFLINE");
      setAutoConnect(false);
    };
  }

  function disconnect() {
    socketRef.current?.close();
    socketRef.current = null;
    setStatus("OFFLINE");
    setAutoConnect(false);
  }

  useEffect(() => () => socketRef.current?.close(), []);

  return (
    <main className="shell">
      <nav className="nav">
        <div className="brand">
          <span className="brandMark">N</span>
          <span>NEUROBRIDGE</span>
        </div>

        <div className="navRight">
          <span className={`statusPill ${status.toLowerCase()}`}>
            <span className="dot" />
            {status}
          </span>
          <button className="ghostBtn" onClick={status === "CONNECTED" ? disconnect : connect}>
            {status === "CONNECTED" ? "Disconnect" : "Launch Interface"}
          </button>
        </div>
      </nav>

      <section className="hero">
        <div className="eyebrow">EXPERIMENTAL NEURAL INTERFACE · REPLAY MODE</div>
        <h1>
          A software layer
          <br />
          between <em>human intent</em>
          <br />
          and machines.
        </h1>
        <p className="heroCopy">
          NeuroBridge explores how decoded physiological signals can become
          reusable commands for digital interfaces.
        </p>
        <div className="heroActions">
          <button className="primaryBtn" onClick={connect}>
            {status === "CONNECTED" ? "Interface Running" : "Start Neural Replay"}
            <span>↗</span>
          </button>
          <a href="#research" className="textLink">Explore research ↓</a>
        </div>
      </section>

      <section className="workspace" id="interface">
        <div className="sectionLabel">01 / LIVE INTERFACE</div>

        <div className="grid">
          <div className="panel decoderPanel">
            <div className="panelTop">
              <div>
                <span className="miniLabel">DECODER</span>
                <h2>{command.replaceAll("_", " ")}</h2>
              </div>
              <span className="modeBadge">{message?.mode || "REPLAY"}</span>
            </div>

            <div className="confidenceBlock">
              <div className="confidenceHeader">
                <span>DECODER CONFIDENCE</span>
                <strong>{confidence}%</strong>
              </div>
              <div className="confidenceTrack">
                <div style={{ width: `${confidence}%` }} />
              </div>
            </div>

            <div className="metricRow">
              <div>
                <span>INTENT</span>
                <strong>{message?.intent || "—"}</strong>
              </div>
              <div>
                <span>WINDOW</span>
                <strong>{message?.window ?? "—"}</strong>
              </div>
              <div>
                <span>STREAM</span>
                <strong>{autoConnect ? "LIVE" : "IDLE"}</strong>
              </div>
            </div>
          </div>

          <div className="panel scenePanel">
            <div className="sceneHeader">
              <span className="miniLabel">COMMAND ENVIRONMENT</span>
              <span className="sceneHint">NEURAL → COMMAND</span>
            </div>

            <div className="scene">
              <div className="floor" />
              <div
                className="robot"
                style={{ transform: objectTransform }}
              >
                <div className="robotHead" />
                <div className="robotBody">
                  <span className="robotEye" />
                  <span className="robotEye" />
                </div>
                <div className="robotArm left" />
                <div className="robotArm right" />
              </div>
              <div className="commandOrb">
                {message?.intent || "IDLE"}
              </div>
            </div>

            <div className="sceneFooter">
              <span>Input: EEG replay</span>
              <span>Output: {command}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="streamSection">
        <div className="sectionLabel">02 / COMMAND STREAM</div>
        <div className="streamPanel">
          <div className="streamHead">
            <span>WINDOW</span>
            <span>INTENT</span>
            <span>COMMAND</span>
            <span>CONFIDENCE</span>
          </div>
          {history.length === 0 ? (
            <div className="emptyStream">
              Start the replay to receive decoded commands from the backend.
            </div>
          ) : (
            history.map((item, index) => (
              <div className="streamRow" key={`${item.timestamp}-${index}`}>
                <span>#{item.window}</span>
                <strong>{item.intent}</strong>
                <span>{item.command}</span>
                <span>{Math.round(item.confidence * 100)}%</span>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="research" id="research">
        <div className="sectionLabel">03 / RESEARCH</div>
        <div className="researchGrid">
          <div>
            <h2>From signal decoding<br />to reusable intent.</h2>
          </div>
          <div className="researchCopy">
            <p>
              The current prototype uses public EEG motor-imagery data,
              signal preprocessing, CSP feature extraction and an SVM
              baseline decoder.
            </p>
            <div className="pipeline">
              {["EEG", "FILTER", "CSP", "SVM", "INTENT", "COMMAND"].map((x) => (
                <span key={x}>{x}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <footer>
        <span>NEUROBRIDGE</span>
        <span>Experimental software prototype · Not a medical device</span>
      </footer>
    </main>
  );
}