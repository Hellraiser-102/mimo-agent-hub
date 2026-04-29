# MiMo Agent Hub

基于小米 MiMo 的多模型智能路由 Agent 平台。

## 解决什么问题

开发者使用 AI Agent 时面临两难：
- **重度推理任务**（代码生成、复杂分析）需要强模型，但成本高
- **日常对话**用弱模型够用，但质量差
- **手动切换**繁琐低效，且 API 限流/超时会中断工作流

MiMo Agent Hub 通过**智能路由 + 自动降级**解决这个问题。

## 架构

```
用户请求
  ↓
路由判断（按任务复杂度分三档）
  ↓
┌─────────────────────────────────────────┐
│  重度推理 → MiMo V2.5 Pro (强推理)     │
│  日常对话 → MiMo V2.5 (平衡)           │
│  快速响应 → DeepSeek V4 Flash (低成本) │
└─────────────────────────────────────────┘
  ↓ 超时/限流/错误
指数退避重试 → 自动降级到下一档
  ↓
返回结果
```

## 快速开始

### 1. 部署

```bash
# 克隆仓库
git clone https://github.com/Hellraiser-102/mimo-agent-hub.git
cd mimo-agent-workspace

# 配置环境变量
cp .env.example .env
# 编辑 .env，填入你的 API Key

# 启动
docker-compose up -d
```

### 2. 测试路由脚本

```bash
# 安装依赖（Node.js 18+）
cd scripts

# 运行路由测试
MIMO_API_KEY=your_key DEEPSEEK_API_KEY=your_key node mimo-router.js

# 运行模型对比测试
MIMO_API_KEY=your_key DEEPSEEK_API_KEY=your_key node mimo-benchmark.js
```

### 3. 访问 Control UI

浏览器打开 `http://localhost:18999`，使用 Gateway Token 登录。

## 路由策略

| 档位 | 模型 | 触发条件 | 典型场景 |
|------|------|----------|----------|
| 重度推理 | MiMo V2.5 Pro | 长文本(>2000字)、代码相关、分析类关键词 | 代码审查、架构设计、长文总结 |
| 日常对话 | MiMo V2.5 | 默认 | 普通问答、任务编排 |
| 快速响应 | DeepSeek V4 Flash | 短文本(<100字)、简单指令 | 翻译、格式化、简单查询 |

## 故障降级

- **超时（30s）**→ 指数退避重试（1s → 2s → 4s）→ 降级
- **429 限流** → 立即降级到下一档
- **5xx 错误** → 立即降级到下一档
- **API Key 未配置** → 跳过该模型

## 技术栈

- **框架：** OpenClaw 2026.4.24
- **核心模型：** 小米 MiMo V2.5 Pro
- **备选模型：** MiMo V2.5、DeepSeek V4 Flash/Pro
- **插件：** Tavily 搜索、Active Memory、Memory Wiki、Document Extract
- **部署：** Docker + Docker Compose

## 目录结构

```
mimo-agent-workspace/
├── README.md                 ← 本文件
├── .env.example              ← 环境变量模板
├── docker-compose.yml        ← 容器部署配置
├── openclaw.json             ← Agent 核心配置
├── scripts/
│   ├── mimo-router.js        ← 多模型路由 + 故障降级（可运行）
│   └── mimo-benchmark.js     ← 模型性能对比测试（可运行）
├── workspace/
│   ├── SOUL.md               ← Agent 人格设定
│   ├── USER.md               ← 用户档案
│   ├── IDENTITY.md           ← 身份信息
│   ├── AGENTS.md             ← 行为准则
│   ├── MEMORY.md             ← 记忆档案
│   └── openclaw-env-v6.md    ← 环境档案
└── docs/
    └── architecture.md       ← 详细架构文档
```
