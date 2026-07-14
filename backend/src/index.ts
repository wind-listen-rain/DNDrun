import express from "express";
import cors from "cors";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { rollAttack, rollDamage, rollNotation } from "./dice.js";
import { createAIProvider, type AIMessage } from "./ai/index.js";
import { CombatTracker } from "./combat/tracker.js";
import { createCombatRouter } from "./combat/routes.js";

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: "*" } });
const combatTracker = new CombatTracker();

app.use("/api/combat", createCombatRouter(io, combatTracker));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.post("/api/ai/narrate", async (req, res) => {
  const { messages } = req.body as { messages: AIMessage[] };
  try {
    const reply = await createAIProvider().chat(messages);
    res.json({ reply });
  } catch (err) {
    res.status(502).json({ error: (err as Error).message });
  }
});

app.post("/api/dice/roll", (req, res) => {
  const { notation } = req.body as { notation: string };
  res.json(rollNotation(notation));
});

app.post("/api/dice/attack", (req, res) => {
  const { modifier, advantage, disadvantage } = req.body as {
    modifier: number;
    advantage?: boolean;
    disadvantage?: boolean;
  };
  res.json(rollAttack({ modifier, advantage, disadvantage }));
});

app.post("/api/dice/damage", (req, res) => {
  const { notation, isCrit } = req.body as { notation: string; isCrit?: boolean };
  res.json(rollDamage(notation, isCrit));
});

io.on("connection", (socket) => {
  socket.on("join-session", (sessionId: string) => {
    socket.join(sessionId);
    socket.emit("combat-update", combatTracker.getState(sessionId));
  });
});

const PORT = process.env.PORT ?? 3001;
httpServer.listen(PORT, () => {
  console.log(`DM 助手后端已启动: http://localhost:${PORT}`);
});
