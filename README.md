# DM 助手

D&D 跑团 DM 实时助手：cue 流程、摇骰子与伤害计算、角色卡创建管理、AI 辅助叙事。

## 项目结构

- `frontend/` — React + TypeScript (Vite)
- `backend/` — Node.js + TypeScript (Express + Socket.io)

## 技术选型

- 骰子引擎：基于 [`@dice-roller/rpg-dice-roller`](https://github.com/dice-roller/rpg-dice-roller) 封装 D&D 规则层（优势/劣势、暴击、豁免）
- 规则数据：接入 [open5e](https://open5e.com/) / [5e-srd-api](https://github.com/5e-bits/5e-srd-api) 获取种族/职业/法术/怪物数据
- 实时同步：Socket.io，DM 端与玩家端共享先攻/回合状态
- AI 辅助叙事：`backend/src/ai/` 下做了 Provider 抽象（`AIProvider` 接口），默认接入 DeepSeek（OpenAI 兼容接口，价格远低于 Claude），后续可扩展其他模型

## 开发阶段

1. ✅ 骰子引擎与伤害计算
2. ✅ 角色卡创建与管理（种族/职业/属性/HP/AC，4d6 去最低摇属性，JSON 文件持久化，一键加入战斗，见 `backend/src/characters/` 与前端「角色卡」页）
3. ✅ 流程 cue 系统（先攻追踪、回合/回合数推进、血量与状态标记，Socket.io 实时同步，见 `backend/src/combat/`）
4. 🟡 AI 辅助叙事 / NPC 对话（接口与 DeepSeek 已接入，待真实调用测试）
5. ✅ 前端 DM 仪表盘（跑团面板 + 角色卡两个标签页，`cd frontend && npm run dev` 启动）

## 后端本地运行

```bash
cd backend
cp .env.example .env   # 填入 DEEPSEEK_API_KEY
npm run dev
```
