# OLMo

## OLMo 简介

Allen Institute of AI 发布了一个新的开放语言模型和框架 OLMo。该工作旨在"提供对数据、训练代码、模型、评估代码的完全访问，以加速语言模型的集体研究"。

他们的首批发布包括四个 7B 参数规模的变体和一个 1B 规模的模型，"所有模型至少在 2T token 上训练"。这是众多发布中的第一个，包括即将到来的 65B OLMo 模型。

![olmo models](/images/grimoire/olmo-models.png)

发布内容包括：

- 完整训练数据，包括生成数据的[代码](https://github.com/allenai/dolma)
- 完整模型权重、训练代码（[GitHub](https://github.com/allenai/OLMo)）、日志、指标和推理代码
- 每个模型的多个检查点
- [评估代码](https://github.com/allenai/OLMo-Eval)
- 微调代码

所有代码、权重和中间检查点以 [Apache 2.0 许可证](https://github.com/allenai/OLMo#Apache-2.0-1-ov-file)发布。

## OLMo-7B

OLMo-7B 和 OLMo-1B 都使用仅解码器的 Transformer 架构。设计遵循了 PaLM 和 Llama 等模型的改进：

- 无偏置
- 非参数化层归一化
- SwiGLU 激活函数
- 旋转位置编码（RoPE）
- 50,280 的词表

## Dolma 数据集

发布还包括预训练数据集 [Dolma](https://github.com/allenai/dolma)——"一个多样化的多源语料库，包含 3 万亿 token，来自 50 亿文档，涵盖 7 个不同数据源"。创建过程包括语言过滤、质量过滤、内容过滤、去重、多源混合和分词。

![dolma dataset](/images/grimoire/dolma-dataset.png)

训练数据集包括 Dolma 的 2T token 样本。token 在每个文档末尾附加特殊 `EOS` token 后进行拼接。"训练实例包括连续的 2048 token 块组，这些块也被打乱。"

更多训练细节和硬件规格见论文。

## 结果

模型使用 [Catwalk](https://github.com/allenai/catwalk) 在下游任务上进行评估。OLMo 模型与 Falcon 和 Llama 2 等公开可用模型进行了比较。评估侧重于常识推理能力，使用 `piqa` 和 `hellaswag` 等数据集。Zero-shot 评估使用排名分类（按可能性对补全进行排名），报告准确率。OLMo-7B 在 2 个最终任务上超越了所有其他模型，在 8/9 个最终任务中保持前三。

![olmo results](/images/grimoire/olmo-results.png)

*图片来源：[OLMo: Accelerating the Science of Language Models](https://allenai.org/olmo/olmo-paper.pdf)*

## 参考资料

- [OLMo: Open Language Model](https://blog.allenai.org/olmo-open-language-model-87ccfc95f580)
- [OLMo: Accelerating the Science of Language Models](https://allenai.org/olmo/olmo-paper.pdf)
