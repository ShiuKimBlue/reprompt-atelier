# Llama 3

Meta 最近推出了其新的大型语言模型（LLM）系列 Llama 3。该版本包含 8B 和 70B 参数的预训练和指令微调模型。

## Llama 3 架构详情

Llama 3 技术详情摘要：

- 标准的仅解码器 Transformer 架构
- 128K token 的词表
- 在 8K token 的序列上训练
- 应用分组查询注意力（GQA）
- 在超过 15T token 上预训练
- 后训练涉及"SFT、拒绝采样、PPO 和 DPO 的组合"

## 性能

指令微调的 Llama 3 8B 超越了 Gemma 7B 和 Mistral 7B Instruct。70B 变体广泛优于 Gemini Pro 1.5 和 Claude 3 Sonnet，尽管在 MATH 基准测试上略逊于 Gemini Pro 1.5。

![llama instruct performance](/images/grimoire/llama-instruct-performance.png)

*来源：Meta AI*

预训练模型在 AGIEval（英语）、MMLU 和 Big-Bench Hard 等基准测试上优于竞争对手。

![llama3 pretrained results](/images/grimoire/llama3-pretrained-results.png)

*来源：Meta AI*

## Llama 3 400B

Meta 报告了发布 400B 参数模型的计划，该模型仍在训练中。多模态支持、多语言能力和更长上下文窗口的工作也在进行中。截至 2024 年 4 月 15 日的检查点在 MMLU 和 Big-Bench Hard 等常见基准测试上产生了结果：

![llama 400b](/images/grimoire/llama-400b.png)

*来源：Meta AI*

Llama 3 模型的许可信息可在模型卡（托管在 GitHub 上的 meta-llama/llama3）中找到。
