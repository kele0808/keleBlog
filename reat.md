# keleBlog 博客改造方案

> 目标：将 keleBlog 从「个人学习笔记博客」升级为「个人技术品牌 + 技术知识库 + 项目作品集」。
>
> 核心方向：
>
> **Java Backend → Distributed Systems → AI / LLM → RAG → Agent → Agent Infra**

---

# 1. 改造目标

## 1.1 当前博客定位

当前博客更接近：

```text
个人学习笔记
    │
    ├── Kafka
    ├── Machine Learning
    ├── Agent
    ├── Java
    ├── JVM
    └── Spring
```

优点：

* 已经有一定技术内容积累
* ML 系列已经完成
* Kafka 源码系列已经开始
* Agent / AI 已经成为新的内容方向
* Hugo + PaperMod 技术栈简单稳定
* GitHub Pages 部署简单

但目前更像：

> 「我最近学了什么，就记录什么」

而不是：

> 「这是我的技术方向、知识体系、工程实践和长期成长轨迹。」

---

# 2. 最终目标

希望改造成：

```text
                         keleBlog
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
       About             Knowledge          Projects
          │                 │                 │
       我是谁              我懂什么            我做过什么
          │                 │                 │
          └─────────────────┼─────────────────┘
                            │
                         Articles
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
      Backend              AI             Engineering
          │                 │                 │
       Kafka               ML              实战
       JVM                 LLM             源码
       Spring              RAG             系统设计
                           Agent
                           MCP
                           Infra
```

最终用户进入博客后，应该在 5 秒内知道：

1. 这个人是谁
2. 主要技术方向是什么
3. 做过哪些项目
4. 写过哪些高质量文章
5. 当前正在研究什么

---

# 3. 优先级定义

| 优先级 | 含义               |
| --- | ---------------- |
| P0  | 必须优先改，直接影响博客定位   |
| P1  | 重要改造，影响内容组织和阅读体验 |
| P2  | 进一步提升专业度         |
| P3  | 细节优化，有时间再做       |

建议严格按照：

```text
P0
 ↓
P1
 ↓
P2
 ↓
P3
```

执行，不要一开始陷入 CSS、动画、主题细节。

---

# P0：核心定位改造

---

# 4. P0-1 首页重新设计

## 当前缺点

当前首页核心文案类似：

> Hi, 我是 kele 👋
> 这里是我的学习笔记与技术博客。

问题：

* 定位过于普通
* 「学习笔记」弱化了个人技术品牌
* 没有体现 Java → AI 的技术路线
* 没有突出项目
* 没有告诉用户当前重点研究什么
* 用户第一次访问时，很难快速理解作者是谁

当前首页更像：

```text
文章目录
+
个人简介
```

而不是：

```text
个人技术主页
+
技术博客
```

---

## 为什么改

博客未来不仅用于记录学习内容，也可以成为：

* GitHub 首页
* 求职作品集
* 技术面试前的个人介绍
* AI / Agent 学习成果展示
* 开源项目入口
* 长期技术资产

因此首页应该首先服务于：

> **认识作者**

而不是首先服务于：

> **浏览文章**

---

## 怎么改

首页第一屏改成 Hero：

```text
Hi, I'm kele 👋

Java Backend Engineer → AI / Agent Infra

I write about:

Distributed Systems · LLM · RAG · Agent · AI Infrastructure

[GitHub] [Projects] [Articles]
```

下面增加：

```text
Currently Learning
```

例如：

```text
LLM
 ↓
RAG
 ↓
Agent
 ↓
Tool Calling / MCP
 ↓
Agent Runtime
 ↓
Agent Infra
```

---

## 改造成什么样

首页结构：

```text
Hero
  ↓
Currently Learning
  ↓
Featured Projects
  ↓
Featured Articles
  ↓
Latest Articles
  ↓
Knowledge Map
  ↓
About
```

首页重点从：

> 「我写了什么」

