# Skill: Bazi 客服系统搭建

> 完整的 AI 驱动客服体系，包含产品内聊天机器人 + 后台管理 + 邮件自动处理 + 多语言支持

---

## 一、系统架构总览

```
┌─────────────────────────────────────────────────────────────┐
│                    用户端（前端 Widget）                       │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Support Chat Widget (浮窗, 右下角)                   │    │
│  │  - 快捷按钮（按 locale 切换）                         │    │
│  │  - 实时流式 AI 回复                                   │    │
│  │  - Admin 消息区分显示                                 │    │
│  └───────────────┬─────────────────────────────────────┘    │
└──────────────────┼──────────────────────────────────────────┘
                   │ SSE Stream
                   ▼
┌─────────────────────────────────────────────────────────────┐
│                     API 层（Next.js）                         │
│                                                               │
│  POST /api/support/message   ── AI 对话（DeepSeek）           │
│  POST /api/support/visitor   ── 访客注册                      │
│  POST /api/support/conversation ── 创建/获取会话              │
│  GET  /api/support/faq       ── FAQ 知识库                    │
│  POST /api/support/webhook/telegram ── Telegram 通知          │
│                                                               │
│  ┌──────────────────────────────────────────────────┐        │
│  │        双层升级检测（Escalation Detection）          │        │
│  │                                                    │        │
│  │  Layer 1: AI 标签                                   │        │
│  │    [NEEDS_HUMAN:HIGH]   → 紧急（退款/安全/数据）      │        │
│  │    [NEEDS_HUMAN:NORMAL] → 普通（bug/功能问题）        │        │
│  │                                                    │        │
│  │  Layer 2: 关键词兜底                                 │        │
│  │    HIGH: 退款/refund/hacked/被盗/无法登录             │        │
│  │    NORMAL: 报错/bug/打不开/转人工                     │        │
│  └──────────────────────────────────────────────────┘        │
│                         │                                     │
│                         ▼ 触发升级                             │
│               Telegram 通知 → 人工接管                        │
└─────────────────────────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│                    数据层（Supabase/PostgreSQL）               │
│                                                               │
│  support_visitor       ── 访客指纹（IP/UA/locale/token）      │
│  support_conversation  ── 会话（状态/优先级/是否需人工）       │
│  support_message       ── 消息记录（user/assistant/admin）     │
│  support_faq           ── 多语言 FAQ 知识库                    │
└─────────────────────────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│              OpenClaw Support Agent（邮件客服管家）             │
│                                                               │
│  Cron: 每天 10:00 自动检查 Gmail                              │
│  分类: 紧急 → Telegram | 客户咨询 → 草拟回复 | 垃圾 → 归档    │
│  浏览器: Support Profile (独立 CDP 端口)                       │
│  邮箱: jayden0702tt@gmail.com                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 二、数据库设计

### 2.1 support_visitor（访客表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid | 主键 |
| visitorToken | varchar(64) | 前端生成的匿名 token |
| ip | varchar(45) | 访客 IP |
| userAgent | text | 浏览器信息 |
| locale | varchar(10) | 语言偏好 |
| pageUrl | text | 当前页面 |
| email | varchar(255) | 可选，用户主动提供 |
| userId | uuid | 关联已登录用户 |
| lastSeenAt | timestamp | 最后活跃时间 |
| createdAt | timestamp | 首次访问 |

**索引:** visitorToken（唯一）, userId

### 2.2 support_conversation（会话表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid | 主键 |
| visitorId | uuid | 关联访客 |
| userId | uuid | 关联用户（如已登录）|
| subject | varchar(200) | AI 自动从首条消息生成 |
| status | enum | open / waiting_reply / resolved / closed |
| priority | enum | low / normal / high / urgent |
| channel | varchar(50) | 来源渠道 |
| needsHuman | boolean | 是否需要人工介入 |
| resolvedAt | timestamp | 解决时间 |
| metadata | jsonb | 扩展数据 |

**索引:** visitorId, userId, (status + needsHuman)

### 2.3 support_message（消息表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid | 主键 |
| conversationId | uuid | 关联会话 |
| role | enum | user / assistant / admin |
| content | text | 消息内容 |
| contentType | varchar(20) | text / image / link |
| metadata | jsonb | 扩展数据 |
| createdAt | timestamp | 发送时间 |

**索引:** (conversationId + createdAt) 用于轮询

### 2.4 support_faq（FAQ 知识库）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid | 主键 |
| question | text | 问题 |
| answer | text | 回答 |
| category | varchar(50) | 分类 |
| locale | varchar(10) | 语言 |
| sortOrder | integer | 排序 |
| enabled | boolean | 是否启用 |

**索引:** (locale + enabled)

---

## 三、AI 聊天机器人

### 3.1 技术选型
- **模型:** DeepSeek Chat（通过 OpenAI 兼容 API）
- **接口:** `https://api.deepseek.com`
- **响应:** Server-Sent Events (SSE) 流式输出

### 3.2 System Prompt 设计

```
你是 Bazi Calculator 的客服助手。

规则：
1. 纯文本回复，不用 Markdown
2. 链接格式: {{link:显示文本:/路径}}
3. 单次回复不超过 200 字
4. 根据用户语言自动切换（支持 en/zh/zh-TW/ja/ko）
5. 无法解决时标记 [NEEDS_HUMAN:HIGH] 或 [NEEDS_HUMAN:NORMAL]
6. 基于 FAQ 知识库回答常见问题

允许的链接路径:
/free-bazi-reading, /pricing, /my-reports, /invite, /qimen, /bazi-calculator
```

