import { DiceRoll } from "@dice-roller/rpg-dice-roller";

export interface AttackRollOptions {
  modifier: number;
  advantage?: boolean;
  disadvantage?: boolean;
}

export interface AttackRollResult {
  notation: string;
  rolls: number[];
  total: number;
  isCrit: boolean;
  isFumble: boolean;
}

export function rollNotation(notation: string) {
  const roll = new DiceRoll(notation);
  return { notation, total: roll.total, output: roll.output };
}

export function rollAttack({ modifier, advantage, disadvantage }: AttackRollOptions): AttackRollResult {
  const useKeep = advantage && !disadvantage ? "kh1" : !advantage && disadvantage ? "kl1" : "";
  const notation = useKeep ? `2d20${useKeep}+${modifier}` : `1d20+${modifier}`;
  const roll = new DiceRoll(notation);
  const rollGroup = roll.rolls[0] as { rolls: Array<{ value: number }> };
  const rolls = rollGroup.rolls.map((r) => r.value);

  return {
    notation,
    rolls,
    total: roll.total,
    isCrit: rolls.includes(20),
    isFumble: rolls.includes(1) && !rolls.includes(20),
  };
}

// D&D 暴击规则：翻倍骰子数量而非修饰值，例如 2d6+3 -> 4d6+3
function doubleDiceCount(notation: string): string {
  return notation.replace(/(\d+)d(\d+)/gi, (_match, count, sides) => `${Number(count) * 2}d${sides}`);
}

export function rollDamage(notation: string, isCrit = false) {
  const finalNotation = isCrit ? doubleDiceCount(notation) : notation;
  const roll = new DiceRoll(finalNotation);
  return { notation: finalNotation, total: roll.total, output: roll.output, isCrit };
}