变成：

> 「我是谁 → 我研究什么 → 我做过什么 → 我写了什么」

---

# 5. P0-2 增加 Projects 项目展示

## 当前缺点

目前博客和 GitHub 项目之间关联较弱。

但实际上 GitHub 已经存在多个可以作为个人技术资产展示的项目。

例如：

* Nexus
* RAGForge
* AgentGuide
* daily-learnable

如果这些项目只存在 GitHub，而博客没有统一入口，会导致：

```text
博客
GitHub
文章
项目
```

彼此割裂。

---

## 为什么改

对于技术博客来说：

```text
文章 = 理论 / 思考
项目 = 实践
GitHub = 代码
```

三者组合以后，可信度远高于单纯文章。

---

## 怎么改

新增：

```text
/projects/
```

每个项目使用卡片：

```text
┌─────────────────────────────┐
│ Nexus                       │
│                             │
│ Codebase Knowledge / MCP    │
│                             │
│ 用于理解和检索大型代码库     │
│                             │
│ Java · MCP · Agent          │
│                             │
│ [Article] [GitHub]          │
└─────────────────────────────┘
```

---

## 改造成什么样

Projects 页面：

```text
Projects

AI / Agent
──────────────

Nexus
RAGForge
AgentGuide
daily-learnable


Backend / Infrastructure
──────────────

其他工程项目
```

同时文章底部显示：

```text
Related Project

Nexus

[GitHub →]
```

GitHub README 反向链接博客：

```text
📚 Documentation

[Architecture]
[Design Notes]
[Technical Articles]
```

最终形成：

```text
Article
   ↕
Project
   ↕
GitHub
```

---

# 6. P0-3 重写 About 页面

## 当前缺点

目前 About 更像简单自我介绍。

缺少：

* 技术背景
* 当前方向
* 技术栈
* 项目
* 写作方向
* 学习路线
* GitHub
* 联系方式

---

## 为什么改

About 页面应该回答：

> 「如果我第一次认识这个人，我需要知道什么？」

---

## 怎么改

改成：

```text
# About

Hi, I'm kele.

Java Backend Engineer → AI / Agent Infra

## Background

...

## Current Focus

LLM
RAG
Agent
MCP
Agent Runtime

## Backend

Java
Spring
Kafka
Redis
MySQL
Elasticsearch
Docker
Kubernetes

## Projects

...

## Writing

...

## GitHub

...

## Contact

...
```

---

## 改造成什么样

About 页面最终应该成为：

> **一份简洁的个人技术简历**

而不是单纯的自我介绍。

---

# P0-4 控制 Series 数量，避免大量 0/N

## 当前缺点

当前存在大量：

```text
Java       0/8
JVM        0/8
Spring     0/8
Agent      1/15
AI         0/7
Kafka      1/9
ML         15/15
```

这会产生：

> 规划很多，但完成度低

的视觉印象。

---

## 为什么改

博客需要展示：

> **已经完成的技术资产**

而不是：

> **未来可能写的内容**

---

## 怎么改

只展示：

```text
正在写
已经完成
```

暂时隐藏：

```text
0/N
```

---

## 改造成什么样

Series 页面：

```text
Machine Learning
15 / 15
████████████████████ 100%

Kafka Source Code
1 / 9
██░░░░░░░ 11%

Agent Infra
1 / 15
█░░░░░░░░░ 7%
```

Java / JVM / Spring：

暂时不展示。

等真正开始写以后再加入。

---

# P0-5 明确博客长期技术主线

## 当前缺点

目前内容覆盖：

```text
Java
Kafka
ML
Agent
AI
Spring
JVM
```

但没有明确的层次。

---

## 为什么改

技术博客不能只表现：

> 我学了很多东西

而应该表现：

> 我正在沿着一条技术路线深入。

---

## 怎么改

建立：

