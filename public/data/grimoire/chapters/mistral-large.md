# Mistral Large

Mistral AI 发布了 Mistral，这是他们最先进的大型语言模型（LLM），具有强大的多语言、推理、数学和代码生成能力。Mistral Large 通过 Mistral 平台 la Plataforme 和 Microsoft Azure 提供。也可以在他们的新聊天应用 [le Chat](https://chat.mistral.ai/) 中测试。

下图展示了 Mistral Large 与 GPT-4 和 Gemini Pro 等其他强大 LLM 的比较。它在 MMLU 基准测试中排名第二，仅次于 GPT-4，得分为 81.2%。

![ml performance](/images/grimoire/ml-performance.png)

## Mistral Large 能力

Mistral Large 的能力和优势包括：

- 32K token 上下文窗口
- 具有原生多语言能力（精通英语、法语、西班牙语、德语和意大利语）
- 在推理、知识、数学和编码基准测试中具有强大能力
- 原生支持函数调用和 JSON 格式
- 还发布了名为 Mistral Small 的低延迟模型
- 允许开发人员通过精确的指令遵循设计审核策略

### 推理与知识

下表展示了 Mistral Large 在常见推理和知识基准测试上的表现。它在很大程度上落后于 GPT-4，但与 Claude 2 和 Gemini Pro 1.0 等其他 LLM 相比是更优的模型。

![performance 3](/images/grimoire/performance-3.png)

### 数学与代码生成

下表展示了 Mistral Large 在常见数学和编码基准测试上的表现。Mistral Large 在 Math 和 GSM8K 基准测试上展示了强大的性能，但在编码基准测试上被 Gemini Pro 和 GPT-4 等模型显著超越。

![performance 1](/images/grimoire/performance-1.png)

### 多语言能力

下表展示了 Mistral Large 在多语言推理基准测试上的表现。Mistral Large 在所有语言（包括法语、德语、西班牙语和意大利语）上超越了 Mixtral 8x7B 和 Llama 2 70B。

![performance 2](/images/grimoire/performance-2.png)

## Mistral Small

除了 Mistral Large 的发布外，还宣布了一个名为 Mistral Small 的更小且优化的模型。Mistral Small 针对低延迟工作负载进行了优化，超越了 Mixtral 8x7B。Mistral AI 报告该模型在 RAG 启用、函数调用和 JSON 格式方面具有强大的能力。

## Mistral 端点与模型选择

[这里](https://docs.mistral.ai/platform/endpoints/) 是 Mistral AI 提供的所有端点列表。

Mistral AI 还发布了一个全面的[指南](https://docs.mistral.ai/guides/model-selection/)，帮助在考虑性能和成本权衡时更好地选择模型。

*图片来源：[https://mistral.ai/news/mistral-large/](https://mistral.ai/news/mistral-large/)*
