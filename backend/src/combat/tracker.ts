import { randomUUID } from "node:crypto";

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

export interface AddCombatantInput {
  name: string;
  initiative: number;
  hp: number;
  isNPC: boolean;
}

function emptyState(): CombatState {
  return { combatants: [], round: 0, turnIndex: 0, isActive: false };
}

export class CombatTracker {
  private sessions = new Map<string, CombatState>();

  private getOrCreate(sessionId: string): CombatState {
    let state = this.sessions.get(sessionId);
    if (!state) {
      state = emptyState();
      this.sessions.set(sessionId, state);
    }
    return state;
  }

  getState(sessionId: string): CombatState {
    return this.getOrCreate(sessionId);
  }

  addCombatant(sessionId: string, input: AddCombatantInput): CombatState {
    const state = this.getOrCreate(sessionId);
    state.combatants.push({
      id: randomUUID(),
      name: input.name,
      initiative: input.initiative,
      hp: input.hp,
      maxHp: input.hp,
      isNPC: input.isNPC,
      conditions: [],
    });
    if (state.isActive) {
      state.combatants.sort((a, b) => b.initiative - a.initiative);
    }
    return state;
  }

  removeCombatant(sessionId: string, combatantId: string): CombatState {
    const state = this.getOrCreate(sessionId);
    const removedIndex = state.combatants.findIndex((c) => c.id === combatantId);
    if (removedIndex === -1) return state;
    state.combatants.splice(removedIndex, 1);
    if (state.isActive && removedIndex < state.turnIndex) {
      state.turnIndex -= 1;
    }
    return state;
  }

  startCombat(sessionId: string): CombatState {
    const state = this.getOrCreate(sessionId);
    state.combatants.sort((a, b) => b.initiative - a.initiative);
    state.round = 1;
    state.turnIndex = 0;
    state.isActive = true;
    return state;
  }

  nextTurn(sessionId: string): CombatState {
    const state = this.getOrCreate(sessionId);
    if (!state.isActive || state.combatants.length === 0) return state;
    state.turnIndex += 1;
    if (state.turnIndex >= state.combatants.length) {
      state.turnIndex = 0;
      state.round += 1;
    }
    return state;
  }

  endCombat(sessionId: string): CombatState {
    const state = this.getOrCreate(sessionId);
    state.isActive = false;
    state.round = 0;
    state.turnIndex = 0;
    return state;
  }

  updateHp(sessionId: string, combatantId: string, delta: number): CombatState {
    const state = this.getOrCreate(sessionId);
    const combatant = state.combatants.find((c) => c.id === combatantId);
    if (combatant) {
      combatant.hp = Math.max(0, Math.min(combatant.maxHp, combatant.hp + delta));
    }
    return state;
  }

  addCondition(sessionId: string, combatantId: string, condition: string): CombatState {
    const state = this.getOrCreate(sessionId);
    const combatant = state.combatants.find((c) => c.id === combatantId);
    if (combatant && !combatant.conditions.includes(condition)) {
      combatant.conditions.push(condition);
    }
    return state;
  }

  removeCondition(sessionId: string, combatantId: string, condition: string): CombatState {
    const state = this.getOrCreate(sessionId);
    const combatant = state.combatants.find((c) => c.id === combatantId);
    if (combatant) {
      combatant.conditions = combatant.conditions.filter((c) => c !== condition);
    }
    return state;
  }
}
