# 上下文工程深入探讨：构建深度研究智能体

上下文工程需要大量的迭代和仔细的设计决策，才能构建可靠的 AI 智能体。本指南通过开发基本的深度研究智能体，深入探讨上下文工程的实际方面，探索提高智能体可靠性和性能的技巧和设计模式。

---

## 上下文工程的现实

构建有效的 AI 智能体需要对系统提示词和工具定义进行大量调优。该过程涉及花费数小时进行迭代：

- 系统提示词设计和优化
- 工具定义和使用指令
- 智能体架构和通信模式
- 智能体之间的输入/输出规范

不要低估上下文工程所需的工作量。它不是一次性的任务，而是一个显著影响智能体可靠性和性能的迭代过程。

---

## 智能体架构设计

### 原始设计问题

基本的深度研究智能体架构将网络搜索工具直接连接到深度研究智能体。这种设计将太多负担放在单个智能体上，该智能体负责：

- 管理任务（创建、更新、删除）
- 将信息保存到内存
- 执行网络搜索
- 生成最终报告

**这种设计的后果：**

- 上下文变得过长
- 智能体忘记执行网络搜索
- 任务完成更新被遗漏
- 在不同查询中行为不可靠

### 改进的多智能体架构

解决方案是通过引入专用的搜索工作智能体来分离关注点：

**多智能体设计的优势：**

1. **关注点分离**：父智能体处理规划和编排，而搜索工作智能体专门负责执行网络搜索
2. **提高可靠性**：每个智能体都有清晰、专注的职责，减少了遗漏任务或遗忘操作的可能性
3. **模型选择灵活性**：不同的智能体可以使用针对其特定任务优化的不同语言模型
   - 深度研究智能体：使用 Gemini 2.5 Pro 进行复杂规划和推理
   - 搜索工作智能体：使用 Gemini 2.5 Flash 进行更快、更经济的搜索执行

如果您使用其他提供商（如 OpenAI）的模型，可以使用 GPT-5（用于规划和推理）和 GPT-5-mini（用于搜索执行）获得类似的性能。

💡

**设计原则**：分离智能体职责可提高可靠性，并为不同子任务启用经济高效的模型选择。

---

## 系统提示词工程

以下是为在 n8n 中构建的深度研究智能体编写的完整系统提示词：

```
You are a deep research agent who will help with planning and executing search tasks to generate a deep research report.
 
## GENERAL INSTRUCTIONS
 
The user will provide a query, and you will convert that query into a search plan with multiple search tasks (3 web searches). You will execute each search task and maintain the status of those searches in a spreadsheet.
 
You will then generate a final deep research report for the user.
 
For context, today's date is: {{ $now.format('yyyy-MM-dd') }}
 
## TOOL DESCRIPTIONS
 
Below are some useful instructions for how to use the available tools. 
 
Deleting tasks: Use the delete_task tool to clear up all the tasks before starting the search plan. 
 
Planning tasks: You will create a plan with the search tasks (3 web searches) and add them to the Google Sheet using the append_update_task tool. Make sure to keep the status of each task updated after completing each search. Each task begins with a todo status and will be updated to a "done" status once the search worker returns information regarding the search task.
 
Executing tasks: Use the Search Worker Agent tool to execute the search plan. The input to the agent are the actual search queries, word for word. 
 
Use the tools in the order that makes the most sense to you but be efficient. 
```

让我们将其分解为各个部分，并讨论为什么每个部分都很重要：

### 高级智能体定义

系统提示词以智能体角色的明确定义开始：

```
You are a deep research agent who will help with planning and executing search tasks to generate a deep research report.
```

### 通用指令

提供关于智能体工作流程的显式指令：

```
## GENERAL INSTRUCTIONS
 
The user will provide a query, and you will convert that query into a search plan with multiple search tasks (3 web searches). You will execute each search task and maintain the status of those searches in a spreadsheet.
 
You will then generate a final deep research report for the user.
```

### 提供关键上下文

**当前日期信息：**

包含当前日期对于研究智能体获取最新信息至关重要：

```
For context, today's date is: {{ $now.format('yyyy-MM-dd') }}
```

**为什么这很重要：**

- LLM 通常具有比当前日期落后数月或数年的知识截止日期
- 没有当前日期上下文，智能体经常搜索过时的信息
- 这确保了智能体理解诸如"最新新闻"或"最近发展"等查询的时间上下文

在 n8n 中，您可以使用内置函数动态注入当前日期，支持可自定义的格式（仅日期、带日期的时间、特定时区等）。

---

## 工具定义和使用指令

### 详细工具描述的重要性

工具定义通常出现在两个位置：

1. **在系统提示词中**：关于工具功能和使用时机的详细说明
2. **在实际工具实现中**：技术规范和参数

🎯