### 3.3 限流策略

| 用户类型 | 限制 |
|---------|------|
| 已登录用户 | 30 条/小时 |
| 匿名访客 | 10 条/小时 |

### 3.4 升级机制

**触发条件（任一即触发）：**
1. AI 在回复中包含 `[NEEDS_HUMAN:HIGH]` 或 `[NEEDS_HUMAN:NORMAL]`
2. 用户消息包含关键词（退款/refund/hacked/bug/转人工 等）

**升级动作：**
1. 更新会话状态为 `waiting_reply`，标记 `needsHuman: true`
2. 发送 Telegram 通知（含优先级、用户信息、最近聊天记录）
3. 前端显示"您的问题已转交客服团队"

---

## 四、前端聊天 Widget

### 4.1 UI 规格

| 属性 | 值 |
|------|-----|
| 位置 | 右下角固定 |
| 尺寸 | 380px × 560px |
| 触发 | 浮动按钮点击 |
| 消息气泡 | 用户(蓝) / AI(灰) / 管理员(蓝+边框) |

### 4.2 多语言快捷按钮

| 语言 | 按钮 |
|------|------|
| zh | 如何排盘, AI分析报告, 2026运势, 积分与付费 |
| en | How to chart, AI Analysis, 2026 Fortune, Credits & Pricing |
| ja | 命盤の作り方, AI分析レポート, 2026年運勢, クレジットと料金 |
| ko | 사주 차트 만들기, AI 분석 리포트, 2026년 운세, 크레딧 & 요금 |

### 4.3 轮询机制

| 会话状态 | 轮询间隔 |
|---------|---------|
| waiting_human（等待人工） | 5 秒 |
| 其他状态 | 15 秒 |

---

## 五、邮件客服（OpenClaw Support Agent）

### 5.1 执行时间
- **Cron:** 每天 10:00 AM (GMT+8)
- **超时:** 3415 秒

### 5.2 邮件分类与处理

| 类型 | 标记 | 处理 |
|------|------|------|
| 安全/服务告警 | 🔴 紧急 | 立即 Telegram 通知 + 转 Site-Ops |
| 客户咨询 | 🟡 客户 | 草拟回复 + Telegram 通知等审批 |
| 商务合作 | 🟡 商务 | 摘要 + 建议 + Telegram 通知 |
| 技术通知(GitHub/Vercel) | 🟢 技术 | 记录，重要的汇总 |
| 垃圾/推广 | ⚫ 垃圾 | 静默归档 |

### 5.3 核心规则
- **永远不自动发送：** 所有外发邮件需人工审批
- **使用 Support Browser Profile：** 独立 CDP 端口，已登录 Gmail
- **输出路径：** `workspace/inbox/emails/YYYY-MM-DD/`

---

## 六、管理后台

### 6.1 路径
`/[locale]/admin/support/`

### 6.2 功能
- 会话列表（按状态/优先级筛选）
- 需人工处理队列（needsHuman = true）
- 查看完整对话历史
- 撰写管理员回复
- 搜索会话

---

## 七、通知链路

```
用户发消息 → AI 回复 → 检测到升级
                         ↓
              Telegram 通知
              - 优先级标签 (HIGH/NORMAL)
              - 用户邮箱/登录状态
              - 当前页面 URL
              - 最近 3 条聊天记录
                         ↓
              管理员在后台回复
                         ↓
              前端轮询获取 admin 消息
              用户看到"客服团队"标签的回复
```

---

## 八、关键文件索引

| 文件 | 作用 |
|------|------|
| `src/config/db/schema.ts` (L603-692) | 4 张 support 表定义 |
| `src/shared/models/support-*.ts` | 4 个数据模型 |
| `src/app/api/support/message/route.ts` | AI 对话 API（454行）|
| `src/features/support/components/support-widget.tsx` | 聊天 Widget（395行）|
| `src/features/support/hooks/use-support-chat.ts` | 聊天状态管理 Hook |
| `src/app/[locale]/admin/support/` | 管理后台 |
| `src/config/locale/messages/*/admin/support.json` | 5 语言 UI 翻译 |
| `data/support/faq.md` | FAQ 知识库 |
| `data/support/templates/general-reply.md` | 回复模板 |

---

## 九、运营经验总结

### 9.1 已踩过的坑
1. **浏览器超时：** Support Agent 最初 timeout 300s，邮件多时会超时。建议设 3000s+
2. **Gmail 反自动化：** "下一步"按钮需要用 `eval JS` 方式点击，常规 click 无效
3. **2FA 验证：** Gmail 登录需配置两步验证（手机推送或 SMS）
4. **Session 过期：** Support browser session 需定期重新登录

### 9.2 成功率
- 邮件检查任务：83% 成功率（5/6 成功）
- 平均执行时间：127 秒
- 失败原因：仅超时（已修复）

### 9.3 最佳实践
- DeepSeek 作为 AI 模型性价比高，但回复质量偶尔需调优
- FAQ 知识库要持续更新（用户真实问题 → 新增 FAQ）
- Telegram 通知是关键——确保 webhook 可靠
- 访客 → 用户合并（mergeVisitorToUser）避免会话丢失
