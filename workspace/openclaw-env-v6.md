# OpenClaw 环境档案 2026-04-29 v6

> 基于 v4 格式更新 · 生成时间 2026-04-29 08:40 UTC

---

## 一、硬件与系统架构

* **设备：** MacBook Air M5
* **系统环境：** 双账号隔离（管理员 + **agent 子账号**）
* **agent 运行环境：**
  * 主目录：`/Users/agent/`
  * 终端路径：`/your/host/path/`
  * 网络：Clash Tun 全局代理
  * 提示符：`agent@tangjiandeMacBook-Air openclaw_data %`

## 二、Docker 容器配置

* **容器名：** `openclaw-2026` (v2026.4.24)
* **容器系统：** Linux 6.12.76-linuxkit (aarch64)
* **Node.js：** v24.14.0
* **网络端口：** 宿主机 `18999` → 容器 `18789`
* **数据映射：** 宿主机 `/your/host/path/` ↔ 容器 `/home/node/.openclaw/`
* **入口地址：**
  * **WebChat:** `http://127.0.0.1:18999/chat?session=main`
  * **Control UI:** `http://127.0.0.1:18999`
* **Gateway Token：** `YOUR_GATEWAY_TOKEN`
* **Control UI 密码：** `YOUR_PASSWORD`（与 Gateway Token 是两回事，不冲突）

## 三、核心配置操作规范（必读）

1. **编辑方式：** 因 `agent` 账号无 `sudo` 权限，必须使用 `nano`：
   `nano ~/openclaw_data/openclaw.json`
   *（操作：Ctrl+K 清空 → 粘贴 → Ctrl+O 回车保存 → Ctrl+X 退出）*
2. **生效规则：** 修改 `.json` 必须 `docker restart openclaw-2026`。
3. **覆盖风险：** 执行 `openclaw plugins enable/disable` 会自动重写并清空 `.json` 中的自定义内容。**操作后必须用 `nano` 手动补回完整配置。**
4. **人格文件：** 修改 `workspace/` 下的 `.md` 文件无需重启，即时生效。
5. **⚠️ config.patch 受保护路径：** 容器内 `gateway config.patch` 无法修改 `plugins.entries` 下的受保护字段，必须直接编辑 json 文件。
6. **⚠️ Python 写 JSON 陷阱：** Python 的 `True/False` 不是合法 JSON，写入会导致解析失败。务必写完后用 `python3 -m json.tool` 校验。

## 四、权威配置内容（openclaw.json）

```json
{
  "models": {
    "mode": "merge",
    "providers": {
      "xiaomi-mimo": {
        "api": "openai-completions",
        "baseUrl": "https://token-plan-cn.xiaomimimo.com/v1",
        "apiKey": "tp-c6ind4ty2ut0k2yw4yta32ijcrrkubgdhrbceyhsiafabr55",
        "models": [
          { "id": "mimo-v2.5", "name": "MiMo V2.5" },
          { "id": "mimo-v2.5-pro", "name": "MiMo V2.5 Pro" }
        ]
      },
      "deepseek": {
        "api": "openai-completions",
        "baseUrl": "https://api.deepseek.com/v1",
        "apiKey": "sk-1a447769b9f34de3866d45fcff729ac8",
        "models": [
          { "id": "deepseek-v4-flash", "name": "DeepSeek V4 Flash" },
          { "id": "deepseek-v4-pro", "name": "DeepSeek V4 Pro" }
        ]
      }
    }
  },
  "agents": {
    "defaults": {
      "model": { "primary": "xiaomi-mimo/mimo-v2.5-pro" },
      "workspace": "/home/node/.openclaw/workspace"
    }
  },
  "plugins": {
    "entries": {
      "tavily": {
        "enabled": true,
        "config": { "webSearch": { "apiKey": "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" } }
      },
      "active-memory": { "enabled": true },
      "memory-wiki": { "enabled": true },
      "document-extract": { "enabled": true },
      "web-readability": { "enabled": true },
      "opencode": { "enabled": true },
      "llm-task": { "enabled": true },
      "bonjour": { "enabled": false }
    }
  },
  "tools": { "web": { "search": { "provider": "tavily" } } },
  "gateway": {
    "auth": { "mode": "token", "token": "YOUR_GATEWAY_TOKEN" },
    "controlUi": { "allowedOrigins": ["http://127.0.0.1:18999"] }
  }
}
```

