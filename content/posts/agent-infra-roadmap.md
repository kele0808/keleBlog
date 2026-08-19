---
title: "Agent Infra 学习路线 · 开篇"
date: 2026-08-19T21:00:00+08:00
draft: false
tags: ["AI", "Agent", "Agent Infra"]
categories: ["Agent Infra"]
series: "agent-infra"
seriesOrder: 1
featured: true
description: "一年制 Agent / Agent Infra 学习路线开篇：定位、为什么用一年、以及 12 个月总览。"
summary: "从 Java 后端出发的系统 Agent 路线：LLM → Agent → Runtime / Infra，面向 Agent Engineer 与 AI Platform 岗位。"
---

## 这篇是什么

这是 **Agent Infra 学习路线** 的开篇，用来回答三件事：

1. 这条路线适合谁、不适合谁
2. 为什么建议用 **一年** 而不是三个月速成
3. 接下来 12 个月大致怎么走

完整的学习地图（含每月项目与 GitHub 阅读清单）我会按阶段拆成系列文章陆续写；你也可以先看系列页上的 [阅读路线](/series/agent-infra/)。

和 [AI 应用实践](/series/ai/) 的关系：**AI 系列**写单点实践（一篇一个主题），**本系列**写系统路线与阶段进度。

---

## 先确定定位

你很可能已经有：

```text
Java · MySQL · Redis · Kafka · 分布式 · Docker / 云 · SaaS 后端
```

所以不必把自己培养成：

```text
Java Backend → 重学 Python → 纯算法 → 训练大模型
```

更适合的路径是：

```text
Java Backend
      ↓
Distributed System / Cloud
      ↓
Python + LLM
      ↓
Agent（Tool / RAG / Memory）
      ↓
Agent Runtime
      ↓
Agent Infra（Gateway / Sandbox / Observability）
```

优势在于：**不是从 0 开始，而是在已有后端能力上叠加 AI。**

目标岗位包括：AI Agent Engineer、Agent Backend、Agent Infra、AI Platform、LLM Application Engineer。

---

## 为什么给自己整整一年

如果只要「三个月找一份 Agent 相关工作」，学这些也许够用：

```text
Python · LLM API · RAG · Tool Calling · LangGraph · MCP
```

但如果目标是 **基础扎实 + 知识面广 + 能扛面试里的系统设计**，一年更合理。

粗分如下（与系列页 roadmap 一致）：

| 阶段 | 时间 | 重点 |
|------|------|------|
| 基础 | 第 1～2 月 | Python + LLM 基础 |
| 应用 | 第 3～4 月 | Agent + RAG + Tool Calling |
| 编排 | 第 5～6 月 | LangGraph + MCP + Memory |
| 平台 | 第 7～9 月 | Agent Runtime + Agent Infra |
| 工程 | 第 10 月 | Observability + Evaluation + Multi-Agent |
| 底层 | 第 11 月 | Transformer / Inference / 微调概览 |
| 冲刺 | 第 12 月 | 项目打磨 + 面试 + 算法/系统设计 |

---

## 一年总览（能力树）

```text
                         AI Agent Engineer
                                │
              ┌─────────────────┼─────────────────┐
              ↓                 ↓                 ↓
           LLM 基础           Agent             Infra
              │                 │                 │
         Embedding          Tool Calling       Redis / Kafka
         Context             RAG                MySQL / ES
         Inference           Memory             K8s / 隔离
              │                 │                 │
              └────────┬────────┘                 │
                       ↓                          │
                   LangGraph                       │
                       ↓                          │
                      MCP                         │
                       ↓                          │
                Agent Runtime ←───────────────────┘
                       ↓
              Observability / Evaluation
                       ↓
                 Multi-Agent
                       ↓
           Inference / Fine-tuning（概览）
                       ↓
                  面试 / Offer
```

学习过程中会收敛 **多个练习项目**，最终沉淀为 **4 个核心代表作**（LLM CLI、Mini Agent、知识库 Agent、LangGraph Agent 等——细节在后续篇章展开）。

---

## 接下来写什么

系列页已列出分阶段目录；**下一篇计划**从 **Python + LLM 基础** 开始：不依赖框架，用 Python 直接调用 LLM，并讲清一次请求到底发生了什么。

如果你也在走类似路线，欢迎从系列页跟进进度，或在 [GitHub](https://github.com/kele0808) 交流。
