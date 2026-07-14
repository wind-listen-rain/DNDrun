import { Router } from "express";
import { DiceRoll } from "@dice-roller/rpg-dice-roller";
import type { CharacterStore, CharacterInput } from "./store.js";

const ABILITY_KEYS = ["str", "dex", "con", "int", "wis", "cha"] as const;

function validate(body: Partial<CharacterInput>, requireAll: boolean): string | null {
  if (requireAll && !body.name?.trim()) return "角色名不能为空";
  if (body.level !== undefined && (body.level < 1 || body.level > 20)) return "等级需在1-20之间";
  if (body.abilities) {
    for (const key of ABILITY_KEYS) {
      const value = body.abilities[key];
      if (value !== undefined && (value < 1 || value > 30)) return `属性 ${key} 需在1-30之间`;
    }
  }
  return null;
}

export function createCharacterRouter(store: CharacterStore): Router {
  const router = Router();

  // 4d6 去掉最低，摇一组六项属性
  router.post("/roll-abilities", (_req, res) => {
    const scores = ABILITY_KEYS.map(() => new DiceRoll("4d6kh3").total);
    res.json({ scores });
  });

  router.get("/", (_req, res) => {
    res.json(store.list());
  });

  router.get("/:id", (req, res) => {
    const character = store.get(req.params.id);
    if (!character) return res.status(404).json({ error: "角色不存在" });
    res.json(character);
  });

  router.post("/", (req, res) => {
    const body = req.body as CharacterInput;
    const error = validate(body, true);
    if (error) return res.status(400).json({ error });
    const character = store.create({
      name: body.name.trim(),
      race: body.race ?? "",
      className: body.className ?? "",
      level: body.level ?? 1,
      background: body.background ?? "",
      abilities: {
        str: body.abilities?.str ?? 10,
        dex: body.abilities?.dex ?? 10,
        con: body.abilities?.con ?? 10,
        int: body.abilities?.int ?? 10,
        wis: body.abilities?.wis ?? 10,
        cha: body.abilities?.cha ?? 10,
      },
      maxHp: body.maxHp ?? 10,
      ac: body.ac ?? 10,
      notes: body.notes ?? "",
    });
    res.status(201).json(character);
  });

  router.put("/:id", (req, res) => {
    const body = req.body as Partial<CharacterInput>;
    const error = validate(body, false);
    if (error) return res.status(400).json({ error });
    const character = store.update(req.params.id, body);
    if (!character) return res.status(404).json({ error: "角色不存在" });
    res.json(character);
  });

  router.delete("/:id", (req, res) => {
    if (!store.delete(req.params.id)) return res.status(404).json({ error: "角色不存在" });
    res.status(204).end();
  });

  return router;
}
