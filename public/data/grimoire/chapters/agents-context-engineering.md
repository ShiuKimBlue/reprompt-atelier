# 为什么需要上下文工程？

上下文工程（Context Engineering）是构建可靠且有效的 AI 智能体的关键实践。本指南通过构建深度研究智能体的实际案例，探讨上下文工程的重要性。

上下文工程涉及精心设计和优化提示词、指令和约束条件，以引导 AI 智能体的行为并实现期望的结果。

## 什么是上下文工程？

上下文工程是设计、测试和迭代提供给 AI 智能体的上下文信息的过程，以塑造其行为并提高任务性能。与简单的单次 LLM 调用的提示工程不同，智能体的上下文工程包括（但不限于）：

- **系统提示词**：定义智能体行为和能力
- **任务约束**：引导决策制定
- **工具描述**：澄清何时以及如何使用可用的函数/工具
- **记忆管理**：跟踪多个步骤之间的状态
- **错误处理模式**：实现稳健执行

## 构建深度研究智能体：案例研究

让我们通过一个示例来探索上下文工程原则：一个执行网络搜索并生成报告的最小深度研究智能体。

### 上下文工程的挑战

在构建此智能体系统的第一版时，初始实现揭示了几个需要仔细上下文工程的行为问题：

#### 问题 1：不完整的任务执行

**问题**：在运行智能体工作流时，编排器智能体经常创建三个搜索任务，但只执行其中两个的搜索，跳过第三个任务而没有明确的理由。

**根本原因**：智能体的系统提示词缺少关于任务完成要求的明确约束。智能体对哪些搜索是必要的做出了假设，导致不一致的行为。

**解决方案**：有两种方法：

1. **灵活方法**（当前）：允许智能体决定哪些搜索是必要的，但要求对跳过的任务提供明确的推理
2. **严格方法**：添加明确的约束，要求执行所有计划的任务

系统提示词增强示例：

```
You are a deep research agent responsible for executing comprehensive research tasks.

TASK EXECUTION RULES:
- For each search task you create, you MUST either:
  1. Execute a web search and document findings, OR
  2. Explicitly state why the search is unnecessary and mark it as completed with justification

- Do NOT skip tasks silently or make assumptions about task redundancy
- If you determine tasks overlap, consolidate them BEFORE execution
- Update task status in the spreadsheet after each action
```

#### 问题 2：缺乏调试可见性

**问题**：没有适当的日志记录和状态跟踪，很难理解智能体为什么做出某些决策。

**解决方案**：对于本示例，使用电子表格或文本文件（为了简单起见）实现任务管理系统会有所帮助，包含以下字段：

- 任务 ID
- 搜索查询
- 状态（todo, in_progress, completed）
- 结果摘要
- 时间戳

这种可见性可以实现：

- 实时调试智能体决策
- 理解任务执行流程
- 识别行为模式
- 用于迭代改进的数据

### 上下文工程最佳实践

基于本案例研究，以下是有效上下文工程的关键原则：

#### 1. 消除提示歧义

**错误示例：**

```
Perform research on the given topic.
```

**正确示例：**

```
Perform research on the given topic by:
1. Breaking down the query into 3-5 specific search subtasks
2. Executing a web search for EACH subtask using the search_tool
3. Documenting findings for each search in the task tracker
4. Synthesizing all findings into a comprehensive report
```

#### 2. 使期望明确化

不要假设智能体知道你想要什么。要明确以下内容：

- 必需操作 vs 可选操作
- 质量标准
- 输出格式
- 决策标准

#### 3. 实现可观察性

在智能体系统中构建调试机制：

- 记录所有智能体决策和推理
- 在外部存储中跟踪状态变化
- 记录工具调用及其结果
- 捕获错误和边缘情况

⚠️

密切关注智能体系统的每次运行。奇怪的行为和边缘情况是改进上下文工程的机会。

#### 4. 基于行为迭代

上下文工程是一个迭代过程：

1. **部署**带有初始上下文的智能体
2. **观察**生产环境中的实际行为
3. **识别**与预期行为的偏差
4. **优化**系统提示词和约束条件
5. **测试**并验证改进
6. **重复**

#### 5. 平衡灵活性和约束

考虑以下权衡：

- **严格约束**：更可预测但适应性较差
- **灵活指导**：适应性更强但可能不一致

根据用例需求进行选择。

## 高级上下文工程技巧

### 分层上下文架构

上下文工程适用于 AI 智能体构建过程的所有阶段。根据 AI 智能体的不同，有时将上下文视为层次结构会有所帮助。对于我们的基本智能体系统，我们可以将上下文组织为层次结构：

1. **系统层**：核心智能体身份和能力
2. **任务层**：当前任务的特定指令
3. **工具层**：每个工具的描述和使用指南
4. **记忆层**：相关的历史上下文和学习成果

### 动态上下文调整

另一种方法是根据任务复杂性、可用资源、先前执行历史和错误模式动态调整上下文。基于我们的示例，我们可以根据以下因素调整上下文：

- 任务复杂性
- 可用资源
- 先前执行历史
- 错误模式

### 上下文验证

评估是确保上下文工程技术按预期为 AI 智能体工作的关键。在部署之前，验证你的上下文设计：

- **完整性**：是否涵盖了所有重要场景？
- **清晰性**：是否无歧义？
- **一致性**：不同部分是否对齐？
- **可测试性**：能否验证行为？

## 常见的上下文工程陷阱

以下是构建 AI 智能体时需要避免的一些常见上下文工程陷阱：

### 1. 过度约束

**问题**：太多规则使智能体不灵活，无法处理边缘情况。

**示例**：

```
NEVER skip a search task.
ALWAYS perform exactly 3 searches.
NEVER combine similar queries.
```

**更好的方法**：

```
Aim to perform searches for all planned tasks. If you determine that tasks are redundant, consolidate them before execution and document your reasoning.
```

### 2. 规格不足

**问题**：模糊的指令导致不可预测的行为。

**示例**：

```
Do some research and create a report.
```

**更好的方法**：

```
Execute research by:
1. Analyzing the user query to identify key information needs
2. Creating 3-5 specific search tasks covering different aspects
3. Executing searches using the search_tool for each task
4. Synthesizing findings into a structured report with sections for:
   - Executive summary
   - Key findings per search task
   - Conclusions and insights
```

### 3. 忽略错误情况

**问题**：上下文没有指定出错时的行为。

**解决方案**：在某些情况下，为 AI 智能体添加错误处理指令会有所帮助：

```
ERROR HANDLING:
- If a search fails, retry once with a rephrased query
- If retry fails, document the failure and continue with remaining tasks
- If more than 50% of searches fail, alert the user and request guidance
- Never stop execution completely without user notification
```

## 衡量上下文工程的成功

跟踪以下指标以评估上下文工程的有效性：

1. **任务完成率**：成功完成任务的百分比
2. **行为一致性**：智能体在相似输入上的行为相似度
3. **错误率**：失败和意外行为的频率
4. **用户满意度**：输出的质量和有用性
5. **调试时间**：识别和修复问题所需的时间

重要的是不要将上下文工程视为一次性活动，而是需要以下持续实践：

- 对智能体行为的**系统性观察**
- 对失败和边缘情况的**仔细分析**
- 对指令和约束的**迭代优化**
- 对更改的**严格测试**

我们将在即将发布的指南中更详细地介绍这些原则。通过应用这些原则，您可以构建可靠、可预测且能有效解决复杂任务的 AI 智能体系统。
