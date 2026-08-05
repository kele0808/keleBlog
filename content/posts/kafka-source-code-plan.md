---
title: "Kafka 源码解析系列 · 开篇"
date: 2026-08-04T22:30:00+08:00
draft: false
tags: ["Kafka", "源码", "分布式"]
categories: ["Kafka 源码解析"]
description: "Kafka 源码解析系列的开篇，聊聊为什么读源码、按什么路径读、以及本系列会覆盖哪些主题。"
---

## 为什么要读 Kafka 源码

很多人学 Kafka 停留在 API 使用层，能发消息、能消费、知道 partition 和 consumer group 的概念，但一遇到线上问题就抓瞎：

- 为什么 Producer 偶尔卡顿几百毫秒？
- ISR 收缩到 0 意味着什么？会丢消息吗？
- Rebalance 为什么这么慢？能优化吗？
- Exactly Once 到底怎么实现的？

这些问题**不读源码是答不好的**。文档能告诉你结论，源码才能告诉你「为什么是这样」和「什么情况下会失效」。

## 阅读路径

我准备按下面的顺序来写，也是我认为的 Kafka 源码最优阅读顺序：

### 第一阶段：客户端（先易后难）

1. **Producer 消息发送全流程**
   - `KafkaProducer.send()` 到底做了什么
   - `RecordAccumulator` 的批量与内存池设计
   - `Sender` 线程的 NIO 模型
   - 幂等 Producer（`PID + Sequence Number`）

2. **Consumer 消息拉取与 Rebalance**
   - `poll()` 循环的秘密
   - `ConsumerCoordinator` 与 GroupCoordinator 的交互
   - 三种 Rebalance 策略对比（Range / RoundRobin / Sticky）
   - Cooperative Rebalance 的增量再平衡

### 第二阶段：Broker（核心）

3. **网络层**
   - Reactor 模式实现（`Acceptor` + `Processor` + `RequestHandler`）
   - 为什么 Kafka 能做到高吞吐

4. **日志存储**
   - Segment、Index、TimeIndex 的文件结构
   - 稀疏索引与二分查找
   - 零拷贝（`sendfile`）在哪里用到

5. **副本机制**
   - Leader、Follower、ISR 的状态机
   - HW 与 LEO 的推进
   - Unclean Leader Election 的取舍

### 第三阶段：高级特性

6. **Controller 与元数据**（从 ZK 到 KRaft）
7. **事务实现**（`__transaction_state` topic 内部机制）
8. **Kafka Streams**（如果精力允许）

## 我读源码的一些方法

分享几点自己总结的经验，供参考：

1. **先跑起来再读**。本地搭 3 节点集群，源码 IDE 打开，debug 一次比看十遍文档强。
2. **带着问题读**。比如"为什么 acks=1 还可能丢消息？"，然后去找答案。
3. **画时序图**。文字读十遍不如画一张图。我会把关键流程都画成图放到文章里。
4. **读测试用例**。Kafka 的单测非常全，很多边界情况在测试里能直接看到。

## 版本说明

本系列基于 **Kafka 3.7.x 源码**（写作时的最新稳定分支）。选这个版本有两个原因：

- KRaft 模式已经 GA，ZK 逐步淘汰，看新版本能少看点"历史包袱"
- 老的 ZK 相关代码大部分还保留，遇到需要对比的地方也能查

---

系列文章持续更新中，第一篇正文 [《Producer 消息发送全流程解析》](#) 敬请期待。
