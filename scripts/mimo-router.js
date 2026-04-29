/**
 * MiMo Agent Hub — 多模型智能路由 + 故障降级
 *
 * 路由策略（三档）：
 *   重度推理（代码生成、复杂分析、长文总结）→ MiMo V2.5 Pro
 *   日常对话（普通问答、闲聊、简单任务）→ MiMo V2.5 标准版
 *   快速响应（翻译、格式化、简单查询）→ DeepSeek V4 Flash
 *
 * 故障处理：
 *   401 → 直接跳过该模型（Key 无效，重试无意义）
 *   超时（30s）→ 指数退避重试（1s/2s/4s）→ 降级
 *   429 / 5xx → 立即降级到下一档
 *
 * 用法:
 *   MIMO_API_KEY=xxx DEEPSEEK_API_KEY=xxx node mimo-router.js
 */

// ============ 配置 ============

const MODELS = {
  pro: {
    name: 'MiMo V2.5 Pro',
    baseUrl: 'https://token-plan-cn.xiaomimimo.com/v1',
    model: 'mimo-v2.5-pro',
    apiKey: process.env.MIMO_API_KEY,
    maxTokens: 4096,
    timeoutMs: 30000
  },
  standard: {
    name: 'MiMo V2.5',
    baseUrl: 'https://token-plan-cn.xiaomimimo.com/v1',
    model: 'mimo-v2.5',
    apiKey: process.env.MIMO_API_KEY,
    maxTokens: 2048,
    timeoutMs: 20000
  },
  fast: {
    name: 'DeepSeek V4 Flash',
    baseUrl: 'https://api.deepseek.com/v1',
    model: 'deepseek-v4-flash',
    apiKey: process.env.DEEPSEEK_API_KEY,
    maxTokens: 2048,
    timeoutMs: 15000
  }
};

const MAX_RETRIES = 2;

// ============ 路由判断 ============

/**
 * 从 messages 数组中提取用户输入文本
 */
function extractUserPrompt(messages) {
  const userMsg = messages.filter(m => m.role === 'user').pop();
  return userMsg ? userMsg.content : '';
}

/**
 * 根据任务特征判断需要哪一档模型
 * 返回路由链（从最合适的开始，依次降级）
 */
function classifyTask(messages) {
  const prompt = extractUserPrompt(messages);
  const len = prompt.length;

  // 重度推理特征：长文本、代码相关、分析类关键词
  const heavyPatterns = [
    /代码|函数|实现|编写|重构|调试|review/i,
    /分析|对比|评估|设计|架构|方案/i,
    /解释.{10,}|总结.{10,}|翻译.{50,}/i,
    /```[\s\S]{50,}/  // 包含代码块
  ];

  // 推理类关键词（短文本也可能需要推理）
  const reasoningKeywords = /代码|分析|对比|评估|设计|架构|方案|解释|为什么|怎么|如何|review|debug/i;

  // 快速响应特征：短文本 + 无推理关键词 + 简单指令
  const isShort = len < 100;
  const hasReasoning = reasoningKeywords.test(prompt);
  const isSimpleGreeting = /^(hi|hello|你好|ok|好的|嗯|谢谢|thanks)/i.test(prompt);
  const isSimpleCommand = /^(翻译|格式化|转换|列出)\s/.test(prompt);

  if (heavyPatterns.some(p => p.test(prompt)) || len > 2000) {
    return ['pro', 'standard', 'fast'];   // 重度推理
  }
  if (isShort && !hasReasoning && (isSimpleGreeting || isSimpleCommand)) {
    return ['fast', 'standard', 'pro'];   // 快速响应
  }
  return ['standard', 'pro', 'fast'];     // 日常对话
}

// ============ API 调用 ============

async function callModel(config, messages) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.timeoutMs);

  try {
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        model: config.model,
        messages,
        max_tokens: config.maxTokens
      }),
      signal: controller.signal
    });

    // 401: Key 无效，直接抛出不重试
    if (response.status === 401) {
      throw Object.assign(new Error('API Key 无效 (401)'), { skipRetry: true });
    }

    // 429/5xx: 可降级的错误
    if (response.status === 429 || response.status >= 500) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message || 'API error');
    }

    return data;
  } finally {
    clearTimeout(timer);
  }
}

// ============ 路由 + 降级 ============

async function route(messages) {
  const chain = classifyTask(messages);
  const errors = [];

  for (const modelKey of chain) {
    const config = MODELS[modelKey];

    if (!config.apiKey) {
      errors.push(`[${config.name}] API Key 未配置，跳过`);
      continue;
    }

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const start = Date.now();
        console.log(`→ [${config.name}] 尝试 ${attempt + 1}/${MAX_RETRIES + 1}`);

        const result = await callModel(config, messages);
        const elapsed = Date.now() - start;

        console.log(`✓ [${config.name}] 成功 (${elapsed}ms)`);
        return {
          model: config.name,
          modelKey,
          result,
          elapsed,
          attempts: attempt + 1,
          errors
        };
      } catch (err) {
        const msg = err.name === 'AbortError' ? '超时' : err.message;
        console.log(`✗ [${config.name}] 失败: ${msg}`);
        errors.push(`[${config.name}] 尝试 ${attempt + 1}: ${msg}`);

        // 401 直接跳过，不重试
        if (err.skipRetry) {
          console.log(`  401 错误，跳过该模型\n`);
          break;
        }

        // 指数退避
        if (attempt < MAX_RETRIES) {
          const delay = Math.pow(2, attempt) * 1000;
          console.log(`  等待 ${delay}ms...`);
          await new Promise(r => setTimeout(r, delay));
        }
      }
    }

    console.log(`→ [${config.name}] 全部失败，降级到下一档\n`);
  }

  throw new Error(`所有模型均不可用:\n${errors.join('\n')}`);
}

// ============ 测试入口 ============

async function main() {
  const testPrompt = '用三句话解释什么是 Model Context Protocol (MCP)，以及它和传统 API 的区别。';

  console.log('═══════════════════════════════════════');
  console.log(' MiMo Agent Hub — 多模型路由测试');
  console.log('═══════════════════════════════════════\n');
  console.log(`测试任务: ${testPrompt}\n`);

  const messages = [
    { role: 'system', content: '你是一个专业的技术助手，回答简洁准确。' },
    { role: 'user', content: testPrompt }
  ];

  try {
    const { model, result, elapsed, attempts } = await route(messages);

    console.log('\n═══════════════════════════════════════');
    console.log(` 使用模型: ${model}`);
    console.log(` 耗时: ${elapsed}ms | 重试次数: ${attempts}`);
    console.log('═══════════════════════════════════════\n');
    console.log(result.choices[0].message.content);
  } catch (err) {
    console.error('\n路由失败:', err.message);
    process.exit(1);
  }
}

main();
