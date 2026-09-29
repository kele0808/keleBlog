---
title: "{{ replace .File.ContentBaseName "-" " " | title }}"
date: {{ .Date }}
draft: true
tags: []
categories: []
# series: "kafka"
# seriesOrder: 2
# project: "kafka-guide"
# prerequisites: ["posts/kafka-source-code-plan"]
# related: []
description: ""
summary: ""
---

<!-- 源码类文章模板。章节是可选结构，用不到的直接删掉，不必填满。 -->

## 问题

这段源码解决什么问题，读完之后能回答哪些具体问题。

## 版本

本文以 <项目> <版本 / commit> 作为源码分析基线。

## 源码入口

## 整体流程

## 关键数据结构

## 核心实现

## 设计原因

为什么这样设计，放弃了哪些方案。

## 实验

<!-- 没有真实数据就写「尚未评测」，不要估算或编造结果。 -->

- 依赖版本：
- 运行命令：
- 数据来源 / 样本规模：
- 预期结果：
- 实际结果：
- 差异与原因：
- 失败条件与局限：

<!-- 性能实验另外记录：硬件、预热、重复次数、P50 / P95 / P99、误差。 -->

## 边界

## 总结

## References
