# Mixtral 8x22B

Mixtral 8x22B 是 Mistral AI 发布的一个新的开放大型语言模型（LLM）。它是一个"稀疏专家混合模型，拥有 39B 激活参数，总参数为 141B"。

## 能力

该模型被训练为一个"成本高效的模型"，具有以下能力：

- 多语言理解
- 数学推理
- 代码生成
- 原生函数调用支持
- 约束输出支持

它"支持 64K token 的上下文窗口大小，可在大型文档上实现高性能的信息召回"。

Mistral AI 声称该模型"提供了社区模型中最佳的性能成本比之一"，并且"由于其稀疏激活而非常快速"。

![mixtral 8 cost](/images/grimoire/mixtral-8-cost.png)

*来源：Mistral AI Blog*

## 结果

根据官方报告的结果，Mixtral 8x22B（拥有 39B 激活参数）"在推理和知识基准测试中超越了 Command R+ 和 Llama 2 70B 等最先进的开源模型"，包括"MMLU、HellaS、TriQA、NaturalQA 等"。

![mixtral 8 reasoning](/images/grimoire/mixtral-8-reasoning.png)

*来源：Mistral AI Blog*

在 GSM8K、HumanEval 和 Math 等编码和数学任务基准测试上评估时，该模型"超越了所有开源模型"。据报道，"Mixtral 8x22B Instruct 在 GSM8K 上获得了 90% 的分数（maj@8）"。

![mixtral 8 maths](/images/grimoire/mixtral-8-maths.png)

*来源：Mistral AI Blog*

更多信息请参阅：https://docs.mistral.ai/getting-started/open_weight_models/#operation/listModels

"该模型以 Apache 2.0 许可证发布。"