**关键洞察**：最大的性能改进通常来自于在系统提示词中清晰地解释工具使用方法，而不仅仅是定义工具参数。

### 工具指令示例

系统提示词还包括使用可用工具的详细说明：

```
## TOOL DESCRIPTIONS
 
Below are some useful instructions for how to use the available tools. 
 
Deleting tasks: Use the delete_task tool to clear up all the tasks before starting the search plan. 
 
Planning tasks: You will create a plan with the search tasks (3 web searches) and add them to the Google Sheet using the append_update_task tool. Make sure to keep the status of each task updated after completing each search. Each task begins with a todo status and will be updated to a "done" status once the search worker returns information regarding the search task.
 
Executing tasks: Use the Search Worker Agent tool to execute the search plan. The input to the agent are the actual search queries, word for word. 
 
Use the tools in the order that makes most sense to you, but be efficient. 
```

最初，没有明确的状态定义时，智能体会在不同运行中使用不同的状态值：

- 有时用"pending"，有时用"to-do"
- 有时用"completed"，有时用"done"，有时用"finished"

要明确允许的值。这消除了歧义，确保了一致的行为。

请注意，系统提示词还包括以下指令：

```
Use the tools in the order that makes most sense to you, but be efficient.
```

这个决策背后的推理是什么？

这为智能体提供了优化其执行策略的灵活性。在测试期间，智能体可能会：

- 如果确定足够，只执行 2 次搜索而不是 3 次
- 合并冗余的搜索查询
- 跳过重叠明显的搜索

如果您要求执行所有搜索任务，可以使用以下具体指令：

```
You MUST execute a web search for each and every search task you create.
Do NOT skip any tasks, even if they seem redundant.
```

**何时使用灵活 vs 严格方法：**

- **灵活**：在开发和测试期间，观察智能体决策模式
- **严格**：在生产环境中，一致性和完整性至关重要时

---

## 上下文工程迭代过程

### 改进上下文的迭代性质

上下文工程不是一次性的努力。开发过程包括：

1. 使用基本系统提示词的**初始实现**
2. 使用多样化查询进行**测试**
3. **识别问题**（遗漏任务、错误的状态值、不完整的搜索）
4. **添加特定指令**来解决每个问题
5. **重新测试**以验证改进
6. **重复**循环

### 仍然缺少什么

即使经过多次迭代，仍有进一步改进的机会：

**搜索任务元数据：**

- 增强搜索查询
- 搜索类型（网络搜索、新闻搜索、学术搜索、PDF 搜索）
- 时间段过滤器（今天、上周、上月、去年、全部时间）
- 领域聚焦（技术、科学、健康等）
- 任务执行顺序的优先级级别

**增强搜索规划：**

- 关于如何生成搜索任务的更详细说明
- 搜索查询的首选格式
- 分解复杂查询的指南
- 好的 vs 坏的任务分解示例

**日期范围规范：**

- 有时间限制的搜索的开始日期和结束日期
- 日期参数的格式规范
- 从时间段关键词推断日期范围的逻辑

基于推荐的改进，很容易理解为什么 AI 智能体的网络搜索是一项需要大量上下文工程的挑战性工作。

---

## 高级考量

### 子智能体通信

设计多智能体系统时，请仔细考虑：

**子智能体需要什么信息？**

- 对于搜索工作智能体：只需要搜索查询文本
- 不需要完整上下文或任务元数据
- 保持子智能体输入最小化和专注

**子智能体应该返回什么信息？**

- 搜索结果和相关发现
- 错误状态或失败条件
- 搜索执行的元数据

### 上下文长度管理

随着智能体执行多个任务，上下文会增长：

- 任务历史累积
- 搜索结果增加 token
- 对话历史扩展

**管理上下文长度的策略：**

- 使用单独的智能体来隔离上下文
- 实现记忆管理工具
- 在添加到上下文之前总结长输出
- 在研究查询之间清除任务列表

### 系统提示词中的错误处理

包含故障场景的说明：

```
ERROR HANDLING:
- If search_worker fails, retry once with rephrased query
- If task cannot be completed, mark status as "failed" with reason
- If critical errors occur, notify user and request guidance
- Never proceed silently when operations fail
```

---

## 结论

上下文工程是构建可靠 AI 智能体的关键实践，需要：

- **大量迭代时间**来调优提示词和工具定义
- **仔细的架构决策**关于智能体分离和通信
- **显式指令**消除假设
- **基于观察行为的持续优化**
- **灵活性和控制之间的平衡**

深度研究智能体示例展示了精心的上下文工程如何将不可靠的原型转变为稳健的生产就绪系统。通过应用这些原则——清晰的角色定义、显式的工具指令、关键上下文的提供和迭代改进——您可以构建始终如一地提供高质量结果的 AI 智能体。

