import { randomUUID } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname } from "node:path";

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

export class CharacterStore {
  private characters = new Map<string, Character>();

  constructor(private filePath: string) {
    this.load();
  }

  private load() {
    if (!existsSync(this.filePath)) return;
    try {
      const raw = JSON.parse(readFileSync(this.filePath, "utf-8")) as Character[];
      for (const c of raw) {
        this.characters.set(c.id, c);
      }
    } catch (err) {
      console.error(`角色卡存档读取失败(${this.filePath})，将从空档开始:`, err);
    }
  }

  private save() {
    mkdirSync(dirname(this.filePath), { recursive: true });
    writeFileSync(this.filePath, JSON.stringify(this.list(), null, 2), "utf-8");
  }

  list(): Character[] {
    return [...this.characters.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  get(id: string): Character | undefined {
    return this.characters.get(id);
  }

  create(input: CharacterInput): Character {
    const now = new Date().toISOString();
    const character: Character = { ...input, id: randomUUID(), createdAt: now, updatedAt: now };
    this.characters.set(character.id, character);
    this.save();
    return character;
  }

  update(id: string, input: Partial<CharacterInput>): Character | undefined {
    const existing = this.characters.get(id);
    if (!existing) return undefined;
    const updated: Character = {
      ...existing,
      ...input,
      abilities: { ...existing.abilities, ...input.abilities },
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
    };
    this.characters.set(id, updated);
    this.save();
    return updated;
  }

  delete(id: string): boolean {
    const deleted = this.characters.delete(id);
    if (deleted) this.save();
    return deleted;
  }
}
