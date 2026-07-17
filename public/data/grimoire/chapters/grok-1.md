# Grok-1

Grok-1 是 xAI 开发的一个专家混合（MoE）大型语言模型（LLM），拥有 314B 参数，并开源了基础模型权重和网络架构。

该模型由 xAI 训练，由 MoE 模型组成，在推理时为给定 token 激活 25% 的权重。其预训练截止日期为 2023 年 10 月。

根据官方公告，Grok-1 是"来自预训练阶段的原始基础模型检查点"，这意味着它尚未针对特定应用（如对话代理）进行微调。

该模型以 Apache 2.0 许可证通过 GitHub 发布：https://github.com/xai-org/grok-1

## 结果与能力

根据初始公告，Grok-1 在推理和编码任务上展示了强大的能力。其公开可用的结果包括：

- **HumanEval 编码任务：** 63.2%
- **MMLU：** 73%

该模型通常优于 ChatGPT-3.5 和 Inflection-1，但仍落后于 GPT-4 等改进模型。

![grok reasoning](/images/grimoire/grok-reasoning.png)

*Grok-1 基准测试结果（推理）*

在匈牙利全国高中数学期末考试中，Grok-1 获得了 C（59%），而 GPT-4 获得了 B（68%）。

![grok math](/images/grimoire/grok-math.png)

*Grok-1 基准测试结果（数学）*

## 附加说明

由于模型规模较大（314B 参数），xAI 建议使用多 GPU 机器来测试模型。

## 参考资料

1. [Open Release of Grok-1](https://x.ai/blog/grok-os)
2. [Announcing Grok](https://x.ai/blog/grok)
