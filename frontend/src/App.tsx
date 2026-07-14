import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { BACKEND_URL, type CombatState } from "./api";
import { CombatTracker } from "./components/CombatTracker";
import { DicePanel } from "./components/DicePanel";
import { NarratorPanel } from "./components/NarratorPanel";
import "./App.css";

const EMPTY_STATE: CombatState = { combatants: [], round: 0, turnIndex: 0, isActive: false };

export default function App() {
  const [sessionId, setSessionId] = useState("default");
  const [combatState, setCombatState] = useState<CombatState>(EMPTY_STATE);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const socket = io(BACKEND_URL);
    socket.on("connect", () => {
      setConnected(true);
      socket.emit("join-session", sessionId);
    });
    socket.on("disconnect", () => setConnected(false));
    socket.on("combat-update", (state: CombatState) => setCombatState(state));
    return () => {
      socket.disconnect();
    };
  }, [sessionId]);

  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => setError(""), 5000);
    return () => clearTimeout(timer);
  }, [error]);

  return (
    <div className="app">
      <header>
        <h1>🐉 DNDrun · DM 助手</h1>
        <div className="session-bar">
          <label>
            房间号
            <input value={sessionId} onChange={(e) => setSessionId(e.target.value.trim() || "default")} />
          </label>
          <span className={`conn-dot ${connected ? "online" : "offline"}`}>{connected ? "已连接" : "未连接"}</span>
        </div>
      </header>

      {error && <div className="error-toast">{error}</div>}

      <main>
        <CombatTracker sessionId={sessionId} state={combatState} onError={setError} />
        <div className="side-column">
          <DicePanel onError={setError} />
          <NarratorPanel onError={setError} />
        </div>
      </main>
    </div>
  );
}
