# 记忆档案

## 大王信息
- **称呼：** 大王（唐健，大庆人）
- **设备：** MacBook Air M5，agent 子账号隔离环境
- **性格：** 讨厌废话，喜欢真话，要结论不要过程

## 环境信息
- **平台：** OpenClaw 2026.4.24，Docker 容器（Linux 6.12.76-linuxkit arm64）
- **Node.js：** v24.14.0
- **模型：** MiMo V2.5 标准版（主）+ MiMo V2.5 Pro / DeepSeek V4 Flash / DeepSeek V4 Pro（备）
- **插件：** 8 个运行中（acpx, active-memory, browser, device-pair, llm-task, memory-wiki, phone-control, talk-voice）+ 7 个配置启用（含 tavily）+ bonjour 已禁用
- **配置路径：** 宿主 `/your/host/path/` ↔ 容器 `/home/node/.openclaw/`
- **配置修改方式：** 直接编辑 openclaw.json + gateway restart，不能用 config.patch（受保护路径）
- **磁盘：** 408MB / 453GB (5%)，已清理 npm 缓存释放 278MB
- **踩坑：** identity/diffs 插件不存在；Python 写 JSON 的 True/False 会报错；bonjour 在 Docker 内 mDNS 失败导致无限重启；token_mismatch 需刷新浏览器
- **待解决问题：** sqlite-vec 不可用（向量召回降级）、lmstudio 插件初始化失败、3 个僵尸进程

## 待办
- [x] MiMo Orbit 百万亿 Token 申请已提交（4月29日），等审核中，群里有人分到 664 元人民币余额
- [ ] 250 个职业 prompt 后续处理

## 对话记录
- 2026-04-28：首次上线，完成身份设定，修复配置问题，添加 DeepSeek 模型
- 2026-04-29：primary 从 Pro 降到标准版；禁用 bonjour 插件修复崩溃循环；生成 v6 环境档案
