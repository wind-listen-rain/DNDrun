import { useEffect, useState } from "react";
import { api, type AbilityScores, type Character, type CharacterInput } from "../api";

const RACES = ["人类", "精灵", "半精灵", "矮人", "半身人", "侏儒", "半兽人", "龙裔", "提夫林"];
const CLASSES = [
  "战士",
  "法师",
  "牧师",
  "游荡者",
  "圣武士",
  "游侠",
  "野蛮人",
  "吟游诗人",
  "德鲁伊",
  "武僧",
  "术士",
  "邪术师",
];

const ABILITY_LABELS: Array<{ key: keyof AbilityScores; label: string }> = [
  { key: "str", label: "力量" },
  { key: "dex", label: "敏捷" },
  { key: "con", label: "体质" },
  { key: "int", label: "智力" },
  { key: "wis", label: "感知" },
  { key: "cha", label: "魅力" },
];

const EMPTY_FORM: CharacterInput = {
  name: "",
  race: RACES[0],
  className: CLASSES[0],
  level: 1,
  background: "",
  abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
  maxHp: 10,
  ac: 10,
  notes: "",
};

export function abilityMod(score: number): number {
  return Math.floor((score - 10) / 2);
}

export function formatMod(mod: number): string {
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

export function proficiencyBonus(level: number): number {
  return 2 + Math.floor((level - 1) / 4);
}

interface Props {
  sessionId: string;
  onError: (msg: string) => void;
}

export function CharacterManager({ sessionId, onError }: Props) {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [form, setForm] = useState<CharacterInput>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");

  const refresh = () => {
    api
      .listCharacters()
      .then(setCharacters)
      .catch((err: Error) => onError(err.message));
  };

  useEffect(refresh, []);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 3000);
    return () => clearTimeout(timer);
  }, [notice]);

  const setAbility = (key: keyof AbilityScores, value: number) => {
    setForm((f) => ({ ...f, abilities: { ...f.abilities, [key]: value } }));
  };

  const rollAbilities = async () => {
    try {
      const { scores } = await api.rollAbilities();
      setForm((f) => ({
        ...f,
        abilities: { str: scores[0], dex: scores[1], con: scores[2], int: scores[3], wis: scores[4], cha: scores[5] },
      }));
    } catch (err) {
      onError((err as Error).message);
    }
  };

  const submit = async () => {
    if (!form.name.trim()) {
      onError("角色名不能为空");
      return;
    }
    try {
      if (editingId) {
        await api.updateCharacter(editingId, form);
        setNotice("已保存修改");
      } else {
        await api.createCharacter(form);
        setNotice("角色已创建");
      }
      setForm(EMPTY_FORM);
      setEditingId(null);
      refresh();
    } catch (err) {
      onError((err as Error).message);
    }
  };

  const startEdit = (c: Character) => {
    setEditingId(c.id);
    setForm({
      name: c.name,
      race: c.race,
      className: c.className,
      level: c.level,
      background: c.background,
      abilities: { ...c.abilities },
      maxHp: c.maxHp,
      ac: c.ac,
      notes: c.notes,
    });
  };

  const remove = async (c: Character) => {
    if (!window.confirm(`确定删除角色「${c.name}」？`)) return;
    try {
      await api.deleteCharacter(c.id);
      if (editingId === c.id) {
        setEditingId(null);
        setForm(EMPTY_FORM);
      }
      refresh();
    } catch (err) {
      onError((err as Error).message);
    }
  };

  const joinCombat = async (c: Character) => {
    try {
      await api.addCombatant(sessionId, {
        name: c.name,
        hp: c.maxHp,
        isNPC: false,
        initiativeModifier: abilityMod(c.abilities.dex),
      });
      setNotice(`「${c.name}」已加入房间 ${sessionId} 的战斗（自动摇先攻）`);
    } catch (err) {
      onError((err as Error).message);
    }
  };

  return (
    <div className="character-page">
      {notice && <div className="notice-toast">{notice}</div>}

      <section className="panel">
        <h2>{editingId ? "✏️ 编辑角色" : "📜 创建角色"}</h2>

        <div className="char-form-grid">
          <label>
            角色名
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="必填" />
          </label>
          <label>
            种族
            <select value={form.race} onChange={(e) => setForm({ ...form, race: e.target.value })}>
              {RACES.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </label>
          <label>
            职业
            <select value={form.className} onChange={(e) => setForm({ ...form, className: e.target.value })}>
              {CLASSES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label>
            等级（熟练加值 {formatMod(proficiencyBonus(form.level))}）
            <input
              type="number"
              min={1}
              max={20}
              value={form.level}
              onChange={(e) => setForm({ ...form, level: Math.max(1, Math.min(20, Number(e.target.value) || 1)) })}
            />
          </label>
          <label>
            最大HP
            <input
              type="number"
              min={1}
              value={form.maxHp}
              onChange={(e) => setForm({ ...form, maxHp: Number(e.target.value) || 1 })}
            />
          </label>
          <label>
            护甲等级AC
            <input
              type="number"
              min={1}
              value={form.ac}
              onChange={(e) => setForm({ ...form, ac: Number(e.target.value) || 10 })}
            />
          </label>
          <label className="span-2">
            背景
            <input
              value={form.background}
              onChange={(e) => setForm({ ...form, background: e.target.value })}
              placeholder="如：侍僧、罪犯、士兵…"
            />
          </label>
        </div>

        <div className="ability-header">
          <span>属性值</span>
          <button onClick={rollAbilities}>🎲 4d6去最低摇一组</button>
        </div>
        <div className="ability-grid">
          {ABILITY_LABELS.map(({ key, label }) => (
            <label key={key} className="ability-box">
              <span className="ability-name">{label}</span>
              <input
                type="number"
                min={1}
                max={30}
                value={form.abilities[key]}
                onChange={(e) => setAbility(key, Math.max(1, Math.min(30, Number(e.target.value) || 10)))}
              />
              <span className="ability-mod">{formatMod(abilityMod(form.abilities[key]))}</span>
            </label>
          ))}
        </div>

        <label className="notes-label">
          备注（装备、法术、羁绊…）
          <textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </label>

        <div className="button-row form-actions">
          <button className="primary" onClick={submit}>
            {editingId ? "保存修改" : "创建角色"}
          </button>
          {editingId && (
            <button
              onClick={() => {
                setEditingId(null);
                setForm(EMPTY_FORM);
              }}
            >
              取消编辑
            </button>
          )}
        </div>
      </section>

      <section className="panel">
        <h2>🗂️ 角色列表（{characters.length}）</h2>
        <ul className="character-list">
          {characters.map((c) => (
            <li key={c.id} className="character-card">
              <div className="char-head">
                <strong>{c.name}</strong>
                <span className="char-sub">
                  {c.race} · {c.className} · {c.level}级
                  {c.background && ` · ${c.background}`}
                </span>
              </div>
              <div className="char-stats">
                <span>HP {c.maxHp}</span>
                <span>AC {c.ac}</span>
                <span>熟练 {formatMod(proficiencyBonus(c.level))}</span>
              </div>
              <div className="char-abilities">
                {ABILITY_LABELS.map(({ key, label }) => (
                  <span key={key}>
                    {label} {c.abilities[key]}（{formatMod(abilityMod(c.abilities[key]))}）
                  </span>
                ))}
              </div>
              {c.notes && <p className="char-notes">{c.notes}</p>}
              <div className="button-row">
                <button className="primary" onClick={() => joinCombat(c)}>
                  ⚔️ 加入战斗
                </button>
                <button onClick={() => startEdit(c)}>编辑</button>
                <button onClick={() => remove(c)}>删除</button>
              </div>
            </li>
          ))}
          {characters.length === 0 && <li className="empty-hint">还没有角色，用左侧表单创建一个吧</li>}
        </ul>
      </section>
    </div>
  );
}
