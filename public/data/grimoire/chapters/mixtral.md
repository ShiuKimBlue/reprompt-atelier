# Mixtral


本节介绍 Mixtral 8x7B 模型，包括提示技巧和使用示例。

## Mixtral 简介（专家混合模型）

Mixtral 8x7B 是由 [Mistral AI](https://mistral.ai/news/mixtral-of-experts/) 发布的稀疏专家混合（Sparse Mixture of Experts，SMoE）语言模型。Mixtral 的架构与 [Mistral 7B](https://www.promptingguide.ai/models/mistral-7b) 类似，主要区别在于 Mixtral 8x7B 的每一层由 8 个前馈块（即专家）组成。Mixtral 是一个仅解码器模型，对于每个 token，在每一层中，路由器网络选择两个专家来处理该 token 并将其输出相加组合。

作为 SMoE 模型，Mixtral 总共有 47B 参数，但在推理时每个 token 仅使用 13B 参数。这种方法的优势在于更好地控制成本和延迟。Mixtral 使用开放 Web 数据训练，上下文大小为 32K tokens。据报道，Mixtral 在多个基准测试中超越 Llama 2 80B（推理速度快 6 倍），并匹配或超越 GPT-3.5。

Mixtral 模型采用 [Apache 2.0 许可证](https://github.com/mistralai/mistral-src#Apache-2.0-1-ov-file)。

## Mixtral 的性能与能力

Mixtral 在数学推理、代码生成和多语言任务方面表现出色。它支持英语、法语、意大利语、德语和西班牙语。Mistral AI 还发布了 Mixtral 8x7B Instruct 模型，在人类基准测试中超越 GPT-3.5 Turbo、Claude-2.1、Gemini Pro 和 Llama 2 70B。

Mixtral 在 MMLU 和 GSM8K 等基准测试中也表现出色，同时在推理时使用的活跃参数减少了 5 倍。

Mixtral 在偏见基准测试（BBQ）上表现出较低的偏见（56.0% vs 51.5%）。

## Mixtral 的长上下文信息检索

Mixtral 在从 32K tokens 上下文窗口中检索信息方面表现出色，无论信息位置和序列长度如何。在 passkey 检索任务中，Mixtral 达到了 100% 的检索准确率。

## Mixtral 8x7B Instruct

Mixtral 8x7B Instruct 模型使用监督微调（SFT）和直接偏好优化（DPO）进行训练。在 Chatbot Arena 排行榜上排名第 8 位。

## Mixtral 8x7B 提示工程指南

推荐使用以下聊天模板：

```
<s>[INST] 指令 [/INST] 模型回答</s>[INST] 后续指令 [/INST]
```

### 基本提示

*提示：*
```
[INST] You are a helpful code assistant. Your task is to generate a valid JSON object based on the given information:

name: John
lastname: Smith
address: #1 Samuel St.

Just generate the JSON object without explanations:
[/INST]
```

*输出：*
```json
{
  "name": "John",
  "lastname": "Smith",
  "address": "#1 Samuel St."
}
```

### 少样本提示

使用官方 Python 客户端，可以通过不同角色（`system`、`user`、`assistant`）进行少样本提示：

```python
from mistralai.client import MistralClient
from mistralai.models.chat_completion import ChatMessage

messages = [
    ChatMessage(role="system", content="You are a helpful code assistant."),
    ChatMessage(role="user", content="name: Ted\nlastname: Pot\naddress: #1 Bisson St.")
]

chat_response = client.chat(model="mistral-small", messages=messages)
print(chat_response.choices[0].message.content)
```

### 代码生成

```python
messages = [
    ChatMessage(role="system", content="You are a helpful code assistant. Please only produce the function."),
    ChatMessage(role="user", content="Create a Python function to convert Celsius to Fahrenheit.")
]

chat_response = client.chat(model="mistral-small", messages=messages)
print(chat_response.choices[0].message.content)
```

*输出：*
```python
def celsius_to_fahrenheit(celsius):
    return (celsius * 9/5) + 32
```

### 使用系统提示强制安全护栏

可以通过 `safe_prompt` 参数启用安全模式：

```python
chat_response = client.chat(
    model="mistral-small",
    messages=messages,
    safe_mode=True
)
```

启用安全模式后，系统会自动添加以下提示：
```
Always assist with care, respect, and truth. Respond with utmost utility yet securely. Avoid harmful, unethical, prejudiced, or negative content. Ensure replies promote fairness and positivity.
```

**相关 Notebook：** [Prompt Engineering with Mixtral](https://github.com/dair-ai/Prompt-Engineering-Guide/blob/main/notebooks/pe-mixtral-introduction.ipynb)