```text
Java Backend
      ↓
Distributed Systems
      ↓
Machine Learning
      ↓
LLM
      ↓
RAG
      ↓
Agent
      ↓
Agent Infra
```

---

## 改造成什么样

首页增加：

```text
My Learning Path

Backend
   ↓
Distributed Systems
   ↓
AI / ML
   ↓
LLM
   ↓
RAG
   ↓
Agent
   ↓
Agent Infrastructure
```

这条路线以后可以持续更新。

---

# P1：知识体系和阅读体验

---

# 7. P1-1 增加 Knowledge Map

## 当前缺点

现在文章主要是：

```text
文章 A
文章 B
文章 C
文章 D
```

文章之间缺少结构化关系。

---

## 为什么改

当文章数量超过 30～50 篇以后：

> 分类已经不足以表达知识关系。

需要：

```text
文章
 ↓
知识点
 ↓
前置知识
 ↓
后续知识
```

---

## 怎么改

增加：

```text
/knowledge/
```

例如：

```text
Machine Learning

Supervised Learning
 ├── Linear Regression
 ├── Logistic Regression
 ├── Decision Tree
 ├── Random Forest
 └── GBDT

Unsupervised Learning
 ├── K-Means
 └── PCA
```

Agent：

```text
LLM
 ├── Context
 ├── Tool Calling
 ├── RAG
 ├── Memory
 ├── Planning
 ├── MCP
 └── Agent Runtime
```

---

# 8. P1-2 增加 Related Posts

## 当前缺点

用户读完一篇文章后，不知道：

> 下一篇看什么？

---

## 为什么改

增加文章之间的内部链接，可以：

* 提高阅读深度
* 降低跳出率
* 建立知识网络

---

## 怎么改

文章底部增加：

```text
Related Articles

← RAG 基础
→ Hybrid Search
→ Reranker
```

同时显示：

```text
Prerequisites

需要先了解：
- Embedding
- Vector Search

Next

下一篇：
Hybrid Search
```

---

# 9. P1-3 统一技术文章模板

## 当前缺点

不同文章结构可能不统一。

---

## 为什么改

统一模板可以形成自己的写作风格。

---

## 怎么改

源码类文章：

```text
# XXX

## 1. 为什么需要它

## 2. 整体架构

## 3. 核心流程

## 4. 源码入口

## 5. 核心数据结构

## 6. 核心实现

## 7. 为什么这么设计

## 8. 实验

## 9. 边界条件

## 10. 总结

## References
```

算法类文章：

```text
# XXX

## 1. 问题

## 2. 直觉

## 3. 数学定义

## 4. 推导

## 5. 算法

## 6. 示例

## 7. 实现

## 8. 实验

## 9. 总结
```

---

# 10. P1-4 强化实验内容

## 当前缺点

部分文章容易变成：

```text
概念
 ↓
解释
 ↓
代码
```

---

## 为什么改

真正能够体现工程能力的是：

```text
理论
+
源码
+
实验
+
数据
```

---

## 怎么改

以后重要文章尽量加入：

```text
Experiment

配置：
batch.size = xxx
linger.ms = xxx

测试：
10000 messages

结果：
...

Conclusion:
...
```

同时加入：

* benchmark
* 日志
* flame graph
* architecture diagram
* source code trace
* 实验数据

---

# P2：个人技术品牌

---

# 11. P2-1 首页增加 Featured Articles

## 当前缺点

目前最新文章占比较大。

但：

> 最新 ≠ 最重要

---

## 为什么改

应该主动展示最能代表自己的文章。

---

## 怎么改

增加：

```text
Featured Articles

Kafka Producer 源码解析
Machine Learning 完整系列
RAG Hybrid Search
Agent Runtime
```

精选文章数量控制在：

```text
3～6 篇
```

---

# 12. P2-2 增加 Now / Currently Learning

## 当前缺点

用户不知道你现在正在研究什么。

---

## 为什么改

技术方向是持续变化的。

例如当前：