## 五、API 资产与模型速查

| 服务 | API Key | 节点 (Endpoint) | 备注 |
| :--- | :--- | :--- | :--- |
| **MiMo Token Plan** | `tp-c6ind4ty...` | `token-plan-cn.xiaomimimo.com/v1` | Provider ID: `xiaomi-mimo` |
| **DeepSeek** | `sk-1a447769...` | `api.deepseek.com/v1` | 按量计费 |
| **Tavily Search** | `tvly-dev-3QW...` | — | 内置插件，ID 为 `tavily` |

### 模型详情

| 模型 | 角色 | 输入价格 | 输出价格 | 上下文 | 多模态 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **MiMo V2.5 Pro** | Primary（重度编码/Agent） | $1.00/M | $3.00/M | 200k | ❌ 纯文本 |
| **MiMo V2.5** | 备用（日常对话，省钱） | $0.40/M | $2.00/M | 200k | ✅ 文本/音频/图片/视频 |
| **DeepSeek V4 Flash** | 备用（快速廉价，MoE 284B） | 便宜 | 便宜 | 1M | ❌ |
| **DeepSeek V4 Pro** | 备用（高质量） | 中等 | 中等 | 1M | ❌ |

> MiMo Token Plan 计费：1 Token = 1 Credit（标准版），1 Token = 2 Credits（Pro）

## 六、Workspace 人格设定（workspace/）

* **IDENTITY.md：** 啾啾 | 🐱 | 大王最好的死党
* **SOUL.md：** 直接、冷静、客观、不废话、有判断力。说结论不说过程，错了就说错了。
* **USER.md：** 唐健（大王），大庆人，追求真话，厌恶虚伪客套。
* **MEMORY.md：** 记忆档案，环境信息 + 待办 + 对话记录。
* **AGENTS.md：** 行为准则：结论先行、强制联网查真话、纠正大王错误。
* **TOOLS.md：** 工具配置笔记（本地环境特定）。
* **HEARTBEAT.md：** 心跳任务（当前为空，无定时任务）。
* **openclaw-env-v6.md：** 环境档案（本文档）。

## 七、插件状态总览

### 运行时自动加载（8 个）

| 插件 | 说明 |
| :--- | :--- |
| acpx | ACP 扩展运行时 |
| browser | 浏览器控制（端口 18791） |
| device-pair | 设备配对 |
| phone-control | 手机控制 |
| talk-voice | 语音对话 |
| active-memory | 记忆系统 |
| llm-task | LLM 任务调度 |
| memory-wiki | 知识库 |

### 配置文件启用（7 个 + 1 禁用）

| 插件 | 状态 | 说明 |
| :--- | :--- | :--- |
| tavily | ✅ 启用 | 网络搜索 |
| active-memory | ✅ 启用 | 记忆系统 |
| memory-wiki | ✅ 启用 | 知识库 |
| document-extract | ✅ 启用 | 文档提取 |
| web-readability | ✅ 启用 | 网页可读性 |
| opencode | ✅ 启用 | 编码工具 |
| llm-task | ✅ 启用 | LLM 任务 |
| bonjour | ❌ 禁用 | Docker 内 mDNS 崩溃 |

### 已知问题插件

| 插件 | 问题 |
| :--- | :--- |
| bonjour | 禁用。Docker 内 mDNS 广播失败，`CIAO ANNOUNCEMENT CANCELLED` 未捕获异常导致 gateway 无限重启循环 |
| lmstudio | 初始化失败（validation 错误），不影响其他功能 |
| sqlite-vec | 不可用，向量召回降级（`chunks_vec not updated`） |

## 八、v4 → v6 变更清单

