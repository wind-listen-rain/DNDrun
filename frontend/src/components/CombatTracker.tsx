import { useState } from "react";
import { api, type CombatState } from "../api";

const COMMON_CONDITIONS = ["中毒", "倒地", "束缚", "目盲", "恐慌", "昏迷", "麻痹", "专注"];

interface Props {
  sessionId: string;
  state: CombatState;
  onError: (msg: string) => void;
}

export function CombatTracker({ sessionId, state, onError }: Props) {
  const [name, setName] = useState("");
  const [hp, setHp] = useState("10");
  const [isNPC, setIsNPC] = useState(false);
  const [initiative, setInitiative] = useState("");
  const [initiativeModifier, setInitiativeModifier] = useState("0");

  const run = (fn: () => Promise<unknown>) => {
    fn().catch((err: Error) => onError(err.message));
  };

  const handleAdd = () => {
    if (!name.trim()) return;
    run(() =>
      api.addCombatant(sessionId, {
        name: name.trim(),
        hp: Number(hp) || 1,
        isNPC,
        initiative: initiative === "" ? undefined : Number(initiative),
        initiativeModifier: initiative === "" ? Number(initiativeModifier) || 0 : undefined,
      }),
    );
    setName("");
    setInitiative("");
  };

  return (
    <section className="panel">
      <h2>⚔️ 先攻追踪</h2>

      <div className="combat-status">
        {state.isActive ? (
          <span className="badge badge-active">第 {state.round} 轮 · 战斗中</span>
        ) : (
          <span className="badge">未开始</span>
        )}
        <div className="button-row">
          {!state.isActive ? (
            <button
              className="primary"
              disabled={state.combatants.length === 0}
              onClick={() => run(() => api.startCombat(sessionId))}
            >
              开始战斗
            </button>
          ) : (
            <>
              <button className="primary" onClick={() => run(() => api.nextTurn(sessionId))}>
                下一个 ▶
              </button>
              <button onClick={() => run(() => api.endCombat(sessionId))}>结束战斗</button>
            </>
          )}
        </div>
      </div>

      <ul className="combatant-list">
        {state.combatants.map((c, i) => (
          <li
            key={c.id}
            className={`combatant ${state.isActive && i === state.turnIndex ? "current-turn" : ""} ${c.hp === 0 ? "downed" : ""}`}
          >
            <div className="combatant-main">
              <span className="init">{c.initiative}</span>
              <span className="cname">
                {c.name} {c.isNPC && <em className="npc-tag">NPC</em>}
              </span>
              <span className="hp">
                <button className="hp-btn" onClick={() => run(() => api.updateHp(sessionId, c.id, -1))}>
                  −
                </button>
                {c.hp}/{c.maxHp}
                <button className="hp-btn" onClick={() => run(() => api.updateHp(sessionId, c.id, 1))}>
                  ＋
                </button>
              </span>
              <button className="remove-btn" title="移除" onClick={() => run(() => api.removeCombatant(sessionId, c.id))}>
                ✕
              </button>
            </div>
            <div className="conditions">
              {c.conditions.map((cond) => (
                <span
                  key={cond}
                  className="condition-tag"
                  title="点击移除"
                  onClick={() => run(() => api.removeCondition(sessionId, c.id, cond))}
                >
                  {cond} ✕
                </span>
              ))}
              <select
                value=""
                onChange={(e) => {
                  if (e.target.value) run(() => api.addCondition(sessionId, c.id, e.target.value));
                }}
              >
                <option value="">+状态</option>
                {COMMON_CONDITIONS.filter((cond) => !c.conditions.includes(cond)).map((cond) => (
                  <option key={cond} value={cond}>
                    {cond}
                  </option>
                ))}
              </select>
            </div>
          </li>
        ))}
        {state.combatants.length === 0 && <li className="empty-hint">还没有战斗员，在下方添加</li>}
      </ul>

      <div className="add-form">
        <input placeholder="名字" value={name} onChange={(e) => setName(e.target.value)} />
        <input type="number" placeholder="HP" value={hp} onChange={(e) => setHp(e.target.value)} style={{ width: "4.5em" }} />
        <input
          type="number"
          placeholder="先攻(留空自动摇)"
          value={initiative}
          onChange={(e) => setInitiative(e.target.value)}
          style={{ width: "9em" }}
        />
        {initiative === "" && (
          <input
            type="number"
            placeholder="先攻调整值"
            value={initiativeModifier}
            onChange={(e) => setInitiativeModifier(e.target.value)}
            style={{ width: "6em" }}
            title="留空先攻时，自动 1d20+调整值"
          />
        )}
        <label className="npc-check">
          <input type="checkbox" checked={isNPC} onChange={(e) => setIsNPC(e.target.checked)} /> NPC
        </label>
        <button className="primary" onClick={handleAdd}>
          添加
        </button>
      </div>
    </section>
  );
}
