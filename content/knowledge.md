---
title: "知识"
description: "按主题整理已发布的文章和项目。只列已经写出来的内容，还没写的主题标注为规划中。"
hidemeta: true
ShowToc: false
ShowReadingTime: false
ShowWordCount: false
disableShare: true
---

## 后端与分布式系统

### Kafka

- [Kafka 源码解析系列 · 开篇]({{< relref "/posts/kafka-source-code-plan" >}})：为什么读源码、阅读路线与版本基线
- 项目：[kafkaGuide]({{< relref "/projects" >}}#kafka-guide)，边读源码边实现 MiniKafka 的存储层
- Producer 发送链路、Broker、副本与事务：规划中

### Java 集合 / JVM / Spring Boot

规划中。

## 机器学习

先看 [机器学习笔记 · 从线性回归到无监督学习]({{< relref "/posts/ml-notes-foundations" >}}) 了解主线，再按下面的顺序读 [系列正文]({{< relref "/series/ml" >}})。

### 基本概念

- [人工智能通识与机器学习是什么]({{< relref "/posts/ml-00-intro" >}})
- [机器学习的类型]({{< relref "/posts/ml-01-types" >}})：监督、无监督、强化学习

### 回归与优化

- [线性回归]({{< relref "/posts/ml-02-linear-regression" >}})：模型、MSE 损失、训练流程
- [梯度下降]({{< relref "/posts/ml-03-gradient-descent" >}})：学习率实验、Momentum / Adam、BGD / SGD / Mini-batch

### 数据与评估

- [数据预处理]({{< relref "/posts/ml-04-preprocessing" >}})：防泄漏、编码、标准化、Pipeline
- [模型评估]({{< relref "/posts/ml-05-evaluation" >}})：回归指标、残差分析、交叉验证
- [拟合诊断]({{< relref "/posts/ml-06-fitting" >}})：学习曲线、L1 / L2 正则化

### 分类与树模型

- [逻辑回归]({{< relref "/posts/ml-07-logistic-regression" >}})：交叉熵、混淆矩阵、ROC / AUC
- [决策树]({{< relref "/posts/ml-08-decision-tree" >}})
- [随机森林]({{< relref "/posts/ml-09-random-forest" >}})
- [Boosting 模型]({{< relref "/posts/ml-10-boosting" >}})：GBDT、XGBoost、LightGBM、CatBoost

### 无监督学习

- [K-Means 聚类]({{< relref "/posts/ml-11-kmeans" >}})
- [PCA 降维]({{< relref "/posts/ml-12-pca" >}})

### 总结

- [机器学习总结]({{< relref "/posts/ml-13-summary" >}})

## AI 应用工程

- [Agent Infra 学习路线 · 开篇]({{< relref "/posts/agent-infra-roadmap" >}})：一年期路线与阶段划分
- RAG：项目 [RAGForge]({{< relref "/projects" >}}#ragforge) 进行中，文章规划中
- LLM / Tool Calling / MCP / Agent Runtime：规划中
