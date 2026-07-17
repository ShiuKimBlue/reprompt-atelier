# Phi-2

## Phi-2 简介

Phi-2 是 Microsoft Research 发布的最新小型语言模型（SLM），继之前的 Phi-1 和 Phi-1.5 模型之后。

Phi-1 是一个 13 亿参数的模型，在来自网络的"教科书质量"数据（6B token）和使用 GPT-3.5 合成生成的教科书与练习（1B token）（Gunasekar et al. 2023）上训练。它在 Python 代码生成任务上表现出色。

Phi-1.5 在前一个模型的基础上构建，专注于常识推理和语言理解。它处理复杂推理任务，如小学数学和基本编码，与大 5 倍的模型相当。

Phi-2 是一个 27 亿参数的模型，改进了推理和语言理解。它超越了大 25 倍的模型，并具有 MIT 许可证，可用于商业用途。

## Phi-2 洞察与评估

LLM 研究人员探索小型语言模型是否与大型模型共享涌现能力，以及训练技术是否能实现这一点。

该模型在"教科书质量"数据上训练——1.4 万亿 token 并多次遍历——包括用于常识推理和通用知识的合成数据集。数据通过教育和高质量网络内容进行增强。Phi-2 在 96 个 A100 GPU 上训练了 14 天。未应用 RLHF 或指令微调。

Phi-1.5 的知识迁移到 Phi-2，有助于收敛和跨基准测试的性能。任务使用 0-shot 评估，除了 BBH（3-shot CoT）和 MMLU（5-shot）。

![phi 2 benchmark](/images/grimoire/phi-2-benchmark.png)

尽管没有使用特殊的对齐技术，Phi-2 在毒性和偏见方面比对齐的开源 Llama2-7b 更安全。作者将此归功于数据整理工作。

![phi 2 safety](/images/grimoire/phi-2-safety.png)

Phi-2 在各种基准测试上超越了 Mistral 7B 和 Llama 2（13B）。它甚至在多步推理上超越了 Llama-2-70B，并超越了 Google 的 Gemini Nano 2。

![phi 2 performance](/images/grimoire/phi-2-performance.png)

### 物理问题求解

以下示例展示了 Phi-2 解决物理文字问题的能力：

![phi 2 physics](/images/grimoire/phi-2-physics.png)

### 错误识别

以下示例展示了 Phi-2 识别学生物理文字问题计算中错误的能力：

![phi 2 correcting](/images/grimoire/phi-2-correcting.png)

## Phi-2 用法

根据模型页面，Phi-2 可以使用 QA 格式、聊天格式和代码格式进行提示。

### QA 格式

QA 格式适用于你向模型提问并想要简洁答案的场景。

模板：

```
Instruct: {{prompt}}
Output:
```

**提示：**

```
Instruct: What is the difference between data and information?
Output:
```

**输出：**

> Great question! Data refers to raw facts, statistics, or numbers that have not been analyzed or processed into any meaningful context. On the other hand, information is data that has been organized, analyzed, and interpreted in a way that it can be used by humans to make informed decisions or take actions. In other words, data is raw material, while information is processed and useful knowledge.

### 聊天格式

聊天格式是标准格式，如下所示：

**提示：**

```
Human: Hello, who are you?
AI: Greetings! I am an AI research assistant. How can I help you today?
Human: Can you tell me about the creation of black holes?
AI:
```

**输出：**

> Black holes form when a massive star runs out of fuel and collapses under its own gravitational pull. The resulting object is so dense that it distorts space-time around it, causing anything that comes too close to be pulled in by the immense gravity. This includes light, which cannot...

### 代码格式

提供函数名称的代码生成提示模板：

**提示：**

```
def multiply(a,b):\n
```

该模型在有限的 Python 代码示例和库上训练，因此在代码生成能力和语言支持方面相当有限。

## Phi-2 局限性

根据作者报告：

- 可能生成不准确的代码和陈述
- 未经指令微调，可能难以遵循指令
- 仅在标准英语上训练；可能难以理解俚语，无法理解其他语言的指令
- 可能产生社会偏见和有毒内容
- 未经微调，倾向于生成冗长的响应，有时产生不相关的额外文本——可能由于基于教科书的训练数据

*图片来源：Microsoft Research*

## 参考资料

- [Textbooks Are All You Need](https://arxiv.org/abs/2306.11644)
- [Phi-1.5](https://arxiv.org/abs/2309.05463)