| 变更项 | v4（旧） | v6（当前） | 原因 |
| :--- | :--- | :--- | :--- |
| primary 模型 | `mimo-v2.5-pro` | `mimo-v2.5-pro` | 保持不变（用户确认用 Pro） |
| MiMo 模型列表 | 仅 Pro | Pro + 标准版 | 标准版备用，日常可切省钱 |
| DeepSeek | 无 | V4 Flash + V4 Pro | 新增备用模型 |
| diffs 插件 | ✅ 启用 | ❌ 删除 | 插件不存在，写了导致配置回滚 |
| identity 字段 | 在 agents.defaults 中 | ❌ 删除 | 字段不存在于 schema，写了导致配置回滚 |
| document-extract | 无 | ✅ 新增 | 文档提取能力 |
| web-readability | 无 | ✅ 新增 | 网页可读性 |
| opencode | 无 | ✅ 新增 | 编码工具 |
| llm-task | 无 | ✅ 新增 | LLM 任务调度 |
| bonjour | 自动加载 | ❌ 禁用 | Docker 内崩溃循环 |
| 操作规范 | 4 条 | 6 条 | 补充 config.patch 受保护 + Python JSON 陷阱 |
| 磁盘状态 | 未清理 | 408MB（已释放 278MB） | 清理 npm 缓存 + 旧 session + 备份 |

## 九、踩坑备忘录（v4 基础上新增）

* **插件 ID：** 必须用内置的 `tavily`。安装外部 `openclaw-tavily` 会被安全扫描拦截。
* **模型引用：** MiMo 必须写成 `xiaomi-mimo/mimo-v2.5-pro`（provider ID/model ID）。
* **权限限制：** `agent` 账号下严禁使用 `sudo` 或 `open -e`，必须用 `nano`。
* **写入方式：** 严禁使用 `cat + EOF` 粘贴长 JSON，会导致内容截断，必须 `nano` 手动粘贴。
* **identity 字段：** `agents.defaults.identity` 不存在于 schema，写了会导致配置回滚。
* **diffs 插件：** 不存在，写了导致配置回滚。
* **config.patch 受保护：** 容器内 `gateway config.patch` 无法修改 `plugins.entries` 下的字段。
* **Python True/False：** Python 的 `True`/`False` 不是合法 JSON，写入会导致解析失败。
* **bonjour 崩溃循环：** Docker 内 mDNS 不工作，插件抛出未捕获异常导致 gateway 反复重启，表现为 Control UI 反复断连（1006 + token_mismatch 交替）。**解决：禁用 bonjour。**
* **token_mismatch 间歇出现：** Gateway 重启后 Control UI 重连时 token 对不上。**解决：刷新浏览器页面。**

## 十、待办事项

* [x] ~~MiMo 模型列表补充标准版~~（已完成）
* [x] ~~添加 DeepSeek V4 Flash/Pro 作为备用~~（已完成）
* [x] ~~禁用 bonjour 插件~~（已完成，修复崩溃循环）
* [x] ~~清理 npm 缓存和旧文件~~（已释放 278MB）
* [x] ~~删除 identity 字段和 diffs 插件~~（已完成）
* [x] ~~生成 v6 环境档案~~（已完成）
* [ ] MiMo Orbit 百万亿 Token 申请审核（4月29日提交，等回复）
* [ ] 250 个职业 prompt 后续处理
* [ ] 确认 Docker 端口映射未暴露到公网
* [ ] 解决 sqlite-vec 不可用问题（向量召回降级）

## 十一、快速操作参考

```bash
# 健康检查
curl -s http://127.0.0.1:18789/healthz

# 查看 gateway 状态
openclaw gateway status

# 重启 gateway
openclaw gateway restart

# 实时日志
tail -f /tmp/openclaw/openclaw-$(date +%Y-%m-%d).log

# 搜索错误
grep -i "error\|warn\|unauthorized" /tmp/openclaw/openclaw-$(date +%Y-%m-%d).log

# 编辑配置（agent 账号）
nano ~/openclaw_data/openclaw.json

# 校验 JSON
python3 -m json.tool ~/openclaw_data/openclaw.json > /dev/null

# 重启容器
docker restart openclaw-2026

# 磁盘清理
rm -rf /home/node/.openclaw/plugin-runtime-deps/*/.openclaw-npm-cache
```

---

*最后更新：2026-04-29 08:40 UTC · 基于 v4 格式 + 当前运行状态*
