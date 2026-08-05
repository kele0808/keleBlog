---
title: "Hello, keleBlog"
date: 2026-08-04T22:00:00+08:00
draft: false
tags: ["随笔"]
categories: ["站内公告"]
description: "keleBlog 上线记录 —— 为什么写博客、会写什么、以及技术栈选型。"
---

## 为什么开这个博客

在工作和学习的过程中，我意识到一个问题：**知识如果只停留在脑子里，就永远只是"知道"，写出来才是"懂了"**。

所以决定开这个博客，用来：

- **沉淀学习笔记**：Kafka、Redis、MySQL、JVM 等中间件源码
- **记录技术思考**：架构决策、踩坑复盘、方案对比
- **探索新领域**：AI（LLM 应用、RAG、Agent）相关的实验与思考

## 会写什么

近期计划的几个系列：

1. **Kafka 源码解析**（连载）
   - Producer 端消息发送流程
   - Broker 端网络模型（Reactor + Selector）
   - 副本同步机制（ISR、HW、LEO）
   - 事务与幂等性实现

2. **Java 集合源码笔记**
   - HashMap 的红黑树化时机
   - ConcurrentHashMap 分段锁到 CAS 的演进
   - CopyOnWrite 系列的适用场景

3. **AI 应用实践**
   - LLM 提示工程的工程化落地
   - RAG 系统的检索优化
   - Agent 框架源码阅读

## 技术栈

- **静态站点生成器**：[Hugo](https://gohugo.io/)（Go 写的，构建快到离谱）
- **主题**：[PaperMod](https://github.com/adityatelange/hugo-PaperMod)（简洁、支持代码高亮、暗色模式）
- **托管**：GitHub Pages
- **CI/CD**：GitHub Actions 自动构建部署

## 一段代码示例

顺便测试一下代码高亮效果：

```java
public class KafkaProducerDemo {
    public static void main(String[] args) {
        Properties props = new Properties();
        props.put("bootstrap.servers", "localhost:9092");
        props.put("key.serializer", "org.apache.kafka.common.serialization.StringSerializer");
        props.put("value.serializer", "org.apache.kafka.common.serialization.StringSerializer");

        try (KafkaProducer<String, String> producer = new KafkaProducer<>(props)) {
            ProducerRecord<String, String> record =
                new ProducerRecord<>("hello-topic", "key", "Hello, Kafka!");
            producer.send(record, (metadata, exception) -> {
                if (exception != null) {
                    exception.printStackTrace();
                } else {
                    System.out.printf("发送成功: topic=%s, partition=%d, offset=%d%n",
                        metadata.topic(), metadata.partition(), metadata.offset());
                }
            });
        }
    }
}
```

## 关于更新频率

**不追求高频，但保证质量**。宁可一个月一篇深度长文，也不刷十篇水货。

欢迎交流 —— 如果你在文章里发现错误，或者有不同看法，随时来 [GitHub Issues](https://github.com/) 拍我。
