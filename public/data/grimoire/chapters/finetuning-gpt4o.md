# 使用 GPT-4o 模型进行微调

OpenAI 最近[宣布](https://openai.com/index/gpt-4o-fine-tuning/)其最新模型 GPT-4o 和 GPT-4o mini 支持微调。这一新功能使开发者能够为特定用例定制 GPT-4o 模型，提升性能并定制输出。

## 微调详情和成本

开发者现在可以通过[微调控制面板](https://platform.openai.com/finetune)访问 `GPT-4o-2024-08-06` 检查点进行微调。此过程允许自定义响应结构、语气以及对复杂领域特定指令的遵循。

GPT-4o 微调的成本为：
- **训练**：每百万 tokens 25 美元
- **推理输入**：每百万 tokens 3.75 美元
- **推理输出**：每百万 tokens 15 美元

此功能仅对付费使用层级的开发者开放。

## 免费训练 Tokens

为了鼓励探索这一新功能，OpenAI 提供限时优惠。开发者每天可获得：

- **GPT-4o**：100 万个免费训练 tokens
- **GPT-4o mini**：200 万个免费训练 tokens

这为实验和发现微调模型的创新应用提供了良好的机会。

## 用例：情感分类

一个实用的微调示例是训练模型进行情感分类。使用 [JSONL 格式数据集](https://github.com/dair-ai/datasets/tree/main/openai)（包含标记了相应情感的文本样本），可以微调 GPT-4o mini 来根据情感基调对文本进行分类。

此演示展示了微调在提升模型特定任务性能方面的潜力，与标准模型相比在准确性上有显著提升。

## 访问和评估微调模型

微调过程完成后，开发者可以通过 OpenAI Playground 访问和评估自定义模型。Playground 允许使用各种输入进行交互式测试，并提供对模型性能的洞察。对于更全面的评估，开发者可以通过 OpenAI API 将微调模型集成到应用程序中，并进行系统性测试。

OpenAI 为 GPT-4o 模型引入微调功能，为寻求利用 LLM 力量完成专业任务的开发者开辟了新的可能性。

## 相关资源

- [OpenAI 微调公告](https://openai.com/index/gpt-4o-fine-tuning/)
- [微调控制面板](https://platform.openai.com/finetune)
- [JSONL 格式数据集](https://github.com/dair-ai/datasets/tree/main/openai)
