# 大语言模型（LLM）的标记化处理

Andrej Karpathy 最近发布了一个关于如何对大型语言模型进行标记化处理的[讲座视频](https://youtu.be/zduSFxRajkE)。标记化是训练这类模型的核心环节，涉及使用专属数据集和算法（如[字节对编码](https://en.wikipedia.org/wiki/Byte_pair_encoding)）来训练标记器。

Karpathy 在讲座中演示了如何从零构建 GPT 标记器，并探讨了与标记化相关的异常行为。

## 标记化导致的常见问题

以下是视频中提及的内容列表：

- 为什么大语言模型不能正确拼写单词？这是因为标记化
- 为什么它不能执行像字符串反转这样的简单任务？同样因为标记化
- 为什么在处理日语等非英语语言时表现不佳？标记化的问题
- 为什么它在简单算术方面表现糟糕？也是标记化导致的
- GPT-2 为什么在用 Python 编码时遇到更多问题？依旧是标记化的问题
- 当模型遇到 "\<endoftext\>" 这个字符串时为什么会突然停止？还是标记化的问题
- 那些关于 "trailing whitespace" 的警告是什么意思？也是标记化引起的
- 为什么询问 "SolidGoldMagikarp" 时模型会出错？同样是标记化的问题
- 为什么在使用大语言模型时更倾向于使用 YAML 而不是 JSON？这也是标记化的问题
- 为什么大语言模型并不是真正的端到端语言模型？原因在于标记化
- 什么才是痛苦真正的根源？讲座中以幽默方式指出——也是标记化

## 实践建议

为了提升大语言模型的可靠性，理解如何有效提示模型至关重要，这包括认识它们的局限性。虽然在推理时对标记器的关注不多（除了设置 `max_tokens` 参数），但要进行有效的提示工程，就需要理解标记化过程中的内在限制。例如，提示未能达到预期效果，可能是因为模型未能正确处理某个缩写词或概念的标记化，这是许多开发者和研究者容易忽视的问题。

## 工具

[Tiktokenizer](https://tiktokenizer.vercel.app/) 是一个实用的标记化工具，Karpathy 在讲座中用它来演示。

## 参考资料

- [Karpathy 标记化讲座](https://youtu.be/zduSFxRajkE)
- [字节对编码 Wikipedia](https://en.wikipedia.org/wiki/Byte_pair_encoding)
- [Tiktokenizer 工具](https://tiktokenizer.vercel.app/)
