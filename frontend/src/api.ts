export const BACKEND_URL = "http://localhost:3001";

export interface Combatant {
  id: string;
  name: string;
  initiative: number;
  hp: number;
  maxHp: number;
  isNPC: boolean;
  conditions: string[];
}

export interface CombatState {
  combatants: Combatant[];
  round: number;
  turnIndex: number;
  isActive: boolean;
}

export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AbilityScores {
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
}

export interface Character {
  id: string;
  name: string;
  race: string;
  className: string;
  level: number;
  background: string;
  abilities: AbilityScores;
  maxHp: number;
  ac: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export type CharacterInput = Omit<Character, "id" | "createdAt" | "updatedAt">;

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BACKEND_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error ?? `请求失败: ${res.status}`);
  }
  return data as T;
}

export const api = {
  rollDice: (notation: string) =>
    request<{ notation: string; total: number; output: string }>("/api/dice/roll", {
      method: "POST",
      body: JSON.stringify({ notation }),
    }),

  rollAttack: (modifier: number, advantage: boolean, disadvantage: boolean) =>
    request<{ notation: string; rolls: number[]; total: number; isCrit: boolean; isFumble: boolean }>(
      "/api/dice/attack",
      { method: "POST", body: JSON.stringify({ modifier, advantage, disadvantage }) },
    ),

  rollDamage: (notation: string, isCrit: boolean) =>
    request<{ notation: string; total: number; output: string; isCrit: boolean }>("/api/dice/damage", {
      method: "POST",
      body: JSON.stringify({ notation, isCrit }),
    }),

  addCombatant: (
    sessionId: string,
    input: { name: string; hp: number; isNPC: boolean; initiative?: number; initiativeModifier?: number },
  ) =>
    request<CombatState>(`/api/combat/${sessionId}/combatants`, {
      method: "POST",
      body: JSON.stringify(input),
    }),

  removeCombatant: (sessionId: string, combatantId: string) =>
    request<CombatState>(`/api/combat/${sessionId}/combatants/${combatantId}`, { method: "DELETE" }),

  startCombat: (sessionId: string) =>
    request<CombatState>(`/api/combat/${sessionId}/start`, { method: "POST" }),

  nextTurn: (sessionId: string) => request<CombatState>(`/api/combat/${sessionId}/next`, { method: "POST" }),

  endCombat: (sessionId: string) => request<CombatState>(`/api/combat/${sessionId}/end`, { method: "POST" }),

  updateHp: (sessionId: string, combatantId: string, delta: number) =>
    request<CombatState>(`/api/combat/${sessionId}/combatants/${combatantId}/hp`, {
      method: "PATCH",
      body: JSON.stringify({ delta }),
    }),

  addCondition: (sessionId: string, combatantId: string, condition: string) =>
    request<CombatState>(`/api/combat/${sessionId}/combatants/${combatantId}/conditions`, {
      method: "POST",
      body: JSON.stringify({ condition }),
    }),

  removeCondition: (sessionId: string, combatantId: string, condition: string) =>
    request<CombatState>(
      `/api/combat/${sessionId}/combatants/${combatantId}/conditions/${encodeURIComponent(condition)}`,
      { method: "DELETE" },
    ),

  narrate: (messages: AIMessage[]) =>
    request<{ reply: string }>("/api/ai/narrate", {
      method: "POST",
      body: JSON.stringify({ messages }),
    }),

  listCharacters: () => request<Character[]>("/api/characters"),

  createCharacter: (input: CharacterInput) =>
    request<Character>("/api/characters", { method: "POST", body: JSON.stringify(input) }),

  updateCharacter: (id: string, input: Partial<CharacterInput>) =>
    request<Character>(`/api/characters/${id}`, { method: "PUT", body: JSON.stringify(input) }),

  deleteCharacter: async (id: string) => {
    const res = await fetch(`${BACKEND_URL}/api/characters/${id}`, { method: "DELETE" });
    if (!res.ok && res.status !== 204) throw new Error(`删除失败: ${res.status}`);
  },

  rollAbilities: () =>
    request<{ scores: number[] }>("/api/characters/roll-abilities", { method: "POST" }),
};
