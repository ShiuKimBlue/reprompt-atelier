# 深度智能体

当今大多数智能体都是浅层的。

它们在长周期、多步骤问题上（例如深度研究或智能体编码）很容易崩溃。

但这种情况正在迅速改变！

我们正在进入"深度智能体"时代——能够进行战略性规划、记忆和智能委派，以解决非常复杂问题的系统。

[LangChain](https://docs.langchain.com/labs/deep-agents/overview)、[Claude Code](https://www.anthropic.com/engineering/building-agents-with-the-claude-agent-sdk)、[Philipp Schmid](https://www.philschmid.de/agents-2.0-deep-agents) 等公开资料都在记录这个概念。

以下是一个深度智能体示例，它被构建为面向学习者的客户支持系统，用于回答培训内容、项目要求和资料检索相关的问题：

![customer support deep agent](/images/grimoire/customer-support-deep-agent.png)

以下是深度智能体背后的核心理念概述（基于我自己的思考和从他人那里收集的笔记）：

## 规划

![cs planning](/images/grimoire/cs-planning.png)

深度智能体不会在单个上下文窗口内进行临时推理，而是维护结构化的任务计划，可以更新、重试和恢复。可以将其视为引导智能体实现长期目标的动态待办事项列表。要体验这一点，只需尝试使用 Claude Code 或 Codex 进行规划；在执行任何任务之前启用规划功能，结果会显著改善。

我们最近还撰写了关于使用 Claude Code 进行更长时间头脑风暴的力量的文章，这展示了规划、专家上下文和人在回路中的力量（您的专业知识在使用深度智能体时为您提供了重要的优势）。规划对于长周期问题（如科学发现智能体）也至关重要。

## 编排器和子智能体架构

![cs subagents](/images/grimoire/cs-subagents.png)

一个大型智能体（通常具有非常长的上下文）已经不够了。我曾见过[反对](https://cognition.ai/blog/dont-build-multi-agents)多智能体系统而支持单体系统的论点，但我对此持怀疑态度。

编排器-子智能体架构是当今您可以利用的最强大的基于 LLM 的智能体架构之一，适用于您能想象到的任何领域。编排器管理专门的子智能体，如搜索智能体、编码器、知识库检索器、分析师、验证器和写作者，每个子智能体都有自己的清晰上下文和领域焦点。

编排器智能地进行委派，子智能体高效执行。编排器将它们的输出整合为连贯的结果。Claude Code 推广了在编码和子智能体中使用这种方法，事实证明，它们在高效管理上下文（通过关注点分离）方面特别有用。

我在[这里](https://x.com/omarsar0/status/1960877597191245974)和[这里](https://x.com/omarsar0/status/1971975884077965783)写了一些关于使用编排器和子智能体的力量的笔记。

## 上下文检索和智能体搜索

![cs persistent storage](/images/grimoire/cs-persistent-storage.png)

深度智能体不仅仅依赖对话历史。它们将中间工作存储在外部存储中，如文件、笔记、向量或数据库，使它们能够引用重要内容而不会使模型上下文过载。高质量的结构化记忆是一件美妙的事情。

查看最近的工作，如 [ReasoningBank](https://arxiv.org/abs/2509.25140) 和 [Agentic Context Engineering](https://arxiv.org/abs/2510.04618)，了解一些关于如何更好地优化记忆构建和检索的非常酷的想法。使用编排器-子智能体架构意味着您还可以利用混合记忆技术（例如智能体搜索 + 语义搜索），并可以让智能体决定使用哪种策略。

## 上下文工程

与这些类型的智能体交互时，您能做的最糟糕的事情之一是指令/提示不够具体。提示工程过去是、现在也是重要的，但我们将使用新术语[上下文工程](https://www.promptingguide.ai/guides/context-engineering-guide)来强调为智能体构建上下文的重要性。指令需要更明确、更详细、更有意图地定义何时规划、何时使用子智能体、如何命名文件以及如何与人类协作。上下文工程的一部分还涉及结构化输出、系统提示词优化、上下文压缩、评估上下文有效性和[优化工具定义](https://www.anthropic.com/engineering/writing-tools-for-agents)等方面的工作。

阅读我们之前的上下文工程指南了解更多：[上下文工程深入探讨](https://www.promptingguide.ai/guides/context-engineering-guide)

## 验证

![cs verification agent](/images/grimoire/cs-verification-agent.png)

除了上下文工程之外，验证是智能体系统中最重要的组成部分之一（虽然讨论较少）。验证归结为验证输出，可以是自动化的（LLM-as-a-Judge）或由人类完成。由于现代 LLM 在生成文本（在数学和编码等领域）方面的有效性，很容易忘记它们仍然存在幻觉、谄媚、提示注入和许多其他问题。验证有助于使您的智能体更可靠、更生产就绪。您可以通过利用系统化的评估管道来构建好的验证器。

## 最后的话

这是我们在构建 AI 智能体方面的一个巨大转变。深度智能体也感觉是下一步的重要构建模块：能够代表我们采取行动的个性化主动智能体。我将在未来的文章中更多地写关于主动智能体的内容。



文章中的图表描述了一个学生需要为课程最终项目构建的智能体 RAG 系统。
