# 推理 LLM 指南

## 什么是推理 LLM？

大型推理模型（LRM），简称推理 LLM，是明确训练以执行原生思考或思维链（Chain-of-Thought）的模型。流行的推理模型示例包括 Gemini 2.5 Pro、Claude 3.7 Sonnet 和 o3。

**可尝试的提示（适用于 ChatGPT (o3) 和 Gemini 2.5 Pro (AI Google Studio)）：**

```
What is the sum of the first 50 prime numbers? Generate and run Python code for the calculation, and make sure you get all 50. Provide the final sum clearly.
```

## 顶级推理模型

以下是流行推理模型的摘要，包括其特点和优势。

[Reasoning LLMs [WIP]](https://docs.google.com/spreadsheets/d/1Ru5875NC9PdKK19SVH54Y078Mb4or-ZLXqafnqPDxlY/edit?usp=sharing)

以下是跟踪推理模型基准性能的一些来源：

- [Chatbot Arena LLM 排行榜](https://beta.lmarena.ai/leaderboard)
- [General Reasoning](https://gr.inc/)
- [Agent Leaderboard - a Hugging Face Space by galileo-ai](https://huggingface.co/spaces/galileo-ai/agent-leaderboard)

## 推理模型设计模式和用例

### 智能体系统的规划

构建智能体系统时，**规划**是使系统更好地执行复杂任务的重要组成部分。例如，构建深度研究智能体系统时，规划有助于规划实际搜索并在智能体系统执行任务时提供指导。以下示例显示了一个搜索智能体，它首先进行规划（分解查询），然后编排和执行搜索：

![orchestrator worker LI 1](/images/grimoire/orchestrator_worker_LI_1.JPG)

### 智能体 RAG

**智能体 RAG** 是一种利用推理模型构建智能体 RAG 应用的系统，涉及在复杂知识库或来源上的高级工具使用和推理。它可以包括利用**检索智能体**配合推理链/工具，通过工具/函数调用路由需要复杂推理的复杂查询/上下文。

![agentic rag](/images/grimoire/agentic_rag.JPG)

以下是使用 n8n 构建的智能体 RAG 系统的基本实现：[n8n 模板](https://drive.google.com/drive/folders/1Rx4ithkjQbYODt5L6L-OcSTTRT4M1MiR?usp=sharing)

以下是智能体 RAG 系统的视频教程：[Building with Reasoning LLMs | n8n Agentic RAG Demo + Template](https://www.youtube.com/watch?v=rh2JRWsLGfg&ab_channel=ElvisSaravia)

### LLM-as-a-Judge

构建需要自动评估/评判的应用时，LLM-as-a-Judge 是一个选项。LLM-as-a-Judge 利用对大量信息的复杂理解和推理。推理 LLM 非常适合此类用例。以下示例显示了一个评估器-优化器智能体系统，它与一个 LLM-as-a-Judge 智能体（由推理模型驱动）循环，该智能体首先评估预测并生成反馈。反馈被一个元提示词使用，该元提示词接收当前提示词、反馈并尝试优化基础系统提示词。

![llm as a judge](/images/grimoire/llm_as_a_judge.JPG)

### 视觉推理

像 o3 这样的模型可以利用多工具使用能力来执行[高级视觉推理](https://openai.com/index/thinking-with-images/)，并执行诸如推理图像甚至使用可用工具修改图像（例如缩放、裁剪、旋转等）的任务。模型可以在其思维链中对图像进行推理。

**🧩 填字游戏：** [https://chatgpt.com/share/681fcc32-58fc-8000-b2dc-5da7e84cf8bf](https://chatgpt.com/share/681fcc32-58fc-8000-b2dc-5da7e84cf8bf)

### 其他用例

其他用例包括：

- 在技术领域的大型、复杂数据集（例如大量不同文档）中查找关系和回答问题
- 审查、理解和调试大型代码库；在算法开发和科学编码方面也非常出色
- 可能需要高级数学问题解决、实验设计和更深入推理的科学任务
- 文献综述和综合
- 为知识库生成例程以优化 LLM 的逐步指令（例如元提示）
- 数据验证以提高数据集的质量和可靠性
- 多步骤智能体规划（例如深度研究）
- 为问答系统识别和提取相关信息
- 知识密集型和模糊任务

---

## 推理 LLM 使用技巧

### 通用使用模式和提示技巧

- **战略性推理：** 将推理模型用于基于 LLM 的应用中的推理密集型模块或组件，而不是应用的每个部分。应用关注点分离（模块化应用），以便轻松识别应用中哪些地方需要推理。

- **推理时缩放（测试时计算）：** 一般来说，对于大多数推理模型，思考时间（即计算量）越多，性能越好。

- **思考时间：** 您可以使用不同的推理努力选项，例如 `**low**` 以获得更低的成本和更快的响应，或 `**high**` 以获得更长的思考时间和更多 token，这也导致更慢的响应。`**medium**` 是准确性和速度之间的平衡。

- **指令要明确：** 与标准聊天 LLM 一样，为推理模型提供清晰明确的指令，说明您想要实现什么。您不需要提供逐步细节（下文详述），但重要的是给模型必要的高级指令、约束和期望输出，以消除模型可能尝试做的任何假设。

- **避免手动 CoT：** 避免在指令中使用思维链（逐步）提示。指令应简单直接。在适用时在指令中添加响应约束。

- **结构化输入和输出：** 与标准 LLM 类似，使用分隔符来结构化输入是好的实践。您还可以利用结构化输出，特别是在构建复杂智能体应用时。大多数推理模型在遵循使用 JSON 或 XML 结构化输出的指令方面非常有效。我们建议使用 XML 作为结构化生成内容的默认模式，除非有硬性要求以 JSON 输出内容。**Claude 4 等模型的输出格式往往受提示结构的影响（例如，如果使用 Markdown 格式化提示，则倾向于 Markdown 输出）。**

- **少样本提示（Few-shot Prompting）**：如果需要满足模型难以达到的期望输出，添加少样本示例/范例。确保它们与您的高级指令对齐以避免混淆。少样本提示在难以解释期望输出和提供您希望模型避免的行为示例时特别有用。

- **使用描述性和清晰的修饰词来指导模型：** 您可以通过在指令中使用清晰的修饰词和更多细节来引导 o3 和 Claude 4 等模型生成更复杂和更高质量的输出（例如代码和搜索结果）。来自 [Claude 4 文档](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/claude-4-best-practices#enhance-visual-and-frontend-code-generation)的一个生成前端代码的示例是"添加周到的细节，如悬停状态、过渡和微交互"。

### 使用混合推理模型

- **从简单开始：** 首先使用标准模式（思考模式关闭）并评估响应。您也可以尝试使用手动思维链提示。

- **启用原生推理：** 如果您看到错误和浅层响应，但您认为任务可以从更广泛的分析/推理中受益，则启用思考。从低思考努力开始，评估响应质量。

- **增加思考时间：** 如果低思考不够，切换到中等努力。

- **更多思考时间：** 如果中等努力不够，切换到高努力。

- **使用少样本提示：** 如果需要改进输出的风格和格式，请使用示例。

![hybrid reasoning models](/images/grimoire/hybrid_reasoning_models.JPG)

🧑‍💻 代码演示：[reasoning.ipynb](https://drive.google.com/file/d/16t34_Ql4QWORkb6U9ykVbvhCHnMvQUE_/view?usp=sharing)

---

## 推理模型的局限性

以下是使用推理模型时需要注意的常见持续问题

- **输出质量**
  - 推理模型有时可能产生混合语言内容、重复内容、不一致输出、格式问题和低质量输出样式。
  - 其中一些问题可以通过遵循模型的提示最佳实践来缓解。避免模糊和不必要的指令。

- **推理影响指令遵循**
  - 在推理模型上使用显式思维链提示可能会损害模型的指令遵循性能（[参考](https://arxiv.org/abs/2505.11423)）。这意味着您需要更小心地使用 CoT 的方式，并可能完全避免在推理模型上使用它。
  - 这篇[论文](https://arxiv.org/abs/2505.11423)建议以下缓解策略：
    - 使用精心选择的示例进行少样本上下文内学习
    - 自我反思（模型批评和修正自己的答案）
    - 自选择推理（模型决定何时进行推理）
    - 分类器选择推理（外部分类器预测推理是否有帮助）

- **过度思考和思考不足**
  - 如果没有正确提示，推理模型倾向于过度思考或思考不足。
  - 您可以通过对任务、过程和期望输出格式非常具体来改进这一点。
  - 其他开发者通过创建子任务并将复杂任务路由到推理工具（由推理模型驱动）来解决这个问题。

- **成本**
  - 推理模型比标准聊天 LLM 显著更昂贵，因此确保使用调试工具进行实验，并始终评估响应质量。
  - 跟踪因不一致输出而产生的 token 使用量和成本。

- **延迟**
  - 推理模型相对较慢，有时输出与当前任务无关的不必要内容，导致延迟问题。
  - 这些延迟问题可以通过更简洁的提示来避免。在应用方面，您还可以利用流式 token 来改善感知延迟。
  - 较小的推理模型和 Claude 3.7 Sonnet 等其他模型产生更好的延迟。
  - *尝试首先优化准确性，然后优化延迟和成本。*

- **工具调用和智能体能力差**
  - 虽然 o3 等推理模型已经改进了多工具调用，但并行工具调用可能仍然是一个问题。
  - 其他推理模型也显示出较差的工具调用能力（例如 DeepSeek-R1 和 Qwen 系列），除非经过明确训练。
  - 随着先进和更可靠的工具调用，这将解锁可以在现实世界中采取行动的智能体系统。推理 LLM 已经非常有知识，但需要通过**健壮和动态的工具调用能力**以及对物理和数字世界的理解来在**决策制定**方面进行更多改进。多模态推理是一个持续的研究领域。

您也可以在此处找到关于推理 LLM 的最新指南：[Reasoning LLMs Guide](https://docs.google.com/document/d/1AwylUdyciJhvYn-64ltpe79UL7_G-BmNwqs4NNt4oQ0/edit?usp=sharing)

---

## 下一步

如果要继续学习推理 LLM，建议从以下方向延伸：

- 对比不同推理模型在工具调用、长上下文和多模态任务上的行为差异。
- 为智能体工作流建立评估集，记录推理过程、工具调用成功率和最终答案质量。
- 结合 LLM-as-a-Judge、人类复核和可观察性日志，验证推理链是否真正提升了任务结果。



---

## 参考文献

- [Claude 4 prompt engineering best practices](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/claude-4-best-practices)
- [LLM Reasoning | Prompt Engineering Guide](https://www.promptingguide.ai/research/llm-reasoning)
- [Reasoning Models Don't Always Say What They Think](https://arxiv.org/abs/2505.05410)
- [Gemini thinking | Gemini API | Google AI for Developers](https://ai.google.dev/gemini-api/docs/thinking)
- [Introducing OpenAI o3 and o4-mini](https://openai.com/index/introducing-o3-and-o4-mini/)
- [Understanding Reasoning LLMs](https://sebastianraschka.com/blog/2025/understanding-reasoning-llms.html)
- [Thinking with images | OpenAI](https://openai.com/index/thinking-with-images/)
- [DeepSeek R1 Paper](https://github.com/deepseek-ai/DeepSeek-R1/blob/main/DeepSeek_R1.pdf)
- [General Reasoning](https://gr.inc/)
- [Llama-Nemotron: Efficient Reasoning Models](https://arxiv.org/pdf/2505.00949v1)
- [Phi-4-Mini Reasoning](https://arxiv.org/abs/2504.21233)
- [The CoT Encyclopedia](https://arxiv.org/abs/2505.10185)
- [Towards a deeper understanding of Reasoning in LLMs](https://arxiv.org/abs/2505.10543)
- [The Pitfalls of Reasoning for Instruction Following in LLMs](http://arxiv.org/abs/2505.11423)
- [The Illusion of Thinking: Understanding the Strengths and Limitations of Reasoning Models via the Lens of Problem Complexity](https://ml-site.cdn-apple.com/papers/the-illusion-of-thinking.pdf)
