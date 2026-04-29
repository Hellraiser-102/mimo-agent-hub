/**
 * MiMo Agent Hub — 模型性能对比测试
 *
 * 对比 MiMo V2.5 Pro / MiMo V2.5 / DeepSeek V4 Flash
 * 在不同任务类型上的响应质量和速度
 *
 * 用法:
 *   MIMO_API_KEY=xxx DEEPSEEK_API_KEY=xxx node mimo-benchmark.js
 */

const MODELS = [
  {
    key: 'pro',
    name: 'MiMo V2.5 Pro',
    baseUrl: 'https://token-plan-cn.xiaomimimo.com/v1',
    model: 'mimo-v2.5-pro',
    apiKey: process.env.MIMO_API_KEY
  },
  {
    key: 'standard',
    name: 'MiMo V2.5',
    baseUrl: 'https://token-plan-cn.xiaomimimo.com/v1',
    model: 'mimo-v2.5',
    apiKey: process.env.MIMO_API_KEY
  },
  {
    key: 'fast',
    name: 'DeepSeek V4 Flash',
    baseUrl: 'https://api.deepseek.com/v1',
    model: 'deepseek-v4-flash',
    apiKey: process.env.DEEPSEEK_API_KEY
  }
];

const TEST_CASES = [
  {
    name: '简单问答',
    messages: [
      { role: 'user', content: '1+1等于几？用一句话回答。' }
    ]
  },
  {
    name: '代码生成',
    messages: [
      { role: 'user', content: '用 JavaScript 写一个快速排序函数，要求原地排序，加注释。' }
    ]
  },
  {
    name: '逻辑推理',
    messages: [
      { role: 'user', content: '一个房间里有3个开关，对应隔壁房间的3盏灯。你只能进隔壁房间一次。如何确定每个开关对应哪盏灯？' }
    ]
  },
  {
    name: '文本摘要',
    messages: [
      { role: 'system', content: '请用3句话总结以下内容的核心观点。' },
      { role: 'user', content: 'Model Context Protocol (MCP) 是一种开放标准，旨在为 AI 模型提供统一的上下文接口。传统上，每个 AI 应用都需要单独实现与外部工具和数据源的集成代码，这导致了大量的重复工作和碎片化的生态系统。MCP 通过定义标准化的协议，让 AI 模型可以像 USB 接口一样即插即用地连接各种工具、数据库和 API。这不仅降低了开发成本，还促进了工具开发者和 AI 平台之间的互操作性。Anthropic 在 2024 年底首次提出 MCP 概念，随后在 2025 年初开源了参考实现。到 2026 年，MCP 已经成为 AI Agent 生态的核心协议之一，被 OpenClaw、Cursor、Claude Code 等主流工具采纳。' }
    ]
  }
];

async function callModel(model, messages) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);

  try {
    const start = Date.now();
    const response = await fetch(`${model.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${model.apiKey}`
      },
      body: JSON.stringify({
        model: model.model,
        messages,
        max_tokens: 1024
      }),
      signal: controller.signal
    });

    const elapsed = Date.now() - start;

    if (!response.ok) {
      return { model: model.name, elapsed, error: `HTTP ${response.status}`, output: null };
    }

    const data = await response.json();
    const output = data.choices?.[0]?.message?.content || '(空响应)';
    const tokens = data.usage || {};

    return { model: model.name, elapsed, output, tokens, error: null };
  } catch (err) {
    return { model: model.name, elapsed: 0, error: err.name === 'AbortError' ? '超时' : err.message, output: null };
  } finally {
    clearTimeout(timer);
  }
}

async function runBenchmark() {
  console.log('═══════════════════════════════════════════════════');
  console.log(' MiMo Agent Hub — 模型性能对比测试');
  console.log('═══════════════════════════════════════════════════\n');

  const availableModels = MODELS.filter(m => {
    if (!m.apiKey) {
      console.log(`⚠ ${m.name}: API Key 未配置，跳过`);
      return false;
    }
    return true;
  });

  if (availableModels.length === 0) {
    console.error('错误: 没有可用的模型，请检查环境变量 MIMO_API_KEY 和 DEEPSEEK_API_KEY');
    process.exit(1);
  }

  console.log(`可用模型: ${availableModels.map(m => m.name).join(', ')}\n`);

  const results = [];

  for (const tc of TEST_CASES) {
    console.log(`\n─── 测试: ${tc.name} ───`);

    for (const model of availableModels) {
      const r = await callModel(model, tc.messages);

      if (r.error) {
        console.log(`  ${r.model}: ✗ ${r.error}`);
      } else {
        const preview = r.output.replace(/\n/g, ' ').slice(0, 80);
        const tokenInfo = r.tokens
          ? `(in:${r.tokens.prompt_tokens} out:${r.tokens.completion_tokens})`
          : '';
        console.log(`  ${r.model}: ✓ ${r.elapsed}ms ${tokenInfo}`);
        console.log(`    → ${preview}...`);
      }

      results.push({ test: tc.name, ...r });
    }
  }

  // 汇总表格
  console.log('\n\n═══════════════════════════════════════════════════');
  console.log(' 汇总');
  console.log('═══════════════════════════════════════════════════\n');
  console.log('| 测试 | 模型 | 耗时 | 状态 |');
  console.log('|------|------|------|------|');

  for (const r of results) {
    const status = r.error ? `✗ ${r.error}` : '✓';
    const time = r.elapsed ? `${r.elapsed}ms` : '-';
    console.log(`| ${r.test} | ${r.model} | ${time} | ${status} |`);
  }
}

runBenchmark().catch(console.error);
