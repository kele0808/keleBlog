# keleBlog 改造实施 Prompt

你现在负责对我的 Hugo 博客 `keleBlog` 进行改造。

## 一、项目背景

博客：

```text
https://kele0808.github.io/keleBlog/
```

技术栈：

```text
Hugo
PaperMod
GitHub Pages
```

目标不是更换主题，也不是做一个炫酷的个人主页。

最终目标：

> 在保留 Hugo + PaperMod 的前提下，将 keleBlog 逐步升级为「个人技术主页 + 技术博客 + 知识导航 + 项目作品集」。

我的技术主线希望逐渐体现：

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
Agent Infrastructure
```

但这只是个人学习/技术演进路线，**不要把它实现成强制技术依赖链**。

---

# 二、最重要的执行原则

严格遵守以下原则：

```text
真实成果 > 技术名词堆叠
内容准确 > 首页包装
可复现证据 > 功能宣传
阅读路径 > 栏目数量
复用现有实现 > 推倒重建
稳定 URL > 目录整齐
维护成本可控 > 一次性做全
```

尤其注意：

1. 不要为了“看起来高级”增加大量栏目。
2. 不要重写已经存在并正常工作的功能。
3. 不要把规划中的项目包装成已经完成的项目。
4. 不要虚构项目功能、性能数据、用户数据或实验结果。
5. 不要批量改变已有文章 URL。
6. 不要更换 Hugo / PaperMod。
7. 不要大规模重写 CSS。
8. 不要引入复杂动画、3D 或重型前端框架。
9. 不要为了满足本 Prompt 而制造空栏目。
10. 所有修改都必须能够解释“为什么需要”。

---

# 三、改造依据

项目中有一份博客改造评审文档：

```text
keleBlog 改造评审与实施建议
```

请以该文档作为本次改造的主要产品需求和验收依据。

其中最重要的结论是：

> 让已有成果更可信、更容易找到、更容易验证，而不是先增加更多栏目。

改造顺序：

```text
内容准确性与站点可用性
        ↓
作者定位与真实项目展示
        ↓
知识关系与阅读路径
        ↓
分享展示与自动化维护
```

---

# 四、禁止直接开始大改

第一步不要修改代码。

先完成项目审计。

执行：

```bash
git status
git branch --show-current
git log -5 --oneline
```

然后检查：

```text
hugo.toml

layouts/index.html
layouts/single.html

layouts/_partials/home_info.html
layouts/_partials/related_posts.html
layouts/_partials/series_list.html
layouts/_partials/series_card.html
layouts/_partials/series_posts.html
layouts/_partials/header_search.html
layouts/_partials/extend_head.html

assets/js/header-search.js
assets/css/extended/custom.css

