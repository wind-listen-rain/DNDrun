# DM 助手

D&D 跑团 DM 实时助手：cue 流程、摇骰子与伤害计算、角色卡创建管理、AI 辅助叙事。

## 项目结构

- `frontend/` — React + TypeScript (Vite)
- `backend/` — Node.js + TypeScript (Express + Socket.io)

## 技术选型

- 骰子引擎：基于 [`@dice-roller/rpg-dice-roller`](https://github.com/dice-roller/rpg-dice-roller) 封装 D&D 规则层（优势/劣势、暴击、豁免）
- 规则数据：接入 [open5e](https://open5e.com/) / [5e-srd-api](https://github.com/5e-bits/5e-srd-api) 获取种族/职业/法术/怪物数据
- 实时同步：Socket.io，DM 端与玩家端共享先攻/回合状态
- AI 辅助叙事：Claude API（function-calling 触发摇骰/查规则）

## 开发阶段

1. 骰子引擎与伤害/豁免计算
2. 角色卡创建与管理
3. 流程 cue 系统（先攻追踪、回合提示）
4. AI 辅助叙事 / NPC 对话
5. 联调与实机测试
