# keleBlog

学习笔记与技术博客 —— Kafka、AI 与后端那些事。

基于 [Hugo](https://gohugo.io/) + [PaperMod](https://github.com/adityatelange/hugo-PaperMod) 主题构建，托管在 GitHub Pages。

## 目录结构

```
keleBlog/
├── archetypes/          # 新文章模板
├── assets/              # 需要经过 Hugo Pipes 处理的资源
├── content/             # 所有 Markdown 内容
│   ├── archives.md      # 归档页
│   ├── search.md        # 搜索页
│   └── posts/           # 博客文章
├── data/                # 数据文件（YAML/JSON/TOML）
├── i18n/                # 多语言翻译
├── layouts/             # 自定义模板（覆盖主题）
├── static/              # 直接拷贝到根目录的静态文件（favicon 等）
├── themes/PaperMod/     # 主题
├── hugo.toml            # 站点配置
└── .github/workflows/   # GitHub Actions 自动部署
```

## 本地开发

### 前置依赖

- Hugo Extended v0.148+ （已安装到 `~/.local/bin/hugo`）

### 常用命令

```bash
# 启动本地开发服务器（含草稿，热重载）
hugo server -D

# 只预览已发布的文章
hugo server

# 构建静态站点（输出到 public/）
hugo --gc --minify

# 新建一篇文章
hugo new content posts/my-new-post.md
```

启动后访问 http://localhost:1313 预览。

## 写作流程

1. 新建文章：`hugo new content posts/文件名.md`
2. 编辑 Markdown（front matter 的 `draft: true` 状态下不会发布）
3. 本地 `hugo server -D` 预览
4. 把 `draft` 改为 `false`（或直接删掉这行）
5. `git add . && git commit -m "post: 标题" && git push`
6. GitHub Actions 自动构建并部署到 GitHub Pages

## Front Matter 模板

```yaml
---
title: "文章标题"
date: 2026-08-04T22:00:00+08:00
draft: false
tags: ["Kafka", "源码"]
categories: ["Kafka 源码解析"]
description: "SEO 描述，也是首页摘要"
cover:
    image: ""       # 封面图
    alt: ""
    caption: ""
    relative: false
    hidden: false
---
```

## 部署

推送到 `main` 分支后，GitHub Actions 会自动：

1. 拉取代码 + 子模块
2. 安装 Hugo Extended
3. 执行 `hugo --gc --minify`
4. 部署构建产物到 GitHub Pages

**首次使用需要在 GitHub 仓库设置里开启 Pages：**

`Settings` → `Pages` → `Build and deployment` → `Source` 选择 **GitHub Actions**。

## 后续待办

- [ ] 替换 `hugo.toml` 中的 `<GITHUB_USERNAME>` 为真实用户名
- [ ] 添加个人 favicon（放到 `static/favicon.ico`）
- [ ] 接入 [Giscus](https://giscus.app/) 评论系统
- [ ] 绑定自定义域名（可选）
- [ ] 添加 Google Analytics 或统计代码（可选）

## 许可

- 文章内容：[CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/)
- 主题：PaperMod，遵循其自身 MIT 协议
