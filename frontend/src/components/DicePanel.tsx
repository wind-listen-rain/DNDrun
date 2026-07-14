import { useState } from "react";
import { api } from "../api";

interface RollLog {
  id: number;
  label: string;
  detail: string;
  highlight?: "crit" | "fumble";
}

let logId = 0;

export function DicePanel({ onError }: { onError: (msg: string) => void }) {
  const [notation, setNotation] = useState("2d6+3");
  const [modifier, setModifier] = useState("5");
  const [advantage, setAdvantage] = useState(false);
  const [disadvantage, setDisadvantage] = useState(false);
  const [damageNotation, setDamageNotation] = useState("1d8+3");
  const [lastWasCrit, setLastWasCrit] = useState(false);
  const [logs, setLogs] = useState<RollLog[]>([]);

  const addLog = (log: Omit<RollLog, "id">) => {
    setLogs((prev) => [{ ...log, id: ++logId }, ...prev].slice(0, 30));
  };

  const rollFree = async () => {
    try {
      const r = await api.rollDice(notation);
      addLog({ label: `🎲 ${r.notation}`, detail: r.output });
    } catch (err) {
      onError((err as Error).message);
    }
  };

  const rollAttack = async () => {
    try {
      const r = await api.rollAttack(Number(modifier) || 0, advantage, disadvantage);
      setLastWasCrit(r.isCrit);
      addLog({
        label: `⚔️ 攻击 ${r.notation}`,
        detail: `骰出 [${r.rolls.join(", ")}] → 共 ${r.total}${r.isCrit ? "　💥 暴击!" : ""}${r.isFumble ? "　💀 大失败!" : ""}`,
        highlight: r.isCrit ? "crit" : r.isFumble ? "fumble" : undefined,
      });
    } catch (err) {
      onError((err as Error).message);
    }
  };

  const rollDamage = async () => {
    try {
      const r = await api.rollDamage(damageNotation, lastWasCrit);
      addLog({
        label: `🩸 伤害 ${r.notation}${r.isCrit ? "（暴击翻倍）" : ""}`,
        detail: r.output,
        highlight: r.isCrit ? "crit" : undefined,
      });
      setLastWasCrit(false);
    } catch (err) {
      onError((err as Error).message);
    }
  };

  return (
    <section className="panel">
      <h2>🎲 骰子</h2>

      <div className="dice-row">
        <input value={notation} onChange={(e) => setNotation(e.target.value)} placeholder="如 2d6+3" />
        <button className="primary" onClick={rollFree}>
          摇！
        </button>
      </div>

      <div className="dice-row attack-row">
        <span className="row-label">攻击检定</span>
        <span className="mod-input">
          调整值
          <input type="number" value={modifier} onChange={(e) => setModifier(e.target.value)} style={{ width: "3.5em" }} />
        </span>
        <label>
          <input
            type="checkbox"
            checked={advantage}
            onChange={(e) => {
              setAdvantage(e.target.checked);
              if (e.target.checked) setDisadvantage(false);
            }}
          />
          优势
        </label>
        <label>
          <input
            type="checkbox"
            checked={disadvantage}
            onChange={(e) => {
              setDisadvantage(e.target.checked);
              if (e.target.checked) setAdvantage(false);
            }}
          />
          劣势
        </label>
        <button className="primary" onClick={rollAttack}>
          攻击
        </button>
      </div>

      <div className="dice-row">
        <span className="row-label">伤害</span>
        <input value={damageNotation} onChange={(e) => setDamageNotation(e.target.value)} placeholder="如 1d8+3" />
        <button className="primary" onClick={rollDamage}>
          {lastWasCrit ? "伤害（暴击💥）" : "伤害"}
        </button>
      </div>

      <ul className="roll-log">
        {logs.map((log) => (
          <li key={log.id} className={log.highlight ?? ""}>
            <strong>{log.label}</strong>
            <span>{log.detail}</span>
          </li>
        ))}
        {logs.length === 0 && <li className="empty-hint">投掷记录会显示在这里</li>}
      </ul>
    </section>
  );
}
