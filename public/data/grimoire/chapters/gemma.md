# Gemma — 开放语言模型

## 概述

Google DeepMind 发布了 Gemma，一系列受 Gemini 背后相同研究和技术启发的开放语言模型。该版本包含 **2B**（在 2T token 上训练）和 **7B**（在 6T token 上训练）两种模型，提供基础和指令微调检查点。模型在 8192 token 的上下文长度上训练，在多个基准测试上普遍超越 Llama 2 7B 和 Mistral 7B。

## 架构

Gemma 架构在 Transformer 解码器的基础上进行了改进，包括：

- **多查询注意力（Multi-query attention）**（2B 模型使用）
- **多头注意力（Multi-head attention）**（7B 模型使用）
- **旋转位置编码（RoPE embeddings）**
- **GeGLU 激活函数**
- **归一化位置（RMSNorm）**

根据技术报告，Gemma 2B 和 7B 分别在 2T 和 6T token 上训练，主要来自网络文档、数学和代码。与 Gemini 不同，这些模型缺乏明确的多语言或多模态训练。词表包含 256K token，使用 Gemini SentencePoint 分词器的子集，保留空格、分割数字，并对未知 token 依赖字节级编码。

指令微调模型使用监督微调，基于纯文本的合成和人工生成的提示-响应对，以及使用基于标注偏好数据训练的奖励模型进行 RLHF。所有数据集仅包含英语。这些模型使用特定的格式控制 token 来指示对话中的角色和轮次。

![control tokens](/images/grimoire/control-tokens.png)

## 结果

![capabilities](/images/grimoire/capabilities.png)

Gemma 7B 在数学、科学和代码相关任务上展示了强大的性能。分数反映了按能力分组的学术基准评估平均值。

Gemma 7B 在各种基准测试上超越了 Llama 2 7B 和 Mistral 7B，在 HumanEval、GSM8K、MATH 和 AGIEval 上取得了显著进步，在推理、对话、数学和代码方面的性能也有所提升。

![benchmarks](/images/grimoire/benchmarks.png)

Gemma 7B 指令微调模型在人类评估的安全性和指令遵循方面也超越了 Mistral-7B v0.2 Instruct 模型。

![safety](/images/grimoire/safety.png)

Gemma 在多个安全学术基准测试上与 Mistral 进行了比较评估。技术报告提到了去偏技术和红队测试以缓解常见的 LLM 风险。更多关于负责任开发的信息可在模型卡和负责任生成式 AI 工具包中找到。

![safety 2](/images/grimoire/safety-2.png)

## Gemma 7B 提示格式

Gemma 基础模型没有特定的提示格式，但支持 zero-shot/few-shot 提示。Gemma Instruct 模型使用以下格式：

```
<start_of_turn>user
Generate a Python function that multiplies two numbers <end_of_turn>
<start_of_turn>model
```

### 格式控制 token 表

| 上下文 | 相关 token |
|---|---|
| 用户轮次 | `user` |
| 模型轮次 | `model` |
| 对话轮次开始 | `<start_of_turn>` |
| 对话轮次结束 | `<end_of_turn>` |

### 多轮提示示例

```
<start_of_turn>user
What is a good place for travel in the US?<end_of_turn>
<start_of_turn>model
California.<end_of_turn>
<start_of_turn>user
What can I do in California?<end_of_turn>
<start_of_turn>model
```

## 如何提示 Gemma 7B

有效的提示需要正确使用提示模板。以下示例展示了 Gemma 7B Instruct 的各种任务模式。

### Zero-shot 提示

```
<start_of_turn>user
Explain why the sky is blue<end_of_turn>
<start_of_turn>model
```

### 带系统提示的 Zero-shot 提示

虽然没有明确的系统角色，但可以在提示中嵌入额外指令：

```
<start_of_turn>user
Answer the following question in a concise and informative manner:

Explain why the sky is blue<end_of_turn>
<start_of_turn>model
```

短语"Answer the following question in a concise and informative manner:"作为系统级指令来引导模型。

### 角色扮演

角色扮演可以实现个性化响应和更复杂的特定领域 LLM 代理。

**提示：**

```
<start_of_turn>user
You are a helpful 2nd-grade teacher. Help a 2nd grader to answer questions in a short and clear manner.

Explain why the sky is blue<end_of_turn>
<start_of_turn>model
```

**模型响应：**

> Sure, here is an explanation for why the sky is blue:
>
> The sky appears blue because of a phenomenon called Rayleigh Scattering.
>
> Here's the science behind it:
>
> Sunlight is made up of different colors of light, like red, green, blue, and violet.
> When sunlight hits the Earth's atmosphere, the different colors of light scatter in different directions.
> Blue light scatters more easily than other colors because it has shorter wavelengths.
> The scattered blue light travels in all directions, including towards your eyes.
> That's why we see the sky as blue.
> It's important to note that this explanation is simplified and does not account for all scientific details. However, it gives you a good understanding of the basic science behind why the sky appears blue.

响应未检查其准确性或对二年级学生是否合适。可以与下面的思维链响应进行比较。

### 推理

零样本思维链提示可以引出推理能力。

**提示：**

```
<start_of_turn>user
Think and write your step-by-step reasoning before responding.

Explain why the sky is blue.<end_of_turn>
<start_of_turn>model
```

**模型响应（截断）：**

> Step 1: Scattering of Light
>
> The sky appears blue due to the phenomenon of scattering of light. When sunlight hits the Earth's atmosphere, it interacts with the particles of air, primarily nitrogen and oxygen molecules.
>
> Step 2: Rayleigh Scattering
>
> Rayleigh scattering is the specific scattering mechanism that occurs when light interacts with particles much smaller than the wavelength of light. In this process, shorter wavelengths (blue light) are scattered more effectively than longer wavelengths (red light).
>
> Step 3: Blue Scattered Light Travels in All Direction
>
> ...
>
> Conclusion
>
> The sky appears blue due to the scattering of light, specifically Rayleigh scattering. Shorter wavelengths of light are scattered more effectively, and this scattered light travels in all directions, with the scattered light that travels opposite to the sun's rays being most visible to our eyes.

Gemma 模型可以自动输出 markdown 格式。文本为演示目的进行了轻微重新格式化，但内容与原始响应匹配。未评估响应准确性。

## 资源与集成

随 Gemma 一起发布的资源：

- Colab 和 Kaggle 笔记本
- Hugging Face 模型
- MaxText
- NVIDIA NeMo
- TensorRT-LLM
- Gemma 7B 可在 NVIDIA AI Playground 中使用

使用条款允许所有规模的组织负责任地商业使用和分发。

## 参考资料

- [Gemma: Introducing new state-of-the-art open models](https://blog.google/technology/developers/gemma/)
- [Gemma: Open Models Based on Gemini Research and Technology（技术报告）](https://arxiv.org/abs/2403.08295)
- [负责任生成式 AI 工具包](https://github.com/GoogleCloudPlatform/generative-ai/tree/main/responsible-ai)
- [Fast Transformer Decoding: One Write-Head is All You Need（多查询注意力）](https://arxiv.org/abs/1911.02150)
- [Roformer: Enhanced transformer with rotary position embedding](https://arxiv.org/abs/2104.09864)
- [GLU variants improve transformer](https://arxiv.org/abs/2002.05202)
- [Root mean square layer normalization](https://arxiv.org/abs/1910.07467)
