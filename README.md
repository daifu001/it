# Nebula · 任务看板

> 一个采用 Linear Aesthetic 风格的任务管理看板应用，纯前端实现，零依赖运行。

## 简介

Nebula 是一个精致的任务管理看板（Kanban Board），采用暗色玻璃拟态设计语言，支持拖拽管理、优先级标记、标签分类、实时搜索与本地持久化。纯 HTML/CSS/JS 实现，无需任何构建工具或后端依赖。

## 功能特性

- **三列看板**：待办 / 进行中 / 已完成，原生 HTML5 拖拽跨列移动与重排
- **任务管理**：新建 / 编辑 / 删除，支持标题、描述、优先级（低/中/高/紧急）、标签
- **实时搜索**：按标题、描述、标签全文搜索
- **优先级筛选**：快速过滤不同优先级任务
- **本地持久化**：基于 localStorage，刷新不丢失数据
- **键盘快捷键**：`⌘K` 搜索、`N` 新建、`Esc` 关闭面板
- **状态统计**：实时显示任务总数、完成数与进度百分比
- **响应式布局**：适配桌面与移动端

## 设计风格

采用 Linear Aesthetic 设计语言：

- 超暗背景（`#060607`）配合环境光晕（Indigo + Purple 双色辉光）
- 微边框（1px `rgba(255,255,255,0.08)`）与玻璃拟态（backdrop-blur）
- Shimmer 光扫动效与呼吸感脉冲指示
- Inter + JetBrains Mono 字体组合，紧凑字距（-0.01em）

## 技术栈

- 纯 HTML5 / CSS3 / JavaScript（ES6+）
- localStorage 数据持久化
- HTML5 Drag and Drop API
- 无框架、无构建工具、无后端依赖

## 快速开始

```bash
# 方式一：Python 启动（推荐，零依赖）
python -m http.server 8000

# 方式二：任意静态服务器
npx http-server -p 8000
```

浏览器打开 http://127.0.0.1:8000/ 即可使用。

## 项目结构

```
├── index.html      # 看板页面结构
├── styles.css      # Linear Aesthetic 样式
├── app.js          # 看板交互逻辑（拖拽/CRUD/搜索/持久化）
└── start_server.bat # Windows 启动脚本
```

## 截图

看板包含三列任务流、顶部搜索栏、底部状态栏，支持拖拽卡片在列间移动，点击卡片编辑详情，悬停时触发 shimmer 光扫动效。