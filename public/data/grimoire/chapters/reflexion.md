# 自我反思（Reflexion）

自我反思是一个通过语言反馈来强化基于语言的智能体的框架。根据 Shinn 等人（2023）的研究，"自我反思是一种'口头'强化的新范例，它将策略参数化为智能体的记忆编码与 LLM 的参数选择配对。"

在高层，Reflexion 将环境反馈（自由形式语言或标量值）转换为称为**自我反思**的语言反馈，为下一轮 LLM 智能体动作提供上下文。这使智能体能够从先前的错误中快速学习，并在复杂任务上提高性能。

![自我反思框架](/images/grimoire/reflexion.png)

## 三个核心组件

该框架由三个不同的模型组成：

1. **参与者（Actor）**：基于状态观察生成文本和动作。它使用 CoT 和 ReAct 作为底层模型，加上记忆组件用于额外上下文。

2. **评估者（Evaluator）**：评估参与者的输出。它以生成的轨迹（短期记忆）作为输入，并产生奖励分数。不同的任务使用不同的奖励函数——对于决策任务，使用基于 LLM 和基于规则的启发式方法。

3. **自我反思（Self-Reflection）**：生成用于自我改进的口头强化线索。它利用奖励信号、当前轨迹和持久记忆来生成具体的、相关的反馈，存储在记忆组件中。

## 关键流程步骤

核心步骤为：a) 定义任务，b) 生成轨迹，c) 评估，d) 执行自我反思，e) 生成下一个轨迹。Reflexion 通过引入自我评估、自我反思和记忆组件来扩展 ReAct 框架。

![Reflexion 示例](/images/grimoire/reflexion-examples.png)

## 实验结果

实验在多个基准测试上显示出显著的改进：

### 顺序决策（AlfWorld）

ReAct + Reflexion 完成了 130/134 个任务，显著优于原版 ReAct。

![Reflexion ALFWorld 结果](/images/grimoire/reflexion-alfworld.png)

### 问题推理（HotPotQA）

仅需几个学习步骤，Reflexion 就显著优于所有基线。Reflexion + CoT 超越了普通 CoT 和带情节记忆的 CoT。

![Reflexion HotpotQA 结果](/images/grimoire/reflexion-hotpotqa.png)

### 编程（MBPP、HumanEval、Leetcode Hard）

在编写 Python 和 Rust 代码时，Reflexion 通常优于先前的最先进方法。

![Reflexion 编程结果](/images/grimoire/reflexion-programming.png)

## 何时使用 Reflexion

Reflexion 最适合以下场景：

1. **智能体需要从试错中学习**——涉及决策、推理和编程的任务，迭代改进会有所帮助。
2. **传统 RL 方法不切实际**——当训练数据昂贵或模型微调成本高时。Reflexion 是一种不需要微调底层语言模型的轻量级替代方案。
3. **需要细致的反馈**——语言反馈比传统 RL 中使用的标量奖励提供更具体和细粒度的指导。
4. **可解释性和直接记忆很重要**——存储的自我反思使分析和理解智能体的学习过程更加简单。

## 适用任务领域

- **顺序决策**（AlfWorld）
- **推理**（HotPotQA）
- **编程**（HumanEval、MBPP）

## 局限性

- **依赖自我评估能力**：反思需要准确的自我评估，这对于复杂任务可能具有挑战性。预计随着模型的进步会有所改善。
- **长期记忆约束**：使用固定容量的滑动窗口；更复杂的任务可能受益于向量嵌入或 SQL 数据库。
- **代码生成限制**：测试驱动开发在指定准确的输入输出映射方面存在局限性（例如，受硬件影响的非确定性生成器函数）。

## 参考文献

- [Reflexion: Language Agents with Verbal Reinforcement Learning](https://arxiv.org/pdf/2303.11366.pdf)（Shinn 等人，2023）
- [Can LLMs Critique and Iterate on Their Own Outputs?](https://evjang.com/2023/03/26/self-reflection.html)
