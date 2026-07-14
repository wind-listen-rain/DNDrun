import { Router } from "express";
import type { Server } from "socket.io";
import { CombatTracker } from "./tracker.js";
import { rollNotation } from "../dice.js";

export function createCombatRouter(io: Server, tracker: CombatTracker): Router {
  const router = Router();

  function broadcast(sessionId: string) {
    io.to(sessionId).emit("combat-update", tracker.getState(sessionId));
  }

  router.get("/:sessionId", (req, res) => {
    res.json(tracker.getState(req.params.sessionId));
  });

  router.post("/:sessionId/combatants", (req, res) => {
    const { sessionId } = req.params;
    const { name, hp, isNPC, initiative, initiativeModifier } = req.body as {
      name: string;
      hp: number;
      isNPC?: boolean;
      initiative?: number;
      initiativeModifier?: number;
    };
    const rolledInitiative = initiative ?? rollNotation(`1d20+${initiativeModifier ?? 0}`).total;
    const state = tracker.addCombatant(sessionId, {
      name,
      hp,
      isNPC: isNPC ?? false,
      initiative: rolledInitiative,
    });
    broadcast(sessionId);
    res.status(201).json(state);
  });

  router.delete("/:sessionId/combatants/:combatantId", (req, res) => {
    const { sessionId, combatantId } = req.params;
    const state = tracker.removeCombatant(sessionId, combatantId);
    broadcast(sessionId);
    res.json(state);
  });

  router.post("/:sessionId/start", (req, res) => {
    const { sessionId } = req.params;
    const state = tracker.startCombat(sessionId);
    broadcast(sessionId);
    res.json(state);
  });

  router.post("/:sessionId/next", (req, res) => {
    const { sessionId } = req.params;
    const state = tracker.nextTurn(sessionId);
    broadcast(sessionId);
    res.json(state);
  });

  router.post("/:sessionId/end", (req, res) => {
    const { sessionId } = req.params;
    const state = tracker.endCombat(sessionId);
    broadcast(sessionId);
    res.json(state);
  });

  router.patch("/:sessionId/combatants/:combatantId/hp", (req, res) => {
    const { sessionId, combatantId } = req.params;
    const { delta } = req.body as { delta: number };
    const state = tracker.updateHp(sessionId, combatantId, delta);
    broadcast(sessionId);
    res.json(state);
  });

  router.post("/:sessionId/combatants/:combatantId/conditions", (req, res) => {
    const { sessionId, combatantId } = req.params;
    const { condition } = req.body as { condition: string };
    const state = tracker.addCondition(sessionId, combatantId, condition);
    broadcast(sessionId);
    res.json(state);
  });

  router.delete("/:sessionId/combatants/:combatantId/conditions/:condition", (req, res) => {
    const { sessionId, combatantId, condition } = req.params;
    const state = tracker.removeCondition(sessionId, combatantId, condition);
    broadcast(sessionId);
    res.json(state);
  });

  return router;
}
