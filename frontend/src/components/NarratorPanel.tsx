import { useRef, useState } from "react";
import { api, type AIMessage } from "../api";

const SYSTEM_PROMPT =
  "你是一名龙与地下城(D&D 5e)跑团的DM助手。根据DM的要求，用简洁生动的中文生成场景描述、NPC对话或剧情建议。回答保持在200字以内，方便DM直接念给玩家听。";

export function NarratorPanel({ onError }: { onError: (msg: string) => void }) {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const send = async () => {
    const content = input.trim();
    if (!content || loading) return;
    const nextMessages: AIMessage[] = [...messages, { role: "user", content }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    try {
      const { reply } = await api.narrate([{ role: "system", content: SYSTEM_PROMPT }, ...nextMessages]);
      setMessages([...nextMessages, { role: "assistant", content: reply }]);
      queueMicrotask(() => listRef.current?.scrollTo({ top: listRef.current.scrollHeight }));
    } catch (err) {
      onError((err as Error).message);
      setMessages(messages);
      setInput(content);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="panel narrator">
      <h2>📖 AI 叙事助手</h2>
      <div className="chat-list" ref={listRef}>
        {messages.map((m, i) => (
          <div key={i} className={`chat-msg ${m.role}`}>
            <span className="chat-role">{m.role === "user" ? "DM" : "助手"}</span>
            <p>{m.content}</p>
          </div>
        ))}
        {messages.length === 0 && (
          <p className="empty-hint">
            例如：「玩家们推开了古墓的石门，描述里面的场景」「酒馆老板娘听到赏金猎人的名字后是什么反应？」
          </p>
        )}
        {loading && <p className="empty-hint">助手正在编写……</p>}
      </div>
      <div className="chat-input-row">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="向AI描述你需要的场景/NPC对话…（Enter发送）"
          rows={2}
        />
        <button className="primary" onClick={send} disabled={loading}>
          发送
        </button>
      </div>
    </section>
  );
}