```text
Currently Learning

LLM
RAG
Agent
MCP
Agent Runtime
```

未来可以变成：

```text
Currently Learning

Agent Evaluation
Agent RL
Inference
AI Infrastructure
```

---

## 改造成什么样

首页：

```text
## Currently Learning

01 — Agent
02 — MCP
03 — Agent Runtime
04 — RAG
05 — LLM Systems
```

这个区域可以长期更新。

---

# 13. P2-3 建立“技术项目 + 文章”闭环

最终：

```text
                    Blog
                      │
          ┌───────────┴───────────┐
          ↓                       ↓
       Articles                Projects
          │                       │
          ↓                       ↓
      Knowledge                GitHub
          │                       │
          └───────────┬───────────┘
                      ↓
                Technical Brand
```

每个项目至少关联：

```text
Project
├── GitHub
├── Architecture
├── Design
├── Related Articles
└── Demo / Screenshot
```

---

# P3：SEO / 技术细节

---

# 14. P3-1 SEO

检查并完善：

```text
title
description
keywords
canonical
OpenGraph
Twitter Card
sitemap
robots.txt
RSS
favicon
```

重点：

文章标题和 description 应该描述具体技术问题。

例如：

不要：

```text
Kafka 学习笔记
```

更好：

```text
Kafka Producer 源码解析：RecordAccumulator 到 Sender
```

---

# 15. P3-2 OpenGraph

每篇文章增加 OG Image。

例如：

```text
┌──────────────────────────────┐
│                              │
│ Kafka Producer               │
│ Source Code                  │
│                              │
│ RecordAccumulator → Sender   │
│                              │
│ keleBlog                     │
└──────────────────────────────┘
```

这样分享到：

* GitHub
* 微信
* X
* Discord
* Slack

时更完整。

---

# 16. P3-3 清理 Footer

当前如果访问统计没有稳定工作：

```text
本站总访问 … 次
总访客 … 人
```

建议删除。

改成：

```text
© 2026 kele

Built with Hugo
Hosted on GitHub Pages

GitHub · RSS
```

保持简洁。

---

# 17. P3-4 评论 / Discussion

当前评论可以暂时关闭。

以后技术文章成熟后，可以增加：

```text
💬 Discuss this article
```

通过 GitHub Discussions / Issues 实现。

---

# 18. UI / Theme 原则

## 不建议

目前不建议：

* 更换 Hugo
* 更换 PaperMod
* 大规模重写 CSS
* 加大量动画
* 加复杂 3D
* 加炫酷背景
* 为了视觉效果增加 JS

---

## 原因

当前最大的瓶颈不是：

> UI 不够漂亮

而是：

> 信息架构不够清晰。

---

## UI 设计原则

保持：

```text
简洁
技术感
低干扰
高信息密度
```

重点：

```text
Typography
Spacing
Code Block
Diagram
Navigation
Information Architecture
```

而不是：

```text
Animation
Gradient
3D
Particle
```

---

# 19. 最终首页设计

最终建议：

```text
┌─────────────────────────────────────┐
│                                     │
│ Hi, I'm kele 👋                    │
│                                     │
│ Java Backend Engineer               │
│ → AI / Agent Infra                  │
│                                     │
│ Distributed Systems · LLM · RAG     │
│ Agent · AI Infrastructure           │
│                                     │
│ [GitHub] [Projects] [Articles]      │
│                                     │
└─────────────────────────────────────┘


## Currently Learning

LLM → RAG → Agent → MCP → Runtime


## Featured Projects

┌─────────────┐ ┌─────────────┐
│ Nexus       │ │ RAGForge    │
│ MCP / Code  │ │ RAG         │
└─────────────┘ └─────────────┘


## Featured Articles

Kafka Producer Source Code
Machine Learning
Agent Infra


## Latest Articles

...


## Knowledge Map

Backend → Distributed Systems → AI → Agent


## About

Java Backend → AI / Agent Infra
```