data/series/*.yaml

archetypes/default.md

.github/workflows/deploy.yml
```

同时检查：

```text
content/
static/
assets/
```

---

# 五、审计要求

先回答下面的问题。

## 5.1 首页

确认：

* 首页当前结构
* Hero 当前实现
* 精选文章是否已经存在
* 正在写什么是否已经存在
* 最新文章是否已经存在
* Series 是否已经存在
* 是否存在重复组件

不要把已有功能误判成缺失功能。

---

## 5.2 Series

确认当前实际状态：

```text
Machine Learning
Kafka
Agent Infra
Java
JVM
Spring Boot
AI 应用实践
```

分别统计：

```text
已发布文章
规划文章
实际展示位置
```

重点确认：

* 0/N 系列在哪里显示
* 首页是否显示 0/N
* Series 页面是否显示 0/N
* 系列数量是否自动计算
* seriesOrder 是否存在断档
* 是否存在重复 order
* 前后篇导航如何计算

---

## 5.3 Related Posts

检查：

```text
layouts/_partials/related_posts.html
```

确认当前推荐算法。

重点回答：

```text
优先级是什么？
是否基于 tag？
是否基于 category？
不足时是否使用最新文章兜底？
```

不要重新实现一个已经存在的 Related Posts。

---

## 5.4 搜索

检查：

```text
assets/js/header-search.js
layouts/_partials/header_search.html
```

确认：

* 搜索索引生成方式
* 中文索引
* 英文索引
* 空结果
* 加载失败
* debounce
* 快捷键
* focus
* Esc
* 移动端

---

## 5.5 SEO

确认实际存在：

```text
description
canonical
OpenGraph
Twitter Card
RSS
sitemap
robots.txt
favicon
structured data
```

不要看到配置存在就认为功能一定正确。

---

## 5.6 Projects

检查 GitHub 上实际项目情况。

重点：

```text
RAGForge
daily-learnable
Nexus
AgentGuide
```

不要仅根据项目名字推断能力。

必须读取：

```text
README
目录结构
实际代码
release / demo
```

然后区分：

```text
原创项目
进行中的工程实践
fork
学习项目
开源贡献
```

---

# 六、完成审计后先输出报告

不要立即修改。

先给我一份：

```text
## Audit Report

### 当前已经存在

### 当前确实缺失

### 当前存在但实现不完整

### 原方案中不需要重复建设的部分

### P0 修改建议

### P1 修改建议

### P2 修改建议

### P3 修改建议

### 风险

### 建议第一批修改范围
```

然后等待确认。

---

# 七、第一批实施：P0

得到确认后，优先只修改 P0。

---

## P0-1 首页 Hero

目标：

从：

```text
Hi，我是 kele
这里是我的学习笔记与技术博客
```

逐渐升级为：

```text
Hi，我是 kele

从 Java 后端与分布式系统出发，
探索 LLM、RAG 与 Agent 工程。

通过源码阅读、可复现实验和项目实践，
记录技术理解与设计取舍。
```

注意：

不要把“正在学习”写成：

```text
AI Expert
Agent Engineer
AI Infrastructure Expert
```

除非项目事实明确支持。

---

## P0-2 首页结构

第一版首页只保留：

```text
Hero
 ↓
代表项目
 ↓
精选内容
 ↓
最新更新
 ↓
简洁 Footer
```

不要一次加入：

```text
Currently Learning
My Learning Path
Knowledge Map
完整 About
```

这些内容可以以后逐步加入。

---

# 八、P0-3 Projects

增加 Projects 页面。

但是只展示真实、有证据的项目。

项目卡片至少包含：

```text
项目名称

解决什么问题

作者实际完成了什么

当前状态

已实现能力

尚未实现的能力

GitHub

关联文章

最近核验日期
```

---

## RAGForge

如果实际代码和 README 仍然保持当前状态：

定位为：

```text
进行中的 RAG 工程实践
```

不要宣传成：

```text
企业级 RAG 平台
完整权限系统
完整评测平台
生产级平台
```

除非代码和证据能够支持。

---

## daily-learnable

定位重点：

```text
学习情报自动化工具
```

重点说明：

```text
自动搜索
筛选
整理
产物
人工复核边界
```

---

## AgentGuide

如果仍然是 fork：

不要作为原创项目展示。

可以放：

```text
Learning / Open Source
```

如果存在自己的修改，再明确说明：

```text
相对 upstream 做了什么
```

不要把 fork 包装成原创。

---

## Nexus

如果 README / 代码仍不足以证明：

```text
大型代码库理解
Java
MCP
Agent
```

不要直接使用这些宣传语。

先补充：

```text
项目目标
已实现功能
架构
运行方法
Demo
```

然后再决定首页如何展示。

---

# 九、P0-4 Series

首页隐藏：

```text
0/N
```

系列总页可以保留：

```text
规划中
```

但不要显示成：

```text
0/8
0/7
```

进行中的系列优先显示：

```text
已发布 1 篇
```

而不是：

```text
7%
11%
```

因为文章数量不是知识掌握程度。

---

# 十、P0-5 内容正确性修复

优先检查：

## Kafka

修正：

```text
Kafka 3.7.x 为写作时最新稳定分支
```

这一类与文章发布日期不一致的描述。

如果 3.7 是研究基线：

明确写：

```text
本文以 Kafka 3.7.x 作为源码分析基线。
```

而不是描述成：

```text
当前最新稳定版本
```

---

## 空链接

检查：

```text
href=""
href="#"
```

特别是：

```text
Producer 消息发送全流程解析
```

未发布前：

```text
纯文本预告
```

发布后：

```text
真实 URL
```

不要保留空链接。

---

# 十一、P0-6 英文站

先不要擅自决定。

先确认：

```text
/en/
```

和：

```text
/en/index.json
```

当前实际内容。

如果英文首页回退中文文章，而英文搜索索引只有 About：

提出三个方案：

```text
A
真正维护英文内容

B
保留中文回退，但搜索保持一致

C
暂时只维护英文 About
```

选择方案后再修改。

不要自行创造英文翻译内容。

---

# 十二、P0-7 About

不要推倒重写。

保留已有：

```text
个人背景
Java
后端
分布式
Kafka
AI
写作动机
GitHub
博客技术栈
```

补充：

```text
代表项目
代表文章
当前正在验证的问题
工程实践
设计取舍
```

删除：

```text
不准备维护的联系方式占位
```

---

# 十三、P0-8 ML 配图

检查当前文章中的：

```text
图片占位符
```

尤其是：

```text
梯度下降
数据预处理
模型评估
拟合诊断
逻辑回归
决策树
随机森林
Boosting
K-Means
PCA
```

不要为了数量补图。

优先补：

```text
解释核心概念所必需的图
实验结果图
算法流程图
架构图
```

如果某张图不是必要的：

可以删除对应占位，并修改依赖该图的文字。

---

# 十四、第一批完成后必须执行

运行：

```bash
hugo --gc --minify
```

确认：

```text
Build 成功
无明显 warning
```

然后检查：

```text
首页
About
Projects
Series
代表文章
搜索
RSS
sitemap
robots
```

检查：

```text
空 href
失效内部链接
图片路径
canonical
页面 title
description
```

---

# 十五、第二批：P1

第一批稳定后，再实施：

```text
Knowledge
Related Posts 优化
Prerequisites
Next
文章模板
实验复现
```

---

# 十六、Knowledge 页面

不要做复杂知识图谱。

第一版使用 Markdown。

结构：

```text
Knowledge

Backend & Distributed Systems

Machine Learning

AI Application Engineering
```

每个主题只放真实存在的文章。

没有文章的主题：

```text
规划中
```

不要创建空页面。

---

# 十七、Related Posts

修改推荐优先级：

```text
1. 人工指定关联文章
2. 同系列前后篇
3. 明确主题关系
4. 项目关联
5. 先修关系
```

如果没有合适文章：

```text
少展示
```

不要：

```text
用最新文章硬凑
```

尤其避免：

```text
Agent 文章
↓
PCA
↓
K-Means
```

这种语义关系很弱的推荐。

---

# 十八、文章模板

增加三个 archetype / 模板方向。

## Source Code

```text
问题
版本
源码入口
整体流程
关键数据结构
核心实现
设计原因
实验
边界
总结
References
```

## Algorithm

```text
问题
直觉
数学定义
推导
算法
实现
示例
局限
References
```

## Project

```text
目标
约束
方案比较
实现
验证
设计取舍
问题
后续计划
```

注意：

模板是可选结构。

不要要求每篇文章强行填满所有章节。

---

# 十九、实验标准

以后新增实验至少记录：

```text
依赖版本
运行命令
数据来源
随机种子
样本规模
预期结果
实际结果
差异
失败条件
局限
```

性能实验增加：

```text
硬件
预热
重复次数
P50
P95
P99
误差
```

没有真实数据：

```text
明确写尚未评测
```

禁止：

```text
猜测数据
虚构 benchmark
```

---

# 二十、P2

P1 稳定以后再做：

```text
Featured Articles
Currently Learning
Project ↔ Article
Article ↔ GitHub
```

不要提前做。

---

# 二十一、P3

最后再处理：

```text
OG Image
RSS 入口
Footer
Analytics
自动化质量检查
移动端
弱网
键盘导航
公式资源
```

---

# 二十二、不要做的事情

未经我确认，不要：

```text
❌ 更换 Hugo
❌ 更换 PaperMod
❌ 更换主题
❌ 大规模重写 CSS
❌ 引入 React / Vue
❌ 引入后端
❌ 增加数据库
❌ 批量修改文章 URL
❌ 批量移动 content 目录
❌ 删除已有文章
❌ 删除已有功能
❌ 虚构项目成果
❌ 虚构 benchmark
❌ 虚构用户数据
❌ 自动翻译全部英文内容
❌ 为了好看增加大量动画
```

---

# 二十三、Git 要求

每一个逻辑阶段单独 commit。

例如：

```text
docs(blog): audit current site structure

feat(home): refine homepage positioning

feat(projects): add verified project showcase

fix(series): hide unpublished series from homepage

fix(kafka): correct version baseline and empty link

fix(search): align English search index

feat(knowledge): add lightweight knowledge navigation
```

不要一次提交：

```text
feat: redesign blog
```

这种巨型 commit。

---

# 二十四、每个阶段都必须自检

修改完成以后输出：

```text
## Changed

### Files

...

### What changed

...

### Why

...

## Validation

### Hugo build

PASS / FAIL

### Internal links

PASS / FAIL

### Images

PASS / FAIL

### Search

PASS / FAIL / NOT TESTED

### Mobile

PASS / FAIL / NOT TESTED

### SEO

PASS / FAIL / PARTIAL

## Risks

...

## Next

...
```

---

# 二十五、遇到不确定的问题必须停下来

以下情况不要猜：

```text
项目是否原创
项目是否已经完成
某个功能是否存在
某个文章是否已经发布
某个 URL 是否应该迁移
英文内容是否应该翻译
某个性能数据是多少
```

如果无法从代码、README、文章或 Git 历史确认：

```text
标记为 UNKNOWN
```

并告诉我。

---

# 二十六、最终验收目标

最终网站应该形成：

```text
                  keleBlog
                     │
       ┌─────────────┼─────────────┐
       │             │             │
     About        Knowledge      Projects
       │             │             │
       └─────────────┼─────────────┘
                     │
                  Articles
                     │
          ┌──────────┼──────────┐
          │          │          │
       Backend       AI       Agent
          │          │          │
        Kafka        ML        RAG
        JVM          LLM       MCP
        Spring                 Runtime
```

最终目标：

> 访问者可以快速知道作者是谁、正在研究什么、做过什么，并且能够通过文章、项目和源码验证这些信息。

而不是单纯追求：

```text
页面更多
栏目更多
动画更多
文章数量更多
```

---

# 二十七、最终执行策略

严格按照：

```text
Audit
 ↓
报告
 ↓
确认
 ↓
P0
 ↓
Build / Validate
 ↓
Commit
 ↓
P1
 ↓
Build / Validate
 ↓
Commit
 ↓
P2
 ↓
Build / Validate
 ↓
P3
```

执行。

**现在只做 Audit，不要直接修改代码。**

完成 Audit 后，把审计报告交给我确认。