---

# 20. 最终网站信息架构

建议最终导航栏：

```text
Home
Articles
Series
Projects
Knowledge
About
```

其中：

```text
Home
    ↓
个人品牌入口

Articles
    ↓
所有文章

Series
    ↓
完整系列

Projects
    ↓
GitHub / 开源项目

Knowledge
    ↓
知识地图

About
    ↓
个人技术主页
```

---

# 21. 推荐的最终目录结构

Hugo 层面可以逐步形成：

```text
content/
├── posts/
│   ├── kafka/
│   ├── ml/
│   ├── llm/
│   ├── rag/
│   └── agent/
│
├── series/
│
├── projects/
│
├── knowledge/
│
└── about/
```

Layouts：

```text
layouts/
├── _default/
│
├── home/
│
├── projects/
│
├── knowledge/
│
└── shortcodes/
```

---

# 22. 执行顺序

不要一次全部改。

推荐：

## Phase 1 —— P0

```text
① 首页 Hero
② 首页信息架构
③ About
④ Projects
⑤ Series 清理
⑥ 技术路线
```

目标：

> 让博客第一次访问就能知道“你是谁”。

---

## Phase 2 —— P1

```text
⑦ Knowledge Map
⑧ Related Posts
⑨ Prerequisites / Next
⑩ 统一文章模板
⑪ 增加实验
```

目标：

> 让博客从文章集合变成知识体系。

---

## Phase 3 —— P2

```text
⑫ Featured Articles
⑬ Currently Learning
⑭ Article ↔ Project
⑮ Project ↔ GitHub
```

目标：

> 建立个人技术品牌。

---

## Phase 4 —— P3

```text
⑯ SEO
⑰ OG Image
⑱ RSS
⑲ Analytics
⑳ Discussion
㉑ Footer
```

目标：

> 做最后的专业化完善。

---

# 23. 改造完成后的目标

最终 keleBlog 不应该只是：

```text
我的学习笔记
```

而应该是：

```text
                    keleBlog
                       │
       ┌───────────────┼───────────────┐
       │               │               │
      我是谁          我懂什么        我做过什么
       │               │               │
     About          Knowledge        Projects
                       │               │
                       └───────┬───────┘
                               │
                            Articles
                               │
                       ┌───────┼───────┐
                       │       │       │
                    Backend    AI    Agent
                       │       │       │
                     Kafka    ML     RAG
                     JVM      LLM    MCP
                     Spring          Infra
```

最终形成：

> **个人技术主页 + 技术博客 + 知识库 + 开源项目展示**

而不是单纯的：

> **学习笔记网站**

---

# 24. 最重要的三件事

如果时间有限，只做这三个：

### P0-1

**重做首页第一屏**

从：

```text
Hi，我是 kele
这里是我的学习笔记
```

变成：

```text
Java Backend Engineer
→ AI / Agent Infra

Distributed Systems · LLM · RAG · Agent
```

---

### P0-2

**增加 Projects**

把：

```text
Nexus
RAGForge
AgentGuide
daily-learnable
```

等项目真正展示出来。

---

### P0-3

**建立技术主线**

```text
Backend
   ↓
Distributed Systems
   ↓
ML
   ↓
LLM
   ↓
RAG
   ↓
Agent
   ↓
Agent Infra
```

这是整个博客未来最重要的内容主线。

---

# 25. 改造原则

整个改造过程中遵循以下原则：

```text
内容 > UI
体系 > 数量
深度 > 广度
项目 > Demo
实验 > 复述
源码 > API 罗列
长期资产 > 短期炫技
```

最终目标不是把博客做得“更漂亮”。

而是让别人访问你的博客后形成一个清晰认知：

> **这是一个从 Java / 分布式系统出发，正在深入 LLM、RAG、Agent 和 Agent Infrastructure，并且通过源码、实验和开源项目持续构建技术能力的工程师。**
